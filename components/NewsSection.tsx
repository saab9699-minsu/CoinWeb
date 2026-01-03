import React from 'react';
import { NewsArticle } from '../types';
import { Newspaper, ExternalLink, Calendar, Sparkles, Loader2 } from 'lucide-react';
import ReactMarkdown from 'react-markdown';

interface NewsSectionProps {
  news: NewsArticle[];
  isLoading: boolean;
  briefing: string | null;
  isBriefingLoading: boolean;
}

export const NewsSection: React.FC<NewsSectionProps> = ({ news, isLoading, briefing, isBriefingLoading }) => {
  return (
    <div className="bg-slate-900 border border-slate-700 rounded-xl p-5 h-full flex flex-col">
      <h3 className="text-slate-200 text-lg font-bold mb-4 flex items-center gap-2">
        <Newspaper className="w-5 h-5 text-green-400" /> 관련 뉴스
      </h3>
      
      <div className="flex-1 overflow-y-auto pr-1 custom-scrollbar space-y-4">
        {/* AI Briefing Box */}
        {(briefing || isBriefingLoading) && (
          <div className="bg-slate-800/50 border border-purple-500/30 rounded-lg p-4 mb-2">
            <h4 className="text-purple-400 text-sm font-bold flex items-center gap-2 mb-2">
              <Sparkles className="w-4 h-4" /> AI 뉴스 3줄 요약
            </h4>
            {isBriefingLoading ? (
              <div className="flex items-center gap-2 text-slate-500 text-sm py-2">
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>최신 뉴스를 분석하고 있습니다...</span>
              </div>
            ) : (
              <div className="text-slate-200 text-sm prose prose-invert prose-p:my-1 prose-ul:my-1 prose-li:my-0 marker:text-purple-400">
                <ReactMarkdown>{briefing || ''}</ReactMarkdown>
              </div>
            )}
          </div>
        )}

        {/* News List */}
        {isLoading ? (
           <div className="space-y-4 animate-pulse">
             {[1, 2, 3].map(i => (
               <div key={i} className="flex gap-4">
                 <div className="w-20 h-20 bg-slate-800 rounded-lg shrink-0"></div>
                 <div className="flex-1 space-y-2">
                   <div className="h-4 bg-slate-800 rounded w-3/4"></div>
                   <div className="h-3 bg-slate-800 rounded w-1/2"></div>
                 </div>
               </div>
             ))}
           </div>
        ) : news.length === 0 ? (
          <div className="text-center text-slate-500 py-10">
            관련 뉴스가 없습니다.
          </div>
        ) : (
          news.map((article) => (
            <a 
              key={article.id} 
              href={article.url} 
              target="_blank" 
              rel="noopener noreferrer"
              className="flex gap-4 p-3 rounded-lg hover:bg-slate-800 transition-colors group border border-transparent hover:border-slate-700"
            >
              <div className="w-20 h-20 bg-slate-800 rounded-lg overflow-hidden shrink-0">
                <img 
                  src={article.imageurl} 
                  alt={article.title} 
                  className="w-full h-full object-cover opacity-80 group-hover:opacity-100 transition-opacity"
                  onError={(e) => {
                    (e.target as HTMLImageElement).src = 'https://via.placeholder.com/80?text=News';
                  }}
                />
              </div>
              <div className="flex-1 min-w-0 flex flex-col justify-between">
                <h4 className="text-slate-200 text-sm font-medium leading-snug line-clamp-2 group-hover:text-blue-400 transition-colors">
                  {article.title}
                </h4>
                <div className="flex items-center justify-between mt-2">
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-slate-400 bg-slate-800 px-1.5 py-0.5 rounded">
                      {article.source}
                    </span>
                  </div>
                  <span className="text-xs text-slate-500 flex items-center gap-1">
                    <Calendar className="w-3 h-3" />
                    {new Date(article.published_on * 1000).toLocaleDateString()}
                  </span>
                </div>
              </div>
            </a>
          ))
        )}
      </div>
    </div>
  );
};