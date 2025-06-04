import { Server as SocketIOServer } from 'socket.io';
import type { Server as HTTPServer } from 'http';
import type { NextApiRequest, NextApiResponse } from 'next';
import type { Socket as NetSocket } from 'net';
import type { Server as IOServer } from 'socket.io';

export const WEBSOCKET_EVENTS = {
  // Dashboard events
  DASHBOARD_UPDATE: 'dashboard:update',

  // Inventory events
  INVENTORY_UPDATE: 'inventory:update',
  INVENTORY_ITEM_UPDATE: 'inventory:item:update',
  INVENTORY_ITEM_CREATE: 'inventory:item:create',
  INVENTORY_ITEM_DELETE: 'inventory:item:delete',

  // Customer events
  CUSTOMER_UPDATE: 'customer:update',
  CUSTOMER_CREATE: 'customer:create',
  CUSTOMER_DELETE: 'customer:delete',

  // Invoice events
  INVOICE_UPDATE: 'invoice:update',
  INVOICE_CREATE: 'invoice:create',
  INVOICE_STATUS_UPDATE: 'invoice:status:update',
  INVOICE_DELETE: 'invoice:delete',

  // Purchase events
  PURCHASE_UPDATE: 'purchase:update',
  PURCHASE_CREATE: 'purchase:create',
  PURCHASE_STATUS_UPDATE: 'purchase:status:update',
  PURCHASE_DELETE: 'purchase:delete',

  // Real-time User Activity (Example)
  USER_ACTIVITY: 'user:activity',

  // System Notifications (Example)
  SYSTEM_NOTIFICATION: 'system:notification',

  // Purchase Invoice Events (NEW)
  PURCHASE_INVOICE_CREATED: 'purchase:invoice:created',
  PURCHASE_INVOICE_UPDATED: 'purchase:invoice:updated',
  PURCHASE_INVOICE_DELETED: 'purchase:invoice:deleted',

  // Generic Inventory Level Update (NEW)
  // Payload should ideally contain { productId, shopId, newQuantity } or similar
  INVENTORY_LEVEL_UPDATED: 'inventory:level:updated',
};

interface SocketServer extends HTTPServer {
  io?: IOServer | undefined;
}

interface SocketWithIO extends NetSocket {
  server: SocketServer;
}

interface NextApiResponseWithSocket extends NextApiResponse {
  socket: SocketWithIO;
}

export function getSocketIO(): IOServer | null {
  // @ts-ignore
  return global.io || null;
}

export function initSocketIO(server: HTTPServer): IOServer {
  let currentIO = getSocketIO();
  if (!currentIO) {
    currentIO = new SocketIOServer(server, {
      path: '/api/socketio',
      addTrailingSlash: false,
      cors: {
        origin: process.env.NODE_ENV === 'production'
          ? process.env.NEXT_PUBLIC_SITE_URL || '*'
          : 'http://localhost:3000', // Assuming client runs on 3000
        methods: ['GET', 'POST'],
        credentials: true,
      },
    });

    console.log('Socket.IO server initialized and attached to global.io');
    // @ts-ignore
    global.io = currentIO;

    // Set up event handlers
    currentIO.on('connection', (socket) => {
      console.log(`Client connected: ${socket.id}`);

      socket.on('disconnect', () => {
        console.log(`Client disconnected: ${socket.id}`);
      });
    });
  }
  return currentIO;
}

// Helper function to emit events to all connected clients
export function emitToAll(event: string, data: any): void {
  const ioInstance = getSocketIO();
  if (ioInstance) {
    ioInstance.emit(event, data);
  }
}

// Helper function to emit events to specific rooms
export function emitToRoom(room: string, event: string, data: any): void {
  const ioInstance = getSocketIO();
  if (ioInstance) {
    ioInstance.to(room).emit(event, data);
  }
}

// Helper to check if Socket.IO is initialized
export function isSocketIOInitialized(): boolean {
  return getSocketIO() !== null;
}

/**
 * Enterprise-grade WebSocket Client Service
 * Provides real-time communication with fallback mechanisms
 */
import { EventEmitter } from 'events';
import { io, Socket } from 'socket.io-client';

interface WebSocketMessage {
  type: string;
  payload: any;
  timestamp: number;
  id: string;
}

interface InventoryUpdate {
  type: 'inventory_updated' | 'inventory_created' | 'inventory_deleted' | 'low_stock_alert';
  data: {
    id?: string;
    productId?: string;
    shopId?: string;
    quantity?: number;
    threshold?: number;
    [key: string]: any;
  };
}

interface ConnectionConfig {
  url: string;
  reconnectInterval: number;
  maxReconnectAttempts: number;
  heartbeatInterval: number;
  enableCompression: boolean;
}

class WebSocketClientService extends EventEmitter {
  private socket: Socket | null = null;
  private config: ConnectionConfig;
  private reconnectAttempts = 0;
  private subscriptions = new Set<string>();
  private connectionId: string | null = null;
  private isConnecting = false;

  constructor(config: Partial<ConnectionConfig> = {}) {
    super();

    this.config = {
      url: process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000',
      reconnectInterval: 5000,
      maxReconnectAttempts: 10,
      heartbeatInterval: 30000,
      enableCompression: true,
      ...config
    };

    // Auto-connect in browser environment
    if (typeof window !== 'undefined') {
      this.connect();
    }
  }

  /**
   * Establish Socket.IO connection
   */
  public async connect(): Promise<void> {
    if (this.isConnecting || (this.socket && this.socket.connected)) {
      return;
    }

    this.isConnecting = true;

    try {
      this.socket = io(this.config.url, {
        path: '/api/socketio',
        transports: ['websocket', 'polling'],
        upgrade: true,
        rememberUpgrade: true,
        timeout: 20000,
        forceNew: false,
        reconnection: true,
        reconnectionAttempts: this.config.maxReconnectAttempts,
        reconnectionDelay: this.config.reconnectInterval,
        reconnectionDelayMax: 30000,
        maxReconnectionAttempts: this.config.maxReconnectAttempts,
        randomizationFactor: 0.5
      });

      this.setupEventHandlers();

    } catch (error) {
      console.error('Socket.IO connection failed:', error);
      this.isConnecting = false;
      this.emit('error', error);
    }
  }

  /**
   * Close Socket.IO connection
   */
  public disconnect(): void {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
    }

    this.reconnectAttempts = 0;
    this.connectionId = null;
    this.isConnecting = false;
    this.emit('disconnected');
  }

  /**
   * Send message through Socket.IO
   */
  public send(event: string, data: any): void {
    if (this.socket && this.socket.connected) {
      this.socket.emit(event, data);
    } else {
      console.warn('Socket not connected, message queued:', event, data);
      // Queue message for when connection is restored
      this.once('connected', () => {
        if (this.socket && this.socket.connected) {
          this.socket.emit(event, data);
        }
      });
    }
  }

  /**
   * Subscribe to inventory updates for specific filters
   */
  public subscribeToInventory(filters: {
    shopId?: string;
    categoryId?: string;
    productId?: string;
    lowStockOnly?: boolean;
  } = {}): void {
    const subscriptionKey = `inventory:${JSON.stringify(filters)}`;

    if (!this.subscriptions.has(subscriptionKey)) {
      this.subscriptions.add(subscriptionKey);

      if (this.socket && this.socket.connected) {
        this.socket.emit('subscribe:inventory', filters);
      }
    }
  }

  /**
   * Unsubscribe from inventory updates
   */
  public unsubscribeFromInventory(filters: any = {}): void {
    const subscriptionKey = `inventory:${JSON.stringify(filters)}`;

    if (this.subscriptions.has(subscriptionKey)) {
      this.subscriptions.delete(subscriptionKey);

      if (this.socket && this.socket.connected) {
        this.socket.emit('unsubscribe:inventory', filters);
      }
    }
  }

  /**
   * Subscribe to performance metrics updates
   */
  public subscribeToMetrics(): void {
    if (this.socket && this.socket.connected) {
      this.socket.emit('subscribe:metrics');
    }
  }

  /**
   * Check if Socket.IO is connected
   */
  public isConnected(): boolean {
    return this.socket !== null && this.socket.connected;
  }

  /**
   * Get connection status
   */
  public getStatus(): {
    connected: boolean;
    connecting: boolean;
    reconnectAttempts: number;
    connectionId: string | null;
  } {
    return {
      connected: this.isConnected(),
      connecting: this.isConnecting,
      reconnectAttempts: this.reconnectAttempts,
      connectionId: this.connectionId
    };
  }

  /**
   * Setup Socket.IO event handlers
   */
  private setupEventHandlers(): void {
    if (!this.socket) return;

    this.socket.on('connect', () => {
      console.log('Socket.IO connected:', this.socket?.id);
      this.isConnecting = false;
      this.reconnectAttempts = 0;
      this.connectionId = this.socket?.id || null;

      // Re-establish subscriptions
      this.reestablishSubscriptions();

      this.emit('connected');
    });

    this.socket.on('disconnect', (reason) => {
      console.log('Socket.IO disconnected:', reason);
      this.isConnecting = false;
      this.connectionId = null;
      this.emit('disconnected', { reason });
    });

    this.socket.on('connect_error', (error) => {
      console.error('Socket.IO connection error:', error);
      this.isConnecting = false;
      this.emit('error', error);
    });

    this.socket.on('reconnect', (attemptNumber) => {
      console.log('Socket.IO reconnected after', attemptNumber, 'attempts');
      this.reconnectAttempts = 0;
      this.emit('reconnected', { attemptNumber });
    });

    this.socket.on('reconnect_attempt', (attemptNumber) => {
      console.log('Socket.IO reconnection attempt:', attemptNumber);
      this.reconnectAttempts = attemptNumber;
      this.emit('reconnect_attempt', { attemptNumber });
    });

    this.socket.on('reconnect_error', (error) => {
      console.error('Socket.IO reconnection error:', error);
      this.emit('reconnect_error', error);
    });

    this.socket.on('reconnect_failed', () => {
      console.error('Socket.IO reconnection failed');
      this.emit('reconnect_failed');
    });

    // Inventory events
    this.socket.on(WEBSOCKET_EVENTS.INVENTORY_UPDATE, (data) => {
      this.emit('inventory_update', data);
    });

    this.socket.on(WEBSOCKET_EVENTS.INVENTORY_ITEM_UPDATE, (data) => {
      this.emit('inventory_item_update', data);
    });

    this.socket.on(WEBSOCKET_EVENTS.INVENTORY_ITEM_CREATE, (data) => {
      this.emit('inventory_item_create', data);
    });

    this.socket.on(WEBSOCKET_EVENTS.INVENTORY_ITEM_DELETE, (data) => {
      this.emit('inventory_item_delete', data);
    });

    this.socket.on(WEBSOCKET_EVENTS.INVENTORY_LEVEL_UPDATED, (data) => {
      this.emit('inventory_level_updated', data);
    });

    // Dashboard events
    this.socket.on(WEBSOCKET_EVENTS.DASHBOARD_UPDATE, (data) => {
      this.emit('dashboard_update', data);
    });

    // Performance metrics
    this.socket.on('metrics:update', (data) => {
      this.emit('metrics_update', data);
    });
  }

  /**
   * Re-establish subscriptions after reconnection
   */
  private reestablishSubscriptions(): void {
    this.subscriptions.forEach(subscription => {
      const [channel, filtersStr] = subscription.split(':');

      if (channel === 'inventory') {
        const filters = JSON.parse(filtersStr);
        this.socket?.emit('subscribe:inventory', filters);
      }
    });
  }
}

// Singleton instance
let wsClientService: WebSocketClientService | null = null;

/**
 * Get WebSocket client service instance
 */
export function getWebSocketClientService(): WebSocketClientService {
  if (!wsClientService) {
    wsClientService = new WebSocketClientService();
  }
  return wsClientService;
}

/**
 * React hook for WebSocket connection
 */
export function useWebSocket() {
  const ws = getWebSocketClientService();

  return {
    connect: () => ws.connect(),
    disconnect: () => ws.disconnect(),
    send: (event: string, data: any) => ws.send(event, data),
    subscribe: (event: string, handler: (...args: any[]) => void) => {
      ws.on(event, handler);
      return () => ws.off(event, handler);
    },
    subscribeToInventory: (filters: any) => ws.subscribeToInventory(filters),
    unsubscribeFromInventory: (filters: any) => ws.unsubscribeFromInventory(filters),
    subscribeToMetrics: () => ws.subscribeToMetrics(),
    isConnected: () => ws.isConnected(),
    getStatus: () => ws.getStatus()
  };
}

/**
 * React hook for inventory updates
 */
export function useInventoryUpdates(filters: any = {}) {
  const ws = getWebSocketClientService();

  React.useEffect(() => {
    ws.subscribeToInventory(filters);

    return () => {
      ws.unsubscribeFromInventory(filters);
    };
  }, [JSON.stringify(filters)]);

  return {
    subscribe: (handler: (update: any) => void) => {
      ws.on('inventory_update', handler);
      ws.on('inventory_item_update', handler);
      ws.on('inventory_item_create', handler);
      ws.on('inventory_item_delete', handler);
      ws.on('inventory_level_updated', handler);

      return () => {
        ws.off('inventory_update', handler);
        ws.off('inventory_item_update', handler);
        ws.off('inventory_item_create', handler);
        ws.off('inventory_item_delete', handler);
        ws.off('inventory_level_updated', handler);
      };
    }
  };
}

export { WebSocketClientService };
export type { WebSocketMessage, InventoryUpdate, ConnectionConfig };