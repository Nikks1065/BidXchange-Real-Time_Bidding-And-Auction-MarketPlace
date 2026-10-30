import React, { useEffect, useState } from 'react';
import {
  Flame,
  ArrowRight,
  ShieldCheck,
  Zap,
  TrendingUp,
  Clock,
  Sparkles,
  Award,
  Layers,
  ChevronRight,
} from 'lucide-react';
import { Auction, Category } from '../types/index.ts';
import { api } from '../services/api.ts';
import { AuctionCard } from '../components/AuctionCard.tsx';
import { CountdownTimer } from '../components/CountdownTimer.tsx';

interface HomePageProps {
  onNavigate: (tab: string, auctionId?: string) => void;
  onOpenBidModal: (auction: Auction) => void;
  onOpenAuth: () => void;
}

export const HomePage: React.FC<HomePageProps> = ({
  onNavigate,
  onOpenBidModal,
  onOpenAuth,
}) => {
  const [featuredAuction, setFeaturedAuction] = useState<Auction | null>(null);
  const [liveAuctions, setLiveAuctions] = useState<Auction[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [endingSoonAuctions, setEndingSoonAuctions] = useState<Auction[]>([]);
  const [stats, setStats] = useState({
    activeAuctions: 0,
    totalBids: 0,
    grossVolume: 0,
    verifiedMembers: 14820,
  });

  useEffect(() => {
    const loadHomeData = async () => {
      try {
        const [aucRes, catRes] = await Promise.all([
          api.auctions.list({ sort: 'popular' }),
          api.categories.list(),
        ]);

        const all = aucRes.auctions;
        setCategories(catRes.categories);

        // Filter live auctions
        const live = all.filter((a) => a.status === 'LIVE');
        setLiveAuctions(live.slice(0, 6));

        // Featured auction: Daytona or first live item
        const featured = live.find((a) => a.id === 'auc-rolex-daytona') || live[0];
        setFeaturedAuction(featured || null);

        // Ending soon auctions
        const endingSoon = [...live].sort(
          (a, b) => new Date(a.endTime).getTime() - new Date(b.endTime).getTime()
        );
        setEndingSoonAuctions(endingSoon.slice(0, 4));

        // Calculate actual platform statistics
        const totalBids = all.reduce((sum, a) => sum + a.bidCount, 0);
        const grossVolume = all.reduce((sum, a) => sum + a.currentHighestBid, 0);
        setStats({
          activeAuctions: live.length,
          totalBids,
          grossVolume,
          verifiedMembers: 14820 + all.length * 15,
        });
      } catch (err) {
        console.error('Failed to load home data', err);
      }
    };

    loadHomeData();
  }, []);

  return (
    <div className="flex flex-col gap-16 md:gap-24 pb-20">
      {/* 1. HERO SECTION */}
      <section className="relative overflow-hidden pt-8 md:pt-14 pb-16 px-4 sm:px-6 lg:px-8 border-b border-slate-800/80 bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950">
        {/* Glow ambient background effects */}
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[350px] bg-amber-500/10 blur-[140px] pointer-events-none rounded-full" />
        <div className="absolute top-1/3 right-10 w-[400px] h-[300px] bg-orange-600/10 blur-[130px] pointer-events-none rounded-full" />

        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-center">
            {/* Left Headline */}
            <div className="lg:col-span-7 space-y-6">
              <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-400 text-xs font-bold uppercase tracking-wider">
                <span className="w-2 h-2 rounded-full bg-rose-500 animate-ping" />
                <span>Next-Gen Real-Time Auction Marketplace</span>
              </div>

              <h1 className="text-4xl sm:text-6xl font-black text-white tracking-tight leading-[1.1] font-mono">
                Bid Live. <br />
                <span className="bg-gradient-to-r from-amber-400 via-orange-400 to-amber-200 bg-clip-text text-transparent">
                  Compete Smart.
                </span>{' '}
                <br />
                Win Fair.
              </h1>

              <p className="text-base sm:text-lg text-slate-300 max-w-xl font-normal leading-relaxed">
                Experience high-velocity live auctions with sub-second bid broadcasts, concurrency-safe transactional bidding, and automated anti-sniping protection.
              </p>

              {/* Action Buttons */}
              <div className="pt-2 flex flex-wrap items-center gap-4">
                <button
                  onClick={() => onNavigate('explore')}
                  className="px-6 py-3.5 rounded-2xl text-sm font-bold uppercase tracking-wider bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-400 hover:to-orange-500 text-slate-950 shadow-xl shadow-amber-950/50 hover:shadow-amber-500/20 transition-all flex items-center gap-2 active:scale-95"
                >
                  <span>Explore Live Auctions</span>
                  <ArrowRight className="w-4 h-4" />
                </button>

                {featuredAuction && (
                  <button
                    onClick={() => onNavigate('live', featuredAuction.id)}
                    className="px-6 py-3.5 rounded-2xl text-sm font-bold uppercase tracking-wider bg-slate-900 hover:bg-slate-800 text-slate-200 border border-slate-700/80 transition-all flex items-center gap-2"
                  >
                    <Flame className="w-4 h-4 text-rose-500" />
                    <span>Join Featured Arena</span>
                  </button>
                )}
              </div>

              {/* Real-time Platform KPIs */}
              <div className="pt-8 border-t border-slate-800/80 grid grid-cols-2 sm:grid-cols-4 gap-4">
                <div>
                  <div className="text-2xl font-black text-white font-mono">
                    {stats.activeAuctions}
                  </div>
                  <div className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">
                    Live Auctions
                  </div>
                </div>
                <div>
                  <div className="text-2xl font-black text-white font-mono">
                    {stats.totalBids.toLocaleString()}
                  </div>
                  <div className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">
                    Bids Placed
                  </div>
                </div>
                <div>
                  <div className="text-2xl font-black text-amber-400 font-mono">
                    ${(stats.grossVolume / 1000).toFixed(0)}k+
                  </div>
                  <div className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">
                    Gross Volume
                  </div>
                </div>
                <div>
                  <div className="text-2xl font-black text-white font-mono">
                    {stats.verifiedMembers.toLocaleString()}
                  </div>
                  <div className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">
                    Verified Bidders
                  </div>
                </div>
              </div>
            </div>

            {/* Right: Featured Live Auction Spotlight Card */}
            {featuredAuction && (
              <div className="lg:col-span-5">
                <div
                  onClick={() => onNavigate('live', featuredAuction.id)}
                  className="group relative rounded-3xl overflow-hidden bg-slate-900/95 border-2 border-amber-500/40 p-5 shadow-2xl shadow-amber-950/40 hover:border-amber-400 transition-all cursor-pointer"
                >
                  <div className="flex items-center justify-between mb-3">
                    <span className="flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-rose-600 text-white shadow-lg shadow-rose-950/50">
                      <span className="w-2 h-2 rounded-full bg-white animate-ping" />
                      Featured Live Now
                    </span>
                    <CountdownTimer endTime={featuredAuction.endTime} isLive compact />
                  </div>

                  <div className="relative aspect-video w-full rounded-2xl overflow-hidden bg-slate-950">
                    <img
                      src={
                        featuredAuction.images?.[0]?.url ||
                        'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=800'
                      }
                      alt={featuredAuction.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/30 to-transparent" />
                  </div>

                  <div className="mt-4 space-y-2">
                    <h3 className="text-lg font-bold text-white group-hover:text-amber-400 transition-colors line-clamp-1">
                      {featuredAuction.title}
                    </h3>
                    <p className="text-xs text-slate-400 line-clamp-2 leading-relaxed">
                      {featuredAuction.description}
                    </p>

                    <div className="pt-3 border-t border-slate-800 flex items-center justify-between">
                      <div>
                        <span className="text-[11px] uppercase tracking-wider font-semibold text-slate-400">
                          Current Highest Bid
                        </span>
                        <div className="text-2xl font-black text-amber-400 font-mono">
                          ${featuredAuction.currentHighestBid.toLocaleString()}
                        </div>
                      </div>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onOpenBidModal(featuredAuction);
                        }}
                        className="py-2.5 px-5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs uppercase tracking-wider shadow-lg transition-transform active:scale-95 flex items-center gap-1.5"
                      >
                        <Flame className="w-4 h-4" />
                        <span>Quick Bid</span>
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* 2. TRENDING CATEGORIES */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-8">
          <div>
            <span className="text-xs font-bold uppercase tracking-wider text-amber-400">
              Curated Marketplaces
            </span>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-white mt-1">
              Explore by Category
            </h2>
          </div>
          <button
            onClick={() => onNavigate('explore')}
            className="text-xs font-bold text-amber-400 hover:text-amber-300 flex items-center gap-1 transition-colors"
          >
            <span>View All Catalogs</span>
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
          {categories.map((cat) => (
            <div
              key={cat.id}
              onClick={() => onNavigate('explore')}
              className="group relative rounded-2xl overflow-hidden bg-slate-900 border border-slate-800 hover:border-amber-500/50 p-3 sm:p-4 transition-all duration-300 hover:shadow-xl hover:shadow-amber-950/20 cursor-pointer flex flex-col justify-between"
            >
              <div className="aspect-square w-full rounded-xl overflow-hidden bg-slate-950 mb-3">
                <img
                  src={cat.imageUrl}
                  alt={cat.name}
                  className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                />
              </div>
              <div>
                <h4 className="text-xs sm:text-sm font-bold text-white group-hover:text-amber-400 transition-colors line-clamp-1">
                  {cat.name}
                </h4>
                <p className="text-[11px] text-slate-400 line-clamp-1 mt-0.5">
                  Browse items
                </p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* 3. LIVE AUCTIONS SHOWCASE */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-8">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-rose-500/10 text-rose-400 border border-rose-500/20">
              <Flame className="w-6 h-6 animate-bounce" />
            </div>
            <div>
              <span className="text-xs font-bold uppercase tracking-wider text-rose-400">
                Happening Right Now
              </span>
              <h2 className="text-2xl sm:text-3xl font-extrabold text-white mt-0.5">
                Live Auctions
              </h2>
            </div>
          </div>

          <button
            onClick={() => onNavigate('explore')}
            className="px-4 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-xs font-bold text-white border border-slate-800 transition-colors"
          >
            View All ({liveAuctions.length})
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {liveAuctions.map((auction) => (
            <AuctionCard
              key={auction.id}
              auction={auction}
              onSelect={(auc) => onNavigate('live', auc.id)}
              onOpenBidModal={onOpenBidModal}
            />
          ))}
        </div>
      </section>

      {/* 4. HOW BIDXCHANGE WORKS */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full">
        <div className="rounded-3xl bg-slate-900/60 border border-slate-800 p-8 sm:p-12 relative overflow-hidden">
          <div className="text-center max-w-2xl mx-auto mb-12">
            <span className="text-xs font-bold uppercase tracking-wider text-amber-400">
              Commercial-Grade Transparency
            </span>
            <h2 className="text-2xl sm:text-4xl font-extrabold text-white mt-1">
              How BidXchange Works
            </h2>
            <p className="mt-2 text-sm text-slate-400">
              Zero lag. Zero fake shill bidding. Every transaction backed by strict concurrency locks and verified escrow.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <div className="p-6 rounded-2xl bg-slate-950/80 border border-slate-800 space-y-3">
              <div className="w-10 h-10 rounded-xl bg-amber-500/10 text-amber-400 border border-amber-500/20 flex items-center justify-center font-mono font-bold text-base">
                01
              </div>
              <h3 className="text-base font-bold text-white">Discover &amp; Inspect</h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                Browse verified auctions across luxury watches, vehicles, art, and electronics with full historical provenance.
              </p>
            </div>

            <div className="p-6 rounded-2xl bg-slate-950/80 border border-slate-800 space-y-3">
              <div className="w-10 h-10 rounded-xl bg-rose-500/10 text-rose-400 border border-rose-500/20 flex items-center justify-center font-mono font-bold text-base">
                02
              </div>
              <h3 className="text-base font-bold text-white">Live Bidding Arena</h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                Connect via Socket.IO with instant bid propagation. Serial transactional locks guarantee fair non-racing orders.
              </p>
            </div>

            <div className="p-6 rounded-2xl bg-slate-950/80 border border-slate-800 space-y-3">
              <div className="w-10 h-10 rounded-xl bg-sky-500/10 text-sky-400 border border-sky-500/20 flex items-center justify-center font-mono font-bold text-base">
                03
              </div>
              <h3 className="text-base font-bold text-white">Anti-Sniping Guard</h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                Last-second bids trigger automatic +30s clock extensions, preventing snipe bots and letting real human buyers compete.
              </p>
            </div>

            <div className="p-6 rounded-2xl bg-slate-950/80 border border-slate-800 space-y-3">
              <div className="w-10 h-10 rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 flex items-center justify-center font-mono font-bold text-base">
                04
              </div>
              <h3 className="text-base font-bold text-white">Escrow Settlement</h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                Winner funds are held securely in simulated escrow until physical delivery and serial number verification is complete.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* 5. SELLER CTA BANNER */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full">
        <div className="relative rounded-3xl overflow-hidden bg-gradient-to-r from-amber-600 via-orange-600 to-amber-700 p-8 sm:p-12 text-slate-950 flex flex-col md:flex-row items-center justify-between gap-8 shadow-2xl shadow-orange-950/40">
          <div className="space-y-3 max-w-xl text-center md:text-left">
            <span className="px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-slate-950 text-white">
              Auction Studio
            </span>
            <h2 className="text-3xl sm:text-4xl font-black text-slate-950 tracking-tight">
              Ready to host your own live auction?
            </h2>
            <p className="text-sm font-medium text-slate-900 leading-relaxed">
              Launch timed auctions with custom reserve prices, automatic anti-sniping protection, and real-time bidder analytics.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row gap-3">
            <button
              onClick={() => onNavigate('seller')}
              className="px-6 py-3.5 rounded-2xl text-xs font-extrabold uppercase tracking-wider bg-slate-950 hover:bg-slate-900 text-white shadow-xl transition-all active:scale-95"
            >
              Open Seller Studio
            </button>
            <button
              onClick={onOpenAuth}
              className="px-6 py-3.5 rounded-2xl text-xs font-bold uppercase tracking-wider bg-white/30 hover:bg-white/40 text-slate-950 border border-slate-950/20 transition-all"
            >
              Register as Seller
            </button>
          </div>
        </div>
      </section>
    </div>
  );
};
