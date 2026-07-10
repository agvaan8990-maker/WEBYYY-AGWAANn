/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useEffect, useRef, FormEvent } from "react";
import { 
  Sparkles, 
  Globe, 
  Volume2, 
  Gamepad, 
  Award, 
  Dribbble, 
  Tv, 
  Music, 
  Layers, 
  BookOpen, 
  Send, 
  Heart, 
  Clock, 
  Shield, 
  Flame, 
  VolumeX, 
  MessageCircle, 
  Laptop, 
  Compass, 
  UserPlus, 
  Share2,
  Keyboard
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { sound } from "./utils/audio";
import { GamerConsole } from "./components/GamerConsole";
import { AgvaanQuiz } from "./components/AgvaanQuiz";
import { SpaceCinema } from "./components/SpaceCinema";
import { IdolCoach } from "./components/IdolCoach";
import { MeAIChat } from "./components/MeAIChat";
import { EmojiAnimeGuesser } from "./components/EmojiAnimeGuesser";
import { GuestbookEntry, ThemeName, ThemeConfig } from "./types";

// Theme designs configuration mapped to dynamic Tailwind style injection
const THEMES: Record<ThemeName, ThemeConfig> = {
  cyber: {
    name: "Cyber Lime",
    bgGrad: "from-[#010828] via-[#020d3d] to-[#010828]",
    textNeon: "text-neon",
    accentColor: "#6FFF00",
    primaryBg: "bg-[#010828]",
    glowShadow: "shadow-[0_0_15px_rgba(111,255,0,0.15)]",
  },
  synthwave: {
    name: "Neon Synthwave",
    bgGrad: "from-[#0f0124] via-[#1f013d] to-[#0f0124]",
    textNeon: "text-pink-500",
    accentColor: "#f43f5e",
    primaryBg: "bg-[#0f0124]",
    glowShadow: "shadow-[0_0_15px_rgba(244,63,94,0.15)]",
  },
  purple: {
    name: "Cosmic Amethyst",
    bgGrad: "from-[#050714] via-[#0e1026] to-[#050714]",
    textNeon: "text-purple-400",
    accentColor: "#a855f7",
    primaryBg: "bg-[#050714]",
    glowShadow: "shadow-[0_0_15px_rgba(168,85,247,0.15)]",
  },
  sunset: {
    name: "Stellar Sunset",
    bgGrad: "from-[#14050d] via-[#240e1a] to-[#14050d]",
    textNeon: "text-amber-500",
    accentColor: "#f97316",
    primaryBg: "bg-[#14050d]",
    glowShadow: "shadow-[0_0_15px_rgba(249,115,22,0.15)]",
  }
};

const IMAGES = {
  avatar: "/assets/images/agvaan_avatar_realistic_1783057311559.jpg",
  basketball: "/assets/images/basketball_court_realistic_1783057238433.jpg",
  onePiece: "/assets/images/one_piece_realistic_1783057210470.jpg",
  gamerCockpit: "/assets/images/gamer_setup_realistic_1783057249864.jpg",
  btsConcert: "/assets/images/bts_concert_realistic_1783057226817.jpg",
};

// Initial templates for guestbook entries
const DEFAULT_GUESTBOOK: GuestbookEntry[] = [
  {
    id: "g1",
    name: "Bat-Erdene",
    message: "Агваан аа, CS2 дээр хамт тоглоё! Надад нэмээрэй.",
    avatar: "🎮",
    timestamp: "2026-06-22 10:20",
    likes: 5,
  },
  {
    id: "g2",
    name: "Sumiya_ARMY",
    message: "Wow, BTS concert picture is amazing in outer space! Great job, Agvaan!",
    avatar: "🎤",
    timestamp: "2026-06-22 09:12",
    likes: 8,
  },
  {
    id: "g_reply",
    name: "Agvaan (Captain)",
    message: "Баярлалаа! Үргэлж хамтдаа сансар луу хөөрцгөөе. 🚀",
    avatar: "👨‍🚀",
    timestamp: "2026-06-22 10:45",
    likes: 12,
    isAgvaanReply: true,
  }
];

export default function App() {
  const [lang, setLang] = useState<"mn" | "en">("mn");
  const [theme, setTheme] = useState<ThemeName>("cyber");
  const [activeTab, setActiveTab] = useState<"games" | "hobbies" | "creators" | "school" | "media" | "idol">("games");
  const [soundEnabled, setSoundEnabled] = useState<boolean>(true);
  
  // Custom time display parameters
  const [timeStr, setTimeStr] = useState<string>("");
  const [agvaanSpeech, setAgvaanSpeech] = useState<string>("");

  // Hobbies sub-interactions states
  // - Basketball
  const [bballHoops, setBballHoops] = useState<number>(0);
  const [bballAnim, setBballAnim] = useState<boolean>(false);
  const [isSwish, setIsSwish] = useState<boolean | null>(null);

  // - BTS Lightstick options
  const [armyBombColor, setArmyBombColor] = useState<string>("#a855f7");
  const [concertMode, setConcertMode] = useState<boolean>(false);

  // - One Piece Pirate logs choice
  const [selectedCrew, setSelectedCrew] = useState<string>("Luffy");

  // - Gremix stream simulator
  const [streamLikes, setStreamLikes] = useState<number>(999);
  const [subscriberCount, setSubscriberCount] = useState<number>(104325);
  const [subscribing, setSubscribing] = useState<boolean>(false);

  // Guestbook states
  const [guestbook, setGuestbook] = useState<GuestbookEntry[]>(() => {
    const saved = localStorage.getItem("agvaan_guests");
    return saved ? JSON.parse(saved) : DEFAULT_GUESTBOOK;
  });
  const [newName, setNewName] = useState<string>("");
  const [newMessage, setNewMessage] = useState<string>("");
  const [selectedAvatar, setSelectedAvatar] = useState<string>("🎮");

  const activeTheme = THEMES[theme];

  // Speech bubbler text changer helper
  const triggerSpeech = (index: number) => {
    const bubblesMn = [
      "Сайн уу! Төхөөрөмжөө тааруулаад миний сансарын хувийн порталаар аялаарай!",
      "Сагсан бөмбөгт чи хэд авах вэ? Бөмбөг шидээд үзье!",
      "BTS-ийн дуунууд үнэхээр эрч хүч агуулдаг шүү. Өнгө өөрчилж гэрэлтүүлээрэй!",
      "Грэмиксийн шинэ бичлэгийг алгасахгүй үзсэн. Линк дээр лайк дараарай!",
      "Ирээдүй-86 сургуулийн 5-р ангийн сансарын багш нар маш мундаг!",
      "CS2 тоглоомд миний АРТИФАКТУУДЫГ харахыг хүсвэл Тоглоомын цонхоор орно уу!"
    ];
    const bubblesEn = [
      "Hello adventurer! Sync your device with my portal to begin!",
      "How many points can you score? Try shooting some basketball!",
      "BTS music is pure intergalactic energy. Alter the lightstick glow!",
      "Never skip a Gremix stream. Subscribe to unlock funny quotes!",
      "Ireedui-86 academy houses the finest space commanders and teachers!",
      "Check out my tactical loadouts inside the core Gaming Rig panel."
    ];
    setAgvaanSpeech(lang === "mn" ? bubblesMn[index] : bubblesEn[index]);
  };

  // Clock dynamic ticker effect
  useEffect(() => {
    const timer = setInterval(() => {
      const now = new Date();
      setTimeStr(now.toLocaleTimeString());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // Sync speeches first launch
  useEffect(() => {
    triggerSpeech(0);
  }, [lang]);

  // Basketball simulator
  const shootBall = () => {
    if (bballAnim) return;
    setBballAnim(true);
    setIsSwish(null);

    if (soundEnabled) sound.playJump();

    setTimeout(() => {
      const isHit = Math.random() > 0.4; // 60% chance to score
      if (isHit) {
        setIsSwish(true);
        setBballHoops((prev) => prev + 1);
        if (soundEnabled) sound.playLevelUp();
      } else {
        setIsSwish(false);
        if (soundEnabled) sound.playFail();
      }
      setBballAnim(false);
    }, 850);
  };

  // Subscribe dynamic trigger
  const handleSubscribe = () => {
    if (subscribing) return;
    setSubscribing(true);
    if (soundEnabled) sound.playLevelUp();
    setSubscriberCount((prev) => prev + 1);
    
    // Gremix funny lines popup
    const gremixQuotesMn = [
      "Хөөе хөөе хөөе! Намайг дагасанд баярлалаа, найз минь!",
      "Энэ тоглоом уу? Үгүй ээ, энэ бол жинхэнэ гал халуун адал явдал!",
      "ROBLOX дээр шинэ рекордыг хамтдаа эвдлээ!",
      "CS2 дээр хэн нэг нь намайг устгаад байна уу даа?"
    ];
    const gremixQuotesEn = [
      "Hey hey hey! Thank you for the epic subscription!",
      "This isn't just a game... it's a stellar cosmic journey!",
      "Together we just broke our highest ROBLOX high score!",
      "Who is trying to snipe me in CS2? Get ready for battle!"
    ];

    const randomQuote = Math.floor(Math.random() * gremixQuotesMn.length);
    setAgvaanSpeech(lang === "mn" ? gremixQuotesMn[randomQuote] : gremixQuotesEn[randomQuote]);

    setTimeout(() => setSubscribing(false), 2000);
  };

  // Guestbook poster
  const handleSendEntry = (e: FormEvent) => {
    e.preventDefault();
    if (!newName.trim() || !newMessage.trim()) {
      if (soundEnabled) sound.playFail();
      return;
    }

    const newComment: GuestbookEntry = {
      id: "guest_" + Date.now(),
      name: newName,
      message: newMessage,
      avatar: selectedAvatar,
      timestamp: new Date().toISOString().slice(0, 16).replace("T", " "),
      likes: 0
    };

    const nextLog = [newComment, ...guestbook];
    setGuestbook(nextLog);
    localStorage.setItem("agvaan_guests", JSON.stringify(nextLog));

    if (soundEnabled) sound.playLaser();

    // Auto friendly robot answer generator after 1.5 seconds
    setTimeout(() => {
      const agvaanRepliesMn = [
        "Маш их баярлалаа! Сэтгэгдлийг чинь миний сансарын дүн шинжилгээний компьютер бүртгэлээ. 🚀",
        "Сайн уу найз аа! Чамтай хамтран ажиллахдаа бэлэн байна. 👍",
        "Гайхалтай сэтгэгдэл шүү! Манай сургууль Ирээдүй-86-д зочлоорой.",
        "Чи надтай CS2 эсвэл ROBLOX тоглодог уу? Хамт тоглохдоо уриалгатай байна шүү!"
      ];
      const agvaanRepliesEn = [
        "Incredible connection! My mainframe computer successfully saved your space logs. 🚀",
        "Hello cadet! Ready to align tactical coordinates for MLBB or Roblox. 👍",
        "Awesome comment! Stop by my academy sector Ireedui-86 sometime.",
        "Do you duel in CS2 or build in Roblox? Let me know to join you!"
      ];

      const rIndex = Math.floor(Math.random() * agvaanRepliesMn.length);
      const replyObj: GuestbookEntry = {
        id: "agvaan_reply_" + Date.now(),
        name: "Agvaan (Captain)",
        message: lang === "mn" ? agvaanRepliesMn[rIndex] : agvaanRepliesEn[rIndex],
        avatar: "👨‍🚀",
        timestamp: new Date().toISOString().slice(0, 16).replace("T", " "),
        likes: 1,
        isAgvaanReply: true
      };

      setGuestbook((prev) => {
        const nextWithReply = [replyObj, ...prev];
        localStorage.setItem("agvaan_guests", JSON.stringify(nextWithReply));
        return nextWithReply;
      });

      if (soundEnabled) sound.playLevelUp();
    }, 2000);

    setNewName("");
    setNewMessage("");
  };

  const handleLikeMessage = (id: string) => {
    if (soundEnabled) sound.playBeep();
    setGuestbook((prev) => {
      const updated = prev.map((item) => 
        item.id === id ? { ...item, likes: item.likes + 1 } : item
      );
      localStorage.setItem("agvaan_guests", JSON.stringify(updated));
      return updated;
    });
  };

  const handleSoundToggle = () => {
    setSoundEnabled(!soundEnabled);
    if (!soundEnabled) {
      setTimeout(() => sound.playBeep(), 100);
    }
  };

  return (
    <div className={`relative min-h-screen bg-gradient-to-b ${activeTheme.bgGrad} text-[#EFF4FF] font-mono selection:bg-[#6FFF00] selection:text-[#010828] pb-16 transition-all duration-700`}>
      {/* Decorative High-End Cyber Space grid line overlays (CSS Grid) */}
      <div className="absolute inset-0 bg-grid-line opacity-[0.03] pointer-events-none z-0" />

      {/* HEADER SECTION */}
      <header className="relative z-30 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-5 border-b border-white/5 flex flex-col gap-4 sm:flex-row items-center justify-between">
        {/* LOGO */}
        <div className="flex items-center gap-2 cursor-pointer group" onClick={() => { if (soundEnabled) sound.playBeep(); }}>
          <div className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center border border-white/10 group-hover:border-[#6FFF00]/50 transition-all">
            <Sparkles className="w-5 h-5 text-[#6FFF00] group-hover:rotate-45 transition-transform" />
          </div>
          <div>
            <span className="font-grotesk text-xl uppercase tracking-wider block">AGVAAN.STATION</span>
            <span className="text-[9px] text-[#6FFF00] block tracking-[0.25em] font-bold">PORT_CADET // 10_Y_O</span>
          </div>
        </div>

        {/* CONTROLS (Sound, Theme, Language) */}
        <div className="flex flex-wrap items-center justify-center gap-3">
          
          {/* Sounds synthesis trigger */}
          <button
            onClick={handleSoundToggle}
            className={`p-2.5 rounded-xl border transition-all duration-300 flex items-center justify-center gap-1.5 cursor-pointer text-xs ${
              soundEnabled
                ? "bg-white/5 border-white/10 text-[#6FFF00] hover:bg-white/10"
                : "bg-red-500/10 border-red-500/30 text-red-400"
            }`}
            title="Toggle Web Audio SFX"
          >
            {soundEnabled ? (
              <>
                <Volume2 className="w-4 h-4" />
                <span className="text-[10px] font-bold uppercase hidden sm:inline">SFX: ON</span>
              </>
            ) : (
              <>
                <VolumeX className="w-4 h-4" />
                <span className="text-[10px] font-bold uppercase hidden sm:inline">SFX: MUTED</span>
              </>
            )}
          </button>

          {/* Theme custom toggler */}
          <div className="flex items-center gap-1.5 bg-white/5 p-1 rounded-xl border border-white/10">
            {(Object.keys(THEMES) as ThemeName[]).map((tKey) => {
              const isActive = theme === tKey;
              return (
                <button
                  key={tKey}
                  onClick={() => {
                    setTheme(tKey);
                    if (soundEnabled) sound.playBeep();
                  }}
                  className={`px-2.5 py-1.5 rounded-lg text-[9px] font-bold uppercase transition-all cursor-pointer ${
                    isActive
                      ? "bg-white/15 text-white shadow-sm"
                      : "text-white/40 hover:text-white/80"
                  }`}
                  title={`Switch to ${THEMES[tKey].name}`}
                >
                  {tKey}
                </button>
              );
            })}
          </div>

          {/* Language Switcher */}
          <button
            onClick={() => {
              setLang((prev) => (prev === "mn" ? "en" : "mn"));
              if (soundEnabled) sound.playBeep();
            }}
            className="px-3.5 py-2 rounded-xl bg-white/5 hover:bg-white/10 border border-white/15 text-xs font-bold font-mono text-cream flex items-center gap-2 cursor-pointer transition-all uppercase"
          >
            <Globe className="w-4 h-4 text-[#6FFF00]" />
            <span>{lang === "mn" ? "ENGLISH 🇬🇧" : "МОНГОЛ 🇲🇳"}</span>
          </button>
        </div>
      </header>

      {/* CORE PORTAL LAYOUT CONTAINER */}
      <main className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-8 grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* LEFT COLUMN: CHARACTER PORTRAIT PROFILE WINDOW (4 Cols) */}
        <section className="lg:col-span-4 flex flex-col gap-6">
          
          {/* Avatar Portrait Core Box */}
          <div className="liquid-glass rounded-[32px] p-6 border border-white/10 overflow-hidden flex flex-col items-center justify-between text-center relative group">
            {/* Ambient inner glow */}
            <div className={`absolute top-0 inset-x-0 h-40 bg-gradient-to-b from-[#6FFF00]/5 to-transparent pointer-events-none transition-all duration-500`} />
            
            {/* Space themed holographic photo frame */}
            <div className="relative w-44 h-44 rounded-full p-2 border border-white/15 mb-4 group-hover:border-[#6FFF00]/30 transition-all duration-500">
              <div className="absolute inset-0 rounded-full border border-[#6FFF00]/20 animate-spin" style={{ animationDuration: "25s" }} />
              <img
                src={IMAGES.avatar}
                alt="Agvaan Astronaut Portrait"
                className="w-full h-full rounded-full object-cover select-none pointer-events-none relative z-10"
                referrerPolicy="no-referrer"
              />
              {/* Online pulse bubble logo */}
              <span className="absolute bottom-2 right-2 w-4 h-4 bg-[#6FFF00] rounded-full border-2 border-[#010828] z-20 flex items-center justify-center">
                <span className="w-full h-full rounded-full bg-[#6FFF00] animate-ping" />
              </span>
            </div>

            {/* Speeches bubbles with dynamic messages */}
            <div className="w-full p-4 rounded-2xl bg-white/[0.02] border border-white/5 relative mb-4">
              {/* Little speech pointer icon */}
              <div className="absolute top-[-6px] left-1/2 -translate-x-1/2 w-3 h-3 bg-white/[0.02] border-t border-l border-white/5 rotate-45" />
              <p className="text-xs sm:text-[13px] text-cream/90 uppercase font-mono tracking-wide leading-relaxed">
                {agvaanSpeech || (
                  lang === "mn" 
                    ? "Сайн уу! Намайг Агваан гэдэг. Миний тохируулж болох өвөрмөц сансарын дүн шинжилгээний портфолио вэб хуудсанд тавтай морил!"
                    : "Hello explorers! Welcome to my dynamic space flight portfolio. Adjust themes and try mini missions!"
                )}
              </p>
            </div>

            {/* Name and main label */}
            <div className="w-full">
              <span className="text-[10px] font-bold text-[#6FFF00] uppercase tracking-[0.25em] block mb-1">CAPTAIN COMMANDER</span>
              <h2 className="font-grotesk text-3xl sm:text-4xl text-cream uppercase tracking-wider mb-2 leading-none">
                AGVAAN
              </h2>
              
              <div className="flex items-center justify-center gap-4 text-xs font-mono text-cream/60 uppercase border-y border-white/5 py-3 my-3">
                <div>{lang === "mn" ? "ОН: 10 НАСТАЙ" : "AGE: 10 Y.O"}</div>
                <div className="text-white/20">•</div>
                <div className="flex items-center gap-1.5">
                  <Flame className="w-3.5 h-3.5 text-orange-500 animate-pulse" />
                  <span>5TH GRADE</span>
                </div>
              </div>
            </div>

            {/* Quick interactive trigger controls for speech */}
            <div className="w-full grid grid-cols-3 gap-2 text-[9px] font-bold uppercase tracking-widest text-[#EFF4FF] font-mono mt-2">
              <button
                onClick={() => { triggerSpeech(1); if (soundEnabled) sound.playBeep(); }}
                className="py-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-center border border-white/5 cursor-pointer"
              >
                {lang === "mn" ? "САГС" : "BBALL"}
              </button>
              <button
                onClick={() => { triggerSpeech(2); if (soundEnabled) sound.playBeep(); }}
                className="py-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-center border border-white/5 cursor-pointer"
              >
                {lang === "mn" ? "ДУУ" : "MUSIC"}
              </button>
              <button
                onClick={() => { triggerSpeech(4); if (soundEnabled) sound.playBeep(); }}
                className="py-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-center border border-white/5 cursor-pointer"
              >
                {lang === "mn" ? "ХИЧЭЭЛ" : "SCHOOL"}
              </button>
            </div>
          </div>

          {/* Quick Sound synthesizer manual board - super futuristic & interesting */}
          <div className="liquid-glass rounded-3xl p-5 border border-white/10 font-mono">
            <span className="text-[9px] text-[#6FFF00] font-bold tracking-widest block mb-1 uppercase">SYNTH BOARD CODES</span>
            <span className="text-xs text-cream/70 block uppercase mb-4">
              {lang === "mn" ? "Сансарын дуут дохионууд илгээх:" : "Trigger real analog synth frequencies:"}
            </span>

            <div className="grid grid-cols-2 gap-2 text-[10px] font-bold text-[#EFF4FF] uppercase">
              <button
                onClick={() => { if (soundEnabled) sound.playLaser(); }}
                className="p-3 bg-white/[0.02] hover:bg-[#6FFF00]/10 border border-white/5 hover:border-[#6FFF00]/30 rounded-xl cursor-copy text-left transition-all"
              >
                💥 {lang === "mn" ? "ЛАЗЕР" : "LASER FX"}
              </button>
              <button
                onClick={() => { if (soundEnabled) sound.playBeep(); }}
                className="p-3 bg-white/[0.02] hover:bg-[#6FFF00]/10 border border-white/5 hover:border-[#6FFF00]/30 rounded-xl cursor-copy text-left transition-all"
              >
                📡 {lang === "mn" ? "МЕДИА ДОХИО" : "BEER CHIP"}
              </button>
              <button
                onClick={() => { if (soundEnabled) sound.playLevelUp(); }}
                className="p-3 bg-white/[0.02] hover:bg-[#6FFF00]/10 border border-white/5 hover:border-[#6FFF00]/30 rounded-xl cursor-copy text-left transition-all"
              >
                ⭐ {lang === "mn" ? "ЦЭГЭЛХҮҮ" : "LEVEL UP"}
              </button>
              <button
                onClick={() => { if (soundEnabled) sound.playCosmicTune(); }}
                className="p-3 bg-white/[0.02] hover:bg-[#6FFF00]/10 border border-white/5 hover:border-[#6FFF00]/30 rounded-xl cursor-copy text-left transition-all"
              >
                🎵 {lang === "mn" ? "МЕЛОДИ" : "COSMIC ARMY"}
              </button>
            </div>
          </div>
        </section>

        {/* CENTER COLUMN: DYNAMIC PORTAL MATRIX BOARD (8 Cols) */}
        <section className="lg:col-span-8 flex flex-col gap-8">
          
          {/* TABS CONTROLLER BAR */}
          <div className="flex flex-wrap items-center bg-white/[0.02] p-1.5 rounded-[22px] border border-white/10 gap-1 sm:gap-2">
            {[
              { id: "games", label: lang === "mn" ? "ТОГЛООМУУД" : "CORE GAMES", icon: Gamepad },
              { id: "hobbies", label: lang === "mn" ? "ГРҮҮВ & ХОББИ" : "BBALL COURT", icon: Dribbble },
              { id: "creators", label: lang === "mn" ? "ДУРТАЙ ЗҮЙЛС" : "BTS & GREMIX", icon: Music },
              { id: "media", label: lang === "mn" ? "МУЗЫК & КИНО" : "SPACE CINEMA", icon: Tv },
              { id: "idol", label: lang === "mn" ? "🤖 ШҮТЭЭН" : "🤖 MY IDOL", icon: Award },
              { id: "school", label: lang === "mn" ? "ИРЭЭДҮЙ-86" : "STATION I-86", icon: BookOpen },
              { id: "typeracer", label: "⌨️ Typeracer", icon: Keyboard, isExternal: true, url: "https://fast-type-khaki.vercel.app/" },
            ].map((tab) => {
              const isActive = activeTab === tab.id;
              const TabIcon = tab.icon;
              if (tab.isExternal) {
                return (
                  <a
                    key={tab.id}
                    href={tab.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={() => {
                      if (soundEnabled) sound.playBeep();
                    }}
                    className="flex-1 min-w-[120px] py-3 px-3 rounded-xl font-mono text-xs font-bold uppercase transition-all duration-300 flex items-center justify-center gap-2 cursor-pointer text-white/55 hover:text-white/90 hover:bg-white/[0.03] border border-transparent hover:border-white/5"
                  >
                    <TabIcon className="w-3.5 h-3.5 text-[#6FFF00]" />
                    <span>{tab.label}</span>
                  </a>
                );
              }
              return (
                <button
                  key={tab.id}
                  onClick={() => {
                    setActiveTab(tab.id as "games" | "hobbies" | "creators" | "school" | "media" | "idol");
                    if (soundEnabled) sound.playBeep();
                  }}
                  className={`flex-1 min-w-[120px] py-3 px-3 rounded-xl font-mono text-xs font-bold uppercase transition-all duration-300 flex items-center justify-center gap-2 cursor-pointer ${
                    isActive
                      ? "bg-white/10 text-white shadow-md border border-white/10"
                      : "text-white/55 hover:text-white/90 hover:bg-white/[0.03]"
                  }`}
                >
                  <TabIcon className={`w-3.5 h-3.5 ${isActive ? "text-[#6FFF00]" : ""}`} />
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </div>

          {/* ACTIVE TAB VIEWS DISPLAY */}
          <div className="relative w-full">
            <AnimatePresence mode="wait">
              
              {/* TAB 1: GAMES DISPLAY RIG */}
              {activeTab === "games" && (
                <motion.div
                  key="games-panel"
                  initial={{ opacity: 0, y: 15 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -15 }}
                  className="w-full"
                >
                  <GamerConsole lang={lang} />
                </motion.div>
              )}

              {/* TAB 2: HOBBY: BASKETBALL COURT */}
              {activeTab === "hobbies" && (
                <motion.div
                  key="hobbies-panel"
                  initial={{ opacity: 0, y: 15 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -15 }}
                  className="w-full flex flex-col gap-6"
                >
                  <div className="liquid-glass rounded-[32px] p-6 border border-white/10 grid grid-cols-1 md:grid-cols-12 gap-8 items-center">
                    
                    {/* Visual and ball throw section */}
                    <div className="md:col-span-7 flex flex-col gap-4">
                      <div className="relative aspect-video w-full rounded-2xl overflow-hidden bg-black/40 border border-white/10">
                        <img
                          src={IMAGES.basketball}
                          alt="Space Basketball Court"
                          className="w-full h-full object-cover"
                          referrerPolicy="no-referrer"
                        />
                        
                        {/* Ball bounce animation projection */}
                        {bballAnim && (
                          <motion.div
                            initial={{ y: 220, x: 50, scale: 1.5 }}
                            animate={{ y: [220, 80, 110], x: [50, 150, 180], scale: [1.5, 0.5, 0.4] }}
                            transition={{ duration: 0.85, ease: "easeOut" }}
                            className="absolute bottom-4 left-4 w-12 h-12 bg-orange-500 rounded-full border-2 border-orange-850 flex items-center justify-center font-bold text-[9px] shadow-lg shadow-orange-500/50 text-[#010828]"
                          >
                            🏀
                          </motion.div>
                        )}

                        {/* Static goal marker */}
                        <div className="absolute top-[80px] right-[40px] w-14 h-14 border-4 border-dashed border-[#6FFF00]/50 rounded-full flex items-center justify-center">
                          <span className="text-[10px] text-white/50 font-bold uppercase">RIM</span>
                        </div>
                      </div>
                    </div>

                    {/* Metadata Card information */}
                    <div className="md:col-span-5 flex flex-col gap-4">
                      <span className="text-neon text-[10px] font-bold tracking-widest uppercase block">[ FIELD ACCESS PROTOCOL ]</span>
                      <h3 className="font-grotesk text-2xl text-cream uppercase leading-none">
                        {lang === "mn" ? "САГСАН БӨМБӨГ" : "COSMIC COURT DRILLS"}
                      </h3>
                      
                      <p className="text-xs sm:text-[13px] text-cream/75 leading-relaxed uppercase">
                        {lang === "mn"
                          ? "Би багаасаа л спортод маш сонирхолтой байсан бөгөөд сагсан бөмбөг тоглох дуртай. Энэ нь намайг эрч хүчтэй, хурдан шаламгай байхад тусалдаг."
                          : "Basketball is a core pillar of my layout. Throwing high arcs, studying space positioning, and engineering court coordination with friends."}
                      </p>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 w-full items-stretch">
                    
                    {/* Emoji Guessing Game - Left Column (50% Width on Large Screens) */}
                    <div className="lg:col-span-6 flex flex-col h-full">
                      <EmojiAnimeGuesser lang={lang} soundEnabled={soundEnabled} />
                    </div>

                    {/* Stacked Cards - Right Column (50% Width on Large Screens) */}
                    <div className="lg:col-span-6 flex flex-col gap-6 justify-between">
{/* One Piece Pirate Ship Segment */}
                      <div className="liquid-glass rounded-[28px] p-6 border border-white/10 flex flex-col justify-between flex-1">
                        <div>
                          <div className="flex justify-between items-start mb-3">
                            <span className="px-2 py-0.5 rounded text-[9px] font-bold bg-[#b724ff]/10 text-[#b724ff] border border-[#b724ff]/20 uppercase">
                              ONE PIECE ANIME
                            </span>
                            <span className="text-[10px] text-cream/40 uppercase font-mono">SECTOR STRAW HAT</span>
                          </div>
                          
                          <div className="relative aspect-video w-full rounded-xl overflow-hidden bg-black/40 border border-white/5 mb-4">
                            <img
                              src={IMAGES.onePiece}
                              alt="Straw Hat Ship"
                              className="w-full h-full object-cover"
                              referrerPolicy="no-referrer"
                            />
                          </div>

                          <h4 className="font-grotesk text-xl text-cream uppercase tracking-wide leading-none mb-2">
                            {lang === "mn" ? "МИНИЙ ДУРТАЙ АНИМЭ" : "MY FAVOURITE ANIME"}
                          </h4>
                          <p className="text-xs text-cream/70 leading-relaxed uppercase mb-4">
                            {lang === "mn" 
                              ? "Ван пис бол адал явдалт, хязгааргүй мөрөөдөх сэтгэлгээг надад заасан шилдэг бүтээл юм. Би Луффи болон түүний багийнхны уян хатан занд маш их дуртай."
                              : "Following Monkey D. Luffy across mystical tides. A legendary tale of friendship, resilience, and finding true freedom on the sea."}
                          </p>
                        </div>

                        {/* Interactive Selection box */}
                        <div className="border-t border-white/5 pt-3.5 flex items-center justify-between text-[11px] font-mono">
                          <span className="text-cream/50 uppercase">FAV CHARACTER:</span>
                          <div className="flex gap-1.5">
                            {["Luffy", "Zoro", "Sanji"].map((crew) => (
                              <button
                                key={crew}
                                onClick={() => {
                                  setSelectedCrew(crew);
                                  if (soundEnabled) sound.playBeep();
                                }}
                                className={`px-2 py-1 rounded text-[10px] font-bold uppercase cursor-pointer ${
                                  selectedCrew === crew 
                                    ? "bg-purple-500 text-white" 
                                    : "bg-white/5 text-white/50 hover:bg-white/10"
                                }`}
                              >
                                {crew}
                              </button>
                            ))}
                          </div>
                        </div>
                      </div>

                      {/* BTS Electronic Concert Player */}
                      <div className="liquid-glass rounded-[28px] p-6 border border-white/10 flex flex-col justify-between flex-1">
                        <div>
                          <div className="flex justify-between items-start mb-3">
                            <span className="px-2 py-0.5 rounded text-[9px] font-bold bg-[#6FFF00]/10 text-[#6FFF00] border border-[#6FFF00]/20 uppercase">
                              BTS ARMY CORE
                            </span>
                            <span className="text-[10px] text-cream/40 uppercase font-mono animate-pulse">LIGHTSTICK ONLINE</span>
                          </div>

                          <div className="relative aspect-video w-full rounded-xl overflow-hidden bg-black/40 border border-white/5 mb-4">
                            <img
                              src={IMAGES.btsConcert}
                              alt="BTS Stage"
                              className="w-full h-full object-cover transition-opacity duration-300"
                              style={{ filter: `drop-shadow(0 0 10px ${armyBombColor}30)` }}
                              referrerPolicy="no-referrer"
                            />
                            
                            {/* Simulated Lightstick dynamic glow overlay */}
                            <div 
                              className="absolute inset-0 transition-all duration-700 mix-blend-color opacity-35"
                              style={{ backgroundColor: armyBombColor }}
                            />

                            {/* Music equalizer bars */}
                            <div className="absolute bottom-3 right-3 flex items-end gap-1.5 p-2 rounded-lg bg-black/70 backdrop-blur-md">
                              {[1.5, 2.3, 1.1, 2.7, 0.8, 1.9].map((dur, i) => (
                                <div
                                  key={i}
                                  className="w-1.5 rounded-full"
                                  style={{
                                    backgroundColor: armyBombColor,
                                    height: concertMode ? "24px" : "8px",
                                    animation: concertMode ? `eq-anim ${dur}s infinite alternate ease-in-out` : "none"
                                  }}
                                />
                              ))}
                            </div>
                          </div>

                          <h4 className="font-grotesk text-xl text-cream uppercase tracking-wide leading-none mb-2">
                            {lang === "mn" ? "МИНИЙ ДУРТАЙ ХАМТЛАГ" : "MY FAVOURITE BAND"}
                          </h4>
                          <p className="text-xs text-cream/70 leading-relaxed uppercase mb-4">
                            {lang === "mn" 
                              ? "БТС хамтлаг бол К-Попын хаад юм! Тэдний Dynamite болон Butter дуунууд ямар ч үед миний энергийг дээд цэгт хүргэж чаддаг."
                              : "Dynamite, Permission to Dance, Butter... Energetic songs that fuel my gaming setups and homework focus. Light up the ARMY bomb!"}
                          </p>
                        </div>

                        {/* Army Bomb controller board */}
                        <div className="border-t border-white/5 pt-3 flex flex-col gap-2">
                          <div className="flex justify-between items-center text-[10px] font-mono text-cream/50 uppercase">
                            <span>ARMY BOMB COLOR:</span>
                            <span>{concertMode ? "PLAYING AUDIO..." : "IDLE"}</span>
                          </div>
                          
                          <div className="flex justify-between items-center">
                            <div className="flex gap-2">
                              {["#a855f7", "#ff007f", "#6FFF00", "#00ffff"].map((col) => (
                                <button
                                  key={col}
                                  onClick={() => {
                                    setArmyBombColor(col);
                                    if (soundEnabled) sound.playBeep();
                                  }}
                                  className="w-6 h-6 rounded-full border border-white/10 relative transition-transform hover:scale-110 cursor-pointer"
                                  style={{ backgroundColor: col }}
                                >
                                  {armyBombColor === col && (
                                    <span className="absolute inset-1.5 rounded-full bg-white ring-1 ring-black" />
                                  )}
                                </button>
                              ))}
                            </div>

                            <button
                              onClick={() => {
                                setConcertMode(!concertMode);
                                if (soundEnabled) {
                                  if (!concertMode) {
                                    sound.playCosmicTune();
                                  } else {
                                    sound.playBeep();
                                  }
                                }
                              }}
                              className={`px-3 py-1.5 rounded text-[10px] font-bold uppercase transition-all cursor-pointer ${
                                concertMode 
                                  ? "bg-neon text-space-bg animate-pulse" 
                                  : "bg-white/5 text-white/70 hover:bg-white/10"
                              }`}
                            >
                              🎵 {concertMode ? (lang === "mn" ? "ЗОГСООХ" : "MUT_AUDIO") : (lang === "mn" ? "ДУУ СОНСОХ" : "SYNTH_TUNE")}
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>

                  </div>

                  {/* Gamer Setup YouTuber Highlight (Full-width custom console card) */}
                  <div className="liquid-glass rounded-[32px] p-6 border border-white/10 grid grid-cols-1 md:grid-cols-12 gap-8 items-center">
                    
                    {/* Gremix Mock YouTube Stream Frame */}
                    <div className="md:col-span-6 relative aspect-video w-full rounded-2xl overflow-hidden bg-black/40 border border-white/10">
                      <img
                        src={IMAGES.gamerCockpit}
                        alt="Gremix Gaming Screen"
                        className="w-full h-full object-cover"
                        referrerPolicy="no-referrer"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent pointer-events-none" />

                      {/* Mock YouTube indicators */}
                      <div className="absolute top-4 left-4 bg-red-600 px-2.5 py-1 rounded text-[9px] font-extrabold uppercase tracking-widest flex items-center gap-1">
                        <span className="w-1.5 h-1.5 rounded-full bg-white animate-ping" />
                        <span>LIVE STREAM</span>
                      </div>

                      <div className="absolute bottom-4 left-4 right-4 flex items-center justify-between text-[11px] font-mono text-white">
                        <span>CHANNEL: <span className="text-[#6FFF00] font-bold">GREMIX STATIONS</span></span>
                        <span>SUBSCRIBERS: <span className="font-bold">{(subscriberCount).toLocaleString()}</span></span>
                      </div>
                    </div>

                    {/* Left text with Click action buttons */}
                    <div className="md:col-span-6 flex flex-col gap-4">
                      <span className="text-red-500 text-[10px] font-bold tracking-[0.25em] uppercase block">[ ACTIVE YOUTUBE TRANSMISSION ]</span>
                      <h3 className="font-grotesk text-2xl text-cream uppercase leading-none">
                        {lang === "mn" ? "ЮҮТҮБЭР ГРЭМИКС" : "GREMIX CHANNEL INTERCEPT"}
                      </h3>

                      <p className="text-xs sm:text-[13px] text-cream/70 leading-relaxed uppercase">
                        {lang === "mn"
                          ? "Грэмикс ах бол Монголын хамгийн бүтээлч бөгөөд хөгжилтэй Юүтүб контент бүтээгчдийн нэг юм. Түүний тоглоомын арга барил, инээдтэй ярианууд надад урам хайрладаг."
                          : "Mongolia's premium king of creative streams. Hilarious commentary matching expert Roblox strategies! Click below to send a sub signal and unlock his secret words."}
                      </p>

                      <div className="flex flex-wrap items-center gap-3">
                        {/* Red Subscribe button simulated */}
                        <button
                          onClick={handleSubscribe}
                          disabled={subscribing}
                          className="px-5 py-2.5 rounded-xl bg-red-600 hover:bg-red-500 disabled:bg-white/10 text-white font-extrabold text-xs uppercase tracking-widest cursor-pointer transition-all flex items-center gap-2"
                        >
                          {subscribing ? (
                            <span>{lang === "mn" ? "ТАТАЖ БАЙНА..." : "SYNCING SUBSCRIBER..."}</span>
                          ) : (
                            <>
                              <Tv className="w-4 h-4 shrink-0" />
                              <span>{lang === "mn" ? "ДАГАХ" : "SUBSCRIBE"}</span>
                            </>
                          )}
                        </button>

                        {/* Stream Like Button */}
                        <button
                          onClick={() => {
                            setStreamLikes((prev) => prev + 1);
                            if (soundEnabled) sound.playLaser();
                          }}
                          className="px-4 py-2.5 rounded-xl bg-white/5 hover:bg-white/10 text-cream border border-white/10 text-xs font-mono uppercase tracking-widest cursor-pointer transition-all flex items-center gap-1.5"
                        >
                          <Heart className="w-4 h-4 text-red-500 fill-red-500" />
                          <span>LIKE: {streamLikes}</span>
                        </button>
                      </div>
                    </div>

                  </div>
                </motion.div>
              )}

              {/* TAB 4: SCHOOL: IREEDUI-86 & AGENDA */}
              {activeTab === "school" && (
                <motion.div
                  key="school-panel"
                  initial={{ opacity: 0, y: 15 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -15 }}
                  className="w-full flex flex-col gap-6"
                >
                  <div className="liquid-glass rounded-[32px] p-6 border border-white/10 flex flex-col gap-6">
                    
                    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-white/15 pb-4">
                      <div>
                        <span className="text-neon text-[10px] font-bold tracking-widest uppercase block">[ INTERGALACTIC ACADEMY LOGS ]</span>
                        <h3 className="font-grotesk text-2xl sm:text-3xl text-cream uppercase leading-none">
                          {lang === "mn" ? "ИРЭЭДҮЙ-86 СУРГУУЛЬ" : "IREEDUI-86 SCHOOL MISSION"}
                        </h3>
                      </div>
                      <span className="px-3 py-1 bg-neon/15 border border-neon/30 text-neon rounded-full font-bold text-[10px] uppercase">
                        STATION: ULAANBAATAR ST.
                      </span>
                    </div>

                    <p className="text-xs sm:text-sm text-cream/80 uppercase font-mono leading-relaxed mb-2">
                      {lang === "mn"
                        ? "Миний суралцдаг Ирээдүй-86 сургууль бол маш олон шилдэг залуусыг бэлддэг гайхалтай газар билээ. Би энд 10 настай бөгөөд ирээдүйд илүү мундаг инженер эсвэл бүтээн байгуулагч болохыг мөрөөддөг."
                        : "Our academy platform fosters digital minds located high above Mongolia's capital. As a 5th grade astronaut, my daily schedule mixes core mathematics with tactical computational computer labs."}
                    </p>

                    {/* Class timeline / agenda tracker */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 mt-2">
                      {[
                        { time: "08:30 - 10:00", nameMn: "Тооны хичээл", nameEn: "Mathematics Core", room: "LAB I" },
                        { time: "10:15 - 11:45", nameMn: "Мэдээлэл Зүй", nameEn: "Computer Science", room: "GRID V" },
                        { time: "12:30 - 14:00", nameMn: "Биеийн тамир", nameEn: "PE & Basketball", room: "COURT VII" },
                        { time: "14:15 - 15:30", nameMn: "Англи Хэл", nameEn: "English Academy", room: "SECTOR IV" }
                      ].map((item, idx) => (
                        <div key={idx} className="p-4 rounded-xl bg-white/[0.01] border border-white/5 hover:border-neon/20 transition-all flex flex-col justify-between min-h-[110px]">
                          <span className="font-mono text-[9px] text-[#6FFF00] tracking-widest">{item.time}</span>
                          <span className="font-grotesk text-base text-cream uppercase tracking-wide leading-tight mt-2">
                            {lang === "mn" ? item.nameMn : item.nameEn}
                          </span>
                          <span className="font-mono text-[9px] text-cream/40 uppercase mt-1">LOCATION: {item.room}</span>
                        </div>
                      ))}
                    </div>

                  </div>
                </motion.div>
              )}

              {/* TAB 5: SPACE CINEMA PLAYER */}
              {activeTab === "media" && (
                <motion.div
                  key="media-panel"
                  initial={{ opacity: 0, y: 15 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -15 }}
                  className="w-full"
                >
                  <SpaceCinema lang={lang} soundEnabled={soundEnabled} />
                </motion.div>
              )}

              {/* TAB 6: IDOL COACH CHAT */}
              {activeTab === "idol" && (
                <motion.div
                  key="idol-panel"
                  initial={{ opacity: 0, y: 15 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -15 }}
                  className="w-full"
                >
                  <IdolCoach lang={lang} soundEnabled={soundEnabled} />
                </motion.div>
              )}

            </AnimatePresence>
          </div>

          {/* SECTION: INTELLIGENT QUIZ MODULE */}
          <section className="w-full">
            <div className="mb-4">
              <span className="text-[#a855f7] text-[10px] font-bold tracking-[0.3em] uppercase block">TEST SYSTEM INTELLIGENCE</span>
              <h3 className="font-grotesk text-2xl text-cream uppercase leading-none">
                {lang === "mn" ? "ТА АГВААНЫГ ХЭР САЙН МЭДЭХ ВЭ?" : "HOW WELL DO YOU KNOW AGVAAN?"}
              </h3>
            </div>
            <AgvaanQuiz lang={lang} soundEnabled={soundEnabled} />
          </section>

          {/* GUESTBOOK / COMM CHANNEL PORT (Persistent memory and automatic responses) */}
          <section id="guestbook" className="w-full">
            <div className="mb-4">
              <span className="text-neon text-[10px] font-bold tracking-[0.25em] uppercase block">[ SUBSPACE MESSENGER ]</span>
              <h3 className="font-grotesk text-2xl text-cream uppercase leading-none">
                {lang === "mn" ? "СҮЛЖЭЭНИЙ СЭТГЭГДЛИЙН СУВАГ" : "GUESTBOOK SIGNAL CORNER"}
              </h3>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-start">
              
              {/* Message Poster Left - 5 cols */}
              <div className="md:col-span-5 bg-white/[0.01] border border-white/10 rounded-[28px] p-6 relative overflow-hidden">
                <form onSubmit={handleSendEntry} className="flex flex-col gap-4 relative z-10 font-mono text-xs uppercase">
                  
                  {/* Name field */}
                  <div className="flex flex-col gap-1.5">
                    <label className="text-cream/50 uppercase tracking-widest text-[9px]">NAME / SIGNATURE CODE:</label>
                    <input
                      type="text"
                      required
                      value={newName}
                      onChange={(e) => setNewName(e.target.value)}
                      placeholder={lang === "mn" ? "Жишээ: Тулга..." : "Example: Explorer Joe..."}
                      className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-2.5 text-cream focus:border-[#6FFF00] focus:outline-none placeholder-white/20 uppercase"
                    />
                  </div>

                  {/* Message Input */}
                  <div className="flex flex-col gap-1.5">
                    <label className="text-cream/50 uppercase tracking-widest text-[9px]">MESSAGE CONTENT:</label>
                    <textarea
                      required
                      rows={3}
                      value={newMessage}
                      onChange={(e) => setNewMessage(e.target.value)}
                      placeholder={lang === "mn" ? "Агваанд сэтгэгдэл бичих..." : "Write a galactic signal..."}
                      className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-2.5 text-cream focus:border-[#6FFF00] focus:outline-none placeholder-white/20 uppercase resize-none"
                    />
                  </div>

                  {/* Avatar Picker Icon */}
                  <div className="flex flex-col gap-1.5">
                    <label className="text-cream/50 uppercase tracking-widest text-[9px]">CHOOSE PILOT TOKEN:</label>
                    <div className="flex gap-2">
                      {["🎮", "🎤", "🏀", "🚀", "🔥"].map((item) => (
                        <button
                          key={item}
                          type="button"
                          onClick={() => {
                            setSelectedAvatar(item);
                            if (soundEnabled) sound.playBeep();
                          }}
                          className={`w-10 h-10 rounded-xl bg-black/40 border flex items-center justify-center text-sm cursor-pointer transition-transform ${
                            selectedAvatar === item 
                              ? "border-[#6FFF00] scale-105" 
                              : "border-white/10 hover:border-white/20"
                          }`}
                        >
                          {item}
                        </button>
                      ))}
                    </div>
                  </div>

                  <button
                    type="submit"
                    className="w-full py-3 mt-2 bg-neon text-space-bg hover:bg-[#6FFF00]/95 rounded-xl font-bold font-mono tracking-widest text-xs uppercase flex items-center justify-center gap-2 cursor-pointer transition-all shadow-md shadow-neon/10"
                  >
                    <Send className="w-3.5 h-3.5 shrink-0" />
                    <span>{lang === "mn" ? "ДОХИО ИЛГЭЭХ" : "BROADCAST TRANSMISSION"}</span>
                  </button>

                </form>
              </div>

              {/* Message Live List Right - 7 cols */}
              <div className="md:col-span-7 flex flex-col gap-3.5 max-h-[420px] overflow-y-auto pr-2 custom-scrollbar">
                <AnimatePresence initial={false}>
                  {guestbook.map((entry) => (
                    <motion.div
                      key={entry.id}
                      initial={{ opacity: 0, x: 20 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, scale: 0.95 }}
                      className={`p-4 rounded-2xl border ${
                        entry.isAgvaanReply 
                          ? "bg-slate-900/40 border-purple-500/30 pl-6 border-l-4 border-l-purple-500 ml-6" 
                          : "bg-white/[0.01] border-white/5"
                      }`}
                    >
                      <div className="flex justify-between items-start gap-4 mb-2">
                        <div className="flex items-center gap-2.5">
                          <span className="text-lg">{entry.avatar}</span>
                          <div>
                            <span className={`block font-bold text-xs uppercase ${entry.isAgvaanReply ? "text-purple-400" : "text-cream"}`}>
                              {entry.name}
                            </span>
                            <span className="block text-[9px] text-[#EFF4FF]/40 font-mono tracking-widest">{entry.timestamp}</span>
                          </div>
                        </div>

                        <button
                          onClick={() => handleLikeMessage(entry.id)}
                          className="px-2.5 py-1 rounded bg-white/5 hover:bg-white/10 border border-white/5 flex items-center gap-1 cursor-pointer transition-all"
                        >
                          <Heart className="w-3 h-3 text-red-500 fill-red-500" />
                          <span className="text-[10px] text-cream">{entry.likes}</span>
                        </button>
                      </div>

                      <p className="text-xs text-cream/80 uppercase font-mono leading-relaxed pl-1">
                        {entry.message}
                      </p>
                    </motion.div>
                  ))}
                </AnimatePresence>

                {guestbook.length === 0 && (
                  <div className="p-8 text-center border border-dashed border-white/10 rounded-2xl">
                    <span className="text-xs text-cream/40 uppercase">No active communication streams aligned. Be the first to post a note!</span>
                  </div>
                )}
              </div>

            </div>
          </section>

        </section>

      </main>

      {/* FOOTER METADATA */}
      <footer className="relative z-30 max-w-7xl mx-auto mt-20 pt-8 border-t border-white/5 px-4 sm:px-6 lg:px-8 flex flex-col md:flex-row items-center justify-between gap-4 text-[10px] text-cream/40 uppercase font-mono tracking-wider">
        <span>AGVAAN-STATION-I86 MASTER SECTOR REPORT © 2026. ALL METRICS ALIGNED.</span>
        <div className="flex gap-4">
          <a href="#homepage" className="hover:text-[#6FFF00] transition-colors">{lang === "mn" ? "НҮҮР" : "GATEWAY"}</a>
          <span>•</span>
          <a href="#guestbook" className="hover:text-[#6FFF00] transition-colors">{lang === "mn" ? "СЭТГЭГДЭЛ" : "SIGNAL_BOX"}</a>
        </div>
      </footer>

      {/* FLOATING MESSENGER HELP CHATBOT */}
      <MeAIChat lang={lang} soundEnabled={soundEnabled} />
    </div>
  );
}
