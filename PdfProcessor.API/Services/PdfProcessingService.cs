using PdfProcessor.API.Services.LLMIntegration;
using PdfProcessor.API.Services.LLMIntegration.Models;
using System.Collections.Concurrent;
using System.Runtime.CompilerServices;

namespace PdfProcessor.API.Services;

public record ProcessedFile(string FilePath, DateTime ProcessedTime = default, FinancialData? FinancialData = null);

public record ProcessingResult
{
    public required string FileName { get; init; }
    public bool Success { get; init; }
    public string? Error { get; init; }
    public ProcessedFile? ProcessedFile { get; init; }
}

public interface IPdfProcessingService
{
    Task<IReadOnlyList<ProcessingResult>> ProcessPdfFilesAsync(IFormFileCollection files, CancellationToken cancellationToken = default);
    Task ProcessPdfFileAsync(IFormFile file, CancellationToken cancellationToken = default);
    IAsyncEnumerable<ProcessedFile> GetAllProcessedFilesAsync(CancellationToken cancellationToken = default);
}

public class PdfProcessingService : IPdfProcessingService, IAsyncDisposable
{
    private readonly ConcurrentDictionary<string, ProcessedFile> _processedFiles = new();
    private readonly TimeSpan _fileExpirationTime = TimeSpan.FromHours(6);
    private readonly Timer _cleanupTimer;
    private readonly ILogger<PdfProcessingService> _logger;
    private readonly IGeminiService _geminiService;
    private readonly TimeProvider _timeProvider;
    private const int MaxConcurrentProcessing = 4; // Limit concurrent processing

    public PdfProcessingService(
        ILogger<PdfProcessingService> logger, 
        IGeminiService geminiService,
        TimeProvider? timeProvider = null)
    {
        _logger = logger;
        _geminiService = geminiService;
        _timeProvider = timeProvider ?? TimeProvider.System;
        
        // Create a timer that runs every hour to clean up expired files
        _cleanupTimer = new Timer(CleanupExpiredFiles, null, TimeSpan.Zero, TimeSpan.FromHours(1));
    }

    private void CleanupExpiredFiles(object? state)
    {
        try
        {
            DateTime now = _timeProvider.GetUtcNow().UtcDateTime;
            var expiredFiles = _processedFiles
                .Where(f => (now - f.Value.ProcessedTime) > _fileExpirationTime)
                .ToList();

            foreach (var file in expiredFiles)
            {
                try
                {
                    if (File.Exists(file.Value.FilePath))
                    {
                        File.Delete(file.Value.FilePath);
                        _logger.LogInformation("Deleted expired file: {FilePath}", file.Value.FilePath);
                    }
                    _processedFiles.TryRemove(file.Key, out _);
                }
                catch (Exception ex)
                {
                    _logger.LogError(ex, "Error deleting expired file: {FilePath}", file.Value.FilePath);
                }
            }
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error during cleanup of expired files");
        }
    }

    public async Task<IReadOnlyList<ProcessingResult>> ProcessPdfFilesAsync(IFormFileCollection files, CancellationToken cancellationToken = default)
    {
        ArgumentNullException.ThrowIfNull(files);
        if (files.Count == 0)
            throw new ArgumentException("No files were provided", nameof(files));

        var results = new ConcurrentBag<ProcessingResult>();
        var semaphore = new SemaphoreSlim(MaxConcurrentProcessing);

        var processingTasks = files
            .Where(file => file.ContentType.Equals("application/pdf", StringComparison.OrdinalIgnoreCase))
            .Select(async file =>
            {
                try
                {
                    await semaphore.WaitAsync(cancellationToken);
                    try
                    {
                        await ProcessPdfFileAsync(file, cancellationToken);
                        var result = new ProcessingResult
                        {
                            FileName = file.FileName,
                            Success = true,
                            ProcessedFile = _processedFiles.GetValueOrDefault(Path.Combine(Path.GetTempPath(), file.FileName))
                        };
                        results.Add(result);
                        return result;
                    }
                    finally
                    {
                        semaphore.Release();
                    }
                }
                catch (Exception ex)
                {
                    _logger.LogError(ex, "Error processing file: {FileName}", file.FileName);
                    var result = new ProcessingResult
                    {
                        FileName = file.FileName,
                        Success = false,
                        Error = ex.Message
                    };
                    results.Add(result);
                    return result;
                }
            });

        await Task.WhenAll(processingTasks);
        return results.ToList();
    }

    public async Task ProcessPdfFileAsync(IFormFile file, CancellationToken cancellationToken = default)
    {
        ArgumentNullException.ThrowIfNull(file);
        
        if (!file.ContentType.Equals("application/pdf", StringComparison.OrdinalIgnoreCase))
        {
            _logger.LogWarning("Invalid file type received: {ContentType}", file.ContentType);
            return;
        }

        string fileName = $"{Guid.NewGuid()}_{file.FileName}";
        string tempPath = Path.Combine(Path.GetTempPath(), fileName);
        FileStream? writeStream = null;
        FileStream? readStream = null;
        MemoryStream? memoryStream = null;

        try
        {
            // Write the file with exclusive access
            writeStream = new FileStream(tempPath, FileMode.Create, FileAccess.Write, FileShare.None, 4096, FileOptions.Asynchronous);
            await file.CopyToAsync(writeStream, cancellationToken);
            await writeStream.FlushAsync(cancellationToken);
            writeStream.Close();
            writeStream.Dispose();
            writeStream = null;

            // Small delay to ensure file system has released the file
            await Task.Delay(100, cancellationToken);

            // Read the file with read-only access
            readStream = new FileStream(tempPath, FileMode.Open, FileAccess.Read, FileShare.Read, 4096, FileOptions.Asynchronous);
            memoryStream = new MemoryStream();
            await readStream.CopyToAsync(memoryStream, cancellationToken);
            await memoryStream.FlushAsync(cancellationToken);
            readStream.Close();
            readStream.Dispose();
            readStream = null;

            byte[] pdfBytes = memoryStream.ToArray();
            memoryStream.Close();
            memoryStream.Dispose();
            memoryStream = null;

            FinancialData financialData = await _geminiService.GetFinancialData(pdfBytes);

            _logger.LogInformation("Processed file: {FileName}", file.FileName);

            _processedFiles.TryAdd(
                tempPath, 
                new ProcessedFile(tempPath, _timeProvider.GetUtcNow().UtcDateTime, financialData));
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error processing file: {FileName}", file.FileName);
            if (File.Exists(tempPath))
            {
                try
                {
                    // Ensure all streams are closed before attempting to delete
                    writeStream?.Close();
                    writeStream?.Dispose();
                    readStream?.Close();
                    readStream?.Dispose();
                    memoryStream?.Close();
                    memoryStream?.Dispose();

                    // Add a small delay before deletion
                    await Task.Delay(100, cancellationToken);
                    File.Delete(tempPath);
                }
                catch (IOException deleteEx)
                {
                    _logger.LogWarning(deleteEx, "Failed to delete temporary file: {TempPath}", tempPath);
                }
            }
            throw;
        }
        finally
        {
            // Ensure all streams are properly disposed
            writeStream?.Dispose();
            readStream?.Dispose();
            memoryStream?.Dispose();
        }
    }

    public async ValueTask DisposeAsync()
    {
        _cleanupTimer?.Dispose();
        
        // Clean up any remaining files
        CleanupExpiredFiles(null);
        
        // Delete all remaining files regardless of expiration
        foreach (var file in _processedFiles.Values)
        {
            try
            {
                if (File.Exists(file.FilePath))
                {
                    await Task.Run(() => File.Delete(file.FilePath));
                }
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error deleting file during disposal: {FilePath}", file.FilePath);
            }
        }
        
        _processedFiles.Clear();
    }

    public async IAsyncEnumerable<ProcessedFile> GetAllProcessedFilesAsync(
        [EnumeratorCancellation] CancellationToken cancellationToken = default)
    {
        foreach (var file in _processedFiles.Values)
        {
            cancellationToken.ThrowIfCancellationRequested();
            await Task.Delay(1, cancellationToken); // Small delay to make it truly async
            yield return file;
        }
    }
} 