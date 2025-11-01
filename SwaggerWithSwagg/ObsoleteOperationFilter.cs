using Microsoft.OpenApi.Models;
using Swashbuckle.AspNetCore.SwaggerGen;
using System;
using System.Linq;
using System.Reflection;

namespace SwaggerWithSwagg
{
    /// <summary>
    /// Operation filter that marks endpoints with [Obsolete] attribute as deprecated in OpenAPI spec
    /// </summary>
    public class ObsoleteOperationFilter : IOperationFilter
    {
        public void Apply(OpenApiOperation operation, OperationFilterContext context)
        {
            // Check if the action method has [Obsolete] attribute
            var obsoleteAttribute = context.MethodInfo
                .GetCustomAttributes(typeof(ObsoleteAttribute), true)
                .FirstOrDefault() as ObsoleteAttribute;

            // If not on method, check the controller
            if (obsoleteAttribute == null)
            {
                obsoleteAttribute = context.MethodInfo.DeclaringType?
                    .GetCustomAttributes(typeof(ObsoleteAttribute), true)
                    .FirstOrDefault() as ObsoleteAttribute;
            }

            if (obsoleteAttribute != null)
            {
                operation.Deprecated = true;

                // Add obsolete message to description if provided
                if (!string.IsNullOrEmpty(obsoleteAttribute.Message))
                {
                    var deprecationNote = $"\n\n⚠️ **DEPRECATED**: {obsoleteAttribute.Message}";
                    operation.Description = string.IsNullOrEmpty(operation.Description)
                        ? deprecationNote.TrimStart()
                        : operation.Description + deprecationNote;
                }
            }
        }
    }
}
