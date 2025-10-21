using Microsoft.AspNetCore.Mvc;
using SampleApi.Models;

namespace SampleApi.Controllers;

[ApiController]
[Route("api/[controller]")]
[ApiVersion("v1")]
public class OrdersController : ControllerBase
{
    /// <summary>
    /// Get all orders
    /// </summary>
    /// <param name="customerId">Filter by customer ID</param>
    /// <param name="status">Filter by order status</param>
    /// <returns>List of orders</returns>
    [HttpGet]
    [ProducesResponseType(typeof(IEnumerable<Order>), StatusCodes.Status200OK)]
    public IActionResult GetAllOrders([FromQuery] Guid? customerId = null, [FromQuery] OrderStatus? status = null)
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

        return Ok(orders);
    }

    /// <summary>
    /// Get order by ID
    /// </summary>
    /// <param name="id">Order ID</param>
    /// <returns>Order details</returns>
    [HttpGet("{id}")]
    [ProducesResponseType(typeof(Order), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public IActionResult GetOrderById(Guid id)
    {
        var order = DataStore.GetOrders().FirstOrDefault(o => o.Id == id);
        return order != null ? Ok(order) : NotFound(new { message = "Order not found" });
    }

    /// <summary>
    /// Get orders by status using enum parameter
    /// </summary>
    /// <param name="status">Order status to filter by</param>
    /// <returns>List of orders with the specified status</returns>
    [HttpGet("by-status/{status}")]
    [ProducesResponseType(typeof(IEnumerable<Order>), StatusCodes.Status200OK)]
    public IActionResult GetOrdersByStatus(OrderStatus status)
    {
        var orders = DataStore.GetOrders().Where(o => o.Status == status).ToList();
        return Ok(orders);
    }

    /// <summary>
    /// Get orders filtered by priority status
    /// </summary>
    /// <param name="isPriority">Whether to filter for priority orders (true) or non-priority orders (false)</param>
    /// <returns>List of orders filtered by priority status</returns>
    [HttpGet("by-priority")]
    [ProducesResponseType(typeof(IEnumerable<Order>), StatusCodes.Status200OK)]
    public IActionResult GetOrdersByPriority([FromQuery] bool isPriority)
    {
        var orders = DataStore.GetOrders().Where(o => o.IsPriority == isPriority).ToList();
        return Ok(orders);
    }

    /// <summary>
    /// Create a new order
    /// </summary>
    /// <param name="request">Order creation details</param>
    /// <returns>Created order</returns>
    [HttpPost]
    [ProducesResponseType(typeof(Order), StatusCodes.Status201Created)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    public IActionResult CreateOrder([FromBody] CreateOrderRequest request)
    {
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
    /// Update order status
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
            return NotFound(new { message = "Order not found" });

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
    /// Delete an order
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
            return NotFound(new { message = "Order not found" });

        DataStore.GetOrders().Remove(order);
        return NoContent();
    }
}
