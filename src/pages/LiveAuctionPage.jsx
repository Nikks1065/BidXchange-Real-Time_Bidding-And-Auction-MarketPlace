import React, { useState, useEffect } from 'react';
import {
  Users,
  Clock,
  ShieldCheck,
  Flame,
  Heart,
  CheckCircle,
  AlertTriangle,
  Trophy,
  History,
  Zap,
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { api } from '../services/api.js';
import { useAuth } from '../context/AuthContext.jsx';
import { useSocket } from '../context/SocketContext.jsx';
import { CountdownTimer } from '../components/CountdownTimer.jsx';
import { CheckoutModal } from '../components/CheckoutModal.jsx';

export const LiveAuctionPage = ({ auctionId, onNavigate }) => {
  const { user } = useAuth();
  const { socket, joinAuctionRoom, leaveAuctionRoom, viewerCount } = useSocket();

  const [auction, setAuction] = useState(null);
  const [bids, setBids] = useState([]);
  const [activeImageIdx, setActiveImageIdx] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [bidAmount, setBidAmount] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState(null);
  const [successMsg, setSuccessMsg] = useState(null);
  const [isCheckoutOpen, setIsCheckoutOpen] = useState(false);
  const [isSimulatingRace, setIsSimulatingRace] = useState(false);
  const [antiSnipingAlert, setAntiSnipingAlert] = useState(null);

  const loadAuction = async () => {
    try {
      const res = await api.auctions.getById(auctionId);
      setAuction(res.auction);
      setBids(res.auction.bids || []);

      const nextMin =
        res.auction.bidCount === 0
          ? res.auction.startingPrice
          : res.auction.currentHighestBid + res.auction.minIncrement;
      setBidAmount(nextMin);
    } catch (err) {
      setErrorMsg(err.message || 'Failed to load auction');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadAuction();
    joinAuctionRoom(auctionId);

    return () => {
      leaveAuctionRoom(auctionId);
    };
  }, [auctionId]);

  useEffect(() => {
    if (!socket) return;

    const handleBidPlaced = (data) => {
      if (data.auctionId !== auctionId) return;

      setAuction((prev) => {
        if (!prev) return null;
        return {
          ...prev,
          currentHighestBid: data.currentHighestBid,
          bidCount: data.bidCount,
          winnerId: data.winnerId,
          winnerName: data.winnerName,
          endTime: data.endTime,
          extensionCount: data.extensionCount,
        };
      });

      setBids((prev) => [data.bid, ...prev]);

      if (auction) {
        setBidAmount(data.currentHighestBid + auction.minIncrement);
      }

      if (data.timeExtended) {
        setAntiSnipingAlert('Anti-sniping triggered! +30 seconds added to the clock.');
        setTimeout(() => setAntiSnipingAlert(null), 8000);
      }
    };

    const handleAuctionExtended = (data) => {
      if (data.auctionId !== auctionId) return;
      setAuction((prev) => (prev ? { ...prev, endTime: data.newEndTime } : null));
      setAntiSnipingAlert(data.reason);
      setTimeout(() => setAntiSnipingAlert(null), 8000);
    };

    const handleAuctionEnded = (data) => {
      if (data.auctionId !== auctionId) return;
      setAuction((prev) => (prev ? { ...prev, status: 'PAYMENT_PENDING', winnerId: data.winnerId, winnerName: data.winnerName } : null));

      if (user && data.winnerId === user.id) {
        confetti({ particleCount: 150, spread: 80, origin: { y: 0.5 } });
      }
    };

    socket.on('bid:placed', handleBidPlaced);
    socket.on('auction:extended', handleAuctionExtended);
    socket.on('auction:ended', handleAuctionEnded);

    return () => {
      socket.off('bid:placed', handleBidPlaced);
      socket.off('auction:extended', handleAuctionExtended);
      socket.off('auction:ended', handleAuctionEnded);
    };
  }, [socket, auctionId, user, auction?.minIncrement]);

  if (isLoading || !auction) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-24 text-center">
        <div className="inline-block animate-spin w-10 h-10 border-4 border-amber-500 border-t-transparent rounded-full" />
        <p className="mt-4 text-sm text-slate-400">Connecting to live auction room...</p>
      </div>
    );
  }

  const isLive = auction.status === 'LIVE';
  const isWinner = user && auction.winnerId === user.id;
  const isEnded = auction.status === 'ENDED' || auction.status === 'PAYMENT_PENDING' || auction.status === 'COMPLETED';
  const minRequired =
    auction.bidCount === 0
      ? auction.startingPrice
      : auction.currentHighestBid + auction.minIncrement;

  const handlePlaceBid = async (e) => {
    e.preventDefault();
    if (!user) {
      setErrorMsg('Please sign in to place a bid in this live auction.');
      return;
    }

    if (bidAmount < minRequired) {
      setErrorMsg(`Bid must be at least $${minRequired.toLocaleString()}`);
      return;
    }

    setIsSubmitting(true);
    setErrorMsg(null);
    setSuccessMsg(null);

    const idempotencyKey = `bid-${auction.id}-${user.id}-${Date.now()}`;

    try {
      const res = await api.auctions.placeBid(auction.id, bidAmount, idempotencyKey);
      setSuccessMsg(res.message);
      setAuction(res.auction);
      setBidAmount(res.auction.currentHighestBid + res.auction.minIncrement);
      setTimeout(() => setSuccessMsg(null), 4000);
    } catch (err) {
      setErrorMsg(err.message || 'Failed to submit bid');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSimulateConcurrentBids = async () => {
    setIsSimulatingRace(true);
    setErrorMsg(null);
    setSuccessMsg(null);

    try {
      const current = auction.currentHighestBid;
      const step = auction.minIncrement;

      const promises = [1, 2, 3, 4, 5].map((i) =>
        api.auctions.placeBid(auction.id, current + step * i, `sim-race-${Date.now()}-${i}`)
      );

      await Promise.allSettled(promises);
      setSuccessMsg('⚡ Concurrency Simulation executed: 5 parallel bids processed safely with zero race conditions!');
      await loadAuction();
    } catch (err) {
      setErrorMsg(err.message);
    } finally {
      setIsSimulatingRace(false);
    }
  };

  const images = auction.images && auction.images.length > 0
    ? auction.images
    : [{ id: 'img-def', url: 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=1000', isPrimary: true }];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {antiSnipingAlert && (
        <div className="p-4 rounded-2xl bg-amber-500/15 border-2 border-amber-500/50 text-amber-300 flex items-center justify-between gap-4 animate-bounce">
          <div className="flex items-center gap-3">
            <AlertTriangle className="w-5 h-5 text-amber-400 shrink-0" />
            <span className="text-sm font-bold">{antiSnipingAlert}</span>
          </div>
          <span className="text-xs font-mono font-bold px-2.5 py-1 rounded-md bg-amber-500 text-slate-950 uppercase">
            +30s Added
          </span>
        </div>
      )}

      {isEnded && (
        <div className="p-6 rounded-3xl bg-gradient-to-r from-emerald-950/80 via-slate-900 to-emerald-950/80 border-2 border-emerald-500/60 shadow-2xl flex flex-col sm:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-4 text-center sm:text-left">
            <div className="p-3.5 rounded-2xl bg-emerald-500 text-slate-950 shadow-lg">
              <Trophy className="w-8 h-8" />
            </div>
            <div>
              <span className="text-xs font-bold uppercase tracking-widest text-emerald-400">
                Auction Concluded
              </span>
              <h2 className="text-2xl font-black text-white mt-0.5">
                {isWinner
                  ? 'Congratulations! You Won This Auction!'
                  : `Winning Bid: $${auction.currentHighestBid.toLocaleString()} (${auction.winnerName || 'Winner'})`}
              </h2>
              <p className="text-xs text-slate-400 mt-1">
                {isWinner
                  ? 'Your bid held the highest position at hammer close. Complete payment to initiate escrow.'
                  : 'This auction has ended. Thank you to all participants.'}
              </p>
            </div>
          </div>

          {isWinner && (
            <button
              onClick={() => setIsCheckoutOpen(true)}
              className="px-6 py-3.5 rounded-2xl text-xs font-extrabold uppercase tracking-wider bg-emerald-400 hover:bg-emerald-300 text-slate-950 shadow-xl shadow-emerald-950/60 transition-transform active:scale-95 flex items-center gap-2"
            >
              <ShieldCheck className="w-4 h-4" />
              <span>Claim &amp; Complete Payment</span>
            </button>
          )}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        <div className="lg:col-span-7 space-y-6">
          <div className="relative aspect-[4/3] w-full rounded-3xl overflow-hidden bg-slate-950 border border-slate-800 shadow-2xl">
            <img
              src={images[activeImageIdx]?.url}
              alt={auction.title}
              className="w-full h-full object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 via-transparent to-transparent pointer-events-none" />

            <div className="absolute top-4 left-4 flex items-center gap-2">
              {isLive ? (
                <span className="flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-bold uppercase tracking-wider bg-rose-600 text-white shadow-xl shadow-rose-950/60">
                  <span className="w-2.5 h-2.5 rounded-full bg-white animate-ping" />
                  Live Auction Room
                </span>
              ) : (
                <span className="px-3 py-1.5 rounded-full text-xs font-semibold uppercase tracking-wider bg-slate-800 text-slate-300 border border-slate-700">
                  {auction.status}
                </span>
              )}
            </div>

            <div className="absolute top-4 right-4 flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold bg-slate-900/80 text-slate-300 backdrop-blur-md border border-slate-700">
              <Users className="w-3.5 h-3.5 text-amber-400" />
              <span>{viewerCount} Live Viewers</span>
            </div>
          </div>

          {images.length > 1 && (
            <div className="flex gap-3 overflow-x-auto pb-1">
              {images.map((img, idx) => (
                <button
                  key={img.id}
                  onClick={() => setActiveImageIdx(idx)}
                  className={`relative w-20 h-20 rounded-2xl overflow-hidden border-2 transition-all shrink-0 ${
                    activeImageIdx === idx ? 'border-amber-500 scale-105' : 'border-slate-800 opacity-60 hover:opacity-100'
                  }`}
                >
                  <img src={img.url} alt="" className="w-full h-full object-cover" />
                </button>
              ))}
            </div>
          )}

          <div className="p-6 sm:p-8 rounded-3xl bg-slate-900/80 border border-slate-800 space-y-6">
            <div>
              <span className="text-xs font-semibold uppercase tracking-wider text-amber-400">
                {auction.categoryName || 'Rare Artifact'}
              </span>
              <h1 className="text-2xl sm:text-3xl font-extrabold text-white mt-1">
                {auction.title}
              </h1>
            </div>

            <div className="prose prose-invert text-sm text-slate-300 leading-relaxed">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">
                Lot Description &amp; Provenance
              </h4>
              <p>{auction.description}</p>
            </div>

            <div className="pt-6 border-t border-slate-800 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <img
                  src={auction.sellerAvatar || 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100'}
                  alt={auction.sellerName || 'Seller'}
                  className="w-10 h-10 rounded-xl object-cover border border-amber-500/30"
                />
                <div>
                  <div className="text-xs font-bold text-white flex items-center gap-1.5">
                    <span>{auction.sellerName || 'Verified Premier Seller'}</span>
                    <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                  </div>
                  <span className="text-[11px] text-slate-400">Curated Merchant</span>
                </div>
              </div>

              <div className="flex gap-2">
                <button
                  onClick={async () => {
                    if (user) {
                      await api.watchlist.toggle(auction.id);
                      loadAuction();
                    }
                  }}
                  className="p-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition-colors"
                  title="Toggle Watchlist"
                >
                  <Heart className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        </div>

        <div className="lg:col-span-5 space-y-6">
          <div className="p-6 sm:p-7 rounded-3xl bg-slate-900 border-2 border-slate-800 hover:border-amber-500/40 shadow-2xl shadow-black space-y-6 transition-all">
            <div className="flex items-center justify-between pb-4 border-b border-slate-800">
              <div>
                <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1">
                  <Clock className="w-3.5 h-3.5 text-amber-400" />
                  Time Remaining
                </span>
                <div className="mt-1">
                  <CountdownTimer endTime={auction.endTime} isLive={isLive} onExpire={loadAuction} />
                </div>
              </div>

              <div className="text-right">
                <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                  Total Bids
                </span>
                <div className="text-2xl font-black font-mono text-white mt-1">
                  {auction.bidCount}
                </div>
              </div>
            </div>

            <div className="p-5 rounded-2xl bg-slate-950 border border-slate-800/80 space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span className="font-semibold uppercase tracking-wider text-slate-400">
                  Current Highest Bid
                </span>
                {auction.winnerId && (
                  <span className="font-semibold text-emerald-400 flex items-center gap-1 text-[11px]">
                    <CheckCircle className="w-3 h-3" />
                    Leading: {auction.winnerId === user?.id ? 'You! (Top Bidder)' : auction.winnerName || 'Anonymous'}
                  </span>
                )}
              </div>

              <div className="flex items-baseline gap-2">
                <span className="text-3xl sm:text-4xl font-black font-mono text-amber-400">
                  ${auction.currentHighestBid.toLocaleString()}
                </span>
                <span className="text-xs text-slate-500">USD</span>
              </div>

              <div className="pt-2 flex items-center justify-between text-xs text-slate-400 border-t border-slate-800/80">
                <span>Minimum Next Bid:</span>
                <span className="font-mono font-bold text-white">
                  ${minRequired.toLocaleString()}
                </span>
              </div>
            </div>

            {errorMsg && (
              <div className="p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-400 text-xs flex items-center gap-2 animate-fadeIn">
                <AlertTriangle className="w-4 h-4 shrink-0" />
                <span>{errorMsg}</span>
              </div>
            )}

            {successMsg && (
              <div className="p-3.5 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs flex items-center gap-2 animate-fadeIn">
                <CheckCircle className="w-4 h-4 shrink-0" />
                <span>{successMsg}</span>
              </div>
            )}

            {isLive ? (
              <form onSubmit={handlePlaceBid} className="space-y-4">
                <div>
                  <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block mb-2">
                    Quick Increment
                  </span>
                  <div className="grid grid-cols-4 gap-2">
                    {[25, 50, 100, 250].map((inc) => (
                      <button
                        type="button"
                        key={inc}
                        onClick={() => {
                          setBidAmount((prev) => Math.max(minRequired, prev + inc));
                          setErrorMsg(null);
                        }}
                        className="py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-mono font-bold text-slate-200 border border-slate-700 transition-all active:scale-95"
                      >
                        +${inc}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
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
                        setErrorMsg(null);
                      }}
                      className="w-full bg-slate-950 border border-slate-700 focus:border-amber-500 text-white font-mono text-2xl font-bold rounded-2xl py-3.5 pl-9 pr-4 outline-none transition-all"
                      required
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full py-4 rounded-2xl font-bold uppercase tracking-wider text-sm bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-400 hover:to-orange-500 text-slate-950 shadow-xl shadow-amber-950/50 transition-all active:scale-[0.98] flex items-center justify-center gap-2"
                >
                  {isSubmitting ? (
                    <span className="animate-spin w-5 h-5 border-2 border-slate-950 border-t-transparent rounded-full" />
                  ) : (
                    <>
                      <Flame className="w-4 h-4 fill-current" />
                      <span>Place Bid of ${bidAmount.toLocaleString()}</span>
                    </>
                  )}
                </button>

                <div className="pt-2">
                  <button
                    type="button"
                    onClick={handleSimulateConcurrentBids}
                    disabled={isSimulatingRace}
                    className="w-full py-2.5 px-3 rounded-xl bg-slate-950 hover:bg-slate-800 text-slate-400 hover:text-amber-400 text-xs font-semibold border border-slate-800 flex items-center justify-center gap-2 transition-colors"
                  >
                    <Zap className="w-3.5 h-3.5 text-amber-400" />
                    <span>
                      {isSimulatingRace
                        ? 'Simulating concurrent mutex test...'
                        : 'Simulate 5 Rapid Competing Bids (Test Mutex)'}
                    </span>
                  </button>
                </div>
              </form>
            ) : (
              <div className="py-6 text-center text-xs text-slate-400 bg-slate-950 rounded-2xl border border-slate-800">
                This auction is not accepting bids at this time.
              </div>
            )}
          </div>

          <div className="p-6 rounded-3xl bg-slate-900 border border-slate-800 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div className="flex items-center gap-2">
                <History className="w-4 h-4 text-amber-400" />
                <h3 className="text-sm font-bold text-white">Live Bid Stream</h3>
              </div>
              <span className="text-[11px] font-semibold text-slate-400">
                {bids.length} records
              </span>
            </div>

            <div className="max-h-64 overflow-y-auto space-y-2.5 pr-1 divide-y divide-slate-800/60">
              {bids.length === 0 ? (
                <div className="py-8 text-center text-xs text-slate-400">
                  No bids recorded yet. Be the first to start the auction!
                </div>
              ) : (
                bids.map((b, idx) => (
                  <div
                    key={b.id || idx}
                    className={`pt-2.5 flex items-center justify-between text-xs transition-colors ${
                      idx === 0 ? 'text-amber-300 font-bold' : 'text-slate-300'
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full bg-amber-400" />
                      <span>{b.bidderName || 'Anonymous Bidder'}</span>
                      {b.bidderId === user?.id && (
                        <span className="px-1.5 py-0.5 rounded text-[10px] bg-amber-500/20 text-amber-400">
                          You
                        </span>
                      )}
                    </div>

                    <div className="text-right">
                      <span className="font-mono font-bold text-sm">
                        ${b.amount.toLocaleString()}
                      </span>
                      <div className="text-[10px] text-slate-500">
                        {new Date(b.createdAt).toLocaleTimeString()}
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>

      {isCheckoutOpen && (
        <CheckoutModal
          auction={auction}
          isOpen={isCheckoutOpen}
          onClose={() => setIsCheckoutOpen(false)}
          onPaymentComplete={() => {
            loadAuction();
          }}
        />
      )}
    </div>
  );
};
