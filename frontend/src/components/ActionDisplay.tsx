import { useMemo } from 'react';
import {
  LineChart,
  Line,
  Area,
  XAxis,
  YAxis,
  ResponsiveContainer,
  Tooltip,
  ReferenceLine,
  CartesianGrid,
} from 'recharts';
import type { PredictionResponse, ShotType } from '../types';

interface ConfidenceDataPoint {
  time: number;
  confidence: number;
  timestamp: number;
}

interface ActionDisplayProps {
  prediction: PredictionResponse | null;
  isActive: boolean;
  confidenceHistory: ConfidenceDataPoint[];
}

export function ActionDisplay({ prediction, isActive, confidenceHistory }: ActionDisplayProps) {
  const { chartData, lineColor, fillColor } = useMemo(() => {
    if (!prediction || !isActive || confidenceHistory.length === 0) {
      return {
        chartData: [],
        lineColor: '#10b981',
        fillColor: 'url(#colorGradientGreen)',
      };
    }

    // Determine colors based on action
    const lineColor = prediction.form_quality === 'High' ? '#10b981' : '#f59e0b'; // Green or orange
    const fillColor =
      prediction.form_quality === 'High'
        ? 'url(#colorGradientGreen)'
        : 'url(#colorGradientOrange)';

    // Prepare chart data
    const chartData = confidenceHistory.map((point) => ({
      time: point.time,
      confidence: point.confidence,
    }));

    return {
      chartData,
      lineColor,
      fillColor,
    };
  }, [prediction, isActive, confidenceHistory]);

  if (!prediction || !isActive) {
    return (
      <div className="h-full flex flex-col items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-gray-200 flex items-center justify-center">
            <svg className="w-8 h-8 text-gray-500" fill="currentColor" viewBox="0 0 24 24">
              <path d="M6 4h4v16H6V4zm8 0h4v16h-4V4z" />
            </svg>
          </div>
          <p className="text-cv-text font-medium text-base">Waiting for prediction...</p>
          <p className="text-cv-muted text-sm mt-2">Perform a cricket shot to see predictions</p>
        </div>
      </div>
    );
  }

  const shotConfidencePercent = Math.round((prediction.shot_confidence ?? 0) * 100);
  const formConfidenceValue = prediction.form_confidence ?? prediction.confidence;
  const formConfidenceDisplay = Math.round(formConfidenceValue * 100);

  const formatShotLabel = (shotType: ShotType) =>
    shotType
      .split('_')
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');

  const shotLabel = formatShotLabel(prediction.shot_type);
  const formLabel = prediction.form_quality;
  const formColor =
    prediction.form_quality === 'High' ? 'text-cricket-green-bright' : 'text-cricket-orange';

  // Custom tooltip for ECG chart
  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white/95 backdrop-blur-sm border border-cv-border rounded-lg p-2 shadow-lg">
          <p className="text-sm font-semibold text-cv-text">
            Confidence: {Math.round(payload[0].value)}%
          </p>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="h-full flex flex-col">
      {/* Shot Type */}
      <div className="mb-6">
        <span className="text-xs uppercase tracking-widest text-cv-muted">Shot Type</span>
        <div className="mt-2 flex items-center justify-between gap-3">
          <h2 className="text-2xl font-extrabold text-cv-text">{shotLabel}</h2>
          <span className="px-3 py-1 rounded-full bg-cv-surface text-sm font-semibold text-cv-text">
            {shotConfidencePercent}%
          </span>
        </div>
        <div className="mt-3 h-2 bg-cv-border rounded-full overflow-hidden">
          <div
            className="h-full transition-all duration-300"
            style={{ width: `${shotConfidencePercent}%`, backgroundColor: '#3b82f6' }}
          />
        </div>
      </div>

      {/* Form Quality */}
      <div className="mb-6 grid grid-cols-1 gap-2">
        <div className="flex items-center justify-between">
          <span className="text-xs uppercase tracking-widest text-cv-muted">Form Quality</span>
          <span className={`text-sm font-semibold ${formColor}`}>{formLabel}</span>
        </div>
        <div className="flex items-baseline gap-3">
          <span className={`text-3xl font-bold ${formColor}`}>{formConfidenceDisplay}%</span>
          <span className="text-sm text-cv-muted font-medium">confidence</span>
        </div>
        <p className="text-sm text-cv-muted">{prediction.message}</p>
      </div>

      {/* ECG Chart */}
      <div className="flex-1 min-h-0">
        {chartData.length > 0 ? (
          <ResponsiveContainer width="100%" height="100%">
            <LineChart
              data={chartData}
              margin={{ top: 5, right: 10, left: 10, bottom: 5 }}
            >
              <defs>
                {/* Green gradient for High predictions */}
                <linearGradient id="colorGradientGreen" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#10b981" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                </linearGradient>
                {/* Orange gradient for Not High predictions */}
                <linearGradient id="colorGradientOrange" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#f59e0b" stopOpacity={0} />
                </linearGradient>
              </defs>
              {/* Subtle grid for ECG effect */}
              <CartesianGrid 
                strokeDasharray="2 2" 
                stroke="#e5e7eb" 
                strokeOpacity={0.2}
                vertical={false}
              />
              <XAxis 
                dataKey="time" 
                hide 
                domain={['dataMin', 'dataMax']}
              />
              <YAxis 
                domain={[0, 100]} 
                hide
                ticks={[0, 25, 50, 75, 100]}
              />
              <Tooltip content={<CustomTooltip />} />
              {/* Reference line at 50% for visual reference */}
              <ReferenceLine 
                y={50} 
                stroke="#9ca3af" 
                strokeDasharray="2 2" 
                strokeOpacity={0.4}
              />
              {/* Area fill for ECG effect (behind the line) */}
              <Area
                type="linear"
                dataKey="confidence"
                stroke="none"
                fill={fillColor}
                fillOpacity={0.4}
                isAnimationActive={false}
              />
              {/* Main ECG line (on top) - using linear for sharper transitions */}
              <Line
                type="linear"
                dataKey="confidence"
                stroke={lineColor}
                strokeWidth={3}
                dot={false}
                activeDot={{ r: 6, fill: lineColor, strokeWidth: 2, stroke: '#fff' }}
                animationDuration={200}
                isAnimationActive={true}
                connectNulls={false}
              />
            </LineChart>
          </ResponsiveContainer>
        ) : (
          <div className="h-full flex items-center justify-center">
            <p className="text-cv-muted text-sm">Waiting for data...</p>
          </div>
        )}
      </div>

      {/* Status Indicator */}
      <div className="mt-4 flex items-center justify-center gap-2">
        <div className="w-2 h-2 bg-cricket-green rounded-full animate-pulse shadow-lg shadow-cricket-green/50" />
        <span className="text-xs text-cv-muted font-semibold">Live Detection Active</span>
      </div>
    </div>
  );
}

