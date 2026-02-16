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
              <Loader2 className="w-8 h-8 animate-spin" />
          </div>
      );
  }

  return (
    <div className="h-full overflow-y-auto p-4 space-y-4 relative">
      <h2 className="text-2xl font-bold text-gray-800 mb-2 sticky top-0 bg-white/95 backdrop-blur-sm py-2 z-10 border-b border-transparent transition-all">Shopping History</h2>
      
      {history.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-gray-400">
            <ShoppingBag className="w-16 h-16 mb-4 opacity-30" />
            <p className="text-lg">No shopping history yet.</p>
            <p className="text-sm">Start a trip to see records here.</p>
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
            <div key={trip.id} className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden transition-all duration-300">
              <div 
                onClick={() => toggleExpand(trip.id)}
                className="p-4 flex justify-between items-center cursor-pointer hover:bg-gray-50"
              >
                <div className="flex flex-col">
                  <div className="font-bold text-gray-800 text-lg">{trip.storeName}</div>
                  <div className="flex items-center text-xs text-gray-500 gap-2 mt-1">
                      <Calendar className="w-3 h-3" />
                      {dateStr}
                  </div>
                </div>
                <div className="flex flex-col items-end">
                  <div className="font-mono font-bold text-gray-800">${trip.totalSpent.toFixed(2)}</div>
                  <div className={`text-xs font-medium ${isOverBudget ? 'text-red-500' : 'text-emerald-600'}`}>
                    {isOverBudget ? 'Over ' : 'Under '} ${Math.abs(savings).toFixed(2)}
                  </div>
                </div>
              </div>

              {/* Expanded Details */}
              {isExpanded && (
                <div className="bg-gray-50 p-4 border-t border-gray-100 animate-in slide-in-from-top-2 duration-200">
                  <div className="flex justify-between text-sm text-gray-600 mb-2 pb-2 border-b border-gray-200">
                      <span>Budget: ${trip.budget.toFixed(2)}</span>
                      <span>Items: {trip.items.length}</span>
                  </div>
                  <ul className="space-y-3">
                    {trip.items.map((item) => (
                      <li key={item.id} className="flex justify-between items-center text-sm group">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded bg-white border border-gray-200 flex items-center justify-center overflow-hidden flex-shrink-0">
                              {item.imageUrl ? (
                                  <img src={item.imageUrl} alt={item.name} className="w-full h-full object-cover" />
                              ) : (
                                  <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
                              )}
                            </div>
                            <div className="flex flex-col">
                              <span className="text-gray-800 font-medium">{item.name}</span>
                              <span className="text-xs text-gray-500 bg-gray-200 px-1.5 py-0.5 rounded-md self-start">{item.category}</span>
                            </div>
                        </div>
                        <div className="flex items-center gap-3">
                            <button 
                                onClick={(e) => handleChatOpen(item, trip.storeName, e)}
                                className="p-1.5 text-gray-400 hover:text-emerald-600 hover:bg-emerald-50 rounded-full transition-colors"
                                title="Chat with product"
                            >
                                <MessageCircle className="w-4 h-4" />
                            </button>
                            <span className="font-mono text-gray-600 font-medium w-14 text-right">${item.price.toFixed(2)}</span>
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
      <div className="h-8"></div>
    </div>
  );
};
