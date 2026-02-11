import React, { useState, useCallback, useMemo } from 'react';
import { 
  Settings2, 
  Calculator, 
  FileText, 
  RotateCcw, 
  Dices, 
  TrendingUp,
  AlertCircle,
  Printer,
  ChevronDown,
  ChevronUp,
  Target,
  Users,
  ShieldCheck,
  Car,
  Fuel,
  Shield,
  Smartphone,
  Wrench,
  DollarSign
} from 'lucide-react';
import { MatrixData, AnalysisResults, AdvisoryReport, ConfidenceBreakdown, WeightSet } from './types';
import { ApiService } from './services/apiService';
import { BackendStatus } from './components/BackendStatus';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell
} from 'recharts';

export default function App() {
  const [rows, setRows] = useState(3);
  const [cols, setCols] = useState(5);
  
  // Default car comparison data
  const [data, setData] = useState<MatrixData>({
    rows: 3,
    cols: 5,
    entityAName: 'Maruti Suzuki',
    entityBName: 'Compact Car Market',
    yourProduct: 'Baleno',
    rowLabels: ['Baleno', 'Polo', 'i20'],
    colLabels: ['Fuel', 'Safety', 'Tech', 'Service', 'Price'],
    payoffs: [
      [9, 7, 7, 9, 8],  // Baleno
      [7, 8, 8, 6, 6],  // Polo  
      [6, 9, 9, 7, 7]   // i20
    ],
    weights: {
      fuel: 0.30,
      safety: 0.25,
      tech: 0.20,
      service: 0.15,
      price: 0.10
    }
  });
  
  // Weights state
  const [weights, setWeights] = useState<WeightSet>({
    fuel: 0.30,
    safety: 0.25,
    tech: 0.20,
    service: 0.15,
    price: 0.10
  });
  
  const [results, setResults] = useState<AnalysisResults | null>(null);
  const [advisory, setAdvisory] = useState<AdvisoryReport | null>(null);
  const [isCalculating, setIsCalculating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showWeights, setShowWeights] = useState(true);

  // Weight adjustment handlers
  const handleWeightChange = (criterion: keyof WeightSet, value: number) => {
    const newWeights = { ...weights };
    newWeights[criterion] = value;
    
    // Normalize weights to sum to 1.0
    const total: number = (Object.values(newWeights) as number[]).reduce((sum: number, w: number) => sum + w, 0);
    Object.keys(newWeights).forEach(key => {
      newWeights[key as keyof WeightSet] = newWeights[key as keyof WeightSet] / total;
    });
    
    setWeights(newWeights);
    setData(prev => ({ ...prev, weights: newWeights }));
  };

  const resetWeights = () => {
    const defaultWeights = {
      fuel: 0.30,
      safety: 0.25,
      tech: 0.20,
      service: 0.15,
      price: 0.10
    };
    setWeights(defaultWeights);
    setData(prev => ({ ...prev, weights: defaultWeights }));
  };

  const generateMatrix = useCallback(() => {
    const newRowLabels = rows === 3 ? ['Option A', 'Option B', 'Option C'] : 
                 Array.from({ length: rows }, (_, i) => `Option ${String.fromCharCode(65 + i)}`);
    const newColLabels = cols === 5 ? ['Fuel', 'Safety', 'Tech', 'Service', 'Price'] :
                 Array.from({ length: cols }, (_, i) => `Criterion ${i + 1}`);
                 
    const newData = {
      rows,
      cols,
      entityAName: 'Your Company',
      entityBName: 'Market Segment',
      rowLabels: newRowLabels,
      colLabels: newColLabels,
      payoffs: Array.from({ length: rows }, () => Array(cols).fill(0)),
      weights: weights,
      yourProduct: newRowLabels[0]  // Set to first option automatically
    };
    setData(newData);
    setResults(null);
    setAdvisory(null);
  }, [rows, cols, weights]);

  const loadCarExample = () => {
    const carData = {
      rows: 3,
      cols: 5,
      entityAName: 'Maruti Suzuki',
      entityBName: 'Compact Car Market',
      rowLabels: ['Baleno', 'Polo', 'i20'],
      colLabels: ['Fuel', 'Safety', 'Tech', 'Service', 'Price'],
      payoffs: [
        [9, 7, 7, 9, 8],  // Baleno
        [7, 8, 8, 6, 6],  // Polo  
        [6, 9, 9, 7, 7]   // i20
      ],
      weights: weights,
      yourProduct: 'Baleno'  // Set to first option
    };
    setData(carData);
    setRows(3);
    setCols(5);
    setResults(null);
    setAdvisory(null);
  };

  const fillRandom = () => {
    const newPayoffs = data.payoffs.map(row => row.map(() => Math.floor(Math.random() * 10) + 1));
    setData(prev => ({ ...prev, payoffs: newPayoffs }));
  };

  const handlePayoffChange = (r: number, c: number, val: string) => {
    const newPayoffs = [...data.payoffs];
    newPayoffs[r][c] = Math.max(0, Math.min(10, parseInt(val) || 0)); // Limit to 0-10 range
    setData(prev => ({ ...prev, payoffs: newPayoffs }));
  };

  const performAnalysis = async () => {
    setIsCalculating(true);
    setError(null);
    try {
      const dataWithWeights = { ...data, weights };
      const response = await ApiService.analyzeGame(dataWithWeights);
      setResults(response.results);
      setAdvisory(response.advisory);
    } catch (err: any) {
      setError(err.message || 'Analysis failed. Please try again.');
    } finally {
      setIsCalculating(false);
    }
  };

  // Chart data for market share visualization
  const marketShareData = useMemo(() => {
    if (!results?.marketShare) return [];
    return Object.entries(results.marketShare).map(([name, share]) => ({
      name,
      share: parseFloat(share.toString()),
      fill: name === results.optimalChoice ? '#4f46e5' : '#94a3b8'
    }));
  }, [results]);

  return (
    <div className="min-h-screen bg-slate-50 pb-20 selection:bg-indigo-100">
      <header className="bg-white border-b sticky top-0 z-50 no-print">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <div className="bg-indigo-600 p-1.5 rounded-lg">
                <Car className="text-white w-5 h-5" />
              </div>
              <h1 className="text-xl font-black text-slate-900 tracking-tight">Strategix</h1>
              <span className="text-xs bg-indigo-100 text-indigo-700 px-2 py-1 rounded-full font-semibold">Business Analysis</span>
            </div>
            <div className="flex items-center gap-2 ml-4 pl-4 border-l border-slate-200">
              <BackendStatus />
            </div>
          </div>
          <div className="flex items-center gap-3">
            <button onClick={loadCarExample} className="flex items-center gap-2 px-3 py-2 text-sm font-semibold text-indigo-600 hover:bg-indigo-50 transition-colors rounded-lg">
              <Car className="w-4 h-4" /> Load Car Example
            </button>
            <button onClick={generateMatrix} className="flex items-center gap-2 px-3 py-2 text-sm font-semibold text-slate-600 hover:text-indigo-600 transition-colors">
              <RotateCcw className="w-4 h-4" /> New Analysis
            </button>
            <button disabled={!results} onClick={() => window.print()} className="flex items-center gap-2 px-5 py-2.5 bg-indigo-600 text-white rounded-xl text-sm font-bold hover:bg-indigo-700 disabled:opacity-40 shadow-lg shadow-indigo-100 transition-all">
              <Printer className="w-4 h-4" /> Export Report
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-6 py-8">
        <div className="grid lg:grid-cols-12 gap-8">
          
          {/* Left Panel - Input Controls */}
          <div className="lg:col-span-5 space-y-6 no-print">
            
            {/* Business Context */}
            <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6">
              <div className="flex items-center gap-3 mb-4">
                <Settings2 className="w-5 h-5 text-indigo-600" />
                <h2 className="text-lg font-bold text-slate-900">Business Context</h2>
              </div>
              
              <div className="grid grid-cols-2 gap-4 mb-4">
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-2">Company/Brand</label>
                  <input 
                    type="text" 
                    value={data.entityAName}
                    onChange={(e) => setData(prev => ({ ...prev, entityAName: e.target.value }))}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                    placeholder="e.g., Maruti Suzuki"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-2">Market Segment</label>
                  <input 
                    type="text" 
                    value={data.entityBName}
                    onChange={(e) => setData(prev => ({ ...prev, entityBName: e.target.value }))}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                    placeholder="e.g., Compact Car Market"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-2">Options ({rows})</label>
                  <input 
                    type="range" 
                    min="2" 
                    max="6" 
                    value={rows}
                    onChange={(e) => setRows(parseInt(e.target.value))}
                    className="w-full accent-indigo-600"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-2">Criteria ({cols})</label>
                  <input 
                    type="range" 
                    min="3" 
                    max="8" 
                    value={cols}
                    onChange={(e) => setCols(parseInt(e.target.value))}
                    className="w-full accent-indigo-600"
                  />
                </div>
              </div>
            </div>

            {/* Weight Controls */}
            <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <TrendingUp className="w-5 h-5 text-indigo-600" />
                  <h2 className="text-lg font-bold text-slate-900">Importance Weights</h2>
                </div>
                <button 
                  onClick={() => setShowWeights(!showWeights)}
                  className="p-2 text-slate-500 hover:text-slate-700 rounded-lg hover:bg-slate-100 transition-colors"
                >
                  {showWeights ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                </button>
              </div>
              
              {showWeights && (
                <div className="space-y-4">
                  {Object.entries(weights).map(([key, value]) => {
                    const icons = {
                      fuel: <Fuel className="w-4 h-4" />,
                      safety: <Shield className="w-4 h-4" />,
                      tech: <Smartphone className="w-4 h-4" />,
                      service: <Wrench className="w-4 h-4" />,
                      price: <DollarSign className="w-4 h-4" />
                    };
                    
                    return (
                      <div key={key} className="space-y-2">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <span className="text-indigo-600">{icons[key as keyof typeof icons]}</span>
                            <label className="text-sm font-semibold text-slate-700 capitalize">{key}</label>
                          </div>
                          <span className="text-sm text-slate-600 font-mono">{((value as number) * 100).toFixed(0)}%</span>
                        </div>
                        <input
                          type="range"
                          min="0.05"
                          max="0.50"
                          step="0.01"
                          value={value}
                          onChange={(e) => handleWeightChange(key as keyof WeightSet, parseFloat(e.target.value))}
                          className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-indigo-600"
                        />
                      </div>
                    );
                  })}
                  
                  <button 
                    onClick={resetWeights}
                    className="w-full py-2 px-3 text-xs font-semibold text-slate-600 border border-slate-300 rounded-lg hover:bg-slate-50 transition-colors"
                  >
                    Reset to Market Defaults
                  </button>
                </div>
              )}
            </div>

            {/* Performance Matrix */}
            <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <Calculator className="w-5 h-5 text-indigo-600" />
                  <h2 className="text-lg font-bold text-slate-900">Performance Scores</h2>
                </div>
                <div className="flex gap-2">
                  <button onClick={fillRandom} className="p-2 text-slate-500 hover:text-indigo-600 transition-colors rounded-lg hover:bg-slate-100" title="Fill Random (1-10)">
                    <Dices className="w-4 h-4" />
                  </button>
                </div>
              </div>
              
              <div className="text-xs text-slate-500 mb-4 p-3 bg-slate-50 rounded-lg">
                <strong>Scoring Guide:</strong> Rate each option (1-10) on each criterion. 
                Higher scores = better performance. Example: Fuel efficiency 9/10 = excellent mileage.
              </div>

              {/* Options/Criteria Labels */}
              <div className="grid grid-cols-2 gap-4 mb-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-2">Options/Products:</label>
                  {data.rowLabels.map((label, i) => (
                    <input
                      key={i}
                      value={label}
                      onChange={(e) => {
                        const newLabels = [...data.rowLabels];
                        newLabels[i] = e.target.value;
                        setData(prev => ({ ...prev, rowLabels: newLabels }));
                      }}
                      className="w-full px-3 py-2 mb-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                      placeholder={`Option ${i + 1}`}
                    />
                  ))}
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-2">Evaluation Criteria:</label>
                  {data.colLabels.map((label, i) => (
                    <input
                      key={i}
                      value={label}
                      onChange={(e) => {
                        const newLabels = [...data.colLabels];
                        newLabels[i] = e.target.value;
                        setData(prev => ({ ...prev, colLabels: newLabels }));
                      }}
                      className="w-full px-3 py-2 mb-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                      placeholder={`Criterion ${i + 1}`}
                    />
                  ))}
                </div>
              </div>

              {/* Score Matrix */}
              <div className="overflow-x-auto">
                <table className="w-full border-collapse">
                  <thead>
                    <tr className="bg-slate-100">
                      <th className="p-3 text-left text-xs font-semibold text-slate-600 rounded-tl-lg">Options</th>
                      {data.colLabels.map((label, i) => (
                        <th key={i} className={`p-3 text-center text-xs font-semibold text-slate-600 ${i === data.colLabels.length - 1 ? 'rounded-tr-lg' : ''}`}>
                          {label}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {data.rowLabels.map((rowLabel, r) => (
                      <tr key={r} className="border-b border-slate-200">
                        <td className="p-3 text-sm font-semibold text-slate-700 bg-slate-50">
                          {rowLabel}
                        </td>
                        {data.colLabels.map((_, c) => (
                          <td key={c} className="p-2">
                            <input
                              type="number"
                              min="0"
                              max="10"
                              value={data.payoffs[r][c]}
                              onChange={(e) => handlePayoffChange(r, c, e.target.value)}
                              className="w-full px-3 py-2 text-center text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 font-mono"
                            />
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              
              {/* Your Product Selection */}
              <div className="mt-4 p-4 bg-indigo-50 rounded-lg border border-indigo-200">
                <div className="flex items-center gap-2 mb-3">
                  <Car className="w-4 h-4 text-indigo-600" />
                  <label className="text-sm font-bold text-indigo-800">Your Product (Primary Focus)</label>
                </div>
                <select 
                  value={data.yourProduct || data.rowLabels[0] || ''}
                  onChange={(e) => setData(prev => ({ ...prev, yourProduct: e.target.value }))}
                  className="w-full px-4 py-3 border-2 border-indigo-300 rounded-lg text-sm font-semibold text-indigo-800 bg-white focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                >
                  {data.rowLabels.map((option, i) => (
                    <option key={i} value={option}>{option}</option>
                  ))}
                </select>
                <p className="text-xs text-indigo-600 mt-2">Select which product the analysis should focus on. Reports will be tailored to this product's competitive position.</p>
              </div>
              
              <button 
                onClick={performAnalysis}
                disabled={isCalculating}
                className="w-full mt-6 py-4 px-6 bg-indigo-600 text-white rounded-xl font-bold hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-lg shadow-indigo-100 flex items-center justify-center gap-2"
              >
                {isCalculating ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    Analyzing...
                  </>
                ) : (
                  <>
                    <Calculator className="w-5 h-5" />
                    Run Sensitivity Analysis
                  </>
                )}
              </button>
            </div>
            
            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 p-4 rounded-2xl flex items-start gap-3">
                <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="font-semibold">Analysis Error</p>
                  <p className="text-sm text-red-600">{error}</p>
                </div>
              </div>
            )}
          </div>

          {/* Results Section */}
          <div className="lg:col-span-7 space-y-8">
            {!results && !isCalculating ? (
              <div className="h-full min-h-[500px] flex flex-col items-center justify-center bg-white border-2 border-dashed border-slate-200 rounded-3xl p-12 text-center">
                <div className="bg-slate-50 p-10 rounded-full mb-8">
                  <TrendingUp className="w-16 h-16 text-slate-200" />
                </div>
                <h3 className="text-2xl font-bold text-slate-800 tracking-tight">Business Intelligence Pending</h3>
                <p className="text-slate-500 mt-3 max-w-sm font-medium leading-relaxed">Configure your analysis parameters and run sensitivity analysis to generate strategic insights.</p>
              </div>
            ) : isCalculating ? (
              <div className="space-y-8">
                {[1, 2, 3].map(i => <div key={i} className="bg-white rounded-2xl h-56 animate-pulse shadow-sm border border-slate-100" />)}
              </div>
            ) : (
              <div className="space-y-8">
                
                {/* YOUR PRODUCT POSITION - Primary Focus Card */}
                {results?.yourProductAnalysis && (
                  <div className={`p-6 rounded-2xl border-2 shadow-lg ${
                    results.yourProductAnalysis.isLeader 
                      ? 'bg-gradient-to-r from-emerald-50 to-green-50 border-emerald-400' 
                      : results.yourProductAnalysis.yourRank === 2 
                        ? 'bg-gradient-to-r from-blue-50 to-indigo-50 border-blue-400'
                        : 'bg-gradient-to-r from-orange-50 to-amber-50 border-orange-400'
                  }`}>
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center gap-3">
                        <Car className={`w-6 h-6 ${results.yourProductAnalysis.isLeader ? 'text-emerald-600' : 'text-indigo-600'}`} />
                        <h3 className="text-xl font-black text-slate-900">Your Product: {results.yourProductAnalysis.yourProduct}</h3>
                      </div>
                      <span className={`px-4 py-2 rounded-full text-sm font-bold ${
                        results.yourProductAnalysis.isLeader 
                          ? 'bg-emerald-600 text-white' 
                          : results.yourProductAnalysis.yourRank === 2 
                            ? 'bg-blue-600 text-white'
                            : 'bg-orange-600 text-white'
                      }`}>
                        {results.yourProductAnalysis.position}
                      </span>
                    </div>
                    <p className="text-slate-700 font-medium mb-4">{results.yourProductAnalysis.positionDetail}</p>
                    <div className="grid grid-cols-4 gap-4">
                      <div className="text-center p-3 bg-white rounded-xl">
                        <p className="text-2xl font-black text-indigo-600">{results.yourProductAnalysis.yourScore.toFixed(1)}</p>
                        <p className="text-xs text-slate-600 font-semibold">Utility Score</p>
                      </div>
                      <div className="text-center p-3 bg-white rounded-xl">
                        <p className="text-2xl font-black text-indigo-600">{results.yourProductAnalysis.yourShare.toFixed(1)}%</p>
                        <p className="text-xs text-slate-600 font-semibold">Market Share</p>
                      </div>
                      <div className="text-center p-3 bg-white rounded-xl">
                        <p className="text-2xl font-black text-indigo-600">#{results.yourProductAnalysis.yourRank}</p>
                        <p className="text-xs text-slate-600 font-semibold">Ranking</p>
                      </div>
                      <div className="text-center p-3 bg-white rounded-xl">
                        <p className="text-2xl font-black text-indigo-600">{results.yourProductAnalysis.gapToLeader.toFixed(1)}</p>
                        <p className="text-xs text-slate-600 font-semibold">Gap to Leader</p>
                      </div>
                    </div>
                    {!results.yourProductAnalysis.isLeader && results.yourProductAnalysis.behind.length > 0 && (
                      <p className="text-sm text-slate-600 mt-4">
                        <strong>Ahead of:</strong> {results.yourProductAnalysis.aheadOf.join(', ') || 'None'} | 
                        <strong className="ml-2">Behind:</strong> {results.yourProductAnalysis.behind.join(', ')}
                      </p>
                    )}
                  </div>
                )}

                {/* Market Position Overview */}
                <div className="grid sm:grid-cols-3 gap-4">
                  <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
                    <div className="flex items-center gap-2 mb-2">
                      <Target className="w-4 h-4 text-indigo-600" />
                      <h4 className="text-xs font-bold text-slate-600 uppercase tracking-wide">Market Leader</h4>
                    </div>
                    <p className="text-2xl font-black text-slate-900">{results?.optimalChoice}</p>
                    <p className="text-sm text-slate-600 mt-1">Optimal choice under current weights</p>
                  </div>
                  
                  <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
                    <div className="flex items-center gap-2 mb-2">
                      <ShieldCheck className="w-4 h-4 text-emerald-600" />
                      <h4 className="text-xs font-bold text-slate-600 uppercase tracking-wide">Stability Index</h4>
                    </div>
                    <p className="text-2xl font-black text-slate-900">{((results?.stabilityIndex || 0) * 100).toFixed(0)}%</p>
                    <p className="text-sm text-slate-600 mt-1">Position security rating</p>
                  </div>
                  
                  <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
                    <div className="flex items-center gap-2 mb-2">
                      <AlertCircle className="w-4 h-4 text-orange-600" />
                      <h4 className="text-xs font-bold text-slate-600 uppercase tracking-wide">Risk Level</h4>
                    </div>
                    <p className="text-2xl font-black text-slate-900">{results?.riskAssessment?.level || 'N/A'}</p>
                    <p className="text-sm text-slate-600 mt-1">Competitive vulnerability</p>
                  </div>
                </div>

                {/* Market Share Visualization */}
                <div className="bg-white p-8 rounded-2xl border border-slate-200 shadow-sm">
                  <div className="flex items-center justify-between mb-6">
                    <h4 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                      <Users className="w-5 h-5 text-indigo-600" /> Predicted Market Share
                    </h4>
                  </div>
                  <div className="grid grid-cols-2 gap-8">
                    <div className="h-64">
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                          <Pie
                            data={marketShareData}
                            cx="50%"
                            cy="50%"
                            outerRadius={80}
                            dataKey="share"
                            label={({ name, value }) => `${name}: ${value}%`}
                          >
                            {marketShareData.map((entry, index) => (
                              <Cell key={`cell-${index}`} fill={entry.fill} />
                            ))}
                          </Pie>
                          <Tooltip />
                        </PieChart>
                      </ResponsiveContainer>
                    </div>
                    <div className="space-y-4">
                      {Object.entries(results?.marketShare || {}).map(([option, share]) => (
                        <div key={option} className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
                          <span className="font-semibold text-slate-700">{option}</span>
                          <div className="flex items-center gap-3">
                            <div className="w-16 bg-slate-200 rounded-full h-2 overflow-hidden">
                              <div 
                                className="h-full bg-indigo-600 transition-all duration-1000"
                                style={{ width: `${share}%` }}
                              />
                            </div>
                            <span className="font-mono text-sm text-slate-600 w-10 text-right">{parseFloat(share.toString()).toFixed(1)}%</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Sensitivity Insights */}
                {results?.tippingPoints && results.tippingPoints.length > 0 && (
                  <div className="bg-white p-8 rounded-2xl border border-slate-200 shadow-sm">
                    <div className="flex items-center gap-2 mb-6">
                      <AlertCircle className="w-5 h-5 text-orange-600" />
                      <h4 className="text-lg font-bold text-slate-900">Critical Tipping Points</h4>
                    </div>
                    <div className="space-y-4">
                      {results.tippingPoints.slice(0, 3).map((point, i) => (
                        <div key={i} className="p-4 border border-orange-200 rounded-lg bg-orange-50">
                          <div className="flex items-start justify-between">
                            <div>
                              <p className="font-semibold text-slate-900 capitalize">{point.criterion} Sensitivity</p>
                              <p className="text-sm text-slate-600 mt-1">{point.marketImpact}</p>
                            </div>
                            <div className="text-right">
                              <p className="text-xs text-slate-500">Weight Change</p>
                              <p className="font-mono text-sm text-slate-700">{(point.weightChange * 100).toFixed(0)}%</p>
                            </div>
                          </div>
                          <div className="mt-3 pt-3 border-t border-orange-200">
                            <p className="text-xs text-slate-600">
                              Leadership shifts from <strong>{point.previousLeader}</strong> to <strong>{point.newLeader}</strong>
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Criteria Sensitivity Analysis */}
                {results?.criteriaSensitivity && (
                  <div className="bg-white p-8 rounded-2xl border border-slate-200 shadow-sm">
                    <div className="flex items-center gap-2 mb-6">
                      <TrendingUp className="w-5 h-5 text-purple-600" />
                      <h4 className="text-lg font-bold text-slate-900">Sensitivity Analysis by Criteria</h4>
                    </div>
                    <div className="space-y-4">
                      {Object.entries(results.criteriaSensitivity).map(([criterion, sensitivity]) => {
                        const sensitivityValue = Number(sensitivity);
                        return (
                        <div key={criterion} className="space-y-2">
                          <div className="flex items-center justify-between">
                            <span className="font-semibold text-slate-700 capitalize">{criterion}</span>
                            <div className={`text-sm font-bold px-2 py-1 rounded-full ${
                              sensitivityValue >= 50 ? 'bg-red-100 text-red-700' :
                              sensitivityValue >= 25 ? 'bg-orange-100 text-orange-700' :
                              'bg-green-100 text-green-700'
                            }`}>
                              {sensitivityValue.toFixed(0)}% Sensitive
                            </div>
                          </div>
                          <div className="w-full bg-slate-200 rounded-full h-3 overflow-hidden">
                            <div 
                              className={`h-full transition-all duration-1000 ${
                                sensitivityValue >= 50 ? 'bg-red-500' :
                                sensitivityValue >= 25 ? 'bg-orange-500' :
                                'bg-green-500'
                              }`}
                              style={{ width: `${sensitivityValue}%` }}
                            />
                          </div>
                          <p className="text-xs text-slate-600">
                            {sensitivityValue >= 50 ? 'High risk: Small changes can shift market leadership' :
                             sensitivityValue >= 25 ? 'Medium risk: Moderate changes may affect position' :
                             'Low risk: Stable criterion with minimal impact on leadership'}
                          </p>
                        </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* Scenario Analysis */}
                {results?.scenarioAnalysis && results.scenarioAnalysis.length > 0 && (
                  <div className="bg-white p-8 rounded-2xl border border-slate-200 shadow-sm">
                    <div className="flex items-center gap-2 mb-6">
                      <Target className="w-5 h-5 text-blue-600" />
                      <h4 className="text-lg font-bold text-slate-900">What-If Scenario Analysis</h4>
                    </div>
                    <div className="grid gap-4">
                      {results.scenarioAnalysis.slice(0, 4).map((scenario, i) => (
                        <div key={i} className="p-4 border border-blue-200 rounded-lg bg-blue-50">
                          <div className="flex items-center justify-between mb-3">
                            <h5 className="font-semibold text-slate-900">{scenario.scenarioName}</h5>
                            <div className="flex items-center gap-2">
                              <span className="text-xs text-slate-500">Impact:</span>
                              <span className="font-mono text-sm font-bold text-blue-700">{scenario.impactScore.toFixed(1)}</span>
                            </div>
                          </div>
                          <div className="grid grid-cols-2 gap-4">
                            <div>
                              <p className="text-xs text-slate-600 mb-2">New Market Leader:</p>
                              <span className={`font-bold ${scenario.newLeader === results.optimalChoice ? 'text-green-600' : 'text-orange-600'}`}>
                                {scenario.newLeader}
                              </span>
                            </div>
                            <div>
                              <p className="text-xs text-slate-600 mb-2">Market Share Change:</p>
                              <div className="text-xs space-y-1">
                                {Object.entries(scenario.marketShareShift).map(([option, share]) => (
                                  <div key={option} className="flex justify-between">
                                    <span>{option}:</span>
                                    <span className="font-mono">{parseFloat(share.toString()).toFixed(1)}%</span>
                                  </div>
                                ))}
                              </div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Strengths, Weaknesses & Investment Areas */}
                {(results?.strengths && results.strengths.length > 0) || (results?.weaknesses && results.weaknesses.length > 0) || (results?.investmentAreas && results.investmentAreas.length > 0) ? (
                  <div className="grid md:grid-cols-3 gap-6">
                    {/* Strengths */}
                    {results?.strengths && results.strengths.length > 0 && (
                      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
                        <div className="flex items-center gap-2 mb-4">
                          <ShieldCheck className="w-5 h-5 text-green-600" />
                          <h4 className="text-lg font-bold text-slate-900">Competitive Strengths</h4>
                        </div>
                        <div className="space-y-3">
                          {results.strengths.map((strength, i) => (
                            <div key={i} className="p-3 bg-green-50 rounded-lg border border-green-200">
                              <div className="flex items-center justify-between mb-2">
                                <span className="font-semibold text-green-800 capitalize">{strength.criterion}</span>
                                <span className="bg-green-600 text-white px-2 py-1 rounded-full text-xs font-bold">{strength.score}/10</span>
                              </div>
                              <p className="text-green-700 text-xs font-medium">{strength.recommendation}</p>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Weaknesses */}
                    {results?.weaknesses && results.weaknesses.length > 0 && (
                      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
                        <div className="flex items-center gap-2 mb-4">
                          <AlertCircle className="w-5 h-5 text-red-600" />
                          <h4 className="text-lg font-bold text-slate-900">Critical Weaknesses</h4>
                        </div>
                        <div className="space-y-3">
                          {results.weaknesses.map((weakness, i) => (
                            <div key={i} className="p-3 bg-red-50 rounded-lg border border-red-200">
                              <div className="flex items-center justify-between mb-2">
                                <span className="font-semibold text-red-800 capitalize">{weakness.criterion}</span>
                                <span className="bg-red-600 text-white px-2 py-1 rounded-full text-xs font-bold">{weakness.score}/10</span>
                              </div>
                              <p className="text-red-700 text-xs font-medium">{weakness.recommendation}</p>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Investment Areas */}
                    {results?.investmentAreas && results.investmentAreas.length > 0 && (
                      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
                        <div className="flex items-center gap-2 mb-4">
                          <Target className="w-5 h-5 text-orange-600" />
                          <h4 className="text-lg font-bold text-slate-900">Investment Opportunities</h4>
                        </div>
                        <div className="space-y-3">
                          {results.investmentAreas.slice(0, 4).map((investment, i) => (
                            <div key={i} className="p-3 bg-orange-50 rounded-lg border border-orange-200">
                              <div className="flex items-center justify-between mb-2">
                                <span className="font-semibold text-orange-800 capitalize">{investment.criterion}</span>
                                <div className="flex items-center gap-2">
                                  <span className="text-xs text-slate-600">{investment.currentScore}→{investment.targetScore}</span>
                                  <span className={`px-2 py-1 rounded-full text-xs font-bold ${
                                    investment.priority === 'High' ? 'bg-red-600 text-white' :
                                    investment.priority === 'Medium' ? 'bg-yellow-600 text-white' :
                                    'bg-blue-600 text-white'
                                  }`}>
                                    {investment.priority}
                                  </span>
                                </div>
                              </div>
                              <p className="text-orange-700 text-xs font-medium">{investment.recommendation}</p>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                ) : null}

                {/* Confidence Metrics - TEMPORARILY DISABLED */}
                {/* {results?.confidenceMetrics && (
                  <div className="bg-white p-8 rounded-2xl border border-slate-200 shadow-sm">
                    <div className="flex items-center gap-2 mb-6">
                      <ShieldCheck className="w-5 h-5 text-indigo-600" />
                      <h4 className="text-lg font-bold text-slate-900">Analysis Confidence Metrics</h4>
                    </div>
                    <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                      {[
                        { key: 'overallScore', label: 'Overall', color: 'indigo' },
                        { key: 'dataQuality', label: 'Data Quality', color: 'green' },
                        { key: 'modelReliability', label: 'Model Reliability', color: 'blue' },
                        { key: 'marketStability', label: 'Market Stability', color: 'purple' },
                        { key: 'predictionAccuracy', label: 'Prediction Accuracy', color: 'orange' }
                      ].map(({ key, label, color }) => {
                        const score = results.confidenceMetrics[key as keyof typeof results.confidenceMetrics];
                        return (
                          <div key={key} className="text-center">
                            <div className="relative w-16 h-16 mx-auto mb-2">
                              <svg className="w-full h-full transform -rotate-90">
                                <circle cx="32" cy="32" r="28" stroke="#e2e8f0" strokeWidth="4" fill="none" />
                                <circle 
                                  cx="32" cy="32" r="28" 
                                  stroke="currentColor" 
                                  strokeWidth="4" 
                                  fill="none" 
                                  strokeDasharray={`${(score / 100) * 175.84} 175.84`}
                                  className={`transition-all duration-1000 ${
                                    score >= 80 ? 'text-green-500' : 
                                    score >= 60 ? `text-${color}-500` : 
                                    'text-orange-500'
                                  }`}
                                  strokeLinecap="round"
                                />
                              </svg>
                              <span className="absolute inset-0 flex items-center justify-center text-sm font-black text-slate-900">
                                {Math.round(score)}%
                              </span>
                            </div>
                            <p className="text-xs font-semibold text-slate-700">{label}</p>
                          </div>
                        );
                      })}
                    </div>
                    <div className="mt-6 p-4 bg-slate-50 rounded-lg">
                      <p className="text-sm text-slate-600">
                        <strong>Overall Confidence: {results.confidenceMetrics.overallScore.toFixed(1)}%</strong> - 
                        {results.confidenceMetrics.overallScore >= 80 ? ' High confidence analysis with reliable data and stable market conditions.' :
                         results.confidenceMetrics.overallScore >= 60 ? ' Moderate confidence with some uncertainty factors.' :
                         ' Lower confidence due to data limitations or market volatility. Consider gathering more data.'}
                      </p>
                    </div>
                  </div>
                )} */}

                {/* AI Advisory Report */}
                {advisory && (
                  <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
                    <div className="bg-slate-900 px-8 py-6 text-white">
                      <h2 className="text-2xl font-bold tracking-tight">Strategic Advisory Report</h2>
                      <div className="flex items-center gap-3 mt-2">
                        <span className="text-indigo-400 font-bold text-sm">{data.entityAName}</span>
                        {data.yourProduct && (
                          <>
                            <span className="text-slate-500">•</span>
                            <span className="text-emerald-400 font-bold text-sm">{data.yourProduct}</span>
                          </>
                        )}
                        <span className="text-slate-500">•</span>
                        <span className="text-slate-400 text-sm">{data.entityBName}</span>
                      </div>
                    </div>

                    <div className="p-8 space-y-8">
                      <section>
                        <h3 className="text-xs font-bold text-indigo-600 uppercase tracking-wide mb-3 flex items-center gap-2">
                          <FileText className="w-4 h-4" /> Executive Summary
                        </h3>
                        <p className="text-slate-800 leading-relaxed">{advisory.executiveSummary}</p>
                      </section>

                      <section>
                        <h3 className="text-xs font-bold text-emerald-600 uppercase tracking-wide mb-3 flex items-center gap-2">
                          <TrendingUp className="w-4 h-4" /> Strategic Advisory
                        </h3>
                        <p className="text-slate-800 leading-relaxed">{advisory.strategicAdvisory}</p>
                      </section>

                      <section>
                        <h3 className="text-xs font-bold text-orange-600 uppercase tracking-wide mb-3 flex items-center gap-2">
                          <AlertCircle className="w-4 h-4" /> Sensitivity Analysis
                        </h3>
                        <p className="text-slate-800 leading-relaxed">{advisory.sensitivityAnalysis}</p>
                      </section>

                      <section>
                        <h3 className="text-xs font-bold text-purple-600 uppercase tracking-wide mb-4 flex items-center gap-2">
                          <Target className="w-4 h-4" /> Action Recommendations
                        </h3>
                        <div className="space-y-3">
                          {advisory.recommendations.map((rec, i) => (
                            <div key={i} className="flex items-start gap-3 p-4 bg-slate-50 rounded-lg">
                              <div className="flex-shrink-0 w-6 h-6 bg-purple-600 text-white rounded-full flex items-center justify-center text-xs font-bold">
                                {i + 1}
                              </div>
                              <p className="text-slate-700 leading-relaxed">{rec}</p>
                            </div>
                          ))}
                        </div>
                      </section>

                      <div className="flex items-center justify-end pt-6 border-t border-slate-200">
                        <div className="text-sm text-slate-500">
                          Generated: <span className="font-semibold">{new Date().toLocaleDateString()}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
