using PdfProcessor.API.Services;
using PdfProcessor.API.Constants;

namespace PdfProcessor.API.Endpoints;

public static class PdfEndpoints
{
    public static void MapPdfEndpoints(this IEndpointRouteBuilder app)
    {
        RouteGroupBuilder pdfGroup = app.MapGroup("/api/pdf");

        pdfGroup.MapPost("/process", async (
            IFormFileCollection files,
            IPdfProcessingService pdfProcessingService,
            CancellationToken cancellationToken) =>
        {
            try
            {
                if (files == null || files.Count == 0)
                    return Results.BadRequest("No files were uploaded.");

                var results = await pdfProcessingService.ProcessPdfFilesAsync(files, cancellationToken);
                
                var successfulCount = results.Count(r => r.Success);
                var failedCount = results.Count(r => !r.Success);

                return Results.Ok(new
                {
                    message = $"Processed {successfulCount} files successfully, {failedCount} files failed",
                    results = results
                });
            }
            catch (Exception ex)
            {
                return Results.Problem(
                    title: "Error processing files",
                    detail: ex.Message,
                    statusCode: StatusCodes.Status500InternalServerError);
            }
        })
        .WithName("ProcessPdfs")
        .WithSummary("Process PDFs")
        .WithDescription("Processes a collection of PDF files concurrently")
        .WithTags("PDF Processing")
        .DisableAntiforgery();

        pdfGroup.MapGet("/processed", async (
            IPdfProcessingService pdfProcessingService,
            CancellationToken cancellationToken) =>
        {
            var files = new List<ProcessedFile>();
            await foreach (var file in pdfProcessingService.GetAllProcessedFilesAsync(cancellationToken))
            {
                files.Add(file);
            }
            return Results.Ok(files);
        })
        .WithName("GetAllProcessedFiles")
        .WithSummary("Get all processed files")
        .WithDescription("Retrieves a list of all processed files")
        .WithTags("PDF Processing");

        pdfGroup.MapGet("/file/{id}", async (
            string id,
            IPdfProcessingService pdfProcessingService,
            CancellationToken cancellationToken) =>
        {
            ProcessedFile? file = await pdfProcessingService.GetProcessedFileAsync(id, cancellationToken);
            if (file == null)
                return Results.NotFound();


            Console.WriteLine("File Path: ");
            Console.WriteLine(file.FilePath);


            return Results.File(file.FilePath, "application/pdf", file.FilePath.Split('\\').Last());
        })
        .WithName("GetPdfFile")
        .WithSummary("Get PDF file")
        .WithDescription("Retrieves a specific PDF file by its ID")
        .WithTags("PDF Processing");

        pdfGroup.MapDelete("/clear", async (
            IPdfProcessingService pdfProcessingService,
            CancellationToken cancellationToken) =>
        {
            await pdfProcessingService.ClearProcessedFilesAsync(cancellationToken);
            return Results.Ok(new { message = "All processed files have been cleared" });
        })
        .WithName("ClearProcessedFiles")
        .WithSummary("Clear all processed files")
        .WithDescription("Deletes all processed files and clears the processing list")
        .WithTags("PDF Processing");
    }
} 