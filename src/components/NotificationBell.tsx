import React, { useState, useEffect, useRef } from 'react';
import { Bell, Trophy, AlertTriangle, CheckCheck, Tag, X } from 'lucide-react';
import { Notification } from '../types/index.ts';
import { api } from '../services/api.ts';
import { useSocket } from '../context/SocketContext.tsx';
import { useAuth } from '../context/AuthContext.tsx';

interface NotificationBellProps {
  onSelectAuction?: (auctionId: string) => void;
}

export const NotificationBell: React.FC<NotificationBellProps> = ({ onSelectAuction }) => {
  const { user } = useAuth();
  const { liveNotifications, clearNotification } = useSocket();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [activeToast, setActiveToast] = useState<Notification | null>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const fetchNotifications = async () => {
    if (!user) return;
    try {
      const res = await api.notifications.list();
      setNotifications(res.notifications);
    } catch {
      // ignore
    }
  };

  useEffect(() => {
    fetchNotifications();
  }, [user]);

  // When live socket notification arrives, update list and trigger floating toast
  useEffect(() => {
    if (liveNotifications.length > 0) {
      const latest = liveNotifications[0];
      setNotifications((prev) => [latest, ...prev]);
      setActiveToast(latest);

      const timer = setTimeout(() => {
        setActiveToast(null);
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [liveNotifications]);

  // Click outside listener
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const unreadCount = notifications.filter((n) => !n.isRead).length;

  const handleMarkAllRead = async () => {
    try {
      await api.notifications.markRead();
      setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
    } catch {
      // ignore
    }
  };

  const getIcon = (type: string) => {
    switch (type) {
      case 'WON':
        return <Trophy className="w-4 h-4 text-emerald-400" />;
      case 'OUTBID':
        return <AlertTriangle className="w-4 h-4 text-rose-400" />;
      case 'SELLER_BID_RECEIVED':
        return <Tag className="w-4 h-4 text-amber-400" />;
      default:
        return <Bell className="w-4 h-4 text-sky-400" />;
    }
  };

  if (!user) return null;

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Bell Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        aria-label="View notifications"
        className="relative p-2 rounded-xl text-slate-300 hover:text-white bg-slate-900 border border-slate-800 hover:border-slate-700 transition-colors"
      >
        <Bell className="w-5 h-5" />
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-rose-600 text-[10px] font-bold text-white shadow">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {/* Floating Real-time Toast Popover */}
      {activeToast && (
        <div className="fixed bottom-6 right-6 z-50 max-w-sm w-full p-4 rounded-2xl bg-slate-900/95 border border-amber-500/40 shadow-2xl backdrop-blur-md animate-slideUp">
          <div className="flex items-start gap-3">
            <div className="p-2 rounded-xl bg-slate-800">{getIcon(activeToast.type)}</div>
            <div className="flex-1 min-w-0">
              <h4 className="text-xs font-bold text-white">{activeToast.title}</h4>
              <p className="mt-0.5 text-xs text-slate-300">{activeToast.message}</p>
            </div>
            <button
              onClick={() => setActiveToast(null)}
              className="text-slate-400 hover:text-white p-1"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      )}

      {/* Dropdown Menu */}
      {isOpen && (
        <div className="absolute right-0 mt-2 w-80 sm:w-96 rounded-2xl bg-slate-900 border border-slate-800 shadow-2xl z-50 overflow-hidden animate-fadeIn">
          <div className="flex items-center justify-between p-4 border-b border-slate-800 bg-slate-950/60">
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-bold text-white">Live Notifications</h3>
              {unreadCount > 0 && (
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/20 text-amber-400 border border-amber-500/30">
                  {unreadCount} new
                </span>
              )}
            </div>
            {unreadCount > 0 && (
              <button
                onClick={handleMarkAllRead}
                className="flex items-center gap-1 text-[11px] text-slate-400 hover:text-amber-400 transition-colors"
              >
                <CheckCheck className="w-3.5 h-3.5" />
                Mark all read
              </button>
            )}
          </div>

          <div className="max-h-80 overflow-y-auto divide-y divide-slate-800/60">
            {notifications.length === 0 ? (
              <div className="py-8 text-center text-xs text-slate-400">
                No notifications yet. Place bids to receive live updates!
              </div>
            ) : (
              notifications.map((n) => (
                <div
                  key={n.id}
                  onClick={() => {
                    if (n.auctionId && onSelectAuction) {
                      onSelectAuction(n.auctionId);
                      setIsOpen(false);
                    }
                  }}
                  className={`p-3.5 flex items-start gap-3 hover:bg-slate-800/50 cursor-pointer transition-colors ${
                    !n.isRead ? 'bg-amber-500/5' : ''
                  }`}
                >
                  <div className="p-2 rounded-xl bg-slate-800 shrink-0">{getIcon(n.type)}</div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-semibold text-white">{n.title}</span>
                      <span className="text-[10px] text-slate-500">
                        {new Date(n.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                    <p className="mt-0.5 text-xs text-slate-300 line-clamp-2">{n.message}</p>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
};
