using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;
using System.Security.Claims;
using System.Text;
using PdfProcessor.API.Data;
using PdfProcessor.API.Models;
using PdfProcessor.API.Services;

var builder = WebApplication.CreateBuilder(args);

// Add services
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen();
builder.Services.AddScoped<JwtService>();
builder.Services.AddScoped<UserService>();

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
    app.UseSwagger();
    app.UseSwaggerUI();           
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
.WithOpenApi();

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
.WithOpenApi();

// User Management Endpoints
var userApi = app.MapGroup("/api/users").RequireAuthorization("RequireAdminRole");

// Get all users
userApi.MapGet("/", async (UserService userService) =>
    {
        var users = await userService.GetAllUsers();
        return Results.Ok(users);
    })
    .WithName("GetAllUsers")
    .WithOpenApi();

// Get user by id
userApi.MapGet("/{id}", async (string id, UserService userService) =>
    {
        var user = await userService.GetUserById(id);
        if (user == null) return Results.NotFound();
        return Results.Ok(user);
    })
    .WithName("GetUserById")
    .WithOpenApi();

// Update user
userApi.MapPut("/{id}", async (string id, UpdateUserRequest request, UserService userService) =>
    {
        var result = await userService.UpdateUser(id, request);
        if (!result.Succeeded)
            return Results.BadRequest(new { errors = result.Errors });
        
        return Results.Ok(new { message = "User updated successfully" });
    })
    .WithName("UpdateUser")
    .WithOpenApi();

// Delete user
userApi.MapDelete("/{id}", async (string id, UserService userService) =>
    {
        var result = await userService.DeleteUser(id);
        if (!result.Succeeded)
            return Results.BadRequest(new { errors = result.Errors });
        
        return Results.Ok(new { message = "User deleted successfully" });
    })
    .WithName("DeleteUser")
    .WithOpenApi();

// Get all roles
userApi.MapGet("/roles", async (UserService userService) =>
    {
        var roles = await userService.GetAllRoles();
        return Results.Ok(roles);
    })
    .WithName("GetAllRoles")
    .WithOpenApi();

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
.WithOpenApi();

// PDF processing endpoint
app.MapPost("/api/pdf/process", async (IFormFileCollection files, ILogger<Program> logger) =>
{
    try
    {
        if (files == null || files.Count == 0)
            return Results.BadRequest("No files were uploaded.");

        var processingTasks = new List<Task>();
        foreach (var file in files)
        {
            if (!file.ContentType.Equals("application/pdf", StringComparison.OrdinalIgnoreCase))
            {
                logger.LogWarning("Invalid file type received: {ContentType}", file.ContentType);
                continue;
            }

            processingTasks.Add(ProcessPdfFileAsync(file, logger));
        }

        await Task.WhenAll(processingTasks);
        
        return Results.Ok(new { message = $"Successfully processed {files.Count} PDF files" });
    }
    catch (Exception ex)
    {
        logger.LogError(ex, "Error processing PDF files");
        return Results.StatusCode(500);
    }
})
.RequireAuthorization("RequireUserRole")
.WithName("ProcessPdfs")
.WithOpenApi();

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

async Task ProcessPdfFileAsync(IFormFile file, ILogger logger)
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
        Console.WriteLine("Processing file: {FileName}", file.FileName);
        await Task.Delay(1000); // Simulate processing time
        
        // Clean up
        if (File.Exists(tempPath))
        {
            File.Delete(tempPath);
        }
    }
    catch (Exception ex)
    {
        logger.LogError(ex, "Error processing file: {FileName}", file.FileName);
        throw;
    }
}

app.Run();
