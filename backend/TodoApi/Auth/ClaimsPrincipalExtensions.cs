using System.Security.Claims;
using System.IdentityModel.Tokens.Jwt;

namespace TodoApi.Auth;

public static class ClaimsPrincipalExtensions
{
    /// <summary>
    /// Returns the authenticated user's id from the "sub" claim.
    /// Throws if the principal is unauthenticated — callers are always behind [Authorize].
    /// </summary>
    public static Guid GetUserId(this ClaimsPrincipal principal)
    {
        var sub = principal.FindFirstValue(JwtRegisteredClaimNames.Sub)
                  ?? principal.FindFirstValue(ClaimTypes.NameIdentifier);

        return Guid.TryParse(sub, out var id)
            ? id
            : throw new InvalidOperationException("Authenticated principal is missing a valid user id.");
    }
}
