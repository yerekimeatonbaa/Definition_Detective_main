'use server';
/**
 * @fileOverview Generates hints for the Definition Detective word puzzle game.
 *
 * - generateHints - A function that generates hints for a given word.
 * - GenerateHintsInput - The input type for the generateHints function.
 * - GenerateHintsOutput - The return type for the generateHints function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const GenerateHintsInputSchema = z.object({
  word: z.string().describe('The word to generate hints for.'),
  definition: z.string().describe('The definition of the word.'),
});
export type GenerateHintsInput = z.infer<typeof GenerateHintsInputSchema>;

const GenerateHintsOutputSchema = z.object({
  categoryHint: z.string().describe('A category hint for the word.'),
});
export type GenerateHintsOutput = z.infer<typeof GenerateHintsOutputSchema>;

export async function generateHints(input: GenerateHintsInput): Promise<GenerateHintsOutput> {
  return generateHintsFlow(input);
}

const prompt = ai.definePrompt({
  name: 'generateHintsPrompt',
  input: {schema: GenerateHintsInputSchema},
  output: {schema: GenerateHintsOutputSchema},
  prompt: `You are a helpful assistant designed to provide hints for a word puzzle game.

  The game provides the definition for a word, and players need to guess the word.

  Your job is to provide a category hint for the word. The category hint should be a single word or short phrase that describes the category or type of the word.

  For example, if the word is "apple" and the definition is "a round fruit with red, green, or yellow skin and white flesh", then a good category hint would be "fruit".

  Word: {{{word}}}
  Definition: {{{definition}}}

  Category Hint:`, // Intentionally left open-ended for the category hint.
});

const generateHintsFlow = ai.defineFlow(
  {
    name: 'generateHintsFlow',
    inputSchema: GenerateHintsInputSchema,
    outputSchema: GenerateHintsOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
