using System.ComponentModel.DataAnnotations;

namespace PdfProcessor.API.Models;

public record UserResponse(
    string Id,
    string Email,
    string? FirstName,
    string? LastName,
    IList<string> Roles,
    DateTime CreatedAt,
    bool IsActive
);

public record UpdateUserRequest
{
    [EmailAddress]
    public string? Email { get; init; }
    public string? FirstName { get; init; }
    public string? LastName { get; init; }
    public bool? IsActive { get; init; }
    public IList<string>? Roles { get; init; }
}

public record ChangePasswordRequest
{
    public required string CurrentPassword { get; init; } = string.Empty;
    
    [MinLength(6)]
    public required string NewPassword { get; init; } = string.Empty;
    
    [Compare(nameof(NewPassword))]
    public required string ConfirmNewPassword { get; init; } = string.Empty;
}
