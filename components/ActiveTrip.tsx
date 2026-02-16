import React, { useState, useEffect, useRef } from 'react';
import { ShoppingTrip, ShoppingItem } from '../types';
import { categorizeItem, generateItemImage } from '../services/geminiService';
import { saveTrip } from '../services/storageService';
import { ProgressBar } from './ui/ProgressBar';
import { Plus, Trash2, Save, ShoppingCart, Loader2, Image as ImageIcon } from 'lucide-react';

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

  const finishTrip = () => {
    if (items.length === 0) {
        onCancel();
        return;
    }
    const trip: ShoppingTrip = {
      id: crypto.randomUUID(),
      storeName,
      date: Date.now(),
      budget: numericBudget,
      items,
      totalSpent
    };
    saveTrip(trip);
    onFinish();
  };

  if (isSetupMode) {
    return (
      <div className="max-w-md mx-auto p-6 bg-white rounded-2xl shadow-xl mt-10">
        <h2 className="text-2xl font-bold text-gray-800 mb-6 flex items-center gap-2">
          <ShoppingCart className="w-6 h-6 text-emerald-600" />
          Start Shopping
        </h2>
        <form onSubmit={handleStartTrip} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Store Name</label>
            <input
              required
              type="text"
              value={storeName}
              onChange={(e) => setStoreName(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none transition"
              placeholder="e.g. Whole Foods"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Budget</label>
            <input
              required
              type="number"
              min="1"
              step="0.01"
              value={budget}
              onChange={(e) => setBudget(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none transition"
              placeholder="0.00"
            />
          </div>
          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={onCancel}
              className="flex-1 py-3 text-gray-600 font-semibold rounded-lg hover:bg-gray-100 transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="flex-1 py-3 bg-emerald-600 text-white font-bold rounded-lg hover:bg-emerald-700 shadow-lg transition"
            >
              Start Trip
            </button>
          </div>
        </form>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      {/* Header Stats */}
      <div className="bg-white p-4 shadow-sm z-10 sticky top-0">
        <div className="flex justify-between items-baseline mb-2">
          <h2 className="font-bold text-gray-800 truncate max-w-[50%]">{storeName}</h2>
          <div className={`text-xl font-mono font-bold ${remaining < 0 ? 'text-red-500 animate-pulse' : 'text-emerald-600'}`}>
            {remaining < 0 ? '-' : ''}${Math.abs(remaining).toFixed(2)} left
          </div>
        </div>
        <ProgressBar current={totalSpent} max={numericBudget} />
        <div className="flex justify-between text-xs text-gray-500 mt-1">
            <span>Spent: ${totalSpent.toFixed(2)}</span>
            <span>Budget: ${numericBudget.toFixed(2)}</span>
        </div>
      </div>

      {/* List Area */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3 pb-8">
        {items.length === 0 && (
            <div className="text-center text-gray-400 mt-10">
                <ShoppingCart className="w-12 h-12 mx-auto mb-2 opacity-50" />
                <p>Cart is empty. Add items below.</p>
            </div>
        )}
        {items.map((item) => (
          <div key={item.id} className="bg-white p-3 rounded-lg shadow-sm border border-gray-100 flex justify-between items-center animate-in fade-in slide-in-from-bottom-2 duration-300">
            <div className="flex items-center gap-3 overflow-hidden">
               {/* Image Thumbnail */}
               <div className="w-12 h-12 rounded-md bg-gray-50 flex items-center justify-center overflow-hidden flex-shrink-0 border border-gray-100">
                  {item.imageUrl ? (
                    <img src={item.imageUrl} alt={item.name} className="w-full h-full object-cover" />
                  ) : (
                     item.category === 'Loading...' ? 
                     <Loader2 className="w-5 h-5 text-emerald-500 animate-spin" /> :
                     <ImageIcon className="w-5 h-5 text-gray-300" />
                  )}
               </div>
               
               <div className="min-w-0">
                 <div className="font-medium text-gray-800 truncate">{item.name}</div>
                 <div className="text-xs text-gray-500 flex items-center gap-1">
                   {item.category === 'Loading...' ? <span className="animate-pulse">Categorizing...</span> : item.category}
                 </div>
               </div>
            </div>
            
            <div className="flex items-center gap-4 flex-shrink-0">
              <span className="font-mono font-bold text-gray-700">${item.price.toFixed(2)}</span>
              <button 
                onClick={() => removeItem(item.id)}
                className="text-gray-400 hover:text-red-500 transition"
              >
                <Trash2 className="w-5 h-5" />
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Input Area (Sticky Bottom) */}
      <div className="bg-white border-t border-gray-200 p-4 sticky bottom-0 z-20 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.1)]">
        <form onSubmit={addItem} className="flex gap-2 mb-3">
            <div className="flex-grow flex gap-2">
                <input
                    ref={nameInputRef}
                    type="text"
                    placeholder="Item name"
                    value={itemName}
                    onChange={(e) => setItemName(e.target.value)}
                    className="w-2/3 px-3 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 outline-none"
                />
                <input
                    ref={priceInputRef}
                    type="number"
                    step="0.01"
                    placeholder="Price"
                    value={itemPrice}
                    onChange={(e) => setItemPrice(e.target.value)}
                    className="w-1/3 px-3 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 outline-none"
                />
            </div>
            <button 
                type="submit"
                disabled={!itemName || !itemPrice}
                className="bg-emerald-600 text-white p-3 rounded-lg hover:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed transition shadow-md"
            >
                <Plus className="w-6 h-6" />
            </button>
        </form>
        <button
            onClick={finishTrip}
            className="w-full py-3 bg-gray-900 text-white font-bold rounded-lg hover:bg-gray-800 flex justify-center items-center gap-2 transition"
        >
            <Save className="w-5 h-5" />
            Finish & Save Trip
        </button>
      </div>
    </div>
  );
};