import React, { useState } from 'react';
import { Heart, Flame, Eye, ArrowUpRight, ShieldCheck } from 'lucide-react';
import { Auction } from '../types/index.ts';
import { CountdownTimer } from './CountdownTimer.tsx';
import { api } from '../services/api.ts';
import { useAuth } from '../context/AuthContext.tsx';

interface AuctionCardProps {
  auction: Auction;
  onSelect: (auction: Auction) => void;
  onOpenBidModal?: (auction: Auction) => void;
}

export const AuctionCard: React.FC<AuctionCardProps> = ({ auction, onSelect, onOpenBidModal }) => {
  const { user } = useAuth();
  const [isWatchlisted, setIsWatchlisted] = useState(auction.isWatchlisted || false);
  const [isHovered, setIsHovered] = useState(false);

  const primaryImage =
    auction.images?.find((img) => img.isPrimary)?.url ||
    auction.images?.[0]?.url ||
    'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=800&auto=format&fit=crop&q=80';

  const isLive = auction.status === 'LIVE';
  const isScheduled = auction.status === 'SCHEDULED';
  const isEnded = auction.status === 'ENDED' || auction.status === 'COMPLETED' || auction.status === 'PAYMENT_PENDING';

  const handleWatchlistToggle = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!user) {
      alert('Please sign in or select a demo account to add items to your watchlist.');
      return;
    }

    // Optimistic toggle
    const newState = !isWatchlisted;
    setIsWatchlisted(newState);
    try {
      await api.watchlist.toggle(auction.id);
    } catch {
      setIsWatchlisted(!newState); // revert on error
    }
  };

  return (
    <div
      onClick={() => onSelect(auction)}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      className="group relative flex flex-col bg-slate-900/90 border border-slate-800 hover:border-amber-500/50 rounded-2xl overflow-hidden transition-all duration-300 hover:shadow-2xl hover:shadow-amber-950/20 cursor-pointer"
    >
      {/* Top Media & Badges */}
      <div className="relative aspect-[4/3] w-full overflow-hidden bg-slate-950">
        <img
          src={primaryImage}
          alt={auction.title}
          className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
          loading="lazy"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-slate-950/90 via-slate-950/20 to-transparent" />

        {/* Status Badge */}
        <div className="absolute top-3 left-3 flex items-center gap-1.5">
          {isLive && (
            <span className="flex items-center gap-1.5 px-2.5 py-1 text-xs font-bold uppercase tracking-wider rounded-full bg-rose-600/90 text-white backdrop-blur-md shadow-lg shadow-rose-950/50 border border-rose-400/30">
              <span className="w-2 h-2 rounded-full bg-white animate-ping" />
              LIVE
            </span>
          )}
          {isScheduled && (
            <span className="px-2.5 py-1 text-xs font-semibold uppercase tracking-wider rounded-full bg-sky-600/90 text-white backdrop-blur-md border border-sky-400/30">
              Upcoming
            </span>
          )}
          {isEnded && (
            <span className="px-2.5 py-1 text-xs font-semibold uppercase tracking-wider rounded-full bg-slate-800/90 text-slate-300 backdrop-blur-md border border-slate-700">
              Concluded
            </span>
          )}

          {auction.categoryName && (
            <span className="hidden sm:inline-block px-2.5 py-1 text-xs font-medium rounded-full bg-slate-900/80 text-slate-300 backdrop-blur-md border border-slate-700/60">
              {auction.categoryName}
            </span>
          )}
        </div>

        {/* Watchlist Toggle */}
        <button
          onClick={handleWatchlistToggle}
          aria-label={isWatchlisted ? 'Remove from watchlist' : 'Add to watchlist'}
          className={`absolute top-3 right-3 p-2 rounded-full backdrop-blur-md transition-all ${
            isWatchlisted
              ? 'bg-rose-500 text-white shadow-lg shadow-rose-900/50 scale-110'
              : 'bg-slate-900/70 text-slate-300 hover:text-white hover:bg-slate-800/90'
          }`}
        >
          <Heart className={`w-4 h-4 ${isWatchlisted ? 'fill-current' : ''}`} />
        </button>

        {/* Countdown Floating Pill */}
        <div className="absolute bottom-3 left-3 right-3 flex items-center justify-between">
          <CountdownTimer endTime={auction.endTime} isLive={isLive} compact />
          <div className="flex items-center gap-2 text-xs font-medium text-slate-300 bg-slate-900/80 px-2 py-1 rounded-md backdrop-blur-md border border-slate-800">
            <span className="flex items-center gap-1">
              <Flame className="w-3.5 h-3.5 text-amber-400" />
              {auction.bidCount} bids
            </span>
            <span className="text-slate-600">•</span>
            <span className="flex items-center gap-1">
              <Eye className="w-3.5 h-3.5 text-slate-400" />
              {auction.viewCount}
            </span>
          </div>
        </div>
      </div>

      {/* Card Body */}
      <div className="flex flex-col flex-grow p-4 sm:p-5">
        <h3 className="text-base font-semibold text-white line-clamp-1 group-hover:text-amber-400 transition-colors">
          {auction.title}
        </h3>
        <p className="mt-1 text-xs text-slate-400 line-clamp-2 leading-relaxed">
          {auction.description}
        </p>

        {/* Pricing Info */}
        <div className="mt-4 pt-3 border-t border-slate-800/80 flex items-end justify-between">
          <div>
            <span className="text-[11px] font-medium uppercase tracking-wider text-slate-400">
              {auction.bidCount > 0 ? 'Current Highest Bid' : 'Starting Price'}
            </span>
            <div className="text-lg sm:text-xl font-bold font-mono text-white flex items-center gap-1">
              <span className="text-amber-400 font-sans">$</span>
              {auction.currentHighestBid.toLocaleString()}
            </div>
          </div>

          <div className="text-right">
            <span className="text-[11px] font-medium text-slate-500">Min Increment</span>
            <div className="text-xs font-mono font-medium text-slate-300">
              +${auction.minIncrement.toLocaleString()}
            </div>
          </div>
        </div>

        {/* Action Button */}
        <div className="mt-4 pt-2">
          {isLive ? (
            <button
              onClick={(e) => {
                e.stopPropagation();
                if (onOpenBidModal) {
                  onOpenBidModal(auction);
                } else {
                  onSelect(auction);
                }
              }}
              className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl text-xs font-bold uppercase tracking-wider bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-400 hover:to-orange-500 text-slate-950 shadow-md shadow-amber-950/40 transition-all active:scale-[0.98]"
            >
              <span>Enter Live Bidding</span>
              <ArrowUpRight className="w-4 h-4" />
            </button>
          ) : isScheduled ? (
            <button
              onClick={() => onSelect(auction)}
              className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl text-xs font-semibold uppercase tracking-wider bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 transition-all"
            >
              <span>View Details & Preview</span>
              <ArrowUpRight className="w-4 h-4" />
            </button>
          ) : (
            <button
              onClick={() => onSelect(auction)}
              className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl text-xs font-semibold uppercase tracking-wider bg-slate-900 hover:bg-slate-800 text-slate-400 border border-slate-800 transition-all"
            >
              <span>View Auction Summary</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
