using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;
using System.Security.Claims;
using System.Text;
using PdfProcessor.API.Data;
using PdfProcessor.API.Models;
using PdfProcessor.API.Services;
using Microsoft.OpenApi.Models;
using Scalar.AspNetCore;

var builder = WebApplication.CreateBuilder(args);

// Add services
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddOpenApi(options => 
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
builder.Services.AddScoped<JwtService>();
builder.Services.AddScoped<UserService>();
builder.Services.AddSingleton<IPdfProcessingService, PdfProcessingService>();

// Add DbContext
builder.Services.AddDbContext<ApplicationDbContext>(options =>
    options.UseSqlServer(builder.Configuration.GetConnectionString("DefaultConnection"), 
        sqlServerOptionsAction: sqlOptions =>
        {
            sqlOptions.EnableRetryOnFailure(
                maxRetryCount: 5,
                maxRetryDelay: TimeSpan.FromSeconds(30),
                errorNumbersToAdd: null);
            sqlOptions.MigrationsHistoryTable("__EFMigrationsHistory", "dbo");
        }));

// Add Identity
builder.Services.AddIdentity<ApplicationUser, IdentityRole>(options =>
{
    options.Password.RequiredLength = 6;
    options.Password.RequireDigit = true;
    options.Password.RequireLowercase = true;
    options.Password.RequireUppercase = true;
    options.Password.RequireNonAlphanumeric = true;
    options.User.RequireUniqueEmail = true;
})
.AddEntityFrameworkStores<ApplicationDbContext>()
.AddDefaultTokenProviders();

// Configure JWT authentication
builder.Services.AddAuthentication(options =>
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
        ValidIssuer = builder.Configuration["Jwt:Issuer"],
        ValidAudience = builder.Configuration["Jwt:Audience"],
        IssuerSigningKey = new SymmetricSecurityKey(
            Encoding.UTF8.GetBytes(builder.Configuration["Jwt:Key"] ?? 
                throw new InvalidOperationException("JWT Key not found in configuration")))
    };
});

builder.Services.AddAuthorization(options =>
{
    options.AddPolicy("RequireAdminRole", policy => policy.RequireRole("Admin"));
    options.AddPolicy("RequireUserRole", policy => policy.RequireRole("User", "Admin"));
});

// Configure CORS
builder.Services.AddCors(options =>
{
    options.AddPolicy("AllowPdfProcessorUI",
        policy => policy
            .AllowAnyOrigin()
            .AllowAnyMethod()
            .AllowAnyHeader());
});

var app = builder.Build();

// Initialize roles if needed
using (var scope = app.Services.CreateScope())
{
    var services = scope.ServiceProvider;
    var userManager = services.GetRequiredService<UserManager<ApplicationUser>>();
    var roleManager = services.GetRequiredService<RoleManager<IdentityRole>>();
    
    // Ensure roles exist
    if (!await roleManager.RoleExistsAsync("Admin"))
        await roleManager.CreateAsync(new IdentityRole("Admin"));
    if (!await roleManager.RoleExistsAsync("User"))
        await roleManager.CreateAsync(new IdentityRole("User"));
}

if (app.Environment.IsDevelopment())
{
    app.MapOpenApi();
    app.MapScalarApiReference();
}


app.UseHttpsRedirection();
app.UseCors("AllowPdfProcessorUI");
app.UseAuthentication();
app.UseAuthorization();

// Register endpoint
app.MapPost("/api/auth/register", async (
    RegisterRequest request,
    UserManager<ApplicationUser> userManager,
    RoleManager<IdentityRole> roleManager) =>
{
    var user = new ApplicationUser
    {
        UserName = request.Email,
        Email = request.Email,
        FirstName = request.FirstName,
        LastName = request.LastName
    };

    var result = await userManager.CreateAsync(user, request.Password);
    if (result.Succeeded)
    {
        // Assign User role by default
        await userManager.AddToRoleAsync(user, "User");
        return Results.Ok(new { message = "User registered successfully" });
    }

    return Results.BadRequest(new { errors = result.Errors });
})
.WithName("Register")
.WithSummary("Register a new user")
.WithDescription("Creates a new user account with the provided information and assigns the User role")
.WithTags("Authentication");

// Login endpoint
app.MapPost("/api/auth/login", async (
    LoginRequest request,
    UserManager<ApplicationUser> userManager,
    JwtService jwtService) =>
{
    var user = await userManager.FindByEmailAsync(request.Email);
    if (user == null)
    {
        return Results.Unauthorized();
    }

    if (!user.IsActive)
    {
        return Results.Unauthorized();
    }

    var isValidPassword = await userManager.CheckPasswordAsync(user, request.Password);
    if (!isValidPassword)
    {
        return Results.Unauthorized();
    }

    var token = await jwtService.GenerateToken(user);
    var roles = await userManager.GetRolesAsync(user);
    
    return Results.Ok(new { 
        token,
        user = new {
            email = user.Email,
            firstName = user.FirstName,
            lastName = user.LastName,
            roles = roles
        }
    });
})
.WithName("Login")
.WithSummary("Authenticate a user")
.WithDescription("Authenticates a user with the provided credentials and returns a JWT token")
.WithTags("Authentication");

// User Management Endpoints
var userApi = app.MapGroup("/api/users")
.RequireAuthorization("RequireAdminRole");

// Get all users
userApi.MapGet("/", async (UserService userService) =>
    {
        var users = await userService.GetAllUsers();
        return Results.Ok(users);
    })
    .WithName("GetAllUsers")
    .WithSummary("Get all users")
    .WithDescription("Retrieves a list of all users in the system")
    .WithTags("User Management");

// Get user by id
userApi.MapGet("/{id}", async (string id, UserService userService) =>
    {
        var user = await userService.GetUserById(id);
        if (user == null) return Results.NotFound();
        return Results.Ok(user);
    })
    .WithName("GetUserById")
    .WithSummary("Get user by ID")
    .WithDescription("Retrieves a specific user by their ID")
    .WithTags("User Management");

// Update user
userApi.MapPut("/{id}", async (string id, UpdateUserRequest request, UserService userService) =>
    {
        var result = await userService.UpdateUser(id, request);
        if (!result.Succeeded)
            return Results.BadRequest(new { errors = result.Errors });
        
        return Results.Ok(new { message = "User updated successfully" });
    })
    .WithName("UpdateUser")
    .WithSummary("Update user")
    .WithDescription("Updates a user's information")
    .WithTags("User Management");

// Delete user
userApi.MapDelete("/{id}", async (string id, UserService userService) =>
    {
        var result = await userService.DeleteUser(id);
        if (!result.Succeeded)
            return Results.BadRequest(new { errors = result.Errors });
        
        return Results.Ok(new { message = "User deleted successfully" });
    })
    .WithName("DeleteUser")
    .WithSummary("Delete user")
    .WithDescription("Deletes a user from the system")
    .WithTags("User Management");

// Get all roles
userApi.MapGet("/roles", async (UserService userService) =>
    {
        var roles = userService.GetAllRoles();
        return Results.Ok(roles);
    })
    .WithName("GetAllRoles")
    .WithSummary("Get all roles")
    .WithDescription("Retrieves a list of all roles in the system")
    .WithTags("User Management");

// Change password (available to all authenticated users)
app.MapPost("/api/auth/change-password", async (
    ChangePasswordRequest request,
    UserManager<ApplicationUser> userManager,
    HttpContext context) =>
{
    var userId = context.User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
    if (userId == null) return Results.Unauthorized();

    var result = await userManager.ChangePasswordAsync(
        await userManager.FindByIdAsync(userId),
        request.CurrentPassword,
        request.NewPassword);

    if (!result.Succeeded)
        return Results.BadRequest(new { errors = result.Errors });
    
    return Results.Ok(new { message = "Password changed successfully" });
})
.RequireAuthorization()
.WithName("ChangePassword")
.WithSummary("Change password")
.WithDescription("Allows an authenticated user to change their password")
.WithTags("Authentication");

// PDF processing endpoint
app.MapPost("/api/pdf/process", async (
    IFormFileCollection files,
    IPdfProcessingService pdfProcessingService) =>
{
    try
    {
        if (files == null || files.Count == 0)
            return Results.BadRequest("No files were uploaded.");

        await pdfProcessingService.ProcessPdfFilesAsync(files);
        return Results.Ok(new { message = $"Successfully processed {files.Count} PDF files" });
    }
    catch (Exception ex)
    {
        Console.WriteLine(ex.Message);
        return Results.StatusCode(500);
    }
})
.RequireAuthorization("RequireAdminRole")
.WithName("ProcessPdfs")
.WithSummary("Process PDFs")
.WithDescription("Processes a collection of PDF files")
.WithTags("PDF Processing")
.DisableAntiforgery();

// List all processed files
app.MapGet("/api/pdf/processed", async (IPdfProcessingService pdfProcessingService) =>
{
    var files = pdfProcessingService.GetAllProcessedFiles();
    return Results.Ok(files);
})
.RequireAuthorization("RequireAdminRole")
.WithName("GetAllProcessedFiles")
.WithSummary("Get all processed files")
.WithDescription("Retrieves a list of all processed files")
.WithTags("PDF Processing");

// Create admin endpoint (only available in development)
app.MapPost("/api/auth/create-admin", async (
    RegisterRequest request,
    UserManager<ApplicationUser> userManager,
    RoleManager<IdentityRole> roleManager,
    IConfiguration configuration,
    IWebHostEnvironment env) =>
{
    // Only allow in development or with a secret key
    string configuredSecretKey = configuration["AdminSetup:SecretKey"];
    if (!env.IsDevelopment() && request.SecretKey != configuredSecretKey)
    {
        return Results.Unauthorized();
    }

    // Check if user exists
    var existingUser = await userManager.FindByEmailAsync(request.Email);
    if (existingUser != null)
    {
        // If user exists but is not in admin role, add to admin role
        if (!await userManager.IsInRoleAsync(existingUser, "Admin"))
        {
            await userManager.AddToRoleAsync(existingUser, "Admin");
            return Results.Ok(new { message = "User promoted to Admin role" });
        }
        return Results.BadRequest(new { message = "Admin user already exists" });
    }

    // Create new admin user
    var user = new ApplicationUser
    {
        UserName = request.Email,
        Email = request.Email,
        FirstName = request.FirstName,
        LastName = request.LastName,
        IsActive = true
    };

    var result = await userManager.CreateAsync(user, request.Password);
    if (result.Succeeded)
    {
        // Assign Admin role
        await userManager.AddToRoleAsync(user, "Admin");
        return Results.Ok(new { message = "Admin user created successfully" });
    }

    return Results.BadRequest(new { errors = result.Errors });
})
.WithName("CreateAdmin")
.WithOpenApi();

app.Run();
