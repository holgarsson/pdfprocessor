using Microsoft.AspNetCore.Identity;
using PdfProcessor.API.Models;

namespace PdfProcessor.API.Services;

public static class DbInitializer
{
    public static async Task Initialize(
        UserManager<ApplicationUser> userManager,
        RoleManager<IdentityRole> roleManager)
    {
        // Create roles
        string[] roles = new[] { "Admin", "User" };
        foreach (string? role in roles)
        {
            if (!await roleManager.RoleExistsAsync(role))
            {
                await roleManager.CreateAsync(new IdentityRole(role));
            }
        }

        // Create admin user
        string adminEmail = "admin@pdfprocessor.com";
        ApplicationUser? adminUser = await userManager.FindByEmailAsync(adminEmail);
        
        if (adminUser == null)
        {
            adminUser = new ApplicationUser
            {
                UserName = adminEmail,
                Email = adminEmail,
                FirstName = "Admin",
                LastName = "User",
                EmailConfirmed = true
            };

            IdentityResult result = await userManager.CreateAsync(adminUser, "Admin123!");
            if (result.Succeeded)
            {
                await userManager.AddToRoleAsync(adminUser, "Admin");
            }
        }
    }
}
