using Microsoft.AspNetCore.Identity;
using System;

namespace dotnet_core_backend.Entities
{
    public class ApplicationUser : IdentityUser<int>
    {
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    }
}
