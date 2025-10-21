using Microsoft.AspNetCore.Mvc;
using SampleApi.Models;

namespace SampleApi.Controllers.Beta;

[ApiController]
[Route("api/beta/orders")]
[ApiVersion("beta")]
public class OrdersBetaController : ControllerBase
{
    /// <summary>
    /// Get all orders with advanced filtering and analytics (BETA)
    /// </summary>
    /// <param name="customerId">Filter by customer ID</param>
    /// <param name="status">Filter by order status</param>
    /// <param name="isPriority">Filter by priority status</param>
    /// <param name="minTotal">Minimum order total</param>
    /// <param name="maxTotal">Maximum order total</param>
    /// <param name="startDate">Filter orders created after this date</param>
    /// <param name="endDate">Filter orders created before this date</param>
    /// <param name="shippingMethod">Filter by shipping method</param>
    /// <param name="paymentMethod">Filter by payment method</param>
    /// <param name="sortBy">Sort field</param>
    /// <param name="sortOrder">Sort order (asc, desc)</param>
    /// <param name="page">Page number (default: 1)</param>
    /// <param name="pageSize">Page size (default: 10)</param>
    /// <returns>Paginated list of orders with metadata</returns>
    [HttpGet]
    [ProducesResponseType(typeof(object), StatusCodes.Status200OK)]
    public IActionResult GetAllOrders(
        [FromQuery] Guid? customerId = null, 
        [FromQuery] OrderStatus? status = null,
        [FromQuery] bool? isPriority = null,
        [FromQuery] decimal? minTotal = null,
        [FromQuery] decimal? maxTotal = null,
        [FromQuery] DateTime? startDate = null,
        [FromQuery] DateTime? endDate = null,
        [FromQuery] ShippingMethod? shippingMethod = null,
        [FromQuery] PaymentMethod? paymentMethod = null,
        [FromQuery] string sortBy = "createdAt",
        [FromQuery] string sortOrder = "desc",
        [FromQuery] int page = 1,
        [FromQuery] int pageSize = 10)
    {
        var orders = DataStore.GetOrders().AsQueryable();

        // Apply filters
        if (customerId.HasValue)
        {
            orders = orders.Where(o => o.CustomerId == customerId.Value);
        }

        if (status.HasValue)
        {
            orders = orders.Where(o => o.Status == status.Value);
        }

        if (isPriority.HasValue)
        {
            orders = orders.Where(o => o.IsPriority == isPriority.Value);
        }

        if (minTotal.HasValue)
        {
            orders = orders.Where(o => o.Total >= minTotal.Value);
        }

        if (maxTotal.HasValue)
        {
            orders = orders.Where(o => o.Total <= maxTotal.Value);
        }

        if (startDate.HasValue)
        {
            orders = orders.Where(o => o.CreatedAt >= startDate.Value);
        }

        if (endDate.HasValue)
        {
            orders = orders.Where(o => o.CreatedAt <= endDate.Value);
        }

        if (shippingMethod.HasValue)
        {
            orders = orders.Where(o => o.ShippingMethod == shippingMethod.Value);
        }

        if (paymentMethod.HasValue)
        {
            orders = orders.Where(o => o.PaymentMethod == paymentMethod.Value);
        }

        // Apply sorting
        orders = sortBy.ToLower() switch
        {
            "ordernumber" => sortOrder.ToLower() == "asc" 
                ? orders.OrderBy(o => o.OrderNumber) 
                : orders.OrderByDescending(o => o.OrderNumber),
            "total" => sortOrder.ToLower() == "asc" 
                ? orders.OrderBy(o => o.Total) 
                : orders.OrderByDescending(o => o.Total),
            "status" => sortOrder.ToLower() == "asc" 
                ? orders.OrderBy(o => o.Status) 
                : orders.OrderByDescending(o => o.Status),
            _ => sortOrder.ToLower() == "asc" 
                ? orders.OrderBy(o => o.CreatedAt) 
                : orders.OrderByDescending(o => o.CreatedAt)
        };

        var ordersList = orders.ToList();
        var totalCount = ordersList.Count;
        var items = ordersList.Skip((page - 1) * pageSize).Take(pageSize).ToList();

        var result = new PagedResult<Order>
        {
            Items = items,
            TotalCount = totalCount,
            Page = page,
            PageSize = pageSize
        };

        // Add metadata
        return Ok(new
        {
            data = result,
            metadata = new
            {
                filteredCount = totalCount,
                totalRevenue = ordersList.Sum(o => o.Total),
                averageOrderValue = ordersList.Any() ? ordersList.Average(o => o.Total) : 0,
                priorityCount = ordersList.Count(o => o.IsPriority)
            }
        });
    }

    /// <summary>
    /// Get order by ID with full details (BETA)
    /// </summary>
    /// <param name="id">Order ID</param>
    /// <param name="includeCustomer">Include customer details</param>
    /// <returns>Order details with optional customer information</returns>
    [HttpGet("{id}")]
    [ProducesResponseType(typeof(object), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public IActionResult GetOrderById(Guid id, [FromQuery] bool includeCustomer = false)
    {
        var order = DataStore.GetOrders().FirstOrDefault(o => o.Id == id);
        if (order == null)
            return NotFound(new { message = "Order not found", errorCode = "ORDER_NOT_FOUND" });

        if (!includeCustomer)
            return Ok(order);

        var customer = DataStore.GetCustomers().FirstOrDefault(c => c.Id == order.CustomerId);
        
        return Ok(new
        {
            order = order,
            customer = customer,
            estimatedDelivery = order.Status == OrderStatus.Shipped && order.ShippedAt.HasValue
                ? order.ShippedAt.Value.AddDays(order.ShippingMethod switch
                {
                    ShippingMethod.Overnight => 1,
                    ShippingMethod.Express => 3,
                    _ => 7
                })
                : (DateTime?)null
        });
    }

    /// <summary>
    /// Get comprehensive order analytics (BETA - Experimental)
    /// </summary>
    /// <param name="startDate">Start date for analytics</param>
    /// <param name="endDate">End date for analytics</param>
    /// <returns>Detailed order analytics</returns>
    [HttpGet("analytics/comprehensive")]
    [ProducesResponseType(typeof(object), StatusCodes.Status200OK)]
    public IActionResult GetComprehensiveAnalytics(
        [FromQuery] DateTime? startDate = null,
        [FromQuery] DateTime? endDate = null)
    {
        var orders = DataStore.GetOrders().AsQueryable();

        if (startDate.HasValue)
        {
            orders = orders.Where(o => o.CreatedAt >= startDate.Value);
        }

        if (endDate.HasValue)
        {
            orders = orders.Where(o => o.CreatedAt <= endDate.Value);
        }

        var ordersList = orders.ToList();

        return Ok(new
        {
            period = new
            {
                startDate = startDate ?? ordersList.Min(o => o.CreatedAt),
                endDate = endDate ?? ordersList.Max(o => o.CreatedAt)
            },
            summary = new
            {
                totalOrders = ordersList.Count,
                totalRevenue = ordersList.Sum(o => o.Total),
                averageOrderValue = ordersList.Any() ? ordersList.Average(o => o.Total) : 0,
                priorityOrders = ordersList.Count(o => o.IsPriority)
            },
            byStatus = ordersList.GroupBy(o => o.Status).Select(g => new
            {
                status = g.Key.ToString(),
                count = g.Count(),
                totalValue = g.Sum(o => o.Total),
                percentage = ordersList.Count > 0 ? (double)g.Count() / ordersList.Count * 100 : 0
            }),
            byShippingMethod = ordersList.GroupBy(o => o.ShippingMethod).Select(g => new
            {
                method = g.Key.ToString(),
                count = g.Count(),
                totalValue = g.Sum(o => o.Total)
            }),
            byPaymentMethod = ordersList.GroupBy(o => o.PaymentMethod).Select(g => new
            {
                method = g.Key.ToString(),
                count = g.Count(),
                totalValue = g.Sum(o => o.Total)
            }),
            revenueByDay = ordersList
                .GroupBy(o => o.CreatedAt.Date)
                .Select(g => new
                {
                    date = g.Key.ToString("yyyy-MM-dd"),
                    orders = g.Count(),
                    revenue = g.Sum(o => o.Total)
                })
                .OrderBy(x => x.date),
            topCustomers = ordersList
                .GroupBy(o => o.CustomerId)
                .Select(g => new
                {
                    customerId = g.Key,
                    orderCount = g.Count(),
                    totalSpent = g.Sum(o => o.Total)
                })
                .OrderByDescending(c => c.totalSpent)
                .Take(10)
        });
    }

    /// <summary>
    /// Bulk create orders (BETA - Experimental)
    /// </summary>
    /// <param name="requests">List of order creation requests</param>
    /// <returns>Created orders</returns>
    [HttpPost("bulk")]
    [ProducesResponseType(typeof(IEnumerable<Order>), StatusCodes.Status201Created)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    public IActionResult BulkCreateOrders([FromBody] List<CreateOrderRequest> requests)
    {
        if (requests == null || !requests.Any())
        {
            return BadRequest(new { message = "No orders provided", errorCode = "EMPTY_REQUEST" });
        }

        var createdOrders = new List<Order>();
        
        foreach (var request in requests)
        {
            if (request.Items == null || !request.Items.Any())
            {
                continue; // Skip invalid orders
            }

            var order = new Order
            {
                Id = Guid.NewGuid(),
                OrderNumber = $"ORD-{DateTime.UtcNow:yyyyMMdd}-{Guid.NewGuid().ToString()[..8].ToUpper()}",
                CustomerId = request.CustomerId,
                CreatedAt = DateTime.UtcNow,
                UpdatedAt = DateTime.UtcNow,
                Status = OrderStatus.Pending,
                Items = request.Items,
                ShippingAddress = request.ShippingAddress,
                ShippingMethod = request.ShippingMethod,
                PaymentMethod = request.PaymentMethod,
                SubTotal = request.Items.Sum(i => i.Quantity * i.UnitPrice),
                ShippingCost = 10.00m,
                Tax = request.Items.Sum(i => i.Quantity * i.UnitPrice) * 0.1m,
                Total = request.Items.Sum(i => i.Quantity * i.UnitPrice) + 10.00m + (request.Items.Sum(i => i.Quantity * i.UnitPrice) * 0.1m),
                IsPriority = request.IsPriority
            };

            DataStore.GetOrders().Add(order);
            createdOrders.Add(order);
        }

        return CreatedAtAction(nameof(GetAllOrders), new { }, createdOrders);
    }

    /// <summary>
    /// Simulate order fulfillment process (BETA - Experimental)
    /// </summary>
    /// <param name="id">Order ID</param>
    /// <returns>Order with simulated processing</returns>
    [HttpPost("{id}/fulfill")]
    [ProducesResponseType(typeof(object), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public IActionResult FulfillOrder(Guid id)
    {
        var order = DataStore.GetOrders().FirstOrDefault(o => o.Id == id);
        if (order == null)
            return NotFound(new { message = "Order not found", errorCode = "ORDER_NOT_FOUND" });

        var steps = new List<string>();

        if (order.Status == OrderStatus.Pending)
        {
            order.Status = OrderStatus.Processing;
            steps.Add("Order moved to processing");
        }

        if (order.Status == OrderStatus.Processing)
        {
            order.Status = OrderStatus.Shipped;
            order.TrackingNumber = $"TRK{Guid.NewGuid().ToString()[..12].ToUpper()}";
            order.ShippedAt = DateTime.UtcNow;
            steps.Add($"Order shipped with tracking number: {order.TrackingNumber}");
        }

        order.UpdatedAt = DateTime.UtcNow;

        return Ok(new
        {
            order = order,
            fulfillmentSteps = steps,
            estimatedDelivery = order.ShippedAt?.AddDays(order.ShippingMethod switch
            {
                ShippingMethod.Overnight => 1,
                ShippingMethod.Express => 3,
                _ => 7
            })
        });
    }

    /// <summary>
    /// Create a new order (BETA)
    /// </summary>
    /// <param name="request">Order creation details</param>
    /// <returns>Created order</returns>
    [HttpPost]
    [ProducesResponseType(typeof(Order), StatusCodes.Status201Created)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    public IActionResult CreateOrder([FromBody] CreateOrderRequest request)
    {
        if (request.Items == null || !request.Items.Any())
        {
            return BadRequest(new { message = "Order must contain at least one item", errorCode = "NO_ITEMS" });
        }

        var order = new Order
        {
            Id = Guid.NewGuid(),
            OrderNumber = $"ORD-{DateTime.UtcNow:yyyyMMdd}-{Guid.NewGuid().ToString()[..8].ToUpper()}",
            CustomerId = request.CustomerId,
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow,
            Status = OrderStatus.Pending,
            Items = request.Items,
            ShippingAddress = request.ShippingAddress,
            ShippingMethod = request.ShippingMethod,
            PaymentMethod = request.PaymentMethod,
            SubTotal = request.Items.Sum(i => i.Quantity * i.UnitPrice),
            ShippingCost = 10.00m,
            Tax = request.Items.Sum(i => i.Quantity * i.UnitPrice) * 0.1m,
            Total = request.Items.Sum(i => i.Quantity * i.UnitPrice) + 10.00m + (request.Items.Sum(i => i.Quantity * i.UnitPrice) * 0.1m),
            IsPriority = request.IsPriority
        };

        DataStore.GetOrders().Add(order);
        return CreatedAtAction(nameof(GetOrderById), new { id = order.Id }, order);
    }

    /// <summary>
    /// Update order status (BETA)
    /// </summary>
    /// <param name="id">Order ID</param>
    /// <param name="request">Status update details</param>
    /// <returns>Updated order</returns>
    [HttpPatch("{id}/status")]
    [ProducesResponseType(typeof(Order), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public IActionResult UpdateOrderStatus(Guid id, [FromBody] UpdateOrderStatusRequest request)
    {
        var order = DataStore.GetOrders().FirstOrDefault(o => o.Id == id);
        if (order == null)
            return NotFound(new { message = "Order not found", errorCode = "ORDER_NOT_FOUND" });

        order.Status = request.Status;
        if (!string.IsNullOrEmpty(request.TrackingNumber))
        {
            order.TrackingNumber = request.TrackingNumber;
        }
        order.UpdatedAt = DateTime.UtcNow;

        if (request.Status == OrderStatus.Shipped && !order.ShippedAt.HasValue)
        {
            order.ShippedAt = DateTime.UtcNow;
        }

        return Ok(order);
    }

    /// <summary>
    /// Delete an order (BETA)
    /// </summary>
    /// <param name="id">Order ID</param>
    /// <returns>No content</returns>
    [HttpDelete("{id}")]
    [ProducesResponseType(StatusCodes.Status204NoContent)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public IActionResult DeleteOrder(Guid id)
    {
        var order = DataStore.GetOrders().FirstOrDefault(o => o.Id == id);
        if (order == null)
            return NotFound(new { message = "Order not found", errorCode = "ORDER_NOT_FOUND" });

        DataStore.GetOrders().Remove(order);
        return NoContent();
    }
}
