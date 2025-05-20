# MD Sports Inventory Management System - System Design

## Implementation approach

Based on the requirements outlined in the PRD, I'll design a web-based inventory management system for MD Sports that enables multi-shop inventory management with transfer capabilities, role-based access control, and comprehensive reporting features. The system will be built using modern web technologies that offer reliability, scalability, and security while remaining within budget constraints.

### Key Technical Decisions

1. **Architecture Pattern**: We will implement a microservices-oriented architecture to ensure modularity and scalability. This will allow us to independently scale different components of the system as needed.

2. **Technology Stack**:
   - Frontend: React.js with Tailwind CSS for responsive design
   - Backend: Node.js with Express.js for API development
   - Database: NeonDB (PostgreSQL-compatible) for reliable data storage
   - Authentication: JWT-based token system with role-based permissions

3. **Integration Approach**:
   - RESTful APIs for service integration
   - Webhook-based notifications for real-time updates
   - OpenAI API for ChatGPT 4o-mini integration
   - notify.lk API for SMS functionality

4. **Deployment Strategy**:
   - Cloud-based deployment for accessibility and reliability
   - Containerization for consistent environment management
   - CI/CD pipeline for automated testing and deployment

### Challenging Aspects and Solutions

1. **Real-time Inventory Synchronization**: 
   - Challenge: Ensuring inventory data is consistent across multiple shops.
   - Solution: Implement event-driven architecture for inventory updates with robust concurrency control.

2. **Data Migration**:
   - Challenge: Migrating existing data without disruption.
   - Solution: Develop a comprehensive migration strategy with validation steps and rollback procedures.

3. **AI Integration**:
   - Challenge: Effectively leveraging ChatGPT 4o-mini for business insights.
   - Solution: Design a context management system to provide relevant business context to AI queries.

### Open Source Libraries

1. **Frontend**:
   - React.js - Component-based UI development
   - Redux Toolkit - State management
   - Tailwind CSS - Utility-first CSS framework
   - React Query - Data fetching and caching
   - React Hook Form - Form validation
   - Chart.js - Data visualization
   - jsPDF - PDF generation
   - SheetJS - Excel export

2. **Backend**:
   - Express.js - Web application framework
   - Sequelize ORM - Database interactions
   - Passport.js - Authentication middleware
   - Winston - Logging
   - Jest - Testing framework
   - Joi - Request validation
   - node-cron - Scheduled tasks
   - Nodemailer - Email functionality

## Data structures and interfaces

The system will be composed of several interconnected modules with well-defined data structures and APIs. Below is the class diagram representing the core entities and their relationships:

```mermaid
classDiagram
    class User {
        +int id
        +string username
        +string passwordHash
        +string fullName
        +string email
        +string phone
        +boolean isActive
        +DateTime createdAt
        +DateTime updatedAt
        +authenticate(password) boolean
        +hasPermission(permission) boolean
    }

    class Role {
        +int id
        +string name
        +string description
        +boolean isActive
        +DateTime createdAt
        +DateTime updatedAt
        +assignPermission(permission) void
        +removePermission(permission) void
    }

    class Permission {
        +int id
        +string name
        +string description
        +string module
        +DateTime createdAt
        +DateTime updatedAt
    }

    class Shop {
        +int id
        +string name
        +string location
        +string contactPerson
        +string phone
        +string email
        +boolean isActive
        +DateTime createdAt
        +DateTime updatedAt
        +getInventory() List~InventoryItem~
        +getInventoryItem(productId) InventoryItem
        +updateInventory(productId, quantity) void
    }

    class Product {
        +int id
        +string name
        +string sku
        +string barcode
        +string description
        +double basePrice
        +double retailPrice
        +int categoryId
        +string imageUrl
        +boolean isActive
        +DateTime createdAt
        +DateTime updatedAt
        +getInventoryLevels() Map~Shop, int~
        +getTotalStock() int
    }

    class Category {
        +int id
        +string name
        +string description
        +int parentId
        +boolean isActive
        +DateTime createdAt
        +DateTime updatedAt
        +getProducts() List~Product~
    }

    class InventoryItem {
        +int id
        +int shopId
        +int productId
        +int quantity
        +int reorderLevel
        +DateTime lastUpdated
        +adjustQuantity(int amount) void
        +isLowStock() boolean
    }

    class InventoryTransfer {
        +int id
        +int sourceShopId
        +int destinationShopId
        +int initiatedByUserId
        +string status
        +DateTime createdAt
        +DateTime completedAt
        +addTransferItem(productId, quantity) void
        +completeTransfer() boolean
        +cancelTransfer() boolean
    }

    class TransferItem {
        +int id
        +int transferId
        +int productId
        +int quantity
        +string notes
    }

    class Customer {
        +int id
        +string name
        +string email
        +string phone
        +string address
        +string type
        +double creditLimit
        +boolean isActive
        +DateTime createdAt
        +DateTime updatedAt
        +double getCurrentBalance()
        +List~Invoice~ getInvoices()
    }

    class Invoice {
        +int id
        +int shopId
        +int customerId
        +int userId
        +string invoiceNumber
        +DateTime date
        +double subtotal
        +double tax
        +double discount
        +double total
        +string status
        +string paymentStatus
        +DateTime dueDate
        +DateTime createdAt
        +DateTime updatedAt
        +addItem(productId, quantity, price) void
        +removeItem(lineItemId) void
        +calculateTotals() void
        +markAsPaid() void
    }

    class InvoiceItem {
        +int id
        +int invoiceId
        +int productId
        +int quantity
        +double unitPrice
        +double discount
        +double subtotal
        +calculateSubtotal() double
    }

    class Payment {
        +int id
        +int invoiceId
        +double amount
        +string method
        +string reference
        +DateTime paymentDate
        +DateTime createdAt
        +DateTime updatedAt
    }

    class AuditLog {
        +int id
        +int userId
        +string action
        +string module
        +string details
        +string ipAddress
        +DateTime timestamp
    }

    class Notification {
        +int id
        +string type
        +string message
        +int targetUserId
        +boolean isRead
        +string link
        +DateTime createdAt
        +markAsRead() void
    }

    class AIAssistant {
        +processQuery(query, context) JSON
        +getInventoryInsights(shopId) JSON
        +getSalesRecommendations() JSON
        +forecastDemand(productId) JSON
    }

    class SMSService {
        +sendInvoiceNotification(invoice) boolean
        +sendOverduePaymentReminder(invoice) boolean
        +sendLowStockAlert(product, shop) boolean
        +sendBulkMessage(customers, message) Map~Customer, boolean~
    }

    class ReportGenerator {
        +generateInventoryReport(shopId, filters) Report
        +generateSalesReport(shopId, dateRange) Report
        +exportToPDF(report) Stream
        +exportToExcel(report) Stream
    }

    User "*" -- "1" Role : has
    Role "*" -- "*" Permission : contains
    User "*" -- "1" Shop : assigned to
    User "1" -- "*" Invoice : creates
    Shop "1" -- "*" InventoryItem : contains
    Shop "1" -- "*" Invoice : issues
    Product "1" -- "*" InventoryItem : tracked in
    Product "*" -- "1" Category : belongs to
    InventoryTransfer "1" -- "*" TransferItem : contains
    InventoryTransfer "*" -- "1" Shop : source
    InventoryTransfer "*" -- "1" Shop : destination
    InventoryTransfer "*" -- "1" User : initiated by
    Customer "1" -- "*" Invoice : receives
    Invoice "1" -- "*" InvoiceItem : contains
    Invoice "1" -- "*" Payment : receives
    InvoiceItem "*" -- "1" Product : references
```

## Key API Endpoints

### Authentication API

```
POST /api/auth/login - User login
POST /api/auth/logout - User logout
POST /api/auth/refresh - Refresh authentication token
GET /api/auth/me - Get current user profile
PUT /api/auth/change-password - Change user password
```

### User Management API

```
GET /api/users - List all users
GET /api/users/:id - Get user details
POST /api/users - Create a new user
PUT /api/users/:id - Update user details
DELETE /api/users/:id - Deactivate a user
GET /api/users/:id/permissions - Get user permissions
PUT /api/users/:id/permissions - Update user permissions
```

### Role Management API

```
GET /api/roles - List all roles
GET /api/roles/:id - Get role details
POST /api/roles - Create a new role
PUT /api/roles/:id - Update role details
DELETE /api/roles/:id - Delete a role
GET /api/roles/:id/permissions - Get role permissions
PUT /api/roles/:id/permissions - Update role permissions
```

### Shop Management API

```
GET /api/shops - List all shops
GET /api/shops/:id - Get shop details
POST /api/shops - Create a new shop
PUT /api/shops/:id - Update shop details
DELETE /api/shops/:id - Deactivate a shop
GET /api/shops/:id/inventory - Get shop inventory
GET /api/shops/:id/staff - Get shop staff members
```

### Product Management API

```
GET /api/products - List all products
GET /api/products/:id - Get product details
POST /api/products - Create a new product
PUT /api/products/:id - Update product details
DELETE /api/products/:id - Deactivate a product
GET /api/products/:id/inventory - Get product inventory across shops
GET /api/products/categories - Get product categories
```

### Inventory Management API

```
GET /api/inventory - List inventory items (with filtering)
GET /api/inventory/:shopId/:productId - Get specific inventory item
POST /api/inventory/adjust - Adjust inventory quantity
GET /api/inventory/low-stock - Get low stock items
POST /api/inventory/transfers - Create inventory transfer
GET /api/inventory/transfers - List inventory transfers
GET /api/inventory/transfers/:id - Get transfer details
PUT /api/inventory/transfers/:id/complete - Complete inventory transfer
PUT /api/inventory/transfers/:id/cancel - Cancel inventory transfer
```

### Customer Management API

```
GET /api/customers - List all customers
GET /api/customers/:id - Get customer details
POST /api/customers - Create a new customer
PUT /api/customers/:id - Update customer details
DELETE /api/customers/:id - Deactivate a customer
GET /api/customers/:id/invoices - Get customer invoices
GET /api/customers/:id/balance - Get customer balance
```

### Invoice Management API

```
GET /api/invoices - List all invoices
GET /api/invoices/:id - Get invoice details
POST /api/invoices - Create a new invoice
PUT /api/invoices/:id - Update invoice details
DELETE /api/invoices/:id - Cancel an invoice
POST /api/invoices/:id/items - Add invoice item
DELETE /api/invoices/:id/items/:itemId - Remove invoice item
POST /api/invoices/:id/payments - Record payment for invoice
GET /api/invoices/:id/print - Generate printable invoice
POST /api/invoices/:id/send-sms - Send invoice SMS notification
```

### Reporting API

```
GET /api/reports/inventory - Generate inventory report
GET /api/reports/sales - Generate sales report
GET /api/reports/revenue - Generate revenue report
GET /api/reports/customer - Generate customer report
GET /api/reports/export/pdf - Export report to PDF
GET /api/reports/export/excel - Export report to Excel
```

### AI Integration API

```
POST /api/ai/query - Process natural language query
GET /api/ai/insights/inventory - Get AI inventory insights
GET /api/ai/insights/sales - Get AI sales insights
GET /api/ai/forecast/demand - Get demand forecasts
```

### SMS Notification API

```
POST /api/sms/send - Send custom SMS
POST /api/sms/invoice - Send invoice notification
POST /api/sms/overdue - Send overdue payment reminder
POST /api/sms/low-stock - Send low stock alert
GET /api/sms/templates - Get SMS templates
```

## Program call flow

The following sequence diagrams outline the key workflows in the system:

### User Authentication Flow

```mermaid
sequenceDiagram
    participant Client
    participant AuthController
    participant UserService
    participant JWTService
    participant Database
    
    Client->>AuthController: POST /api/auth/login (username, password)
    AuthController->>UserService: authenticateUser(username, password)
    UserService->>Database: findUserByUsername(username)
    Database-->>UserService: user details
    UserService->>UserService: validatePassword(password, passwordHash)
    alt Invalid credentials
        UserService-->>AuthController: Authentication failed
        AuthController-->>Client: 401 Unauthorized
    else Valid credentials
        UserService->>JWTService: generateTokens(userId, roles)
        JWTService-->>UserService: accessToken, refreshToken
        UserService-->>AuthController: Authentication successful
        AuthController-->>Client: 200 OK (tokens, user info)
    end
```

### Inventory Transfer Flow

```mermaid
sequenceDiagram
    participant Client
    participant InventoryController
    participant TransferService
    participant InventoryService
    participant NotificationService
    participant Database
    participant AuditService
    
    Client->>InventoryController: POST /api/inventory/transfers (source, destination, items)
    InventoryController->>TransferService: createTransfer(source, destination, items)
    
    TransferService->>InventoryService: validateInventory(source, items)
    InventoryService->>Database: getInventoryLevels(shopId, productIds)
    Database-->>InventoryService: inventory levels
    InventoryService-->>TransferService: validation result
    
    alt Invalid inventory
        TransferService-->>InventoryController: Insufficient inventory
        InventoryController-->>Client: 400 Bad Request
    else Valid inventory
        TransferService->>Database: createTransferRecord(source, destination, items)
        Database-->>TransferService: transferId
        TransferService->>InventoryService: reserveInventory(source, items)
        InventoryService->>Database: updateInventory(source, items, 'reserved')
        Database-->>InventoryService: updated inventory
        
        TransferService->>NotificationService: notifyShopManagers(source, destination, transferId)
        NotificationService->>Database: createNotifications(userIds, message)
        
        TransferService->>AuditService: logTransferCreation(userId, transferId)
        AuditService->>Database: createAuditLog(userId, action, details)
        
        TransferService-->>InventoryController: Transfer created
        InventoryController-->>Client: 201 Created (transferId)
    end
```

### Complete Transfer Flow

```mermaid
sequenceDiagram
    participant Client
    participant InventoryController
    participant TransferService
    participant InventoryService
    participant NotificationService
    participant Database
    participant AuditService
    
    Client->>InventoryController: PUT /api/inventory/transfers/:id/complete
    InventoryController->>TransferService: completeTransfer(transferId)
    
    TransferService->>Database: getTransferDetails(transferId)
    Database-->>TransferService: transfer details
    
    alt Invalid transfer state
        TransferService-->>InventoryController: Invalid transfer state
        InventoryController-->>Client: 400 Bad Request
    else Valid transfer state
        TransferService->>InventoryService: updateInventory(sourceShop, items, 'decrease')
        InventoryService->>Database: updateInventoryLevels(shopId, items, 'decrease')
        Database-->>InventoryService: updated inventory
        
        TransferService->>InventoryService: updateInventory(destinationShop, items, 'increase')
        InventoryService->>Database: updateInventoryLevels(shopId, items, 'increase')
        Database-->>InventoryService: updated inventory
        
        TransferService->>Database: updateTransferStatus(transferId, 'completed')
        Database-->>TransferService: updated transfer
        
        TransferService->>NotificationService: notifyTransferCompleted(transfer)
        NotificationService->>Database: createNotifications(userIds, message)
        
        TransferService->>AuditService: logTransferCompletion(userId, transferId)
        AuditService->>Database: createAuditLog(userId, action, details)
        
        TransferService-->>InventoryController: Transfer completed
        InventoryController-->>Client: 200 OK
    end
```

### Invoice Creation Flow

```mermaid
sequenceDiagram
    participant Client
    participant InvoiceController
    participant InvoiceService
    participant InventoryService
    participant CustomerService
    participant SMSService
    participant Database
    participant AuditService
    
    Client->>InvoiceController: POST /api/invoices (customerId, items, etc)
    InvoiceController->>CustomerService: getCustomer(customerId)
    CustomerService->>Database: findCustomerById(customerId)
    Database-->>CustomerService: customer details
    CustomerService-->>InvoiceController: customer info
    
    InvoiceController->>InvoiceService: createInvoice(data)
    InvoiceService->>Database: createInvoiceRecord(data)
    Database-->>InvoiceService: invoiceId
    
    loop For each item
        InvoiceService->>Database: addInvoiceItem(invoiceId, item)
        InvoiceService->>InventoryService: updateInventory(shopId, productId, quantity)
        InventoryService->>Database: decreaseInventory(shopId, productId, quantity)
    end
    
    InvoiceService->>Database: calculateAndUpdateTotals(invoiceId)
    Database-->>InvoiceService: updated invoice
    
    alt SMS notification enabled
        InvoiceService->>SMSService: sendInvoiceNotification(invoice, customer)
        SMSService->>SMSService: prepareMessage(template, invoice)
        SMSService->>NotifyLK API: sendSMS(phone, message)
        NotifyLK API-->>SMSService: delivery status
    end
    
    InvoiceService->>AuditService: logInvoiceCreation(userId, invoiceId)
    AuditService->>Database: createAuditLog(userId, action, details)
    
    InvoiceService-->>InvoiceController: Invoice created
    InvoiceController-->>Client: 201 Created (invoiceId)
```

### AI Insights Flow

```mermaid
sequenceDiagram
    participant Client
    participant AIController
    participant AIService
    participant InventoryService
    participant SalesService
    participant OpenAI API
    participant Database
    
    Client->>AIController: POST /api/ai/query (query)
    AIController->>AIService: processQuery(query)
    
    alt Inventory insight query
        AIService->>InventoryService: getInventoryData()
        InventoryService->>Database: fetchInventoryStatistics()
        Database-->>InventoryService: inventory data
        InventoryService-->>AIService: inventory statistics
    else Sales insight query
        AIService->>SalesService: getSalesData()
        SalesService->>Database: fetchSalesStatistics()
        Database-->>SalesService: sales data
        SalesService-->>AIService: sales statistics
    end
    
    AIService->>AIService: prepareContext(data, query)
    AIService->>OpenAI API: generateInsights(context, query)
    OpenAI API-->>AIService: AI generated insights
    
    AIService->>AIService: processInsights(rawInsights)
    AIService-->>AIController: formatted insights
    AIController-->>Client: 200 OK (insights)
```

## Security Measures

### Role-Based Access Control (RBAC)

The system implements a comprehensive RBAC system with the following security features:

1. **Granular Permission System**:
   - Each API endpoint is mapped to specific permissions.
   - Permissions are grouped by module (inventory, invoice, user, etc.).
   - Actions are categorized (view, create, edit, delete).

2. **Role Hierarchy**:
   - Predefined roles: Admin, Shop Manager, Inventory Manager, Cashier, Read-only User.
   - Each role has a specific set of permissions.
   - Inheritance can be configured for role hierarchies.

3. **Permission Enforcement**:
   - Middleware checks for required permissions before processing requests.
   - Dynamically filters content based on user's permission level.
   - Audit logging for permission checks and access attempts.

### Authentication Security

1. **JWT-based Authentication**:
   - Short-lived access tokens (15-30 minutes).
   - Refresh tokens with longer validity.
   - JWT payload contains minimal user information and permissions.

2. **Password Security**:
   - Bcrypt password hashing with appropriate salt rounds.
   - Password complexity requirements.
   - Account lockout after failed attempts.

3. **Session Management**:
   - Secure, HTTP-only cookies for token storage.
   - CSRF protection measures.
   - IP-based session validation (optional).

### API Security

1. **Input Validation**:
   - Comprehensive request validation using Joi.
   - Sanitization of inputs to prevent injection attacks.
   - Rate limiting to prevent abuse.

2. **HTTPS Enforcement**:
   - All communications over TLS/SSL.
   - HSTS headers for added security.

3. **Error Handling**:
   - Generic error messages to users.
   - Detailed errors logged for troubleshooting.
   - No sensitive information in error responses.

## Deployment Strategy

### Infrastructure Setup

1. **Database Layer**:
   - NeonDB (PostgreSQL-compatible) for data storage.
   - Connection pooling for efficient resource usage.
   - Regular backups configured.

2. **Application Layer**:
   - Node.js backend services deployed on cloud VMs or container services.
   - Load balancing for horizontal scalability.
   - Auto-scaling based on request volume (where budget allows).

3. **Frontend Layer**:
   - Static assets served from CDN.
   - React application bundled and optimized for production.

4. **Integration Layer**:
   - Secure API connections to notify.lk for SMS.
   - OpenAI API integration for AI capabilities.

### CI/CD Pipeline

1. **Development Workflow**:
   - Feature branch development.
   - Pull request review process.
   - Automated tests for each PR.

2. **Testing Environments**:
   - Development environment for ongoing work.
   - Staging environment identical to production.
   - Production environment with restricted access.

3. **Deployment Process**:
   - Automated tests before deployment.
   - Blue/green deployment for zero downtime.
   - Rollback capability if issues are detected.

### Scalability Considerations

1. **Horizontal Scaling**:
   - Stateless API design allows for multiple instances.
   - Database connection pooling.
   - Caching layer for frequently accessed data.

2. **Performance Optimization**:
   - Database query optimization.
   - Efficient indexing strategies.
   - Pagination for large data sets.

3. **Multi-Shop Scalability**:
   - Database schema designed to handle many shops efficiently.
   - Data partitioning strategies for very large deployments.
   - Isolated resources for shops if necessary.

## Anything UNCLEAR

1. **Data Migration Strategy**: The PRD mentions the client already has a system in place. A detailed assessment of the existing data structure and quality would be necessary to develop a comprehensive migration plan. This would include:
   - Schema mapping between old and new systems
   - Data cleaning and transformation rules
   - Validation criteria for migrated data
   - Rollback procedures in case of migration issues

2. **SMS Notification Templates**: Specific templates for different notification types should be confirmed with the client:
   - Invoice creation notification format
   - Overdue payment reminder content
   - Low stock alert message structure

3. **Hardware Infrastructure**: More information is needed about the existing hardware at each shop location:
   - Availability and specs of POS terminals
   - Network connectivity between shops
   - Printing capabilities for invoices and reports

4. **AI Integration Scope**: While the system will integrate with ChatGPT 4o-mini, the specific use cases need further detailing:
   - What types of natural language queries will be supported?
   - What specific business insights are most valuable to extract?
   - How will AI-generated content be presented to users?