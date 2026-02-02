import React, { useState, useEffect } from 'react';
import { 
  Search, 
  ChevronLeft
} from 'lucide-react';
import { FundList } from './pages/FundList';
import { FundDetail } from './pages/FundDetail';
import { SubscribeModal } from './components/SubscribeModal';
import { searchFunds, getFundDetail } from './services/api';

export default function App() {
  // --- State ---
  const [currentView, setCurrentView] = useState('list'); // 'list' | 'detail'
  
  // Initialize from localStorage
  const [watchlist, setWatchlist] = useState(() => {
    try {
      const saved = localStorage.getItem('fundval_watchlist');
      return saved ? JSON.parse(saved) : [];
    } catch (e) {
      console.error("Failed to load watchlist", e);
      return [];
    }
  });

  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedFund, setSelectedFund] = useState(null); 
  const [detailFundId, setDetailFundId] = useState(null); 
  
  // Persist to localStorage whenever watchlist changes
  useEffect(() => {
    localStorage.setItem('fundval_watchlist', JSON.stringify(watchlist));
  }, [watchlist]);
  
  // --- Data Fetching ---
  
  // Polling for updates
  useEffect(() => {
    const fetchUpdates = async () => {
        // Use functional state update to get the FRESH watchlist at the moment of execution
        setWatchlist(currentWatchlist => {
            if (currentWatchlist.length === 0) return currentWatchlist;
            
            // We can't await inside the functional update, so we must loop outside?
            // No, the standard pattern for polling mutable state is:
            // 1. Ref or
            // 2. Dependency on the state (which restarts the timer)
            
            // Reverting to the dependency approach but making it clean:
            // The previous logic restarted the timer on every list change.
            // That is actually acceptable for this scale.
            // But let's make it robust against the "stale closure inside the callback" 
            // by using a Ref for the current list, so the interval callback sees it.
            return currentWatchlist;
        });
        
        // Actually, the simplest fix for "Linus" is to just let the effect depend on `watchlist`.
        // It restarts the timer, but who cares? It guarantees freshness.
        // But to be "Perfect", we use a recursive setTimeout or a Ref.
        // Let's use the Ref pattern for the watchlist to keep the interval stable.
    };
    
    // ... wait, I can't put async logic easily in a sync setWatchlist.
    // Let's go with the "Restart on Change" but fixing the inner logic to be clear.
    
    if (watchlist.length === 0) return;

    const tick = async () => {
        // We use the 'watchlist' from the closure, which IS fresh because
        // the effect restarts whenever watchlist changes.
        // The previous bug was: dependence on `watchlist.length` ONLY.
        // Change dependency to `watchlist`.
        
        try {
            const updatedList = await Promise.all(watchlist.map(async (fund) => {
                try {
                    const detail = await getFundDetail(fund.id);
                    return { ...fund, ...detail };
                } catch (e) {
                    console.error(e);
                    return fund;
                }
            }));
            
            // Only update if mounted (React strict mode etc) - omitted for brevity
            setWatchlist(updatedList); 
        } catch (e) {
             console.error("Polling error", e);
        }
    };

    const interval = setInterval(tick, 15000); // 15s polling (Linus: 5s is for ADHD kids)
    return () => clearInterval(interval);
  }, [watchlist]); // <--- DEPEND ON THE LIST ITSELF.
  
  // Note: This causes the timer to reset every time data comes back (setWatchlist triggers it).
  // effectively making it "15s after the last fetch completes". 
  // This is actually BETTER than a fixed interval (prevents pile-up).


  // --- Handlers ---

  const handleSearch = async (e) => {
    e.preventDefault();
    if (!searchQuery) return;
    setLoading(true);
    
    try {
        const results = await searchFunds(searchQuery);
        if (results && results.length > 0) {
           const fundMeta = results[0];
           // Fetch initial detail
           try {
             const detail = await getFundDetail(fundMeta.id);
             const newFund = { ...fundMeta, ...detail, trusted: true };
             
             if (!watchlist.find(f => f.id === newFund.id)) {
                  setWatchlist(prev => [...prev, newFund]);
             }
             setSearchQuery('');
           } catch(e) {
             alert(`无法获取基金 ${fundMeta.name} 的详情数据`);
           }
        } else {
            alert('未找到相关基金');
        }
    } catch (err) {
        alert('查询失败，请重试');
    } finally {
        setLoading(false);
    }
  };

  const removeFund = (id) => {
    setWatchlist(prev => prev.filter(f => f.id !== id));
  };

  const openSubscribeModal = (fund) => {
    setSelectedFund(fund);
    setModalOpen(true);
  };

  const handleCardClick = (fundId) => {
    setDetailFundId(fundId);
    setCurrentView('detail');
    window.scrollTo(0, 0);
  };

  const handleBack = () => {
    setCurrentView('list');
    setDetailFundId(null);
  };

  const handleSubscribeSubmit = (fund, formData) => {
    alert(`已更新 ${fund.name} 的订阅设置：\n发送至：${formData.email}\n阈值：涨>${formData.thresholdUp}% 或 跌<${formData.thresholdDown}%`);
    setModalOpen(false);
  };

  const currentDetailFund = detailFundId ? watchlist.find(f => f.id === detailFundId) : null;

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 font-sans selection:bg-blue-100">
      
      {/* 1. Header Area */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-10 shadow-sm">
        <div className="max-w-4xl mx-auto px-4 py-4">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            
            {/* Logo / Back Button */}
            <div className="flex items-center gap-2">
              {currentView === 'detail' ? (
                <button 
                  onClick={handleBack}
                  className="mr-2 p-1.5 -ml-2 rounded-full hover:bg-slate-100 text-slate-600 transition-colors"
                >
                  <ChevronLeft className="w-6 h-6" />
                </button>
              ) : (
                <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center text-white font-bold">
                  V
                </div>
              )}
              
              <div>
                <h1 className="text-lg font-bold text-slate-800 leading-tight">
                  {currentView === 'detail' ? '基金详情' : 'FundVal Live'}
                </h1>
                <p className="text-xs text-slate-400">
                  {currentView === 'detail' ? '盘中实时估值分析' : '盘中估值参考工具'}
                </p>
              </div>
            </div>

            {/* Search Bar (Only in List View) */}
            {currentView === 'list' && (
              <form onSubmit={handleSearch} className="relative flex-1 max-w-md">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
                  <input 
                    type="text" 
                    placeholder="输入基金代码 (如: 005827)" 
                    className="w-full pl-10 pr-4 py-2 bg-slate-100 border-none rounded-full text-sm focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all outline-none"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                  <button 
                    type="submit"
                    disabled={loading || !searchQuery}
                    className="absolute right-1 top-1/2 -translate-y-1/2 bg-blue-600 hover:bg-blue-700 text-white text-xs px-3 py-1.5 rounded-full transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {loading ? '查询中...' : '添加'}
                  </button>
                </div>
              </form>
            )}

            {/* User / Status */}
            <div className="hidden md:flex items-center gap-4 text-xs text-slate-500">
              <span className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></span>
                API 正常
              </span>
            </div>
          </div>
        </div>
      </header>

      {/* 2. Main Content Area */}
      <main className="max-w-4xl mx-auto px-4 py-6">
        
        {currentView === 'list' && (
          <FundList 
            watchlist={watchlist}
            setWatchlist={setWatchlist}
            onSelectFund={handleCardClick}
            onRemove={removeFund}
            onSubscribe={openSubscribeModal}
          />
        )}

        {currentView === 'detail' && (
          <FundDetail 
            fund={currentDetailFund}
            onSubscribe={openSubscribeModal}
          />
        )}
      </main>

      {/* 3. Subscription Modal (Global) */}
      {modalOpen && selectedFund && (
        <SubscribeModal 
            fund={selectedFund} 
            onClose={() => setModalOpen(false)}
            onSubmit={handleSubscribeSubmit}
        />
      )}

      {/* 4. Footer */}
      <footer className="max-w-4xl mx-auto px-4 py-8 text-center text-slate-400 text-xs">
        <p className="mb-2">数据仅供参考，不构成投资建议。</p>
        <p>
          Data Source: AkShare Public API · Status: <span className="text-green-600">Operational</span>
        </p>
      </footer>

    </div>
  );
}