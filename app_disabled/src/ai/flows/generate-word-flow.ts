
'use server';
/**
Â * @fileOverview A flow to generate a word and its definition for the game.
Â *
Â * - generateWord - A function that generates a new word puzzle.
Â * - GenerateWordInput - The input type for the generateWord function.
Â * - GenerateWordOutput - The return type for the generateWord function.
Â */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';
import {googleAI} from '@genkit-ai/google-genai';

const GenerateWordInputSchema = z.object({
Â  difficulty: z
Â  Â  .enum(['easy', 'medium', 'hard'])
Â  Â  .describe('The difficulty level for the word to be generated.'),
});
export type GenerateWordInput = z.infer<typeof GenerateWordInputSchema>;

const GenerateWordOutputSchema = z.object({
Â  word: z.string().describe('The generated word.'),
Â  definition: z.string().describe('The definition of the generated word.'),
});
export type GenerateWordOutput = z.infer<typeof GenerateWordOutputSchema>;

export async function generateWord(
Â  input: GenerateWordInput
): Promise<GenerateWordOutput> {
Â  return generateWordFlow(input);
}

const prompt = ai.definePrompt({
Â  name: 'generateWordPrompt',
Â  input: {schema: GenerateWordInputSchema},
Â  output: {schema: GenerateWordOutputSchema},
  model: googleAI.model('gemini-1.5-pro'),
Â  prompt: `You are an expert lexicographer and puzzle master for a word game.

Your task is to generate a single word and its corresponding definition based on the requested difficulty level. The word should be challenging but fair for the given level.

Difficulty: {{{difficulty}}}

The definition should be clear, concise, and in a dictionary style. Avoid overly obscure words unless the difficulty is 'hard'.

Produce the JSON response now.`,
});

const generateWordFlow = ai.defineFlow(
Â  {
Â  Â  name: 'generateWordFlow',
Â  Â  inputSchema: GenerateWordInputSchema,
Â  Â  outputSchema: GenerateWordOutputSchema,
Â  },
Â  async input => {
    const {output} = await prompt(input);
Â  Â  if (!output) {
Â  Â  Â  throw new Error('Failed to generate word from AI.');
Â  Â  }
Â  Â  return output;
Â  }
);
