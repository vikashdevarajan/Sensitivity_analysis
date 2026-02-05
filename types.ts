
export interface MatrixData {
  rows: number;
  cols: number;
  rowLabels: string[];
  colLabels: string[];
  payoffs: number[][];
  entityAName: string;
  entityBName: string;
  yourProduct?: string;
  weights?: WeightSet;
}

export interface WeightSet {
  fuel: number;
  safety: number;
  tech: number;
  service: number;
  price: number;
}

export interface ConfidenceMetrics {
  overallScore: number;
  dataQuality: number;
  modelReliability: number;
  marketStability: number;
  predictionAccuracy: number;
}

export interface ScenarioResult {
  scenarioName: string;
  weightChanges: Record<string, number>;
  newLeader: string;
  marketShareShift: Record<string, number>;
  impactScore: number;
}

export interface Strength {
  criterion: string;
  score: number;
  recommendation: string;
}

export interface Weakness {
  criterion: string;
  score: number;
  competitorBest: number;
  gap: number;
  recommendation: string;
}

export interface InvestmentArea {
  criterion: string;
  currentScore: number;
  targetScore: number;
  priority: string;
  recommendation: string;
}

export interface YourProductAnalysis {
  yourProduct: string;
  yourScore: number;
  yourShare: number;
  yourRank: number;
  totalProducts: number;
  position: string;
  positionDetail: string;
  marketLeader: string;
  gapToLeader: number;
  aheadOf: string[];
  behind: string[];
  isLeader: boolean;
}

export interface AnalysisResults {
  baseScores: Record<string, number>;
  optimalChoice: string;
  marketShare: Record<string, number>;
  tippingPoints: Array<{
    criterion: string;
    weightChange: number;
    newWeight: number;
    previousLeader: string;
    newLeader: string;
    scoreChange: number;
    marketImpact: string;
  }>;
  riskAssessment: {
    level: string;
    factors: string[];
    recommendation: string;
  };
  stabilityIndex: number;
  competitiveGaps: Record<string, Record<string, number>>;
  confidenceMetrics?: ConfidenceMetrics;
  scenarioAnalysis?: ScenarioResult[];
  criteriaSensitivity?: Record<string, number>;
  productContext?: Record<string, string>;
  strengths?: Strength[];
  weaknesses?: Weakness[];
  investmentAreas?: InvestmentArea[];
  yourProductAnalysis?: YourProductAnalysis;
}

export interface AdvisoryReport {
  executiveSummary: string;
  strategicAdvisory: string;
  sensitivityAnalysis: string;
  recommendations: string[];
  selfReportedGameValue?: number;
  internalReasoningScore: number;
}

export interface ConfidenceBreakdown {
  score: number;
  alignment: number;
  sensitivity: number;
  probability: number;
  inputQuality: number;
}
