import React, { useState, useEffect } from 'react';
import { ShoppingTrip, ShoppingItem } from '../types';
import { getHistory } from '../services/storageService';
import { ShoppingBag, Calendar, Loader2, MessageCircle } from 'lucide-react';
import { ProductChat } from './ProductChat';

export const History: React.FC = () => {
  const [history, setHistory] = useState<ShoppingTrip[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  
  // State for the active chat
  const [chatItem, setChatItem] = useState<{ item: ShoppingItem, storeName: string } | null>(null);

  useEffect(() => {
    const loadData = async () => {
        try {
            const data = await getHistory();
            setHistory(data);
        } catch (error) {
            console.error("Failed to load history", error);
        } finally {
            setLoading(false);
        }
    };
    loadData();
  }, []);

  const toggleExpand = (id: string) => {
    setExpandedId(expandedId === id ? null : id);
  };

  const handleChatOpen = (item: ShoppingItem, storeName: string, e: React.MouseEvent) => {
    e.stopPropagation(); // Prevent toggling the accordion
    setChatItem({ item, storeName });
  };

  if (loading) {
      return (
          <div className="flex flex-col items-center justify-center h-full text-emerald-600">
              <Loader2 className="w-10 h-10 animate-spin opacity-80" />
          </div>
      );
  }

  return (
    <div className="h-full overflow-y-auto p-4 space-y-4 relative">
      <h2 className="text-3xl font-black text-slate-800 mb-4 sticky top-0 bg-transparent py-4 z-10 drop-shadow-sm">Shopping History</h2>
      
      {history.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-slate-400">
            <div className="bg-white/20 p-6 rounded-full border border-white/30 backdrop-blur-sm mb-4">
                <ShoppingBag className="w-12 h-12 opacity-50" />
            </div>
            <p className="text-xl font-bold">No history yet.</p>
            <p className="text-sm opacity-80">Start a trip to see records here.</p>
        </div>
      ) : (
        history.map((trip) => {
          const isExpanded = expandedId === trip.id;
          const dateStr = new Date(trip.date).toLocaleDateString(undefined, { 
              weekday: 'short', 
              year: 'numeric', 
              month: 'long', 
              day: 'numeric' 
          });
          const savings = trip.budget - trip.totalSpent;
          const isOverBudget = savings < 0;

          return (
            <div key={trip.id} className="bg-white/40 backdrop-blur-md rounded-3xl shadow-[0_8px_32px_0_rgba(31,38,135,0.05)] border border-white/50 overflow-hidden transition-all duration-300 hover:bg-white/50">
              <div 
                onClick={() => toggleExpand(trip.id)}
                className="p-5 flex justify-between items-center cursor-pointer"
              >
                <div className="flex flex-col">
                  <div className="font-bold text-slate-800 text-xl">{trip.storeName}</div>
                  <div className="flex items-center text-xs font-semibold text-slate-500 gap-2 mt-1 uppercase tracking-wide">
                      <Calendar className="w-3 h-3" />
                      {dateStr}
                  </div>
                </div>
                <div className="flex flex-col items-end">
                  <div className="font-mono font-bold text-slate-800 text-lg">${trip.totalSpent.toFixed(2)}</div>
                  <div className={`text-xs font-bold px-2 py-0.5 rounded-lg mt-1 ${isOverBudget ? 'bg-red-100/50 text-red-600' : 'bg-emerald-100/50 text-emerald-600'}`}>
                    {isOverBudget ? 'Over' : 'Saved'} ${Math.abs(savings).toFixed(2)}
                  </div>
                </div>
              </div>

              {/* Expanded Details */}
              {isExpanded && (
                <div className="bg-white/30 p-4 border-t border-white/40 animate-in slide-in-from-top-2 duration-200">
                  <div className="flex justify-between text-sm font-semibold text-slate-600 mb-3 pb-2 border-b border-white/30">
                      <span>Budget: ${trip.budget.toFixed(2)}</span>
                      <span>{trip.items.length} Items</span>
                  </div>
                  <ul className="space-y-3">
                    {trip.items.map((item) => (
                      <li key={item.id} className="flex justify-between items-center text-sm group bg-white/40 p-2 rounded-xl border border-transparent hover:border-white/40 transition">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-lg bg-white/70 flex items-center justify-center overflow-hidden flex-shrink-0 shadow-sm">
                              {item.imageUrl ? (
                                  <img src={item.imageUrl} alt={item.name} className="w-full h-full object-cover mix-blend-multiply" />
                              ) : (
                                  <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
                              )}
                            </div>
                            <div className="flex flex-col">
                              <span className="text-slate-800 font-bold">{item.name}</span>
                              <span className="text-[10px] text-slate-500 bg-white/50 px-1.5 py-0.5 rounded-md self-start border border-white/30">{item.category}</span>
                            </div>
                        </div>
                        <div className="flex items-center gap-2">
                            <button 
                                onClick={(e) => handleChatOpen(item, trip.storeName, e)}
                                className="p-1.5 text-slate-400 hover:text-emerald-600 hover:bg-white rounded-full transition-all"
                            >
                                <MessageCircle className="w-4 h-4" />
                            </button>
                            <span className="font-mono text-slate-600 font-medium w-14 text-right">${item.price.toFixed(2)}</span>
                        </div>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          );
        })
      )}

      {/* Chat Modal */}
      {chatItem && (
        <ProductChat 
            item={chatItem.item} 
            storeName={chatItem.storeName} 
            onClose={() => setChatItem(null)} 
        />
      )}
      
      {/* Spacer for bottom ease */}
      <div className="h-24"></div>
    </div>
  );
};