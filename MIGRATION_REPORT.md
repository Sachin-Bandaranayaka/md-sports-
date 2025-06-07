# Socket.IO to Polling Migration Report

This report shows files that contain Socket.IO usage and need to be updated for Vercel deployment.

## Files requiring updates:

### scripts/migrate-to-vercel.js

**Socket.IO patterns found:**
- `from Socket.IO`
- `socket.on`
- `useSocket`
- `socketio`
- `SocketIO`
- `socketIO`

**Recommended action:**
Replace Socket.IO usage with the new `useRealtime` hook.

### server.js

**Socket.IO patterns found:**
- `socket.on`
- `socketio`

**Recommended action:**
Replace Socket.IO usage with the new `useRealtime` hook.

### src/app/api/inventory/route.ts

**Socket.IO patterns found:**
- `SocketIO`

**Recommended action:**
Replace Socket.IO usage with the new `useRealtime` hook.

### src/app/api/invoices/[id]/route.ts

**Socket.IO patterns found:**
- `IO(`
- `SocketIO`

**Recommended action:**
Replace Socket.IO usage with the new `useRealtime` hook.

### src/app/api/invoices/route.ts

**Socket.IO patterns found:**
- `IO(`
- `SocketIO`

**Recommended action:**
Replace Socket.IO usage with the new `useRealtime` hook.

### src/app/api/products/[id]/route.ts

**Socket.IO patterns found:**
- `IO(`
- `SocketIO`

**Recommended action:**
Replace Socket.IO usage with the new `useRealtime` hook.

### src/app/api/products/route.ts

**Socket.IO patterns found:**
- `SocketIO`

**Recommended action:**
Replace Socket.IO usage with the new `useRealtime` hook.

### src/app/api/purchases/[id]/route.ts

**Socket.IO patterns found:**
- `IO(`
- `SocketIO`

**Recommended action:**
Replace Socket.IO usage with the new `useRealtime` hook.

### src/app/api/purchases/route.ts

**Socket.IO patterns found:**
- `IO(`
- `SocketIO`

**Recommended action:**
Replace Socket.IO usage with the new `useRealtime` hook.

### src/app/api/socketio/route.ts

**Socket.IO patterns found:**
- `SocketIO`

**Recommended action:**
Replace Socket.IO usage with the new `useRealtime` hook.

### src/app/api/websocket-test/route.ts

**Socket.IO patterns found:**
- `IO(`
- `SocketIO`

**Recommended action:**
Replace Socket.IO usage with the new `useRealtime` hook.

### src/context/SocketContext.tsx

**Socket.IO patterns found:**
- `import type { Socket } from 'socket.io`
- `import for socket.io`
- `import of socket.io`
- `import('socket.io`
- `from 'socket.io`
- `Socket.emit`
- `Socket.on`
- `io(`
- `useSocket`
- `socketio`

**Recommended action:**
Replace Socket.IO usage with the new `useRealtime` hook.

### src/hooks/useWebSocket.ts

**Socket.IO patterns found:**
- `import { io, Socket } from 'socket.io`
- `from 'socket.io`
- `Socket.emit`
- `Socket.on`
- `io(`
- `useSocket`
- `socketio`

**Recommended action:**
Replace Socket.IO usage with the new `useRealtime` hook.

### src/lib/utils/websocket.ts

**Socket.IO patterns found:**
- `IO(`
- `SocketIO`

**Recommended action:**
Replace Socket.IO usage with the new `useRealtime` hook.

### src/lib/websocket.ts

**Socket.IO patterns found:**
- `import { Server as SocketIOServer } from 'socket.io`
- `import type { Server as IOServer } from 'socket.io`
- `import { io, Socket } from 'socket.io`
- `from 'socket.io`
- `socket.emit`
- `socket.on`
- `IO(`
- `io(`
- `SocketIO`
- `socketio`

**Recommended action:**
Replace Socket.IO usage with the new `useRealtime` hook.

### websocket-client-test.js

**Socket.IO patterns found:**
- `socket.on`
- `io(`
- `socketio`

**Recommended action:**
Replace Socket.IO usage with the new `useRealtime` hook.

## Migration Steps

1. **Remove Socket.IO dependencies:**
   ```bash
   npm uninstall socket.io socket.io-client
   ```

2. **Update client-side code:**
   Replace Socket.IO hooks with `useRealtime`:
   ```typescript
   // Old Socket.IO code
   // const socket = useSocket();
   // socket.on("update", handleUpdate);

   // New polling-based code
   import { useRealtime } from "@/hooks/useRealtime";
   const { updates, publishUpdate } = useRealtime({
     types: ["inventory", "invoice"],
     onUpdate: handleUpdate
   });
   ```

3. **Update server-side code:**
   Replace Socket.IO emits with API calls to `/api/realtime`:
   ```typescript
   // Old Socket.IO code
   // io.emit("update", data);

   // New API-based code
   await fetch("/api/realtime", {
     method: "POST",
     headers: { "Content-Type": "application/json" },
     body: JSON.stringify({ type: "inventory", data })
   });
   ```

4. **Remove server.js:**
   The custom server is not compatible with Vercel. Remove `server.js` and update package.json scripts.

5. **Test the migration:**
   ```bash
   npm run dev
   ```