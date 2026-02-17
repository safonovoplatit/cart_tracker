import React, { useMemo, useState, useEffect } from 'react';
import { getAllItemsFlat, getHistory, getWeeklyItemData } from '../services/storageService';
import { generateSpendingInsight, generateWeeklySummary } from '../services/geminiService';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { Sparkles, TrendingUp, Search, CalendarClock, AlertCircle, Loader2 } from 'lucide-react';
import { WeeklySummary } from '../types';

export const Analytics: React.FC = () => {
  const [selectedProduct, setSelectedProduct] = useState<string>('');
  const [insight, setInsight] = useState<string>('');
  const [loadingInsight, setLoadingInsight] = useState(false);
  
  const [weeklySummaries, setWeeklySummaries] = useState<WeeklySummary[]>([]);
  const [loadingSummaries, setLoadingSummaries] = useState(false);
  const [summaryError, setSummaryError] = useState(false);

  const [allItems, setAllItems] = useState<{ name: string; price: number; date: number; store: string }[]>([]);
  const [loadingData, setLoadingData] = useState(true);

  // Fetch initial data from DB
  useEffect(() => {
    const fetchData = async () => {
        try {
            const items = await getAllItemsFlat();
            setAllItems(items);
        } catch (error) {
            console.error("Failed to load analytics data", error);
        } finally {
            setLoadingData(false);
        }
    };
    fetchData();
  }, []);
  
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

  // Generate Insights and Summaries when data is ready
  useEffect(() => {
    if (allItems.length > 0) {
      setLoadingInsight(true);
      
      // We need history for insight, so fetch it
      getHistory().then(history => {
          const simplifiedHistory = history.slice(0, 5).map(h => ({
            date: new Date(h.date).toLocaleDateString(),
            store: h.storeName,
            total: h.totalSpent,
            budget: h.budget
          }));
          
          generateSpendingInsight(JSON.stringify(simplifiedHistory))
            .then(setInsight)
            .catch(() => setInsight("Could not generate insight."))
            .finally(() => setLoadingInsight(false));
      });

      // Generate Weekly Summary
      setLoadingSummaries(true);
      setSummaryError(false);
      
      getWeeklyItemData().then(weeklyData => {
           generateWeeklySummary(weeklyData)
            .then(setWeeklySummaries)
            .catch(err => {
                console.error(err);
                setSummaryError(true);
            })
            .finally(() => setLoadingSummaries(false));
      });
    }
  }, [allItems.length]);

  if (loadingData) {
      return (
          <div className="flex flex-col items-center justify-center h-full text-emerald-600">
              <Loader2 className="w-10 h-10 animate-spin opacity-80" />
          </div>
      );
  }

  return (
    <div className="h-full overflow-y-auto p-4 space-y-6">
      
      {/* AI Insight Card (Special Glass) */}
      <div className="bg-gradient-to-br from-emerald-100/40 to-teal-100/40 backdrop-blur-md p-6 rounded-3xl border border-white/50 shadow-lg relative overflow-hidden group">
        <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition">
             <Sparkles className="w-20 h-20 text-emerald-600" />
        </div>
        <h2 className="text-lg font-black text-emerald-900 flex items-center gap-2 mb-3">
          <Sparkles className="w-5 h-5 text-emerald-600" />
          AI Insight
        </h2>
        {loadingInsight ? (
           <div className="flex items-center gap-2 text-emerald-700 animate-pulse text-sm font-medium">
             <Loader2 className="w-4 h-4 animate-spin" /> Analyzing your spending habits...
           </div>
        ) : (
           <p className="text-emerald-900 text-lg font-medium leading-relaxed italic relative z-10">"{insight}"</p>
        )}
      </div>

      {/* Weekly Summary List */}
      <div className="bg-white/40 backdrop-blur-md p-6 rounded-3xl shadow-sm border border-white/50">
        <h2 className="text-lg font-black text-slate-800 flex items-center gap-2 mb-4">
          <CalendarClock className="w-5 h-5 text-slate-600" />
          Weekly Product Summary
        </h2>
        {loadingSummaries ? (
          <div className="space-y-3">
             <div className="h-4 bg-white/50 rounded w-3/4 animate-pulse"></div>
             <div className="h-4 bg-white/50 rounded w-1/2 animate-pulse"></div>
          </div>
        ) : summaryError ? (
           <div className="flex items-center gap-2 text-red-500 text-sm">
             <AlertCircle className="w-4 h-4" />
             <p>Unable to generate summary. Try again later.</p>
           </div>
        ) : weeklySummaries.length > 0 ? (
          <div className="space-y-4">
            {weeklySummaries.map((item, index) => (
              <div key={index} className="border-l-4 border-emerald-400 pl-4 py-1">
                <h3 className="text-xs font-bold text-slate-500 uppercase tracking-widest">{item.week}</h3>
                <p className="text-sm text-slate-800 font-medium mt-1 leading-snug">{item.summary}</p>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-sm text-slate-400 italic">No weekly data available yet.</p>
        )}
      </div>

      {/* Price Tracker Chart */}
      <div className="bg-white/40 backdrop-blur-md p-6 rounded-3xl shadow-sm border border-white/50">
        <h2 className="text-xl font-black text-slate-800 mb-4 flex items-center gap-2">
            <TrendingUp className="w-6 h-6 text-slate-600" />
            Price Tracker
        </h2>
        
        <div className="relative mb-6">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
            <select
                className="w-full pl-12 pr-4 py-3 border border-white/40 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none appearance-none bg-white/50 font-medium text-slate-700 shadow-inner"
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
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(255,255,255,0.5)" />
                <XAxis dataKey="date" tick={{fontSize: 12, fill: '#64748b'}} tickLine={false} axisLine={false} />
                <YAxis domain={['auto', 'auto']} tick={{fontSize: 12, fill: '#64748b'}} tickLine={false} axisLine={false} tickFormatter={(val) => `$${val}`} />
                <Tooltip 
                    contentStyle={{ borderRadius: '12px', border: '1px solid rgba(255,255,255,0.5)', background: 'rgba(255,255,255,0.8)', backdropFilter: 'blur(4px)', boxShadow: '0 8px 32px rgba(0,0,0,0.1)' }}
                    formatter={(value: number) => [`$${value.toFixed(2)}`, 'Price']}
                />
                <Line 
                    type="monotone" 
                    dataKey="price" 
                    stroke="#10b981" 
                    strokeWidth={4} 
                    dot={{ r: 5, fill: '#10b981', strokeWidth: 3, stroke: '#fff' }} 
                    activeDot={{ r: 8 }} 
                />
              </LineChart>
            </ResponsiveContainer>
            <p className="text-center text-xs text-slate-400 mt-2 font-medium">Price history across all stores</p>
          </div>
        ) : (
            <div className="h-64 flex flex-col items-center justify-center text-slate-400 bg-white/20 rounded-2xl border-2 border-dashed border-white/40">
                <Search className="w-10 h-10 mb-2 opacity-50" />
                <p className="font-medium">Select a product to see price history</p>
            </div>
        )}
      </div>
      <div className="h-24"></div>
    </div>
  );
};