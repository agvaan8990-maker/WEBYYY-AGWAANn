/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Trophy, ArrowRight, RotateCcw, HelpCircle, Sparkles, Heart, Flame, Timer, AlertCircle, Save, CheckCircle2, XCircle } from "lucide-react";
import { sound } from "../utils/audio";
import { collection, addDoc, getDocs, query, orderBy, limit, serverTimestamp } from "firebase/firestore";
import { db } from "../firebase";
import quizData from "../data.json";

interface EmojiQuestion {
  id: number;
  emojis?: string;
  answer: string;
  options: string[];
  mnHint: string;
  enHint: string;
  image: string;
}

const EMOJI_QUESTIONS: EmojiQuestion[] = quizData.emojiQuestions;
const CHARACTER_QUESTIONS: EmojiQuestion[] = quizData.characterQuestions;

const ANIME_ALIASES: Record<string, string[]> = {
  "One Piece": ["one piece", "onepiece", "op"],
  "Naruto": ["naruto", "naruto shippuden"],
  "Demon Slayer": ["demon slayer", "demonslayer", "kimetsu no yaiba", "kimetsu"],
  "Dragon Ball": ["dragon ball", "dragonball", "dbz", "dragon ball z", "dragonball z"],
  "Death Note": ["death note", "deathnote"],
  "Attack on Titan": ["attack on titan", "attackontitan", "aot", "shingeki no kyojin", "shingeki"],
  "Jujutsu Kaisen": ["jujutsu kaisen", "jujutsukaisen", "jjk"],
  "Hunter x Hunter": ["hunter x hunter", "hunterxhunter", "hxh"],
  "My Hero Academia": ["my hero academia", "myheroacademia", "mha", "boku no hero academia"],
  "Fullmetal Alchemist": ["fullmetal alchemist", "fullmetalalchemist", "fma", "fmab"]
};

const ALL_UNIQUE_ANSWERS = Array.from(
  new Set(EMOJI_QUESTIONS.map((q) => q.answer))
).sort();

const isCorrectAnswer = (typed: string, correct: string) => {
  const t = typed.trim().toLowerCase();
  const c = correct.trim().toLowerCase();
  
  if (t === c) return true;
  
  // Check in normalization
  const normT = t.replace(/[^a-z0-9]/g, "");
  const normC = c.replace(/[^a-z0-9]/g, "");
  if (normT === normC && normT.length > 2) return true;
  
  // Check aliases
  const aliases = ANIME_ALIASES[correct];
  if (aliases) {
    if (aliases.some(alias => alias.trim().toLowerCase() === t || alias.trim().toLowerCase().replace(/[^a-z0-9]/g, "") === normT)) {
      return true;
    }
  }
  
  return false;
};

interface SessionAnswer {
  questionId: number;
  answerText: string;
  correctAnswer: string;
  isCorrect: boolean;
}

interface Props {
  lang: "mn" | "en";
  soundEnabled?: boolean;
}

export function EmojiAnimeGuesser({ lang, soundEnabled = true }: Props) {
  // Game Modes: "selection" | "emoji" | "character" | "leaderboard"
  const [gameMode, setGameMode] = useState<"selection" | "emoji" | "character" | "leaderboard">("selection");
  const [currIdx, setCurrIdx] = useState<number>(0);
  const [typedAnswer, setTypedAnswer] = useState<string>("");
  const [selectedOpt, setSelectedOpt] = useState<string | null>(null);
  const [isCorrect, setIsCorrect] = useState<boolean>(false);
  const [isAnswered, setIsAnswered] = useState<boolean>(false);
  const [score, setScore] = useState<number>(0);
  const [lives, setLives] = useState<number>(3);
  const [streak, setStreak] = useState<number>(0);
  const [correctCount, setCorrectCount] = useState<number>(0);
  const [timeLeft, setTimeLeft] = useState<number>(15);
  const [hasStreakBonus, setHasStreakBonus] = useState<boolean>(false);
  const [gameFinished, setGameFinished] = useState<boolean>(false);
  const [showHint, setShowHint] = useState<boolean>(false);
  const [isTimedOut, setIsTimedOut] = useState<boolean>(false);

  // Score Saving states
  const [playerName, setPlayerName] = useState<string>("");
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [isSubmitted, setIsSubmitted] = useState<boolean>(false);
  const [sessionAnswers, setSessionAnswers] = useState<SessionAnswer[]>([]);

  // Leaderboard states
  const [leaderboard, setLeaderboard] = useState<any[]>([]);
  const [loadingLeaderboard, setLoadingLeaderboard] = useState<boolean>(false);

  const currentQuestions = gameMode === "emoji" ? EMOJI_QUESTIONS : CHARACTER_QUESTIONS;
  const question = currentQuestions[currIdx];

  // 15-Second Timer Countdown
  useEffect(() => {
    if (isAnswered || gameFinished || gameMode === "selection" || gameMode === "leaderboard") return;

    setTimeLeft(15);
    setIsTimedOut(false);

    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          // Timeout counts as incorrect
          setIsAnswered(true);
          setIsTimedOut(true);
          setIsCorrect(false);
          setStreak(0);

          setSessionAnswers(prevAns => [
            ...prevAns,
            {
              questionId: question.id,
              answerText: "[TIMEOUT]",
              correctAnswer: question.answer,
              isCorrect: false
            }
          ]);

          setLives((l) => {
            const nextL = l - 1;
            if (nextL <= 0) {
              setGameFinished(true);
              if (soundEnabled) sound.playFail();
            } else {
              if (soundEnabled) sound.playBuzz();
            }
            return nextL;
          });
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [currIdx, isAnswered, gameFinished, soundEnabled, gameMode, question]);

  const handleCheckAnswer = (answerToSubmit?: string) => {
    if (isAnswered) return;
    const finalAnswer = answerToSubmit !== undefined ? answerToSubmit : typedAnswer;
    if (!finalAnswer.trim()) return;

    setIsAnswered(true);
    const correct = isCorrectAnswer(finalAnswer, question.answer);
    setIsCorrect(correct);

    setSessionAnswers(prev => [
      ...prev,
      {
        questionId: question.id,
        answerText: finalAnswer,
        correctAnswer: question.answer,
        isCorrect: correct
      }
    ]);

    if (correct) {
      if (soundEnabled) sound.playDing();
      setScore((prev) => prev + 10);
      setCorrectCount((prev) => prev + 1);
      
      // Streak tracking
      setStreak((prev) => {
        const nextStreak = prev + 1;
        if (nextStreak === 3) {
          // Add +20 bonus points
          setScore((s) => s + 20);
          setHasStreakBonus(true);
          if (soundEnabled) sound.playLevelUp();
          setTimeout(() => setHasStreakBonus(false), 2200);
          return 0; // reset streak after award
        }
        return nextStreak;
      });
    } else {
      if (soundEnabled) sound.playBuzz();
      setStreak(0);
      setLives((prev) => {
        const nextL = prev - 1;
        if (nextL <= 0) {
          setGameFinished(true);
          if (soundEnabled) sound.playFail();
        }
        return nextL;
      });
    }
  };

  const handleCheckAnswerCharacter = (selectedOption: string) => {
    if (isAnswered) return;
    setSelectedOpt(selectedOption);
    setIsAnswered(true);

    const correct = (selectedOption === question.answer);
    setIsCorrect(correct);

    setSessionAnswers(prev => [
      ...prev,
      {
        questionId: question.id,
        answerText: selectedOption,
        correctAnswer: question.answer,
        isCorrect: correct
      }
    ]);

    if (correct) {
      if (soundEnabled) sound.playDing();
      setScore((prev) => prev + 10);
      setCorrectCount((prev) => prev + 1);
      
      // Streak tracking
      setStreak((prev) => {
        const nextStreak = prev + 1;
        if (nextStreak === 3) {
          // Add +20 bonus points
          setScore((s) => s + 20);
          setHasStreakBonus(true);
          if (soundEnabled) sound.playLevelUp();
          setTimeout(() => setHasStreakBonus(false), 2200);
          return 0; // reset streak after award
        }
        return nextStreak;
      });
    } else {
      if (soundEnabled) sound.playBuzz();
      setStreak(0);
      setLives((prev) => {
        const nextL = prev - 1;
        if (nextL <= 0) {
          setGameFinished(true);
          if (soundEnabled) sound.playFail();
        }
        return nextL;
      });
    }
  };

  const handleNext = () => {
    setTypedAnswer("");
    setSelectedOpt(null);
    setIsCorrect(false);
    setIsAnswered(false);
    setShowHint(false);
    setIsTimedOut(false);

    if (currIdx < currentQuestions.length - 1) {
      setCurrIdx((prev) => prev + 1);
      if (soundEnabled) sound.playBeep();
    } else {
      if (soundEnabled) sound.playLevelUp();
      setGameFinished(true);
    }
  };

  const handleRestart = () => {
    setCurrIdx(0);
    setTypedAnswer("");
    setSelectedOpt(null);
    setIsCorrect(false);
    setIsAnswered(false);
    setScore(0);
    setLives(3);
    setStreak(0);
    setCorrectCount(0);
    setTimeLeft(15);
    setHasStreakBonus(false);
    setGameFinished(false);
    setShowHint(false);
    setIsTimedOut(false);
    setIsSubmitted(false);
    setPlayerName("");
    setSessionAnswers([]);
    if (soundEnabled) sound.playLevelUp();
  };

  const fetchLeaderboard = async () => {
    setLoadingLeaderboard(true);
    try {
      const scoresCol = collection(db, "scores");
      const q = query(scoresCol, orderBy("score", "desc"), limit(10));
      const querySnapshot = await getDocs(q);
      const list = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setLeaderboard(list);
    } catch (error) {
      console.error("Error fetching leaderboard:", error);
    } finally {
      setLoadingLeaderboard(false);
    }
  };

  const handleSaveScore = async () => {
    if (!playerName.trim()) return;
    setIsSubmitting(true);
    try {
      const scoresCol = collection(db, "scores");
      await addDoc(scoresCol, {
        playerName: playerName.trim(),
        score: score,
        correctCount: correctCount,
        totalQuestions: currentQuestions.length,
        mode: gameMode,
        answers: sessionAnswers.map(ans => ({
          questionId: ans.questionId,
          answerText: ans.answerText,
          correctAnswer: ans.correctAnswer,
          isCorrect: ans.isCorrect
        })),
        timestamp: new Date().toISOString()
      });
      setIsSubmitted(true);
      if (soundEnabled) sound.playLevelUp();
      fetchLeaderboard();
      setGameMode("leaderboard");
    } catch (err) {
      console.error("Failed to save score:", err);
    } finally {
      setIsSubmitting(false);
    }
  };

  // RENDER METHOD 1: Game Selection screen
  if (gameMode === "selection") {
    return (
      <div className="w-full rounded-[32px] border border-white/15 bg-black/40 p-6 sm:p-8 liquid-glass relative overflow-hidden flex flex-col justify-center items-center min-h-[580px] shadow-2xl gap-8 text-center">
        <div 
          className="absolute inset-0 opacity-[0.03] pointer-events-none"
          style={{
            backgroundImage: `radial-gradient(circle, var(--color-neon) 1.2px, transparent 1.2px)`,
            backgroundSize: "20px 20px"
          }}
        />
        <div className="relative z-10">
          <span className="text-[#6FFF00] text-[10px] font-bold tracking-[0.3em] uppercase block mb-2">
            {lang === "mn" ? "🔮 АНИМЕ СТАНЦ" : "🔮 ANIME STATION"}
          </span>
          <h3 className="font-grotesk text-3xl sm:text-4xl text-cream uppercase tracking-wider leading-none">
            {lang === "mn" ? "ТААВАР ТОГЛООМ" : "ANIME QUIZ PORTAL"}
          </h3>
          <p className="text-xs sm:text-sm text-cream/70 font-mono uppercase mt-3 max-w-md mx-auto">
            {lang === "mn" 
              ? "Аниме ертөнцөөр аялж, өөрийн мэдлэгээ сориорой! Горимоо сонгоно уу:" 
              : "Test your otaku skills! Select a station sub-mission below:"}
          </p>
        </div>

        {/* Game Mode Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 w-full max-w-lg relative z-10">
          {/* Option A: Emoji Guesser */}
          <button
            onClick={() => {
              setGameMode("emoji");
              handleRestart();
            }}
            className="p-5 rounded-2xl border border-white/10 bg-white/[0.02] hover:bg-[#6FFF00]/10 hover:border-[#6FFF00]/40 transition-all duration-300 text-left group cursor-pointer flex flex-col justify-between min-h-[160px]"
          >
            <div>
              <div className="text-2xl mb-2">🏴‍☠️ 🦊 👹</div>
              <h4 className="font-grotesk text-base sm:text-lg text-cream group-hover:text-[#6FFF00] transition-colors uppercase font-bold">
                {lang === "mn" ? "Эможи Таавар" : "Emoji Guesser"}
              </h4>
              <p className="text-[10px] text-cream/50 mt-1 uppercase font-mono leading-normal">
                {lang === "mn" ? "Эможи болон зургуудаар аниме нэрсийг бичих" : "Type anime names based on customized visual emojis"}
              </p>
            </div>
            <span className="text-[10px] text-[#6FFF00] font-bold tracking-widest mt-4 block font-mono">
              {lang === "mn" ? "ЭХЛЭХ →" : "START MISSION →"}
            </span>
          </button>

          {/* Option B: Character Guesser */}
          <button
            onClick={() => {
              setGameMode("character");
              handleRestart();
            }}
            className="p-5 rounded-2xl border border-white/10 bg-white/[0.02] hover:bg-[#6FFF00]/10 hover:border-[#6FFF00]/40 transition-all duration-300 text-left group cursor-pointer flex flex-col justify-between min-h-[160px]"
          >
            <div>
              <div className="text-2xl mb-2">🦸‍♂️ ⚡ 🥋</div>
              <h4 className="font-grotesk text-base sm:text-lg text-cream group-hover:text-[#6FFF00] transition-colors uppercase font-bold">
                {lang === "mn" ? "Баатрын Дүр" : "Hero Character"}
              </h4>
              <p className="text-[10px] text-cream/50 mt-1 uppercase font-mono leading-normal">
                {lang === "mn" ? "Дуртай баатрын зургийг хараад нэрийг 4 сонголтоос таах" : "Identify popular anime heroes from high quality artwork"}
              </p>
            </div>
            <span className="text-[10px] text-[#6FFF00] font-bold tracking-widest mt-4 block font-mono">
              {lang === "mn" ? "ЭХЛЭХ →" : "START MISSION →"}
            </span>
          </button>
        </div>

        {/* Leaderboard button */}
        <button
          onClick={() => {
            setGameMode("leaderboard");
            fetchLeaderboard();
            if (soundEnabled) sound.playBeep();
          }}
          className="px-6 py-3 rounded-xl border border-white/10 hover:border-[#6FFF00]/30 hover:bg-[#6FFF00]/5 text-cream hover:text-[#6FFF00] font-bold text-xs uppercase tracking-widest cursor-pointer transition-all flex items-center gap-2 relative z-10"
        >
          <Trophy className="w-4 h-4 text-yellow-500" />
          <span>{lang === "mn" ? "ОНООНЫ САМБАР ХАРАХ" : "VIEW LEADERBOARD"}</span>
        </button>
      </div>
    );
  }

  // RENDER METHOD 2: Leaderboard Screen
  if (gameMode === "leaderboard") {
    return (
      <div className="w-full rounded-[32px] border border-white/15 bg-black/40 p-6 sm:p-8 liquid-glass relative overflow-hidden flex flex-col justify-between min-h-[580px] shadow-2xl">
        <div 
          className="absolute inset-0 opacity-[0.03] pointer-events-none"
          style={{
            backgroundImage: `radial-gradient(circle, var(--color-neon) 1.2px, transparent 1.2px)`,
            backgroundSize: "20px 20px"
          }}
        />

        <div className="relative z-10 w-full flex-1 flex flex-col">
          {/* Header */}
          <div className="flex justify-between items-center border-b border-white/10 pb-4 mb-5">
            <div className="flex flex-col gap-1">
              <span className="text-[10px] text-neon uppercase font-mono tracking-widest block font-extrabold">
                🏆 {lang === "mn" ? "ОНООНЫ САМБАР" : "STATION LEADERBOARD"}
              </span>
              <h3 className="font-grotesk text-xl text-cream uppercase tracking-wider font-bold">
                {lang === "mn" ? "ШИЛДЭГ 10 ТОГЛОГЧИД" : "TOP 10 PILOTS"}
              </h3>
            </div>
            <button
              onClick={() => setGameMode("selection")}
              className="px-3 py-1.5 rounded-lg border border-white/10 hover:border-white/20 bg-white/5 text-[10px] text-cream uppercase tracking-wide font-mono transition-all cursor-pointer"
            >
              {lang === "mn" ? "БУЦАХ" : "BACK"}
            </button>
          </div>

          {/* Scores table */}
          {loadingLeaderboard ? (
            <div className="flex-1 flex flex-col justify-center items-center py-12">
              <div className="w-8 h-8 rounded-full border-2 border-t-[#6FFF00] border-white/10 animate-spin mb-4" />
              <span className="text-[10px] font-mono text-cream/50 uppercase tracking-widest animate-pulse">
                {lang === "mn" ? "АЧААЛЖ БАЙНА..." : "SYNCING DATA..."}
              </span>
            </div>
          ) : leaderboard.length === 0 ? (
            <div className="flex-1 flex flex-col justify-center items-center py-12 text-center">
              <span className="text-4xl mb-4">👑</span>
              <span className="text-xs font-mono text-cream/50 uppercase tracking-widest block mb-1">
                {lang === "mn" ? "ОНОО ХАДГАЛАГДААГҮЙ БАЙНА" : "NO RANKS REGISTERED"}
              </span>
              <span className="text-[10px] font-mono text-cream/30 uppercase tracking-wider max-w-xs leading-relaxed">
                {lang === "mn" ? "Эхний тоглолтоо амжилттай дуусгаж рекорд хадгалаарай!" : "Complete a quiz run and register your score to load the grid!"}
              </span>
            </div>
          ) : (
            <div className="flex-1 flex flex-col gap-2 my-2 overflow-y-auto max-h-[360px] pr-1">
              {leaderboard.map((item, index) => {
                const isTop3 = index < 3;
                const medal = index === 0 ? "🥇" : index === 1 ? "🥈" : index === 2 ? "🥉" : `${index + 1}`;
                
                return (
                  <div
                    key={item.id || index}
                    className={`flex items-center justify-between p-3 rounded-xl border transition-all duration-300 ${
                      isTop3
                        ? "bg-white/[0.03] border-white/10 hover:border-[#6FFF00]/25"
                        : "bg-white/[0.01] border-white/5 hover:border-white/10"
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div className={`w-7 h-7 rounded-lg flex items-center justify-center font-mono text-xs font-extrabold ${
                        index === 0 ? "bg-yellow-500/10 text-yellow-400 border border-yellow-500/20" :
                        index === 1 ? "bg-slate-400/10 text-slate-300 border border-slate-400/20" :
                        index === 2 ? "bg-amber-600/10 text-amber-500 border border-amber-600/20" :
                        "bg-white/5 text-cream/50 border border-white/5"
                      }`}>
                        {medal}
                      </div>

                      <div>
                        <span className="font-grotesk text-xs sm:text-sm text-cream font-bold block uppercase tracking-wide">
                          {item.playerName}
                        </span>
                        <span className="text-[8px] font-mono text-cream/40 uppercase tracking-widest">
                          {item.mode === "character" ? (lang === "mn" ? "Баатрын дүр" : "Hero character") : (lang === "mn" ? "Эможи таавар" : "Emoji puzzle")}
                        </span>
                      </div>
                    </div>

                    <div className="text-right">
                      <span className="font-mono font-extrabold text-xs sm:text-sm text-[#6FFF00] block">
                        {item.score} PTS
                      </span>
                      <span className="text-[8px] font-mono text-cream/40 uppercase tracking-wider block">
                        {item.correctCount || 0}/{item.totalQuestions || 10} {lang === "mn" ? "ЗӨВ" : "RIGHT"}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          <div className="mt-6 pt-4 border-t border-white/5 flex gap-2">
            <button
              onClick={() => setGameMode("selection")}
              className="flex-1 py-2.5 rounded-xl border border-white/10 hover:border-white/20 bg-white/5 hover:bg-white/10 text-cream font-bold text-[10px] uppercase tracking-widest cursor-pointer transition-all text-center font-mono"
            >
              {lang === "mn" ? "ҮНДСЭН ЦЭС" : "MAIN MENU"}
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full rounded-[32px] border border-white/15 bg-black/40 p-6 sm:p-8 liquid-glass relative overflow-hidden flex flex-col justify-between min-h-[580px] shadow-2xl">
      {/* Background neon dots grid */}
      <div 
        className="absolute inset-0 opacity-[0.03] pointer-events-none"
        style={{
          backgroundImage: `radial-gradient(circle, var(--color-neon) 1.2px, transparent 1.2px)`,
          backgroundSize: "20px 20px"
        }}
      />

      {/* Floating Streak Bonus Banner Overlay */}
      <AnimatePresence>
        {hasStreakBonus && (
          <motion.div
            initial={{ opacity: 0, scale: 0.8, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 1.1, y: -40 }}
            className="absolute inset-0 bg-black/90 flex flex-col items-center justify-center z-50 rounded-[32px] pointer-events-none"
          >
            <div className="p-6 rounded-2xl bg-orange-500/10 border border-orange-500/30 text-center shadow-[0_0_40px_rgba(249,115,22,0.3)] max-w-xs mx-4">
              <Flame className="w-14 h-14 text-orange-500 animate-bounce mx-auto mb-2 fill-orange-500" />
              <h4 className="text-xl font-grotesk text-orange-400 uppercase tracking-widest font-extrabold">STREAK BONUS!</h4>
              <p className="text-4xl font-mono text-white font-extrabold mt-1">+20 PTS</p>
              <span className="text-[10px] uppercase font-mono text-white/50 block mt-2 tracking-wider leading-relaxed">
                {lang === "mn" ? "Дараалан 3 зөв хариуллаа! 🔥" : "3 correct answers in a row! 🔥"}
              </span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Header and Progress Indicator */}
      <div className="relative z-10 w-full">
        <div className="flex justify-between items-start border-b border-white/10 pb-4 mb-5">
          <div className="flex flex-col gap-1">
            <span className="text-[10px] text-neon uppercase font-mono tracking-widest block font-extrabold">
              {gameMode === "emoji" 
                ? (lang === "mn" ? "🔮 ЭМОЖИ & ЗУРАГТ ТААВАР" : "🔮 EMOJI & ART GUESSER")
                : (lang === "mn" ? "🦸‍♂️ БААТРЫН ДҮР ТААХ" : "🦸‍♂️ GUESS THE CHARACTER")
              }
            </span>
            <div className="flex items-center gap-2">
              <span className="text-[9px] uppercase font-mono text-cream/50">
                {lang === "mn" ? "Амь:" : "LIVES:"}
              </span>
              <div className="flex gap-1 items-center">
                {[...Array(3)].map((_, i) => (
                  <Heart 
                    key={i} 
                    className={`w-3.5 h-3.5 transition-all duration-300 ${i < lives ? "text-red-500 fill-red-500 animate-pulse" : "text-white/10"}`} 
                  />
                ))}
              </div>
            </div>
          </div>
          <div className="text-right flex flex-col items-end gap-1.5">
            <div className="flex items-center gap-2">
              {streak > 0 && (
                <div className="flex items-center gap-1 text-orange-500 animate-pulse bg-orange-500/10 border border-orange-500/20 px-2 py-0.5 rounded-full text-[9px] font-mono uppercase font-bold">
                  <Flame className="w-3.5 h-3.5 fill-orange-500" />
                  <span>STREAK {streak}</span>
                </div>
              )}
              <span className="text-xs sm:text-sm font-extrabold text-neon font-mono">
                SCORE: {score}
              </span>
            </div>
            
            {!isAnswered && !gameFinished && (
              <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-black/60 border border-white/10 text-[9px] font-mono font-bold text-cream">
                <Timer className={`w-3 h-3 ${timeLeft <= 5 ? "text-red-500 animate-bounce" : "text-neon"}`} />
                <span className={timeLeft <= 5 ? "text-red-400 animate-pulse" : "text-cream"}>{timeLeft}S</span>
              </div>
            )}
          </div>
        </div>

        {/* Global Progress Line Bar */}
        {!gameFinished && (
          <div className="w-full h-1 bg-white/5 rounded-full overflow-hidden mb-5">
            <div 
              className="h-full bg-gradient-to-r from-neon to-emerald-400 transition-all duration-300"
              style={{ width: `${((currIdx + (isAnswered ? 1 : 0)) / currentQuestions.length) * 100}%` }}
            />
          </div>
        )}

        <AnimatePresence mode="wait">
          {!gameFinished ? (
            <motion.div
              key={currIdx}
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              transition={{ duration: 0.35, ease: "easeInOut" }}
              className="flex flex-col gap-5"
            >
              {/* Image Illustration Display Section */}
              <div className="relative w-full h-52 sm:h-64 rounded-2xl overflow-hidden border border-white/10 flex items-center justify-center bg-black/60 shadow-inner group">
                <img 
                  src={question.image} 
                  alt="Anime Clue Art" 
                  referrerPolicy="no-referrer"
                  className="absolute inset-0 w-full h-full object-cover opacity-80 mix-blend-lighten transition-transform duration-700 group-hover:scale-105" 
                />

                <div className="absolute inset-0 bg-gradient-to-t from-black/95 via-black/40 to-black/30" />

                {/* Emojis layer floating only for Emoji Mode */}
                {gameMode === "emoji" && (
                  <div className="relative z-10 flex flex-col items-center gap-3">
                    <div className="px-6 py-3 bg-space-bg/95 backdrop-blur-md border border-white/20 rounded-2xl shadow-2xl flex items-center justify-center gap-1 animate-bounce" style={{ animationDuration: "3s" }}>
                      <span className="text-3xl sm:text-4xl tracking-widest select-none">
                        {question.emojis}
                      </span>
                    </div>
                    <span className="text-[10px] uppercase font-mono tracking-widest text-neon bg-black/80 border border-neon/30 px-3 py-1 rounded-full shadow-[0_0_10px_rgba(111,255,0,0.2)]">
                      {lang === "mn" ? "ЗУРГИЙН САНУУЛГА 🎨" : "ARTWORK CLUE 🎨"}
                    </span>
                  </div>
                )}

                {/* Character Mode branding */}
                {gameMode === "character" && (
                  <div className="relative z-10 flex flex-col items-center">
                    <span className="text-[10px] uppercase font-mono tracking-widest text-[#6FFF00] bg-black/80 border border-[#6FFF00]/30 px-4 py-1.5 rounded-full shadow-[0_0_15px_rgba(111,255,0,0.35)]">
                      {lang === "mn" ? "⚡ ХЭН БЭ? ⚡" : "⚡ WHO IS THIS? ⚡"}
                    </span>
                  </div>
                )}
                
                <span className="absolute bottom-3 right-4 text-[9px] font-mono font-bold text-cream/70 bg-black/80 border border-white/10 px-2 py-0.5 rounded">
                  STAGE {currIdx + 1} / {currentQuestions.length}
                </span>
              </div>

              {/* Countdown Progress Slider Bar directly beneath the illustration */}
              {!isAnswered && (
                <div className="w-full h-1 bg-white/10 rounded-full overflow-hidden">
                  <div 
                    className={`h-full bg-gradient-to-r transition-all duration-1000 ease-linear ${timeLeft <= 5 ? "from-red-500 to-orange-500 shadow-[0_0_8px_rgba(239,68,68,0.5)]" : "from-neon to-cyan-400 shadow-[0_0_8px_rgba(111,255,0,0.5)]"}`}
                    style={{ width: `${(timeLeft / 15) * 100}%` }}
                  />
                </div>
              )}

              {/* Timeout notification badge */}
              {isTimedOut && (
                <div className="w-full py-2 px-4 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400 flex items-center justify-center gap-2 font-mono text-[10px] uppercase animate-pulse">
                  <AlertCircle className="w-3.5 h-3.5" />
                  <span>{lang === "mn" ? "ХУГАЦАА ДУУССАН! ОНОО ХАСАГДЛАА" : "TIMEOUT! TIME IS UP"}</span>
                </div>
              )}

              {/* Instructions text */}
              <p className="text-[11px] sm:text-xs text-cream/70 text-center font-mono uppercase bg-white/[0.02] border border-white/5 py-1.5 px-3 rounded-xl">
                {gameMode === "emoji" 
                  ? (lang === "mn" ? "Дээрх зураг болон эможид тохирох аниме нэрийг бичнэ үү:" : "Identify the matching anime based on the artwork and emojis:")
                  : (lang === "mn" ? "Дээрх зургийн баатрыг тааж зөв сонголтыг сонгоно уу:" : "Identify the character shown in the artwork:")
                }
              </p>

              {/* GAME PLAY CONTROLS: emoji typing vs character multiple choices */}
              {gameMode === "emoji" ? (
                <div className="flex flex-col gap-4">
                  <form 
                    onSubmit={(e) => {
                      e.preventDefault();
                      handleCheckAnswer();
                    }}
                    className="flex flex-col sm:flex-row gap-2 w-full"
                  >
                    <div className="relative flex-1">
                      <input
                        type="text"
                        disabled={isAnswered}
                        value={typedAnswer}
                        onChange={(e) => setTypedAnswer(e.target.value)}
                        placeholder={lang === "mn" ? "Аниме нэрийг бичнэ үү..." : "Type anime name here..."}
                        className={`w-full px-5 py-3.5 bg-black/60 border rounded-xl font-mono text-cream placeholder-cream/30 focus:outline-none focus:ring-1 transition-all duration-300 text-xs sm:text-sm ${
                          isAnswered
                            ? isCorrect
                              ? "border-green-500/50 focus:ring-green-500/30 bg-green-500/10 text-green-300"
                              : "border-red-500/50 focus:ring-red-500/30 bg-red-500/10 text-red-300"
                            : "border-white/10 focus:border-[#6FFF00] focus:ring-[#6FFF00]/20"
                        }`}
                      />
                      
                      {isAnswered && (
                        <span className={`absolute right-4 top-1/2 -translate-y-1/2 text-[9px] font-bold px-2 py-0.5 rounded uppercase ${
                          isCorrect ? "bg-green-500/25 border border-green-500/40 text-green-300" : "bg-red-500/25 border border-red-500/40 text-red-300"
                        }`}>
                          {isCorrect ? (lang === "mn" ? "ЗӨВ ✓" : "CORRECT ✓") : (lang === "mn" ? "БУРУУ ✗" : "WRONG ✗")}
                        </span>
                      )}
                    </div>
                    
                    <button
                      type="submit"
                      disabled={isAnswered || !typedAnswer.trim()}
                      className={`px-5 py-3.5 rounded-xl font-mono font-bold text-[10px] uppercase tracking-widest cursor-pointer transition-all duration-300 flex items-center justify-center gap-1.5 ${
                        isAnswered || !typedAnswer.trim()
                          ? "bg-white/5 text-white/20 border border-white/5 cursor-not-allowed"
                          : "bg-[#6FFF00] text-space-bg hover:bg-[#6FFF00]/90 shadow-[0_0_15px_rgba(111,255,0,0.35)]"
                      }`}
                    >
                      <span>{lang === "mn" ? "ШАЛГАХ" : "CHECK"}</span>
                    </button>
                  </form>

                  {/* Feedback summary */}
                  {isAnswered && (
                    <motion.div
                      initial={{ opacity: 0, y: -5 }}
                      animate={{ opacity: 1, y: 0 }}
                      className={`p-3 rounded-xl border font-mono text-[10px] uppercase flex flex-col gap-0.5 ${
                        isCorrect 
                          ? "bg-green-500/10 border-green-500/20 text-green-300" 
                          : "bg-red-500/10 border-red-500/20 text-red-300"
                      }`}
                    >
                      <span>{isCorrect ? (lang === "mn" ? "МАШ ЗӨВ! 🎉" : "EXCELLENT! 🎉") : (lang === "mn" ? "БУРУУ БАЙНА." : "UNFORTUNATELY WRONG.")}</span>
                      <div className="text-[10px] text-cream/70 mt-0.5">
                        {lang === "mn" ? "ЗӨВ ХАРИУЛТ:" : "CORRECT ANSWER:"}{" "}
                        <strong className="text-white underline decoration-neon">{question.answer}</strong>
                      </div>
                    </motion.div>
                  )}
                </div>
              ) : (
                /* Character Mode: Options Grid */
                <div className="flex flex-col gap-3">
                  <div className="grid grid-cols-2 gap-2">
                    {question.options.map((opt) => {
                      const isSelected = selectedOpt === opt;
                      const isCorrectOpt = opt === question.answer;
                      const isWrongSelection = isAnswered && isSelected && !isCorrectOpt;

                      let btnStyle = "border-white/10 bg-white/[0.01] text-cream hover:bg-white/[0.03]";

                      if (isAnswered) {
                        if (isCorrectOpt) {
                          btnStyle = "bg-green-500/20 border-green-400 text-green-300 font-bold shadow-[0_0_15px_rgba(34,197,94,0.3)]";
                        } else if (isSelected) {
                          btnStyle = "bg-red-500/20 border-red-400 text-red-300 font-bold shadow-[0_0_15px_rgba(239,68,68,0.3)]";
                        } else {
                          btnStyle = "opacity-20 border-white/5 text-cream/30";
                        }
                      } else if (isSelected) {
                        btnStyle = "border-[#6FFF00] bg-[#6FFF00]/15 text-[#6FFF00] font-bold";
                      }

                      return (
                        <button
                          key={opt}
                          disabled={isAnswered}
                          onClick={() => handleCheckAnswerCharacter(opt)}
                          className={`w-full text-center py-3.5 rounded-xl border font-mono text-[11px] sm:text-xs uppercase tracking-wider transition-all duration-300 cursor-pointer ${btnStyle}`}
                        >
                          {opt}
                        </button>
                      );
                    })}
                  </div>

                  {isAnswered && (
                    <motion.div
                      initial={{ opacity: 0, y: -5 }}
                      animate={{ opacity: 1, y: 0 }}
                      className={`p-3 rounded-xl border font-mono text-[10px] uppercase flex flex-col gap-0.5 text-center ${
                        isCorrect 
                          ? "bg-green-500/10 border-green-500/20 text-green-300" 
                          : "bg-red-500/10 border-red-500/20 text-red-300"
                      }`}
                    >
                      <span>
                        {isCorrect 
                          ? (lang === "mn" ? "МАШ ЗӨВ! 🎉" : "CORRECT! 🎉") 
                          : (lang === "mn" ? "БУРУУ БАЙНА." : "WRONG ANSWER.")
                        }
                      </span>
                      <span className="text-[10px] text-cream/70 mt-0.5">
                        {lang === "mn" ? "БАТЛАСАН ХАРИУЛТ: " : "IDENTIFIED CHARACTER: "}{" "}
                        <strong className="text-white underline decoration-neon">{question.answer}</strong>
                      </span>
                    </motion.div>
                  )}
                </div>
              )}

              {/* Action and Hint row */}
              <div className="flex flex-col gap-3 mt-1">
                <AnimatePresence>
                  {showHint && (
                    <motion.p
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: "auto" }}
                      exit={{ opacity: 0, height: 0 }}
                      className="text-[10px] font-mono uppercase bg-neon/10 border border-neon/20 p-2.5 rounded-xl text-neon leading-relaxed"
                    >
                      💡 {lang === "mn" ? question.mnHint : question.enHint}
                    </motion.p>
                  )}
                </AnimatePresence>

                <div className="flex justify-between items-center gap-2 pt-1">
                  <button
                    onClick={() => {
                      setShowHint(!showHint);
                      if (soundEnabled) sound.playBeep();
                    }}
                    className="px-3.5 py-1.5 rounded-xl border border-white/10 hover:border-white/20 text-[10px] uppercase font-mono text-cream/50 hover:text-cream cursor-pointer flex items-center gap-1.5 transition-all hover:bg-white/[0.02]"
                  >
                    <HelpCircle className="w-3.5 h-3.5" />
                    <span>{lang === "mn" ? "САНУУЛГА" : "HINT"}</span>
                  </button>

                  {isAnswered && (
                    <button
                      onClick={handleNext}
                      className="px-4.5 py-1.5 rounded-xl bg-neon hover:bg-neon/90 text-space-bg font-bold text-[10px] uppercase tracking-wider cursor-pointer transition-all flex items-center gap-1 shadow-[0_0_15px_rgba(111,255,0,0.25)]"
                    >
                      <span>{currIdx === currentQuestions.length - 1 ? (lang === "mn" ? "ДУУСГАХ" : "FINISH") : (lang === "mn" ? "ДАРААГИЙНХ" : "NEXT")}</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              </div>
            </motion.div>
          ) : (
            /* GAME END SCREEN: SCORE SUBMISSION FORM & SESSION FEEDBACK */
            <motion.div
              key="finished"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ type: "spring", stiffness: 100 }}
              className="flex flex-col py-6 gap-6"
            >
              <div className="text-center relative flex flex-col items-center gap-2">
                <div className="relative">
                  <div className="absolute inset-0 bg-neon/25 rounded-full blur-xl animate-pulse" />
                  <div className="w-16 h-16 rounded-full bg-neon/15 border border-neon/30 flex items-center justify-center relative shadow-[0_0_20px_rgba(111,255,0,0.15)]">
                    {lives <= 0 ? (
                      <AlertCircle className="w-8 h-8 text-red-500 animate-bounce" />
                    ) : (
                      <Trophy className="w-8 h-8 text-neon animate-pulse" />
                    )}
                  </div>
                </div>

                <div>
                  <h4 className={`font-grotesk text-2xl uppercase tracking-wider leading-none mb-2 ${lives <= 0 ? "text-red-400" : "text-cream"}`}>
                    {lives <= 0 
                      ? (lang === "mn" ? "АМЬ ДУУСЛАА! 💔" : "GAME OVER! 💔") 
                      : (lang === "mn" ? "ТААВАР ДУУСЛАА! 🎉" : "STATION CLEAR! 🎉")}
                  </h4>
                  <p className="text-[11px] text-cream/70 font-mono uppercase tracking-wide max-w-sm mx-auto">
                    {lang === "mn"
                      ? `Та нийт ${correctCount} зөв хариулж, ${score} оноо авлаа.`
                      : `Cleared ${correctCount} sectors with an ultimate score of ${score} pts.`}
                  </p>
                </div>
              </div>

              {/* SAVE SCORE PANEL */}
              {!isSubmitted ? (
                <div className="p-4 bg-white/[0.02] border border-white/10 rounded-2xl flex flex-col gap-3 font-mono">
                  <span className="text-[9px] uppercase tracking-widest text-neon font-extrabold flex items-center gap-1.5">
                    <Save className="w-3 h-3" />
                    <span>{lang === "mn" ? "ОНООГОО ХАДГАЛАХ" : "SECURE YOUR RANK"}</span>
                  </span>
                  
                  <div className="flex flex-col sm:flex-row gap-2">
                    <input
                      type="text"
                      maxLength={15}
                      value={playerName}
                      onChange={(e) => setPlayerName(e.target.value)}
                      placeholder={lang === "mn" ? "Нэрээ оруулна уу..." : "Pilot Name..."}
                      className="flex-1 px-3.5 py-2.5 bg-black/40 border border-white/15 rounded-xl text-xs text-cream placeholder-cream/35 focus:outline-none focus:border-[#6FFF00] uppercase font-bold"
                    />
                    <button
                      onClick={handleSaveScore}
                      disabled={isSubmitting || !playerName.trim()}
                      className={`px-4 py-2.5 rounded-xl font-bold text-[10px] uppercase tracking-widest transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                        isSubmitting || !playerName.trim()
                          ? "bg-white/5 border border-white/5 text-cream/30 cursor-not-allowed"
                          : "bg-[#6FFF00] text-space-bg hover:bg-[#6FFF00]/90 font-extrabold shadow-[0_0_12px_rgba(111,255,0,0.3)]"
                      }`}
                    >
                      {isSubmitting ? (
                        <span>{lang === "mn" ? "ХАДГАЛЖ БАЙНА..." : "SAVING..."}</span>
                      ) : (
                        <>
                          <Save className="w-3.5 h-3.5" />
                          <span>{lang === "mn" ? "БҮРТГҮҮЛЭХ" : "SAVE RANK"}</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>
              ) : (
                <div className="p-3 bg-green-500/10 border border-green-500/20 rounded-2xl flex items-center gap-2.5 font-mono text-[10px] text-green-300 justify-center">
                  <CheckCircle2 className="w-4 h-4 text-green-400 shrink-0" />
                  <span>{lang === "mn" ? "ОНОО АМЖИЛТТАЙ ХАДГАЛАГДЛАА!" : "SCORE SUCCESSFULLY RECORDED!"}</span>
                </div>
              )}

              {/* REVIEWS OF ANSWERS */}
              {sessionAnswers.length > 0 && (
                <div className="border border-white/5 bg-white/[0.01] rounded-2xl p-4">
                  <span className="text-[9px] font-mono uppercase text-cream/40 block mb-2 tracking-wider font-extrabold">
                    {lang === "mn" ? "📋 АСУУЛТЫН ТАЙЛАН:" : "📋 PERFORMANCE FLIGHT LOG:"}
                  </span>
                  <div className="flex flex-col gap-1.5 max-h-[140px] overflow-y-auto pr-1">
                    {sessionAnswers.map((ans, idx) => (
                      <div key={idx} className="flex items-center justify-between text-[10px] font-mono uppercase py-1 border-b border-white/[0.02]">
                        <div className="flex items-center gap-1.5">
                          {ans.isCorrect ? (
                            <CheckCircle2 className="w-3 h-3 text-green-400 shrink-0" />
                          ) : (
                            <XCircle className="w-3 h-3 text-red-400 shrink-0" />
                          )}
                          <span className="text-cream/50">STAGE {idx + 1}:</span>
                          <span className="text-white font-bold">{ans.correctAnswer}</span>
                        </div>
                        <span className={`text-[8px] px-1.5 py-0.5 rounded ${
                          ans.isCorrect ? "bg-green-500/10 text-green-300" : "bg-red-500/10 text-red-300"
                        }`}>
                          {ans.isCorrect ? (lang === "mn" ? "ЗӨВ" : "OK") : (lang === "mn" ? "БУРУУ" : "FAIL")}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div className="flex flex-col sm:flex-row gap-2 mt-2">
                <button
                  onClick={() => {
                    setGameMode("selection");
                    handleRestart();
                  }}
                  className="flex-1 py-3 rounded-xl border border-white/10 hover:border-white/20 bg-white/5 hover:bg-white/10 text-cream font-bold text-[10px] uppercase tracking-widest cursor-pointer transition-all text-center font-mono"
                >
                  {lang === "mn" ? "ҮНДСЭН ЦЭС" : "MAIN MENU"}
                </button>
                <button
                  onClick={() => {
                    setGameMode("leaderboard");
                    fetchLeaderboard();
                  }}
                  className="flex-1 py-3 rounded-xl border border-white/10 hover:border-[#6FFF00]/40 bg-[#6FFF00]/10 text-[#6FFF00] font-bold text-[10px] uppercase tracking-widest cursor-pointer transition-all text-center font-mono"
                >
                  {lang === "mn" ? "ОНООНЫ САМБАР" : "LEADERBOARD"}
                </button>
                <button
                  onClick={handleRestart}
                  className="flex-1 py-3 rounded-xl bg-neon hover:bg-neon/90 text-space-bg font-bold text-[10px] uppercase tracking-widest cursor-pointer transition-all text-center font-mono shadow-[0_0_12px_rgba(111,255,0,0.25)]"
                >
                  {lang === "mn" ? "ДАХИН ТОГЛОХ" : "PLAY AGAIN"}
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Footer verification tag */}
      <div className="relative z-10 flex justify-between items-center text-[9px] font-mono text-cream/40 border-t border-white/5 pt-3 mt-4">
        <span>STATIONS ENCRYPTION CODE: ANM-71B</span>
        <span>{lang === "mn" ? "ИДЭВХТЭЙ" : "ACTIVE"}</span>
      </div>
    </div>
  );
}
export default EmojiAnimeGuesser;
