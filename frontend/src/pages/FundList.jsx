import React, { useState } from 'react';
import { Search, Activity } from 'lucide-react';
import { FundCard } from '../components/FundCard';
import { searchFunds, getFundDetail } from '../services/api';

export const FundList = ({ watchlist, setWatchlist, onSelectFund, onSubscribe, onRemove }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [searchResults, setSearchResults] = useState([]);

  const handleSearch = async (e) => {
    e.preventDefault();
    if (!searchQuery) return;
    setLoading(true);
    setSearchResults([]);
    
    try {
        const results = await searchFunds(searchQuery);
        // Only take top 5 to keep UI clean or show in a dropdown
        // For this UI, let's just add the first one directly for simplicity as per original mock flow,
        // OR better: show a result list. 
        // Following original 'add' flow:
        if (results && results.length > 0) {
           const fundMeta = results[0];
           // Fetch initial detail to get nav/est
           const detail = await getFundDetail(fundMeta.id);
           // Merge meta + detail
           const newFund = { ...fundMeta, ...detail, trusted: true };
           
           // Avoid duplicates
           if (!watchlist.find(f => f.id === newFund.id)) {
                setWatchlist(prev => [...prev, newFund]);
           }
           setSearchQuery('');
        } else {
            alert('未找到相关基金');
        }
    } catch (err) {
        alert('查询失败，请重试');
    } finally {
        setLoading(false);
    }
  };

  return (
    <>
      <div className="md:hidden flex justify-between items-center mb-4 text-xs text-slate-500 px-1">
        <span>我的关注 ({watchlist.length})</span>
        <span className="flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full bg-green-500"></span>
          实时更新中
        </span>
      </div>

      {/* Search Bar - Mobile/Inline placement if needed, but header has one. 
          The header search logic is currently passed down or handled in App. 
          Let's assume this component renders the MAIN content area. 
          The Header search input should ideally lift state up to App or be here.
          For now, we'll keep the input in Header (App.jsx) and this page just displays the list.
          Wait, looking at original design, search was in Header. 
          We'll need to coordinate that.
       */}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {watchlist.map((fund) => (
          <FundCard 
            key={fund.id} 
            fund={fund} 
            onClick={onSelectFund}
            onRemove={onRemove}
            onSubscribe={onSubscribe}
          />
        ))}

        {watchlist.length === 0 && (
          <div className="col-span-1 md:col-span-2 py-12 text-center text-slate-400 border-2 border-dashed border-slate-200 rounded-xl">
            <Activity className="w-12 h-12 mx-auto mb-3 opacity-50" />
            <p>暂无关注基金，请在上方搜索添加代码</p>
          </div>
        )}
      </div>
    </>
  );
};
