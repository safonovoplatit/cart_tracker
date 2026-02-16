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
    chatRef.current = createProductChat(item, storeName, context);
    
    // Initial greeting from the product
    const sendGreeting = async () => {
      setIsLoading(true);
      try {
        const response: GenerateContentResponse = await chatRef.current!.sendMessage({ 
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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white w-full max-w-sm h-[500px] rounded-2xl shadow-2xl flex flex-col overflow-hidden relative">
        {/* Header */}
        <div className="bg-emerald-600 p-4 flex justify-between items-center text-white">
          <div className="flex items-center gap-3">
             <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center border border-white/30 overflow-hidden">
                {item.imageUrl ? (
                    <img src={item.imageUrl} alt={item.name} className="w-full h-full object-cover" />
                ) : (
                    <Sparkles className="w-5 h-5 text-white" />
                )}
             </div>
             <div>
                 <h3 className="font-bold text-lg leading-tight">{item.name}</h3>
                 <p className="text-xs text-emerald-100 opacity-90">Chatting with {item.name}</p>
             </div>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-white/20 rounded-full transition">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50">
          {messages.map((msg, idx) => (
            <div
              key={idx}
              className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              <div
                className={`max-w-[80%] px-4 py-2 rounded-2xl text-sm ${
                  msg.role === 'user'
                    ? 'bg-emerald-600 text-white rounded-br-none'
                    : 'bg-white text-gray-800 border border-gray-200 shadow-sm rounded-bl-none'
                }`}
              >
                {msg.text}
              </div>
            </div>
          ))}
          {isLoading && (
            <div className="flex justify-start">
               <div className="bg-white px-4 py-3 rounded-2xl rounded-bl-none border border-gray-200 shadow-sm">
                 <Loader2 className="w-4 h-4 text-emerald-500 animate-spin" />
               </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Input */}
        <div className="p-3 bg-white border-t border-gray-100">
          <form onSubmit={handleSend} className="flex gap-2">
            <input
              autoFocus
              type="text"
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              placeholder={`Ask ${item.name} something...`}
              className="flex-1 bg-gray-100 text-gray-800 rounded-full px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 transition"
            />
            <button
              type="submit"
              disabled={!inputValue.trim() || isLoading}
              className="p-2 bg-emerald-600 text-white rounded-full hover:bg-emerald-700 disabled:opacity-50 disabled:hover:bg-emerald-600 transition shadow-sm"
            >
              <Send className="w-4 h-4" />
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};