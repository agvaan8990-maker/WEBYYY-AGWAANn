/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useRef, useEffect, FormEvent } from "react";
import { MessageCircle, X, Send, User, MessageSquare, AlertCircle, RefreshCw, Minus } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { sound } from "../utils/audio";

interface Message {
  role: "user" | "model";
  text: string;
}

interface MeAIChatProps {
  lang: "mn" | "en";
  soundEnabled: boolean;
}

export function MeAIChat({ lang, soundEnabled }: MeAIChatProps) {
  const [isOpen, setIsOpen] = useState<boolean>(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState<string>("");
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string>("");
  const [hasNewNotification, setHasNewNotification] = useState<boolean>(true);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isLoading, isOpen]);

  // Set initial welcome message
  useEffect(() => {
    if (messages.length === 0) {
      const welcomeText = lang === "mn"
        ? "Сайн уу! Энд Агваан байна. 👨‍🚀 Миний AI хувилбартай тавтай морил! Сагс тоглох, CS2 сонирхол, эсвэл миний сайтыг үзэх талаар асуулт байвал надтай чөлөөтэй чатлаарай!"
        : "Yo! Agvaan here. 👨‍🚀 Welcome to my personal AI double. Ask me anything about my hobbies, CS2 goals, or how to navigate my cyber space portfolio!";
      
      setMessages([{ role: "model", text: welcomeText }]);
    }
  }, [lang]);

  const toggleChat = () => {
    if (soundEnabled) sound.playBeep();
    setIsOpen(!isOpen);
    setHasNewNotification(false);
  };

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
      const historyPayload = updatedMessages.map((msg) => ({
        role: msg.role,
        parts: [{ text: msg.text }],
      }));

      const response = await fetch("/api/gemini/me-ai", {
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
        const fallbackMsg = lang === "mn" ? "Сүлжээний алдаа гарлаа. Сервер холбогдсонгүй." : "Network error. Try asking again.";
        throw new Error(data?.error || fallbackMsg);
      }

      if (data?.error) {
        throw new Error(data.error);
      }

      const replyText = data.text || (lang === "mn" ? "Надад хариу бичих үг олдсонгүй." : "I couldn't think of a response.");

      if (soundEnabled) sound.playLevelUp();
      setMessages((prev) => [...prev, { role: "model", text: replyText }]);
    } catch (err: any) {
      console.error(err);
      if (soundEnabled) sound.playFail();
      setErrorMsg(err.message || (lang === "mn" ? "Сүлжээний алдаа гарлаа. Дахин асууна уу." : "Network error. Try asking again."));
    } finally {
      setIsLoading(false);
    }
  };

  const clearChat = () => {
    if (soundEnabled) sound.playFail();
    setMessages([]);
  };

  const starterPrompts = lang === "mn" ? [
    "Чиний хобби сонирхол юу вэ? 🏀🎮",
    "Сагсан бөмбөг үү, эсвэл CS2 уу? 🔫🏀",
    "Сайтын чинь ямар хэсэг хамгийн гоё вэ? 🚀",
    "Ирээдүйн чинь зорилго, мөрөөдөл юу вэ? 🪐"
  ] : [
    "What are your main hobbies? 🏀🎮",
    "Which is better: Basketball or CS2? 🔫🏀",
    "Which part of your site should I explore first? 🚀",
    "What is your dream in Counter Strike 2? 🪐"
  ];

  return (
    <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end gap-3 font-sans">
      
      {/* Floating Messenger Chat Window */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, scale: 0.85, y: 30 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.85, y: 30 }}
            transition={{ type: "spring", damping: 20 }}
            className="w-[340px] sm:w-[380px] h-[520px] rounded-[28px] border border-white/10 bg-[#010828]/95 backdrop-blur-xl shadow-2xl flex flex-col overflow-hidden ring-4 ring-[#6FFF00]/20"
          >
            {/* Header */}
            <div className="bg-gradient-to-r from-purple-950/40 to-cyan-950/40 p-4 border-b border-white/10 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="relative">
                  <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-cyan-400 to-[#6FFF00] p-[2px]">
                    <div className="w-full h-full rounded-full bg-black flex items-center justify-center font-bold text-base text-cyan-400">
                      👨‍🚀
                    </div>
                  </div>
                  <div className="absolute bottom-0 right-0 w-3 h-3 rounded-full bg-[#6FFF00] border-2 border-[#010828] animate-pulse" />
                </div>
                <div>
                  <h4 className="font-grotesk text-sm text-cream font-bold leading-none uppercase tracking-wide">
                    {lang === "mn" ? "Агваан (AI Туслах)" : "Agvaan (AI Double)"}
                  </h4>
                  <span className="text-[10px] text-cream/40 font-mono uppercase tracking-wider block mt-0.5">
                    {lang === "mn" ? "ОНЛАЙН БАЙНА" : "ME-AI ONLINE MATRIX"}
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-1">
                <button
                  onClick={clearChat}
                  title="Clear chat history"
                  className="p-1.5 rounded-lg text-cream/40 hover:text-cream hover:bg-white/5 transition-colors cursor-pointer"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                </button>
                <button
                  onClick={toggleChat}
                  className="p-1.5 rounded-lg text-cream/40 hover:text-cream hover:bg-white/5 transition-colors cursor-pointer"
                >
                  <Minus className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Chat History View */}
            <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-3 scrollbar-thin scrollbar-thumb-white/15">
              <AnimatePresence initial={false}>
                {messages.map((msg, index) => {
                  const isUser = msg.role === "user";
                  return (
                    <motion.div
                      key={index}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className={`flex gap-2 max-w-[85%] ${isUser ? "ml-auto flex-row-reverse" : "mr-auto"}`}
                    >
                      <div className={`w-7 h-7 rounded-full shrink-0 flex items-center justify-center text-xs border ${
                        isUser 
                          ? "bg-purple-500/10 border-purple-500/20 text-purple-400" 
                          : "bg-cyan-500/10 border-cyan-500/20 text-cyan-400"
                      }`}>
                        {isUser ? <User className="w-3 h-3" /> : <span>🚀</span>}
                      </div>

                      <div className={`p-3 rounded-2xl text-xs leading-relaxed ${
                        isUser 
                          ? "bg-purple-950/40 border border-purple-500/20 text-cream rounded-tr-none" 
                          : "bg-white/[0.03] border border-white/5 text-cream/90 rounded-tl-none"
                      }`}>
                        <p className="whitespace-pre-wrap">{msg.text}</p>
                      </div>
                    </motion.div>
                  );
                })}
              </AnimatePresence>

              {isLoading && (
                <div className="flex gap-2 max-w-[85%] mr-auto">
                  <div className="w-7 h-7 rounded-full bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 flex items-center justify-center">
                    <span>🚀</span>
                  </div>
                  <div className="p-3 rounded-2xl bg-white/[0.03] border border-white/5 text-cream/50 rounded-tl-none flex items-center gap-1 font-mono text-[9px]">
                    <span className="w-1.5 h-1.5 bg-cyan-400 rounded-full animate-bounce" style={{ animationDelay: "0ms" }} />
                    <span className="w-1.5 h-1.5 bg-cyan-400 rounded-full animate-bounce" style={{ animationDelay: "150ms" }} />
                    <span className="w-1.5 h-1.5 bg-cyan-400 rounded-full animate-bounce" style={{ animationDelay: "300ms" }} />
                    <span className="ml-1 uppercase text-[7px] tracking-wider font-bold">AGVAAN IS TYPING...</span>
                  </div>
                </div>
              )}

              {errorMsg && (
                <div className="flex gap-1.5 items-center justify-center p-2.5 rounded-xl bg-red-500/15 border border-red-500/25 text-red-400 text-[10px] font-mono uppercase mt-1">
                  <AlertCircle className="w-3.5 h-3.5" />
                  <span>{errorMsg}</span>
                </div>
              )}

              <div ref={messagesEndRef} />
            </div>

            {/* Quick Prompts Helper */}
            <div className="px-4 pb-2 border-t border-white/5 pt-2 bg-black/10">
              <span className="text-[8px] font-mono font-bold text-cyan-400 uppercase tracking-widest block mb-1.5">
                💡 {lang === "mn" ? "АСУУЖ БОЛОХ ЗҮЙЛС:" : "SUGGESTED QUESTIONS:"}
              </span>
              <div className="flex flex-wrap gap-1.5">
                {starterPrompts.map((prompt, idx) => (
                  <button
                    key={idx}
                    onClick={() => handleSend(prompt)}
                    disabled={isLoading}
                    className="text-[9px] font-mono px-2 py-1 rounded-lg bg-white/5 border border-white/10 text-cream/60 hover:bg-cyan-500/10 hover:border-cyan-500/30 hover:text-cyan-400 transition-all cursor-pointer text-left disabled:opacity-50 disabled:pointer-events-none"
                  >
                    {prompt}
                  </button>
                ))}
              </div>
            </div>

            {/* Input Footer Form */}
            <form onSubmit={(e) => { e.preventDefault(); handleSend(input); }} className="p-3 border-t border-white/10 flex items-center gap-2 bg-black/30">
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                disabled={isLoading}
                placeholder={lang === "mn" ? "Агваан-аас асуух зүйлээ бичнэ үү..." : "Ask Agvaan anything..."}
                className="flex-1 bg-white/5 border border-white/10 rounded-xl px-3.5 py-2.5 text-xs text-cream placeholder-white/25 focus:outline-none focus:border-cyan-400 font-mono transition-all disabled:opacity-50"
              />
              <button
                type="submit"
                disabled={isLoading || !input.trim()}
                className="p-2.5 rounded-xl bg-cyan-500 text-[#010828] font-bold hover:bg-cyan-400 transition-all cursor-pointer disabled:opacity-40"
              >
                <Send className="w-3.5 h-3.5" />
              </button>
            </form>

          </motion.div>
        )}
      </AnimatePresence>

      {/* Floating Messenger Icon Trigger */}
      <motion.button
        onClick={toggleChat}
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.95 }}
        className={`relative w-14 h-14 rounded-full flex items-center justify-center text-white shadow-2xl hover:brightness-110 active:brightness-95 transition-all cursor-pointer ${
          isOpen 
            ? "bg-red-500 shadow-red-500/30 rotate-90" 
            : "bg-[#6FFF00] text-black shadow-[#6FFF00]/30 animate-pulse"
        }`}
      >
        {isOpen ? (
          <X className="w-6 h-6 text-black" />
        ) : (
          <>
            <MessageCircle className="w-6 h-6" />
            
            {/* Notification Glow Pip */}
            {hasNewNotification && (
              <span className="absolute -top-1 -right-1 flex h-4 w-4">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-purple-400 opacity-75" />
                <span className="relative inline-flex rounded-full h-4 w-4 bg-purple-500 text-[8px] font-mono font-bold text-white items-center justify-center">
                  1
                </span>
              </span>
            )}
          </>
        )}
      </motion.button>

    </div>
  );
}
