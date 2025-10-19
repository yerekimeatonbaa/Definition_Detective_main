
'use server';

import { generatePuzzleContent, type PuzzleContentOutput } from '@/ai/flows/generate-puzzle-content';

export async function getNewPuzzle(difficulty: number): Promise<PuzzleContentOutput> {
  try {
    const puzzle = await generatePuzzleContent({ difficulty });
    return puzzle;
  } catch (error) {
    console.error("Error generating puzzle:", error);
    throw new Error("Failed to generate a new puzzle. Please try again.");
  }
}
