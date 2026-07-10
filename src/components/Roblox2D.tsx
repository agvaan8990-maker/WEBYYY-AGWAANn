/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "motion/react";
import { 
  Gamepad, 
  Sparkles, 
  Layers, 
  ShoppingCart, 
  Volume2, 
  VolumeX, 
  Play, 
  Award, 
  Zap, 
  ArrowLeft,
  ArrowRight,
  ArrowUp,
  RotateCcw,
  Plus
} from "lucide-react";

// Synthesizer for retro audio feedback without needing external assets
const playSynthSound = (type: "oof" | "jump" | "coin" | "build" | "win" | "click") => {
  try {
    const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioContextClass) return;
    const ctx = new AudioContextClass();
    
    if (type === "oof") {
      // Classic Roblox "OOF" synthesis
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = "triangle";
      osc.frequency.setValueAtTime(115, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(190, ctx.currentTime + 0.08);
      
      gain.gain.setValueAtTime(0.35, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.14);
      
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 0.15);
    } else if (type === "jump") {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = "sine";
      osc.frequency.setValueAtTime(180, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(450, ctx.currentTime + 0.12);
      
      gain.gain.setValueAtTime(0.2, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.13);
      
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 0.14);
    } else if (type === "coin") {
      const now = ctx.currentTime;
      const playBeep = (freq: number, start: number, duration: number) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = "sine";
        osc.frequency.setValueAtTime(freq, start);
        gain.gain.setValueAtTime(0.12, start);
        gain.gain.exponentialRampToValueAtTime(0.01, start + duration);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(start);
        osc.stop(start + duration);
      };
      playBeep(987.77, now, 0.08); // B5
      playBeep(1318.51, now + 0.06, 0.15); // E6
    } else if (type === "build") {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = "square";
      osc.frequency.setValueAtTime(140, ctx.currentTime);
      osc.frequency.setValueAtTime(75, ctx.currentTime + 0.04);
      
      gain.gain.setValueAtTime(0.15, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.08);
      
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 0.09);
    } else if (type === "win") {
      const now = ctx.currentTime;
      const notes = [523.25, 659.25, 783.99, 1046.50]; // C5, E5, G5, C6
      notes.forEach((freq, idx) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = "sine";
        osc.frequency.setValueAtTime(freq, now + idx * 0.08);
        gain.gain.setValueAtTime(0.15, now + idx * 0.08);
        gain.gain.exponentialRampToValueAtTime(0.01, now + idx * 0.08 + 0.18);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(now + idx * 0.08);
        osc.stop(now + idx * 0.08 + 0.2);
      });
    } else if (type === "click") {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = "sine";
      osc.frequency.setValueAtTime(300, ctx.currentTime);
      gain.gain.setValueAtTime(0.1, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.04);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 0.05);
    }
  } catch (err) {
    console.warn("Audio Context blocked or failed:", err);
  }
};

interface Props {
  lang: "mn" | "en";
}

interface Skin {
  id: string;
  nameMn: string;
  nameEn: string;
  cost: number;
  colorHead: string;
  colorTorso: string;
  colorLegs: string;
  descMn: string;
  descEn: string;
  hasCap?: boolean;
  hasCrown?: boolean;
  hasHelmet?: boolean;
}

const SKINS: Skin[] = [
  { id: "noob", nameMn: "Классик Noob", nameEn: "Classic Noob", cost: 0, colorHead: "#FFD000", colorTorso: "#0051FF", colorLegs: "#00E100", descMn: "Роблоксын хамгийн алдартай, хайртай дүр.", descEn: "The legendary, beloved Roblox icon." },
  { id: "guest", nameMn: "Roblox Зочин", nameEn: "Roblox Guest", cost: 150, colorHead: "#FFE099", colorTorso: "#111111", colorLegs: "#333333", descMn: "Сэрүүн хар малгай болон жинсэн өмдтэй зочин.", descEn: "A guest sporting a stylish black cap & dark trousers.", hasCap: true },
  { id: "cyber", nameMn: "Неон Хакер", nameEn: "Neon Hacker", cost: 450, colorHead: "#6FFF00", colorTorso: "#1F003C", colorLegs: "#FF007F", descMn: "Үсрэлтийн хурд болон чадварыг нэмэгдүүлнэ.", descEn: "Cybernetic glowing attire fit for a code slinger." },
  { id: "king", nameMn: "Робукс Хаан", nameEn: "Robux King", cost: 1200, colorHead: "#FFD000", colorTorso: "#AA0000", colorLegs: "#222222", descMn: "Алтан титэм болон язгууртан улаан хувцастай.", descEn: "Dressed in royal red and crowned with solid blocky gold.", hasCrown: true },
  { id: "astro", nameMn: "Агваан Сансрын Баатар", nameEn: "Space Astronaut", cost: 2500, colorHead: "#EAEAEA", colorTorso: "#6FFF00", colorLegs: "#333333", descMn: "Хорвоогийн хамгийн шилдэг сансрын хамгаалагч.", descEn: "The ultimate astronaut gear optimized for space flight.", hasHelmet: true }
];

export function Roblox2D({ lang }: Props) {
  const [soundEnabled, setSoundEnabled] = useState<boolean>(true);
  const [activeSubTab, setActiveSubTab] = useState<"obby" | "tycoon" | "shop">("obby");
  
  // Persistent Roblox States
  const [robux, setRobux] = useState<number>(() => {
    const saved = localStorage.getItem("roblox_robux_bal");
    return saved ? parseInt(saved, 10) : 100; // start with a small gift of 100 Robux!
  });
  
  const [currentSkin, setCurrentSkin] = useState<string>(() => {
    return localStorage.getItem("roblox_active_skin") || "noob";
  });

  const [unlockedSkins, setUnlockedSkins] = useState<string[]>(() => {
    const saved = localStorage.getItem("roblox_unlocked_skins");
    return saved ? JSON.parse(saved) : ["noob"];
  });

  // Tycoon states
  const [dropperLevels, setDropperLevels] = useState<Record<string, number>>(() => {
    const saved = localStorage.getItem("roblox_dropper_lvls");
    return saved ? JSON.parse(saved) : { wood: 0, iron: 0, cyber: 0, cosmic: 0 };
  });

  // Obby stats
  const [lobbyHighScore, setLobbyHighScore] = useState<number>(() => {
    const saved = localStorage.getItem("roblox_obby_hiscore");
    return saved ? parseInt(saved, 10) : 0;
  });

  const [currentLevel, setCurrentLevel] = useState<number>(1);
  const [gameState, setGameState] = useState<"idle" | "playing" | "gameover" | "completed">("idle");
  const [gameScore, setGameScore] = useState<number>(0);

  // Tycoon generators parameters
  const dropperConfigs = {
    wood: { nameMn: "Модон Дроппер", nameEn: "Wooden Dropper", baseCost: 40, income: 1, color: "#8B5A2B" },
    iron: { nameMn: "Төмөр Дроппер", nameEn: "Metal Dropper", baseCost: 150, income: 5, color: "#7F8C8D" },
    cyber: { nameMn: "Неон Дроппер", nameEn: "Neon Dropper", baseCost: 600, income: 25, color: "#6FFF00" },
    cosmic: { nameMn: "Галактик Дроппер", nameEn: "Cosmic Dropper", baseCost: 2500, income: 120, color: "#b724ff" }
  };

  const [floatingTexts, setFloatingTexts] = useState<{ id: number; x: number; y: number; text: string }[]>([]);
  const [activeTycoonConveyors, setActiveTycoonConveyors] = useState<{ id: number; color: string; progress: number }[]>([]);

  // Canvas details
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  
  // Game input controllers
  const keysRef = useRef<Record<string, boolean>>({});
  const gameLoopRef = useRef<number | null>(null);

  // Save changes wrapper
  useEffect(() => {
    localStorage.setItem("roblox_robux_bal", robux.toString());
  }, [robux]);

  useEffect(() => {
    localStorage.setItem("roblox_active_skin", currentSkin);
  }, [currentSkin]);

  useEffect(() => {
    localStorage.setItem("roblox_unlocked_skins", JSON.stringify(unlockedSkins));
  }, [unlockedSkins]);

  useEffect(() => {
    localStorage.setItem("roblox_dropper_lvls", JSON.stringify(dropperLevels));
  }, [dropperLevels]);

  // Tycoon Idle income generator
  useEffect(() => {
    const interval = setInterval(() => {
      let totalIncome = 0;
      Object.entries(dropperLevels).forEach(([key, lvl]) => {
        const config = dropperConfigs[key as keyof typeof dropperConfigs];
        if (config && (lvl as number) > 0) {
          totalIncome += config.income * (lvl as number);
        }
      });
      if (totalIncome > 0) {
        setRobux((prev) => prev + totalIncome);
        // Add Conveyor particle visual triggers
        if (activeSubTab === "tycoon" && Math.random() > 0.4) {
          const randKey = Object.keys(dropperLevels).filter(k => (dropperLevels[k] as number) > 0);
          if (randKey.length > 0) {
            const picked = randKey[Math.floor(Math.random() * randKey.length)];
            const color = dropperConfigs[picked as keyof typeof dropperConfigs].color;
            setActiveTycoonConveyors(prev => [
              ...prev.slice(-10), 
              { id: Date.now() + Math.random(), color, progress: 0 }
            ]);
          }
        }
      }
    }, 1000);
    return () => clearInterval(interval);
  }, [dropperLevels, activeSubTab]);

  // Conveyor particle advancement timer
  useEffect(() => {
    if (activeSubTab !== "tycoon") return;
    const interval = setInterval(() => {
      setActiveTycoonConveyors((prev) => 
        prev
          .map(item => ({ ...item, progress: item.progress + 4 }))
          .filter(item => item.progress < 100)
      );
    }, 50);
    return () => clearInterval(interval);
  }, [activeSubTab]);

  // Sound triggering bridge
  const triggerAudio = (soundName: "oof" | "jump" | "coin" | "build" | "win" | "click") => {
    if (soundEnabled) {
      playSynthSound(soundName);
    }
  };

  const handleTycoonManualClick = (e: React.MouseEvent<HTMLButtonElement>) => {
    triggerAudio("click");
    setRobux((prev) => prev + 2);
    
    // Spawn floating gold text where clicked
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left + (Math.random() * 20 - 10);
    const y = e.clientY - rect.top - 15;
    const newF = { id: Date.now() + Math.random(), x, y, text: "+2 R$" };
    setFloatingTexts((prev) => [...prev, newF]);
    setTimeout(() => {
      setFloatingTexts((prev) => prev.filter((f) => f.id !== newF.id));
    }, 800);
  };

  // Upgrading standard Tycoon Droppers
  const buyOrUpgradeDropper = (type: "wood" | "iron" | "cyber" | "cosmic") => {
    const config = dropperConfigs[type];
    const currentLvl = dropperLevels[type] || 0;
    const cost = Math.floor(config.baseCost * Math.pow(1.5, currentLvl));

    if (robux >= cost) {
      setRobux((prev) => prev - cost);
      setDropperLevels((prev) => ({ ...prev, [type]: currentLvl + 1 }));
      triggerAudio("build");
    } else {
      triggerAudio("oof");
    }
  };

  // Avatar skin purchasing logic
  const purchaseSkin = (skin: Skin) => {
    if (unlockedSkins.includes(skin.id)) {
      setCurrentSkin(skin.id);
      triggerAudio("click");
    } else if (robux >= skin.cost) {
      setRobux((prev) => prev - skin.cost);
      setUnlockedSkins((prev) => [...prev, skin.id]);
      setCurrentSkin(skin.id);
      triggerAudio("win");
    } else {
      triggerAudio("oof");
    }
  };

  // OBBY CANVAS GAME ENGINE
  const startObbyGame = (lvl: number) => {
    setCurrentLevel(lvl);
    setGameState("playing");
    setGameScore(0);
    triggerAudio("win");
    
    // Reset inputs
    keysRef.current = {};
    
    // Launch actual canvas frame updates
    setTimeout(() => {
      if (canvasRef.current) {
        initPhysicsAndCanvas();
      }
    }, 100);
  };

  const initPhysicsAndCanvas = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // Fixed dimensions for internal coordinates
    const gameWidth = 800;
    const gameHeight = 400;
    canvas.width = gameWidth;
    canvas.height = gameHeight;

    const activeSkinInfo = SKINS.find((s) => s.id === currentSkin) || SKINS[0];

    // Build unique stages
    // Platform: [x, y, width, height, type: 'normal'|'lava'|'bounce'|'goal']
    let platforms: [number, number, number, number, string][] = [];
    let robuxCoins: { x: number; y: number; collected: boolean; size: number }[] = [];

    if (currentLevel === 1) {
      // Level 1: Classic Roblox Obby
      platforms = [
        [0, 360, 160, 40, "normal"],     // Start platform
        [220, 310, 100, 15, "normal"],
        [360, 260, 80, 15, "normal"],
        [430, 260, 50, 15, "lava"],      // Tiny lava barrier
        [540, 220, 90, 15, "normal"],
        [680, 180, 110, 220, "goal"],    // Goal sector
        [200, 375, 480, 25, "lava"],     // Pit of doom lava!
      ];
      robuxCoins = [
        { x: 270, y: 260, collected: false, size: 10 },
        { x: 400, y: 210, collected: false, size: 10 },
        { x: 580, y: 170, collected: false, size: 10 },
      ];
    } else if (currentLevel === 2) {
      // Level 2: Space Station Obby
      platforms = [
        [0, 360, 100, 40, "normal"],
        [160, 310, 80, 15, "normal"],
        [280, 280, 40, 15, "lava"],      // lava brick
        [360, 240, 90, 15, "bounce"],    // bounce pad
        [400, 130, 80, 15, "normal"],
        [540, 160, 80, 15, "normal"],
        [620, 160, 40, 15, "lava"],      // side lava
        [700, 140, 100, 260, "goal"],
        [100, 385, 600, 15, "lava"],
      ];
      robuxCoins = [
        { x: 200, y: 260, collected: false, size: 10 },
        { x: 400, y: 70, collected: false, size: 10 },
        { x: 580, y: 110, collected: false, size: 10 },
        { x: 440, y: 200, collected: false, size: 10 },
      ];
    } else {
      // Level 3: Gremix's Extreme Space Tower
      platforms = [
        [0, 360, 80, 40, "normal"],
        [130, 300, 60, 15, "normal"],
        [240, 260, 60, 15, "normal"],
        [320, 210, 50, 15, "lava"],
        [410, 170, 70, 15, "bounce"],
        [530, 150, 50, 15, "lava"],
        [630, 200, 55, 15, "normal"],
        [720, 150, 80, 250, "goal"],
        [50, 380, 670, 20, "lava"],
      ];
      robuxCoins = [
        { x: 160, y: 250, collected: false, size: 10 },
        { x: 270, y: 210, collected: false, size: 10 },
        { x: 445, y: 90, collected: false, size: 10 },
        { x: 650, y: 150, collected: false, size: 10 },
        { x: 345, y: 160, collected: false, size: 10 },
      ];
    }

    // Player initial properties
    let pX = 25;
    let pY = 300;
    let pVx = 0;
    let pVy = 0;
    const pWidth = 22;
    const pHeight = 34;
    let pGrounded = false;
    let facingRight = true;

    // Death / Explode animation state
    let isDead = false;
    let deathTimer = 0;
    let deathParticles: { x: number; y: number; vx: number; vy: number; r: number; color: string; spin: number; dSpin: number }[] = [];

    // Coin rotational angle ticker
    let coinRot = 0;

    // Custom trails for Astronaut or Cyber
    let trailParticles: { x: number; y: number; color: string; alpha: number; size: number }[] = [];

    const updateGame = () => {
      if (isDead) {
        deathTimer++;
        // update death debris physics
        deathParticles.forEach((pt) => {
          pt.x += pt.vx;
          pt.y += pt.vy;
          pt.vy += 0.45; // gravity
          pt.spin += pt.dSpin;
        });

        if (deathTimer > 45) {
          // Respawn player
          isDead = false;
          deathTimer = 0;
          deathParticles = [];
          pX = 25;
          pY = 300;
          pVx = 0;
          pVy = 0;
        }
        return;
      }

      // Keyboard Inputs and movement speed upgrades
      let speedMultiplier = 1.0;
      let jumpBoost = 1.0;

      // Unlocked speed adjustments based on outfitted skins
      if (currentSkin === "guest") speedMultiplier = 1.15;
      if (currentSkin === "cyber") { speedMultiplier = 1.25; jumpBoost = 1.1; }
      if (currentSkin === "king") speedMultiplier = 1.1;
      if (currentSkin === "astro") { speedMultiplier = 1.05; jumpBoost = 1.3; } // low gravity

      const moveSpeed = 4.2 * speedMultiplier;
      const jumpStrength = -9.2 * jumpBoost;
      const gravity = currentSkin === "astro" ? 0.32 : 0.45; // lower gravity for spaceman

      // Key evaluations
      if (keysRef.current["ArrowLeft"] || keysRef.current["a"] || keysRef.current["A"] || keysRef.current["left_btn"]) {
        pVx = -moveSpeed;
        facingRight = false;
      } else if (keysRef.current["ArrowRight"] || keysRef.current["d"] || keysRef.current["D"] || keysRef.current["right_btn"]) {
        pVx = moveSpeed;
        facingRight = true;
      } else {
        pVx *= 0.8; // inertia dampening
      }

      // Jump control (requires grounded status)
      if ((keysRef.current["ArrowUp"] || keysRef.current["w"] || keysRef.current["W"] || keysRef.current[" "] || keysRef.current["jump_btn"]) && pGrounded) {
        pVy = jumpStrength;
        pGrounded = false;
        triggerAudio("jump");
        keysRef.current["jump_btn"] = false; // reset virtual jump immediately
      }

      // Apply vertical gravity
      pVy += gravity;

      // Boundary limits
      pX += pVx;
      pY += pVy;

      if (pX < 0) pX = 0;
      if (pX > gameWidth - pWidth) pX = gameWidth - pWidth;

      // Platform Collisions
      pGrounded = false;
      platforms.forEach(([platX, platY, platW, platH, platType]) => {
        // Simple bounding box checks
        if (
          pX + pWidth > platX &&
          pX < platX + platW &&
          pY + pHeight > platY &&
          pY < platY + platH
        ) {
          // Identify Collision type
          if (platType === "lava") {
            // Trigger Noob OOF death!
            isDead = true;
            triggerAudio("oof");
            
            // Build debris blocks flying in different directions
            const colors = [activeSkinInfo.colorHead, activeSkinInfo.colorTorso, activeSkinInfo.colorLegs, "#FFD000"];
            for (let i = 0; i < 12; i++) {
              deathParticles.push({
                x: pX + pWidth / 2,
                y: pY + pHeight / 2,
                vx: (Math.random() * 8 - 4),
                vy: (Math.random() * -8 - 2),
                r: Math.random() * 6 + 4,
                color: colors[i % colors.length],
                spin: Math.random() * Math.PI,
                dSpin: (Math.random() * 0.4 - 0.2)
              });
            }
          } else if (platType === "goal") {
            // Complete level!
            setGameState("completed");
            triggerAudio("win");
            
            // Calculate and award Robux prizes
            const levelBounty = currentLevel * 80;
            const scoreBounty = gameScore * 10;
            const payout = levelBounty + scoreBounty;
            
            setRobux((prev) => prev + payout);
            
            if (payout > lobbyHighScore) {
              setLobbyHighScore(payout);
              localStorage.setItem("roblox_obby_hiscore", payout.toString());
            }

            // Halt animation frame loop
            if (gameLoopRef.current) {
              cancelAnimationFrame(gameLoopRef.current);
              gameLoopRef.current = null;
            }
          } else {
            // Normal solid platform resolutions
            // Check if player lands from top of the platform
            const overlapX = Math.min(pX + pWidth - platX, platX + platW - pX);
            const overlapY = Math.min(pY + pHeight - platY, platY + platH - pY);

            if (overlapY < overlapX) {
              // vertical resolve
              if (pVy > 0 && pY + pHeight - pVy <= platY + 1.2) {
                pY = platY - pHeight;
                pVy = 0;
                pGrounded = true;

                if (platType === "bounce") {
                  pVy = jumpStrength * 1.5; // mega launch
                  pGrounded = false;
                  triggerAudio("jump");
                }
              } else if (pVy < 0) {
                pY = platY + platH;
                pVy = 0;
              }
            } else {
              // horizontal resolve
              if (pVx > 0) {
                pX = platX - pWidth;
              } else if (pVx < 0) {
                pX = platX + platW;
              }
            }
          }
        }
      });

      // Pit of lava floor guard checks
      if (pY > gameHeight) {
        // play oof and trigger death
        isDead = true;
        triggerAudio("oof");
        // simple particles
        for (let i = 0; i < 8; i++) {
          deathParticles.push({
            x: pX + pWidth / 2,
            y: gameHeight - 10,
            vx: (Math.random() * 6 - 3),
            vy: (Math.random() * -6 - 2),
            r: Math.random() * 6 + 4,
            color: activeSkinInfo.colorTorso,
            spin: 0,
            dSpin: 0.1
          });
        }
      }

      // Coin collections
      robuxCoins.forEach((coin) => {
        if (!coin.collected) {
          const cX = coin.x;
          const cY = coin.y;
          // check distance to player mid
          const dist = Math.hypot((pX + pWidth / 2) - cX, (pY + pHeight / 2) - cY);
          if (dist < 25) {
            coin.collected = true;
            setGameScore((prev) => prev + 1);
            triggerAudio("coin");
          }
        }
      });

      // Special particle trails (Rainbow or neon spacer)
      if (currentSkin === "cyber" || currentSkin === "astro") {
        if (Math.abs(pVx) > 0.5) {
          trailParticles.push({
            x: pX + (facingRight ? 2 : pWidth - 2),
            y: pY + pHeight / 2 + (Math.random() * 10 - 5),
            color: currentSkin === "cyber" ? "#6FFF00" : "#ff007f",
            alpha: 1.0,
            size: Math.random() * 4 + 2
          });
        }
      }
      trailParticles = trailParticles
        .map(pt => ({ ...pt, alpha: pt.alpha - 0.05, size: pt.size * 0.95 }))
        .filter(pt => pt.alpha > 0);
    };

    const drawGame = () => {
      // Clear stage
      ctx.clearRect(0, 0, gameWidth, gameHeight);

      // Sky Background gradient
      const skyGrad = ctx.createLinearGradient(0, 0, 0, gameHeight);
      skyGrad.addColorStop(0, "#010828");
      skyGrad.addColorStop(1, "#020d3d");
      ctx.fillStyle = skyGrad;
      ctx.fillRect(0, 0, gameWidth, gameHeight);

      // Ambient Space Stars
      ctx.fillStyle = "rgba(255, 255, 255, 0.4)";
      for (let i = 0; i < 35; i++) {
        const starX = (i * 27) % gameWidth;
        const starY = (i * 19) % gameHeight;
        ctx.fillRect(starX, starY, 1.8, 1.8);
      }

      // Draw particle trails
      trailParticles.forEach((pt) => {
        ctx.fillStyle = pt.color;
        ctx.globalAlpha = pt.alpha;
        ctx.beginPath();
        ctx.arc(pt.x, pt.y, pt.size, 0, Math.PI * 2);
        ctx.fill();
      });
      ctx.globalAlpha = 1.0;

      // Draw Platforms
      platforms.forEach(([platX, platY, platW, platH, platType]) => {
        if (platType === "lava") {
          // Hot glowing red/orange lava block
          ctx.fillStyle = "#FF2200";
          ctx.fillRect(platX, platY, platW, platH);
          ctx.strokeStyle = "#FF8000";
          ctx.lineWidth = 2.5;
          ctx.strokeRect(platX, platY, platW, platH);
          
          // lava heat lines
          ctx.fillStyle = "#FFB300";
          ctx.fillRect(platX + platW * 0.25, platY + 2, platW * 0.5, 3);
        } else if (platType === "bounce") {
          // Purple bouncy trampoline plate
          ctx.fillStyle = "#a855f7";
          ctx.fillRect(platX, platY, platW, platH);
          ctx.fillStyle = "#ff007f";
          ctx.fillRect(platX + 5, platY, platW - 10, 4); // bouncing stripe
        } else if (platType === "goal") {
          // Glorious Gold Exit Portal
          ctx.fillStyle = "rgba(255, 215, 0, 0.2)";
          ctx.fillRect(platX, platY, platW, platH);

          // Golden side pillars
          ctx.fillStyle = "#D4AF37";
          ctx.fillRect(platX, platY, 15, platH);
          ctx.fillRect(platX + platW - 15, platY, 15, platH);

          // Star portal ring
          ctx.strokeStyle = "#FFD700";
          ctx.lineWidth = 3;
          ctx.setLineDash([4, 4]);
          ctx.beginPath();
          ctx.arc(platX + platW / 2, platY + 100, 45, 0, Math.PI * 2);
          ctx.stroke();
          ctx.setLineDash([]);

          ctx.font = "bold 11px monospace";
          ctx.fillStyle = "#FFFFFF";
          ctx.textAlign = "center";
          ctx.fillText("GOAL", platX + platW / 2, platY + 25);
        } else {
          // Classic Green grass on grey dirt Roblox blocks
          ctx.fillStyle = "#4A4D52"; // dark grey stone
          ctx.fillRect(platX, platY, platW, platH);
          ctx.fillStyle = "#00E100"; // bright green grass cap
          ctx.fillRect(platX, platY, platW, Math.min(platH, 6));
        }
      });

      // Draw Spinning Coins
      coinRot += 0.08;
      robuxCoins.forEach((coin) => {
        if (!coin.collected) {
          ctx.save();
          ctx.translate(coin.x, coin.y);
          // Scale X to simulate rotational spinning
          ctx.scale(Math.abs(Math.sin(coinRot)), 1.0);
          
          // Shiny Golden hex coin outer rim
          ctx.fillStyle = "#FFD700";
          ctx.beginPath();
          ctx.arc(0, 0, coin.size, 0, Math.PI * 2);
          ctx.fill();

          // Silver inner 'R$' logo text
          ctx.fillStyle = "#FFFFFF";
          ctx.font = "bold 9px Arial";
          ctx.textAlign = "center";
          ctx.textBaseline = "middle";
          ctx.fillText("R$", 0, 0);

          ctx.restore();
        }
      });

      // Draw Player or Debris Block particles
      if (isDead) {
        deathParticles.forEach((pt) => {
          ctx.fillStyle = pt.color;
          ctx.save();
          ctx.translate(pt.x, pt.y);
          ctx.rotate(pt.spin);
          ctx.fillRect(-pt.r, -pt.r, pt.r * 2, pt.r * 2);
          ctx.restore();
        });
      } else {
        // Draw the iconic Roblox Noob character block by block!
        ctx.save();
        ctx.translate(pX, pY);

        const fillHead = activeSkinInfo.colorHead;
        const fillTorso = activeSkinInfo.colorTorso;
        const fillLegs = activeSkinInfo.colorLegs;

        // 1. Legs (two separate vertical bars)
        ctx.fillStyle = fillLegs;
        ctx.fillRect(1, 20, 9, 14);
        ctx.fillRect(12, 20, 9, 14);

        // 2. Torso (square core)
        ctx.fillStyle = fillTorso;
        ctx.fillRect(2, 8, 18, 12);

        // 3. Head (yellow blocky square on top)
        ctx.fillStyle = fillHead;
        ctx.fillRect(5, 0, 12, 10);

        // 4. Smile Face (classic smile pixels)
        ctx.fillStyle = "#000000";
        // Eyes
        ctx.fillRect(7, 3, 2, 2);
        ctx.fillRect(13, 3, 2, 2);
        // Smile curve
        ctx.fillRect(8, 6, 6, 1.5);
        ctx.fillRect(8, 5, 1.2, 1.5);
        ctx.fillRect(12.8, 5, 1.2, 1.5);

        // 5. Special skin details (e.g. hats, halos, helmets)
        if (activeSkinInfo.hasCap) {
          // Draw backward black cap
          ctx.fillStyle = "#E50000"; // red cap
          ctx.fillRect(3, -2, 15, 3);
          ctx.fillRect(14, -1, 6, 2.5); // cap visor
        }
        if (activeSkinInfo.hasCrown) {
          // Gold crown
          ctx.fillStyle = "#FFD700";
          ctx.beginPath();
          ctx.moveTo(4, 0);
          ctx.lineTo(4, -4);
          ctx.lineTo(8, -1);
          ctx.lineTo(11, -5);
          ctx.lineTo(14, -1);
          ctx.lineTo(18, -4);
          ctx.lineTo(18, 0);
          ctx.closePath();
          ctx.fill();
        }
        if (activeSkinInfo.hasHelmet) {
          // Neon green spacer visor
          ctx.fillStyle = "rgba(0, 255, 255, 0.6)";
          ctx.fillRect(5, 2, 12, 3.5);
          ctx.strokeStyle = "#FFFFFF";
          ctx.lineWidth = 1;
          ctx.strokeRect(4, -1, 14, 10);
        }

        ctx.restore();
      }
    };

    const runLoop = () => {
      updateGame();
      drawGame();
      if (gameState === "playing") {
        gameLoopRef.current = requestAnimationFrame(runLoop);
      }
    };

    // Attach listeners and start
    gameLoopRef.current = requestAnimationFrame(runLoop);
  };

  // Halt animation loop on unmount
  useEffect(() => {
    return () => {
      if (gameLoopRef.current) {
        cancelAnimationFrame(gameLoopRef.current);
      }
    };
  }, [gameState]);

  // Keyboard binding bridges
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (gameState !== "playing") return;
      if (["ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight", " "].includes(e.key)) {
        e.preventDefault(); // prevent iframe scrolling
      }
      keysRef.current[e.key] = true;
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      if (gameState !== "playing") return;
      keysRef.current[e.key] = false;
    };

    window.addEventListener("keydown", handleKeyDown);
    window.addEventListener("keyup", handleKeyUp);
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener("keyup", handleKeyUp);
    };
  }, [gameState]);

  const setVirtualKey = (key: string, isDown: boolean) => {
    keysRef.current[key] = isDown;
  };

  return (
    <div className="w-full flex flex-col gap-6" id="roblox-universe-container">
      {/* Top Banner and Navigation Bar */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center bg-white/[0.01] p-5 rounded-3xl border border-white/10 gap-4 liquid-glass">
        <div className="flex items-center gap-3">
          {/* Square red Roblox icon */}
          <div className="w-10 h-10 bg-red-600 rounded-xl flex items-center justify-center font-extrabold text-white text-2xl select-none rotate-6 border-2 border-white/20 shadow-md">
            R
          </div>
          <div>
            <span className="text-neon text-[9px] font-bold tracking-[0.2em] block">ROBLOX 2D CREATIVE PLATFORM</span>
            <h3 className="font-grotesk text-2xl text-cream uppercase tracking-wider leading-none">
              {lang === "mn" ? "НООБ-ЫН ГАЛАКТИК" : "NOOB'S GALAXY"}
            </h3>
          </div>
        </div>

        {/* Central Balance Box */}
        <div className="flex items-center gap-4 self-end sm:self-auto">
          {/* Sound trigger */}
          <button 
            onClick={() => setSoundEnabled(!soundEnabled)}
            className="p-2 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 cursor-pointer text-cream/70 hover:text-cream"
          >
            {soundEnabled ? <Volume2 className="w-4 h-4 text-neon" /> : <VolumeX className="w-4 h-4 text-red-400" />}
          </button>

          {/* Robux Balance Box */}
          <div className="flex items-center gap-2 bg-[#020d35] px-4 py-2 rounded-2xl border border-yellow-500/30 shadow-[0_0_15px_rgba(251,191,36,0.1)]">
            <span className="font-mono text-xs text-yellow-500 font-bold uppercase">R$</span>
            <span className="font-mono font-extrabold text-yellow-400 text-lg leading-none animate-pulse">
              {robux.toLocaleString()}
            </span>
          </div>
        </div>
      </div>

      {/* Sub Navigation Tabs */}
      <div className="flex bg-white/[0.02] p-1.5 rounded-[18px] border border-white/10 gap-1.5 font-mono">
        {[
          { id: "obby", labelMn: "🏃‍♂️ ОББИ ПЛАТФОРМ", labelEn: "🏃‍♂️ PLAY OBBY", icon: Gamepad },
          { id: "tycoon", labelMn: "🏭 РОБУКС ТАЙКУН", labelEn: "🏭 ROBUX TYCOON", icon: Layers },
          { id: "shop", labelMn: "👕 АВАТАР ДЭЛГҮҮР", labelEn: "👕 AVATAR SHOP", icon: ShoppingCart }
        ].map((tab) => {
          const isActive = activeSubTab === tab.id;
          const Icon = tab.icon;
          return (
            <button
              key={tab.id}
              onClick={() => {
                setActiveSubTab(tab.id as any);
                triggerAudio("click");
              }}
              className={`flex-1 py-2.5 rounded-xl text-xs font-bold uppercase transition-all duration-300 flex items-center justify-center gap-2 cursor-pointer ${
                isActive
                  ? "bg-white/10 text-white border border-white/10"
                  : "text-white/50 hover:text-white/80 hover:bg-white/[0.02]"
              }`}
            >
              <Icon className={`w-3.5 h-3.5 ${isActive ? "text-neon" : ""}`} />
              <span>{lang === "mn" ? tab.labelMn : tab.labelEn}</span>
            </button>
          );
        })}
      </div>

      {/* Primary Display Content Container */}
      <div className="w-full">
        <AnimatePresence mode="wait">
          
          {/* OBBY VIEW TAB */}
          {activeSubTab === "obby" && (
            <motion.div
              key="obby-tab"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="flex flex-col gap-5 w-full"
            >
              {gameState === "idle" && (
                <div className="liquid-glass rounded-3xl p-8 border border-white/10 text-center flex flex-col items-center justify-center min-h-[350px] relative overflow-hidden">
                  <div className="absolute inset-0 opacity-[0.02] pointer-events-none" style={{ backgroundImage: "radial-gradient(circle, #6FFF00 1.5px, transparent 1.5px)", backgroundSize: "24px 24px" }} />
                  
                  <Gamepad className="w-16 h-16 text-neon mb-4 animate-bounce" />
                  <h4 className="font-grotesk text-2xl text-cream uppercase mb-2">
                    {lang === "mn" ? "НООБ-ЫН САНСРЫН АЯЛАЛ" : "NOOB'S GALACTIC OBBY"}
                  </h4>
                  <p className="text-xs text-cream/70 max-w-lg uppercase font-mono tracking-wide leading-relaxed mb-6">
                    {lang === "mn"
                      ? "Та 2D аватараа удирдан улаан лаавыг давж, Алтан порталд хүрч чадах уу? Замдаа Робукс цуглуулаарай!"
                      : "Navigate your Roblox Noob character through perilous block formations, dodge extreme red lava fields, and reach the cosmic gateway!"}
                  </p>

                  <div className="flex flex-wrap justify-center gap-4 w-full max-w-md">
                    {[
                      { num: 1, nameMn: "Шавар Ланд", nameEn: "Classic Land" },
                      { num: 2, nameMn: "Сансрын Буудал", nameEn: "Space Hub" },
                      { num: 3, nameMn: "Грэмиксийн Цонх", nameEn: "Gremix Ascent" }
                    ].map((lvl) => (
                      <button
                        key={lvl.num}
                        onClick={() => startObbyGame(lvl.num)}
                        className="flex-1 min-w-[120px] py-3.5 px-4 rounded-2xl bg-[#020d35] hover:bg-neon border border-white/10 hover:border-neon hover:text-black transition-all cursor-pointer text-center font-mono text-xs font-bold uppercase flex flex-col gap-1 shadow-md hover:shadow-neon/20"
                      >
                        <span className="text-[10px] text-cream/50 hover:text-black/50">LEVEL {lvl.num}</span>
                        <span>{lang === "mn" ? lvl.nameMn : lvl.nameEn}</span>
                      </button>
                    ))}
                  </div>

                  <div className="mt-8 text-[11px] text-cream/40 font-mono uppercase flex items-center gap-2">
                    <span>🏆 {lang === "mn" ? "ОББИ ХАМГИЙН ӨНДӨР ОНОО:" : "OBBY ALL-TIME RECORD:"}</span>
                    <span className="text-neon font-bold">{lobbyHighScore} R$</span>
                  </div>
                </div>
              )}

              {gameState === "playing" && (
                <div className="flex flex-col gap-4">
                  {/* Score status line */}
                  <div className="flex justify-between items-center text-xs font-mono text-cream/70 bg-white/[0.02] border border-white/5 p-3 rounded-xl uppercase">
                    <div className="flex items-center gap-2">
                      <span className="w-2.5 h-2.5 bg-neon rounded-full animate-ping" />
                      <span>{lang === "mn" ? "ХОЛБОГДСОН // ТҮВШИН " : "SECURE CHANNEL // STAGE "}{currentLevel}</span>
                    </div>
                    <div>
                      {lang === "mn" ? "ЦУГЛУУЛСАН: " : "COINS: "}<span className="text-yellow-400 font-bold">{gameScore} 🪙</span>
                    </div>
                  </div>

                  {/* Canvas block wrapper */}
                  <div className="relative w-full aspect-video md:max-h-[360px] bg-[#000418] rounded-3xl border border-white/10 overflow-hidden shadow-2xl">
                    <canvas 
                      ref={canvasRef} 
                      className="w-full h-full block touch-none"
                    />
                  </div>

                  {/* On-Screen Mobile & Touch Controllers (Essential for iframe sandbox layouts) */}
                  <div className="flex justify-between items-center bg-white/[0.01] p-4 rounded-3xl border border-white/5 gap-4">
                    <div className="flex gap-2">
                      <button
                        onMouseDown={() => setVirtualKey("left_btn", true)}
                        onMouseUp={() => setVirtualKey("left_btn", false)}
                        onTouchStart={(e) => { e.preventDefault(); setVirtualKey("left_btn", true); }}
                        onTouchEnd={(e) => { e.preventDefault(); setVirtualKey("left_btn", false); }}
                        className="w-14 h-14 bg-white/5 hover:bg-white/10 active:bg-neon active:text-black rounded-2xl border border-white/10 flex items-center justify-center text-cream cursor-pointer transition-all select-none"
                      >
                        <ArrowLeft className="w-6 h-6" />
                      </button>
                      <button
                        onMouseDown={() => setVirtualKey("right_btn", true)}
                        onMouseUp={() => setVirtualKey("right_btn", false)}
                        onTouchStart={(e) => { e.preventDefault(); setVirtualKey("right_btn", true); }}
                        onTouchEnd={(e) => { e.preventDefault(); setVirtualKey("right_btn", false); }}
                        className="w-14 h-14 bg-white/5 hover:bg-white/10 active:bg-neon active:text-black rounded-2xl border border-white/10 flex items-center justify-center text-cream cursor-pointer transition-all select-none"
                      >
                        <ArrowRight className="w-6 h-6" />
                      </button>
                    </div>

                    <div className="text-center font-mono text-[10px] text-cream/40 uppercase hidden sm:block">
                      {lang === "mn" ? "[ A/D буюу Сумнуудаар удирдаж, Space-ээр үсэрнэ ]" : "[ Use Arrow Keys / WASD, Space to Jump ]"}
                    </div>

                    <button
                      onMouseDown={() => setVirtualKey("jump_btn", true)}
                      onMouseUp={() => setVirtualKey("jump_btn", false)}
                      onTouchStart={(e) => { e.preventDefault(); setVirtualKey("jump_btn", true); }}
                      onTouchEnd={(e) => { e.preventDefault(); setVirtualKey("jump_btn", false); }}
                      className="w-20 h-14 bg-white/5 hover:bg-white/10 active:bg-neon active:text-black rounded-2xl border border-white/10 flex flex-col items-center justify-center text-cream cursor-pointer transition-all select-none font-bold text-xs font-mono uppercase"
                    >
                      <ArrowUp className="w-5 h-5 mb-0.5" />
                      JUMP
                    </button>
                  </div>
                </div>
              )}

              {gameState === "completed" && (
                <div className="liquid-glass rounded-3xl p-8 border border-neon/30 text-center flex flex-col items-center justify-center min-h-[350px] shadow-[0_0_20px_rgba(111,255,0,0.15)]">
                  <Award className="w-16 h-16 text-yellow-400 mb-4 animate-pulse" />
                  <h4 className="font-grotesk text-3xl text-neon uppercase mb-1">
                    {lang === "mn" ? "ОББИ ДҮҮРГЭЛТ" : "COURSE CLEARED!"}
                  </h4>
                  <p className="text-[10px] font-mono text-cream/50 uppercase tracking-widest mb-6">
                    {lang === "mn" ? "ТА ОНЦЛОХ САНСРЫН АЯЛЛЫГ ДАВЛАА!" : "CONGRATULATIONS EXPLORER!"}
                  </p>

                  <div className="bg-[#020d35] border border-white/10 rounded-2xl p-6 w-full max-w-sm flex flex-col gap-4 font-mono text-xs uppercase text-cream/80 text-left">
                    <div className="flex justify-between border-b border-white/5 pb-2">
                      <span>{lang === "mn" ? "ТҮВШНИЙ УРАМШУУЛАЛ:" : "LEVEL PASS BONUS:"}</span>
                      <span className="text-neon font-bold">+{currentLevel * 80} R$</span>
                    </div>
                    <div className="flex justify-between border-b border-white/5 pb-2">
                      <span>{lang === "mn" ? "Робукс зоос урамшуулал:" : "COINS MULTIPLIER:"}</span>
                      <span className="text-yellow-400 font-bold">+{gameScore * 10} R$</span>
                    </div>
                    <div className="flex justify-between font-bold text-sm text-white pt-2">
                      <span>{lang === "mn" ? "НИЙТ ШАГНАЛ:" : "TOTAL BOUNTY:"}</span>
                      <span className="text-yellow-400">+{currentLevel * 80 + gameScore * 10} ROBUX</span>
                    </div>
                  </div>

                  <div className="flex gap-4 mt-8 w-full max-w-sm">
                    <button
                      onClick={() => setGameState("idle")}
                      className="flex-1 py-3 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-cream font-bold font-mono text-xs uppercase cursor-pointer"
                    >
                      {lang === "mn" ? "ЦЭС РҮҮ БУЦАХ" : "LOBBY RECOIL"}
                    </button>
                    <button
                      onClick={() => startObbyGame(currentLevel)}
                      className="flex-1 py-3 rounded-xl bg-neon hover:bg-neon/90 text-black font-bold font-mono text-xs uppercase cursor-pointer shadow-md shadow-neon/20"
                    >
                      {lang === "mn" ? "ДАХИН ТОГЛОХ" : "PLAY AGAIN"}
                    </button>
                  </div>
                </div>
              )}
            </motion.div>
          )}

          {/* TYCOON VIEW TAB */}
          {activeSubTab === "tycoon" && (
            <motion.div
              key="tycoon-tab"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="grid grid-cols-1 md:grid-cols-12 gap-6 w-full items-stretch"
            >
              {/* Left Side: Generative Clicker and conveyer belt */}
              <div className="md:col-span-5 flex flex-col gap-6 h-full">
                {/* Visual Generator Belt */}
                <div className="liquid-glass rounded-3xl p-5 border border-white/10 font-mono text-xs text-cream/70 relative overflow-hidden flex-1 min-h-[140px] flex flex-col justify-between">
                  <span className="text-[9px] text-neon uppercase font-bold tracking-widest block">[ FACTORY INFRASTRUCTURE ]</span>
                  
                  {/* Dynamic Conveyer Belt Graphics */}
                  <div className="w-full h-16 bg-black/50 border border-white/10 rounded-xl my-4 relative overflow-hidden flex items-center px-4">
                    {/* Rolling wheels */}
                    <div className="absolute inset-x-0 bottom-1 h-2 flex justify-between px-6 opacity-30">
                      {[1, 2, 3, 4, 5, 6].map(i => (
                        <div key={i} className="w-2.5 h-2.5 rounded-full border border-white animate-spin" />
                      ))}
                    </div>

                    {/* Sliding blocks dripping */}
                    {activeTycoonConveyors.map((item) => (
                      <div
                        key={item.id}
                        className="absolute w-5.5 h-5.5 rounded shadow-sm border border-white/10"
                        style={{
                          backgroundColor: item.color,
                          left: `${item.progress}%`,
                          transition: "left 0.05s linear",
                          transform: "translateY(-4px)"
                        }}
                      />
                    ))}

                    {/* Terminal portal visual bucket */}
                    <div className="absolute right-0 top-0 bottom-0 w-8 bg-gradient-to-l from-yellow-500/20 to-transparent border-l border-yellow-500/20 flex items-center justify-center">
                      <span className="text-xs text-yellow-500 font-bold animate-pulse">R$</span>
                    </div>

                    {activeTycoonConveyors.length === 0 && (
                      <span className="text-[10px] text-cream/30 mx-auto uppercase">
                        {lang === "mn" ? "Дропперууд байршуулж R$ үүсгэ..." : "Purchase droppers to emit R$ blocks..."}
                      </span>
                    )}
                  </div>

                  <div className="flex justify-between items-center text-[10px] text-cream/40 uppercase">
                    <span>STATUS: ACTIVE INDUSTRIAL</span>
                    <span>BELT OUTFLOW</span>
                  </div>
                </div>

                {/* Big red block manual click generator */}
                <button
                  onClick={handleTycoonManualClick}
                  className="w-full py-8 rounded-3xl bg-red-600 border-b-8 border-red-800 active:border-b-2 active:translate-y-1.5 transition-all flex flex-col items-center justify-center text-center gap-2 cursor-pointer shadow-lg shadow-red-600/10 group overflow-hidden relative min-h-[160px]"
                >
                  {/* Absolute glowing layer */}
                  <div className="absolute inset-0 bg-gradient-to-t from-red-500/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                  
                  {/* Floating floatingTexts */}
                  {floatingTexts.map((txt) => (
                    <span
                      key={txt.id}
                      className="absolute font-mono font-extrabold text-yellow-400 text-sm animate-bounce"
                      style={{ left: txt.x, top: txt.y }}
                    >
                      {txt.text}
                    </span>
                  ))}

                  <div className="w-12 h-12 bg-white/10 rounded-2xl flex items-center justify-center font-black text-white text-2xl rotate-12 shadow-inner group-hover:scale-110 transition-transform">
                    R$
                  </div>
                  <span className="font-grotesk text-xl text-white uppercase tracking-wider">
                    {lang === "mn" ? "РОБУКС ҮҮСГЭХ" : "TAP TO MANUFACTURE"}
                  </span>
                  <span className="font-mono text-[9px] text-white/60 uppercase">
                    +2 ROBUX PER CLICK
                  </span>
                </button>
              </div>

              {/* Right Side: Dropper Shops */}
              <div className="md:col-span-7 flex flex-col gap-4">
                <div className="liquid-glass rounded-3xl p-6 border border-white/10 flex flex-col gap-4 flex-1">
                  <span className="text-[9px] text-[#6FFF00] font-bold tracking-widest uppercase font-mono block">
                    {lang === "mn" ? "ДРОППЕРУУД СУУЛГАХ // ЦЭХ" : "TYCOON INDUSTRIAL INFRASTRUCTURE"}
                  </span>

                  <div className="flex flex-col gap-3">
                    {Object.entries(dropperConfigs).map(([key, config]) => {
                      const currentLvl = dropperLevels[key] || 0;
                      const cost = Math.floor(config.baseCost * Math.pow(1.5, currentLvl));
                      const isAffordable = robux >= cost;

                      return (
                        <div
                          key={key}
                          className="flex items-center justify-between p-3.5 rounded-2xl bg-white/[0.01] border border-white/5 hover:border-white/10 transition-colors"
                        >
                          <div className="flex items-center gap-3">
                            {/* Colorful dropper block represent */}
                            <div 
                              className="w-10 h-10 rounded-xl flex items-center justify-center font-extrabold shadow-inner"
                              style={{ backgroundColor: `${config.color}25`, border: `2px solid ${config.color}` }}
                            >
                              <Plus className="w-4 h-4" style={{ color: config.color }} />
                            </div>
                            
                            <div>
                              <div className="flex items-center gap-2">
                                <span className="font-bold text-cream uppercase text-sm">
                                  {lang === "mn" ? config.nameMn : config.nameEn}
                                </span>
                                <span className="px-1.5 py-0.5 rounded bg-white/5 text-white/50 text-[9px] font-mono">
                                  LVL {currentLvl}
                                </span>
                              </div>
                              <span className="font-mono text-[10px] text-cream/40 uppercase block">
                                {lang === "mn" ? `Орлого: +${config.income * (currentLvl || 1)} R$/сек` : `Yield: +${config.income * (currentLvl || 1)} R$/sec`}
                              </span>
                            </div>
                          </div>

                          <button
                            onClick={() => buyOrUpgradeDropper(key as "wood" | "iron" | "cyber" | "cosmic")}
                            disabled={!isAffordable}
                            className={`px-4 py-2 rounded-xl font-mono text-xs font-bold uppercase transition-all cursor-pointer ${
                              isAffordable
                                ? "bg-neon hover:bg-neon/90 text-black shadow-md shadow-neon/10"
                                : "bg-white/5 text-white/30 cursor-not-allowed border border-white/5"
                            }`}
                          >
                            R$ {cost}
                          </button>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            </motion.div>
          )}

          {/* AVATAR SHOP VIEW TAB */}
          {activeSubTab === "shop" && (
            <motion.div
              key="shop-tab"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="flex flex-col gap-5 w-full"
            >
              {/* Active preview header */}
              <div className="liquid-glass rounded-3xl p-6 border border-white/10 flex flex-col sm:flex-row items-center gap-6 justify-between">
                <div className="flex items-center gap-4">
                  {/* Micro custom character card layout */}
                  <div className="w-16 h-16 bg-black/40 rounded-2xl border border-white/10 flex items-center justify-center relative">
                    {/* Block Noob preview */}
                    <div className="w-8 h-12 flex flex-col items-center relative">
                      {/* Legs */}
                      <div className="absolute bottom-0 w-6 h-5 flex justify-between">
                        <div className="w-2.5 h-full" style={{ backgroundColor: SKINS.find(s => s.id === currentSkin)?.colorLegs || "#00E100" }} />
                        <div className="w-2.5 h-full" style={{ backgroundColor: SKINS.find(s => s.id === currentSkin)?.colorLegs || "#00E100" }} />
                      </div>
                      {/* Torso */}
                      <div className="absolute bottom-5 w-6.5 h-4.5" style={{ backgroundColor: SKINS.find(s => s.id === currentSkin)?.colorTorso || "#0051FF" }} />
                      {/* Head */}
                      <div className="absolute top-0 w-4.5 h-4.5 rounded-sm" style={{ backgroundColor: SKINS.find(s => s.id === currentSkin)?.colorHead || "#FFD000" }} />
                    </div>
                  </div>

                  <div>
                    <span className="font-mono text-[9px] text-cream/40 block uppercase">CURRENTLY EQUIP STATUS</span>
                    <span className="font-grotesk text-xl text-cream uppercase">
                      {lang === "mn" ? SKINS.find(s => s.id === currentSkin)?.nameMn : SKINS.find(s => s.id === currentSkin)?.nameEn}
                    </span>
                  </div>
                </div>

                <div className="text-center font-mono text-[10px] text-cream/50 uppercase max-w-xs leading-normal">
                  {lang === "mn"
                    ? "Худалдаж авсан аватарууд Обби тоглоом болон талбарт дагалдах хурдны урамшуулал үзүүлнэ!"
                    : "Outfitted custom skins alter your player appearance inside the real-time Obby simulation!"}
                </div>
              </div>

              {/* Skins shop list */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {SKINS.map((skin) => {
                  const isUnlocked = unlockedSkins.includes(skin.id);
                  const isEquipped = currentSkin === skin.id;
                  const canAfford = robux >= skin.cost;

                  return (
                    <div
                      key={skin.id}
                      className={`liquid-glass rounded-2xl p-5 border flex flex-col justify-between gap-4 transition-all duration-300 ${
                        isEquipped 
                          ? "border-neon/40 bg-neon/[0.02]" 
                          : "border-white/10 hover:border-white/20 bg-white/[0.01]"
                      }`}
                    >
                      <div className="flex justify-between items-start">
                        <div className="flex gap-2">
                          {/* Mini vertical color palette */}
                          <div className="flex flex-col gap-0.5 rounded overflow-hidden border border-white/5 shadow">
                            <div className="w-4 h-2" style={{ backgroundColor: skin.colorHead }} />
                            <div className="w-4 h-3" style={{ backgroundColor: skin.colorTorso }} />
                            <div className="w-4 h-3.5" style={{ backgroundColor: skin.colorLegs }} />
                          </div>

                          <div>
                            <h5 className="font-bold text-cream text-sm uppercase leading-tight">
                              {lang === "mn" ? skin.nameMn : skin.nameEn}
                            </h5>
                            <span className="text-[10px] text-cream/40 font-mono block uppercase">
                              {skin.id === "noob" ? "FREE CLASSIC" : "PREMIUM GEAR"}
                            </span>
                          </div>
                        </div>

                        {isEquipped && (
                          <span className="px-2 py-0.5 rounded bg-neon/15 text-neon font-mono text-[9px] font-bold uppercase">
                            EQUIPPED
                          </span>
                        )}
                      </div>

                      <p className="text-[11px] text-cream/60 uppercase leading-relaxed font-mono flex-1">
                        {lang === "mn" ? skin.descMn : skin.descEn}
                      </p>

                      <div className="border-t border-white/5 pt-3 flex items-center justify-between gap-2">
                        <span className="font-mono text-[10px] text-cream/40 uppercase">
                          {isUnlocked ? "UNLOCKED" : "COST AMOUNT"}
                        </span>

                        <button
                          onClick={() => purchaseSkin(skin)}
                          className={`px-3 py-1.5 rounded-xl font-mono text-[11px] font-bold uppercase transition-all cursor-pointer ${
                            isEquipped
                              ? "bg-white/5 text-white/30 cursor-not-allowed border border-white/5"
                              : isUnlocked
                                ? "bg-white/10 hover:bg-white/20 text-white border border-white/10"
                                : canAfford
                                  ? "bg-yellow-500 hover:bg-yellow-400 text-black font-extrabold"
                                  : "bg-white/5 text-white/30 cursor-not-allowed border border-white/5"
                          }`}
                        >
                          {isEquipped 
                            ? "EQUIPPED" 
                            : isUnlocked 
                              ? "EQUIP" 
                              : `R$ ${skin.cost}`}
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </motion.div>
          )}

        </AnimatePresence>
      </div>
    </div>
  );
}

export default Roblox2D;
