import React, { useState } from 'react';
import { ActiveTrip } from './components/ActiveTrip';
import { History } from './components/History';
import { Analytics } from './components/Analytics';
import { AppView } from './types';
import { Home, History as HistoryIcon, PieChart, PlusCircle } from 'lucide-react';

const App: React.FC = () => {
  const [view, setView] = useState<AppView>('home');

  const renderContent = () => {
    switch (view) {
      case 'active-trip':
        return <ActiveTrip onFinish={() => setView('history')} onCancel={() => setView('home')} />;
      case 'history':
        return <History />;
      case 'analytics':
        return <Analytics />;
      case 'home':
      default:
        return (
          <div className="flex flex-col items-center justify-center h-full p-6 text-center space-y-8 animate-in fade-in duration-500 z-10 relative">
            <div className="bg-white/30 backdrop-blur-xl p-8 rounded-full mb-4 shadow-[0_8px_32px_0_rgba(31,38,135,0.1)] border border-white/50 ring-4 ring-white/20">
               <img src="https://picsum.photos/seed/carttrackerlogo/100/100" alt="CartTracker Logo" className="w-24 h-24 rounded-full shadow-lg grayscale-0" />
            </div>
            <div>
                <h1 className="text-5xl font-black text-slate-800 mb-2 tracking-tight drop-shadow-sm">CartTracker</h1>
                <p className="text-slate-600 font-medium max-w-xs mx-auto text-lg">Your liquid smooth shopping companion.</p>
            </div>
            
            <button
              onClick={() => setView('active-trip')}
              className="group relative w-full max-w-xs overflow-hidden rounded-2xl bg-emerald-500 p-4 text-white shadow-[0_8px_32px_0_rgba(16,185,129,0.3)] transition-all hover:scale-105 hover:shadow-[0_8px_32px_0_rgba(16,185,129,0.5)] active:scale-95"
            >
              <div className="absolute inset-0 w-full h-full bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover:animate-[shimmer_1.5s_infinite]"></div>
              <span className="relative flex items-center justify-center gap-3 text-lg font-bold">
                 <PlusCircle className="w-6 h-6" />
                 Start New Trip
              </span>
            </button>
          </div>
        );
    }
  };

  return (
    <div className="relative h-screen w-screen overflow-hidden font-sans text-slate-800 flex justify-center bg-[#e0e7ff]">
      
      {/* Liquid Background Blobs */}
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden z-0">
         <div className="absolute top-0 -left-4 w-72 h-72 bg-purple-300 rounded-full mix-blend-multiply filter blur-xl opacity-70 animate-blob"></div>
         <div className="absolute top-0 -right-4 w-72 h-72 bg-yellow-300 rounded-full mix-blend-multiply filter blur-xl opacity-70 animate-blob animation-delay-2000"></div>
         <div className="absolute -bottom-8 left-20 w-72 h-72 bg-pink-300 rounded-full mix-blend-multiply filter blur-xl opacity-70 animate-blob animation-delay-4000"></div>
         <div className="absolute top-1/2 left-1/2 w-96 h-96 bg-emerald-200 rounded-full mix-blend-multiply filter blur-3xl opacity-50 animate-blob"></div>
      </div>

      {/* App Shell (Glass Pane) */}
      <main className="w-full max-w-xl h-full flex flex-col relative z-10 bg-white/10 backdrop-blur-lg border-x border-white/20 shadow-2xl">
        
        {/* Content Area - Scrolls independently */}
        <div className="flex-1 overflow-y-auto no-scrollbar relative w-full scroll-smooth">
            {renderContent()}
        </div>
        
        {/* Bottom Navigation (Floating Glass) */}
        {view !== 'active-trip' && (
            <div className="flex-none p-4 pb-safe pointer-events-none">
                <nav className="pointer-events-auto mx-auto max-w-sm bg-white/40 backdrop-blur-xl border border-white/40 rounded-3xl px-6 py-3 flex justify-around items-center shadow-lg">
                    <button 
                        onClick={() => setView('home')}
                        className={`flex flex-col items-center gap-1 transition-all duration-300 ${view === 'home' ? 'text-emerald-600 scale-110' : 'text-slate-500 hover:text-slate-700'}`}
                    >
                        <Home className="w-6 h-6" strokeWidth={view === 'home' ? 2.5 : 2} />
                    </button>
                    <button 
                        onClick={() => setView('history')}
                        className={`flex flex-col items-center gap-1 transition-all duration-300 ${view === 'history' ? 'text-emerald-600 scale-110' : 'text-slate-500 hover:text-slate-700'}`}
                    >
                        <HistoryIcon className="w-6 h-6" strokeWidth={view === 'history' ? 2.5 : 2} />
                    </button>
                    <button 
                        onClick={() => setView('analytics')}
                        className={`flex flex-col items-center gap-1 transition-all duration-300 ${view === 'analytics' ? 'text-emerald-600 scale-110' : 'text-slate-500 hover:text-slate-700'}`}
                    >
                        <PieChart className="w-6 h-6" strokeWidth={view === 'analytics' ? 2.5 : 2} />
                    </button>
                </nav>
            </div>
        )}
      </main>
    </div>
  );
};

export default App;