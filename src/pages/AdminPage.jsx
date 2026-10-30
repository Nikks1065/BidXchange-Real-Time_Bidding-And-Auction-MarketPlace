import React, { useState, useEffect } from 'react';
import {
  Shield,
} from 'lucide-react';
import { api } from '../services/api.js';
import { useAuth } from '../context/AuthContext.jsx';

export const AdminPage = () => {
  const { user } = useAuth();
  const [metrics, setMetrics] = useState(null);
  const [usersList, setUsersList] = useState([]);
  const [auditLogs, setAuditLogs] = useState([]);
  const [activeTab, setActiveTab] = useState('users');
  const [isLoading, setIsLoading] = useState(true);

  const fetchAdminData = async () => {
    setIsLoading(true);
    try {
      const [metRes, usersRes, logsRes] = await Promise.all([
        api.admin.getMetrics(),
        api.admin.getUsers(),
        api.admin.getAuditLogs(),
      ]);

      setMetrics(metRes);
      setUsersList(usersRes.users);
      setAuditLogs(logsRes.logs);
    } catch (err) {
      console.error('Failed to load admin data', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchAdminData();
  }, [user]);

  const handleToggleSuspend = async (targetUserId) => {
    try {
      await api.admin.toggleSuspend(targetUserId);
      fetchAdminData();
    } catch (err) {
      alert(err.message || 'Failed to toggle user suspension');
    }
  };

  if (user?.role !== 'ADMIN') {
    return (
      <div className="max-w-2xl mx-auto px-4 py-24 text-center">
        <div className="w-14 h-14 rounded-2xl bg-rose-500/10 text-rose-400 border border-rose-500/20 mx-auto flex items-center justify-center mb-4">
          <Shield className="w-8 h-8" />
        </div>
        <h2 className="text-2xl font-bold text-white">Administrator Access Required</h2>
        <p className="mt-2 text-sm text-slate-400">
          This portal requires Super Admin credentials. Use the Demo Switcher button in the top navigation to switch to Marcus Stone (Admin) to test this module.
        </p>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12 space-y-8">
      <div>
        <span className="text-xs font-bold uppercase tracking-wider text-purple-400">
          Platform Governance
        </span>
        <h1 className="text-3xl sm:text-4xl font-extrabold text-white mt-1">
          Admin Control Center
        </h1>
        <p className="mt-1 text-sm text-slate-400">
          Real-time system telemetry, user integrity moderation, and audit logs.
        </p>
      </div>

      {metrics && (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800">
            <span className="text-xs text-slate-400 font-semibold uppercase">Platform Users</span>
            <div className="text-2xl font-bold font-mono text-white mt-1">
              {metrics.totalUsers}
            </div>
            <span className="text-[11px] text-slate-500">
              {metrics.suspendedUsers} currently suspended
            </span>
          </div>

          <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800">
            <span className="text-xs text-slate-400 font-semibold uppercase">Live Auctions</span>
            <div className="text-2xl font-bold font-mono text-amber-400 mt-1">
              {metrics.activeAuctions}
            </div>
            <span className="text-[11px] text-slate-500">
              out of {metrics.totalAuctions} total catalog lots
            </span>
          </div>

          <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800">
            <span className="text-xs text-slate-400 font-semibold uppercase">Bids Processed</span>
            <div className="text-2xl font-bold font-mono text-white mt-1">
              {metrics.totalBidsPlaced}
            </div>
            <span className="text-[11px] text-slate-500">All mutex-synchronized</span>
          </div>

          <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800">
            <span className="text-xs text-slate-400 font-semibold uppercase">Gross Merchandise Vol</span>
            <div className="text-2xl font-bold font-mono text-emerald-400 mt-1">
              ${metrics.grossMerchandiseVolume.toLocaleString()}
            </div>
            <span className="text-[11px] text-slate-500">Won and Settled</span>
          </div>
        </div>
      )}

      <div className="flex gap-2 border-b border-slate-800 pb-2">
        <button
          onClick={() => setActiveTab('users')}
          className={`px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-wider transition-colors ${
            activeTab === 'users' ? 'bg-purple-600 text-white' : 'text-slate-400 hover:text-white'
          }`}
        >
          User Management ({usersList.length})
        </button>
        <button
          onClick={() => setActiveTab('logs')}
          className={`px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-wider transition-colors ${
            activeTab === 'logs' ? 'bg-purple-600 text-white' : 'text-slate-400 hover:text-white'
          }`}
        >
          System Audit Trail ({auditLogs.length})
        </button>
      </div>

      {activeTab === 'users' && (
        <div className="rounded-3xl bg-slate-900 border border-slate-800 overflow-hidden divide-y divide-slate-800">
          {usersList.map((u) => (
            <div key={u.id} className="p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div className="flex items-center gap-4">
                <img
                  src={u.avatarUrl || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=100'}
                  alt={u.name}
                  className="w-12 h-12 rounded-2xl object-cover"
                />
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-bold text-white">{u.name}</span>
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-slate-800 text-slate-300">
                      {u.role}
                    </span>
                    {u.isSuspended && (
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-rose-500/20 text-rose-400 border border-rose-500/30">
                        Suspended
                      </span>
                    )}
                  </div>
                  <div className="text-xs text-slate-400 mt-0.5">{u.email}</div>
                  <div className="text-[11px] text-slate-500 mt-1">
                    Balance: ${u.walletBalance.toLocaleString()} • Roles: {u.roles?.join(', ')}
                  </div>
                </div>
              </div>

              {u.role !== 'ADMIN' && (
                <button
                  onClick={() => handleToggleSuspend(u.id)}
                  className={`px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-wider transition-colors ${
                    u.isSuspended
                      ? 'bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20'
                      : 'bg-rose-500/10 text-rose-400 hover:bg-rose-500/20'
                  }`}
                >
                  {u.isSuspended ? 'Restore User' : 'Suspend User'}
                </button>
              )}
            </div>
          ))}
        </div>
      )}

      {activeTab === 'logs' && (
        <div className="rounded-3xl bg-slate-900 border border-slate-800 overflow-hidden divide-y divide-slate-800/60 max-h-[500px] overflow-y-auto font-mono text-xs">
          {auditLogs.map((log) => (
            <div key={log.id} className="p-4 hover:bg-slate-850 flex items-start justify-between gap-4">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="px-2 py-0.5 rounded bg-purple-500/10 text-purple-400 font-bold text-[11px]">
                    {log.action}
                  </span>
                  <span className="text-slate-400">{log.entity}</span>
                </div>
                <div className="text-slate-300">Actor: {log.actorEmail || 'System'}</div>
                {log.metadata && (
                  <pre className="text-[10px] text-slate-500 bg-slate-950 p-2 rounded-lg max-w-xl overflow-x-auto">
                    {JSON.stringify(log.metadata, null, 2)}
                  </pre>
                )}
              </div>
              <span className="text-[10px] text-slate-500 whitespace-nowrap">
                {new Date(log.createdAt).toLocaleString()}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
