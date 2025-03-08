using PdfProcessor.API.Services.LLMIntegration.Models;
using GoogleGeminiSDK;

namespace PdfProcessor.API.Services.LLMIntegration;

public interface IGeminiService
{
    Task<FinancialData> GetFinancialData(byte[] pdfBytes);
    List<FinancialData> GetProcessedFinancialReports();
}

public class GeminiService : IGeminiService
{
    private const string ApiKey = "AIzaSyAawBOHVjr5Eo-KF__fXwuiJThgEvmOZcs";
    private const string ModelId = "gemini-2.0-flash-lite";
    private readonly List<FinancialData> _processedFiles = [];
    private readonly ILogger<GeminiService> _logger;

    public GeminiService(ILogger<GeminiService> logger)
    {
        _logger = logger;
    }

    public async Task<FinancialData> GetFinancialData(byte[] pdfBytes)
    {
        if (pdfBytes == null || pdfBytes.Length == 0)
        {
            throw new Exception("PDF bytes are null or empty.");
        }

        string path = Path.Combine(Directory.GetCurrentDirectory(), "Services", "LLMIntegration", "SystemInstructions.txt");
        string systemInstructions = await File.ReadAllTextAsync(path);
        Console.WriteLine(systemInstructions);
        if (string.IsNullOrWhiteSpace(systemInstructions))
        {
            throw new Exception("System instructions not found.");
        }

        GeminiSettings settings = new()
        {
            Temperature = 0.0f,
            SystemInstructions = systemInstructions,
            TopP = 0.95f,
            TopK = 40,
            MaxOutputTokenCount = 8192
        };

        _logger.LogInformation("Creating new GeminiChat instance for request");
        var geminiChat = new GeminiChat(ApiKey, ModelId);
        
        try 
        {
            _logger.LogInformation("Sending request to Gemini API");
            Microsoft.Extensions.AI.ChatMessage response = await geminiChat.SendMessage(
                "Please analyze this PDF and extract the financial data in JSON format.", 
                [pdfBytes], 
                settings: settings);
            
            _logger.LogInformation("Received response from Gemini API");

            if (string.IsNullOrWhiteSpace(response?.Text)) 
            {
                _logger.LogWarning("Empty response received from Gemini API");
                return new();
            }

            FinancialData financialData = FinancialData.FromJson(response.Text);
            _processedFiles.Add(financialData);
            _logger.LogInformation("Successfully processed financial data");

            return financialData;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error processing PDF with Gemini API");
            throw;
        }
    }

    public List<FinancialData> GetProcessedFinancialReports() => _processedFiles;
}
