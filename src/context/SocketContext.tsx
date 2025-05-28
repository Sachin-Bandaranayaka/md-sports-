'use client';

import React, { createContext, useContext, useEffect, useState, ReactNode, useRef } from 'react';
import { io, Socket } from 'socket.io-client';

interface SocketContextType {
  socket: Socket | null;
  isConnected: boolean;
  reconnect: () => void;
}

const SocketContext = createContext<SocketContextType | undefined>(undefined);

export const useSocket = (): SocketContextType => {
  const context = useContext(SocketContext);
  if (!context) {
    throw new Error('useSocket must be used within a SocketProvider');
  }
  return context;
};

interface SocketProviderProps {
  children: ReactNode;
}

export const SocketProvider: React.FC<SocketProviderProps> = ({ children }) => {
  const [socket, setSocket] = useState<Socket | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const reconnectAttemptsRef = useRef(0);
  const maxReconnectAttempts = 10;
  const reconnectDelayRef = useRef(1000); // Start with 1 second, will increase with backoff
  const reconnectTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Function to create a new socket connection
  const createSocketConnection = () => {
    console.log('Creating new WebSocket connection...');

    // Clear any existing reconnect timer
    if (reconnectTimerRef.current) {
      clearTimeout(reconnectTimerRef.current);
      reconnectTimerRef.current = null;
    }

    // The server URL and path should match your setup
    const newSocket = io(process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000', {
      path: '/api/socketio',
      reconnectionAttempts: 5,
      timeout: 10000,
      transports: ['websocket', 'polling'], // Try WebSocket first, fallback to polling
      autoConnect: true,
    });

    newSocket.on('connect', () => {
      console.log('WebSocket connected:', newSocket.id);
      setIsConnected(true);
      // Reset reconnection attempts on successful connection
      reconnectAttemptsRef.current = 0;
      reconnectDelayRef.current = 1000;
    });

    newSocket.on('disconnect', (reason) => {
      console.log('WebSocket disconnected:', reason);
      setIsConnected(false);

      // Automatically try to reconnect for certain disconnect reasons
      if (reason === 'io server disconnect' || reason === 'transport close') {
        attemptReconnect();
      }
    });

    newSocket.on('connect_error', (error) => {
      console.error('WebSocket connection error:', error);
      setIsConnected(false);
      attemptReconnect();
    });

    // Set the socket state immediately so it can be used by consumers
    setSocket(newSocket);

    return newSocket;
  };

  // Function to attempt reconnection with exponential backoff
  const attemptReconnect = () => {
    if (reconnectAttemptsRef.current >= maxReconnectAttempts) {
      console.log('Maximum reconnection attempts reached. Giving up.');
      return;
    }

    reconnectAttemptsRef.current += 1;
    const delay = Math.min(30000, reconnectDelayRef.current * 1.5); // Cap at 30 seconds
    reconnectDelayRef.current = delay;

    console.log(`Attempting to reconnect in ${delay}ms (attempt ${reconnectAttemptsRef.current}/${maxReconnectAttempts})...`);

    reconnectTimerRef.current = setTimeout(() => {
      console.log('Reconnecting now...');
      if (socket) {
        socket.close();
      }
      createSocketConnection();
    }, delay);
  };

  // Manual reconnect function that can be called by consumers
  const reconnect = () => {
    console.log('Manual reconnection requested');
    reconnectAttemptsRef.current = 0;
    reconnectDelayRef.current = 1000;

    if (socket) {
      socket.close();
    }
    createSocketConnection();
  };

  useEffect(() => {
    // Ensure this runs only on the client
    if (typeof window !== 'undefined') {
      const newSocket = createSocketConnection();

      // Set up a ping interval to keep the connection alive
      const pingInterval = setInterval(() => {
        if (newSocket && isConnected) {
          newSocket.emit('ping', { timestamp: Date.now() });
        }
      }, 30000); // Ping every 30 seconds

      // Set up a visibility change listener to reconnect when tab becomes visible again
      const handleVisibilityChange = () => {
        if (document.visibilityState === 'visible' && socket && !isConnected) {
          console.log('Page became visible again. Checking connection...');
          reconnect();
        }
      };

      document.addEventListener('visibilitychange', handleVisibilityChange);

      return () => {
        console.log('Cleaning up WebSocket connection...');
        clearInterval(pingInterval);
        document.removeEventListener('visibilitychange', handleVisibilityChange);

        if (reconnectTimerRef.current) {
          clearTimeout(reconnectTimerRef.current);
        }

        if (newSocket) {
          newSocket.disconnect();
        }

        setIsConnected(false);
        setSocket(null);
      };
    }
  }, []);

  return (
    <SocketContext.Provider value={{ socket, isConnected, reconnect }}>
      {children}
    </SocketContext.Provider>
  );
}; 