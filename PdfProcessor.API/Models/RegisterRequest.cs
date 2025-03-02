using System.ComponentModel.DataAnnotations;

namespace PdfProcessor.API.Models;

public record RegisterRequest
{
    [EmailAddress]
    public required string Email { get; init; } = string.Empty;
    
    [MinLength(6)]
    public required string Password { get; init; } = string.Empty;
    
    [Compare(nameof(Password))]
    public required string ConfirmPassword { get; init; } = string.Empty;
    
    public string? FirstName { get; init; }
    
    public string? LastName { get; init; }
    
    public string? SecretKey { get; set; }
}
