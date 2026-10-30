import React from 'react';
import { X, UserCheck, Shield, ShoppingBag, Store, Sparkles } from 'lucide-react';
import { useAuth } from '../context/AuthContext.jsx';

export const DemoSwitcherModal = ({ isOpen, onClose }) => {
  const { user, switchDemoAccount } = useAuth();

  if (!isOpen) return null;

  const demoAccounts = [
    {
      id: 'buyer',
      name: 'Alex Mercer',
      email: 'alex@bidxchange.com',
      role: 'BUYER',
      roleLabel: 'Active High-Bidder',
      icon: ShoppingBag,
      color: 'border-blue-500/40 bg-blue-500/10 text-blue-400',
      description: 'Pre-loaded with active bids on Rolex Daytona & Air Jordan 1.',
    },
    {
      id: 'seller',
      name: 'Sarah Jenkins',
      email: 'sarah@bidxchange.com',
      role: 'SELLER',
      roleLabel: 'Verified Merchant',
      icon: Store,
      color: 'border-amber-500/40 bg-amber-500/10 text-amber-400',
      description: 'Access to Seller Auction Studio to create, monitor & manage listings.',
    },
    {
      id: 'admin',
      name: 'Marcus Stone',
      email: 'admin@bidxchange.com',
      role: 'ADMIN',
      roleLabel: 'Super Administrator',
      icon: Shield,
      color: 'border-purple-500/40 bg-purple-500/10 text-purple-400',
      description: 'Platform KPIs, user suspension & restoration, audit log stream.',
    },
  ];

  const handleSelect = async (roleId) => {
    await switchDemoAccount(roleId);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-fadeIn">
      <div className="relative w-full max-w-lg bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-2xl">
        <button
          onClick={onClose}
          className="absolute top-5 right-5 p-2 text-slate-400 hover:text-white rounded-full bg-slate-800/60 hover:bg-slate-800 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-3">
          <div className="p-3 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-amber-400">
            <Sparkles className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-white">Instant Demo Persona Switcher</h2>
            <p className="text-xs text-slate-400">Select any role to test full platform capabilities</p>
          </div>
        </div>

        <div className="mt-6 space-y-3">
          {demoAccounts.map((account) => {
            const Icon = account.icon;
            const isCurrent = user?.email.toLowerCase() === account.email.toLowerCase();

            return (
              <div
                key={account.id}
                onClick={() => handleSelect(account.id)}
                className={`p-4 rounded-2xl border transition-all cursor-pointer flex items-center gap-4 ${
                  isCurrent
                    ? 'border-amber-500 bg-amber-500/5 shadow-lg shadow-amber-950/20'
                    : 'border-slate-800 hover:border-slate-700 bg-slate-950/60 hover:bg-slate-950'
                }`}
              >
                <div className={`p-3 rounded-xl border ${account.color}`}>
                  <Icon className="w-5 h-5" />
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-bold text-white">{account.name}</span>
                    <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-slate-800 text-slate-300">
                      {account.roleLabel}
                    </span>
                    {isCurrent && (
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 flex items-center gap-1">
                        <UserCheck className="w-3 h-3" />
                        Active
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-slate-400 mt-1">{account.description}</p>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
