import React from 'react';
import { Bot, Newspaper, ExternalLink, Loader2, TrendingUp, TrendingDown, Minus, Megaphone } from 'lucide-react';
import { AIAnalysisResult } from '../types';
import ReactMarkdown from 'react-markdown';

interface AISectionProps {
  analysis: AIAnalysisResult | null;
  isAnalyzing: boolean;
  onAnalyze: () => void;
  coinName: string;
}

export const AISection: React.FC<AISectionProps> = ({ analysis, isAnalyzing, onAnalyze, coinName }) => {
  return (
    <div className="flex flex-col gap-4 bg-slate-900 border border-slate-700 rounded-xl p-6 h-full">
      <div className="flex items-center justify-between mb-2">
        <h3 className="text-lg font-semibold text-white flex items-center gap-2">
          <Bot className="text-purple-400" />
          AI 시장 분석가
        </h3>
        <button
          onClick={onAnalyze}
          disabled={isAnalyzing}
          className="px-4 py-2 bg-purple-600 hover:bg-purple-700 disabled:bg-purple-900 disabled:text-slate-400 text-white text-sm font-medium rounded-lg transition-all flex items-center gap-2"
        >
          {isAnalyzing ? <Loader2 className="animate-spin w-4 h-4" /> : <Bot className="w-4 h-4" />}
          {isAnalyzing ? '분석 중...' : `${coinName} 분석하기`}
        </button>
      </div>

      <div className="flex-1 overflow-y-auto min-h-[300px] custom-scrollbar">
        {!analysis && !isAnalyzing && (
          <div className="h-full flex flex-col items-center justify-center text-slate-500 gap-2 opacity-60">
            <Bot size={48} />
            <p>'분석하기' 버튼을 눌러 실시간 분석과 최신 뉴스를 확인하세요.</p>
          </div>
        )}
        
        {isAnalyzing && (
            <div className="h-full flex flex-col items-center justify-center gap-4">
                 <div className="animate-pulse flex flex-col items-center gap-2">
                    <div className="h-2 w-32 bg-slate-700 rounded"></div>
                    <div className="h-2 w-48 bg-slate-700 rounded"></div>
                    <span className="text-xs text-slate-500">최신 뉴스를 검색하는 중...</span>
                    <span className="text-xs text-slate-500">차트 데이터를 분석하는 중...</span>
                 </div>
            </div>
        )}

        {analysis && !isAnalyzing && (
          <div className="animate-in fade-in duration-500 space-y-4">
            
            {/* Sentiment Banner */}
            <div className={`p-4 rounded-xl border-l-4 flex flex-col gap-2 shadow-lg ${
              analysis.sentiment === 'Bullish' 
                ? 'bg-gradient-to-r from-green-900/40 to-slate-900 border-green-500' 
                : analysis.sentiment === 'Bearish'
                ? 'bg-gradient-to-r from-red-900/40 to-slate-900 border-red-500'
                : 'bg-gradient-to-r from-slate-800 to-slate-900 border-slate-500'
            }`}>
              <div className="flex items-center gap-3">
                {analysis.sentiment === 'Bullish' && <TrendingUp className="w-8 h-8 text-green-400" />}
                {analysis.sentiment === 'Bearish' && <TrendingDown className="w-8 h-8 text-red-400" />}
                {analysis.sentiment === 'Neutral' && <Minus className="w-8 h-8 text-slate-400" />}
                
                <div>
                  <div className={`text-2xl font-bold tracking-tight ${
                    analysis.sentiment === 'Bullish' ? 'text-green-400' : 
                    analysis.sentiment === 'Bearish' ? 'text-red-400' : 'text-slate-300'
                  }`}>
                    {analysis.sentiment === 'Bullish' ? '강세 (매수 우위)' : 
                     analysis.sentiment === 'Bearish' ? '약세 (매도 우위)' : '중립 (관망)'}
                  </div>
                  <div className="text-sm text-slate-400 font-medium">AI 종합 판단</div>
                </div>
              </div>
              
              <div className="mt-2 pt-2 border-t border-white/10">
                <p className="text-slate-200 text-lg font-semibold flex items-start gap-2">
                   <Megaphone className="w-5 h-5 mt-1 shrink-0 text-purple-400" />
                   "{analysis.title}"
                </p>
              </div>
            </div>

            {/* Main Content */}
            <div className="prose prose-invert prose-sm max-w-none text-slate-300 leading-relaxed bg-slate-800/30 p-4 rounded-xl border border-slate-800/50">
               <div className="whitespace-pre-wrap">
                 <ReactMarkdown>{analysis.text}</ReactMarkdown>
               </div>
            </div>
            
            {/* Sources */}
            {analysis.sources.length > 0 && (
              <div className="mt-4 pt-4 border-t border-slate-700">
                <h4 className="text-sm font-semibold text-slate-400 mb-3 flex items-center gap-2">
                  <Newspaper className="w-4 h-4" />
                  참고 자료 및 출처
                </h4>
                <div className="flex flex-wrap gap-2">
                  {analysis.sources.map((source, idx) => (
                    <a 
                      key={idx}
                      href={source.uri} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 rounded-full text-xs text-blue-400 transition-colors border border-slate-700"
                    >
                      <ExternalLink className="w-3 h-3" />
                      <span className="max-w-[150px] truncate">{source.title}</span>
                    </a>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};