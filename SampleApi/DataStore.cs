using SampleApi.Models;

namespace SampleApi;

public static class DataStore
{
    private static List<Customer> _customers = new List<Customer>
    {
        new Customer
        {
            Id = Guid.Parse("11111111-1111-1111-1111-111111111111"),
            FirstName = "John",
            LastName = "Doe",
            Email = "john.doe@example.com",
            PhoneNumber = "+1-555-0100",
            DateOfBirth = new DateOnly(1990, 5, 15),
            Status = CustomerStatus.Active,
            SubscriptionTier = SubscriptionTier.Premium,
            Address = new Address
            {
                Street = "123 Main St",
                City = "New York",
                State = "NY",
                PostalCode = "10001",
                Country = "USA"
            },
            CreatedAt = DateTime.UtcNow.AddYears(-2),
            UpdatedAt = DateTime.UtcNow.AddDays(-10)
        }
    };

    private static List<Order> _orders = new List<Order>
    {
        new Order
        {
            Id = Guid.Parse("22222222-2222-2222-2222-222222222222"),
            OrderNumber = "ORD-20250101-ABC12345",
            CustomerId = Guid.Parse("11111111-1111-1111-1111-111111111111"),
            CreatedAt = DateTime.UtcNow.AddDays(-5),
            UpdatedAt = DateTime.UtcNow.AddDays(-2),
            Status = OrderStatus.Processing,
            Items = new List<OrderItem>
            {
                new OrderItem
                {
                    ProductId = Guid.Parse("55555555-5555-5555-5555-555555555555"),
                    ProductName = "Premium Widget",
                    Quantity = 2,
                    UnitPrice = 149.99m
                }
            },
            SubTotal = 299.98m,
            ShippingCost = 15.00m,
            Tax = 29.99m,
            Total = 344.97m,
            ShippingAddress = new Address
            {
                Street = "123 Main St",
                City = "New York",
                State = "NY",
                PostalCode = "10001",
                Country = "USA"
            },
            ShippingMethod = ShippingMethod.Express,
            PaymentMethod = PaymentMethod.CreditCard
        }
    };

    private static List<Product> _products = new List<Product>
    {
        new Product
        {
            Id = Guid.Parse("55555555-5555-5555-5555-555555555555"),
            Name = "Premium Widget",
            Description = "A high-quality widget for professional use",
            Category = "Electronics",
            Price = 149.99m,
            Sku = "WIDGET-PREM-001",
            StockQuantity = 50,
            Weight = 2.5m,
            Dimensions = new ProductDimensions { Length = 10, Width = 8, Height = 6 },
            Tags = new List<string> { "premium", "electronics", "bestseller" },
            IsActive = true,
            CreatedAt = DateTime.UtcNow.AddMonths(-6),
            UpdatedAt = DateTime.UtcNow.AddDays(-1)
        }
    };

    public static List<Customer> GetCustomers() => _customers;
    public static List<Order> GetOrders() => _orders;
    public static List<Product> GetProducts() => _products;
}
