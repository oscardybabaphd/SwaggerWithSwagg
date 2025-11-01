using Microsoft.AspNetCore.Mvc;

namespace SampleApi.Controllers;

/// <summary>
/// Legacy API endpoints (Entire controller is deprecated)
/// </summary>
[Obsolete("This entire controller is deprecated and will be removed in v2.0. Please migrate to the new endpoints.")]
[ApiController]
[Route("api/[controller]")]
[ApiVersion("v1")]
public class LegacyController : ControllerBase
{
    /// <summary>
    /// Legacy health check
    /// </summary>
    /// <returns>Health status</returns>
    [HttpGet("health")]
    [ProducesResponseType(typeof(object), StatusCodes.Status200OK)]
    public IActionResult GetHealth()
    {
        return Ok(new
        {
            status = "healthy",
            warning = "This endpoint is deprecated. Use GET /api/health instead."
        });
    }

    /// <summary>
    /// Legacy version info
    /// </summary>
    /// <returns>Version information</returns>
    [HttpGet("version")]
    [ProducesResponseType(typeof(object), StatusCodes.Status200OK)]
    public IActionResult GetVersion()
    {
        return Ok(new
        {
            version = "1.0.0",
            warning = "This endpoint is deprecated. Use GET /api/health/version instead."
        });
    }

    /// <summary>
    /// Legacy ping endpoint
    /// </summary>
    /// <returns>Pong response</returns>
    [HttpGet("ping")]
    [ProducesResponseType(typeof(string), StatusCodes.Status200OK)]
    public IActionResult Ping()
    {
        return Ok("pong - DEPRECATED");
    }
}
