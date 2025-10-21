using Microsoft.AspNetCore.Mvc;
using SampleApi.Models;

namespace SampleApi.Controllers.V2;

[ApiController]
[Route("api/v2/orders")]
[ApiVersion("v2")]
public class OrdersV2Controller : ControllerBase
{
    /// <summary>
    /// Get all orders with pagination (V2)
    /// </summary>
    /// <param name="customerId">Filter by customer ID</param>
    /// <param name="status">Filter by order status</param>
    /// <param name="isPriority">Filter by priority status</param>
    /// <param name="page">Page number (default: 1)</param>
    /// <param name="pageSize">Page size (default: 10)</param>
    /// <returns>Paginated list of orders</returns>
    [HttpGet]
    [ProducesResponseType(typeof(PagedResult<Order>), StatusCodes.Status200OK)]
    public IActionResult GetAllOrders(
        [FromQuery] Guid? customerId = null, 
        [FromQuery] OrderStatus? status = null,
        [FromQuery] bool? isPriority = null,
        [FromQuery] int page = 1,
        [FromQuery] int pageSize = 10)
    {
        var orders = DataStore.GetOrders();

        if (customerId.HasValue)
        {
            orders = orders.Where(o => o.CustomerId == customerId.Value).ToList();
        }

        if (status.HasValue)
        {
            orders = orders.Where(o => o.Status == status.Value).ToList();
        }

        if (isPriority.HasValue)
        {
            orders = orders.Where(o => o.IsPriority == isPriority.Value).ToList();
        }

        var totalCount = orders.Count;
        var items = orders.Skip((page - 1) * pageSize).Take(pageSize).ToList();

        var result = new PagedResult<Order>
        {
            Items = items,
            TotalCount = totalCount,
            Page = page,
            PageSize = pageSize
        };

        return Ok(result);
    }

    /// <summary>
    /// Get order by ID (V2)
    /// </summary>
    /// <param name="id">Order ID</param>
    /// <returns>Order details with enhanced information</returns>
    [HttpGet("{id}")]
    [ProducesResponseType(typeof(Order), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public IActionResult GetOrderById(Guid id)
    {
        var order = DataStore.GetOrders().FirstOrDefault(o => o.Id == id);
        return order != null ? Ok(order) : NotFound(new { message = "Order not found", errorCode = "ORDER_NOT_FOUND" });
    }

    /// <summary>
    /// Get orders by status with count (V2)
    /// </summary>
    /// <param name="status">Order status to filter by</param>
    /// <returns>Orders with metadata</returns>
    [HttpGet("by-status/{status}")]
    [ProducesResponseType(typeof(object), StatusCodes.Status200OK)]
    public IActionResult GetOrdersByStatus(OrderStatus status)
    {
        var orders = DataStore.GetOrders().Where(o => o.Status == status).ToList();
        return Ok(new 
        { 
            status = status.ToString(),
            count = orders.Count,
            totalValue = orders.Sum(o => o.Total),
            orders = orders 
        });
    }

    /// <summary>
    /// Get orders filtered by priority status (V2)
    /// </summary>
    /// <param name="isPriority">Whether to filter for priority orders</param>
    /// <returns>Orders with summary information</returns>
    [HttpGet("by-priority")]
    [ProducesResponseType(typeof(object), StatusCodes.Status200OK)]
    public IActionResult GetOrdersByPriority([FromQuery] bool isPriority)
    {
        var orders = DataStore.GetOrders().Where(o => o.IsPriority == isPriority).ToList();
        return Ok(new 
        { 
            isPriority = isPriority,
            count = orders.Count,
            averageTotal = orders.Any() ? orders.Average(o => o.Total) : 0,
            orders = orders 
        });
    }

    /// <summary>
    /// Get order statistics (V2)
    /// </summary>
    /// <returns>Order statistics and metrics</returns>
    [HttpGet("statistics")]
    [ProducesResponseType(typeof(object), StatusCodes.Status200OK)]
    public IActionResult GetOrderStatistics()
    {
        var orders = DataStore.GetOrders();
        
        return Ok(new
        {
            totalOrders = orders.Count,
            totalRevenue = orders.Sum(o => o.Total),
            averageOrderValue = orders.Any() ? orders.Average(o => o.Total) : 0,
            priorityOrders = orders.Count(o => o.IsPriority),
            ordersByStatus = orders.GroupBy(o => o.Status).Select(g => new
            {
                status = g.Key.ToString(),
                count = g.Count(),
                totalValue = g.Sum(o => o.Total)
            })
        });
    }

    /// <summary>
    /// Create a new order (V2)
    /// </summary>
    /// <param name="request">Order creation details</param>
    /// <returns>Created order</returns>
    [HttpPost]
    [ProducesResponseType(typeof(Order), StatusCodes.Status201Created)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    public IActionResult CreateOrder([FromBody] CreateOrderRequest request)
    {
        // V2: Add validation for items
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
    /// Update order status (V2)
    /// </summary>
    /// <param name="id">Order ID</param>
    /// <param name="request">Status update details</param>
    /// <returns>Updated order</returns>
    [HttpPatch("{id}/status")]
    [ProducesResponseType(typeof(Order), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    public IActionResult UpdateOrderStatus(Guid id, [FromBody] UpdateOrderStatusRequest request)
    {
        var order = DataStore.GetOrders().FirstOrDefault(o => o.Id == id);
        if (order == null)
            return NotFound(new { message = "Order not found", errorCode = "ORDER_NOT_FOUND" });

        // V2: Add validation for status transitions
        if (request.Status == OrderStatus.Shipped && string.IsNullOrEmpty(request.TrackingNumber))
        {
            return BadRequest(new { message = "Tracking number is required for shipped orders", errorCode = "MISSING_TRACKING" });
        }

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
    /// Cancel an order (V2)
    /// </summary>
    /// <param name="id">Order ID</param>
    /// <param name="reason">Cancellation reason</param>
    /// <returns>Cancelled order</returns>
    [HttpPost("{id}/cancel")]
    [ProducesResponseType(typeof(Order), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    public IActionResult CancelOrder(Guid id, [FromBody] string? reason = null)
    {
        var order = DataStore.GetOrders().FirstOrDefault(o => o.Id == id);
        if (order == null)
            return NotFound(new { message = "Order not found", errorCode = "ORDER_NOT_FOUND" });

        if (order.Status == OrderStatus.Delivered)
        {
            return BadRequest(new { message = "Cannot cancel a delivered order", errorCode = "ALREADY_DELIVERED" });
        }

        order.Status = OrderStatus.Cancelled;
        order.UpdatedAt = DateTime.UtcNow;

        return Ok(order);
    }

    /// <summary>
    /// Delete an order (V2)
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
