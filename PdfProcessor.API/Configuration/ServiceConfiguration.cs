using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;
using Microsoft.OpenApi.Models;
using Scalar.AspNetCore;
using System.Text;
using PdfProcessor.API.Data;
using PdfProcessor.API.Models;
using PdfProcessor.API.Services;
using PdfProcessor.API.Services.LLMIntegration;
using PdfProcessor.API.Constants;

namespace PdfProcessor.API.Configuration;

public static class ServiceConfiguration
{
    public static void RegisterServices(IServiceCollection services)
    {
        services.AddEndpointsApiExplorer();
        services.AddOpenApi(options => 
        {
            options.AddDocumentTransformer((document, context, cancellationToken) =>
            {
                document.Info.Title = "Roknskapar PDF API";
                document.Info.Description = "Roknskapar PDF viðgerð til JSON";
                document.Info.Version = "v1";
                document.Info.Contact = new OpenApiContact
                {
                    Name = "Kodi ÍVF",
                    Email = "Kodi@Kodi.fo"
                };
                return Task.CompletedTask;
            });
        });

        // Register application services
        services.AddScoped<JwtService>();
        services.AddScoped<UserService>();
        services.AddSingleton<IGeminiService, GeminiService>();
        services.AddSingleton<IPdfProcessingService, PdfProcessingService>();
    }

    public static void ConfigureDatabase(IServiceCollection services, IConfiguration configuration)
    {
        // Add DbContext
        services.AddDbContext<ApplicationDbContext>(options =>
            options.UseSqlServer(configuration.GetConnectionString(ConfigurationConstants.ConnectionStrings.DefaultConnection), 
                sqlServerOptionsAction: sqlOptions =>
                {
                    sqlOptions.EnableRetryOnFailure(
                        maxRetryCount: 5,
                        maxRetryDelay: TimeSpan.FromSeconds(30),
                        errorNumbersToAdd: null);
                    sqlOptions.MigrationsHistoryTable("__EFMigrationsHistory", "dbo");
                }));

        // Add Identity
        services.AddIdentity<ApplicationUser, IdentityRole>(options =>
        {
            options.Password.RequiredLength = 6;
            options.Password.RequireDigit = false;
            options.Password.RequireLowercase = false;
            options.Password.RequireUppercase = false;
            options.Password.RequireNonAlphanumeric = false;
            options.User.RequireUniqueEmail = true;
        })
        .AddEntityFrameworkStores<ApplicationDbContext>()
        .AddDefaultTokenProviders();

        // Configure JWT authentication
        services.AddAuthentication(options =>
        {
            options.DefaultAuthenticateScheme = JwtBearerDefaults.AuthenticationScheme;
            options.DefaultChallengeScheme = JwtBearerDefaults.AuthenticationScheme;
        })
        .AddJwtBearer(options =>
        {
            options.TokenValidationParameters = new TokenValidationParameters
            {
                ValidateIssuer = true,
                ValidateAudience = true,
                ValidateLifetime = true,
                ValidateIssuerSigningKey = true,
                ValidIssuer = configuration[ConfigurationConstants.Jwt.Issuer],
                ValidAudience = configuration[ConfigurationConstants.Jwt.Audience],
                IssuerSigningKey = new SymmetricSecurityKey(
                    Encoding.UTF8.GetBytes(configuration[ConfigurationConstants.Jwt.Key] ?? 
                        throw new InvalidOperationException("JWT Key not found in configuration")))
            };
        });

        services.AddAuthorization(options =>
        {
            options.AddPolicy(ConfigurationConstants.Policies.RequireAdminRole, 
                policy => policy.RequireRole(ConfigurationConstants.Roles.Admin));
            options.AddPolicy(ConfigurationConstants.Policies.RequireUserRole, 
                policy => policy.RequireRole(ConfigurationConstants.Roles.User, ConfigurationConstants.Roles.Admin));
        });
    }

    public static void ConfigureCors(IServiceCollection services)
    {
        services.AddCors(options =>
        {
            options.AddPolicy(ConfigurationConstants.Cors.AllowPdfProcessorUI,
                policy => policy
                    .AllowAnyOrigin()
                    .AllowAnyMethod()
                    .AllowAnyHeader());
        });
    }
} 