
import 'dotenv/config';
import { useHintAction } from '@/lib/actions';

async function testSmartHint() {
  const result = await useHintAction({
    word: 'example',
    incorrectGuesses: 'xyz',
    lettersToReveal: 2,
    isFree: true // Test as a free hint to bypass user auth
  });

  console.log('ðŸ§  Smart Hint Output:', result);
}

testSmartHint().catch(console.error);
