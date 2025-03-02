using System.ComponentModel.DataAnnotations;

namespace PdfProcessor.API.Models;

public record LoginRequest
{
    [Required]
    [EmailAddress]
    public string Email { get; init; } = string.Empty;
    
    [Required]
    public string Password { get; init; } = string.Empty;
}
