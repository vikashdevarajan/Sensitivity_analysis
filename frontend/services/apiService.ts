import { MatrixData, AnalysisResults, AdvisoryReport } from '../types';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

interface GameAnalysisResponse {
  results: AnalysisResults;
  advisory: AdvisoryReport;
}

export class ApiService {
  private static async fetchWithErrorHandling<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    try {
      const response = await fetch(`${API_URL}${endpoint}`, {
        headers: {
          'Content-Type': 'application/json',
          ...options.headers,
        },
        ...options,
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => null);
        throw new Error(
          errorData?.detail || `HTTP ${response.status}: ${response.statusText}`
        );
      }

      return await response.json();
    } catch (error) {
      if (error instanceof Error) {
        throw error;
      }
      throw new Error('An unexpected error occurred');
    }
  }

  static async healthCheck(): Promise<{ status: string; service: string }> {
    return this.fetchWithErrorHandling<{ status: string; service: string }>('/health');
  }

  static async analyzeGame(matrixData: MatrixData): Promise<GameAnalysisResponse> {
    return this.fetchWithErrorHandling<GameAnalysisResponse>('/analyze', {
      method: 'POST',
      body: JSON.stringify({ matrixData }),
    });
  }
}

// Convenience functions for backward compatibility
export async function solveGame(data: MatrixData): Promise<AnalysisResults> {
  const response = await ApiService.analyzeGame(data);
  return response.results;
}

export async function generateAdvisory(data: MatrixData, results: AnalysisResults): Promise<AdvisoryReport> {
  const response = await ApiService.analyzeGame(data);
  return response.advisory;
}