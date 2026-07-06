/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useRef, useEffect, FormEvent } from "react";
import { Send, Award, Sparkles, User, RefreshCw, MessageSquare, ShieldAlert } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { sound } from "../utils/audio";

interface Message {
  role: "user" | "model";
  text: string;
}

interface IdolCoachProps {
  lang: "mn" | "en";
  soundEnabled: boolean;
}

export function IdolCoach({ lang, soundEnabled }: IdolCoachProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState<string>("");
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string>("");
  
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Auto-scroll on new messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isLoading]);

  // Welcome message when chat starts
  useEffect(() => {
    if (messages.length === 0) {
      const welcomeText = lang === "mn"
        ? "Сайн уу! Би бол Лионель Месси байна. Миний хөлбөмбөг болон амьдралын туршлага чамд тууштай тэмцэх, хөдөлмөрлөх урам зориг өгнө гэдэгт итгэлтэй байна. Чамд ямар зөвлөгөө хэрэгтэй байна даа? ⚽️"
        : "Hello! I am Lionel Messi. I hope my football journey and experiences inspire you to work hard and never give up on your dreams. How can I help you today? ⚽️";
      
      setMessages([{ role: "model", text: welcomeText }]);
    }
  }, [lang]);

  const handleSend = async (textToSend: string) => {
    if (!textToSend.trim() || isLoading) return;

    if (soundEnabled) sound.playBeep();

    const userMessage: Message = { role: "user", text: textToSend };
    const updatedMessages = [...messages, userMessage];
    setMessages(updatedMessages);
    setInput("");
    setIsLoading(true);
    setErrorMsg("");

    try {
      // Map message history to Gemini API structure (role: "user" | "model")
      const historyPayload = updatedMessages.map((msg) => ({
        role: msg.role,
        parts: [{ text: msg.text }],
      }));

      const response = await fetch("/api/gemini/idol", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ history: historyPayload }),
      });

      let data;
      try {
        data = await response.json();
      } catch (e) {
        // Response was not JSON
      }

      if (!response.ok) {
        const fallbackMsg = lang === "mn" ? "Хост серверээс хариу авахад алдаа гарлаа." : "Failed to get a response from the host server.";
        throw new Error(data?.error || fallbackMsg);
      }

      if (data?.error) {
        throw new Error(data.error);
      }

      const replyText = data.text || (lang === "mn" ? "Уучлаарай, би таныг ойлгосонгүй." : "Sorry, I couldn't process that.");
      
      if (soundEnabled) sound.playLevelUp();
      setMessages((prev) => [...prev, { role: "model", text: replyText }]);
    } catch (err: any) {
      console.error(err);
      if (soundEnabled) sound.playFail();
      setErrorMsg(err.message || (lang === "mn" ? "Алдаа: Холболт тасарлаа. Дахин оролдоно уу." : "Error: Connection lost. Please try again."));
    } finally {
      setIsLoading(false);
    }
  };

  const clearChat = () => {
    if (soundEnabled) sound.playFail();
    setMessages([]);
  };

  // Sample questions to help the user start talking to Messi
  const starterPrompts = lang === "mn" ? [
    "Месси, чи хэрхэн ийм амжилтанд хүрсэн бэ? 🏆",
    "Надад хэцүү үед шантрахгүй байх зөвлөгөө өгөөч? 💪",
    "Амжилтанд хүрэхэд гэр бүл ба итгэл хэр чухал вэ? ❤️",
    "Сагсан бөмбөг ба хөлбөмбөгийн ялгаа юу вэ? 🏀⚽"
  ] : [
    "Messi, how did you achieve such great success? 🏆",
    "Give me advice on not giving up during hard times? 💪",
    "How important are family and belief in success? ❤️",
    "What is the key difference between talent and hard work? 🧠"
  ];

  return (
    <div className="liquid-glass rounded-[32px] p-6 border border-white/10 relative z-10 w-full overflow-hidden">
      
      {/* Dynamic Background Aura */}
      <div className="absolute -top-24 -left-24 w-48 h-48 rounded-full bg-[#6FFF00]/10 filter blur-3xl pointer-events-none" />
      <div className="absolute -bottom-24 -right-24 w-48 h-48 rounded-full bg-[#6FFF00]/5 filter blur-3xl pointer-events-none" />

      {/* Header Info */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-white/10 pb-4 mb-4 gap-3">
        <div className="flex items-center gap-3">
          <div className="relative">
            <div className="w-12 h-12 rounded-full bg-gradient-to-tr from-[#6FFF00] to-cyan-500 p-[2px]">
              <div className="w-full h-full rounded-full bg-[#010828] flex items-center justify-center font-bold font-mono text-xl text-[#6FFF00]">
                10
              </div>
            </div>
            <div className="absolute -bottom-1 -right-1 bg-[#6FFF00] w-4 h-4 rounded-full border border-[#010828] flex items-center justify-center">
              <span className="text-[8px] text-black">⚡</span>
            </div>
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <h3 className="font-grotesk text-lg text-cream font-bold uppercase tracking-wide">
                LIONEL MESSI
              </h3>
              <span className="px-2 py-0.5 rounded bg-[#6FFF00]/10 border border-[#6FFF00]/20 text-[9px] font-mono text-[#6FFF00] uppercase font-bold tracking-widest animate-pulse">
                IDOL COACH
              </span>
            </div>
            <span className="text-[10px] text-cream/40 font-mono block uppercase">
              {lang === "mn" ? "ЛИОНЭЛ МЕССИ — G.O.A.T СПОРТЫН ЗӨВЛӨХ" : "LIONEL MESSI — G.O.A.T MENTOR MATRIX"}
            </span>
          </div>
        </div>

        <button
          onClick={clearChat}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/5 border border-white/10 text-[10px] font-mono text-cream/70 hover:bg-white/10 hover:text-white transition-all uppercase cursor-pointer"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          {lang === "mn" ? "Цэвэрлэх" : "RESET CONVERSATION"}
        </button>
      </div>

      {/* Chat Messages Log */}
      <div className="h-[320px] overflow-y-auto pr-2 flex flex-col gap-3 scrollbar-thin scrollbar-thumb-white/10">
        <AnimatePresence initial={false}>
          {messages.map((msg, index) => {
            const isUser = msg.role === "user";
            return (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 10, scale: 0.98 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                transition={{ duration: 0.2 }}
                className={`flex gap-3 max-w-[85%] ${isUser ? "ml-auto flex-row-reverse" : "mr-auto"}`}
              >
                {/* Avatar */}
                <div className={`w-8 h-8 rounded-full shrink-0 flex items-center justify-center font-bold text-xs border ${
                  isUser 
                    ? "bg-[#6FFF00]/10 border-[#6FFF00]/30 text-[#6FFF00]" 
                    : "bg-white/5 border-white/15 text-cyan-400"
                }`}>
                  {isUser ? <User className="w-3.5 h-3.5" /> : <Award className="w-4 h-4" />}
                </div>

                {/* Bubble message content */}
                <div className={`p-3.5 rounded-2xl text-xs leading-relaxed ${
                  isUser 
                    ? "bg-[#6FFF00]/10 border border-[#6FFF00]/20 text-cream rounded-tr-none" 
                    : "bg-white/[0.03] border border-white/5 text-cream/90 rounded-tl-none shadow-lg"
                }`}>
                  <p className="whitespace-pre-wrap">{msg.text}</p>
                </div>
              </motion.div>
            );
          })}
        </AnimatePresence>

        {/* Typing indicator */}
        {isLoading && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex gap-3 max-w-[85%] mr-auto"
          >
            <div className="w-8 h-8 rounded-full shrink-0 flex items-center justify-center font-bold text-xs border bg-white/5 border-white/15 text-cyan-400">
              <Award className="w-4 h-4" />
            </div>
            <div className="p-3.5 rounded-2xl bg-white/[0.03] border border-white/5 text-cream/50 rounded-tl-none flex items-center gap-1.5 font-mono text-[10px]">
              <span className="w-1.5 h-1.5 bg-[#6FFF00] rounded-full animate-bounce" style={{ animationDelay: "0ms" }} />
              <span className="w-1.5 h-1.5 bg-[#6FFF00] rounded-full animate-bounce" style={{ animationDelay: "150ms" }} />
              <span className="w-1.5 h-1.5 bg-[#6FFF00] rounded-full animate-bounce" style={{ animationDelay: "300ms" }} />
              <span className="ml-1 uppercase text-[8px] tracking-wider font-bold text-neon">MESSI IS WRITING...</span>
            </div>
          </motion.div>
        )}

        {errorMsg && (
          <div className="flex gap-2 items-center justify-center p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-[10px] font-mono uppercase mt-2">
            <ShieldAlert className="w-4 h-4" />
            <span>{errorMsg}</span>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Starter quick prompt suggestions */}
      <div className="mt-4 border-t border-white/5 pt-3">
        <span className="text-[9px] font-mono font-bold text-neon uppercase tracking-wider block mb-2">
          💡 {lang === "mn" ? "ШУУД АСУУХ ЗӨВЛӨГӨӨ:" : "QUICK MENTOR TRIGGERS:"}
        </span>
        <div className="flex flex-wrap gap-2">
          {starterPrompts.map((prompt, idx) => (
            <button
              key={idx}
              onClick={() => handleSend(prompt)}
              disabled={isLoading}
              className="text-[10px] font-mono font-medium px-3 py-1.5 rounded-xl bg-white/5 border border-white/10 text-cream/70 hover:bg-[#6FFF00]/10 hover:border-[#6FFF00]/30 hover:text-[#6FFF00] transition-all cursor-pointer text-left disabled:opacity-50 disabled:pointer-events-none"
            >
              {prompt}
            </button>
          ))}
        </div>
      </div>

      {/* Chat Input form */}
      <form onSubmit={(e) => { e.preventDefault(); handleSend(input); }} className="mt-4 flex items-center gap-2">
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          disabled={isLoading}
          placeholder={lang === "mn" ? "Месси-ээс асуух зүйлээ энд бичнэ үү..." : "Ask Messi coaching tips..."}
          className="flex-1 bg-black/40 border border-white/10 rounded-2xl px-4 py-3 text-xs text-cream placeholder-white/20 focus:outline-none focus:border-[#6FFF00] focus:ring-1 focus:ring-[#6FFF00] font-mono transition-all disabled:opacity-50"
        />
        <button
          type="submit"
          disabled={isLoading || !input.trim()}
          className="p-3 rounded-2xl bg-[#6FFF00] text-[#010828] font-bold hover:bg-[#85ff2a] active:scale-95 transition-all cursor-pointer disabled:opacity-40 disabled:pointer-events-none"
        >
          <Send className="w-4 h-4" />
        </button>
      </form>

    </div>
  );
}
