using System.Security.Cryptography;

public sealed class PasswordHasher
{
    private const int Iterations = 150_000;
    private const int SaltSize = 16;
    private const int KeySize = 32;

    public (string Hash, string Salt) HashPassword(string password)
    {
        return (BCrypt.Net.BCrypt.HashPassword(password), string.Empty);
    }

    public bool Verify(string password, string hashBase64, string saltBase64)
    {
        if (string.IsNullOrWhiteSpace(hashBase64))
        {
            return false;
        }

        if (hashBase64.StartsWith("$2", StringComparison.Ordinal))
        {
            return BCrypt.Net.BCrypt.Verify(password, hashBase64);
        }

        if (string.IsNullOrWhiteSpace(saltBase64))
        {
            return false;
        }

        try
        {
            var salt = Convert.FromBase64String(saltBase64);
            using var pbkdf2 = new Rfc2898DeriveBytes(password, salt, Iterations, HashAlgorithmName.SHA256);
            var computed = pbkdf2.GetBytes(KeySize);
            var stored = Convert.FromBase64String(hashBase64);
            return CryptographicOperations.FixedTimeEquals(computed, stored);
        }
        catch (FormatException)
        {
            return false;
        }
    }
}
