import React, { useState, useEffect, useRef } from 'react';
import { ShoppingTrip, ShoppingItem } from '../types';
import { categorizeItem, generateItemImage } from '../services/geminiService';
import { saveTrip } from '../services/storageService';
import { ProgressBar } from './ui/ProgressBar';
import { Plus, Trash2, Save, ShoppingCart, Loader2, Image as ImageIcon, MessageCircle } from 'lucide-react';
import { ProductChat } from './ProductChat';

interface ActiveTripProps {
  onFinish: () => void;
  onCancel: () => void;
}

export const ActiveTrip: React.FC<ActiveTripProps> = ({ onFinish, onCancel }) => {
  const [storeName, setStoreName] = useState('');
  const [budget, setBudget] = useState<string>('');
  const [items, setItems] = useState<ShoppingItem[]>([]);
  const [itemName, setItemName] = useState('');
  const [itemPrice, setItemPrice] = useState('');
  const [isSetupMode, setIsSetupMode] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  
  // State for active product chat
  const [chatItem, setChatItem] = useState<{ item: ShoppingItem } | null>(null);
  
  const totalSpent = items.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  const numericBudget = parseFloat(budget) || 0;
  const remaining = numericBudget - totalSpent;

  // Use refs for inputs to manage focus
  const nameInputRef = useRef<HTMLInputElement>(null);
  const priceInputRef = useRef<HTMLInputElement>(null);

  const handleStartTrip = (e: React.FormEvent) => {
    e.preventDefault();
    if (storeName && budget) {
      setIsSetupMode(false);
    }
  };

  const addItem = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!itemName || !itemPrice) return;

    const newItemId = crypto.randomUUID();
    const priceNum = parseFloat(itemPrice);

    // Optimistic update
    const tempItem: ShoppingItem = {
      id: newItemId,
      name: itemName,
      price: priceNum,
      category: 'Loading...',
      quantity: 1,
      timestamp: Date.now(),
      imageUrl: undefined,
    };

    setItems(prev => [tempItem, ...prev]);
    setItemName('');
    setItemPrice('');
    
    // Reset focus to name input for rapid entry
    if (nameInputRef.current) nameInputRef.current.focus();

    // Background tasks: Categorization and Image Generation
    Promise.all([
      categorizeItem(tempItem.name),
      generateItemImage(tempItem.name)
    ]).then(([category, imageUrl]) => {
      setItems(prev => prev.map(item => 
        item.id === newItemId ? { ...item, category, imageUrl } : item
      ));
    }).catch(err => {
      console.error("Error enriching item:", err);
      // Ensure category isn't stuck on loading if error occurs
      setItems(prev => prev.map(item => 
        item.id === newItemId && item.category === 'Loading...' ? { ...item, category: 'Other' } : item
      ));
    });
  };

  const removeItem = (id: string) => {
    setItems(prev => prev.filter(i => i.id !== id));
  };

  const finishTrip = async () => {
    if (items.length === 0) {
        onCancel();
        return;
    }
    
    setIsSaving(true);
    try {
        const trip: ShoppingTrip = {
          id: crypto.randomUUID(),
          storeName,
          date: Date.now(),
          budget: numericBudget,
          items,
          totalSpent
        };
        await saveTrip(trip);
        onFinish();
    } catch (error) {
        console.error("Failed to save trip", error);
        alert("Failed to save trip. Please try again.");
    } finally {
        setIsSaving(false);
    }
  };

  if (isSetupMode) {
    return (
      <div className="h-full flex flex-col items-center justify-center p-6">
        <div className="w-full max-w-md p-8 bg-white/40 backdrop-blur-xl border border-white/50 rounded-3xl shadow-xl">
            <h2 className="text-3xl font-bold text-slate-800 mb-6 flex items-center gap-3">
            <ShoppingCart className="w-8 h-8 text-emerald-600" />
            Start Shopping
            </h2>
            <form onSubmit={handleStartTrip} className="space-y-6">
            <div>
                <label className="block text-sm font-bold text-slate-600 mb-2 ml-1">Store Name</label>
                <input
                required
                type="text"
                value={storeName}
                onChange={(e) => setStoreName(e.target.value)}
                className="w-full px-5 py-4 bg-white/50 backdrop-blur-md border border-white/40 rounded-2xl focus:ring-4 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none transition shadow-inner text-slate-800 font-medium placeholder:text-slate-400"
                placeholder="e.g. Whole Foods"
                />
            </div>
            <div>
                <label className="block text-sm font-bold text-slate-600 mb-2 ml-1">Budget</label>
                <input
                required
                type="number"
                min="1"
                step="0.01"
                value={budget}
                onChange={(e) => setBudget(e.target.value)}
                className="w-full px-5 py-4 bg-white/50 backdrop-blur-md border border-white/40 rounded-2xl focus:ring-4 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none transition shadow-inner text-slate-800 font-medium placeholder:text-slate-400"
                placeholder="0.00"
                />
            </div>
            <div className="flex gap-4 pt-4">
                <button
                type="button"
                onClick={onCancel}
                className="flex-1 py-4 text-slate-600 font-bold rounded-2xl hover:bg-white/40 transition"
                >
                Cancel
                </button>
                <button
                type="submit"
                className="flex-1 py-4 bg-emerald-500/90 hover:bg-emerald-500 backdrop-blur-md text-white font-bold rounded-2xl shadow-lg hover:shadow-emerald-500/40 transition-all transform hover:-translate-y-0.5"
                >
                Let's Go
                </button>
            </div>
            </form>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full relative">
      {/* Header Stats (Glass) */}
      <div className="bg-white/30 backdrop-blur-xl border-b border-white/20 p-6 z-20 sticky top-0 shadow-sm">
        <div className="flex justify-between items-baseline mb-3">
          <h2 className="text-2xl font-black text-slate-800 truncate max-w-[50%] tracking-tight">{storeName}</h2>
          <div className={`text-xl font-mono font-bold drop-shadow-sm ${remaining < 0 ? 'text-red-600 animate-pulse' : 'text-emerald-700'}`}>
            {remaining < 0 ? '-' : ''}${Math.abs(remaining).toFixed(2)} left
          </div>
        </div>
        <ProgressBar current={totalSpent} max={numericBudget} />
        <div className="flex justify-between text-xs font-semibold text-slate-500 mt-2 px-1">
            <span>Spent: ${totalSpent.toFixed(2)}</span>
            <span>Budget: ${numericBudget.toFixed(2)}</span>
        </div>
      </div>

      {/* List Area */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3 pb-32">
        {items.length === 0 && (
            <div className="text-center text-slate-400 mt-20">
                <div className="bg-white/20 w-24 h-24 rounded-full flex items-center justify-center mx-auto mb-4 backdrop-blur-md border border-white/30">
                    <ShoppingCart className="w-10 h-10 opacity-50" />
                </div>
                <p className="font-medium text-lg">Cart is empty.</p>
                <p className="text-sm opacity-70">Add items below.</p>
            </div>
        )}
        {items.map((item) => (
          <div key={item.id} className="group bg-white/40 backdrop-blur-md p-3 rounded-2xl border border-white/50 flex justify-between items-center animate-in fade-in slide-in-from-bottom-4 duration-500 hover:bg-white/60 transition-all shadow-[0_4px_16px_0_rgba(31,38,135,0.05)]">
            <div className="flex items-center gap-3 overflow-hidden">
               {/* Image Thumbnail */}
               <div className="w-14 h-14 rounded-xl bg-white/60 flex items-center justify-center overflow-hidden flex-shrink-0 border border-white/60 shadow-inner">
                  {item.imageUrl ? (
                    <img src={item.imageUrl} alt={item.name} className="w-full h-full object-cover mix-blend-multiply" />
                  ) : (
                     item.category === 'Loading...' ? 
                     <Loader2 className="w-5 h-5 text-emerald-500 animate-spin" /> :
                     <ImageIcon className="w-5 h-5 text-slate-400" />
                  )}
               </div>
               
               <div className="min-w-0">
                 <div className="font-bold text-slate-800 text-lg truncate leading-tight">{item.name}</div>
                 <div className="text-xs font-medium text-slate-500 flex items-center gap-1 mt-0.5">
                   {item.category === 'Loading...' ? <span className="animate-pulse text-emerald-600">Categorizing...</span> : 
                    <span className="bg-white/50 px-2 py-0.5 rounded-md border border-white/40">{item.category}</span>
                   }
                 </div>
               </div>
            </div>
            
            <div className="flex items-center gap-2 flex-shrink-0">
              <button 
                  onClick={() => setChatItem({ item })}
                  className="p-2 text-slate-400 hover:text-emerald-600 hover:bg-emerald-100/50 rounded-full transition-colors"
              >
                  <MessageCircle className="w-5 h-5" />
              </button>
              <span className="font-mono font-bold text-slate-700 text-lg mr-1">${item.price.toFixed(2)}</span>
              <button 
                onClick={() => removeItem(item.id)}
                className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-full transition-all"
              >
                <Trash2 className="w-5 h-5" />
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Input Area (Floating Glass Bar) */}
      <div className="absolute bottom-0 left-0 right-0 p-4 z-30 bg-gradient-to-t from-indigo-100/90 via-indigo-100/50 to-transparent pb-safe">
        <div className="bg-white/70 backdrop-blur-2xl border border-white/60 p-2 rounded-[2rem] shadow-[0_8px_32px_0_rgba(31,38,135,0.15)] ring-1 ring-white/50">
            <form onSubmit={addItem} className="flex gap-2 mb-2">
                <div className="flex-grow flex gap-2">
                    <input
                        ref={nameInputRef}
                        type="text"
                        placeholder="Item"
                        value={itemName}
                        onChange={(e) => setItemName(e.target.value)}
                        className="w-[60%] px-4 py-3 bg-white/50 border-0 rounded-2xl focus:ring-2 focus:ring-emerald-500 outline-none text-slate-800 placeholder:text-slate-400 font-medium"
                    />
                    <input
                        ref={priceInputRef}
                        type="number"
                        step="0.01"
                        placeholder="$$"
                        value={itemPrice}
                        onChange={(e) => setItemPrice(e.target.value)}
                        className="w-[40%] px-4 py-3 bg-white/50 border-0 rounded-2xl focus:ring-2 focus:ring-emerald-500 outline-none text-slate-800 placeholder:text-slate-400 font-medium"
                    />
                </div>
                <button 
                    type="submit"
                    disabled={!itemName || !itemPrice}
                    className="aspect-square h-full bg-emerald-500 text-white rounded-2xl hover:bg-emerald-600 disabled:opacity-50 disabled:cursor-not-allowed transition shadow-lg flex items-center justify-center"
                >
                    <Plus className="w-6 h-6" />
                </button>
            </form>
            <button
                onClick={finishTrip}
                disabled={isSaving}
                className="w-full py-3 bg-slate-800 text-white font-bold rounded-xl hover:bg-slate-900 flex justify-center items-center gap-2 transition disabled:opacity-70 disabled:cursor-wait shadow-lg"
            >
                {isSaving ? <Loader2 className="w-5 h-5 animate-spin" /> : <Save className="w-5 h-5" />}
                {isSaving ? 'Saving...' : 'Finish Trip'}
            </button>
        </div>
      </div>

      {/* Chat Modal */}
      {chatItem && (
        <ProductChat 
            item={chatItem.item} 
            storeName={storeName}
            context="cart" 
            onClose={() => setChatItem(null)} 
        />
      )}
    </div>
  );
};