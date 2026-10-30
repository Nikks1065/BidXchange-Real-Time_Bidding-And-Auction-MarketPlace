import React, { useState, useEffect } from 'react';
import {
  Search,
  SlidersHorizontal,
  Flame,
  Clock,
  Sparkles,
  RotateCcw,
} from 'lucide-react';
import { Auction, Category } from '../types/index.ts';
import { api } from '../services/api.ts';
import { AuctionCard } from '../components/AuctionCard.tsx';

interface ExplorePageProps {
  onSelectAuction: (auction: Auction) => void;
  onOpenBidModal: (auction: Auction) => void;
}

export const ExplorePage: React.FC<ExplorePageProps> = ({ onSelectAuction, onOpenBidModal }) => {
  const [auctions, setAuctions] = useState<Auction[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Filters state
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [sortBy, setSortBy] = useState('endingSoon');
  const [minPrice, setMinPrice] = useState<number | ''>('');
  const [maxPrice, setMaxPrice] = useState<number | ''>('');

  const fetchAuctions = async () => {
    setIsLoading(true);
    try {
      const res = await api.auctions.list({
        search: search.trim() || undefined,
        category: selectedCategory !== 'all' ? selectedCategory : undefined,
        status: statusFilter !== 'all' ? statusFilter : undefined,
        sort: sortBy,
        minPrice: minPrice !== '' ? Number(minPrice) : undefined,
        maxPrice: maxPrice !== '' ? Number(maxPrice) : undefined,
      });
      setAuctions(res.auctions);
    } catch (err) {
      console.error('Failed to query auctions', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    const fetchCats = async () => {
      try {
        const catRes = await api.categories.list();
        setCategories(catRes.categories);
      } catch {
        // ignore
      }
    };
    fetchCats();
  }, []);

  useEffect(() => {
    const debounceTimer = setTimeout(() => {
      fetchAuctions();
    }, 250);
    return () => clearTimeout(debounceTimer);
  }, [search, selectedCategory, statusFilter, sortBy, minPrice, maxPrice]);

  const handleResetFilters = () => {
    setSearch('');
    setSelectedCategory('all');
    setStatusFilter('all');
    setSortBy('endingSoon');
    setMinPrice('');
    setMaxPrice('');
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12 space-y-8">
      {/* Header */}
      <div>
        <span className="text-xs font-bold uppercase tracking-wider text-amber-400">
          Marketplace Catalog
        </span>
        <h1 className="text-3xl sm:text-4xl font-extrabold text-white mt-1">
          Explore Auctions
        </h1>
        <p className="mt-1 text-sm text-slate-400">
          Browse real-time active auctions, verify bids, and submit bids without delay.
        </p>
      </div>

      {/* Filter and Search Bar */}
      <div className="p-4 sm:p-6 rounded-3xl bg-slate-900/90 border border-slate-800 space-y-4">
        {/* Top search & Sort */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
          <div className="md:col-span-8 relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by title, brand, reference number (e.g. Rolex, Porsche, Charizard)..."
              className="w-full bg-slate-950 border border-slate-700/80 focus:border-amber-500 rounded-2xl pl-11 pr-4 py-3 text-sm text-white placeholder-slate-500 outline-none transition-colors"
            />
          </div>

          <div className="md:col-span-4 flex items-center gap-3">
            <div className="flex-1">
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="w-full bg-slate-950 border border-slate-700/80 focus:border-amber-500 rounded-2xl px-4 py-3 text-sm text-white outline-none cursor-pointer"
              >
                <option value="endingSoon">Ending Soon</option>
                <option value="newest">Newest Listed</option>
                <option value="highestBid">Highest Bid First</option>
                <option value="popular">Most Bids Placed</option>
              </select>
            </div>

            <button
              onClick={handleResetFilters}
              title="Reset Filters"
              className="p-3 rounded-2xl bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition-colors"
            >
              <RotateCcw className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Category Pills */}
        <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none">
          <button
            onClick={() => setSelectedCategory('all')}
            className={`px-4 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-all ${
              selectedCategory === 'all'
                ? 'bg-amber-500 text-slate-950 shadow-md shadow-amber-950/40'
                : 'bg-slate-950 text-slate-300 hover:text-white hover:bg-slate-800 border border-slate-800'
            }`}
          >
            All Categories
          </button>
          {categories.map((c) => (
            <button
              key={c.id}
              onClick={() => setSelectedCategory(c.id)}
              className={`px-4 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-all ${
                selectedCategory === c.id
                  ? 'bg-amber-500 text-slate-950 shadow-md shadow-amber-950/40'
                  : 'bg-slate-950 text-slate-300 hover:text-white hover:bg-slate-800 border border-slate-800'
              }`}
            >
              {c.name}
            </button>
          ))}
        </div>

        {/* Secondary Status & Price filter ribbon */}
        <div className="pt-3 border-t border-slate-800/80 flex flex-wrap items-center justify-between gap-4 text-xs">
          {/* Status filters */}
          <div className="flex items-center gap-2">
            <span className="text-slate-400 font-medium">Status:</span>
            {[
              { id: 'all', label: 'All Statuses' },
              { id: 'LIVE', label: 'Live Now' },
              { id: 'SCHEDULED', label: 'Upcoming' },
              { id: 'ENDED', label: 'Concluded' },
            ].map((st) => (
              <button
                key={st.id}
                onClick={() => setStatusFilter(st.id)}
                className={`px-3 py-1.5 rounded-lg font-semibold transition-colors ${
                  statusFilter === st.id
                    ? 'bg-slate-800 text-white border border-slate-700'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                {st.label}
              </button>
            ))}
          </div>

          {/* Min & Max price inputs */}
          <div className="flex items-center gap-2">
            <span className="text-slate-400 font-medium">Price Range:</span>
            <input
              type="number"
              placeholder="Min $"
              value={minPrice}
              onChange={(e) => setMinPrice(e.target.value ? Number(e.target.value) : '')}
              className="w-24 bg-slate-950 border border-slate-800 focus:border-amber-500 rounded-lg px-2.5 py-1 text-white text-xs outline-none"
            />
            <span className="text-slate-600">-</span>
            <input
              type="number"
              placeholder="Max $"
              value={maxPrice}
              onChange={(e) => setMaxPrice(e.target.value ? Number(e.target.value) : '')}
              className="w-24 bg-slate-950 border border-slate-800 focus:border-amber-500 rounded-lg px-2.5 py-1 text-white text-xs outline-none"
            />
          </div>
        </div>
      </div>

      {/* Results Count & Grid */}
      <div>
        <div className="flex items-center justify-between mb-6">
          <span className="text-xs font-semibold text-slate-400">
            Showing <strong className="text-white">{auctions.length}</strong> auctions
          </span>
        </div>

        {isLoading ? (
          <div className="py-24 text-center">
            <div className="inline-block animate-spin w-8 h-8 border-3 border-amber-500 border-t-transparent rounded-full" />
            <p className="mt-3 text-xs text-slate-400">Loading auction marketplace...</p>
          </div>
        ) : auctions.length === 0 ? (
          <div className="p-12 text-center rounded-3xl bg-slate-900 border border-slate-800 space-y-3">
            <div className="mx-auto w-12 h-12 rounded-2xl bg-slate-800 flex items-center justify-center text-slate-400">
              <Search className="w-6 h-6" />
            </div>
            <h3 className="text-base font-bold text-white">No auctions match your filters</h3>
            <p className="text-xs text-slate-400 max-w-sm mx-auto">
              Try adjusting your search query, price bounds, or category selections.
            </p>
            <button
              onClick={handleResetFilters}
              className="mt-2 px-4 py-2 rounded-xl bg-amber-500 text-slate-950 font-bold text-xs uppercase"
            >
              Reset Filters
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {auctions.map((auction) => (
              <AuctionCard
                key={auction.id}
                auction={auction}
                onSelect={onSelectAuction}
                onOpenBidModal={onOpenBidModal}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
