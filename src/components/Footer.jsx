import React from 'react';
import { Gavel, ShieldCheck, Zap, Lock, RefreshCcw } from 'lucide-react';

export const Footer = ({ onNavigate }) => {
  return (
    <footer className="w-full border-t border-slate-800/80 bg-slate-950 text-slate-400 text-xs">
      <div className="border-b border-slate-800/60 bg-slate-900/40 py-6">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 grid grid-cols-2 md:grid-cols-4 gap-6">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-amber-500/10 text-amber-400 border border-amber-500/20">
              <Zap className="w-5 h-5" />
            </div>
            <div>
              <h4 className="text-white font-bold text-xs">Real-Time WebSockets</h4>
              <p className="text-[11px] text-slate-500">Sub-millisecond bid synchronization</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <h4 className="text-white font-bold text-xs">Concurrency Safe</h4>
              <p className="text-[11px] text-slate-500">ACID mutex locks prevent race conditions</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-rose-500/10 text-rose-400 border border-rose-500/20">
              <RefreshCcw className="w-5 h-5" />
            </div>
            <div>
              <h4 className="text-white font-bold text-xs">Anti-Sniping Engine</h4>
              <p className="text-[11px] text-slate-500">Automatic +30s clock extension on late bids</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-sky-500/10 text-sky-400 border border-sky-500/20">
              <Lock className="w-5 h-5" />
            </div>
            <div>
              <h4 className="text-white font-bold text-xs">Simulated Escrow</h4>
              <p className="text-[11px] text-slate-500">100% buyer & seller transactional security</p>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          <div className="space-y-4">
            <div className="flex items-center gap-2.5">
              <div className="flex items-center justify-center w-8 h-8 rounded-xl bg-amber-500 text-slate-950 font-bold">
                <Gavel className="w-4 h-4" />
              </div>
              <span className="text-lg font-bold text-white font-mono tracking-tight">
                Bid<span className="text-amber-400">X</span>change
              </span>
            </div>
            <p className="text-xs text-slate-400 leading-relaxed">
              Tagline: <strong className="text-slate-200">Bid Live. Compete Smart. Win Fair.</strong>
              <br />
              The high-velocity live auction marketplace designed for serious collectors and premier sellers.
            </p>
          </div>

          <div>
            <h5 className="text-xs font-bold uppercase tracking-wider text-white mb-3">Marketplace</h5>
            <ul className="space-y-2 text-xs">
              <li>
                <button onClick={() => onNavigate('explore')} className="hover:text-amber-400 transition-colors">
                  Explore Live Auctions
                </button>
              </li>
              <li>
                <button onClick={() => onNavigate('live')} className="hover:text-amber-400 transition-colors">
                  Live Arena &amp; Rooms
                </button>
              </li>
              <li>
                <button onClick={() => onNavigate('explore')} className="hover:text-amber-400 transition-colors">
                  Ending Soon Catalogs
                </button>
              </li>
              <li>
                <button onClick={() => onNavigate('seller')} className="hover:text-amber-400 transition-colors">
                  Seller Auction Studio
                </button>
              </li>
            </ul>
          </div>

          <div>
            <h5 className="text-xs font-bold uppercase tracking-wider text-white mb-3">Auction Categories</h5>
            <ul className="space-y-2 text-xs">
              <li>
                <button onClick={() => onNavigate('explore')} className="hover:text-amber-400 transition-colors">
                  Luxury Watches &amp; Horology
                </button>
              </li>
              <li>
                <button onClick={() => onNavigate('explore')} className="hover:text-amber-400 transition-colors">
                  Supercars &amp; Track Vehicles
                </button>
              </li>
              <li>
                <button onClick={() => onNavigate('explore')} className="hover:text-amber-400 transition-colors">
                  High-End Electronics &amp; Prototypes
                </button>
              </li>
              <li>
                <button onClick={() => onNavigate('explore')} className="hover:text-amber-400 transition-colors">
                  Collectibles &amp; Historical Memorabilia
                </button>
              </li>
            </ul>
          </div>

          <div>
            <h5 className="text-xs font-bold uppercase tracking-wider text-white mb-3">Pure JavaScript Architecture</h5>
            <p className="text-xs text-slate-400 leading-relaxed mb-3">
              Engineered natively with Node.js, Express, Socket.IO, PostgreSQL Prisma Schema, and built-in Node test runner.
            </p>
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-slate-900 border border-slate-800 text-[11px] text-emerald-400">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <span>Pure JS Engine Online (Port 3000)</span>
            </div>
          </div>
        </div>

        <div className="mt-12 pt-6 border-t border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-4 text-[11px] text-slate-500">
          <p>© {new Date().getFullYear()} BidXchange Inc. All rights reserved.</p>
          <div className="flex gap-4">
            <span className="hover:text-slate-400 cursor-pointer">Auction Terms</span>
            <span>•</span>
            <span className="hover:text-slate-400 cursor-pointer">Anti-Sniping Protocol</span>
            <span>•</span>
            <span className="hover:text-slate-400 cursor-pointer">Escrow Settlement Agreement</span>
          </div>
        </div>
      </div>
    </footer>
  );
};
