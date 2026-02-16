import React, { useState, useEffect } from 'react';
import { ShoppingTrip } from '../types';
import { getHistory } from '../services/storageService';
import { ChevronDown, ChevronUp, ShoppingBag, Calendar, DollarSign, Image as ImageIcon } from 'lucide-react';

export const History: React.FC = () => {
  const [history, setHistory] = useState<ShoppingTrip[]>([]);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  useEffect(() => {
    setHistory(getHistory());
  }, []);

  const toggleExpand = (id: string) => {
    setExpandedId(expandedId === id ? null : id);
  };

  if (history.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-[60vh] text-gray-400">
        <ShoppingBag className="w-16 h-16 mb-4 opacity-30" />
        <p className="text-lg">No shopping history yet.</p>
        <p className="text-sm">Start a trip to see records here.</p>
      </div>
    );
  }

  return (
    <div className="p-4 space-y-4 pb-24">
      <h2 className="text-2xl font-bold text-gray-800 mb-6">Shopping History</h2>
      {history.map((trip) => {
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
                    <li key={item.id} className="flex justify-between items-center text-sm">
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
                      <span className="font-mono text-gray-600 font-medium">${item.price.toFixed(2)}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
};
