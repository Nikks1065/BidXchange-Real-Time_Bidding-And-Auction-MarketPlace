import React, { useState } from 'react';
import { X, Gavel, AlertCircle, CheckCircle, ShieldCheck, Flame } from 'lucide-react';
import { api } from '../services/api.js';
import { useAuth } from '../context/AuthContext.jsx';

export const BidModal = ({ auction, isOpen, onClose, onBidPlaced }) => {
  const { user } = useAuth();
  const minRequired =
    auction.bidCount === 0
      ? auction.startingPrice
      : auction.currentHighestBid + auction.minIncrement;

  const [bidAmount, setBidAmount] = useState(minRequired);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const [successMessage, setSuccessMessage] = useState(null);

  if (!isOpen) return null;

  const handleIncrement = (amount) => {
    setBidAmount((prev) => Math.max(minRequired, prev + amount));
    setError(null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!user) {
      setError('Please sign in or choose a demo persona to submit a live bid.');
      return;
    }

    if (bidAmount < minRequired) {
      setError(`Minimum required bid is $${minRequired.toLocaleString()}`);
      return;
    }

    setIsSubmitting(true);
    setError(null);
    setSuccessMessage(null);

    const idempotencyKey = `bid-${auction.id}-${user.id}-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;

    try {
      const res = await api.auctions.placeBid(auction.id, bidAmount, idempotencyKey);
      setSuccessMessage(res.message);
      onBidPlaced(res.auction);
      setTimeout(() => {
        onClose();
        setSuccessMessage(null);
      }, 1500);
    } catch (err) {
      setError(err.message || 'Failed to submit bid');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-fadeIn">
      <div className="relative w-full max-w-lg bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-2xl shadow-black/80">
        <button
          onClick={onClose}
          className="absolute top-5 right-5 p-2 text-slate-400 hover:text-white rounded-full bg-slate-800/60 hover:bg-slate-800 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-3">
          <div className="p-3 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-amber-400">
            <Gavel className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-white">Place Live Bid</h2>
            <p className="text-xs text-slate-400 line-clamp-1">{auction.title}</p>
          </div>
        </div>

        <div className="mt-6 p-4 rounded-2xl bg-slate-950/70 border border-slate-800 grid grid-cols-2 gap-4">
          <div>
            <span className="text-xs text-slate-400">Current Highest Bid</span>
            <div className="text-xl font-mono font-bold text-white">
              ${auction.currentHighestBid.toLocaleString()}
            </div>
          </div>
          <div>
            <span className="text-xs text-amber-400 font-medium">Min Allowed Next Bid</span>
            <div className="text-xl font-mono font-bold text-amber-400">
              ${minRequired.toLocaleString()}
            </div>
          </div>
        </div>

        {error && (
          <div className="mt-4 p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-400 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {successMessage && (
          <div className="mt-4 p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs flex items-center gap-2">
            <CheckCircle className="w-4 h-4 shrink-0" />
            <span>{successMessage}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="mt-6 space-y-5">
          <div>
            <label className="text-xs font-semibold uppercase tracking-wider text-slate-400 block mb-2">
              Quick Increment Shortcuts
            </label>
            <div className="grid grid-cols-4 gap-2">
              {[25, 50, 100, 250].map((inc) => (
                <button
                  type="button"
                  key={inc}
                  onClick={() => handleIncrement(inc)}
                  className="py-2.5 px-3 rounded-xl bg-slate-800 hover:bg-slate-700 active:scale-95 text-xs font-mono font-bold text-slate-200 border border-slate-700/60 hover:border-amber-500/40 transition-all"
                >
                  +${inc}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="text-xs font-semibold uppercase tracking-wider text-slate-400 block mb-2">
              Your Maximum Bid (USD)
            </label>
            <div className="relative">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-lg font-bold text-amber-400">
                $
              </span>
              <input
                type="number"
                min={minRequired}
                step={auction.minIncrement || 1}
                value={bidAmount}
                onChange={(e) => {
                  setBidAmount(Number(e.target.value));
                  setError(null);
                }}
                className="w-full bg-slate-950 border border-slate-700 focus:border-amber-500 focus:ring-1 focus:ring-amber-500 text-white font-mono text-2xl font-bold rounded-2xl py-3.5 pl-9 pr-4 outline-none transition-all"
                required
              />
            </div>
          </div>

          <div className="p-3 rounded-xl bg-slate-950 border border-slate-800/80 flex items-start gap-2.5 text-[11px] text-slate-400">
            <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
            <span>
              Protected by BidXchange Concurrency Mutex and Anti-Sniping Guard. If submitted in the final 30 seconds, the clock will extend automatically.
            </span>
          </div>

          <button
            type="submit"
            disabled={isSubmitting || !!successMessage}
            className="w-full py-4 rounded-2xl font-bold uppercase tracking-wider text-sm bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-400 hover:to-orange-500 text-slate-950 shadow-lg shadow-amber-950/50 disabled:opacity-50 transition-all active:scale-[0.99] flex items-center justify-center gap-2"
          >
            {isSubmitting ? (
              <span className="animate-spin w-5 h-5 border-2 border-slate-950 border-t-transparent rounded-full" />
            ) : (
              <>
                <Flame className="w-4 h-4" />
                <span>Confirm Bid of ${bidAmount.toLocaleString()}</span>
              </>
            )}
          </button>
        </form>
      </div>
    </div>
  );
};
