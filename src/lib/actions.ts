
'use server';

import { getApps, initializeApp, App } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import { ai } from '@/ai/genkit';
import { z } from 'genkit';
import { smartHintPrompt } from '@/ai/prompts';


// Helper function to initialize the admin app if it hasn't been already.
function initAdminApp(): App {
  if (getApps().length > 0) {
    return getApps()[0];
  }
  
  // The FIREBASE_CONFIG env var is set automatically by App Hosting.
  const firebaseConfig = JSON.parse(process.env.FIREBASE_CONFIG || '{}');
  
  return initializeApp({
      projectId: firebaseConfig.projectId,
  });
}

const SmartHintInputSchema = z.object({
  word: z.string(),
  incorrectGuesses: z.string(),
  lettersToReveal: z.number(),
});

type SmartHintInput = z.infer<typeof SmartHintInputSchema>;

export async function useHintAction(data: { userId: string } & SmartHintInput): Promise<{ success: boolean; message?: string; hint?: string; }> {
  try {
    initAdminApp();
    const firestore = getFirestore();
    const userProfileRef = firestore.collection('userProfiles').doc(data.userId);
    
    const result = await firestore.runTransaction(async (transaction) => {
      const userDoc = await transaction.get(userProfileRef);

      if (!userDoc.exists) {
        return { success: false, message: 'User profile not found.' };
      }

      const currentHints = userDoc.data()?.hints ?? 0;

      if (currentHints <= 0) {
        return { success: false, message: "You don't have any hints left." };
      }

      // Decrement the hints count by 1.
      transaction.update(userProfileRef, { hints: currentHints - 1 });
      
      return { success: true, message: 'Hint used successfully.' };
    });

    if (!result.success) {
        return { success: false, message: result.message };
    }

    // If transaction was successful, generate hint
    const { output } = await smartHintPrompt({
      word: data.word,
      incorrectGuesses: data.incorrectGuesses,
      lettersToReveal: data.lettersToReveal,
    });

    if (output?.hint) {
      return { success: true, hint: output.hint };
    }
    
    // Handle raw string response from AI
    if (typeof output === 'string') {
      try {
        const parsed = JSON.parse(output);
        if (parsed.hint) {
          return { success: true, hint: parsed.hint };
        }
      } catch {
         // fall through to error
      }
    }

    throw new Error('AI did not return a valid hint.');

  } catch (error: any) {
    console.error('Error in useHintAction:', error);
    return { success: false, message: error.message || 'An unexpected error occurred while getting a hint.' };
  }
}
