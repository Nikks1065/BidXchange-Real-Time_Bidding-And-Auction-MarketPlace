import React, { useState } from 'react';
import { AuthProvider } from './context/AuthContext.jsx';
import { SocketProvider } from './context/SocketContext.jsx';
import { Navbar } from './components/Navbar.jsx';
import { Footer } from './components/Footer.jsx';
import { HomePage } from './pages/HomePage.jsx';
import { ExplorePage } from './pages/ExplorePage.jsx';
import { LiveAuctionPage } from './pages/LiveAuctionPage.jsx';
import { SellerStudioPage } from './pages/SellerStudioPage.jsx';
import { BuyerDashboardPage } from './pages/BuyerDashboardPage.jsx';
import { AdminPage } from './pages/AdminPage.jsx';
import { AuthModal } from './pages/AuthModal.jsx';
import { BidModal } from './components/BidModal.jsx';
import { DemoSwitcherModal } from './components/DemoSwitcherModal.jsx';

function MainApp() {
  const [currentTab, setCurrentTab] = useState('home');
  const [selectedAuctionId, setSelectedAuctionId] = useState('auc-rolex-daytona');
  const [isAuthOpen, setIsAuthOpen] = useState(false);
  const [isDemoSwitcherOpen, setIsDemoSwitcherOpen] = useState(false);
  const [bidModalAuction, setBidModalAuction] = useState(null);

  const handleNavigate = (tab, auctionId) => {
    if (auctionId) {
      setSelectedAuctionId(auctionId);
    }
    setCurrentTab(tab);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleOpenBidModal = (auction) => {
    setBidModalAuction(auction);
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans selection:bg-amber-500 selection:text-slate-950">
      {/* Top Navbar */}
      <Navbar
        currentTab={currentTab}
        onNavigate={handleNavigate}
        onOpenAuth={() => setIsAuthOpen(true)}
        onOpenDemoSwitcher={() => setIsDemoSwitcherOpen(true)}
      />

      {/* Main Page Body */}
      <main className="flex-1">
        {currentTab === 'home' && (
          <HomePage
            onNavigate={handleNavigate}
            onOpenBidModal={handleOpenBidModal}
            onOpenAuth={() => setIsAuthOpen(true)}
          />
        )}

        {currentTab === 'explore' && (
          <ExplorePage
            onSelectAuction={(auc) => handleNavigate('live', auc.id)}
            onOpenBidModal={handleOpenBidModal}
          />
        )}

        {currentTab === 'live' && (
          <LiveAuctionPage
            auctionId={selectedAuctionId}
            onNavigate={handleNavigate}
          />
        )}

        {currentTab === 'seller' && (
          <SellerStudioPage onNavigate={handleNavigate} />
        )}

        {currentTab === 'buyer' && (
          <BuyerDashboardPage onNavigate={handleNavigate} />
        )}

        {currentTab === 'admin' && <AdminPage />}
      </main>

      {/* Footer */}
      <Footer onNavigate={handleNavigate} />

      {/* Modals */}
      <AuthModal
        isOpen={isAuthOpen}
        onClose={() => setIsAuthOpen(false)}
      />

      <DemoSwitcherModal
        isOpen={isDemoSwitcherOpen}
        onClose={() => setIsDemoSwitcherOpen(false)}
      />

      {bidModalAuction && (
        <BidModal
          auction={bidModalAuction}
          isOpen={!!bidModalAuction}
          onClose={() => setBidModalAuction(null)}
          onBidPlaced={(updated) => {
            setBidModalAuction(null);
            handleNavigate('live', updated.id);
          }}
        />
      )}
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <SocketProvider>
        <MainApp />
      </SocketProvider>
    </AuthProvider>
  );
}
