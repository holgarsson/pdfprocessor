using Microsoft.AspNetCore.Identity;
using PdfProcessor.API.Models;

namespace PdfProcessor.API.Services;

public class UserService(
    UserManager<ApplicationUser> userManager,
    RoleManager<IdentityRole> roleManager)
{
    private readonly UserManager<ApplicationUser> _userManager = userManager;
    private readonly RoleManager<IdentityRole> _roleManager = roleManager;

    public async Task<IEnumerable<UserResponse>> GetAllUsers()
    {
        var users = _userManager.Users.ToList();
        var userResponses = new List<UserResponse>();

        foreach (var user in users)
        {
            var roles = await _userManager.GetRolesAsync(user);
            userResponses.Add(new UserResponse(
                user.Id,
                user.Email ?? string.Empty,
                user.FirstName,
                user.LastName,
                roles,
                user.CreatedAt,
                user.IsActive
            ));
        }

        return userResponses;
    }

    public async Task<UserResponse?> GetUserById(string id)
    {
        var user = await _userManager.FindByIdAsync(id);
        if (user == null) return null;

        var roles = await _userManager.GetRolesAsync(user);
        return new UserResponse(
            user.Id,
            user.Email ?? string.Empty,
            user.FirstName,
            user.LastName,
            roles,
            user.CreatedAt,
            user.IsActive
        );
    }

    public async Task<IdentityResult> UpdateUser(string id, UpdateUserRequest request)
    {
        var user = await _userManager.FindByIdAsync(id);
        if (user == null) 
            return IdentityResult.Failed(new IdentityError 
            { 
                Code = "UserNotFound",
                Description = "User not found" 
            });

        if (request.Email != null && request.Email != user.Email)
        {
            var setEmailResult = await _userManager.SetEmailAsync(user, request.Email);
            if (!setEmailResult.Succeeded) return setEmailResult;
            
            user.UserName = request.Email;
            var setUsernameResult = await _userManager.UpdateAsync(user);
            if (!setUsernameResult.Succeeded) return setUsernameResult;
        }

        if (request.FirstName != null)
            user.FirstName = request.FirstName;
        
        if (request.LastName != null)
            user.LastName = request.LastName;
        
        if (request.IsActive.HasValue)
            user.IsActive = request.IsActive.Value;

        var result = await _userManager.UpdateAsync(user);
        if (!result.Succeeded) return result;

        if (request.Roles != null)
        {
            var currentRoles = await _userManager.GetRolesAsync(user);
            var rolesToRemove = currentRoles.Except(request.Roles);
            var rolesToAdd = request.Roles.Except(currentRoles);

            if (rolesToRemove.Any())
            {
                var removeResult = await _userManager.RemoveFromRolesAsync(user, rolesToRemove);
                if (!removeResult.Succeeded) return removeResult;
            }

            if (rolesToAdd.Any())
            {
                var addResult = await _userManager.AddToRolesAsync(user, rolesToAdd);
                if (!addResult.Succeeded) return addResult;
            }
        }

        return IdentityResult.Success;
    }

    public async Task<IdentityResult> DeleteUser(string id)
    {
        var user = await _userManager.FindByIdAsync(id);
        if (user == null)
            return IdentityResult.Failed(new IdentityError
            {
                Code = "UserNotFound",
                Description = "User not found"
            });

        return await _userManager.DeleteAsync(user);
    }

    public async Task<IdentityResult> ChangePassword(string userId, string currentPassword, string newPassword)
    {
        var user = await _userManager.FindByIdAsync(userId);
        if (user == null)
            return IdentityResult.Failed(new IdentityError
            {
                Code = "UserNotFound",
                Description = "User not found"
            });

        return await _userManager.ChangePasswordAsync(user, currentPassword, newPassword);
    }

    public IEnumerable<string> GetAllRoles() => _roleManager.Roles.Select(r => r.Name ?? string.Empty);
    
}
