import React, { useEffect, useState, useCallback, useRef } from 'react';
import { Sidebar } from './components/Sidebar';
import { Chart } from './components/Chart';
import { AISection } from './components/AISection';
import { NewsSection } from './components/NewsSection';
import { getMarkets, getTicker, getCandles, getNews, formatKRW } from './services/upbitService';
import { analyzeCoin, getNewsBriefing } from './services/geminiService';
import { UpbitMarket, UpbitTicker, UpbitCandle, Timeframe, AIAnalysisResult, NewsArticle } from './types';
import { TrendingUp, TrendingDown, Clock, BarChart3, Menu, X } from 'lucide-react';

const App: React.FC = () => {
  const [markets, setMarkets] = useState<UpbitMarket[]>([]);
  const [selectedMarketCode, setSelectedMarketCode] = useState<string>('KRW-BTC');
  const [ticker, setTicker] = useState<UpbitTicker | null>(null);
  const [candles, setCandles] = useState<UpbitCandle[]>([]);
  const [news, setNews] = useState<NewsArticle[]>([]);
  const [newsBriefing, setNewsBriefing] = useState<string | null>(null);
  const [timeframe, setTimeframe] = useState<Timeframe>('minutes/60');
  const [analysis, setAnalysis] = useState<AIAnalysisResult | null>(null);
  
  const [isLoadingMarket, setIsLoadingMarket] = useState(true);
  const [isLoadingChart, setIsLoadingChart] = useState(false);
  const [isLoadingNews, setIsLoadingNews] = useState(false);
  const [isBriefingLoading, setIsBriefingLoading] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false); // Mobile sidebar toggle

  // UseRef to track current market for the interval callback
  const selectedMarketRef = useRef(selectedMarketCode);
  useEffect(() => { selectedMarketRef.current = selectedMarketCode; }, [selectedMarketCode]);

  // Initial Data Load
  useEffect(() => {
    const init = async () => {
      const marketList = await getMarkets();
      setMarkets(marketList);
      setIsLoadingMarket(false);
    };
    init();
  }, []);

  // Fetch Data when Market or Timeframe changes
  const fetchData = useCallback(async (market: string, tf: Timeframe) => {
    setIsLoadingChart(true);
    setIsLoadingNews(true);
    setNewsBriefing(null); // Reset briefing
    
    try {
      const [tickerData, candleData, newsData] = await Promise.all([
        getTicker(market),
        getCandles(market, tf),
        getNews(market)
      ]);
      setTicker(tickerData);
      setCandles(candleData);
      
      const topNews = newsData.slice(0, 10);
      setNews(topNews);
      
      // Trigger AI Briefing if there is news
      if (topNews.length > 0) {
        setIsBriefingLoading(true);
        getNewsBriefing(topNews)
          .then(brief => setNewsBriefing(brief))
          .finally(() => setIsBriefingLoading(false));
      }

    } catch (e) {
      console.error(e);
    } finally {
      setIsLoadingChart(false);
      setIsLoadingNews(false);
    }
  }, []);

  // Handle Selection Change
  useEffect(() => {
    fetchData(selectedMarketCode, timeframe);
    setAnalysis(null); // Reset analysis on coin change
    if (window.innerWidth < 768) setSidebarOpen(false); // Close sidebar on mobile select
  }, [selectedMarketCode, timeframe, fetchData]);

  // Real-time Ticker Update (Polling every 3 seconds)
  useEffect(() => {
    const interval = setInterval(async () => {
      const t = await getTicker(selectedMarketRef.current);
      if (t) setTicker(t);
    }, 3000);
    return () => clearInterval(interval);
  }, []);

  const handleAnalyze = async () => {
    if (!ticker || candles.length === 0) return;
    setIsAnalyzing(true);
    
    const marketInfo = markets.find(m => m.market === selectedMarketCode);
    const name = marketInfo ? marketInfo.korean_name : selectedMarketCode;

    const result = await analyzeCoin(name, ticker, candles);
    setAnalysis(result);
    setIsAnalyzing(false);
  };

  const selectedMarketInfo = markets.find(m => m.market === selectedMarketCode);

  return (
    <div className="flex h-screen bg-slate-950 text-slate-100 overflow-hidden relative">
      
      {/* Mobile Sidebar Overlay */}
      {sidebarOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-20 md:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <div className={`fixed inset-y-0 left-0 z-30 transform transition-transform duration-300 md:relative md:translate-x-0 ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}`}>
        <Sidebar 
          markets={markets} 
          selectedMarket={selectedMarketCode} 
          onSelectMarket={setSelectedMarketCode} 
        />
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col h-full overflow-hidden w-full">
        {/* Header */}
        <header className="h-16 bg-slate-900 border-b border-slate-700 flex items-center justify-between px-4 md:px-6 shrink-0">
          <div className="flex items-center gap-4">
            <button 
              className="md:hidden p-2 text-slate-400 hover:text-white"
              onClick={() => setSidebarOpen(!sidebarOpen)}
            >
              {sidebarOpen ? <X /> : <Menu />}
            </button>
            
            <div>
              <h1 className="text-lg font-bold flex items-center gap-2">
                {selectedMarketInfo?.korean_name || '로딩 중...'} 
                <span className="text-xs font-normal text-slate-400 bg-slate-800 px-2 py-0.5 rounded">{selectedMarketCode}</span>
              </h1>
            </div>
          </div>

          {ticker && (
            <div className="flex flex-col items-end">
              <div className={`text-lg font-bold flex items-center gap-2 ${ticker.change === 'RISE' ? 'text-red-400' : ticker.change === 'FALL' ? 'text-blue-400' : 'text-slate-200'}`}>
                {formatKRW(ticker.trade_price)}
                {ticker.change === 'RISE' ? <TrendingUp size={16} /> : ticker.change === 'FALL' ? <TrendingDown size={16} /> : null}
              </div>
              <div className={`text-xs font-medium ${ticker.change === 'RISE' ? 'text-red-400' : ticker.change === 'FALL' ? 'text-blue-400' : 'text-slate-400'}`}>
                {ticker.signed_change_rate > 0 ? '+' : ''}{(ticker.signed_change_rate * 100).toFixed(2)}%
                <span className="text-slate-500 ml-2 hidden sm:inline">거래량: {Math.floor(ticker.acc_trade_volume_24h).toLocaleString()}</span>
              </div>
            </div>
          )}
        </header>

        {/* Content Scrollable Area */}
        <main className="flex-1 overflow-y-auto p-4 md:p-6 space-y-6">
          
          {/* Chart Section */}
          <div className="flex flex-col gap-4">
            <div className="flex items-center justify-between">
              <h2 className="text-slate-300 font-semibold flex items-center gap-2">
                <BarChart3 className="w-5 h-5" /> 실시간 차트
              </h2>
              <div className="flex bg-slate-800 rounded-lg p-1">
                {(['minutes/1', 'minutes/15', 'minutes/60', 'minutes/240', 'days', 'weeks'] as Timeframe[]).map((tf) => (
                  <button
                    key={tf}
                    onClick={() => setTimeframe(tf)}
                    className={`px-3 py-1 text-xs rounded-md transition-all ${
                      timeframe === tf ? 'bg-slate-600 text-white font-medium shadow' : 'text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    {tf === 'minutes/1' ? '1분' : 
                     tf === 'minutes/15' ? '15분' : 
                     tf === 'minutes/60' ? '1시간' : 
                     tf === 'minutes/240' ? '4시간' : 
                     tf === 'days' ? '1일' : '1주'}
                  </button>
                ))}
              </div>
            </div>
            <Chart data={candles} isLoading={isLoadingChart} timeframe={timeframe} />
          </div>

          {/* Info & News & AI Analysis Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 h-[800px] lg:h-[600px]">
             
             {/* Left Column: Summary + News */}
             <div className="lg:col-span-5 flex flex-col gap-6 h-full">
               
               {/* 24h Summary Card */}
               <div className="bg-slate-900 border border-slate-700 rounded-xl p-5 shrink-0">
                  <h3 className="text-slate-400 text-sm font-medium mb-4 flex items-center gap-2">
                    <Clock className="w-4 h-4" /> 24시간 요약
                  </h3>
                  {ticker ? (
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <span className="text-slate-500 text-xs block mb-1">고가</span>
                        <span className="font-mono text-slate-200 text-sm">{formatKRW(ticker.high_price)}</span>
                      </div>
                      <div>
                        <span className="text-slate-500 text-xs block mb-1">저가</span>
                        <span className="font-mono text-slate-200 text-sm">{formatKRW(ticker.low_price)}</span>
                      </div>
                       <div>
                        <span className="text-slate-500 text-xs block mb-1">거래대금</span>
                        <span className="font-mono text-slate-200 text-sm">{formatKRW(ticker.acc_trade_price_24h).replace('₩', '')}</span>
                      </div>
                       <div>
                          <span className="text-slate-500 text-xs block mb-1">52주 신고가</span>
                          <span className="font-mono text-slate-200 text-sm">{formatKRW(ticker.highest_52_week_price)}</span>
                       </div>
                    </div>
                  ) : (
                    <div className="animate-pulse space-y-3">
                      <div className="h-4 bg-slate-800 rounded w-full"></div>
                      <div className="h-4 bg-slate-800 rounded w-full"></div>
                    </div>
                  )}
               </div>

               {/* News Feed */}
               <div className="flex-1 min-h-0">
                 <NewsSection 
                   news={news} 
                   isLoading={isLoadingNews} 
                   briefing={newsBriefing}
                   isBriefingLoading={isBriefingLoading}
                 />
               </div>

             </div>

             {/* Right Column: AI Analysis */}
             <div className="lg:col-span-7 h-full">
                <AISection 
                  analysis={analysis} 
                  isAnalyzing={isAnalyzing} 
                  onAnalyze={handleAnalyze} 
                  coinName={selectedMarketInfo?.korean_name || selectedMarketCode}
                />
             </div>
          </div>
        </main>
      </div>
    </div>
  );
};

export default App;