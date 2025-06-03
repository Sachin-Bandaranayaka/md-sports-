import { useEffect, useState, useRef, useCallback } from 'react';
import { io, Socket } from 'socket.io-client';
import { WEBSOCKET_EVENTS } from '@/lib/websocket';
import { useSocket as useSocketFromContext } from '@/context/SocketContext';

export interface UseWebSocketOptions {
    autoConnect?: boolean;
    reconnectionAttempts?: number;
    reconnectionDelay?: number;
    events?: string[];
    forceOwnConnection?: boolean;
}

export interface UseWebSocketResult {
    socket: Socket | null;
    isConnected: boolean;
    lastMessage: { event: string; data: any } | null;
    connect: () => void;
    disconnect: () => void;
    subscribe: (event: string, callback: (data: any) => void) => () => void;
    emit: (event: string, data: any) => void;
    reconnect: () => void;
}

export function useWebSocket(options: UseWebSocketOptions = {}): UseWebSocketResult {
    const {
        autoConnect = true,
        reconnectionAttempts = 5,
        reconnectionDelay = 3000,
        events = [],
        forceOwnConnection = false,
    } = options;

    const contextSocket = useSocketFromContext();

    const shouldUseContextSocket = !forceOwnConnection && contextSocket && contextSocket.socket;

    const [socketState, setSocketState] = useState<Socket | null>(shouldUseContextSocket ? contextSocket.socket : null);
    const [isConnected, setIsConnected] = useState<boolean>(shouldUseContextSocket ? contextSocket.isConnected : false);
    const [lastMessage, setLastMessage] = useState<{ event: string; data: any } | null>(null);

    const callbacksRef = useRef<Map<string, Set<(data: any) => void>>>(new Map());
    const ownSocketRef = useRef<Socket | null>(null);
    const reconnectTimerRef = useRef<NodeJS.Timeout | null>(null);
    const reconnectAttemptsRef = useRef(0);
    const maxReconnectAttempts = 10;

    // Create own socket instance if needed
    const createOwnSocketInstance = useCallback(() => {
        console.log('useWebSocket: Creating new own socket instance');

        // Clear any existing reconnect timer
        if (reconnectTimerRef.current) {
            clearTimeout(reconnectTimerRef.current);
            reconnectTimerRef.current = null;
        }

        const socketInstance = io({
            path: '/api/socketio',
            reconnectionAttempts,
            reconnectionDelay,
            autoConnect: true,
            transports: ['websocket', 'polling'],
        });

        ownSocketRef.current = socketInstance;
        setSocketState(socketInstance);

        // Set up event listeners
        socketInstance.on('connect', () => {
            console.log('useWebSocket: Own socket connected', socketInstance.id);
            setIsConnected(true);
            reconnectAttemptsRef.current = 0;
        });

        socketInstance.on('disconnect', (reason) => {
            console.log(`useWebSocket: Own socket disconnected: ${reason}`, socketInstance.id);
            setIsConnected(false);

            // Try to reconnect for certain disconnect reasons
            if (reason === 'io server disconnect' || reason === 'transport close') {
                attemptReconnect();
            }
        });

        socketInstance.on('connect_error', (error) => {
            console.error('useWebSocket: Own socket connection error:', error);
            setIsConnected(false);
            attemptReconnect();
        });

        return socketInstance;
    }, [reconnectionAttempts, reconnectionDelay]);

    // Attempt reconnection with exponential backoff
    const attemptReconnect = useCallback(() => {
        if (reconnectAttemptsRef.current >= maxReconnectAttempts) {
            console.log('useWebSocket: Maximum reconnection attempts reached. Giving up.');
            return;
        }

        reconnectAttemptsRef.current += 1;
        const delay = Math.min(30000, reconnectionDelay * Math.pow(1.5, reconnectAttemptsRef.current));

        console.log(`useWebSocket: Attempting to reconnect in ${delay}ms (attempt ${reconnectAttemptsRef.current}/${maxReconnectAttempts})...`);

        reconnectTimerRef.current = setTimeout(() => {
            console.log('useWebSocket: Reconnecting own socket now...');
            if (ownSocketRef.current) {
                ownSocketRef.current.close();
                ownSocketRef.current = null;
            }
            createOwnSocketInstance();
        }, delay);
    }, [createOwnSocketInstance, reconnectionDelay]);

    useEffect(() => {
        if (shouldUseContextSocket) {
            setSocketState(contextSocket.socket);
            setIsConnected(contextSocket.isConnected);
            return;
        }

        if (!autoConnect && !forceOwnConnection) return;

        const socketInstance = createOwnSocketInstance();

        return () => {
            if (reconnectTimerRef.current) {
                clearTimeout(reconnectTimerRef.current);
                reconnectTimerRef.current = null;
            }

            if (ownSocketRef.current) {
                console.log('useWebSocket: Disconnecting own socket instance');
                ownSocketRef.current.disconnect();
                ownSocketRef.current = null;
            }
        };
    }, [autoConnect, forceOwnConnection, shouldUseContextSocket, contextSocket?.socket, contextSocket?.isConnected, createOwnSocketInstance]);

    useEffect(() => {
        if (shouldUseContextSocket) {
            setSocketState(contextSocket.socket);
            setIsConnected(contextSocket.isConnected);
        }
    }, [contextSocket?.socket, contextSocket?.isConnected, shouldUseContextSocket]);

    useEffect(() => {
        const currentSocket = socketState;
        if (!currentSocket) return;

        const onConnect = () => {
            console.log('useWebSocket: Event - connected', currentSocket.id);
            setIsConnected(true);
        };

        const onDisconnect = (reason: string) => {
            console.log(`useWebSocket: Event - disconnected: ${reason}`, currentSocket.id);
            setIsConnected(false);
        };

        const onError = (error: Error) => {
            console.error('useWebSocket: Event - error:', error, currentSocket.id);
        };

        currentSocket.on('connect', onConnect);
        currentSocket.on('disconnect', onDisconnect);
        currentSocket.on('error', onError);

        if (shouldUseContextSocket && contextSocket.socket?.connected) {
            setIsConnected(true);
        } else if (!shouldUseContextSocket && ownSocketRef.current?.connected) {
            setIsConnected(true);
        }

        return () => {
            currentSocket.off('connect', onConnect);
            currentSocket.off('disconnect', onDisconnect);
            currentSocket.off('error', onError);
        };
    }, [socketState, shouldUseContextSocket, contextSocket.socket]);

    useEffect(() => {
        const currentSocket = socketState;
        if (!currentSocket || !events.length) return;

        const handleEvent = (event: string) => (data: any) => {
            setLastMessage({ event, data });
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

        events.forEach(event => {
            currentSocket.on(event, handleEvent(event));
        });

        return () => {
            events.forEach(event => {
                currentSocket.off(event, handleEvent(event));
            });
        };
    }, [socketState, events]);

    const subscribe = useCallback((event: string, callback: (data: any) => void) => {
        const currentSocket = socketState;
        if (!currentSocket) {
            console.warn("useWebSocket: Cannot subscribe, socket not available");
            return () => { };
        }

        if (!callbacksRef.current.has(event)) {
            callbacksRef.current.set(event, new Set());
        }

        const callbacks = callbacksRef.current.get(event)!;
        callbacks.add(callback);

        const handler = (data: any) => {
            callbacks.forEach(cb => {
                try {
                    cb(data);
                } catch (error) {
                    console.error(`Error in WebSocket callback for event ${event}:`, error);
                }
            });
        };

        if (!events.includes(event)) {
            currentSocket.on(event, handler);
        }

        return () => {
            const callbacks = callbacksRef.current.get(event);
            if (callbacks) {
                callbacks.delete(callback);
                if (callbacks.size === 0) {
                    if (!events.includes(event)) {
                        currentSocket.off(event, handler);
                    }
                    callbacksRef.current.delete(event);
                }
            }
        };
    }, [socketState, events]);

    const connect = useCallback(() => {
        if (!shouldUseContextSocket && ownSocketRef.current) {
            console.log('useWebSocket: Manually connecting own socket');
            ownSocketRef.current.connect();
        } else if (shouldUseContextSocket) {
            console.warn('useWebSocket: Connect was called, but using context socket. Connection is managed by SocketProvider.');
        }
    }, [shouldUseContextSocket]);

    const disconnect = useCallback(() => {
        if (!shouldUseContextSocket && ownSocketRef.current) {
            console.log('useWebSocket: Manually disconnecting own socket');
            ownSocketRef.current.disconnect();
        } else if (shouldUseContextSocket) {
            console.warn('useWebSocket: Disconnect was called, but using context socket. Disconnection is managed by SocketProvider.');
        }
    }, [shouldUseContextSocket]);

    const reconnect = useCallback(() => {
        if (shouldUseContextSocket) {
            console.log('useWebSocket: Reconnecting via context socket');
            contextSocket.reconnect();
        } else if (ownSocketRef.current) {
            console.log('useWebSocket: Reconnecting own socket');
            reconnectAttemptsRef.current = 0;
            if (ownSocketRef.current) {
                ownSocketRef.current.close();
                ownSocketRef.current = null;
            }
            createOwnSocketInstance();
        }
    }, [shouldUseContextSocket, contextSocket, createOwnSocketInstance]);

    const emit = useCallback((event: string, data: any) => {
        const currentSocket = socketState;
        if (currentSocket && isConnected) {
            currentSocket.emit(event, data);
        } else {
            console.warn('Cannot emit event: socket is not connected or not available');
        }
    }, [socketState, isConnected]);

    return {
        socket: socketState,
        isConnected,
        lastMessage,
        connect,
        disconnect,
        subscribe,
        emit,
        reconnect,
    };
}

export function useDashboardUpdates(callback: (data: any) => void) {
    const { subscribe, isConnected, socket } = useWebSocket({
    });

    useEffect(() => {
        if (!isConnected || !socket) return;
        const handler = (eventData: any) => {
            callback({ type: WEBSOCKET_EVENTS.DASHBOARD_UPDATE, ...eventData });
        };
        const unsubscribe = subscribe(WEBSOCKET_EVENTS.DASHBOARD_UPDATE, handler);
        return unsubscribe;
    }, [subscribe, callback, isConnected, socket]);
}

export function useInventoryUpdates(callback: (data: any) => void) {
    const { subscribe, isConnected, socket } = useWebSocket({
    });

    useEffect(() => {
        if (!isConnected || !socket) {
            console.log('useInventoryUpdates: Not connected or socket not available, skipping subscription setup.');
            return;
        }
        console.log('useInventoryUpdates: Setting up subscriptions...');

        const eventTypes = [
            WEBSOCKET_EVENTS.INVENTORY_UPDATE,
            WEBSOCKET_EVENTS.INVENTORY_ITEM_UPDATE,
            WEBSOCKET_EVENTS.INVENTORY_ITEM_CREATE,
            WEBSOCKET_EVENTS.INVENTORY_ITEM_DELETE,
            WEBSOCKET_EVENTS.INVENTORY_LEVEL_UPDATED,
        ];

        const unsubscribes = eventTypes.map(eventType => {
            const handler = (eventData: any) => {
                console.log(`useInventoryUpdates: Received event ${eventType}`, eventData);
                callback({ type: eventType, ...eventData });
            };
            return subscribe(eventType, handler);
        });

        return () => {
            console.log('useInventoryUpdates: Cleaning up subscriptions...');
            unsubscribes.forEach(unsubscribe => unsubscribe());
        };
    }, [subscribe, callback, isConnected, socket]);
}

export function useInvoiceUpdates(callback: (data: any) => void) {
    const { subscribe, isConnected, socket } = useWebSocket({});

    useEffect(() => {
        if (!isConnected || !socket) return;
        const eventTypes = [
            WEBSOCKET_EVENTS.INVOICE_UPDATE,
            WEBSOCKET_EVENTS.INVOICE_CREATE,
            WEBSOCKET_EVENTS.INVOICE_STATUS_UPDATE,
            WEBSOCKET_EVENTS.INVOICE_DELETE,
        ];
        const unsubscribes = eventTypes.map(eventType => {
            const handler = (eventData: any) => {
                callback({ type: eventType, ...eventData });
            };
            return subscribe(eventType, handler);
        });
        return () => {
            unsubscribes.forEach(unsubscribe => unsubscribe());
        };
    }, [subscribe, callback, isConnected, socket]);
}

export function useCustomerUpdates(callback: (data: any) => void) {
    const { subscribe, isConnected, socket } = useWebSocket({});

    useEffect(() => {
        if (!isConnected || !socket) return;
        const eventTypes = [
            WEBSOCKET_EVENTS.CUSTOMER_UPDATE,
            WEBSOCKET_EVENTS.CUSTOMER_CREATE,
            WEBSOCKET_EVENTS.CUSTOMER_DELETE,
        ];
        const unsubscribes = eventTypes.map(eventType => {
            const handler = (eventData: any) => {
                callback({ type: eventType, ...eventData });
            };
            return subscribe(eventType, handler);
        });
        return () => {
            unsubscribes.forEach(unsubscribe => unsubscribe());
        };
    }, [subscribe, callback, isConnected, socket]);
}

export function usePurchaseUpdates(callback: (data: any) => void) {
    const { subscribe, isConnected } = useWebSocket({
        events: [
            WEBSOCKET_EVENTS.PURCHASE_INVOICE_CREATED,
            WEBSOCKET_EVENTS.PURCHASE_INVOICE_UPDATED,
            WEBSOCKET_EVENTS.PURCHASE_INVOICE_DELETED,
            // Also listen to generic purchase status/update if needed
            // WEBSOCKET_EVENTS.PURCHASE_STATUS_UPDATE,
            // WEBSOCKET_EVENTS.PURCHASE_UPDATE,
        ]
    });

    useEffect(() => {
        if (!isConnected) return;

        // Modified handler creation
        const createHandler = (eventType: string) => (payload: any) => {
            // Construct eventData with type and payload
            // Ensure payload is not null or undefined to avoid spreading issues if it's a simple value
            const eventData = payload && typeof payload === 'object'
                ? { type: eventType, ...payload }
                : { type: eventType, data: payload }; // Wrap non-object payload if necessary
            callback(eventData);
        };

        const unsubscribes = [
            subscribe(WEBSOCKET_EVENTS.PURCHASE_INVOICE_CREATED, createHandler(WEBSOCKET_EVENTS.PURCHASE_INVOICE_CREATED)),
            subscribe(WEBSOCKET_EVENTS.PURCHASE_INVOICE_UPDATED, createHandler(WEBSOCKET_EVENTS.PURCHASE_INVOICE_UPDATED)),
            subscribe(WEBSOCKET_EVENTS.PURCHASE_INVOICE_DELETED, createHandler(WEBSOCKET_EVENTS.PURCHASE_INVOICE_DELETED)),
            // Example for other events if they were active:
            // subscribe(WEBSOCKET_EVENTS.PURCHASE_STATUS_UPDATE, createHandler(WEBSOCKET_EVENTS.PURCHASE_STATUS_UPDATE)),
            // subscribe(WEBSOCKET_EVENTS.PURCHASE_UPDATE, createHandler(WEBSOCKET_EVENTS.PURCHASE_UPDATE)),
        ];

        return () => {
            unsubscribes.forEach(unsubscribe => unsubscribe());
        };
    }, [subscribe, callback, isConnected]);
} 