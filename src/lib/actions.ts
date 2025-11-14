
'use server';

import { getApps, initializeApp, App } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import { ai } from '@/ai/genkit';
import { googleAI } from '@genkit-ai/google-genai';
import { z } from 'zod';

// Helper function to initialize the admin app if it hasn't been already.
function initAdminApp(): App {
  const firebaseConfig = process.env.FIREBASE_CONFIG ? JSON.parse(process.env.FIREBASE_CONFIG) : {};
  if (getApps().length > 0) {
    // Check for the default app, and if not found, check for 'admin-app'
    return getApps().find(app => app.name === '[DEFAULT]') || getApps().find(app => app.name === 'admin-app') || initializeApp(firebaseConfig, 'admin-app');
  }
  return initializeApp(firebaseConfig, 'admin-app');
}

export async function useHintAction(data: { 
  userId: string;
  word: string;
  incorrectGuesses: string;
  lettersToReveal: number;
}): Promise<{ success: boolean; message?: string; hint?: string; }> {
  try {
    initAdminApp();
    const firestore = getFirestore();
    const userProfileRef = firestore.collection('userProfiles').doc(data.userId);

    // First, run a transaction to securely decrement the hint count.
    const transactionResult = await firestore.runTransaction(async (transaction) => {
      const userDoc = await transaction.get(userProfileRef);

      if (!userDoc.exists) {
        throw new Error('User profile not found.');
      }

      const currentHints = userDoc.data()?.hints ?? 0;

      if (currentHints <= 0) {
        return { success: false, message: "You don't have any hints left." };
      }

      // Decrement the hints count by 1.
      transaction.update(userProfileRef, { hints: currentHints - 1 });
      
      return { success: true };
    });

    // If the transaction failed (e.g., not enough hints), return the error.
    if (!transactionResult.success) {
        return { success: false, message: transactionResult.message };
    }

    // If the transaction was successful, proceed to generate the AI hint directly.
    const hintResponse = await ai.generate({
        model: googleAI('gemini-1.5-flash'),
        prompt: `
            You are an AI assistant helping with smart word puzzle hints.

            Word: "${data.word}"
            Incorrect guesses: "${data.incorrectGuesses}"
            Letters to reveal: "${data.lettersToReveal}"

            Rules:
            - Reveal ONLY the requested number of letters.
            - Do NOT reveal letters in incorrect guesses.
            - Other letters must remain "_".
            - Return ONLY a valid JSON object with a "hint" key. Example: { "hint": "e_a__p_e" }

            Produce the hint now.
        `,
        output: {
            schema: z.object({
                hint: z.string(),
            }),
        },
        config: {
            responseMIMEType: 'application/json',
        }
    });

    const hintOutput = hintResponse.output;

    if (hintOutput?.hint) {
      return { success: true, hint: hintOutput.hint };
    }
    
    throw new Error('AI did not return a valid hint format.');

  } catch (error: any) {
    console.error('Error in useHintAction:', error);
    return { success: false, message: error.message || 'An unexpected error occurred while getting a hint.' };
  }
}
