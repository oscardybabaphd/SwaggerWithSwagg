using Microsoft.AspNetCore.Mvc;
using SampleApi.Models;

namespace SampleApi.Controllers.Beta;

[ApiController]
[Route("api/beta/customers")]
[ApiVersion("beta")]
public class CustomersBetaController : ControllerBase
{
    /// <summary>
    /// Get all customers with advanced filtering (BETA)
    /// </summary>
    /// <param name="status">Filter by customer status</param>
    /// <param name="subscriptionTier">Filter by subscription tier</param>
    /// <param name="search">Search in name, email, phone</param>
    /// <param name="minCreatedDate">Filter by minimum creation date</param>
    /// <param name="maxCreatedDate">Filter by maximum creation date</param>
    /// <param name="sortBy">Sort field (firstName, lastName, email, createdAt)</param>
    /// <param name="sortOrder">Sort order (asc, desc)</param>
    /// <param name="page">Page number (default: 1)</param>
    /// <param name="pageSize">Page size (default: 10)</param>
    /// <returns>Paginated list of customers with advanced filtering</returns>
    [HttpGet]
    [ProducesResponseType(typeof(PagedResult<Customer>), StatusCodes.Status200OK)]
    public IActionResult GetAllCustomers(
        [FromQuery] CustomerStatus? status = null, 
        [FromQuery] SubscriptionTier? subscriptionTier = null,
        [FromQuery] string? search = null,
        [FromQuery] DateTime? minCreatedDate = null,
        [FromQuery] DateTime? maxCreatedDate = null,
        [FromQuery] string sortBy = "createdAt",
        [FromQuery] string sortOrder = "desc",
        [FromQuery] int page = 1,
        [FromQuery] int pageSize = 10)
    {
        var customers = DataStore.GetCustomers().AsQueryable();

        // Apply filters
        if (status.HasValue)
        {
            customers = customers.Where(c => c.Status == status.Value);
        }

        if (subscriptionTier.HasValue)
        {
            customers = customers.Where(c => c.SubscriptionTier == subscriptionTier.Value);
        }

        if (!string.IsNullOrWhiteSpace(search))
        {
            customers = customers.Where(c => 
                c.FirstName.Contains(search, StringComparison.OrdinalIgnoreCase) ||
                c.LastName.Contains(search, StringComparison.OrdinalIgnoreCase) ||
                c.Email.Contains(search, StringComparison.OrdinalIgnoreCase) ||
                (c.PhoneNumber != null && c.PhoneNumber.Contains(search)));
        }

        if (minCreatedDate.HasValue)
        {
            customers = customers.Where(c => c.CreatedAt >= minCreatedDate.Value);
        }

        if (maxCreatedDate.HasValue)
        {
            customers = customers.Where(c => c.CreatedAt <= maxCreatedDate.Value);
        }

        // Apply sorting
        customers = sortBy.ToLower() switch
        {
            "firstname" => sortOrder.ToLower() == "asc" 
                ? customers.OrderBy(c => c.FirstName) 
                : customers.OrderByDescending(c => c.FirstName),
            "lastname" => sortOrder.ToLower() == "asc" 
                ? customers.OrderBy(c => c.LastName) 
                : customers.OrderByDescending(c => c.LastName),
            "email" => sortOrder.ToLower() == "asc" 
                ? customers.OrderBy(c => c.Email) 
                : customers.OrderByDescending(c => c.Email),
            _ => sortOrder.ToLower() == "asc" 
                ? customers.OrderBy(c => c.CreatedAt) 
                : customers.OrderByDescending(c => c.CreatedAt)
        };

        var customersList = customers.ToList();
        var totalCount = customersList.Count;
        var items = customersList.Skip((page - 1) * pageSize).Take(pageSize).ToList();

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
    /// Get customer by ID with related data (BETA)
    /// </summary>
    /// <param name="id">Customer unique identifier</param>
    /// <param name="includeOrders">Include customer orders</param>
    /// <returns>Customer details with optional related data</returns>
    [HttpGet("{id}")]
    [ProducesResponseType(typeof(object), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public IActionResult GetCustomerById(Guid id, [FromQuery] bool includeOrders = false)
    {
        var customer = DataStore.GetCustomers().FirstOrDefault(c => c.Id == id);
        if (customer == null)
            return NotFound(new { message = "Customer not found", errorCode = "CUSTOMER_NOT_FOUND" });

        if (!includeOrders)
            return Ok(customer);

        var orders = DataStore.GetOrders().Where(o => o.CustomerId == id).ToList();
        
        return Ok(new
        {
            customer = customer,
            orders = orders,
            ordersSummary = new
            {
                totalOrders = orders.Count,
                totalSpent = orders.Sum(o => o.Total),
                pendingOrders = orders.Count(o => o.Status == OrderStatus.Pending),
                completedOrders = orders.Count(o => o.Status == OrderStatus.Delivered)
            }
        });
    }

    /// <summary>
    /// Bulk create customers (BETA - Experimental)
    /// </summary>
    /// <param name="requests">List of customer creation requests</param>
    /// <returns>Created customers</returns>
    [HttpPost("bulk")]
    [ProducesResponseType(typeof(IEnumerable<Customer>), StatusCodes.Status201Created)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    public IActionResult BulkCreateCustomers([FromBody] List<CreateCustomerRequest> requests)
    {
        if (requests == null || !requests.Any())
        {
            return BadRequest(new { message = "No customers provided", errorCode = "EMPTY_REQUEST" });
        }

        var createdCustomers = new List<Customer>();
        
        foreach (var request in requests)
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
            createdCustomers.Add(customer);
        }

        return CreatedAtAction(nameof(GetAllCustomers), new { }, createdCustomers);
    }

    /// <summary>
    /// Export customers to CSV format (BETA - Experimental)
    /// </summary>
    /// <param name="status">Filter by customer status</param>
    /// <returns>CSV data</returns>
    [HttpGet("export/csv")]
    [ProducesResponseType(typeof(string), StatusCodes.Status200OK)]
    [Produces("text/csv")]
    public IActionResult ExportToCSV([FromQuery] CustomerStatus? status = null)
    {
        var customers = DataStore.GetCustomers();

        if (status.HasValue)
        {
            customers = customers.Where(c => c.Status == status.Value).ToList();
        }

        var csv = "Id,FirstName,LastName,Email,PhoneNumber,Status,SubscriptionTier,CreatedAt\n";
        foreach (var customer in customers)
        {
            csv += $"{customer.Id},{customer.FirstName},{customer.LastName},{customer.Email}," +
                   $"{customer.PhoneNumber},{customer.Status},{customer.SubscriptionTier},{customer.CreatedAt:yyyy-MM-dd}\n";
        }

        return Content(csv, "text/csv");
    }

    /// <summary>
    /// Get customer analytics (BETA - Experimental)
    /// </summary>
    /// <returns>Customer analytics and insights</returns>
    [HttpGet("analytics")]
    [ProducesResponseType(typeof(object), StatusCodes.Status200OK)]
    public IActionResult GetCustomerAnalytics()
    {
        var customers = DataStore.GetCustomers();
        var orders = DataStore.GetOrders();

        return Ok(new
        {
            totalCustomers = customers.Count,
            customersByStatus = customers.GroupBy(c => c.Status).Select(g => new
            {
                status = g.Key.ToString(),
                count = g.Count()
            }),
            customersByTier = customers.GroupBy(c => c.SubscriptionTier).Select(g => new
            {
                tier = g.Key.ToString(),
                count = g.Count()
            }),
            customersWithOrders = orders.Select(o => o.CustomerId).Distinct().Count(),
            averageOrdersPerCustomer = customers.Count > 0 
                ? (double)orders.Count / customers.Count 
                : 0,
            topSpendingCustomers = customers.Select(c => new
            {
                customerId = c.Id,
                name = $"{c.FirstName} {c.LastName}",
                email = c.Email,
                totalSpent = orders.Where(o => o.CustomerId == c.Id).Sum(o => o.Total),
                orderCount = orders.Count(o => o.CustomerId == c.Id)
            })
            .OrderByDescending(c => c.totalSpent)
            .Take(5)
        });
    }

    /// <summary>
    /// Create a new customer (BETA)
    /// </summary>
    /// <param name="request">Customer creation details</param>
    /// <returns>Created customer</returns>
    [HttpPost]
    [ProducesResponseType(typeof(Customer), StatusCodes.Status201Created)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    public IActionResult CreateCustomer([FromBody] CreateCustomerRequest request)
    {
        // BETA: Enhanced email validation
        if (!request.Email.Contains("@") || !request.Email.Contains("."))
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
    /// Update an existing customer (BETA)
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
    /// Delete a customer (BETA)
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
