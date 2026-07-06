/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Play, Trophy, Crosshair, Cpu, Check, Zap } from "lucide-react";
import { sound } from "../utils/audio";
import { GameDetails } from "../types";

const GAMES_DATA: Record<string, GameDetails> = {
  CS2: {
    name: "Counter-Strike 2",
    genre: "FPS / Tactical Shooter",
    rank: "Global Space Elite",
    favChar: "Phoenix Connexion",
    mnDesc: "Нэгдүгээр хүний өнцгөөс бууддаг, маш их ур чадвар шаарддаг тактикийн тоглоом.",
    enDesc: "Tactical first-person shooter requiring high precision and galactic co-ordination.",
    stats: { aim: 95, speed: 85, team: 90, tactics: 92 },
  },
  ROBLOX: {
    name: "ROBLOX",
    genre: "Metaverse & Sandbox Platform",
    rank: "Master Builder",
    favChar: "Agvaan_Explorer",
    mnDesc: "Өөрийн хувийн ертөнц болон шинэ тоглоомуудыг зохион бүтээж, найзуудтайгаа хамт тоглох боломжтой платформ.",
    enDesc: "An immersive sandbox metaverse where I build and explore countless planetary realms.",
    stats: { aim: 70, speed: 95, team: 88, tactics: 90 },
  },
  MLBB: {
    name: "Mobile Legends: Bang Bang",
    genre: "MOBA / Battle Arena",
    rank: "Mythic Glory",
    favChar: "Gusion / Chou",
    mnDesc: "5v5 багийн тулаант шилдэг хөдөлгөөнт стратеги тоглоом.",
    enDesc: "Fast-paced 5v5 mobile strategy arena featuring intense tactical maneuvers.",
    stats: { aim: 82, speed: 92, team: 95, tactics: 94 },
  },
};

interface Props {
  lang: "mn" | "en";
}

export function GamerConsole({ lang }: Props) {
  const [selectedKey, setSelectedKey] = useState<string>("CS2");
  const [aimScore, setAimScore] = useState<number>(0);
  const [highScore, setHighScore] = useState<number>(0);
  const [isAimActive, setIsAimActive] = useState<boolean>(false);
  const [targets, setTargets] = useState<{ id: number; x: number; y: number; val: number }[]>([]);
  const [clicks, setClicks] = useState<number>(0);

  // Load High Score from LocalStorage
  useEffect(() => {
    const saved = localStorage.getItem("agvaan_aim_high");
    if (saved) setHighScore(parseInt(saved, 10));
  }, []);

  const selectedGame = GAMES_DATA[selectedKey];

  // Aim training setup
  const startAimTrainer = () => {
    sound.playLevelUp();
    setIsAimActive(true);
    setAimScore(0);
    setClicks(0);
    spawnTarget();
  };

  const spawnTarget = () => {
    const id = Date.now() + Math.random();
    const x = Math.floor(Math.random() * 85) + 5; // offset margins
    const y = Math.floor(Math.random() * 80) + 10;
    const val = Math.random() > 0.8 ? 3 : 1; // 20% chance bonus gold target
    setTargets([{ id, x, y, val }]);
  };

  const handleTargetClick = (val: number) => {
    sound.playLaser();
    setAimScore((prev) => {
      const news = prev + val;
      if (news > highScore) {
        setHighScore(news);
        localStorage.setItem("agvaan_aim_high", news.toString());
      }
      return news;
    });
    setClicks((prev) => prev + 1);
    spawnTarget();
  };

  const stopAimTrainer = () => {
    sound.playFail();
    setIsAimActive(false);
    setTargets([]);
  };

  return (
    <div className="w-full flex flex-col gap-8">
      {/* Upper status bars */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <span className="text-neon text-[10px] font-bold tracking-[0.3em] uppercase block mb-1">
            {lang === "mn" ? "🎮 ТОГЛООМЫН МЭДЭЭЛЭЛ" : "🎮 ONLINE RIG TELEMETRY"}
          </span>
          <h2 className="font-grotesk text-[32px] sm:text-[45px] lg:text-[50px] text-cream uppercase leading-none">
            {lang === "mn" ? "ПРО ТОГЛОГЧИЙН ДЭК" : "THE GAMING PORTAL"}
          </h2>
        </div>
        
        {/* Latency and Specs info */}
        <div className="flex gap-4 text-[10px] text-cream/60 px-4 py-2 rounded-xl border border-white/10 bg-white/[0.02] liquid-glass font-mono">
          <div>FPS: <span className="text-neon font-bold">240+</span></div>
          <div className="text-white/20">•</div>
          <div>PING: <span className="text-neon font-bold">9 MS</span></div>
          <div className="text-white/20">•</div>
          <div>CPU: <span className="text-neon font-bold">I9-14900K</span></div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-stretch">
        
        {/* Left Column Selector */}
        <div className="lg:col-span-4 flex flex-col gap-3">
          {Object.keys(GAMES_DATA).map((key) => {
            const isSelected = selectedKey === key;
            return (
              <button
                key={key}
                onClick={() => {
                  setSelectedKey(key);
                  sound.playBeep();
                }}
                className={`w-full text-left p-5 rounded-2xl border transition-all duration-300 relative overflow-hidden flex items-center justify-between group cursor-pointer ${
                  isSelected 
                    ? "bg-white/[0.04] border-neon/50 shadow-md shadow-neon/5" 
                    : "bg-white/[0.01] border-white/10 hover:border-white/20"
                }`}
              >
                <div>
                  <span className="block font-mono text-[9px] text-cream/40 uppercase tracking-widest">
                    STATION KEYPORT
                  </span>
                  <span className="font-grotesk text-2xl text-cream tracking-wider uppercase group-hover:text-neon transition-colors">
                    {key}
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  {isSelected && <span className="w-2 h-2 rounded-full bg-neon animate-pulse" />}
                  <span className={`px-2 py-0.5 rounded text-[10px] font-bold tracking-widest font-mono ${
                    isSelected ? "bg-neon/15 text-neon" : "bg-white/5 text-cream/50"
                  }`}>
                    {isSelected ? "LOADED" : "SELECT"}
                  </span>
                </div>
              </button>
            );
          })}

          {/* Miniature Custom CS2 Aim Trainer Panel */}
          <div className="mt-4 p-5 rounded-2xl border border-white/10 bg-white/[0.01] flex flex-col gap-3 relative overflow-hidden">
            <div className="flex justify-between items-center">
              <span className="text-[10px] font-bold text-neon uppercase tracking-widest flex items-center gap-1.5">
                <Crosshair className="w-3.5 h-3.5 shrink-0 animate-spin" style={{ animationDuration: "12s" }} />
                <span>AIM LAB MINI</span>
              </span>
              <span className="text-[10px] text-cream/40 font-mono">
                {lang === "mn" ? "ӨНДӨР ОНОО: " : "BEST Score: "}{highScore}
              </span>
            </div>

            <p className="text-[11px] text-cream/65 uppercase leading-relaxed font-mono">
              {lang === "mn" 
                ? "CS2 тоглохоос өмнө би дурандаа бэлдэж халаалт хийдэг! Оролдоод үзээрэй." 
                : "Warmup tool Agvaan uses to hone reflexes. Test your aim in the space segment."}
            </p>

            {!isAimActive ? (
              <button
                onClick={startAimTrainer}
                className="w-full py-2.5 rounded-xl bg-neon text-space-bg hover:bg-neon/90 font-bold transition-all text-xs tracking-widest uppercase cursor-pointer text-center"
              >
                {lang === "mn" ? "ХАЛААЛТ ЭХЛЭХ" : "START LAUNCH LAB"}
              </button>
            ) : (
              <button
                onClick={stopAimTrainer}
                className="w-full py-2.5 rounded-xl bg-red-500/15 text-red-400 hover:bg-red-500/25 border border-red-500/30 font-bold transition-all text-xs tracking-widest uppercase cursor-pointer text-center"
              >
                {lang === "mn" ? "СИСТЕМ ХААХ" : "TERMINATE STREAM"}
              </button>
            )}
          </div>
        </div>

        {/* Right Column Custom Screen Deck */}
        <div className="lg:col-span-8 relative">
          <AnimatePresence mode="wait">
            {!isAimActive ? (
              <motion.div
                key={selectedKey}
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -15 }}
                transition={{ duration: 0.3 }}
                className="liquid-glass rounded-[32px] p-6 sm:p-8 border border-white/10 flex flex-col justify-between relative min-h-[440px] h-full"
              >
                {/* Graphic absolute background texture */}
                <div 
                  className="absolute inset-0 opacity-5 pointer-events-none"
                  style={{
                    backgroundImage: `radial-gradient(circle, var(--color-neon) 1px, transparent 1px)`,
                    backgroundSize: "20px 20px"
                  }}
                />

                <div className="relative z-10 w-full">
                  {/* Top line with title and rank */}
                  <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-white/10 pb-5 mb-5">
                    <div>
                      <span className="font-mono text-[10px] text-neon uppercase tracking-[0.25em] font-bold block mb-1">
                        {selectedGame.genre}
                      </span>
                      <h3 className="font-grotesk text-2xl sm:text-3xl text-cream uppercase tracking-wide">
                        {selectedGame.name}
                      </h3>
                    </div>
                    
                    <div className="text-left sm:text-right">
                      <span className="font-mono text-[9px] text-cream/40 uppercase block">RANK IN STATIONS:</span>
                      <span className="font-serif italic font-extrabold text-neon uppercase tracking-wide text-sm sm:text-base">
                        👑 {selectedGame.rank}
                      </span>
                    </div>
                  </div>

                  {/* Character card */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6 my-4">
                    <div className="p-4 rounded-xl border border-white/5 bg-white/[0.01]">
                      <span className="font-mono text-[9px] text-cream/40 uppercase block mb-1">
                        {lang === "mn" ? "ОНЦЛОХ ДҮР // АВАТАР:" : "SIGNATURE CHARACTER:"}
                      </span>
                      <div className="flex items-center gap-2 text-cream font-bold text-sm sm:text-base uppercase font-mono tracking-wider">
                        <Zap className="w-4 h-4 text-neon animate-pulse shrink-0" />
                        <span>{selectedGame.favChar}</span>
                      </div>
                    </div>

                    <div className="p-4 rounded-xl border border-white/5 bg-white/[0.01] flex items-center justify-between">
                      <div>
                        <span className="font-mono text-[9px] text-cream/40 uppercase block mb-1">RIG ALIGNMENT:</span>
                        <span className="text-xs uppercase text-cream/80 font-bold">SECURE CHANNEL STATUS</span>
                      </div>
                      <span className="w-2 h-2 rounded-full bg-neon animate-ping" />
                    </div>
                  </div>

                  {/* Skills sliders */}
                  <div className="my-6 flex flex-col gap-3">
                    <span className="font-mono text-[10px] text-cream/50 uppercase tracking-widest block">
                      {lang === "mn" ? "ТОГЛОГЧИЙН ЧАДВАРЫН УРСГАЛ" : "PRO PERFORMANCE METRICS"}
                    </span>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      {Object.entries(selectedGame.stats).map(([statName, val]) => (
                        <div key={statName} className="flex flex-col gap-1">
                          <div className="flex justify-between text-[10px] text-cream/80 uppercase">
                            <span>{statName}</span>
                            <span className="font-bold text-neon">{val}%</span>
                          </div>
                          <div className="w-full h-1.5 rounded-full bg-white/5 overflow-hidden">
                            <motion.div
                              initial={{ width: 0 }}
                              animate={{ width: `${val}%` }}
                              transition={{ duration: 0.8, delay: 0.1 }}
                              className="h-full bg-neon rounded-full"
                            />
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  <p className="font-mono text-xs sm:text-sm text-cream/80 leading-relaxed uppercase tracking-wide border-t border-white/5 pt-5 mb-4">
                    {lang === "mn" ? selectedGame.mnDesc : selectedGame.enDesc}
                  </p>
                </div>

                {/* Sub-bar with Mint action */}
                <div className="relative z-10 flex flex-col sm:flex-row justify-between items-center gap-4 pt-4 border-t border-white/5 text-[10px] text-cream/50 mt-4">
                  <span>ORBIS VERIFIED AGVAAN-STATION-I86 LOCK</span>
                  <button
                    onClick={() => {
                      sound.playJump();
                      alert(
                        lang === "mn"
                          ? `Амжилттай! Та ${selectedGame.name}-ийн Agvaan-ий хүндэт гишүүн болж урилга авлаа.`
                          : `Verified! You've unlocked Agvaan's server pass for ${selectedGame.name}.`
                      );
                    }}
                    className="px-3.5 py-1.5 rounded-lg bg-white/5 hover:bg-neon hover:text-space-bg border border-white/10 hover:border-neon transition-all flex items-center gap-1.5 cursor-pointer font-bold uppercase"
                  >
                    <span>{lang === "mn" ? "ВИДЖЕТ ОНЦЛОХ" : "CLAIM SPECIAL PASS"}</span>
                  </button>
                </div>
              </motion.div>
            ) : (
              <motion.div
                key="aim-trainer"
                initial={{ opacity: 0, scale: 0.98 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.98 }}
                className="rounded-[32px] border border-neon/30 bg-[#020d35] p-6 flex flex-col justify-between relative min-h-[440px] h-full overflow-hidden"
              >
                {/* Targets shooting container */}
                <div className="flex justify-between items-center border-b border-white/10 pb-4">
                  <div>
                    <span className="text-[10px] text-neon/60 uppercase font-mono block">LIVE TELEMETRY TRAINING</span>
                    <span className="text-sm font-bold text-cream font-mono">
                      {lang === "mn" ? "ОНОО: " : "SCORE: "}{aimScore}
                    </span>
                  </div>

                  <div className="text-right">
                    <span className="text-[10px] text-cream/40 font-mono block">CLICKS:</span>
                    <span className="text-xs text-cream uppercase font-bold">{clicks}</span>
                  </div>
                </div>

                {/* Target Stage Canvas */}
                <div className="flex-1 w-full relative min-h-[260px] bg-[#000418] rounded-2xl border border-white/5 my-4 overflow-hidden">
                  {targets.map((tgt) => (
                    <motion.button
                      key={tgt.id}
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      className="absolute w-12 h-12 rounded-full cursor-crosshair flex items-center justify-center focus:outline-none"
                      style={{
                        left: `${tgt.x}%`,
                        top: `${tgt.y}%`,
                        transform: "translate(-50%, -50%)"
                      }}
                      onClick={() => handleTargetClick(tgt.val)}
                    >
                      {tgt.val > 1 ? (
                        <>
                          <div className="absolute inset-0 bg-yellow-500 rounded-full animate-ping opacity-60 pointer-events-none" />
                          <div className="absolute inset-0.5 bg-yellow-400 rounded-full border border-yellow-200 flex items-center justify-center">
                            <span className="text-[9px] font-extrabold text-[#000418] tracking-tighter">GOLD</span>
                          </div>
                        </>
                      ) : (
                        <>
                          <div className="absolute inset-0 bg-neon rounded-full animate-ping opacity-30 pointer-events-none" />
                          <div className="absolute inset-2 bg-neon/20 rounded-full border border-neon" />
                          <div className="w-3 h-3 bg-neon rounded-full" />
                        </>
                      )}
                    </motion.button>
                  ))}

                  {targets.length === 0 && (
                    <div className="absolute inset-0 flex items-center justify-center flex-col gap-2">
                      <span className="text-xs text-cream/60 uppercase font-mono tracking-widest">
                        {lang === "mn" ? "БЭЛДЭЖ БАЙНА..." : "READY... FIRE!"}
                      </span>
                    </div>
                  )}
                </div>

                {/* Control line */}
                <div className="flex justify-between items-center text-xs text-cream/50 pt-2 font-mono">
                  <span>{lang === "mn" ? "АЛТАН ЦЭГҮҮД +3 ОНОО ӨГНӨ" : "GOLD TARGETS GIVE +3 POINTS"}</span>
                  <button
                    onClick={stopAimTrainer}
                    className="px-3 py-1 rounded bg-red-500/10 hover:bg-red-500/20 border border-red-500/20 text-red-400 transition-all uppercase cursor-pointer"
                  >
                    {lang === "mn" ? "ЗҮГШРҮҮЛЭХИЙГ ЗОГСООХ" : "EXIT LAB"}
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

      </div>
    </div>
  );
}
export default GamerConsole;
