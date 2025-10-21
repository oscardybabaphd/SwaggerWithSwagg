using Microsoft.AspNetCore.Mvc;
using SampleApi.Models;

namespace SampleApi.Controllers.V2;

[ApiController]
[Route("api/v2/customers")]
[ApiVersion("v2")]
public class CustomersV2Controller : ControllerBase
{
    /// <summary>
    /// Get all customers with pagination (V2)
    /// </summary>
    /// <param name="status">Filter by customer status</param>
    /// <param name="subscriptionTier">Filter by subscription tier</param>
    /// <param name="page">Page number (default: 1)</param>
    /// <param name="pageSize">Page size (default: 10)</param>
    /// <returns>Paginated list of customers</returns>
    [HttpGet]
    [ProducesResponseType(typeof(PagedResult<Customer>), StatusCodes.Status200OK)]
    public IActionResult GetAllCustomers(
        [FromQuery] CustomerStatus? status = null, 
        [FromQuery] SubscriptionTier? subscriptionTier = null,
        [FromQuery] int page = 1,
        [FromQuery] int pageSize = 10)
    {
        var customers = DataStore.GetCustomers();

        if (status.HasValue)
        {
            customers = customers.Where(c => c.Status == status.Value).ToList();
        }

        if (subscriptionTier.HasValue)
        {
            customers = customers.Where(c => c.SubscriptionTier == subscriptionTier.Value).ToList();
        }

        var totalCount = customers.Count;
        var items = customers.Skip((page - 1) * pageSize).Take(pageSize).ToList();

        var result = new PagedResult<Customer>
        {
            Items = items,
            TotalCount = totalCount,
            Page = page,
            PageSize = pageSize
        };

        return Ok(result);
    }

    /// <summary>
    /// Get customer by ID (V2)
    /// </summary>
    /// <param name="id">Customer unique identifier</param>
    /// <returns>Customer details with enhanced information</returns>
    [HttpGet("{id}")]
    [ProducesResponseType(typeof(Customer), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public IActionResult GetCustomerById(Guid id)
    {
        var customer = DataStore.GetCustomers().FirstOrDefault(c => c.Id == id);
        return customer != null ? Ok(customer) : NotFound(new { message = "Customer not found", errorCode = "CUSTOMER_NOT_FOUND" });
    }

    /// <summary>
    /// Search customers by name or email (V2)
    /// </summary>
    /// <param name="query">Search query for name or email</param>
    /// <returns>List of matching customers</returns>
    [HttpGet("search")]
    [ProducesResponseType(typeof(IEnumerable<Customer>), StatusCodes.Status200OK)]
    public IActionResult SearchCustomers([FromQuery] string query)
    {
        if (string.IsNullOrWhiteSpace(query))
            return Ok(new List<Customer>());

        var customers = DataStore.GetCustomers()
            .Where(c => c.FirstName.Contains(query, StringComparison.OrdinalIgnoreCase) ||
                       c.LastName.Contains(query, StringComparison.OrdinalIgnoreCase) ||
                       c.Email.Contains(query, StringComparison.OrdinalIgnoreCase))
            .ToList();

        return Ok(customers);
    }

    /// <summary>
    /// Create a new customer (V2)
    /// </summary>
    /// <param name="request">Customer creation details</param>
    /// <returns>Created customer</returns>
    [HttpPost]
    [ProducesResponseType(typeof(Customer), StatusCodes.Status201Created)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    public IActionResult CreateCustomer([FromBody] CreateCustomerRequest request)
    {
        // V2: Add email validation
        if (!request.Email.Contains("@"))
        {
            return BadRequest(new { message = "Invalid email format", errorCode = "INVALID_EMAIL" });
        }

        var customer = new Customer
        {
            Id = Guid.NewGuid(),
            FirstName = request.FirstName,
            LastName = request.LastName,
            Email = request.Email,
            PhoneNumber = request.PhoneNumber,
            DateOfBirth = request.DateOfBirth,
            Status = CustomerStatus.Active,
            SubscriptionTier = request.SubscriptionTier,
            Address = request.Address,
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow
        };

        DataStore.GetCustomers().Add(customer);
        return CreatedAtAction(nameof(GetCustomerById), new { id = customer.Id }, customer);
    }

    /// <summary>
    /// Update an existing customer (V2)
    /// </summary>
    /// <param name="id">Customer ID</param>
    /// <param name="request">Updated customer details</param>
    /// <returns>Updated customer</returns>
    [HttpPut("{id}")]
    [ProducesResponseType(typeof(Customer), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public IActionResult UpdateCustomer(Guid id, [FromBody] UpdateCustomerRequest request)
    {
        var customer = DataStore.GetCustomers().FirstOrDefault(c => c.Id == id);
        if (customer == null)
            return NotFound(new { message = "Customer not found", errorCode = "CUSTOMER_NOT_FOUND" });

        if (!string.IsNullOrEmpty(request.FirstName)) customer.FirstName = request.FirstName;
        if (!string.IsNullOrEmpty(request.LastName)) customer.LastName = request.LastName;
        if (request.PhoneNumber != null) customer.PhoneNumber = request.PhoneNumber;
        if (request.Status.HasValue) customer.Status = request.Status.Value;
        if (request.SubscriptionTier.HasValue) customer.SubscriptionTier = request.SubscriptionTier.Value;
        if (request.Address != null) customer.Address = request.Address;
        customer.UpdatedAt = DateTime.UtcNow;

        return Ok(customer);
    }

    /// <summary>
    /// Partially update a customer (V2)
    /// </summary>
    /// <param name="id">Customer ID</param>
    /// <param name="request">Fields to update</param>
    /// <returns>Updated customer</returns>
    [HttpPatch("{id}")]
    [ProducesResponseType(typeof(Customer), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public IActionResult PatchCustomer(Guid id, [FromBody] UpdateCustomerRequest request)
    {
        var customer = DataStore.GetCustomers().FirstOrDefault(c => c.Id == id);
        if (customer == null)
            return NotFound(new { message = "Customer not found", errorCode = "CUSTOMER_NOT_FOUND" });

        if (!string.IsNullOrEmpty(request.FirstName)) customer.FirstName = request.FirstName;
        if (!string.IsNullOrEmpty(request.LastName)) customer.LastName = request.LastName;
        if (request.PhoneNumber != null) customer.PhoneNumber = request.PhoneNumber;
        if (request.Status.HasValue) customer.Status = request.Status.Value;
        if (request.SubscriptionTier.HasValue) customer.SubscriptionTier = request.SubscriptionTier.Value;
        if (request.Address != null) customer.Address = request.Address;
        customer.UpdatedAt = DateTime.UtcNow;

        return Ok(customer);
    }

    /// <summary>
    /// Delete a customer (V2)
    /// </summary>
    /// <param name="id">Customer ID</param>
    /// <returns>No content</returns>
    [HttpDelete("{id}")]
    [ProducesResponseType(StatusCodes.Status204NoContent)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public IActionResult DeleteCustomer(Guid id)
    {
        var customer = DataStore.GetCustomers().FirstOrDefault(c => c.Id == id);
        if (customer == null)
            return NotFound(new { message = "Customer not found", errorCode = "CUSTOMER_NOT_FOUND" });

        DataStore.GetCustomers().Remove(customer);
        return NoContent();
    }
}
