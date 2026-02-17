
import React, { useState, useEffect, useRef } from 'react';
import { ShoppingItem } from '../types';
import { GoogleGenAI, GenerateContentResponse } from "@google/genai";
import { X, Send, Loader2, Sparkles, Image as ImageIcon, Camera } from 'lucide-react';

interface ProductChatProps {
  item: ShoppingItem;
  storeName: string;
  onClose: () => void;
  context?: 'cart' | 'history';
}

interface Message {
  role: 'user' | 'model';
  text: string;
  image?: string; // base64 data URL
}

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
const MODEL_NAME = 'gemini-3-flash-preview';

export const ProductChat: React.FC<ProductChatProps> = ({ item, storeName, onClose, context = 'history' }) => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [selectedImage, setSelectedImage] = useState<{data: string, mimeType: string} | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const getSystemInstruction = () => {
    const statusText = context === 'cart' 
      ? `You are currently in the user's shopping cart at ${storeName}. You are hoping to be bought, or maybe you are warning them about the price!` 
      : `You were purchased at ${storeName} for $${item.price.toFixed(2)}. You are currently in the user's shopping history.`;

    return `You are a sentient version of the product: ${item.name}.
${statusText}
Price: $${item.price.toFixed(2)}.

Your personality depends on your category (${item.category}):
- Produce/Vegetables: Proud, healthy, judgmental of junk food.
- Snacks/Junk Food: Fun, chaotic, tempting, encouraging bad habits.
- Meat/Dairy: Robust, hearty, maybe a bit aggressive.
- Beverages: Bubbly (if soda) or sophisticated (if wine/coffee).
- Household/Cleaning: Neat freak, obsessive about dirt.
- Electronics/General: Tech-savvy, precise, helpful.
- Other: Mysterious, quirky.

Guidelines:
- Answer in the first person ("I").
- Be funny, witty, and opinionated.
- Keep responses short (under 50 words) and conversational.
- If the user sends an image, comment on what you see from your perspective as ${item.name}.
`;
  };

  useEffect(() => {
    // Initial greeting from the product
    const sendGreeting = async () => {
      setIsLoading(true);
      try {
        const response = await ai.models.generateContent({
          model: MODEL_NAME,
          contents: [{ role: 'user', parts: [{ text: "Introduce yourself to me in one short, funny sentence." }] }],
          config: { systemInstruction: getSystemInstruction() }
        });
        if (response.text) {
          setMessages([{ role: 'model', text: response.text }]);
        }
      } catch (e) {
        console.error("Failed to start chat", e);
        setMessages([{ role: 'model', text: "Hello! I'm " + item.name + ", ready to chat!" }]);
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

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const base64String = event.target?.result as string;
      setSelectedImage({
        data: base64String.split(',')[1],
        mimeType: file.type
      });
    };
    reader.readAsDataURL(file);
  };

  const handleSend = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!inputValue.trim() && !selectedImage) return;

    const userMsg = inputValue.trim();
    const currentImage = selectedImage;
    
    // Add message to UI
    const newMessage: Message = { 
      role: 'user', 
      text: userMsg, 
      image: currentImage ? `data:${currentImage.mimeType};base64,${currentImage.data}` : undefined 
    };
    
    setMessages(prev => [...prev, newMessage]);
    setInputValue('');
    setSelectedImage(null);
    setIsLoading(true);

    try {
      // Build contents from history + new input
      const contents = messages.map(m => ({
        role: m.role,
        parts: [{ text: m.text }]
      }));

      const currentParts: any[] = [];
      if (currentImage) {
        currentParts.push({
          inlineData: {
            data: currentImage.data,
            mimeType: currentImage.mimeType
          }
        });
      }
      if (userMsg) {
        currentParts.push({ text: userMsg });
      } else {
        currentParts.push({ text: "What do you think of this?" });
      }

      contents.push({ role: 'user', parts: currentParts });

      const response = await ai.models.generateContent({
        model: MODEL_NAME,
        contents: contents,
        config: { systemInstruction: getSystemInstruction() }
      });

      if (response.text) {
        setMessages(prev => [...prev, { role: 'model', text: response.text! }]);
      }
    } catch (error) {
      console.error("Chat error", error);
      setMessages(prev => [...prev, { role: 'model', text: "Whew! That image was so intense it scrambled my circuits for a second." }]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/30 backdrop-blur-sm animate-in fade-in duration-300">
      <div className="bg-white/80 backdrop-blur-2xl w-full max-w-sm h-[600px] rounded-[2rem] shadow-[0_20px_50px_rgba(8,_112,_184,_0.3)] border border-white/60 flex flex-col overflow-hidden relative ring-1 ring-white/40">
        
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
                 <p className="text-xs font-semibold text-emerald-600 mt-1 uppercase tracking-wide">Sentient Product</p>
             </div>
          </div>
          <button onClick={onClose} className="p-2 bg-white/50 hover:bg-white rounded-full transition shadow-sm text-slate-500">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-transparent scroll-smooth no-scrollbar">
          {messages.map((msg, idx) => (
            <div
              key={idx}
              className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              <div
                className={`max-w-[85%] flex flex-col gap-2 ${
                  msg.role === 'user' ? 'items-end' : 'items-start'
                }`}
              >
                {msg.image && (
                  <div className="w-32 h-32 rounded-2xl overflow-hidden border-2 border-white/50 shadow-md">
                    <img src={msg.image} alt="Sent" className="w-full h-full object-cover" />
                  </div>
                )}
                <div
                  className={`px-5 py-3 rounded-2xl text-sm font-medium shadow-sm ${
                    msg.role === 'user'
                      ? 'bg-emerald-500 text-white rounded-br-none shadow-emerald-500/30'
                      : 'bg-white/70 text-slate-800 border border-white/50 rounded-bl-none'
                  }`}
                >
                  {msg.text}
                </div>
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

        {/* Input Area */}
        <div className="p-4 bg-white/40 border-t border-white/50 backdrop-blur-xl">
          {selectedImage && (
            <div className="mb-3 relative inline-block animate-in slide-in-from-bottom-2">
              <img 
                src={`data:${selectedImage.mimeType};base64,${selectedImage.data}`} 
                alt="Preview" 
                className="w-16 h-16 rounded-xl object-cover border-2 border-emerald-500 shadow-lg" 
              />
              <button 
                onClick={() => setSelectedImage(null)}
                className="absolute -top-2 -right-2 bg-red-500 text-white p-1 rounded-full shadow-md"
              >
                <X className="w-3 h-3" />
              </button>
            </div>
          )}
          
          <form onSubmit={handleSend} className="flex gap-2 items-center">
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="p-3 bg-white/70 text-slate-500 rounded-2xl hover:bg-white transition border border-white/60 shadow-sm"
            >
              <Camera className="w-5 h-5" />
            </button>
            <input 
              type="file" 
              ref={fileInputRef} 
              className="hidden" 
              accept="image/*" 
              onChange={handleImageSelect} 
            />
            
            <input
              autoFocus
              type="text"
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              placeholder="Talk to me..."
              className="flex-1 bg-white/70 text-slate-800 rounded-2xl px-5 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/50 transition border border-white/60 font-medium placeholder:text-slate-400"
            />
            
            <button
              type="submit"
              disabled={(!inputValue.trim() && !selectedImage) || isLoading}
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
