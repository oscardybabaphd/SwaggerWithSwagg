using Microsoft.AspNetCore.Mvc;

namespace SampleApi.Controllers;

[ApiController]
[Route("api/[controller]")]
[ApiVersion("v1")]
public class FilesController : ControllerBase
{
    /// <summary>
    /// Upload a single file
    /// </summary>
    /// <param name="file">The file to upload</param>
    /// <returns>Upload confirmation</returns>
    [HttpPost("upload")]
    [ProducesResponseType(typeof(FileUploadResponse), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [Consumes("multipart/form-data")]
    public IActionResult UploadFile(IFormFile file)
    {
        if (file == null || file.Length == 0)
        {
            return BadRequest(new { message = "No file uploaded" });
        }

        // Validate file size (max 10MB)
        if (file.Length > 10 * 1024 * 1024)
        {
            return BadRequest(new { message = "File size exceeds 10MB limit" });
        }

        var response = new FileUploadResponse
        {
            FileName = file.FileName,
            ContentType = file.ContentType,
            Size = file.Length,
            UploadedAt = DateTime.UtcNow,
            Message = "File uploaded successfully"
        };

        return Ok(response);
    }

    /// <summary>
    /// Upload file with metadata
    /// </summary>
    /// <param name="request">File upload request with metadata</param>
    /// <returns>Upload confirmation</returns>
    [HttpPost("upload-with-metadata")]
    [ProducesResponseType(typeof(FileUploadResponse), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [Consumes("multipart/form-data")]
    public IActionResult UploadFileWithMetadata([FromForm] FileUploadWithMetadataRequest request)
    {
        if (request.File == null || request.File.Length == 0)
        {
            return BadRequest(new { message = "No file uploaded" });
        }

        var response = new FileUploadResponse
        {
            FileName = request.File.FileName,
            ContentType = request.File.ContentType,
            Size = request.File.Length,
            UploadedAt = DateTime.UtcNow,
            Description = request.Description,
            Category = request.Category,
            Message = "File uploaded successfully with metadata"
        };

        return Ok(response);
    }

    /// <summary>
    /// Upload multiple files
    /// </summary>
    /// <param name="files">The files to upload</param>
    /// <returns>Upload confirmation</returns>
    [HttpPost("upload-multiple")]
    [ProducesResponseType(typeof(MultipleFileUploadResponse), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [Consumes("multipart/form-data")]
    public IActionResult UploadMultipleFiles(List<IFormFile> files)
    {
        if (files == null || files.Count == 0)
        {
            return BadRequest(new { message = "No files uploaded" });
        }

        var uploadedFiles = files.Select(file => new UploadedFileInfo
        {
            FileName = file.FileName,
            ContentType = file.ContentType,
            Size = file.Length
        }).ToList();

        var response = new MultipleFileUploadResponse
        {
            TotalFiles = files.Count,
            TotalSize = files.Sum(f => f.Length),
            Files = uploadedFiles,
            UploadedAt = DateTime.UtcNow,
            Message = $"{files.Count} file(s) uploaded successfully"
        };

        return Ok(response);
    }
}

/// <summary>
/// Request model for file upload with metadata
/// </summary>
public class FileUploadWithMetadataRequest
{
    /// <summary>
    /// The file to upload
    /// </summary>
    public required IFormFile File { get; set; }

    /// <summary>
    /// Optional description of the file
    /// </summary>
    public string? Description { get; set; }

    /// <summary>
    /// Category of the file (e.g., "documents", "images", "videos")
    /// </summary>
    public string? Category { get; set; }
}

/// <summary>
/// Response model for file upload
/// </summary>
public class FileUploadResponse
{
    /// <summary>
    /// Name of the uploaded file
    /// </summary>
    public required string FileName { get; set; }

    /// <summary>
    /// Content type of the file
    /// </summary>
    public required string ContentType { get; set; }

    /// <summary>
    /// Size of the file in bytes
    /// </summary>
    public long Size { get; set; }

    /// <summary>
    /// Timestamp when the file was uploaded
    /// </summary>
    public DateTime UploadedAt { get; set; }

    /// <summary>
    /// Optional description
    /// </summary>
    public string? Description { get; set; }

    /// <summary>
    /// Optional category
    /// </summary>
    public string? Category { get; set; }

    /// <summary>
    /// Success message
    /// </summary>
    public required string Message { get; set; }
}

/// <summary>
/// Response model for multiple file upload
/// </summary>
public class MultipleFileUploadResponse
{
    /// <summary>
    /// Total number of files uploaded
    /// </summary>
    public int TotalFiles { get; set; }

    /// <summary>
    /// Total size of all files in bytes
    /// </summary>
    public long TotalSize { get; set; }

    /// <summary>
    /// List of uploaded files
    /// </summary>
    public required List<UploadedFileInfo> Files { get; set; }

    /// <summary>
    /// Timestamp when the files were uploaded
    /// </summary>
    public DateTime UploadedAt { get; set; }

    /// <summary>
    /// Success message
    /// </summary>
    public required string Message { get; set; }
}

/// <summary>
/// Information about an uploaded file
/// </summary>
public class UploadedFileInfo
{
    /// <summary>
    /// File name
    /// </summary>
    public required string FileName { get; set; }

    /// <summary>
    /// Content type
    /// </summary>
    public required string ContentType { get; set; }

    /// <summary>
    /// File size in bytes
    /// </summary>
    public long Size { get; set; }
}
