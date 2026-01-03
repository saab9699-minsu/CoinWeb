import React from 'react';
import {
  ComposedChart,
  Line,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell
} from 'recharts';
import { UpbitCandle, Timeframe } from '../types';

interface ChartProps {
  data: UpbitCandle[];
  isLoading: boolean;
  timeframe: Timeframe;
}

const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    const data = payload[0].payload;
    return (
      <div className="bg-slate-800 border border-slate-600 p-3 rounded shadow-xl text-xs">
        <p className="text-slate-300 mb-1">{data.candle_date_time_kst.replace('T', ' ')}</p>
        <p className="text-blue-400">시가: {data.opening_price.toLocaleString()}</p>
        <p className="text-green-400">고가: {data.high_price.toLocaleString()}</p>
        <p className="text-red-400">저가: {data.low_price.toLocaleString()}</p>
        <p className="text-white font-bold">종가: {data.trade_price.toLocaleString()}</p>
        <p className="text-slate-400 mt-1">거래량: {Math.floor(data.candle_acc_trade_volume).toLocaleString()}</p>
      </div>
    );
  }
  return null;
};

export const Chart: React.FC<ChartProps> = ({ data, isLoading, timeframe }) => {
  if (isLoading) {
    return (
      <div className="w-full h-[400px] flex items-center justify-center bg-slate-900 rounded-xl border border-slate-700">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (data.length === 0) {
    return (
      <div className="w-full h-[400px] flex items-center justify-center bg-slate-900 rounded-xl border border-slate-700 text-slate-500">
        데이터 없음
      </div>
    );
  }

  // Calculate min/max for Y-axis domain to make chart look good
  const minPrice = Math.min(...data.map(d => d.low_price));
  const maxPrice = Math.max(...data.map(d => d.high_price));
  const domainPadding = (maxPrice - minPrice) * 0.1;

  // X-axis tick formatter based on timeframe
  const formatXAxis = (value: string) => {
    // value format is expected to be YYYY-MM-DDTHH:mm:ss (from upbitService)
    if (timeframe === 'days' || timeframe === 'weeks' || timeframe === 'months') {
      // Return MM-DD for daily/weekly charts
      return value.substring(5, 10);
    }
    // Return HH:mm for minute charts
    return value.substring(11, 16);
  };

  return (
    <div className="w-full h-[400px] bg-slate-900 rounded-xl border border-slate-700 p-4">
      <ResponsiveContainer width="100%" height="100%">
        <ComposedChart data={data}>
          <CartesianGrid strokeDasharray="3 3" stroke="#334155" vertical={false} />
          <XAxis 
            dataKey="candle_date_time_kst" 
            tickFormatter={formatXAxis} 
            stroke="#64748b"
            tick={{ fontSize: 11 }}
            minTickGap={30}
          />
          <YAxis 
            domain={[minPrice - domainPadding, maxPrice + domainPadding]} 
            orientation="right"
            stroke="#64748b"
            tick={{ fontSize: 11 }}
            tickFormatter={(value) => value.toLocaleString()}
            width={60}
          />
          <Tooltip content={<CustomTooltip />} />
          
          {/* Volume Bar */}
          <Bar dataKey="candle_acc_trade_volume" yAxisId={1} opacity={0.3}>
             {data.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.trade_price >= entry.opening_price ? '#ef4444' : '#3b82f6'} />
              ))}
          </Bar>
          
          <Line 
            type="monotone" 
            dataKey="trade_price" 
            stroke="#3b82f6" 
            strokeWidth={2} 
            dot={false}
            activeDot={{ r: 4, fill: '#fff' }}
          />
        </ComposedChart>
      </ResponsiveContainer>
    </div>
  );
};