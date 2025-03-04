using Microsoft.AspNetCore.Identity;
using PdfProcessor.API.Models;
using PdfProcessor.API.Services;
using System.Security.Claims;
using PdfProcessor.API.Constants;

namespace PdfProcessor.API.Endpoints;

public static class AuthEndpoints
{
    public static void MapAuthEndpoints(this IEndpointRouteBuilder app)
    {
        RouteGroupBuilder authGroup = app.MapGroup("/api/auth");

        authGroup.MapPost("/register", async (
            RegisterRequest request,
            UserManager<ApplicationUser> userManager,
            RoleManager<IdentityRole> roleManager) =>
        {
            ApplicationUser user = new ApplicationUser
            {
                UserName = request.Email,
                Email = request.Email,
                FirstName = request.FirstName,
                LastName = request.LastName
            };

            IdentityResult result = await userManager.CreateAsync(user, request.Password);
            if (result.Succeeded)
            {
                await userManager.AddToRoleAsync(user, ConfigurationConstants.Roles.User);
                return Results.Ok(new { message = "User registered successfully" });
            }

            return Results.BadRequest(new { errors = result.Errors });
        })
        .WithName("Register")
        .WithSummary("Register a new user")
        .WithDescription("Creates a new user account with the provided information and assigns the User role")
        .WithTags("Authentication");

        authGroup.MapPost("/login", async (
            LoginRequest request,
            UserManager<ApplicationUser> userManager,
            JwtService jwtService) =>
        {
            ApplicationUser? user = await userManager.FindByEmailAsync(request.Email);
            if (user == null || !user.IsActive)
            {
                return Results.Unauthorized();
            }

            bool isValidPassword = await userManager.CheckPasswordAsync(user, request.Password);
            if (!isValidPassword)
            {
                return Results.Unauthorized();
            }

            string token = await jwtService.GenerateToken(user);
            IList<string> roles = await userManager.GetRolesAsync(user);
            
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

        authGroup.MapPost("/change-password", async (
            ChangePasswordRequest request,
            UserManager<ApplicationUser> userManager,
            HttpContext context) =>
        {
            string? userId = context.User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            if (userId == null) return Results.Unauthorized();

            var user = await userManager.FindByIdAsync(userId);
            if (user == null) return Results.NotFound();

            IdentityResult result = await userManager.ChangePasswordAsync(
                user,
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

        authGroup.MapPost("/create-admin", async (
            RegisterRequest request,
            UserManager<ApplicationUser> userManager,
            RoleManager<IdentityRole> roleManager,
            IConfiguration configuration,
            IWebHostEnvironment env) =>
        {
            string configuredSecretKey = configuration[ConfigurationConstants.AdminSetup.SecretKey]!;
            if (!env.IsDevelopment() && request.SecretKey != configuredSecretKey)
            {
                return Results.Unauthorized();
            }

            ApplicationUser? existingUser = await userManager.FindByEmailAsync(request.Email);
            if (existingUser != null)
            {
                if (!await userManager.IsInRoleAsync(existingUser, ConfigurationConstants.Roles.Admin))
                {
                    await userManager.AddToRoleAsync(existingUser, ConfigurationConstants.Roles.Admin);
                    return Results.Ok(new { message = "User promoted to Admin role" });
                }
                return Results.BadRequest(new { message = "Admin user already exists" });
            }

            ApplicationUser user = new ApplicationUser
            {
                UserName = request.Email,
                Email = request.Email,
                FirstName = request.FirstName,
                LastName = request.LastName,
                IsActive = true
            };

            IdentityResult result = await userManager.CreateAsync(user, request.Password);
            if (result.Succeeded)
            {
                await userManager.AddToRoleAsync(user, ConfigurationConstants.Roles.Admin);
                return Results.Ok(new { message = "Admin user created successfully" });
            }

            return Results.BadRequest(new { errors = result.Errors });
        })
        .WithName("CreateAdmin")
        .WithOpenApi();
    }
} 