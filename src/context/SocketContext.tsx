import React, { createContext, useContext, useEffect, useRef, useState } from 'react';
import { io, Socket } from 'socket.io-client';
import { useAuth } from './AuthContext.tsx';
import { Notification } from '../types/index.ts';

interface SocketContextType {
  socket: Socket | null;
  isConnected: boolean;
  joinAuctionRoom: (auctionId: string) => void;
  leaveAuctionRoom: (auctionId: string) => void;
  viewerCount: number;
  liveNotifications: Notification[];
  clearNotification: (id: string) => void;
}

const SocketContext = createContext<SocketContextType | undefined>(undefined);

export const SocketProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { token } = useAuth();
  const socketRef = useRef<Socket | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [viewerCount, setViewerCount] = useState(1);
  const [liveNotifications, setLiveNotifications] = useState<Notification[]>([]);

  useEffect(() => {
    const s = io(window.location.origin, {
      auth: { token },
      transports: ['websocket', 'polling'],
      reconnectionAttempts: 10,
    });

    socketRef.current = s;

    s.on('connect', () => {
      setIsConnected(true);
    });

    s.on('disconnect', () => {
      setIsConnected(false);
    });

    s.on('auction:viewers', (data: { count: number }) => {
      if (typeof data?.count === 'number') {
        setViewerCount(data.count);
      }
    });

    s.on('notification', (notif: Notification) => {
      setLiveNotifications((prev) => [notif, ...prev]);
    });

    return () => {
      s.disconnect();
    };
  }, [token]);

  const joinAuctionRoom = (auctionId: string) => {
    if (socketRef.current) {
      socketRef.current.emit('auction:join', auctionId);
    }
  };

  const leaveAuctionRoom = (auctionId: string) => {
    if (socketRef.current) {
      socketRef.current.emit('auction:leave', auctionId);
    }
  };

  const clearNotification = (id: string) => {
    setLiveNotifications((prev) => prev.filter((n) => n.id !== id));
  };

  return (
    <SocketContext.Provider
      value={{
        socket: socketRef.current,
        isConnected,
        joinAuctionRoom,
        leaveAuctionRoom,
        viewerCount,
        liveNotifications,
        clearNotification,
      }}
    >
      {children}
    </SocketContext.Provider>
  );
};

export const useSocket = () => {
  const context = useContext(SocketContext);
  if (!context) {
    throw new Error('useSocket must be used within a SocketProvider');
  }
  return context;
};
