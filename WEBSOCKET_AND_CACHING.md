# WebSocket and Caching Implementation

This document describes the WebSocket and caching implementation for real-time updates and performance optimization in the MS Sports application.

## WebSocket Implementation

WebSockets have been implemented to provide real-time updates for:
- Dashboard metrics and charts
- Inventory items and status
- Customer information
- Invoice data and status updates
- Purchase orders and status updates

### How WebSockets Work

1. **Server-side**: The application uses Socket.IO to establish WebSocket connections with clients.
   - The WebSocket server is initialized in `server.js`
   - WebSocket events are defined in `src/lib/websocket.ts`
   - Utility functions for emitting events are in `src/lib/utils/websocket.ts`

2. **Client-side**: React hooks are provided to subscribe to WebSocket events.
   - Main hook: `useWebSocket` in `src/hooks/useWebSocket.ts`
   - Specialized hooks for different data types:
     - `useDashboardUpdates`
     - `useInventoryUpdates`
     - `useInvoiceUpdates`
     - `useCustomerUpdates`
     - `usePurchaseUpdates`

### Testing WebSockets

You can test the WebSocket functionality using the test endpoint:

```
GET /api/websocket-test?event=dashboard
```

Available event types:
- `dashboard` (default)
- `inventory`
- `invoice`
- `customer`
- `purchase`

### Using WebSockets in Components

To subscribe to real-time updates in a component:

```tsx
import { useInventoryUpdates } from '@/hooks/useWebSocket';

function MyComponent() {
  // Subscribe to inventory updates
  useInventoryUpdates((data) => {
    console.log('Received inventory update:', data);
    // Update your component state here
  });
  
  // Rest of your component...
}
```

### Emitting WebSocket Events from API Routes

When data changes in an API route, emit WebSocket events to notify clients:

```ts
import { emitInventoryUpdate } from '@/lib/utils/websocket';

// In your API route handler
export async function POST(req: Request) {
  // Process the request and update data
  
  // Emit WebSocket event to notify clients
  emitInventoryUpdate({
    type: 'full_update',
    items: updatedItems,
    pagination: {
      total: totalItems,
      page: currentPage,
      limit: itemsPerPage,
      totalPages: totalPages
    }
  });
  
  // Return response
  return NextResponse.json({ success: true, data: updatedItems });
}
```

## Caching Implementation

Caching has been implemented to improve performance and reduce database load.

### Page-level Caching

The following pages use Next.js revalidation for caching:

- Dashboard: `revalidate = 30` (30 seconds)
- Invoices: `revalidate = 60` (60 seconds)
- Inventory: `revalidate = 60` (60 seconds)
- Customers: `revalidate = 60` (60 seconds)
- Purchases: `revalidate = 60` (60 seconds)

This means that these pages will serve a cached version for the specified duration, and then revalidate in the background when a new request comes in after the revalidation period.

### API Route Caching

Some API routes also use caching:

```ts
// Example of API route with caching
const response = await fetch(`${baseUrl}/api/categories`, {
  next: { revalidate: 3600 } // Cache for 1 hour
});
```

### Database Query Optimization

Database indexes have been added to improve query performance:

- `Invoice` table:
  - `status`
  - `paymentMethod`
  - `createdAt`
  - `customerId`
  - `status, createdAt` (composite)
  - `paymentMethod, createdAt` (composite)
  - `status, paymentMethod, createdAt` (composite)
  - `updatedAt, status` (composite)

- `Customer` table:
  - `name`

## Best Practices

1. **Combine WebSockets with Caching**: Use caching for initial page loads and WebSockets for real-time updates.

2. **Selective Updates**: Only emit WebSocket events for data that has actually changed.

3. **Throttle Updates**: For high-frequency changes, consider throttling WebSocket events to avoid overwhelming clients.

4. **Error Handling**: Always handle WebSocket connection errors and provide fallbacks.

5. **Security**: Ensure that sensitive data is not exposed through WebSockets.

## Starting the Application

To start the application with WebSocket support:

```bash
# Development
npm run dev

# Production
npm run build
npm run start  # For Linux/Mac
npm run start:win  # For Windows
``` 