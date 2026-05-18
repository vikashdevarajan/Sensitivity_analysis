import React, { useEffect, useState } from 'react';
import { Sparkles, Send, Loader2, ChevronDown, ChevronUp } from 'lucide-react';
import { MatrixData } from '../types';
import { ApiService } from '../services/apiService';

interface AIFetchWidgetProps {
  onApplyMatrix: (matrix: MatrixData) => void;
  onError: (message: string) => void;
}

export function AIFetchWidget({ onApplyMatrix, onError }: AIFetchWidgetProps) {
  const [expanded, setExpanded] = useState(false);
  const [carInput, setCarInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [lastFetched, setLastFetched] = useState<string>('');
  const [segment, setSegment] = useState('HATCHBACK');

  const segmentOptions = [
    { value: 'HATCHBACK', label: 'Hatchback' },
    { value: 'COMPACT_SEDAN', label: 'Compact Sedan' },
    { value: 'MID_SIZE_SEDAN', label: 'Mid-Size Sedan' },
    { value: 'COMPACT_SUV', label: 'Compact SUV' },
    { value: 'MID_SIZE_SUV', label: 'Mid-Size SUV' },
  ];

  useEffect(() => {
    setLastFetched('');
  }, []);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    const trimmed = carInput.trim();
    if (!trimmed || isLoading) return;

    const cars = trimmed.split(',').map((car) => car.trim()).filter(Boolean);
    if (cars.length !== 3) {
      const message = 'Please enter exactly 3 car names separated by commas.';
      onError(message);
      setLastFetched(`✗ Error: ${message}`);
      return;
    }

    setIsLoading(true);

    try {
      const response = await ApiService.fetchAIMatrix(trimmed, segment);
      onApplyMatrix(response.matrixData);
      setLastFetched(`✓ Fetched: ${response.matrixData.rowLabels.join(', ')}`);
      setCarInput('');
    } catch (error: any) {
      const message = error?.message || 'AI fetch failed. Please try again.';
      onError(message);
      setLastFetched(`✗ Error: ${message}`);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="border border-slate-200 rounded-xl p-4 bg-slate-50">
      <button
        type="button"
        onClick={() =>
          setExpanded(prev => {
            const next = !prev;
            if (next) {
              setLastFetched('');
            }
            return next;
          })
        }
        className="w-full flex items-center justify-between text-left"
      >
        <div className="flex items-center gap-2 text-sm font-semibold text-slate-700">
          <span className="bg-indigo-100 text-indigo-700 px-2 py-1 rounded-full text-xs font-semibold">AI</span>
          <Sparkles className="w-4 h-4 text-indigo-600" />
          Fetch scores from the web
        </div>
        {expanded ? <ChevronUp className="w-4 h-4 text-slate-500" /> : <ChevronDown className="w-4 h-4 text-slate-500" />}
      </button>

      {expanded && (
        <div className="mt-4 space-y-3">
          <div className="bg-white border border-slate-200 rounded-lg p-3 min-h-12 text-sm">
            {lastFetched && (
              <p className={lastFetched.startsWith('✓') ? 'text-green-600' : 'text-red-600'}>
                {lastFetched}
              </p>
            )}
            {!lastFetched && (
              <p className="text-slate-400 text-xs">
                Enter exactly 3 cars. Example: "Baleno, i20, Swift"
              </p>
            )}
          </div>

          <form onSubmit={handleSubmit} className="flex flex-col gap-2">
            <label className="text-xs font-semibold text-slate-600">
              Segment
              <select
                value={segment}
                onChange={(e) => {
                  setSegment(e.target.value);
                  setLastFetched('');
                }}
                className="mt-1 w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                disabled={isLoading}
              >
                {segmentOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </label>
            <input
              type="text"
              value={carInput}
              onChange={(e) => {
                setCarInput(e.target.value);
                if (lastFetched) {
                  setLastFetched('');
                }
              }}
              className="flex-1 px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
              placeholder="Enter exactly 3 car names: car1, car2, car3"
              disabled={isLoading}
            />
            <button
              type="submit"
              disabled={isLoading}
              className="px-3 py-2 bg-indigo-600 text-white rounded-lg text-sm font-semibold hover:bg-indigo-700 disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Fetching...
                </>
              ) : (
                <>
                  <Send className="w-4 h-4" />
                  Fetch & Fill Matrix
                </>
              )}
            </button>
          </form>
        </div>
      )}
    </div>
  );
}
