import React, { useState, useMemo } from 'react';
import { UpbitMarket } from '../types';
import { Search } from 'lucide-react';

interface SidebarProps {
  markets: UpbitMarket[];
  selectedMarket: string;
  onSelectMarket: (market: string) => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ markets, selectedMarket, onSelectMarket }) => {
  const [searchTerm, setSearchTerm] = useState('');

  const filteredMarkets = useMemo(() => {
    return markets.filter(m => 
      m.korean_name.includes(searchTerm) || 
      m.english_name.toLowerCase().includes(searchTerm.toLowerCase()) || 
      m.market.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [markets, searchTerm]);

  return (
    <div className="w-full md:w-80 h-[400px] md:h-full bg-slate-900 border-r border-slate-700 flex flex-col">
      <div className="p-4 border-b border-slate-700">
        <h2 className="text-xl font-bold text-blue-400 mb-4 flex items-center gap-2">
          <span>UPBIT</span> <span className="text-white">INSIDER</span>
        </h2>
        <div className="relative">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
          <input
            type="text"
            placeholder="코인 검색 (예: 비트코인, BTC)"
            className="w-full bg-slate-800 text-slate-200 pl-9 pr-4 py-2 rounded-lg border border-slate-700 focus:outline-none focus:border-blue-500 text-sm"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>
      
      <div className="flex-1 overflow-y-auto">
        {filteredMarkets.length === 0 ? (
          <div className="p-4 text-center text-slate-500 text-sm">검색 결과가 없습니다.</div>
        ) : (
          <ul>
            {filteredMarkets.map((market) => (
              <li key={market.market}>
                <button
                  onClick={() => onSelectMarket(market.market)}
                  className={`w-full px-4 py-3 flex items-center justify-between hover:bg-slate-800 transition-colors ${
                    selectedMarket === market.market ? 'bg-slate-800 border-l-4 border-blue-500' : 'border-l-4 border-transparent'
                  }`}
                >
                  <div className="flex flex-col items-start">
                    <span className="font-medium text-slate-200 text-sm">{market.korean_name}</span>
                    <span className="text-xs text-slate-500">{market.market}</span>
                  </div>
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
};