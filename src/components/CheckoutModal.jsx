import React, { useState } from 'react';
import { X, CreditCard, ShieldCheck, CheckCircle2, Lock, Truck, ArrowRight } from 'lucide-react';
import confetti from 'canvas-confetti';
import { api } from '../services/api.js';

export const CheckoutModal = ({
  auction,
  isOpen,
  onClose,
  onPaymentComplete,
}) => {
  const [address, setAddress] = useState('742 Evergreen Terrace, Springfield, OR 97477');
  const [cardNumber, setCardNumber] = useState('•••• •••• •••• 4242');
  const [cardExpiry, setCardExpiry] = useState('12/28');
  const [cardCvc, setCardCvc] = useState('884');
  const [isProcessing, setIsProcessing] = useState(false);
  const [receipt, setReceipt] = useState(null);

  if (!isOpen) return null;

  const handlePay = async (e) => {
    e.preventDefault();
    setIsProcessing(true);

    try {
      const res = await api.buyer.checkout({
        auctionId: auction.id,
        shippingAddress: address,
        paymentMethod: 'BID_ESCROW_PROTECTION',
      });

      setReceipt(res.order);
      confetti({
        particleCount: 100,
        spread: 70,
        origin: { y: 0.6 },
      });

      onPaymentComplete();
    } catch (err) {
      alert(err.message || 'Payment simulation failed');
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-md animate-fadeIn">
      <div className="relative w-full max-w-lg bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-2xl">
        <button
          onClick={onClose}
          className="absolute top-5 right-5 p-2 text-slate-400 hover:text-white rounded-full bg-slate-800/60 hover:bg-slate-800 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        {!receipt ? (
          <div>
            <div className="flex items-center gap-3">
              <div className="p-3 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400">
                <ShieldCheck className="w-6 h-6" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-white">Complete Winning Escrow</h2>
                <p className="text-xs text-slate-400">Secure simulated settlement for your winning auction</p>
              </div>
            </div>

            <div className="mt-5 p-4 rounded-2xl bg-slate-950 border border-slate-800 flex items-center gap-4">
              <img
                src={auction.images?.[0]?.url || 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=200'}
                alt={auction.title}
                className="w-16 h-16 rounded-xl object-cover"
              />
              <div className="flex-1 min-w-0">
                <h3 className="text-sm font-semibold text-white truncate">{auction.title}</h3>
                <div className="mt-1 flex items-baseline gap-2">
                  <span className="text-xs text-slate-400">Winning Hammer Bid:</span>
                  <span className="text-base font-bold font-mono text-emerald-400">
                    ${auction.currentHighestBid.toLocaleString()}
                  </span>
                </div>
              </div>
            </div>

            <form onSubmit={handlePay} className="mt-6 space-y-4">
              <div>
                <label className="text-xs font-semibold uppercase tracking-wider text-slate-400 flex items-center gap-1.5 mb-2">
                  <Truck className="w-3.5 h-3.5 text-amber-400" />
                  Verified Delivery Address
                </label>
                <input
                  type="text"
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 focus:border-amber-500 rounded-xl px-4 py-3 text-sm text-white outline-none"
                  required
                />
              </div>

              <div>
                <label className="text-xs font-semibold uppercase tracking-wider text-slate-400 flex items-center gap-1.5 mb-2">
                  <CreditCard className="w-3.5 h-3.5 text-amber-400" />
                  Escrow Payment Method
                </label>
                <div className="space-y-2">
                  <input
                    type="text"
                    value={cardNumber}
                    onChange={(e) => setCardNumber(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-700 focus:border-amber-500 rounded-xl px-4 py-3 text-sm font-mono text-white outline-none"
                    placeholder="Card Number"
                    required
                  />
                  <div className="grid grid-cols-2 gap-2">
                    <input
                      type="text"
                      value={cardExpiry}
                      onChange={(e) => setCardExpiry(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-700 focus:border-amber-500 rounded-xl px-4 py-3 text-sm font-mono text-white outline-none"
                      placeholder="MM/YY"
                      required
                    />
                    <input
                      type="text"
                      value={cardCvc}
                      onChange={(e) => setCardCvc(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-700 focus:border-amber-500 rounded-xl px-4 py-3 text-sm font-mono text-white outline-none"
                      placeholder="CVC"
                      required
                    />
                  </div>
                </div>
              </div>

              <div className="p-3 rounded-xl bg-emerald-950/20 border border-emerald-500/30 flex items-center gap-2 text-xs text-emerald-300">
                <Lock className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>Simulated BidXchange 256-Bit Encrypted Escrow Vault</span>
              </div>

              <button
                type="submit"
                disabled={isProcessing}
                className="w-full py-3.5 rounded-2xl font-bold uppercase tracking-wider text-sm bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 text-slate-950 shadow-lg shadow-emerald-950/50 transition-all flex items-center justify-center gap-2"
              >
                {isProcessing ? (
                  <span className="animate-spin w-5 h-5 border-2 border-slate-950 border-t-transparent rounded-full" />
                ) : (
                  <>
                    <span>Authorize Payment (${auction.currentHighestBid.toLocaleString()})</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </form>
          </div>
        ) : (
          <div className="text-center py-4">
            <div className="mx-auto w-16 h-16 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center mb-4">
              <CheckCircle2 className="w-10 h-10" />
            </div>
            <h2 className="text-2xl font-bold text-white">Payment Authorized!</h2>
            <p className="mt-1 text-sm text-slate-400">
              Funds held safely in escrow. The seller has been alerted to dispatch your item.
            </p>

            <div className="mt-6 p-4 rounded-2xl bg-slate-950 border border-slate-800 text-left text-xs space-y-2">
              <div className="flex justify-between">
                <span className="text-slate-400">Order ID:</span>
                <span className="font-mono text-white">{receipt.id}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Amount Paid:</span>
                <span className="font-mono text-emerald-400 font-bold">${receipt.totalAmount.toLocaleString()}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Escrow Status:</span>
                <span className="font-semibold text-emerald-400">FUNDS_IN_ESCROW</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Delivery Address:</span>
                <span className="text-white truncate max-w-[200px]">{receipt.shippingAddress}</span>
              </div>
            </div>

            <button
              onClick={onClose}
              className="mt-6 w-full py-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-semibold text-sm transition-colors"
            >
              Close Receipt
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
