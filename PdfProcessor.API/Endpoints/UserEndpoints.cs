using PdfProcessor.API.Models;
using PdfProcessor.API.Services;
using PdfProcessor.API.Constants;

namespace PdfProcessor.API.Endpoints;

public static class UserEndpoints
{
    public static void MapUserEndpoints(this IEndpointRouteBuilder app)
    {
        RouteGroupBuilder userApi = app.MapGroup("/api/users")
            .RequireAuthorization(ConfigurationConstants.Policies.RequireAdminRole);

        userApi.MapGet("/", async (UserService userService) =>
        {
            IEnumerable<UserResponse> users = await userService.GetAllUsers();
            return Results.Ok(users);
        })
        .WithName("GetAllUsers")
        .WithSummary("Get all users")
        .WithDescription("Retrieves a list of all users in the system")
        .WithTags("User Management");

        userApi.MapGet("/{id}", async (string id, UserService userService) =>
        {
            UserResponse? user = await userService.GetUserById(id);
            if (user == null) return Results.NotFound();
            return Results.Ok(user);
        })
        .WithName("GetUserById")
        .WithSummary("Get user by ID")
        .WithDescription("Retrieves a specific user by their ID")
        .WithTags("User Management");

        userApi.MapPut("/{id}", async (string id, UpdateUserRequest request, UserService userService) =>
        {
            Microsoft.AspNetCore.Identity.IdentityResult result = await userService.UpdateUser(id, request);
            if (!result.Succeeded)
                return Results.BadRequest(new { errors = result.Errors });
            
            return Results.Ok(new { message = "User updated successfully" });
        })
        .WithName("UpdateUser")
        .WithSummary("Update user")
        .WithDescription("Updates a user's information")
        .WithTags("User Management");

        userApi.MapDelete("/{id}", async (string id, UserService userService) =>
        {
            Microsoft.AspNetCore.Identity.IdentityResult result = await userService.DeleteUser(id);
            if (!result.Succeeded)
                return Results.BadRequest(new { errors = result.Errors });
            
            return Results.Ok(new { message = "User deleted successfully" });
        })
        .WithName("DeleteUser")
        .WithSummary("Delete user")
        .WithDescription("Deletes a user from the system")
        .WithTags("User Management");

        userApi.MapGet("/roles", (UserService userService) =>
        {
            IEnumerable<string> roles = userService.GetAllRoles();
            return Results.Ok(roles);
        })
        .WithName("GetAllRoles")
        .WithSummary("Get all roles")
        .WithDescription("Retrieves a list of all roles in the system")
        .WithTags("User Management");
    }
} 