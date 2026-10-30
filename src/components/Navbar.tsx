import React, { useState } from 'react';
import {
  Gavel,
  Radio,
  Compass,
  Store,
  User as UserIcon,
  Shield,
  LogOut,
  Wallet,
  Menu,
  X,
  Sparkles,
  ArrowRightLeft,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext.tsx';
import { NotificationBell } from './NotificationBell.tsx';

interface NavbarProps {
  currentTab: string;
  onNavigate: (tab: string, auctionId?: string) => void;
  onOpenAuth: () => void;
  onOpenDemoSwitcher: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  currentTab,
  onNavigate,
  onOpenAuth,
  onOpenDemoSwitcher,
}) => {
  const { user, logout, toggleSellerRole } = useAuth();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);

  const isAdmin = user?.role === 'ADMIN';
  const isSeller = user?.roles.includes('SELLER');

  const navLinks = [
    { id: 'home', label: 'Home', icon: null },
    { id: 'explore', label: 'Explore Auctions', icon: Compass },
    { id: 'live', label: 'Live Arena', icon: Radio, highlight: true },
    ...(isSeller ? [{ id: 'seller', label: 'Seller Studio', icon: Store }] : []),
    ...(user ? [{ id: 'buyer', label: 'My Bidding', icon: Gavel }] : []),
    ...(isAdmin ? [{ id: 'admin', label: 'Admin Panel', icon: Shield }] : []),
  ];

  return (
    <header className="sticky top-0 z-40 w-full border-b border-slate-800/80 bg-slate-950/85 backdrop-blur-xl">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-20">
          {/* Logo & Brand */}
          <div
            onClick={() => onNavigate('home')}
            className="flex items-center gap-3 cursor-pointer group"
          >
            <div className="relative flex items-center justify-center w-11 h-11 rounded-2xl bg-gradient-to-tr from-amber-500 via-orange-500 to-amber-400 text-slate-950 shadow-lg shadow-amber-500/20 group-hover:scale-105 transition-transform">
              <Gavel className="w-6 h-6 stroke-[2.2]" />
              <span className="absolute -top-1 -right-1 flex h-3 w-3">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75" />
                <span className="relative inline-flex rounded-full h-3 w-3 bg-rose-500" />
              </span>
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="text-xl font-extrabold tracking-tight text-white font-mono">
                  Bid<span className="text-amber-400">X</span>change
                </span>
              </div>
              <span className="text-[10px] uppercase font-bold tracking-widest text-slate-400 block -mt-1">
                Live Auctions
              </span>
            </div>
          </div>

          {/* Desktop Navigation Links */}
          <nav className="hidden md:flex items-center gap-1 lg:gap-2">
            {navLinks.map((link) => {
              const Icon = link.icon;
              const isActive = currentTab === link.id;

              return (
                <button
                  key={link.id}
                  onClick={() => onNavigate(link.id)}
                  className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold uppercase tracking-wider transition-all ${
                    isActive
                      ? 'bg-amber-500/15 text-amber-400 border border-amber-500/30'
                      : 'text-slate-300 hover:text-white hover:bg-slate-900 border border-transparent'
                  }`}
                >
                  {Icon && <Icon className={`w-4 h-4 ${link.highlight ? 'text-rose-500 animate-pulse' : ''}`} />}
                  <span>{link.label}</span>
                </button>
              );
            })}
          </nav>

          {/* Right Action Icons & User Controls */}
          <div className="flex items-center gap-3">
            {/* Demo Personas button */}
            <button
              onClick={onOpenDemoSwitcher}
              className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold bg-slate-900 hover:bg-slate-800 text-amber-400 border border-amber-500/30 transition-all hover:scale-105 shadow-sm"
              title="Switch demo personas"
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>Demo Personas</span>
            </button>

            {/* Notification Bell */}
            <NotificationBell onSelectAuction={(id) => onNavigate('live', id)} />

            {/* User Profile or Sign In */}
            {user ? (
              <div className="relative">
                <button
                  onClick={() => setIsProfileOpen(!isProfileOpen)}
                  className="flex items-center gap-2.5 p-1.5 pr-3 rounded-2xl bg-slate-900 border border-slate-800 hover:border-slate-700 transition-colors"
                >
                  <img
                    src={user.avatarUrl || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=100'}
                    alt={user.name}
                    className="w-8 h-8 rounded-xl object-cover border border-amber-500/40"
                  />
                  <div className="hidden sm:block text-left">
                    <span className="text-xs font-bold text-white block truncate max-w-[110px] leading-tight">
                      {user.name}
                    </span>
                    <span className="text-[10px] font-mono text-emerald-400 block">
                      ${user.walletBalance.toLocaleString()}
                    </span>
                  </div>
                </button>

                {/* Profile dropdown */}
                {isProfileOpen && (
                  <div className="absolute right-0 mt-2 w-64 rounded-2xl bg-slate-900 border border-slate-800 shadow-2xl z-50 overflow-hidden animate-fadeIn">
                    <div className="p-4 border-b border-slate-800 bg-slate-950/70">
                      <p className="text-xs font-bold text-white">{user.name}</p>
                      <p className="text-[11px] text-slate-400 truncate">{user.email}</p>
                      <div className="mt-2.5 flex items-center justify-between pt-2 border-t border-slate-800/80">
                        <span className="text-[11px] text-slate-400 flex items-center gap-1">
                          <Wallet className="w-3.5 h-3.5 text-emerald-400" />
                          Simulated Balance:
                        </span>
                        <span className="text-xs font-mono font-bold text-emerald-400">
                          ${user.walletBalance.toLocaleString()}
                        </span>
                      </div>
                    </div>

                    <div className="p-2 space-y-1">
                      <button
                        onClick={async () => {
                          await toggleSellerRole();
                          setIsProfileOpen(false);
                        }}
                        className="w-full flex items-center gap-2.5 px-3 py-2 text-xs font-medium text-slate-300 hover:text-white hover:bg-slate-800 rounded-xl transition-colors text-left"
                      >
                        <ArrowRightLeft className="w-4 h-4 text-amber-400" />
                        <span>{isSeller ? 'Switch to Buyer Mode' : 'Enable Seller Studio'}</span>
                      </button>

                      <button
                        onClick={() => {
                          onNavigate('buyer');
                          setIsProfileOpen(false);
                        }}
                        className="w-full flex items-center gap-2.5 px-3 py-2 text-xs font-medium text-slate-300 hover:text-white hover:bg-slate-800 rounded-xl transition-colors text-left"
                      >
                        <Gavel className="w-4 h-4 text-sky-400" />
                        <span>My Bidding Dashboard</span>
                      </button>

                      {isSeller && (
                        <button
                          onClick={() => {
                            onNavigate('seller');
                            setIsProfileOpen(false);
                          }}
                          className="w-full flex items-center gap-2.5 px-3 py-2 text-xs font-medium text-slate-300 hover:text-white hover:bg-slate-800 rounded-xl transition-colors text-left"
                        >
                          <Store className="w-4 h-4 text-amber-400" />
                          <span>Seller Auction Studio</span>
                        </button>
                      )}

                      {isAdmin && (
                        <button
                          onClick={() => {
                            onNavigate('admin');
                            setIsProfileOpen(false);
                          }}
                          className="w-full flex items-center gap-2.5 px-3 py-2 text-xs font-medium text-purple-300 hover:text-white hover:bg-slate-800 rounded-xl transition-colors text-left"
                        >
                          <Shield className="w-4 h-4 text-purple-400" />
                          <span>Admin Control Center</span>
                        </button>
                      )}

                      <div className="pt-1 border-t border-slate-800">
                        <button
                          onClick={() => {
                            logout();
                            setIsProfileOpen(false);
                          }}
                          className="w-full flex items-center gap-2.5 px-3 py-2 text-xs font-medium text-rose-400 hover:bg-rose-500/10 rounded-xl transition-colors text-left"
                        >
                          <LogOut className="w-4 h-4" />
                          <span>Sign Out</span>
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <button
                onClick={onOpenAuth}
                className="px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-wider bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-400 hover:to-orange-500 text-slate-950 shadow-md shadow-amber-950/50 transition-all active:scale-95"
              >
                Sign In
              </button>
            )}

            {/* Mobile menu toggle */}
            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="md:hidden p-2 text-slate-300 hover:text-white rounded-xl bg-slate-900 border border-slate-800"
            >
              {isMobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Drawer */}
      {isMobileMenuOpen && (
        <div className="md:hidden border-t border-slate-800 bg-slate-950 px-4 pt-3 pb-6 space-y-2">
          {navLinks.map((link) => (
            <button
              key={link.id}
              onClick={() => {
                onNavigate(link.id);
                setIsMobileMenuOpen(false);
              }}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-semibold ${
                currentTab === link.id
                  ? 'bg-amber-500/20 text-amber-400'
                  : 'text-slate-300 hover:bg-slate-900'
              }`}
            >
              {link.icon && <link.icon className="w-4 h-4" />}
              <span>{link.label}</span>
            </button>
          ))}
          <button
            onClick={() => {
              onOpenDemoSwitcher();
              setIsMobileMenuOpen(false);
            }}
            className="w-full flex items-center gap-2 px-4 py-3 rounded-xl text-sm font-bold text-amber-400 bg-slate-900 border border-amber-500/30"
          >
            <Sparkles className="w-4 h-4" />
            <span>Switch Demo Personas</span>
          </button>
        </div>
      )}
    </header>
  );
};
