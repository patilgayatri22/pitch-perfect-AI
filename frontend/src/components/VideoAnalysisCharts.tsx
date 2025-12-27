import { useMemo } from 'react';
import {
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  ResponsiveContainer,
  Tooltip,
  Legend,
  CartesianGrid,
} from 'recharts';
import type { PredictionResponse } from '../types';

interface VideoAnalysisChartsProps {
  prediction: PredictionResponse | null;
}

export function VideoAnalysisCharts({ prediction }: VideoAnalysisChartsProps) {
  const chartData = useMemo(() => {
    if (!prediction) return null;

    const shotConfidence = Math.round((prediction.shot_confidence ?? 0) * 100);
    const formConfidence = Math.round((prediction.form_confidence ?? prediction.confidence) * 100);

    return {
      confidenceComparison: [
        {
          name: 'Shot Type',
          confidence: shotConfidence,
          fill: '#3b82f6', // Blue
        },
        {
          name: 'Form Quality',
          confidence: formConfidence,
          fill: '#f59e0b', // Orange
        },
      ],
      confidenceBreakdown: [
        {
          name: 'High Confidence',
          value: formConfidence,
          fill: prediction.form_quality === 'High' ? '#10b981' : '#e5e7eb',
        },
        {
          name: 'Low Confidence',
          value: 100 - formConfidence,
          fill: prediction.form_quality === 'High' ? '#e5e7eb' : '#f59e0b',
        },
      ],
    };
  }, [prediction]);

  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white/95 backdrop-blur-sm border border-cv-border rounded-lg p-3 shadow-lg">
          <p className="text-sm font-semibold text-cv-text mb-1">{payload[0].name}</p>
          <p className="text-sm text-cv-text">
            Confidence: <span className="font-bold">{payload[0].value}%</span>
          </p>
        </div>
      );
    }
    return null;
  };

  const PieTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white/95 backdrop-blur-sm border border-cv-border rounded-lg p-3 shadow-lg">
          <p className="text-sm font-semibold text-cv-text mb-1">{payload[0].name}</p>
          <p className="text-sm text-cv-text">
            Value: <span className="font-bold">{payload[0].value}%</span>
          </p>
        </div>
      );
    }
    return null;
  };

  if (!prediction || !chartData) {
    return (
      <div className="h-full flex flex-col items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-gray-200 flex items-center justify-center">
            <svg className="w-8 h-8 text-gray-500" fill="currentColor" viewBox="0 0 24 24">
              <path d="M9 17H7v-7h2v7zm4 0h-2V7h2v10zm4 0h-2v-4h2v4z" />
            </svg>
          </div>
          <p className="text-cv-text font-medium text-base">No analysis data</p>
          <p className="text-cv-muted text-sm mt-2">Upload and analyze a video to see charts</p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col gap-4 overflow-hidden">
      {/* Confidence Comparison Bar Chart */}
      <div className="flex-1 min-h-[200px] flex flex-col">
        <h3 className="text-lg font-semibold text-cv-text mb-2">Confidence Comparison</h3>
        <div className="flex-1 min-h-0">
        <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData.confidenceComparison} margin={{ top: 20, right: 20, left: 20, bottom: 20 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" strokeOpacity={0.2} />
            <XAxis 
              dataKey="name" 
                tick={{ fill: '#6b7280', fontSize: 11 }}
              axisLine={{ stroke: '#e5e7eb' }}
            />
            <YAxis 
              domain={[0, 100]}
                tick={{ fill: '#6b7280', fontSize: 11 }}
              axisLine={{ stroke: '#e5e7eb' }}
                width={45}
            />
            <Tooltip content={<CustomTooltip />} />
            <Bar dataKey="confidence" radius={[8, 8, 0, 0]}>
              {chartData.confidenceComparison.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.fill} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
        </div>
      </div>

      {/* Confidence Breakdown Pie Chart */}
      <div className="flex-1 min-h-[200px] flex flex-col">
        <h3 className="text-lg font-semibold text-cv-text mb-2">Form Quality Breakdown</h3>
        <div className="flex-1 min-h-0 flex items-center justify-center">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart margin={{ top: 10, right: 10, left: 10, bottom: 10 }}>
              <Pie
                data={chartData.confidenceBreakdown}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ name, value }) => `${value}%`}
                outerRadius="70%"
                fill="#8884d8"
                dataKey="value"
              >
                {chartData.confidenceBreakdown.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.fill} />
                ))}
              </Pie>
              <Tooltip content={<PieTooltip />} />
              <Legend 
                verticalAlign="bottom" 
                height={36}
                formatter={(value, entry: any) => `${value}: ${entry.payload.value}%`}
              />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}

