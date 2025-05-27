'use client';

import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { io, Socket } from 'socket.io-client';

interface SocketContextType {
  socket: Socket | null;
  isConnected: boolean;
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

  useEffect(() => {
    // Ensure this runs only on the client
    if (typeof window !== 'undefined') {
      console.log('Attempting to connect WebSocket...');
      // The server URL and path should match your setup
      // Path is /api/socketio based on src/lib/websocket.ts
      const newSocket = io(process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000', {
        path: '/api/socketio',
        reconnectionAttempts: 5,
        timeout: 10000,
        transports: ['websocket'], // Explicitly use WebSocket
      });

      newSocket.on('connect', () => {
        console.log('WebSocket connected:', newSocket.id);
        setIsConnected(true);
        setSocket(newSocket);
      });

      newSocket.on('disconnect', (reason) => {
        console.log('WebSocket disconnected:', reason);
        setIsConnected(false);
        // No need to setSocket(null) here, as it might attempt to reconnect
      });

      newSocket.on('connect_error', (error) => {
        console.error('WebSocket connection error:', error);
        setIsConnected(false);
        // newSocket.close(); // Optionally close if specific errors are non-recoverable
      });
      
      // Set the socket state immediately so it can be used by consumers
      // even before the 'connect' event, though isConnected will be false initially.
      // This was an issue previously where socket was null until connection.
      setSocket(newSocket);


      return () => {
        console.log('Cleaning up WebSocket connection...');
        newSocket.disconnect();
        setIsConnected(false);
        setSocket(null); 
      };
    }
  }, []); // Empty dependency array ensures this runs once on mount and unmount

  return (
    <SocketContext.Provider value={{ socket, isConnected }}>
      {children}
    </SocketContext.Provider>
  );
}; 