/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Trophy, HelpCircle, ArrowRight, RotateCcw, ShieldCheck, Sparkles } from "lucide-react";
import { sound } from "../utils/audio";
import { QuizQuestion } from "../types";

const QUIZ_QUESTIONS: QuizQuestion[] = [
  {
    id: 1,
    questionMn: "Агваан одоо хэдэн настай вэ?",
    questionEn: "How old is Agvaan?",
    optionsMn: ["8 настай", "10 настай", "12 настай", "14 настай"],
    optionsEn: ["8 years old", "10 years old", "12 years old", "14 years old"],
    correctIdx: 1, // 10 nastai
    funFactMn: "Тийм ээ! Тэр одоо ердөө 10 настай хэдий ч сансарын аялагч шиг ухаалаг хүү юм.",
    funFactEn: "Correct! He's just 10 Earth years old, but holds cosmic wisdom of a future builder."
  },
  {
    id: 2,
    questionMn: "Агвааны чөлөөт цагаараа хийх дуртай биеийн тамирын хобби юу вэ?",
    questionEn: "What is Agvaan's favorite athletic hobby?",
    optionsMn: ["Хөлбөмбөг", "Сагсан бөмбөг", "Теннис", "Усанд сэлэлт"],
    optionsEn: ["Soccer", "Basketball", "Tennis", "Swimming"],
    correctIdx: 1, // Сагсан бөмбөг
    funFactMn: "Сагсан бөмбөг! Тэр чөлөөт цагаа зааланд бөмбөг шидэж өнгөрүүлэх дуртай.",
    funFactEn: "Basketball! He loves nothing more than taking deep range 3-pointers."
  },
  {
    id: 3,
    questionMn: "Түүний хамгийн дуртай, бүх бичлэгийг нь алгасахгүй үздэг Юүтүбэр хэн бэ?",
    questionEn: "Which YouTuber's videos does Agvaan watch without skipping?",
    optionsMn: ["MrBeast", "Gremix", "PewDiePie", "Markiplier"],
    optionsEn: ["MrBeast", "Gremix", "PewDiePie", "Markiplier"],
    correctIdx: 1, // Gremix
    funFactMn: "Грэмикс! Тэр бол Монголын хамгийн супер, хөгжилтэй тоглоомын юүтүбэр билээ.",
    funFactEn: "Gremix! Mongolia's premium fun developer and comedic streamer."
  },
  {
    id: 4,
    questionMn: "Агваан аль сургуульд сурдаг вэ?",
    questionEn: "Which school does Agvaan attend?",
    optionsMn: ["Ирээдүй-86", "Сант", "Орчлон", "Шинэ Монгол"],
    optionsEn: ["Ireedui-86", "Sant", "Orchlon", "New Mongol"],
    correctIdx: 0, // Ирээдүй-86
    funFactMn: "Ирээдүй-86! Тэрээр тус сургуулийн 5-р ангийн шилдэг сурагч юм.",
    funFactEn: "Ireedui-86! He is an outstanding 5th-grade cadet at this digital academy."
  },
  {
    id: 5,
    questionMn: "Түүний дуртай Өмнөд Солонгосын дэлхийн хэмжээний хамтлаг юу вэ?",
    questionEn: "What is his favorite global South Korean band?",
    optionsMn: ["Blackpink", "EXO", "BTS", "Stray Kids"],
    optionsEn: ["Blackpink", "EXO", "BTS", "Stray Kids"],
    correctIdx: 2, // BTS
    funFactMn: "БТС! Тэдний хөгжилтэй эрч хүчтэй дуунууд Агвааныг хичээл хийхэд урам зориг өгдөг.",
    funFactEn: "BTS! Dynamite tracks keep him motivated during long gaming and coding missions."
  },
  {
    id: 6,
    questionMn: "Түүний хамгийн дуртай анимэ юу вэ?",
    questionEn: "Which of these is his absolute number one favorite anime?",
    optionsMn: ["Naruto", "One Piece", "Demon Slayer", "Dragon Ball"],
    optionsEn: ["Naruto", "One Piece", "Demon Slayer", "Dragon Ball"],
    correctIdx: 1, // One Piece
    funFactMn: "Ван Пис! Далайн дээрэмчин Луффигийн эрх чөлөө, адал явдал түүнд таалагддаг.",
    funFactEn: "One Piece! Luffy's high-spirited adventure to become the Pirate King inspire him."
  },
  {
    id: 7,
    questionMn: "Доорх тоглоомуудаас Агвааны хамгийн дуртай 3 тоглоомд багтахгүй нь аль вэ?",
    questionEn: "Which game is NOT on Agvaan's top-3 list?",
    optionsMn: ["Minecraft", "ROBLOX", "CS2", "Mobile Legends (MLBB)"],
    optionsEn: ["Minecraft", "ROBLOX", "CS2", "Mobile Legends (MLBB)"],
    correctIdx: 0, // Minecraft
    funFactMn: "Түүний дуртай тоглоомууд бол CS2, ROBLOX болон MLBB юм.",
    funFactEn: "Minecraft! While cooler, his actual top active rigs are CS2, ROBLOX, and MLBB."
  }
];

interface Props {
  lang: "mn" | "en";
  soundEnabled?: boolean;
}

export function AgvaanQuiz({ lang, soundEnabled = true }: Props) {
  const [currIdx, setCurrIdx] = useState<number>(0);
  const [selectedOpt, setSelectedOpt] = useState<number | null>(null);
  const [isAnswered, setIsAnswered] = useState<boolean>(false);
  const [score, setScore] = useState<number>(0);
  const [quizFinished, setQuizFinished] = useState<boolean>(false);
  const [showFact, setShowFact] = useState<boolean>(false);

  const question = QUIZ_QUESTIONS[currIdx];

  const handleOptionSelect = (idx: number) => {
    if (isAnswered) return;
    setSelectedOpt(idx);
  };

  const handleCheckAnswer = () => {
    if (selectedOpt === null || isAnswered) return;
    setIsAnswered(true);
    setShowFact(true);

    if (selectedOpt === question.correctIdx) {
      if (soundEnabled) sound.playDing();
      setScore((prev) => prev + 1);
    } else {
      if (soundEnabled) sound.playBuzz();
    }
  };

  const handleNext = () => {
    setSelectedOpt(null);
    setIsAnswered(false);
    setShowFact(false);

    if (currIdx < QUIZ_QUESTIONS.length - 1) {
      setCurrIdx((prev) => prev + 1);
      if (soundEnabled) sound.playBeep();
    } else {
      if (soundEnabled) sound.playLevelUp();
      setQuizFinished(true);
    }
  };

  const resetQuiz = () => {
    setCurrIdx(0);
    setSelectedOpt(null);
    setIsAnswered(false);
    setScore(0);
    setQuizFinished(false);
    setShowFact(false);
    if (soundEnabled) sound.playLevelUp();
  };

  return (
    <div className="w-full liquid-glass rounded-[32px] p-6 sm:p-8 border border-white/10 relative overflow-hidden flex flex-col justify-between min-h-[460px]">
      {/* Background Matrix details */}
      <div className="absolute inset-0 bg-[#00051e]/5 pointer-events-none" />

      {/* QUIZ ACTIVE STATE */}
      {!quizFinished ? (
        <div className="relative z-10 flex flex-col h-full justify-between flex-1">
          {/* Top Panel stats */}
          <div>
            <div className="flex justify-between items-center border-b border-white/5 pb-4 mb-5">
              <span className="text-[10px] text-neon uppercase font-bold tracking-widest flex items-center gap-1.5">
                <HelpCircle className="w-4 h-4 animate-bounce" />
                <span>
                  {lang === "mn" ? `Оролт: ${currIdx + 1} / ${QUIZ_QUESTIONS.length}` : `SECTOR: ${currIdx + 1} / ${QUIZ_QUESTIONS.length}`}
                </span>
              </span>

              <span className="text-[10px] text-[#b724ff] font-bold uppercase tracking-widest">
                {lang === "mn" ? `Оноо: ${score}` : `SCORE: ${score}`}
              </span>
            </div>

            {/* Slide Question transition container */}
            <AnimatePresence mode="wait">
              <motion.div
                key={currIdx}
                initial={{ opacity: 0, x: 50 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -50 }}
                transition={{ duration: 0.35, ease: "easeInOut" }}
                className="w-full"
              >
                {/* Question Text */}
                <h4 className="font-grotesk text-xl sm:text-2xl text-cream uppercase tracking-wide leading-tight mb-6 min-h-[56px] flex items-center">
                  {lang === "mn" ? question.questionMn : question.questionEn}
                </h4>

                {/* Options List Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-6">
                  {(lang === "mn" ? question.optionsMn : question.optionsEn).map((opt, idx) => {
                    const isSelected = selectedOpt === idx;
                    const isCorrect = idx === question.correctIdx;
                    const isWrongSelection = isAnswered && isSelected && !isCorrect;

                    let btnStyle = "border-white/10 bg-white/[0.01] text-cream/80";
                    
                    if (isAnswered) {
                      if (isCorrect) {
                        btnStyle = "bg-green-500/20 border-green-500 text-green-400 font-bold shadow-[0_0_15px_rgba(34,197,94,0.3)]";
                      } else if (isSelected) {
                        btnStyle = "bg-red-500/20 border-red-500 text-red-400 font-bold shadow-[0_0_15px_rgba(239,68,68,0.3)]";
                      } else {
                        btnStyle = "opacity-45 border-white/5 text-cream/40";
                      }
                    } else if (isSelected) {
                      btnStyle = "border-[#6FFF00] bg-[#6FFF00]/10 text-[#6FFF00] shadow-sm shadow-[#6FFF00]/20 font-medium";
                    }

                    // Hover behavior: scale up slightly, glow, border highlight
                    const hoverAnimation = !isAnswered ? {
                      scale: 1.03,
                      boxShadow: isSelected 
                        ? "0 0 15px rgba(111, 255, 0, 0.35)" 
                        : "0 0 12px rgba(255, 255, 255, 0.08)",
                      borderColor: isSelected ? "#6FFF00" : "rgba(255, 255, 255, 0.35)",
                      backgroundColor: isSelected ? "rgba(111, 255, 0, 0.15)" : "rgba(255, 255, 255, 0.03)"
                    } : undefined;

                    // Shake trigger on wrong answer confirmation
                    const animateProp = isWrongSelection 
                      ? { x: [0, -6, 6, -6, 6, -3, 3, 0] } 
                      : {};

                    return (
                      <motion.button
                        key={idx}
                        disabled={isAnswered}
                        onClick={() => handleOptionSelect(idx)}
                        whileHover={hoverAnimation}
                        whileTap={!isAnswered ? { scale: 0.98 } : undefined}
                        animate={animateProp}
                        transition={isWrongSelection ? { duration: 0.4, ease: "easeInOut" } : { duration: 0.2 }}
                        className={`w-full text-left p-4 rounded-xl border font-mono text-xs sm:text-sm uppercase transition-all duration-300 relative cursor-pointer flex items-center justify-between ${btnStyle}`}
                      >
                        <span>{opt}</span>
                        {isAnswered && isCorrect && (
                          <span className="text-green-400 text-[9px] font-bold py-0.5 px-1.5 bg-green-500/20 rounded uppercase border border-green-500/30">
                            {lang === "mn" ? "ЗӨВ" : "CORRECT"}
                          </span>
                        )}
                        {isAnswered && isWrongSelection && (
                          <span className="text-red-400 text-[9px] font-bold py-0.5 px-1.5 bg-red-500/20 rounded uppercase border border-red-500/30">
                            {lang === "mn" ? "БУРУУ" : "WRONG"}
                          </span>
                        )}
                      </motion.button>
                    );
                  })}
                </div>
              </motion.div>
            </AnimatePresence>
          </div>

          {/* Bottom helper explanation */}
          <div className="border-t border-white/5 pt-5 flex flex-col sm:flex-row justify-between items-end sm:items-center gap-4">
            <div className="flex-1 text-left">
              <AnimatePresence mode="wait">
                {showFact && (
                  <motion.div
                    initial={{ opacity: 0, y: 5 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0 }}
                    className="p-3.5 rounded-lg bg-white/[0.02] border border-white/5 text-[11px] uppercase font-mono text-cream/80"
                  >
                    <span className="text-neon block font-bold mb-0.5">INFO DISCOVERY:</span>
                    {lang === "mn" ? question.funFactMn : question.funFactEn}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            <div>
              {!isAnswered ? (
                <button
                  disabled={selectedOpt === null}
                  onClick={handleCheckAnswer}
                  className={`px-5 py-2.5 rounded-xl font-bold font-mono text-xs tracking-widest uppercase transition-all cursor-pointer ${
                    selectedOpt !== null
                      ? "bg-neon text-space-bg hover:bg-neon/90"
                      : "bg-white/5 text-cream/20 border border-white/5 cursor-not-allowed"
                  }`}
                >
                  {lang === "mn" ? "ШҮҮХ" : "CONFIRM"}
                </button>
              ) : (
                <button
                  onClick={handleNext}
                  className="px-5 py-2.5 rounded-xl bg-neon text-space-bg hover:bg-neon/90 font-bold font-mono text-xs tracking-widest uppercase flex items-center gap-1.5 transition-all cursor-pointer"
                >
                  <span>{lang === "mn" ? "ДАРААХ" : "NEXT"}</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              )}
            </div>
          </div>
        </div>
      ) : (
        /* QUIZ FINISHED STATE */
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="relative z-10 flex flex-col items-center justify-center text-center flex-1 py-6"
        >
          <div className="w-16 h-16 rounded-full bg-neon/10 border border-neon/30 flex items-center justify-center mb-5 animate-pulse">
            <Trophy className="w-8 h-8 text-neon" />
          </div>

          <span className="text-[10px] text-neon uppercase font-bold tracking-[0.3em] mb-1 block">
            {lang === "mn" ? "АНГИЛЛЫН ШАЛГАЛТ ДҮҮРСЭН" : "TRANSMISSION SUCCESSFUL"}
          </span>
          <h4 className="font-grotesk text-3xl sm:text-4xl text-cream uppercase leading-none mb-3">
            {score === QUIZ_QUESTIONS.length
              ? lang === "mn" ? "ТӨГС ӨГӨГДӨЛТЭЙ ОРОЛЦЛОО!" : "PERFECT MEMORY MATRIX!"
              : lang === "mn" ? "СИСТЕМ ШАЛГАЖ ДУУСЛАА!" : "COGNITIVE EVALUATION COMPLETE!"}
          </h4>

          <p className="font-mono text-xs sm:text-sm text-cream/75 max-w-sm uppercase leading-relaxed mb-6">
            {lang === "mn"
              ? `Агвааныг хичнээн сайн таньдгийг харууллаа! Та нийт ${QUIZ_QUESTIONS.length} асуултаас ${score} оноо авсан байна.`
              : `You scored ${score} out of ${QUIZ_QUESTIONS.length}. Your cognitive synergy with cadet Agvaan's system is strong.`}
          </p>

          {/* Special Medal Award Display */}
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-[#00051e] border border-white/10 text-xs font-mono uppercase text-cream/90 mb-8 font-bold">
            <Sparkles className="w-4 h-4 text-[#9eff3c]" />
            <span>RANK UNLOCKED: </span>
            <span className="text-neon">
              {score === QUIZ_QUESTIONS.length
                ? lang === "mn" ? "САНСАРЫН ЭЗЭН" : "GRAND MASTER CADET"
                : score >= 5
                ? lang === "mn" ? "МӨНГӨН АЯЛАГЧ" : "ROVER GENERAL"
                : lang === "mn" ? "ХҮРЭЛ Цэрэг" : "SCOUT CADET"}
            </span>
          </div>

          <button
            onClick={resetQuiz}
            className="px-6 py-3 rounded-xl bg-neon text-space-bg hover:bg-neon/90 font-bold font-mono text-xs tracking-widest uppercase flex items-center gap-2 transition-all cursor-pointer shadow-md shadow-neon/10"
          >
            <RotateCcw className="w-4 h-4" />
            <span>{lang === "mn" ? "ДАХИН СОРЬЖ ҮЗЭХ" : "RE-START SCANNER"}</span>
          </button>
        </motion.div>
      )}
    </div>
  );
}
export default AgvaanQuiz;
