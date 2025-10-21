using Microsoft.OpenApi.Models;
using Swashbuckle.AspNetCore.SwaggerGen;

namespace SwaggerWithSwagg;

/// <summary>
/// Custom operation filter to extract Summary and Description from Minimal API endpoints
/// </summary>
internal class MinimalApiMetadataFilter : IOperationFilter
{
    public void Apply(OpenApiOperation operation, OperationFilterContext context)
    {
        // Try to get the endpoint metadata
        var endpointMetadata = context.ApiDescription.ActionDescriptor.EndpointMetadata;
        
        if (endpointMetadata != null)
        {
            // Look for IEndpointSummaryMetadata (from WithSummary)
            var summaryMetadata = endpointMetadata.OfType<Microsoft.AspNetCore.Http.Metadata.IEndpointSummaryMetadata>().FirstOrDefault();
            if (summaryMetadata != null && !string.IsNullOrEmpty(summaryMetadata.Summary))
            {
                operation.Summary = summaryMetadata.Summary;
            }

            // Look for IEndpointDescriptionMetadata (from WithDescription)
            var descriptionMetadata = endpointMetadata.OfType<Microsoft.AspNetCore.Http.Metadata.IEndpointDescriptionMetadata>().FirstOrDefault();
            if (descriptionMetadata != null && !string.IsNullOrEmpty(descriptionMetadata.Description))
            {
                operation.Description = descriptionMetadata.Description;
            }
        }
    }
}
