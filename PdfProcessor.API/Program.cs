using PdfProcessor.API.Data;
using Scalar.AspNetCore;
using PdfProcessor.API.Endpoints;
using PdfProcessor.API.Configuration;
using PdfProcessor.API.Constants;

WebApplicationBuilder builder = WebApplication.CreateBuilder(args);

// Configure services
ServiceConfiguration.RegisterServices(builder.Services);
ServiceConfiguration.ConfigureDatabase(builder.Services, builder.Configuration);
ServiceConfiguration.ConfigureCors(builder.Services);

WebApplication app = builder.Build();

// Initialize roles
await RoleSeeder.SeedRolesAsync(app.Services);

if (app.Environment.IsDevelopment())
{
    app.MapOpenApi();
    app.MapScalarApiReference();
}

app.UseHttpsRedirection();
app.UseCors(ConfigurationConstants.Cors.AllowPdfProcessorUI);
app.UseAuthentication();
app.UseAuthorization();

// Map endpoints
app.MapAuthEndpoints();
app.MapUserEndpoints();
app.MapPdfEndpoints();

app.Run();
