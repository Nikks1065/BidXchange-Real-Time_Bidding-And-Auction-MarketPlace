import React, { createContext, useContext, useEffect, useRef, useState } from 'react';
import { io } from 'socket.io-client';
import { useAuth } from './AuthContext.jsx';

const SocketContext = createContext(undefined);

export const SocketProvider = ({ children }) => {
  const { token } = useAuth();
  const socketRef = useRef(null);
  const [isConnected, setIsConnected] = useState(false);
  const [viewerCount, setViewerCount] = useState(1);
  const [liveNotifications, setLiveNotifications] = useState([]);

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

    s.on('auction:viewers', (data) => {
      if (typeof data?.count === 'number') {
        setViewerCount(data.count);
      }
    });

    s.on('notification', (notif) => {
      setLiveNotifications((prev) => [notif, ...prev]);
    });

    return () => {
      s.disconnect();
    };
  }, [token]);

  const joinAuctionRoom = (auctionId) => {
    if (socketRef.current) {
      socketRef.current.emit('auction:join', auctionId);
    }
  };

  const leaveAuctionRoom = (auctionId) => {
    if (socketRef.current) {
      socketRef.current.emit('auction:leave', auctionId);
    }
  };

  const clearNotification = (id) => {
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
