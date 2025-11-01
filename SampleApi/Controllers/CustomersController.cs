using Microsoft.AspNetCore.Mvc;
using SampleApi.Models;

namespace SampleApi.Controllers;

[ApiController]
[Route("api/[controller]")]
[ApiVersion("v1")]
public class CustomersController : ControllerBase
{
    /// <summary>
    /// Get all customers
    /// </summary>
    /// <param name="status">Filter by customer status</param>
    /// <param name="subscriptionTier">Filter by subscription tier</param>
    /// <returns>List of customers</returns>
    [HttpGet]
    [ProducesResponseType(typeof(IEnumerable<Customer>), StatusCodes.Status200OK)]
    public IActionResult GetAllCustomers([FromQuery] CustomerStatus? status = null, [FromQuery] SubscriptionTier? subscriptionTier = null)
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

        return Ok(customers);
    }

    /// <summary>
    /// Get customer by ID
    /// </summary>
    /// <param name="id">Customer unique identifier</param>
    /// <returns>Customer details</returns>
    [HttpGet("{id}")]
    [ProducesResponseType(typeof(Customer), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public IActionResult GetCustomerById(Guid id)
    {
        var customer = DataStore.GetCustomers().FirstOrDefault(c => c.Id == id);
        return customer != null ? Ok(customer) : NotFound(new { message = "Customer not found" });
    }

    /// <summary>
    /// Create a new customer
    /// </summary>
    /// <param name="request">Customer creation details</param>
    /// <returns>Created customer</returns>
    [HttpPost]
    [ProducesResponseType(typeof(Customer), StatusCodes.Status201Created)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    public IActionResult CreateCustomer([FromBody] CreateCustomerRequest request)
    {
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
    /// Update an existing customer
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
            return NotFound(new { message = "Customer not found" });

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
    /// Delete a customer
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
            return NotFound(new { message = "Customer not found" });

        DataStore.GetCustomers().Remove(customer);
        return NoContent();
    }

    /// <summary>
    /// Get customer statistics (DEPRECATED - Use GET /api/analytics/customer/{id} instead)
    /// </summary>
    /// <param name="id">Customer ID</param>
    /// <returns>Customer statistics</returns>
    [Obsolete("This endpoint is deprecated. Use GET /api/analytics/customer/{id} instead. This endpoint will be removed in v2.0.")]
    [HttpGet("{id}/stats")]
    [ProducesResponseType(typeof(object), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public IActionResult GetCustomerStats(Guid id)
    {
        var customer = DataStore.GetCustomers().FirstOrDefault(c => c.Id == id);
        if (customer == null)
            return NotFound(new { message = "Customer not found" });

        return Ok(new
        {
            customerId = customer.Id,
            totalOrders = 0,
            lifetimeValue = 0.0m,
            lastOrderDate = (DateTime?)null,
            note = "This endpoint is deprecated. Please use the new Analytics API."
        });
    }

    /// <summary>
    /// Update customer email (DEPRECATED - Use PUT /api/customers/{id} instead)
    /// </summary>
    /// <param name="id">Customer ID</param>
    /// <param name="newEmail">New email address</param>
    /// <returns>Updated customer</returns>
    [Obsolete("Use PUT /api/customers/{id} with the full update model instead.")]
    [HttpPatch("{id}/email")]
    [ProducesResponseType(typeof(Customer), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public IActionResult UpdateCustomerEmail(Guid id, [FromBody] string newEmail)
    {
        var customer = DataStore.GetCustomers().FirstOrDefault(c => c.Id == id);
        if (customer == null)
            return NotFound(new { message = "Customer not found" });

        customer.Email = newEmail;
        customer.UpdatedAt = DateTime.UtcNow;

        return Ok(customer);
    }
}
