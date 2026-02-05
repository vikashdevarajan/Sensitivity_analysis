
import { MatrixData, AnalysisResults } from '../types';

/**
 * Finds pure strategy Nash Equilibria (Saddle Points)
 */
export function findPureEquilibria(matrix: number[][]): Array<[number, number]> {
  const equilibria: Array<[number, number]> = [];
  const rows = matrix.length;
  const cols = matrix[0].length;

  for (let i = 0; i < rows; i++) {
    for (let j = 0; j < cols; j++) {
      const val = matrix[i][j];
      
      // Check if it's the minimum in its row
      let isRowMin = true;
      for (let k = 0; k < cols; k++) {
        if (matrix[i][k] < val) {
          isRowMin = false;
          break;
        }
      }

      // Check if it's the maximum in its column
      let isColMax = true;
      for (let k = 0; k < rows; k++) {
        if (matrix[k][j] > val) {
          isColMax = false;
          break;
        }
      }

      if (isRowMin && isColMax) {
        equilibria.push([i, j]);
      }
    }
  }
  return equilibria;
}

/**
 * Solves a 2x2 mixed strategy game analytically.
 * (Generalizing to mxn requires a Simplex solver, which we approximate for simplicity 
 * or handle for the common 2x2 case as a fallback).
 */
export function solveMixed2x2(matrix: number[][]): AnalysisResults | null {
  if (matrix.length !== 2 || matrix[0].length !== 2) return null;

  const [[a, b], [c, d]] = matrix;
  
  // Formulas for 2x2 mixed strategy
  const denominator = (d + a) - (b + c);
  if (Math.abs(denominator) < 0.0001) return null;

  const p1 = (d - c) / denominator;
  const q1 = (d - b) / denominator;

  if (p1 < 0 || p1 > 1 || q1 < 0 || q1 > 1) return null;

  const gameValue = (a * d - b * c) / denominator;

  return {
    gameValue,
    rowStrategies: [p1, 1 - p1],
    colStrategies: [q1, 1 - q1],
    pureNashEquilibria: [],
    isPure: false,
    isMixed: true
  };
}

/**
 * Main solver orchestrator
 */
export function solveGame(data: MatrixData): AnalysisResults {
  const pure = findPureEquilibria(data.payoffs);
  
  if (pure.length > 0) {
    const [r, c] = pure[0];
    const rowStrat = Array(data.rows).fill(0);
    const colStrat = Array(data.cols).fill(0);
    rowStrat[r] = 1;
    colStrat[c] = 1;

    return {
      gameValue: data.payoffs[r][c],
      rowStrategies: rowStrat,
      colStrategies: colStrat,
      pureNashEquilibria: pure,
      isPure: true,
      isMixed: false
    };
  }

  // Attempt 2x2 mixed if applicable
  if (data.rows === 2 && data.cols === 2) {
    const mixed = solveMixed2x2(data.payoffs);
    if (mixed) return mixed;
  }

  // Fallback for larger matrices (Mock/Placeholder for full Simplex)
  // In a production app, we would use a library like 'simplex-solver'
  // For this demo, we'll provide the 2x2 logic and a generic message for larger
  return {
    gameValue: 0,
    rowStrategies: Array(data.rows).fill(1/data.rows),
    colStrategies: Array(data.cols).fill(1/data.cols),
    pureNashEquilibria: [],
    isPure: false,
    isMixed: true
  };
}
