import React, { useState, useEffect } from 'react';
import {
  Gavel,
  Trophy,
  CreditCard,
  CheckCircle,
  AlertTriangle,
  ArrowRight,
} from 'lucide-react';
import { api } from '../services/api.js';
import { useAuth } from '../context/AuthContext.jsx';
import { CheckoutModal } from '../components/CheckoutModal.jsx';

export const BuyerDashboardPage = ({ onNavigate }) => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('bids');
  const [activeBids, setActiveBids] = useState([]);
  const [wonAuctions, setWonAuctions] = useState([]);
  const [lostAuctions, setLostAuctions] = useState([]);
  const [watchlist, setWatchlist] = useState([]);
  const [selectedWonAuction, setSelectedWonAuction] = useState(null);
  const [isCheckoutOpen, setIsCheckoutOpen] = useState(false);

  const fetchDashboardData = async () => {
    try {
      const res = await api.buyer.getDashboard();
      setActiveBids(res.activeBids);
      setWonAuctions(res.wonAuctions);
      setLostAuctions(res.lostAuctions);
      setWatchlist(res.watchlist);
    } catch (err) {
      console.error('Failed to load buyer dashboard', err);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, [user]);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12 space-y-8">
      <div className="p-6 sm:p-8 rounded-3xl bg-slate-900 border border-slate-800 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
        <div className="flex items-center gap-4">
          <img
            src={user?.avatarUrl || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150'}
            alt={user?.name || 'User'}
            className="w-16 h-16 rounded-2xl object-cover border-2 border-amber-500/40"
          />
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-bold text-white">{user?.name}</h1>
              <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-blue-500/10 text-blue-400 border border-blue-500/30">
                Verified Bidder
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">{user?.email}</p>
          </div>
        </div>

        <div className="flex items-center gap-6 p-4 rounded-2xl bg-slate-950 border border-slate-800">
          <div>
            <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">
              Simulated Wallet
            </span>
            <div className="text-xl font-bold font-mono text-emerald-400">
              ${user?.walletBalance.toLocaleString()}
            </div>
          </div>
        </div>
      </div>

      <div className="flex gap-2 border-b border-slate-800 pb-2 overflow-x-auto">
        <button
          onClick={() => setActiveTab('bids')}
          className={`px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-wider transition-colors ${
            activeTab === 'bids'
              ? 'bg-amber-500 text-slate-950'
              : 'text-slate-400 hover:text-white hover:bg-slate-900'
          }`}
        >
          Active Bids ({activeBids.length})
        </button>
        <button
          onClick={() => setActiveTab('won')}
          className={`px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-wider transition-colors ${
            activeTab === 'won'
              ? 'bg-amber-500 text-slate-950'
              : 'text-slate-400 hover:text-white hover:bg-slate-900'
          }`}
        >
          Won Auctions ({wonAuctions.length})
        </button>
        <button
          onClick={() => setActiveTab('watchlist')}
          className={`px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-wider transition-colors ${
            activeTab === 'watchlist'
              ? 'bg-amber-500 text-slate-950'
              : 'text-slate-400 hover:text-white hover:bg-slate-900'
          }`}
        >
          Watchlist ({watchlist.length})
        </button>
        <button
          onClick={() => setActiveTab('lost')}
          className={`px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-wider transition-colors ${
            activeTab === 'lost'
              ? 'bg-amber-500 text-slate-950'
              : 'text-slate-400 hover:text-white hover:bg-slate-900'
          }`}
        >
          Past Bids / Outbid ({lostAuctions.length})
        </button>
      </div>

      {activeTab === 'bids' && (
        <div className="space-y-4">
          {activeBids.length === 0 ? (
            <div className="p-12 text-center rounded-3xl bg-slate-900 border border-slate-800">
              <Gavel className="w-8 h-8 text-slate-500 mx-auto mb-3" />
              <p className="text-sm text-slate-400">You do not have any active live bids right now.</p>
              <button
                onClick={() => onNavigate('explore')}
                className="mt-4 px-4 py-2 rounded-xl bg-amber-500 text-slate-950 font-bold text-xs uppercase"
              >
                Browse Live Auctions
              </button>
            </div>
          ) : (
            <div className="divide-y divide-slate-800 rounded-3xl bg-slate-900 border border-slate-800 overflow-hidden">
              {activeBids.map((item) => (
                <div key={item.id} className="p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                  <div className="flex items-center gap-4">
                    <img
                      src={item.images?.[0]?.url || 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=100'}
                      alt={item.title}
                      className="w-16 h-16 rounded-2xl object-cover"
                    />
                    <div>
                      <div className="flex items-center gap-2">
                        <h4 className="text-sm font-bold text-white">{item.title}</h4>
                        {item.isWinning ? (
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 flex items-center gap-1">
                            <CheckCircle className="w-3 h-3" />
                            Winning!
                          </span>
                        ) : (
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-500/20 text-rose-400 border border-rose-500/30 flex items-center gap-1">
                            <AlertTriangle className="w-3 h-3" />
                            Outbid!
                          </span>
                        )}
                      </div>

                      <div className="mt-1 flex items-center gap-3 text-xs text-slate-400">
                        <span>Your Bid: <strong className="font-mono text-white">${item.myHighestBid.toLocaleString()}</strong></span>
                        <span>•</span>
                        <span>Current Top: <strong className="font-mono text-amber-400">${item.currentHighestBid.toLocaleString()}</strong></span>
                      </div>
                    </div>
                  </div>

                  <button
                    onClick={() => onNavigate('live', item.id)}
                    className="self-end sm:self-auto px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-bold uppercase tracking-wider transition-all flex items-center gap-1.5"
                  >
                    <span>{item.isWinning ? 'Monitor Live' : 'Reclaim Lead'}</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {activeTab === 'won' && (
        <div className="space-y-4">
          {wonAuctions.length === 0 ? (
            <div className="p-12 text-center rounded-3xl bg-slate-900 border border-slate-800 text-xs text-slate-400">
              No won auctions yet. Keep bidding live to win!
            </div>
          ) : (
            <div className="divide-y divide-slate-800 rounded-3xl bg-slate-900 border border-slate-800 overflow-hidden">
              {wonAuctions.map((item) => (
                <div key={item.id} className="p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                  <div className="flex items-center gap-4">
                    <img
                      src={item.images?.[0]?.url}
                      alt={item.title}
                      className="w-16 h-16 rounded-2xl object-cover"
                    />
                    <div>
                      <div className="flex items-center gap-2">
                        <h4 className="text-sm font-bold text-white">{item.title}</h4>
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 flex items-center gap-1">
                          <Trophy className="w-3 h-3" />
                          Auction Won
                        </span>
                      </div>

                      <div className="mt-1 text-xs text-slate-400">
                        Winning Bid: <strong className="font-mono text-emerald-400 font-bold">${item.currentHighestBid.toLocaleString()}</strong>
                      </div>
                    </div>
                  </div>

                  {item.order?.status === 'PAID' || item.status === 'COMPLETED' ? (
                    <span className="px-4 py-2 rounded-xl text-xs font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                      Payment Confirmed &amp; In Escrow
                    </span>
                  ) : (
                    <button
                      onClick={() => {
                        setSelectedWonAuction(item);
                        setIsCheckoutOpen(true);
                      }}
                      className="px-5 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs uppercase tracking-wider shadow-lg flex items-center gap-1.5 transition-all"
                    >
                      <CreditCard className="w-4 h-4" />
                      <span>Complete Payment</span>
                    </button>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {activeTab === 'watchlist' && (
        <div className="space-y-4">
          {watchlist.length === 0 ? (
            <div className="p-12 text-center rounded-3xl bg-slate-900 border border-slate-800 text-xs text-slate-400">
              Your watchlist is empty. Heart items in Explore or Live Arena to track them here.
            </div>
          ) : (
            <div className="divide-y divide-slate-800 rounded-3xl bg-slate-900 border border-slate-800 overflow-hidden">
              {watchlist.map((auc) => (
                <div key={auc.id} className="p-5 flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <img
                      src={auc.images?.[0]?.url}
                      alt={auc.title}
                      className="w-14 h-14 rounded-2xl object-cover"
                    />
                    <div>
                      <h4 className="text-sm font-bold text-white">{auc.title}</h4>
                      <div className="text-xs text-slate-400">
                        Current: <strong className="font-mono text-amber-400">${auc.currentHighestBid.toLocaleString()}</strong>
                      </div>
                    </div>
                  </div>

                  <button
                    onClick={() => onNavigate('live', auc.id)}
                    className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold"
                  >
                    View Room
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {activeTab === 'lost' && (
        <div className="space-y-4">
          {lostAuctions.length === 0 ? (
            <div className="p-12 text-center rounded-3xl bg-slate-900 border border-slate-800 text-xs text-slate-400">
              No lost auctions in your record.
            </div>
          ) : (
            <div className="divide-y divide-slate-800 rounded-3xl bg-slate-900 border border-slate-800 overflow-hidden">
              {lostAuctions.map((item) => (
                <div key={item.id} className="p-5 flex items-center justify-between">
                  <div>
                    <h4 className="text-sm font-bold text-slate-300">{item.title}</h4>
                    <p className="text-xs text-slate-500">
                      Final winning bid was ${item.currentHighestBid.toLocaleString()} by {item.winnerName || 'Competitor'}
                    </p>
                  </div>
                  <span className="text-xs text-slate-500 font-semibold">Concluded</span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {selectedWonAuction && isCheckoutOpen && (
        <CheckoutModal
          auction={selectedWonAuction}
          isOpen={isCheckoutOpen}
          onClose={() => {
            setIsCheckoutOpen(false);
            setSelectedWonAuction(null);
          }}
          onPaymentComplete={() => {
            fetchDashboardData();
          }}
        />
      )}
    </div>
  );
};
