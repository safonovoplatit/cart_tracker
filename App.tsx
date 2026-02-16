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
          <div className="flex flex-col items-center justify-center h-[80vh] p-6 text-center space-y-8 animate-in fade-in duration-500">
            <div className="bg-emerald-100 p-6 rounded-full mb-4">
               <img src="https://picsum.photos/seed/listoklogo/100/100" alt="Listok Logo" className="w-24 h-24 rounded-full shadow-lg grayscale-0" />
            </div>
            <div>
                <h1 className="text-4xl font-black text-gray-900 mb-2 tracking-tight">Listok</h1>
                <p className="text-gray-500 max-w-xs mx-auto">Smart grocery budget tracker. Analyze prices, stay on budget.</p>
            </div>
            
            <button
              onClick={() => setView('active-trip')}
              className="w-full max-w-xs bg-emerald-600 text-white p-4 rounded-xl shadow-lg hover:bg-emerald-700 hover:shadow-xl transition-all transform hover:-translate-y-1 flex items-center justify-center gap-3 text-lg font-bold"
            >
              <PlusCircle className="w-6 h-6" />
              Start New Trip
            </button>
          </div>
        );
    }
  };

  return (
    <div className="bg-gray-50 min-h-screen font-sans text-gray-900 flex flex-col">
      {/* Main Content */}
      <main className="flex-1 w-full max-w-xl mx-auto bg-white shadow-2xl min-h-screen md:min-h-0 md:h-screen md:overflow-hidden flex flex-col relative">
        {renderContent()}
        
        {/* Bottom Navigation (Hidden during active trip for focus) */}
        {view !== 'active-trip' && (
            <nav className="sticky bottom-0 bg-white border-t border-gray-200 px-6 py-3 flex justify-around items-center z-50 pb-safe">
                <button 
                    onClick={() => setView('home')}
                    className={`flex flex-col items-center gap-1 transition-colors ${view === 'home' ? 'text-emerald-600' : 'text-gray-400 hover:text-gray-600'}`}
                >
                    <Home className="w-6 h-6" strokeWidth={view === 'home' ? 2.5 : 2} />
                    <span className="text-[10px] font-medium">Home</span>
                </button>
                <button 
                    onClick={() => setView('history')}
                    className={`flex flex-col items-center gap-1 transition-colors ${view === 'history' ? 'text-emerald-600' : 'text-gray-400 hover:text-gray-600'}`}
                >
                    <HistoryIcon className="w-6 h-6" strokeWidth={view === 'history' ? 2.5 : 2} />
                    <span className="text-[10px] font-medium">History</span>
                </button>
                <button 
                    onClick={() => setView('analytics')}
                    className={`flex flex-col items-center gap-1 transition-colors ${view === 'analytics' ? 'text-emerald-600' : 'text-gray-400 hover:text-gray-600'}`}
                >
                    <PieChart className="w-6 h-6" strokeWidth={view === 'analytics' ? 2.5 : 2} />
                    <span className="text-[10px] font-medium">Analytics</span>
                </button>
            </nav>
        )}
      </main>
    </div>
  );
};

export default App;
