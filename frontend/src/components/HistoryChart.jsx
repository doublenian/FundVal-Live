import React, { useEffect, useState } from 'react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { getFundHistory } from '../services/api';

export const HistoryChart = ({ fundId }) => {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!fundId) return;
    
    const fetchHistory = async () => {
      setLoading(true);
      try {
        const history = await getFundHistory(fundId);
        setData(history);
      } catch (e) {
        console.error("Failed to load history", e);
      } finally {
        setLoading(false);
      }
    };
    
    fetchHistory();
  }, [fundId]);

  if (loading) return <div className="h-64 flex items-center justify-center text-slate-400">加载走势中...</div>;
  if (!data || data.length === 0) return <div className="h-64 flex items-center justify-center text-slate-400">暂无历史数据</div>;

  return (
    <div className="h-64 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart
          data={data}
          margin={{ top: 10, right: 10, left: 0, bottom: 0 }}
        >
          <defs>
            <linearGradient id="colorNav" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.2}/>
              <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
          <XAxis 
            dataKey="date" 
            tick={{fontSize: 10, fill: '#94a3b8'}} 
            tickLine={false}
            axisLine={false}
            tickFormatter={(str) => str.slice(5)} // Show MM-DD
          />
          <YAxis 
            domain={['auto', 'auto']} 
            tick={{fontSize: 10, fill: '#94a3b8'}} 
            tickLine={false}
            axisLine={false}
            width={40}
          />
          <Tooltip 
            contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
            itemStyle={{ color: '#1e293b', fontSize: '12px', fontWeight: 'bold' }}
            labelStyle={{ color: '#64748b', fontSize: '10px', marginBottom: '4px' }}
          />
          <Area 
            type="monotone" 
            dataKey="nav" 
            stroke="#3b82f6" 
            strokeWidth={2}
            fillOpacity={1} 
            fill="url(#colorNav)" 
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
};
