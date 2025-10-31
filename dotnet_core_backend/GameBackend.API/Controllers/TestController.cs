using Microsoft.AspNetCore.Mvc;

namespace GameBackend.API.Controllers;

[ApiController]
[Route("api/[controller]")]
public class TestController : ControllerBase
{
    [HttpGet]
    public IActionResult Get()
    {
        return Ok(new { message = "Backend is working!" });
    }
}
