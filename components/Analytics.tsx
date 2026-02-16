import React, { useMemo, useState, useEffect } from 'react';
import { getAllItemsFlat, getHistory } from '../services/storageService';
import { generateSpendingInsight } from '../services/geminiService';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { Sparkles, TrendingUp, Search } from 'lucide-react';

export const Analytics: React.FC = () => {
  const [selectedProduct, setSelectedProduct] = useState<string>('');
  const [insight, setInsight] = useState<string>('');
  const [loadingInsight, setLoadingInsight] = useState(false);

  const allItems = useMemo(() => getAllItemsFlat(), []);
  
  // Get unique product names for the dropdown
  const uniqueProducts = useMemo(() => {
    const names = new Set(allItems.map(i => i.name.toLowerCase().trim()));
    return Array.from(names).sort();
  }, [allItems]);

  // Filter data for the chart based on selection
  const chartData = useMemo(() => {
    if (!selectedProduct) return [];
    return allItems
      .filter(i => i.name.toLowerCase().trim() === selectedProduct)
      .map(i => ({
        date: new Date(i.date).toLocaleDateString(undefined, { month: 'short', day: 'numeric' }),
        price: i.price,
        store: i.store,
        timestamp: i.date // for sorting
      }))
      .sort((a, b) => a.timestamp - b.timestamp);
  }, [allItems, selectedProduct]);

  useEffect(() => {
    if (allItems.length > 0) {
      setLoadingInsight(true);
      const history = getHistory().slice(0, 5); // Analyze last 5 trips
      const simplifiedHistory = history.map(h => ({
        date: new Date(h.date).toLocaleDateString(),
        store: h.storeName,
        total: h.totalSpent,
        budget: h.budget
      }));
      
      generateSpendingInsight(JSON.stringify(simplifiedHistory))
        .then(setInsight)
        .catch(() => setInsight("Could not generate insight."))
        .finally(() => setLoadingInsight(false));
    }
  }, [allItems.length]);

  return (
    <div className="p-4 space-y-6 pb-24">
      <div className="bg-gradient-to-r from-emerald-50 to-teal-50 p-4 rounded-xl border border-emerald-100 shadow-sm">
        <h2 className="text-lg font-bold text-emerald-900 flex items-center gap-2 mb-2">
          <Sparkles className="w-5 h-5 text-emerald-600" />
          AI Insight
        </h2>
        {loadingInsight ? (
           <p className="text-emerald-700 animate-pulse text-sm">Analyzing your spending habits...</p>
        ) : (
           <p className="text-emerald-800 text-sm italic">"{insight}"</p>
        )}
      </div>

      <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100">
        <h2 className="text-xl font-bold text-gray-800 mb-4 flex items-center gap-2">
            <TrendingUp className="w-6 h-6 text-gray-700" />
            Price Tracker
        </h2>
        
        <div className="relative mb-6">
            <Search className="absolute left-3 top-3 w-5 h-5 text-gray-400" />
            <select
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 outline-none appearance-none bg-white"
                value={selectedProduct}
                onChange={(e) => setSelectedProduct(e.target.value)}
            >
                <option value="">Select a product to track...</option>
                {uniqueProducts.map(p => (
                    <option key={p} value={p}>{p}</option>
                ))}
            </select>
        </div>

        {selectedProduct && chartData.length > 0 ? (
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
                <XAxis dataKey="date" tick={{fontSize: 12}} tickLine={false} axisLine={false} />
                <YAxis domain={['auto', 'auto']} tick={{fontSize: 12}} tickLine={false} axisLine={false} tickFormatter={(val) => `$${val}`} />
                <Tooltip 
                    contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}
                    formatter={(value: number) => [`$${value.toFixed(2)}`, 'Price']}
                />
                <Line 
                    type="monotone" 
                    dataKey="price" 
                    stroke="#10b981" 
                    strokeWidth={3} 
                    dot={{ r: 4, fill: '#10b981', strokeWidth: 2, stroke: '#fff' }} 
                    activeDot={{ r: 6 }} 
                />
              </LineChart>
            </ResponsiveContainer>
            <p className="text-center text-xs text-gray-400 mt-2">Price history across all stores</p>
          </div>
        ) : (
            <div className="h-64 flex flex-col items-center justify-center text-gray-400 bg-gray-50 rounded-lg border-2 border-dashed border-gray-200">
                <Search className="w-8 h-8 mb-2 opacity-50" />
                <p>Select a product to see price history</p>
            </div>
        )}
      </div>
    </div>
  );
};
