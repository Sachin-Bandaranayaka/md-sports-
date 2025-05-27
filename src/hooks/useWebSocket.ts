import { useEffect, useState, useRef, useCallback } from 'react';
import { io, Socket } from 'socket.io-client';
import { WEBSOCKET_EVENTS } from '@/lib/websocket';

export interface UseWebSocketOptions {
    autoConnect?: boolean;
    reconnectionAttempts?: number;
    reconnectionDelay?: number;
    events?: string[];
}

export interface UseWebSocketResult {
    socket: Socket | null;
    isConnected: boolean;
    lastMessage: { event: string; data: any } | null;
    connect: () => void;
    disconnect: () => void;
    subscribe: (event: string, callback: (data: any) => void) => () => void;
    emit: (event: string, data: any) => void;
}

export function useWebSocket(options: UseWebSocketOptions = {}): UseWebSocketResult {
    const {
        autoConnect = true,
        reconnectionAttempts = 5,
        reconnectionDelay = 3000,
        events = [],
    } = options;

    const [socket, setSocket] = useState<Socket | null>(null);
    const [isConnected, setIsConnected] = useState<boolean>(false);
    const [lastMessage, setLastMessage] = useState<{ event: string; data: any } | null>(null);

    // Store callbacks in a ref to avoid re-subscribing on every render
    const callbacksRef = useRef<Map<string, Set<(data: any) => void>>>(new Map());

    // Initialize socket connection
    useEffect(() => {
        if (!autoConnect) return;

        const socketInstance = io({
            path: '/api/socketio',
            reconnectionAttempts,
            reconnectionDelay,
            autoConnect: true,
        });

        setSocket(socketInstance);

        // Clean up on unmount
        return () => {
            if (socketInstance) {
                socketInstance.disconnect();
            }
        };
    }, [autoConnect, reconnectionAttempts, reconnectionDelay]);

    // Set up connection event handlers
    useEffect(() => {
        if (!socket) return;

        const onConnect = () => {
            console.log('WebSocket connected');
            setIsConnected(true);
        };

        const onDisconnect = (reason: string) => {
            console.log(`WebSocket disconnected: ${reason}`);
            setIsConnected(false);
        };

        const onError = (error: Error) => {
            console.error('WebSocket error:', error);
        };

        socket.on('connect', onConnect);
        socket.on('disconnect', onDisconnect);
        socket.on('error', onError);

        return () => {
            socket.off('connect', onConnect);
            socket.off('disconnect', onDisconnect);
            socket.off('error', onError);
        };
    }, [socket]);

    // Set up event listeners for specified events
    useEffect(() => {
        if (!socket || !events.length) return;

        const handleEvent = (event: string) => (data: any) => {
            setLastMessage({ event, data });

            // Call all registered callbacks for this event
            const callbacks = callbacksRef.current.get(event);
            if (callbacks) {
                callbacks.forEach(callback => {
                    try {
                        callback(data);
                    } catch (error) {
                        console.error(`Error in WebSocket callback for event ${event}:`, error);
                    }
                });
            }
        };

        // Set up listeners for all events
        events.forEach(event => {
            socket.on(event, handleEvent(event));
        });

        return () => {
            // Clean up listeners
            events.forEach(event => {
                socket.off(event, handleEvent(event));
            });
        };
    }, [socket, events]);

    // Subscribe to an event with a callback
    const subscribe = useCallback((event: string, callback: (data: any) => void) => {
        if (!callbacksRef.current.has(event)) {
            callbacksRef.current.set(event, new Set());
        }

        const callbacks = callbacksRef.current.get(event)!;
        callbacks.add(callback);

        // Add socket listener if this is the first callback for this event
        if (socket && callbacks.size === 1) {
            const handler = (data: any) => {
                setLastMessage({ event, data });
                callbacks.forEach(cb => {
                    try {
                        cb(data);
                    } catch (error) {
                        console.error(`Error in WebSocket callback for event ${event}:`, error);
                    }
                });
            };

            socket.on(event, handler);
        }

        // Return unsubscribe function
        return () => {
            const callbacks = callbacksRef.current.get(event);
            if (callbacks) {
                callbacks.delete(callback);

                // Remove socket listener if no more callbacks for this event
                if (callbacks.size === 0 && socket) {
                    socket.off(event);
                    callbacksRef.current.delete(event);
                }
            }
        };
    }, [socket]);

    // Manually connect to socket
    const connect = useCallback(() => {
        if (socket) {
            socket.connect();
        }
    }, [socket]);

    // Manually disconnect from socket
    const disconnect = useCallback(() => {
        if (socket) {
            socket.disconnect();
        }
    }, [socket]);

    // Emit an event
    const emit = useCallback((event: string, data: any) => {
        if (socket && isConnected) {
            socket.emit(event, data);
        } else {
            console.warn('Cannot emit event: socket is not connected');
        }
    }, [socket, isConnected]);

    return {
        socket,
        isConnected,
        lastMessage,
        connect,
        disconnect,
        subscribe,
        emit,
    };
}

// Convenience hook for dashboard updates
export function useDashboardUpdates(callback: (data: any) => void) {
    const { subscribe } = useWebSocket({
        events: [WEBSOCKET_EVENTS.DASHBOARD_UPDATE],
    });

    useEffect(() => {
        const unsubscribe = subscribe(WEBSOCKET_EVENTS.DASHBOARD_UPDATE, callback);
        return unsubscribe;
    }, [subscribe, callback]);
}

// Convenience hook for inventory updates
export function useInventoryUpdates(callback: (data: any) => void) {
    const { subscribe } = useWebSocket({
        events: [
            WEBSOCKET_EVENTS.INVENTORY_UPDATE,
            WEBSOCKET_EVENTS.INVENTORY_ITEM_UPDATE,
            WEBSOCKET_EVENTS.INVENTORY_ITEM_CREATE,
            WEBSOCKET_EVENTS.INVENTORY_ITEM_DELETE,
        ],
    });

    useEffect(() => {
        const unsubscribes = [
            subscribe(WEBSOCKET_EVENTS.INVENTORY_UPDATE, callback),
            subscribe(WEBSOCKET_EVENTS.INVENTORY_ITEM_UPDATE, callback),
            subscribe(WEBSOCKET_EVENTS.INVENTORY_ITEM_CREATE, callback),
            subscribe(WEBSOCKET_EVENTS.INVENTORY_ITEM_DELETE, callback),
        ];

        return () => {
            unsubscribes.forEach(unsubscribe => unsubscribe());
        };
    }, [subscribe, callback]);
}

// Convenience hook for invoice updates
export function useInvoiceUpdates(callback: (data: any) => void) {
    const { subscribe } = useWebSocket({
        events: [
            WEBSOCKET_EVENTS.INVOICE_UPDATE,
            WEBSOCKET_EVENTS.INVOICE_CREATE,
            WEBSOCKET_EVENTS.INVOICE_STATUS_UPDATE,
            WEBSOCKET_EVENTS.INVOICE_DELETE,
        ],
    });

    useEffect(() => {
        const unsubscribes = [
            subscribe(WEBSOCKET_EVENTS.INVOICE_UPDATE, callback),
            subscribe(WEBSOCKET_EVENTS.INVOICE_CREATE, callback),
            subscribe(WEBSOCKET_EVENTS.INVOICE_STATUS_UPDATE, callback),
            subscribe(WEBSOCKET_EVENTS.INVOICE_DELETE, callback),
        ];

        return () => {
            unsubscribes.forEach(unsubscribe => unsubscribe());
        };
    }, [subscribe, callback]);
}

// Convenience hook for customer updates
export function useCustomerUpdates(callback: (data: any) => void) {
    const { subscribe } = useWebSocket({
        events: [
            WEBSOCKET_EVENTS.CUSTOMER_UPDATE,
            WEBSOCKET_EVENTS.CUSTOMER_CREATE,
            WEBSOCKET_EVENTS.CUSTOMER_DELETE,
        ],
    });

    useEffect(() => {
        const unsubscribes = [
            subscribe(WEBSOCKET_EVENTS.CUSTOMER_UPDATE, callback),
            subscribe(WEBSOCKET_EVENTS.CUSTOMER_CREATE, callback),
            subscribe(WEBSOCKET_EVENTS.CUSTOMER_DELETE, callback),
        ];

        return () => {
            unsubscribes.forEach(unsubscribe => unsubscribe());
        };
    }, [subscribe, callback]);
}

// Convenience hook for purchase updates
export function usePurchaseUpdates(callback: (data: any) => void) {
    const { subscribe } = useWebSocket({
        events: [
            WEBSOCKET_EVENTS.PURCHASE_UPDATE,
            WEBSOCKET_EVENTS.PURCHASE_CREATE,
            WEBSOCKET_EVENTS.PURCHASE_STATUS_UPDATE,
            WEBSOCKET_EVENTS.PURCHASE_DELETE,
        ],
    });

    useEffect(() => {
        const unsubscribes = [
            subscribe(WEBSOCKET_EVENTS.PURCHASE_UPDATE, callback),
            subscribe(WEBSOCKET_EVENTS.PURCHASE_CREATE, callback),
            subscribe(WEBSOCKET_EVENTS.PURCHASE_STATUS_UPDATE, callback),
            subscribe(WEBSOCKET_EVENTS.PURCHASE_DELETE, callback),
        ];

        return () => {
            unsubscribes.forEach(unsubscribe => unsubscribe());
        };
    }, [subscribe, callback]);
} 