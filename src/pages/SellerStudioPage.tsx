import React, { useState, useEffect } from 'react';
import {
  Store,
  PlusCircle,
  TrendingUp,
  Flame,
  Eye,
  DollarSign,
  AlertCircle,
  CheckCircle,
  XCircle,
  Clock,
  Sparkles,
  ShieldAlert,
} from 'lucide-react';
import { Auction, Category } from '../types/index.ts';
import { api } from '../services/api.ts';
import { useAuth } from '../context/AuthContext.tsx';

interface SellerStudioPageProps {
  onNavigate: (tab: string, auctionId?: string) => void;
}

export const SellerStudioPage: React.FC<SellerStudioPageProps> = ({ onNavigate }) => {
  const { user } = useAuth();
  const [categories, setCategories] = useState<Category[]>([]);
  const [activeTab, setActiveTab] = useState<'active' | 'completed' | 'pending' | 'new'>('active');
  const [stats, setStats] = useState({
    totalAuctions: 0,
    activeCount: 0,
    completedCount: 0,
    pendingPaymentCount: 0,
    cancelledCount: 0,
    totalGrossRevenue: 0,
    totalBidsReceived: 0,
    totalViews: 0,
  });
  const [auctions, setAuctions] = useState<{
    active: Auction[];
    completed: Auction[];
    pendingPayment: Auction[];
    cancelled: Auction[];
  }>({
    active: [],
    completed: [],
    pendingPayment: [],
    cancelled: [],
  });

  // New Auction Form State
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [startingPrice, setStartingPrice] = useState(1000);
  const [reservePrice, setReservePrice] = useState<number | ''>('');
  const [minIncrement, setMinIncrement] = useState(50);
  const [durationHours, setDurationHours] = useState(24);
  const [selectedPresetImage, setSelectedPresetImage] = useState(
    'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=1000'
  );
  const [antiSnipingEnabled, setAntiSnipingEnabled] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const presetImages = [
    { label: 'Rolex Watch', url: 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=1000' },
    { label: 'Supercar', url: 'https://images.unsplash.com/photo-1617788138017-80ad40651399?w=1000' },
    { label: 'Pokémon Card', url: 'https://images.unsplash.com/photo-1607604276583-eef5d076aa5f?w=1000' },
    { label: 'Art Canvas', url: 'https://images.unsplash.com/photo-1579783902614-a3fb3927b675?w=1000' },
    { label: 'Gaming Rig', url: 'https://images.unsplash.com/photo-1612287233207-6a2c2069b244?w=1000' },
    { label: 'Vintage Lens', url: 'https://images.unsplash.com/photo-1516035069371-29a1b244cc32?w=1000' },
  ];

  const fetchSellerData = async () => {
    try {
      const [dashRes, catRes] = await Promise.all([
        api.seller.getDashboard(),
        api.categories.list(),
      ]);

      setStats(dashRes.stats);
      setAuctions(dashRes.auctions);
      setCategories(catRes.categories);
      if (catRes.categories.length > 0 && !categoryId) {
        setCategoryId(catRes.categories[0].id);
      }
    } catch (err: any) {
      console.error('Failed to load seller dashboard', err);
    }
  };

  useEffect(() => {
    fetchSellerData();
  }, [user]);

  const handleCreateAuction = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setErrorMsg(null);
    setSuccessMsg(null);

    try {
      const res = await api.auctions.create({
        title,
        description,
        categoryId,
        startingPrice: Number(startingPrice),
        reservePrice: reservePrice ? Number(reservePrice) : undefined,
        minIncrement: Number(minIncrement),
        durationHours: Number(durationHours),
        images: [{ url: selectedPresetImage, isPrimary: true, caption: title }],
        antiSnipingEnabled,
      });

      setSuccessMsg(`Auction "${res.auction.title}" launched successfully!`);
      // Reset form
      setTitle('');
      setDescription('');
      setStartingPrice(1000);
      setReservePrice('');
      fetchSellerData();
      setActiveTab('active');
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to create auction');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCancelAuction = async (auctionId: string) => {
    if (!window.confirm('Are you sure you want to cancel this auction?')) return;
    try {
      await api.auctions.cancel(auctionId);
      alert('Auction cancelled successfully.');
      fetchSellerData();
    } catch (err: any) {
      alert(err.message || 'Failed to cancel auction');
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12 space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <span className="text-xs font-bold uppercase tracking-wider text-amber-400">
            Merchant Studio
          </span>
          <h1 className="text-3xl sm:text-4xl font-extrabold text-white mt-1">
            Seller Control Center
          </h1>
          <p className="mt-1 text-sm text-slate-400">
            Publish high-value auction lots, monitor incoming live bids, and manage fulfillment.
          </p>
        </div>

        <button
          onClick={() => setActiveTab('new')}
          className="self-start sm:self-auto px-5 py-3 rounded-2xl bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-400 hover:to-orange-500 text-slate-950 font-bold text-xs uppercase tracking-wider shadow-lg flex items-center gap-2 transition-all active:scale-95"
        >
          <PlusCircle className="w-4 h-4" />
          <span>Create New Auction</span>
        </button>
      </div>

      {/* KPI Stats Ribbon */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-semibold uppercase">Gross Revenue</span>
            <DollarSign className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="text-2xl font-mono font-bold text-white">
            ${stats.totalGrossRevenue.toLocaleString()}
          </div>
          <span className="text-[11px] text-slate-500">From completed sales</span>
        </div>

        <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-semibold uppercase">Active Lots</span>
            <Store className="w-4 h-4 text-amber-400" />
          </div>
          <div className="text-2xl font-mono font-bold text-white">
            {stats.activeCount}
          </div>
          <span className="text-[11px] text-slate-500">Currently accepting bids</span>
        </div>

        <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-semibold uppercase">Bids Received</span>
            <Flame className="w-4 h-4 text-rose-400" />
          </div>
          <div className="text-2xl font-mono font-bold text-white">
            {stats.totalBidsReceived}
          </div>
          <span className="text-[11px] text-slate-500">Across all catalog items</span>
        </div>

        <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-semibold uppercase">Catalog Views</span>
            <Eye className="w-4 h-4 text-sky-400" />
          </div>
          <div className="text-2xl font-mono font-bold text-white">
            {stats.totalViews}
          </div>
          <span className="text-[11px] text-slate-500">Unique buyer inspections</span>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="flex gap-2 border-b border-slate-800 pb-2 overflow-x-auto">
        <button
          onClick={() => setActiveTab('active')}
          className={`px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-wider transition-colors ${
            activeTab === 'active'
              ? 'bg-amber-500 text-slate-950'
              : 'text-slate-400 hover:text-white hover:bg-slate-900'
          }`}
        >
          Active Lots ({auctions.active.length})
        </button>
        <button
          onClick={() => setActiveTab('completed')}
          className={`px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-wider transition-colors ${
            activeTab === 'completed'
              ? 'bg-amber-500 text-slate-950'
              : 'text-slate-400 hover:text-white hover:bg-slate-900'
          }`}
        >
          Completed Sales ({auctions.completed.length})
        </button>
        <button
          onClick={() => setActiveTab('pending')}
          className={`px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-wider transition-colors ${
            activeTab === 'pending'
              ? 'bg-amber-500 text-slate-950'
              : 'text-slate-400 hover:text-white hover:bg-slate-900'
          }`}
        >
          Pending Payment ({auctions.pendingPayment.length})
        </button>
        <button
          onClick={() => setActiveTab('new')}
          className={`px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-wider transition-colors ${
            activeTab === 'new'
              ? 'bg-amber-500 text-slate-950'
              : 'text-slate-400 hover:text-white hover:bg-slate-900'
          }`}
        >
          + Create Listing
        </button>
      </div>

      {/* Tab Content: 1. CREATE AUCTION FORM */}
      {activeTab === 'new' && (
        <div className="p-6 sm:p-8 rounded-3xl bg-slate-900 border border-slate-800 max-w-3xl">
          <h2 className="text-xl font-bold text-white mb-2">Publish New Auction</h2>
          <p className="text-xs text-slate-400 mb-6">
            Configure reserve price, starting bid, duration, and anti-sniping protection.
          </p>

          {errorMsg && (
            <div className="mb-4 p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-400 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          {successMsg && (
            <div className="mb-4 p-3.5 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs flex items-center gap-2">
              <CheckCircle className="w-4 h-4 shrink-0" />
              <span>{successMsg}</span>
            </div>
          )}

          <form onSubmit={handleCreateAuction} className="space-y-5">
            <div>
              <label className="text-xs font-semibold uppercase tracking-wider text-slate-400 block mb-2">
                Lot Title
              </label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g. 1974 Rolex Submariner Ref. 5513 Meter First Dial"
                className="w-full bg-slate-950 border border-slate-700 focus:border-amber-500 rounded-xl px-4 py-3 text-sm text-white outline-none"
                required
              />
            </div>

            <div>
              <label className="text-xs font-semibold uppercase tracking-wider text-slate-400 block mb-2">
                Category
              </label>
              <select
                value={categoryId}
                onChange={(e) => setCategoryId(e.target.value)}
                className="w-full bg-slate-950 border border-slate-700 focus:border-amber-500 rounded-xl px-4 py-3 text-sm text-white outline-none"
                required
              >
                {categories.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="text-xs font-semibold uppercase tracking-wider text-slate-400 block mb-2">
                Detailed Description &amp; Provenance
              </label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={4}
                placeholder="Detail physical condition, certification papers, original packaging, and provenance history..."
                className="w-full bg-slate-950 border border-slate-700 focus:border-amber-500 rounded-xl p-4 text-sm text-white outline-none"
                required
              />
            </div>

            {/* Pricing Details */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="text-xs font-semibold uppercase tracking-wider text-slate-400 block mb-2">
                  Starting Price ($)
                </label>
                <input
                  type="number"
                  min={1}
                  value={startingPrice}
                  onChange={(e) => setStartingPrice(Number(e.target.value))}
                  className="w-full bg-slate-950 border border-slate-700 focus:border-amber-500 rounded-xl px-4 py-3 text-sm font-mono text-white outline-none"
                  required
                />
              </div>

              <div>
                <label className="text-xs font-semibold uppercase tracking-wider text-slate-400 block mb-2">
                  Reserve Price ($) (Optional)
                </label>
                <input
                  type="number"
                  placeholder="No reserve"
                  value={reservePrice}
                  onChange={(e) => setReservePrice(e.target.value ? Number(e.target.value) : '')}
                  className="w-full bg-slate-950 border border-slate-700 focus:border-amber-500 rounded-xl px-4 py-3 text-sm font-mono text-white outline-none"
                />
              </div>

              <div>
                <label className="text-xs font-semibold uppercase tracking-wider text-slate-400 block mb-2">
                  Min Bid Increment ($)
                </label>
                <input
                  type="number"
                  min={5}
                  value={minIncrement}
                  onChange={(e) => setMinIncrement(Number(e.target.value))}
                  className="w-full bg-slate-950 border border-slate-700 focus:border-amber-500 rounded-xl px-4 py-3 text-sm font-mono text-white outline-none"
                  required
                />
              </div>
            </div>

            {/* Duration */}
            <div>
              <label className="text-xs font-semibold uppercase tracking-wider text-slate-400 block mb-2">
                Auction Duration
              </label>
              <select
                value={durationHours}
                onChange={(e) => setDurationHours(Number(e.target.value))}
                className="w-full bg-slate-950 border border-slate-700 focus:border-amber-500 rounded-xl px-4 py-3 text-sm text-white outline-none"
              >
                <option value={1}>1 Hour (Flash Auction)</option>
                <option value={6}>6 Hours</option>
                <option value={12}>12 Hours</option>
                <option value={24}>24 Hours (1 Day)</option>
                <option value={72}>72 Hours (3 Days)</option>
              </select>
            </div>

            {/* Image Preset Selector */}
            <div>
              <label className="text-xs font-semibold uppercase tracking-wider text-slate-400 block mb-2">
                Select Catalog Product Photography
              </label>
              <div className="grid grid-cols-3 sm:grid-cols-6 gap-3">
                {presetImages.map((preset) => (
                  <div
                    key={preset.url}
                    onClick={() => setSelectedPresetImage(preset.url)}
                    className={`relative aspect-square rounded-xl overflow-hidden border-2 cursor-pointer transition-all ${
                      selectedPresetImage === preset.url
                        ? 'border-amber-500 scale-105 shadow-md shadow-amber-950'
                        : 'border-slate-800 opacity-60 hover:opacity-100'
                    }`}
                  >
                    <img src={preset.url} alt={preset.label} className="w-full h-full object-cover" />
                    <span className="absolute bottom-1 left-1 text-[9px] font-bold text-white bg-slate-950/80 px-1 rounded">
                      {preset.label}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Anti-Sniping Toggle */}
            <div className="flex items-center gap-3 p-4 rounded-2xl bg-slate-950 border border-slate-800">
              <input
                type="checkbox"
                id="antiSniping"
                checked={antiSnipingEnabled}
                onChange={(e) => setAntiSnipingEnabled(e.target.checked)}
                className="w-4 h-4 accent-amber-500 cursor-pointer"
              />
              <label htmlFor="antiSniping" className="text-xs text-slate-300 cursor-pointer">
                <strong className="text-white block font-semibold">Enable Anti-Sniping Protocol</strong>
                If a bid arrives in the final 30 seconds, automatically extend the clock by 30 seconds.
              </label>
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full py-4 rounded-2xl font-bold uppercase tracking-wider text-sm bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-400 hover:to-orange-500 text-slate-950 shadow-xl transition-all"
            >
              {isSubmitting ? 'Publishing Live Auction...' : 'Launch Live Auction'}
            </button>
          </form>
        </div>
      )}

      {/* Tab Content: 2. ACTIVE AUCTIONS LIST */}
      {activeTab === 'active' && (
        <div className="space-y-4">
          {auctions.active.length === 0 ? (
            <div className="p-12 text-center rounded-3xl bg-slate-900 border border-slate-800">
              <Store className="w-8 h-8 text-slate-500 mx-auto mb-3" />
              <p className="text-sm text-slate-400">You do not have any active auctions currently.</p>
              <button
                onClick={() => setActiveTab('new')}
                className="mt-4 px-4 py-2 rounded-xl bg-amber-500 text-slate-950 font-bold text-xs uppercase"
              >
                Create One Now
              </button>
            </div>
          ) : (
            <div className="divide-y divide-slate-800 rounded-3xl bg-slate-900 border border-slate-800 overflow-hidden">
              {auctions.active.map((auc) => (
                <div key={auc.id} className="p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                  <div className="flex items-center gap-4">
                    <img
                      src={auc.images?.[0]?.url || 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=100'}
                      alt={auc.title}
                      className="w-16 h-16 rounded-2xl object-cover"
                    />
                    <div>
                      <h4 className="text-sm font-bold text-white">{auc.title}</h4>
                      <div className="mt-1 flex items-center gap-3 text-xs text-slate-400">
                        <span>Current Bid: <strong className="text-amber-400 font-mono">${auc.currentHighestBid.toLocaleString()}</strong></span>
                        <span>•</span>
                        <span>{auc.bidCount} bids placed</span>
                        <span>•</span>
                        <span>{auc.viewCount} views</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 self-end sm:self-auto">
                    <button
                      onClick={() => onNavigate('live', auc.id)}
                      className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold"
                    >
                      Enter Room
                    </button>
                    {auc.bidCount === 0 && (
                      <button
                        onClick={() => handleCancelAuction(auc.id)}
                        className="px-4 py-2 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 text-xs font-semibold"
                      >
                        Cancel Listing
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Tab Content: 3. COMPLETED AUCTIONS */}
      {activeTab === 'completed' && (
        <div className="space-y-4">
          {auctions.completed.length === 0 ? (
            <div className="p-12 text-center rounded-3xl bg-slate-900 border border-slate-800 text-xs text-slate-400">
              No completed auctions yet.
            </div>
          ) : (
            <div className="divide-y divide-slate-800 rounded-3xl bg-slate-900 border border-slate-800 overflow-hidden">
              {auctions.completed.map((auc) => (
                <div key={auc.id} className="p-5 flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <img
                      src={auc.images?.[0]?.url}
                      alt={auc.title}
                      className="w-14 h-14 rounded-2xl object-cover"
                    />
                    <div>
                      <h4 className="text-sm font-bold text-white">{auc.title}</h4>
                      <p className="text-xs text-emerald-400 font-mono font-semibold">
                        Sold for ${auc.currentHighestBid.toLocaleString()} to {auc.winnerName || 'Winner'}
                      </p>
                    </div>
                  </div>

                  <span className="px-3 py-1 rounded-full text-xs font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                    Escrow Settled
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Tab Content: 4. PENDING PAYMENT */}
      {activeTab === 'pending' && (
        <div className="space-y-4">
          {auctions.pendingPayment.length === 0 ? (
            <div className="p-12 text-center rounded-3xl bg-slate-900 border border-slate-800 text-xs text-slate-400">
              No pending settlements.
            </div>
          ) : (
            <div className="divide-y divide-slate-800 rounded-3xl bg-slate-900 border border-slate-800 overflow-hidden">
              {auctions.pendingPayment.map((auc) => (
                <div key={auc.id} className="p-5 flex items-center justify-between">
                  <div>
                    <h4 className="text-sm font-bold text-white">{auc.title}</h4>
                    <p className="text-xs text-amber-400 font-mono">
                      Awaiting winner payment: ${auc.currentHighestBid.toLocaleString()} ({auc.winnerName})
                    </p>
                  </div>
                  <span className="px-3 py-1 rounded-full text-xs font-semibold bg-amber-500/10 text-amber-400 border border-amber-500/20">
                    Pending Buyer Checkout
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};
