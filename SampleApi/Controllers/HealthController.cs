using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using SampleApi.Models;

namespace SampleApi.Controllers;

[ApiController]
[Route("[controller]")]
[ApiVersion("v1")]
public class HealthController : ControllerBase
{
    /// <summary>
    /// Check API health status
    /// </summary>
    /// <returns>Health check information</returns>
    [HttpGet]
    [AllowAnonymous]
    [ProducesResponseType(typeof(HealthCheck), StatusCodes.Status200OK)]
    public IActionResult Get()
    {
        return Ok(new HealthCheck
        {
            Status = "healthy",
            Timestamp = DateTime.UtcNow,
            Version = "1.0.0",
            Services = new Dictionary<string, string>
            {
                { "database", "connected" },
                { "cache", "connected" },
                { "email", "operational" }
            }
        });
    }
}
