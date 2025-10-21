namespace SampleApi.Models;

/// <summary>
/// Customer entity
/// </summary>
public class Customer
{
    /// <summary>
    /// Unique identifier for the customer
    /// </summary>
    public Guid Id { get; set; }

    /// <summary>
    /// Customer's first name
    /// </summary>
    public required string FirstName { get; set; }

    /// <summary>
    /// Customer's last name
    /// </summary>
    public required string LastName { get; set; }

    /// <summary>
    /// Customer's email address (must be unique)
    /// </summary>
    public required string Email { get; set; }

    /// <summary>
    /// Customer's phone number in international format
    /// </summary>
    public string? PhoneNumber { get; set; }

    /// <summary>
    /// Customer's date of birth
    /// </summary>
    public DateOnly? DateOfBirth { get; set; }

    /// <summary>
    /// Current status of the customer account
    /// </summary>
    public CustomerStatus Status { get; set; }

    /// <summary>
    /// Customer's subscription tier level
    /// </summary>
    public SubscriptionTier SubscriptionTier { get; set; }

    /// <summary>
    /// Customer's physical address
    /// </summary>
    public Address? Address { get; set; }

    /// <summary>
    /// Timestamp when the customer account was created
    /// </summary>
    public DateTime CreatedAt { get; set; }

    /// <summary>
    /// Timestamp when the customer account was last updated
    /// </summary>
    public DateTime UpdatedAt { get; set; }
}

/// <summary>
/// Request model for creating a new customer
/// </summary>
public class CreateCustomerRequest
{
    /// <summary>
    /// Customer's first name (required)
    /// </summary>
    public required string FirstName { get; set; }

    /// <summary>
    /// Customer's last name (required)
    /// </summary>
    public required string LastName { get; set; }

    /// <summary>
    /// Customer's email address (required, must be unique and valid)
    /// </summary>
    public required string Email { get; set; }

    /// <summary>
    /// Customer's phone number (optional)
    /// </summary>
    public string? PhoneNumber { get; set; }

    /// <summary>
    /// Customer's date of birth (optional)
    /// </summary>
    public DateOnly? DateOfBirth { get; set; }

    /// <summary>
    /// Initial subscription tier (defaults to Free)
    /// </summary>
    public SubscriptionTier SubscriptionTier { get; set; } = SubscriptionTier.Free;

    /// <summary>
    /// Customer's physical address (optional)
    /// </summary>
    public Address? Address { get; set; }
}

/// <summary>
/// Request model for updating customer information
/// </summary>
public class UpdateCustomerRequest
{
    /// <summary>
    /// Updated first name (optional)
    /// </summary>
    public string? FirstName { get; set; }

    /// <summary>
    /// Updated last name (optional)
    /// </summary>
    public string? LastName { get; set; }

    /// <summary>
    /// Updated phone number (optional)
    /// </summary>
    public string? PhoneNumber { get; set; }

    /// <summary>
    /// Updated customer status (optional)
    /// </summary>
    public CustomerStatus? Status { get; set; }

    /// <summary>
    /// Updated subscription tier (optional)
    /// </summary>
    public SubscriptionTier? SubscriptionTier { get; set; }

    /// <summary>
    /// Updated address (optional)
    /// </summary>
    public Address? Address { get; set; }
}

/// <summary>
/// Physical address information
/// </summary>
public class Address
{
    /// <summary>
    /// Street address line 1
    /// </summary>
    public required string Street { get; set; }

    /// <summary>
    /// Street address line 2 (apartment, suite, etc.)
    /// </summary>
    public string? Street2 { get; set; }

    /// <summary>
    /// City name
    /// </summary>
    public required string City { get; set; }

    /// <summary>
    /// State or province code (e.g., "CA", "NY")
    /// </summary>
    public required string State { get; set; }

    /// <summary>
    /// Postal or ZIP code
    /// </summary>
    public required string PostalCode { get; set; }

    /// <summary>
    /// Country code (ISO 3166-1 alpha-2, e.g., "US", "CA")
    /// </summary>
    public required string Country { get; set; }
}

/// <summary>
/// Customer account status
/// </summary>
public enum CustomerStatus
{
    /// <summary>
    /// Customer account is active and in good standing
    /// </summary>
    Active = 0,

    /// <summary>
    /// Customer account is temporarily inactive
    /// </summary>
    Inactive = 1,

    /// <summary>
    /// Customer account is suspended due to policy violation
    /// </summary>
    Suspended = 2,

    /// <summary>
    /// Customer account is pending verification
    /// </summary>
    Pending = 3
}

/// <summary>
/// Subscription tier levels
/// </summary>
public enum SubscriptionTier
{
    /// <summary>
    /// Free tier with basic features
    /// </summary>
    Free = 0,

    /// <summary>
    /// Basic paid tier with additional features
    /// </summary>
    Basic = 1,

    /// <summary>
    /// Premium tier with advanced features
    /// </summary>
    Premium = 2,

    /// <summary>
    /// Enterprise tier with all features and priority support
    /// </summary>
    Enterprise = 3
}



/// <summary>
/// Represents a customer order
/// </summary>
public class Order
{
    /// <summary>
    /// Unique identifier for the order
    /// </summary>
    public Guid Id { get; set; }

    /// <summary>
    /// Human-readable order number (e.g., "ORD-20240101-1234")
    /// </summary>
    public required string OrderNumber { get; set; }

    /// <summary>
    /// ID of the customer who placed the order
    /// </summary>
    public Guid CustomerId { get; set; }

    /// <summary>
    /// List of items in the order
    /// </summary>
    public required List<OrderItem> Items { get; set; }

    /// <summary>
    /// Subtotal amount before tax and shipping
    /// </summary>
    public decimal SubTotal { get; set; }

    /// <summary>
    /// Tax amount
    /// </summary>
    public decimal Tax { get; set; }

    /// <summary>
    /// Shipping cost
    /// </summary>
    public decimal ShippingCost { get; set; }

    /// <summary>
    /// Total amount including tax and shipping
    /// </summary>
    public decimal Total { get; set; }

    /// <summary>
    /// Current status of the order
    /// </summary>
    public OrderStatus Status { get; set; }

    /// <summary>
    /// Shipping address for delivery
    /// </summary>
    public required Address ShippingAddress { get; set; }

    /// <summary>
    /// Selected shipping method
    /// </summary>
    public ShippingMethod ShippingMethod { get; set; }

    /// <summary>
    /// Payment method used
    /// </summary>
    public PaymentMethod PaymentMethod { get; set; }

    /// <summary>
    /// Tracking number for shipped orders
    /// </summary>
    public string? TrackingNumber { get; set; }

    /// <summary>
    /// Timestamp when the order was created
    /// </summary>
    public DateTime CreatedAt { get; set; }

    /// <summary>
    /// Timestamp when the order was last updated
    /// </summary>
    public DateTime UpdatedAt { get; set; }

    /// <summary>
    /// Timestamp when the order was shipped (null if not shipped)
    /// </summary>
    public DateTime? ShippedAt { get; set; }

    /// <summary>
    /// Whether this is a priority order (expedited processing)
    /// </summary>
    public bool IsPriority { get; set; }
}

/// <summary>
/// Represents an item in an order
/// </summary>
public class OrderItem
{
    /// <summary>
    /// ID of the product
    /// </summary>
    public Guid ProductId { get; set; }

    /// <summary>
    /// Product name at time of order
    /// </summary>
    public required string ProductName { get; set; }

    /// <summary>
    /// Quantity ordered
    /// </summary>
    public int Quantity { get; set; }

    /// <summary>
    /// Unit price at time of order
    /// </summary>
    public decimal UnitPrice { get; set; }
}

/// <summary>
/// Request model for creating a new order
/// </summary>
public class CreateOrderRequest
{
    /// <summary>
    /// ID of the customer placing the order
    /// </summary>
    public Guid CustomerId { get; set; }

    /// <summary>
    /// List of items to order (at least one required)
    /// </summary>
    public required List<OrderItem> Items { get; set; }

    /// <summary>
    /// Shipping address for delivery
    /// </summary>
    public required Address ShippingAddress { get; set; }

    /// <summary>
    /// Desired shipping method
    /// </summary>
    public ShippingMethod ShippingMethod { get; set; }

    /// <summary>
    /// Payment method to use
    /// </summary>
    public PaymentMethod PaymentMethod { get; set; }

    /// <summary>
    /// Whether this is a priority order (default: false)
    /// </summary>
    public bool IsPriority { get; set; }
}

/// <summary>
/// Request model for updating order status
/// </summary>
public class UpdateOrderStatusRequest
{
    /// <summary>
    /// New status for the order
    /// </summary>
    public OrderStatus Status { get; set; }

    /// <summary>
    /// Tracking number (required when status is Shipped)
    /// </summary>
    public string? TrackingNumber { get; set; }
}

/// <summary>
/// Order status values
/// </summary>
public enum OrderStatus
{
    /// <summary>
    /// Order has been placed and is awaiting processing
    /// </summary>
    Pending = 0,

    /// <summary>
    /// Order is being processed and prepared for shipment
    /// </summary>
    Processing = 1,

    /// <summary>
    /// Order has been shipped and is in transit
    /// </summary>
    Shipped = 2,

    /// <summary>
    /// Order has been delivered to the customer
    /// </summary>
    Delivered = 3,

    /// <summary>
    /// Order has been cancelled
    /// </summary>
    Cancelled = 4,

    /// <summary>
    /// Order has been returned by the customer
    /// </summary>
    Returned = 5
}

/// <summary>
/// Available shipping methods
/// </summary>
public enum ShippingMethod
{
    /// <summary>
    /// Standard shipping (5-7 business days)
    /// </summary>
    Standard = 0,

    /// <summary>
    /// Express shipping (2-3 business days)
    /// </summary>
    Express = 1,

    /// <summary>
    /// Overnight shipping (next business day)
    /// </summary>
    Overnight = 2
}

/// <summary>
/// Available payment methods
/// </summary>
public enum PaymentMethod
{
    /// <summary>
    /// Credit card payment
    /// </summary>
    CreditCard = 0,

    /// <summary>
    /// Debit card payment
    /// </summary>
    DebitCard = 1,

    /// <summary>
    /// PayPal payment
    /// </summary>
    PayPal = 2,

    /// <summary>
    /// Bank transfer
    /// </summary>
    BankTransfer = 3
}



/// <summary>
/// Represents a product in the catalog
/// </summary>
public class Product
{
    /// <summary>
    /// Unique identifier for the product
    /// </summary>
    public Guid Id { get; set; }

    /// <summary>
    /// Product name
    /// </summary>
    public required string Name { get; set; }

    /// <summary>
    /// Detailed product description
    /// </summary>
    public string? Description { get; set; }

    /// <summary>
    /// Product category
    /// </summary>
    public required string Category { get; set; }

    /// <summary>
    /// Product price in USD
    /// </summary>
    public decimal Price { get; set; }

    /// <summary>
    /// Stock keeping unit (unique identifier for inventory)
    /// </summary>
    public required string Sku { get; set; }

    /// <summary>
    /// Current stock quantity available
    /// </summary>
    public int StockQuantity { get; set; }

    /// <summary>
    /// Product weight in pounds
    /// </summary>
    public decimal? Weight { get; set; }

    /// <summary>
    /// Product dimensions (length x width x height in inches)
    /// </summary>
    public ProductDimensions? Dimensions { get; set; }

    /// <summary>
    /// Product tags for search and categorization
    /// </summary>
    public List<string>? Tags { get; set; }

    /// <summary>
    /// Whether the product is active and available for purchase
    /// </summary>
    public bool IsActive { get; set; }

    /// <summary>
    /// Timestamp when the product was created
    /// </summary>
    public DateTime CreatedAt { get; set; }

    /// <summary>
    /// Timestamp when the product was last updated
    /// </summary>
    public DateTime UpdatedAt { get; set; }
}

/// <summary>
/// Product dimensions
/// </summary>
public class ProductDimensions
{
    /// <summary>
    /// Length in inches
    /// </summary>
    public decimal Length { get; set; }

    /// <summary>
    /// Width in inches
    /// </summary>
    public decimal Width { get; set; }

    /// <summary>
    /// Height in inches
    /// </summary>
    public decimal Height { get; set; }
}

/// <summary>
/// Request model for creating a new product
/// </summary>
public class CreateProductRequest
{
    /// <summary>
    /// Product name (required)
    /// </summary>
    public required string Name { get; set; }

    /// <summary>
    /// Product description (optional)
    /// </summary>
    public string? Description { get; set; }

    /// <summary>
    /// Product category (required)
    /// </summary>
    public required string Category { get; set; }

    /// <summary>
    /// Product price in USD (required, must be positive)
    /// </summary>
    public decimal Price { get; set; }

    /// <summary>
    /// Stock keeping unit (required, must be unique)
    /// </summary>
    public required string Sku { get; set; }

    /// <summary>
    /// Initial stock quantity (defaults to 0)
    /// </summary>
    public int StockQuantity { get; set; }

    /// <summary>
    /// Product weight in pounds (optional)
    /// </summary>
    public decimal? Weight { get; set; }

    /// <summary>
    /// Product dimensions (optional)
    /// </summary>
    public ProductDimensions? Dimensions { get; set; }

    /// <summary>
    /// Product tags (optional)
    /// </summary>
    public List<string>? Tags { get; set; }
}



/// <summary>
/// Sales analytics data
/// </summary>
public class SalesAnalytics
{
    /// <summary>
    /// Total revenue in the period
    /// </summary>
    public decimal TotalRevenue { get; set; }

    /// <summary>
    /// Total number of orders
    /// </summary>
    public int TotalOrders { get; set; }

    /// <summary>
    /// Average order value
    /// </summary>
    public decimal AverageOrderValue { get; set; }

    /// <summary>
    /// List of top selling products
    /// </summary>
    public required List<TopProduct> TopSellingProducts { get; set; }

    /// <summary>
    /// Revenue breakdown by time period
    /// </summary>
    public required List<RevenueData> RevenueByPeriod { get; set; }

    /// <summary>
    /// Start date of the analytics period
    /// </summary>
    public DateTime StartDate { get; set; }

    /// <summary>
    /// End date of the analytics period
    /// </summary>
    public DateTime EndDate { get; set; }

    /// <summary>
    /// How the data is grouped (day, week, month)
    /// </summary>
    public AnalyticsGroupBy GroupBy { get; set; }
}

/// <summary>
/// Top selling product information
/// </summary>
public class TopProduct
{
    /// <summary>
    /// Product name
    /// </summary>
    public required string ProductName { get; set; }

    /// <summary>
    /// Total units sold
    /// </summary>
    public int UnitsSold { get; set; }

    /// <summary>
    /// Total revenue from this product
    /// </summary>
    public decimal Revenue { get; set; }
}

/// <summary>
/// Revenue data for a specific period
/// </summary>
public class RevenueData
{
    /// <summary>
    /// Period identifier (date string)
    /// </summary>
    public required string Period { get; set; }

    /// <summary>
    /// Revenue for this period
    /// </summary>
    public decimal Revenue { get; set; }

    /// <summary>
    /// Number of orders in this period
    /// </summary>
    public int OrderCount { get; set; }
}

/// <summary>
/// How to group analytics data
/// </summary>
public enum AnalyticsGroupBy
{
    /// <summary>
    /// Group by day
    /// </summary>
    Day = 0,

    /// <summary>
    /// Group by week
    /// </summary>
    Week = 1,

    /// <summary>
    /// Group by month
    /// </summary>
    Month = 2,

    /// <summary>
    /// Group by year
    /// </summary>
    Year = 3
}



/// <summary>
/// Demo model showcasing all OpenAPI schema attributes
/// </summary>
public class ProductReview
{
    /// <summary>
    /// Unique identifier for the review
    /// </summary>
    public Guid Id { get; set; }

    /// <summary>
    /// ID of the product being reviewed
    /// </summary>
    public Guid ProductId { get; set; }

    /// <summary>
    /// ID of the customer who wrote the review
    /// </summary>
    public Guid CustomerId { get; set; }

    /// <summary>
    /// Rating from 1 to 5 stars
    /// </summary>
    [System.ComponentModel.DataAnnotations.Range(1, 5)]
    public int Rating { get; set; }

    /// <summary>
    /// Review title (3-100 characters)
    /// </summary>
    [System.ComponentModel.DataAnnotations.StringLength(100, MinimumLength = 3)]
    public required string Title { get; set; }

    /// <summary>
    /// Review content (10-2000 characters)
    /// </summary>
    [System.ComponentModel.DataAnnotations.StringLength(2000, MinimumLength = 10)]
    public required string Content { get; set; }

    /// <summary>
    /// Whether the reviewer recommends this product
    /// </summary>
    public bool IsRecommended { get; set; }

    /// <summary>
    /// Whether the review has been verified by a purchase
    /// </summary>
    public bool IsVerifiedPurchase { get; set; }

    /// <summary>
    /// Number of users who found this review helpful
    /// </summary>
    [System.ComponentModel.DataAnnotations.Range(0, int.MaxValue)]
    public int HelpfulCount { get; set; } = 0;

    /// <summary>
    /// Images attached to the review (0-5 images)
    /// </summary>
    [System.ComponentModel.DataAnnotations.MaxLength(5)]
    public List<string>? ImageUrls { get; set; }

    /// <summary>
    /// Timestamp when the review was created (read-only)
    /// </summary>
    [System.ComponentModel.DataAnnotations.Editable(false)]
    public DateTime CreatedAt { get; set; }

    /// <summary>
    /// Timestamp when the review was last updated
    /// </summary>
    public DateTime? UpdatedAt { get; set; }
}

/// <summary>
/// Request model for creating a product review
/// </summary>
public class CreateProductReviewRequest
{
    /// <summary>
    /// ID of the product being reviewed
    /// </summary>
    public Guid ProductId { get; set; }

    /// <summary>
    /// Rating from 1 to 5 stars (required)
    /// </summary>
    [System.ComponentModel.DataAnnotations.Range(1, 5, ErrorMessage = "Rating must be between 1 and 5")]
    public int Rating { get; set; }

    /// <summary>
    /// Review title (3-100 characters, required)
    /// </summary>
    [System.ComponentModel.DataAnnotations.Required]
    [System.ComponentModel.DataAnnotations.StringLength(100, MinimumLength = 3, ErrorMessage = "Title must be between 3 and 100 characters")]
    public required string Title { get; set; }

    /// <summary>
    /// Review content (10-2000 characters, required)
    /// </summary>
    [System.ComponentModel.DataAnnotations.Required]
    [System.ComponentModel.DataAnnotations.StringLength(2000, MinimumLength = 10, ErrorMessage = "Content must be between 10 and 2000 characters")]
    public required string Content { get; set; }

    /// <summary>
    /// Whether you recommend this product (default: true)
    /// </summary>
    public bool IsRecommended { get; set; } = true;

    /// <summary>
    /// Optional image URLs (maximum 5 images, each URL must be valid)
    /// </summary>
    [System.ComponentModel.DataAnnotations.MaxLength(5, ErrorMessage = "Maximum 5 images allowed")]
    [System.ComponentModel.DataAnnotations.Url]
    public List<string>? ImageUrls { get; set; }
}



/// <summary>
/// Paginated result wrapper
/// </summary>
public class PagedResult<T>
{
    /// <summary>
    /// Items in the current page
    /// </summary>
    public required List<T> Items { get; set; }

    /// <summary>
    /// Total number of items across all pages
    /// </summary>
    public int TotalCount { get; set; }

    /// <summary>
    /// Current page number (1-based)
    /// </summary>
    public int Page { get; set; }

    /// <summary>
    /// Number of items per page
    /// </summary>
    public int PageSize { get; set; }

    /// <summary>
    /// Total number of pages
    /// </summary>
    public int TotalPages => (int)Math.Ceiling((double)TotalCount / PageSize);

    /// <summary>
    /// Whether there is a previous page
    /// </summary>
    public bool HasPrevious => Page > 1;

    /// <summary>
    /// Whether there is a next page
    /// </summary>
    public bool HasNext => Page < TotalPages;
}

/// <summary>
/// Health check response
/// </summary>
public class HealthCheck
{
    /// <summary>
    /// Overall health status
    /// </summary>
    public required string Status { get; set; }

    /// <summary>
    /// Timestamp of the health check
    /// </summary>
    public DateTime Timestamp { get; set; }

    /// <summary>
    /// API version
    /// </summary>
    public required string Version { get; set; }

    /// <summary>
    /// Status of dependent services
    /// </summary>
    public Dictionary<string, string>? Services { get; set; }
}



/// <summary>
/// Sample data provider for demo purposes
/// </summary>
public static class SampleData
{
    private static readonly List<Customer> _customers = new()
    {
        new Customer
        {
            Id = Guid.Parse("11111111-1111-1111-1111-111111111111"),
            FirstName = "John",
            LastName = "Doe",
            Email = "john.doe@example.com",
            PhoneNumber = "+1-555-0100",
            DateOfBirth = new DateOnly(1985, 3, 15),
            Status = CustomerStatus.Active,
            SubscriptionTier = SubscriptionTier.Premium,
            Address = new Address
            {
                Street = "123 Main St",
                City = "San Francisco",
                State = "CA",
                PostalCode = "94102",
                Country = "US"
            },
            CreatedAt = DateTime.UtcNow.AddYears(-2),
            UpdatedAt = DateTime.UtcNow.AddDays(-5)
        },
        new Customer
        {
            Id = Guid.Parse("22222222-2222-2222-2222-222222222222"),
            FirstName = "Jane",
            LastName = "Smith",
            Email = "jane.smith@example.com",
            PhoneNumber = "+1-555-0101",
            DateOfBirth = new DateOnly(1990, 7, 22),
            Status = CustomerStatus.Active,
            SubscriptionTier = SubscriptionTier.Basic,
            Address = new Address
            {
                Street = "456 Oak Ave",
                City = "New York",
                State = "NY",
                PostalCode = "10001",
                Country = "US"
            },
            CreatedAt = DateTime.UtcNow.AddYears(-1),
            UpdatedAt = DateTime.UtcNow.AddDays(-2)
        }
    };

    private static readonly List<Order> _orders = new()
    {
        new Order
        {
            Id = Guid.Parse("33333333-3333-3333-3333-333333333333"),
            OrderNumber = "ORD-20240115-1234",
            CustomerId = Guid.Parse("11111111-1111-1111-1111-111111111111"),
            Items = new List<OrderItem>
            {
                new OrderItem { ProductId = Guid.NewGuid(), ProductName = "Premium Widget", Quantity = 2, UnitPrice = 149.99m }
            },
            SubTotal = 299.98m,
            Tax = 29.99m,
            ShippingCost = 15.00m,
            Total = 344.97m,
            Status = OrderStatus.Delivered,
            ShippingAddress = new Address { Street = "123 Main St", City = "San Francisco", State = "CA", PostalCode = "94102", Country = "US" },
            ShippingMethod = ShippingMethod.Express,
            PaymentMethod = PaymentMethod.CreditCard,
            TrackingNumber = "TRK123456789",
            CreatedAt = DateTime.UtcNow.AddDays(-10),
            UpdatedAt = DateTime.UtcNow.AddDays(-8),
            ShippedAt = DateTime.UtcNow.AddDays(-9),
            IsPriority = true
        }
    };

    private static readonly List<Product> _products = new()
    {
        new Product
        {
            Id = Guid.Parse("44444444-4444-4444-4444-444444444444"),
            Name = "Premium Widget",
            Description = "A high-quality widget with advanced features",
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
        },
        new Product
        {
            Id = Guid.Parse("55555555-5555-5555-5555-555555555555"),
            Name = "Deluxe Gadget",
            Description = "An innovative gadget for everyday use",
            Category = "Accessories",
            Price = 79.99m,
            Sku = "GADGET-DLX-002",
            StockQuantity = 120,
            Weight = 1.2m,
            Dimensions = new ProductDimensions { Length = 6, Width = 4, Height = 3 },
            Tags = new List<string> { "gadget", "portable", "new" },
            IsActive = true,
            CreatedAt = DateTime.UtcNow.AddMonths(-3),
            UpdatedAt = DateTime.UtcNow.AddDays(-3)
        }
    };

    public static List<Customer> GetCustomers() => _customers;
    public static List<Order> GetOrders() => _orders;
    public static List<Product> GetProducts() => _products;
}

// Operation filter to handle AllowAnonymous attribute
public class AllowAnonymousOperationFilter : Swashbuckle.AspNetCore.SwaggerGen.IOperationFilter
{
    public void Apply(Microsoft.OpenApi.Models.OpenApiOperation operation, Swashbuckle.AspNetCore.SwaggerGen.OperationFilterContext context)
    {
        // Check if the endpoint has AllowAnonymous metadata
        var allowAnonymous = context.ApiDescription.ActionDescriptor.EndpointMetadata
            .OfType<Microsoft.AspNetCore.Authorization.AllowAnonymousAttribute>()
            .Any();

        if (allowAnonymous)
        {
            // Remove security requirements for this operation
            operation.Security?.Clear();
        }
    }
}


