using Microsoft.AspNetCore.Identity;
using PdfProcessor.API.Models;
using PdfProcessor.API.Constants;

namespace PdfProcessor.API.Data;

public static class RoleSeeder
{
    public static async Task SeedRolesAsync(IServiceProvider serviceProvider)
    {
        using IServiceScope scope = serviceProvider.CreateScope();
        IServiceProvider services = scope.ServiceProvider;
        RoleManager<IdentityRole> roleManager = services.GetRequiredService<RoleManager<IdentityRole>>();
        
        // Ensure roles exist
        if (!await roleManager.RoleExistsAsync(ConfigurationConstants.Roles.Admin))
            await roleManager.CreateAsync(new IdentityRole(ConfigurationConstants.Roles.Admin));
        if (!await roleManager.RoleExistsAsync(ConfigurationConstants.Roles.User))
            await roleManager.CreateAsync(new IdentityRole(ConfigurationConstants.Roles.User));
    }
} 