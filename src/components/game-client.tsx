
'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { getNewPuzzle } from '@/app/actions';
import type { PuzzleContentOutput } from '@/ai/flows/generate-puzzle-content';
import { cn, shuffleArray } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { useToast } from '@/hooks/use-toast';
import { Loader2, Award, Star, Flame, BookCopy, Fingerprint, Search, RefreshCw, X } from 'lucide-react';
import { Skeleton } from './ui/skeleton';

type LetterSource = {
  char: string;
  id: number;
};

type AnswerLetter = {
  char: string;
  sourceId: number;
};

const ScoreCard = ({ title, value, icon }: { title: string; value: number; icon: React.ReactNode }) => (
  <div className="flex items-center gap-2 rounded-lg bg-card p-3 shadow-sm">
    {icon}
    <div>
      <p className="text-sm text-muted-foreground">{title}</p>
      <p className="text-xl font-bold">{value}</p>
    </div>
  </div>
);

export default function GameClient() {
  const [level, setLevel] = useState(1);
  const [score, setScore] = useState(0);
  const [streak, setStreak] = useState(0);
  const [puzzle, setPuzzle] = useState<PuzzleContentOutput | null>(null);
  const [scrambledLetters, setScrambledLetters] = useState<LetterSource[]>([]);
  const [userAnswer, setUserAnswer] = useState<AnswerLetter[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [hintsUsed, setHintsUsed] = useState({ firstLetter: false, category: false });
  const [feedback, setFeedback] = useState<'correct' | 'incorrect' | null>(null);
  const { toast } = useToast();

  const difficulty = useMemo(() => {
    if (level <= 5) return { name: 'Beginner', value: 5, bonus: 0 };
    if (level <= 15) return { name: 'Easy', value: 10, bonus: 10 };
    if (level <= 25) return { name: 'Medium', value: 20, bonus: 25 };
    return { name: 'Hard', value: 30, bonus: 50 };
  }, [level]);

  const fetchPuzzle = useCallback(async () => {
    setIsLoading(true);
    setFeedback(null);
    try {
      const newPuzzle = await getNewPuzzle(difficulty.value);
      setPuzzle(newPuzzle);
      const letters = newPuzzle.word.toUpperCase().split('');
      const letterSources = shuffleArray(letters).map((char, index) => ({ char, id: index }));
      setScrambledLetters(letterSources);
      setUserAnswer([]);
      setHintsUsed({ firstLetter: false, category: false });
    } catch (error) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: (error as Error).message,
      });
    } finally {
      setIsLoading(false);
    }
  }, [difficulty.value, toast]);

  useEffect(() => {
    fetchPuzzle();
  }, [fetchPuzzle]);

  const handleLetterClick = (letter: LetterSource) => {
    if (isSubmitting) return;
    setUserAnswer(prev => [...prev, { char: letter.char, sourceId: letter.id }]);
  };

  const handleAnswerLetterClick = (indexToRemove: number) => {
    if (isSubmitting) return;
    setUserAnswer(prev => prev.filter((_, index) => index !== indexToRemove));
  };
  
  const handleClear = () => {
    setUserAnswer([]);
  }

  const handleUseHint = (type: 'firstLetter' | 'category') => {
    if (hintsUsed[type]) return;
    
    let hintCost = 0;
    if (type === 'firstLetter') {
      setHintsUsed(prev => ({...prev, firstLetter: true}));
      hintCost = 15;
    } else if (type === 'category') {
      setHintsUsed(prev => ({...prev, category: true}));
      hintCost = 10;
    }

    setScore(prev => Math.max(0, prev - hintCost));
    toast({
      description: `Used a hint! -${hintCost} points.`,
    })
  };

  const handleSubmit = () => {
    if (!puzzle) return;
    setIsSubmitting(true);
    const submittedWord = userAnswer.map(l => l.char).join('');
    
    if (submittedWord === puzzle.word.toUpperCase()) {
      const pointsWon = 100 + difficulty.bonus - (hintsUsed.firstLetter ? 15 : 0) - (hintsUsed.category ? 10 : 0);
      const streakBonus = streak * 10;
      setScore(prev => prev + pointsWon + streakBonus);
      setStreak(prev => prev + 1);
      setLevel(prev => prev + 1);
      setFeedback('correct');
      toast({
          title: "Correct!",
          description: `+${pointsWon + streakBonus} points!`,
      });
      setTimeout(() => {
        fetchPuzzle();
        setIsSubmitting(false);
      }, 1500);
    } else {
      setFeedback('incorrect');
      setStreak(0);
      setScore(prev => Math.max(0, prev - 10));
       toast({
        variant: "destructive",
        title: "Incorrect",
        description: "Try again! (-10 points)",
      });
      setTimeout(() => {
        setFeedback(null);
        setIsSubmitting(false);
      }, 820);
    }
  };

  const usedLetterIds = useMemo(() => new Set(userAnswer.map(l => l.sourceId)), [userAnswer]);
  
  if (isLoading && !puzzle) {
    return (
      <div className="flex flex-col items-center gap-4 text-center">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
        <p className="font-headline text-2xl">Summoning a new mystery...</p>
        <p>Our best detectives are on the case.</p>
      </div>
    );
  }

  return (
    <div className="w-full max-w-4xl space-y-8">
      <header className="flex flex-col sm:flex-row justify-between items-center gap-4">
        <h1 className="text-4xl md:text-5xl font-headline text-primary drop-shadow-sm">Definition Detective</h1>
        <div className="grid grid-cols-3 gap-2 sm:gap-4">
            <ScoreCard title="Score" value={score} icon={<Star className="text-accent" />} />
            <ScoreCard title="Level" value={level} icon={<Award className="text-accent" />} />
            <ScoreCard title="Streak" value={streak} icon={<Flame className="text-accent" />} />
        </div>
      </header>
      
      <Card className="w-full shadow-2xl transition-all duration-500 animate-in fade-in">
        {isLoading ? (
           <div className="p-6 space-y-4">
             <Skeleton className="h-8 w-1/3" />
             <Skeleton className="h-4 w-1/4" />
             <Separator />
             <Skeleton className="h-6 w-full" />
             <Skeleton className="h-6 w-3/4" />
             <div className="h-12 mt-4" />
             <div className="flex flex-wrap gap-2 justify-center">
                {[...Array(7)].map((_, i) => <Skeleton key={i} className="h-12 w-12" />)}
             </div>
           </div>
        ) : puzzle && (
          <>
            <CardHeader>
              <CardTitle className="font-headline text-2xl flex items-center gap-2">
                <BookCopy /> Case File #{level}
              </CardTitle>
              <CardDescription>Difficulty: {difficulty.name}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div>
                <h3 className="font-bold text-lg mb-2">The Clue:</h3>
                <p className="text-muted-foreground italic text-lg">&ldquo;{puzzle.definition}&rdquo;</p>
              </div>

              <div className={cn("min-h-[7rem] bg-secondary/50 rounded-lg p-4 border-dashed border-2 flex items-center justify-center flex-wrap gap-2 transition-all", feedback === 'incorrect' && "animate-shake border-destructive")}>
                  {userAnswer.length > 0 ? (
                      userAnswer.map((letter, index) => (
                          <Button key={`${letter.sourceId}-${index}`} variant="secondary" size="lg" className="text-2xl font-bold cursor-pointer shadow-md" onClick={() => handleAnswerLetterClick(index)}>
                              {letter.char}
                          </Button>
                      ))
                  ) : (
                    <p className="text-muted-foreground">Click letters below to form your answer</p>
                  )}
              </div>

              <div className="flex flex-wrap gap-2 justify-center">
                {scrambledLetters.map((letter) => (
                    <Button 
                      key={letter.id} 
                      variant="outline" 
                      size="lg" 
                      className={cn("text-2xl font-bold shadow-sm", usedLetterIds.has(letter.id) && "opacity-25 scale-90")}
                      onClick={() => handleLetterClick(letter)}
                      disabled={usedLetterIds.has(letter.id) || isSubmitting}
                    >
                      {letter.char}
                    </Button>
                ))}
              </div>
              
              {(hintsUsed.firstLetter || hintsUsed.category) && <Separator />}

              <div className="flex flex-wrap gap-4 justify-center text-center">
                {hintsUsed.firstLetter && (
                    <div className="animate-in fade-in p-2 bg-accent/20 rounded-lg">
                        <p className="text-sm font-bold">First Letter</p>
                        <p className="text-2xl font-headline text-accent-foreground">{puzzle.firstLetterHint}</p>
                    </div>
                )}
                {hintsUsed.category && (
                    <div className="animate-in fade-in p-2 bg-accent/20 rounded-lg">
                        <p className="text-sm font-bold">Category</p>
                        <p className="text-xl font-headline text-accent-foreground">{puzzle.categoryHint}</p>
                    </div>
                )}
              </div>
            </CardContent>
            <CardFooter className="flex-col sm:flex-row gap-2 bg-secondary/30 p-4">
              <div className="flex gap-2">
                  <Button variant="ghost" onClick={() => handleUseHint('firstLetter')} disabled={hintsUsed.firstLetter || isSubmitting}>
                      <Fingerprint /> First Letter (-15)
                  </Button>
                  <Button variant="ghost" onClick={() => handleUseHint('category')} disabled={hintsUsed.category || isSubmitting}>
                      <Search /> Category (-10)
                  </Button>
              </div>
              <div className="flex-1" />
              <div className="flex gap-2">
                <Button variant="outline" onClick={handleClear} disabled={isSubmitting || userAnswer.length === 0}>
                    <X /> Clear
                </Button>
                <Button 
                    className="bg-accent text-accent-foreground hover:bg-accent/90"
                    onClick={handleSubmit} 
                    disabled={isSubmitting || userAnswer.length === 0}
                >
                    {isSubmitting && feedback === "correct" && "Correct!"}
                    {isSubmitting && feedback !== "correct" && <Loader2 className="animate-spin" />}
                    {!isSubmitting && "Submit Answer"}
                </Button>
              </div>
            </CardFooter>
          </>
        )}
      </Card>
    </div>
  );
}
