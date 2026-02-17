import React, { useState, useEffect, useRef } from 'react';
import { ShoppingItem } from '../types';
import { createProductChat } from '../services/geminiService';
import { Chat, GenerateContentResponse } from "@google/genai";
import { X, Send, Loader2, Sparkles } from 'lucide-react';

interface ProductChatProps {
  item: ShoppingItem;
  storeName: string;
  onClose: () => void;
  context?: 'cart' | 'history';
}

interface Message {
  role: 'user' | 'model';
  text: string;
}

export const ProductChat: React.FC<ProductChatProps> = ({ item, storeName, onClose, context = 'history' }) => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const chatRef = useRef<Chat | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Initialize chat session
    // context is cast to 'cart' | 'history' to resolve TypeScript error where it might be inferred as string
    chatRef.current = createProductChat(item, storeName, context as 'cart' | 'history');
    
    // Initial greeting from the product
    const sendGreeting = async () => {
      setIsLoading(true);
      try {
        if (!chatRef.current) return;
        const response: GenerateContentResponse = await chatRef.current.sendMessage({ 
            message: "Introduce yourself to me in one short, funny sentence." 
        });
        if (response.text) {
            setMessages([{ role: 'model', text: response.text }]);
        }
      } catch (e) {
        console.error("Failed to start chat", e);
        setMessages([{ role: 'model', text: "Hello! I'm " + item.name + ", but I'm feeling a bit shy right now." }]);
      } finally {
        setIsLoading(false);
      }
    };
    
    sendGreeting();
  }, [item, storeName, context]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isLoading]);

  const handleSend = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!inputValue.trim() || !chatRef.current) return;

    const userMsg = inputValue.trim();
    setMessages(prev => [...prev, { role: 'user', text: userMsg }]);
    setInputValue('');
    setIsLoading(true);

    try {
      const response: GenerateContentResponse = await chatRef.current.sendMessage({ message: userMsg });
      if (response.text) {
        setMessages(prev => [...prev, { role: 'model', text: response.text }]);
      }
    } catch (error) {
      console.error("Chat error", error);
      setMessages(prev => [...prev, { role: 'model', text: "Sorry, I lost my train of thought!" }]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/30 backdrop-blur-sm animate-in fade-in duration-300">
      <div className="bg-white/80 backdrop-blur-2xl w-full max-w-sm h-[550px] rounded-[2rem] shadow-[0_20px_50px_rgba(8,_112,_184,_0.3)] border border-white/60 flex flex-col overflow-hidden relative ring-1 ring-white/40">
        
        {/* Header */}
        <div className="bg-emerald-500/10 backdrop-blur-sm p-4 flex justify-between items-center border-b border-emerald-500/20">
          <div className="flex items-center gap-3">
             <div className="w-12 h-12 rounded-full bg-white/50 flex items-center justify-center border border-white/60 overflow-hidden shadow-inner">
                {item.imageUrl ? (
                    <img src={item.imageUrl} alt={item.name} className="w-full h-full object-cover mix-blend-multiply" />
                ) : (
                    <Sparkles className="w-6 h-6 text-emerald-500" />
                )}
             </div>
             <div>
                 <h3 className="font-black text-slate-800 text-lg leading-none">{item.name}</h3>
                 <p className="text-xs font-semibold text-emerald-600 mt-1 uppercase tracking-wide">Chatting</p>
             </div>
          </div>
          <button onClick={onClose} className="p-2 bg-white/50 hover:bg-white rounded-full transition shadow-sm text-slate-500">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-transparent scroll-smooth">
          {messages.map((msg, idx) => (
            <div
              key={idx}
              className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              <div
                className={`max-w-[85%] px-5 py-3 rounded-2xl text-sm font-medium shadow-sm ${
                  msg.role === 'user'
                    ? 'bg-emerald-500 text-white rounded-br-none shadow-emerald-500/30'
                    : 'bg-white/70 text-slate-800 border border-white/50 rounded-bl-none'
                }`}
              >
                {msg.text}
              </div>
            </div>
          ))}
          {isLoading && (
            <div className="flex justify-start">
               <div className="bg-white/50 px-4 py-3 rounded-2xl rounded-bl-none border border-white/50 shadow-sm">
                 <Loader2 className="w-4 h-4 text-emerald-600 animate-spin" />
               </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Input */}
        <div className="p-4 bg-white/40 border-t border-white/50 backdrop-blur-xl">
          <form onSubmit={handleSend} className="flex gap-2">
            <input
              autoFocus
              type="text"
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              placeholder="Say something..."
              className="flex-1 bg-white/70 text-slate-800 rounded-2xl px-5 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/50 transition border border-white/60 font-medium placeholder:text-slate-400"
            />
            <button
              type="submit"
              disabled={!inputValue.trim() || isLoading}
              className="p-3 bg-emerald-500 text-white rounded-2xl hover:bg-emerald-600 disabled:opacity-50 disabled:hover:bg-emerald-500 transition shadow-lg shadow-emerald-500/30"
            >
              <Send className="w-5 h-5" />
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};