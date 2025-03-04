namespace PdfProcessor.API.Constants;

public static class ConfigurationConstants
{
    public static class ConnectionStrings
    {
        public const string DefaultConnection = "DefaultConnection";
    }

    public static class Jwt
    {
        public const string Key = "Jwt:Key";
        public const string Issuer = "Jwt:Issuer";
        public const string Audience = "Jwt:Audience";
    }

    public static class AdminSetup
    {
        public const string SecretKey = "AdminSetup:SecretKey";
    }

    public static class Roles
    {
        public const string Admin = "Admin";
        public const string User = "User";
    }

    public static class Policies
    {
        public const string RequireAdminRole = "RequireAdminRole";
        public const string RequireUserRole = "RequireUserRole";
    }

    public static class Cors
    {
        public const string AllowPdfProcessorUI = "AllowPdfProcessorUI";
    }
} 