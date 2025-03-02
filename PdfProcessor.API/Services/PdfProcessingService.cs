namespace PdfProcessor.API.Services;

public record ProcessedFile(string FilePath, DateTime ProcessedTime = default);

public interface IPdfProcessingService
{
    Task ProcessPdfFilesAsync(IFormFileCollection files);
    Task ProcessPdfFileAsync(IFormFile file);
    List<ProcessedFile> GetAllProcessedFiles();
}

public class PdfProcessingService : IPdfProcessingService, IDisposable
{
    // List to store processed files with expiration time
    private readonly List<ProcessedFile> _processedFiles = [];
    private readonly Lock _processedFilesLock = new();
    private readonly TimeSpan _fileExpirationTime = TimeSpan.FromHours(6);
    private readonly Timer _cleanupTimer;

    private readonly ILogger<PdfProcessingService> _logger;

    public PdfProcessingService(ILogger<PdfProcessingService> logger)
    {
        _logger = logger;
        // Create a timer that runs every hour to clean up expired files
        _cleanupTimer = new Timer(CleanupExpiredFiles, null, TimeSpan.Zero, TimeSpan.FromHours(1));
    }

    private void CleanupExpiredFiles(object? state)
    {
        try
        {
            var now = DateTime.UtcNow;
            lock (_processedFilesLock)
            {
                var expiredFiles = _processedFiles
                    .Where(f => (now - f.ProcessedTime) > _fileExpirationTime)
                    .ToList();

                foreach (var file in expiredFiles)
                {
                    try
                    {
                        if (File.Exists(file.FilePath))
                        {
                            File.Delete(file.FilePath);
                            _logger.LogInformation("Deleted expired file: {FilePath}", file.FilePath);
                        }
                        _processedFiles.Remove(file);
                    }
                    catch (Exception ex)
                    {
                        _logger.LogError(ex, "Error deleting expired file: {FilePath}", file.FilePath);
                    }
                }
            }
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error during cleanup of expired files");
        }
    }

    public async Task ProcessPdfFilesAsync(IFormFileCollection files)
    {
        if (files == null || files.Count == 0)
            throw new ArgumentException("No files were provided", nameof(files));

        var processingTasks = new List<Task>();

        foreach (var file in files)
        {
            if (!file.ContentType.Equals("application/pdf", StringComparison.OrdinalIgnoreCase))
            {
                _logger.LogWarning("Invalid file type received: {ContentType}", file.ContentType);
                continue;
            }

            processingTasks.Add(ProcessPdfFileAsync(file));
        }

        await Task.WhenAll(processingTasks);
    }

    public async Task ProcessPdfFileAsync(IFormFile file)
    {
        // Create a unique filename
        var fileName = $"{Guid.NewGuid()}.pdf";
        var tempPath = Path.Combine(Path.GetTempPath(), fileName);

        try
        {
            // Save the file to temp storage
            await using (var stream = new FileStream(tempPath, FileMode.Create))
            {
                await file.CopyToAsync(stream);
            }

            // TODO: Implement actual PDF processing logic here
            // This is where you would add your PDF processing implementation
            _logger.LogInformation("Processing file: {FileName}", file.FileName);
            await Task.Delay(1000); // Simulate processing time

            // Add the file to the processed files list
            lock (_processedFilesLock)
            {
                _processedFiles.Add(new ProcessedFile(tempPath, DateTime.UtcNow));
            }
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error processing file: {FileName}", file.FileName);
            if (File.Exists(tempPath))
            {
                File.Delete(tempPath);
            }
            throw;
        }
    }

    public void Dispose()
    {
        _cleanupTimer?.Dispose();
        
        // Clean up any remaining files
        CleanupExpiredFiles(null);
        
        // Delete all remaining files regardless of expiration
        lock (_processedFilesLock)
        {
            foreach (var file in _processedFiles)
            {
                try
                {
                    if (File.Exists(file.FilePath))
                    {
                        File.Delete(file.FilePath);
                    }
                }
                catch (Exception ex)
                {
                    _logger.LogError(ex, "Error deleting file during disposal: {FilePath}", file.FilePath);
                }
            }
            _processedFiles.Clear();
        }
    }

    public List<ProcessedFile> GetAllProcessedFiles()
    {
        lock (_processedFilesLock)
        {
            return [.. _processedFiles];
        }
    }

} 