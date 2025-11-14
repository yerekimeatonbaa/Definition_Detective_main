
'use server';

import { getApps, initializeApp, App } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import { smartHintPrompt } from '@/ai/prompts';

// Helper function to initialize the admin app if it hasn't been already.
function initAdminApp(): App {
  const firebaseConfig = process.env.FIREBASE_CONFIG ? JSON.parse(process.env.FIREBASE_CONFIG) : {};
  if (getApps().length > 0) {
    return getApps().find(app => app.name === 'admin-app') || initializeApp(firebaseConfig, 'admin-app');
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
        return { success: false, message: 'User profile not found.' };
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

    // If the transaction was successful, proceed to generate the AI hint.
    const { output } = await smartHintPrompt({
      word: data.word,
      incorrectGuesses: data.incorrectGuesses,
      lettersToReveal: data.lettersToReveal,
    });

    if (output?.hint) {
      return { success: true, hint: output.hint };
    }
    
    // Handle cases where the AI might return a raw string that is valid JSON
    if (typeof output === 'string') {
      try {
        const parsed = JSON.parse(output);
        if (parsed.hint) {
          return { success: true, hint: parsed.hint };
        }
      } catch {
         // Fall through to the final error if parsing fails
      }
    }

    // If we reach here, the AI response was not in the expected format.
    throw new Error('AI did not return a valid hint format.');

  } catch (error: any) {
    console.error('Error in useHintAction:', error);
    return { success: false, message: error.message || 'An unexpected error occurred while getting a hint.' };
  }
}
