/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useRef, useEffect, DragEvent, ChangeEvent } from "react";
import { 
  Play, 
  Pause, 
  Volume2, 
  VolumeX, 
  Maximize2, 
  RotateCcw, 
  UploadCloud, 
  Tv, 
  FileVideo, 
  Sparkles, 
  Info, 
  Music,
  CheckCircle2,
  Sliders,
  Radio
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { sound } from "../utils/audio";

interface SpaceCinemaProps {
  lang: "mn" | "en";
  soundEnabled: boolean;
}

export function SpaceCinema({ lang, soundEnabled }: SpaceCinemaProps) {
  const [videoSrc, setVideoSrc] = useState<string>("");
  const [fileName, setFileName] = useState<string>("");
  const [fileSize, setFileSize] = useState<string>("");
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [isMuted, setIsMuted] = useState<boolean>(false);
  const [currentTime, setCurrentTime] = useState<number>(0);
  const [duration, setDuration] = useState<number>(0);
  const [volume, setVolume] = useState<number>(0.8);
  const [isDragOver, setIsDragOver] = useState<boolean>(false);
  const [theaterMode, setTheaterMode] = useState<boolean>(false);
  const [autoLoadAttempted, setAutoLoadAttempted] = useState<boolean>(false);
  const [loadError, setLoadError] = useState<boolean>(false);

  const videoRef = useRef<HTMLVideoElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Attempt to auto-load default video from assets if it exists
  useEffect(() => {
    if (!autoLoadAttempted) {
      setAutoLoadAttempted(true);
      // We look for the file in the designated assets path
      const defaultPath = "/assets/images/City_Leaves_the_Floor (1).mp4";
      
      // Test if defaultPath can be resolved (will fail on 404 in preview if missing, but we handle error gracefully)
      const testVideo = document.createElement("video");
      testVideo.src = defaultPath;
      testVideo.oncanplay = () => {
        setVideoSrc(defaultPath);
        setFileName("City_Leaves_the_Floor (1).mp4");
        setFileSize("Local Asset");
      };
      testVideo.onerror = () => {
        // Fallback to empty source so uploader displays
        setLoadError(true);
      };
    }
  }, [autoLoadAttempted]);

  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      loadVideoFile(file);
    }
  };

  const loadVideoFile = (file: File) => {
    if (soundEnabled) sound.playLevelUp();
    const url = URL.createObjectURL(file);
    setVideoSrc(url);
    setFileName(file.name);
    setFileSize((file.size / (1024 * 1024)).toFixed(2) + " MB");
    setIsPlaying(false);
    setLoadError(false);
  };

  const handleDragOver = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragOver(true);
  };

  const handleDragLeave = () => {
    setIsDragOver(false);
  };

  const handleDrop = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragOver(false);
    const file = e.dataTransfer.files?.[0];
    if (file && file.type.startsWith("video/")) {
      loadVideoFile(file);
    } else {
      if (soundEnabled) sound.playFail();
    }
  };

  const loadSampleVideo = () => {
    if (soundEnabled) sound.playLaser();
    // High-quality public space-themed abstract loop video
    const sampleUrl = "https://assets.mixkit.co/videos/preview/mixkit-space-stars-background-animation-31645-large.mp4";
    setVideoSrc(sampleUrl);
    setFileName("City_Leaves_the_Floor_SIMULATED.mp4");
    setFileSize("3.52 MB (Stream)");
    setIsPlaying(false);
    setLoadError(false);
  };

  const togglePlay = () => {
    if (!videoRef.current) return;
    if (soundEnabled) sound.playBeep();

    if (isPlaying) {
      videoRef.current.pause();
      setIsPlaying(false);
    } else {
      videoRef.current.play().then(() => {
        setIsPlaying(true);
      }).catch(() => {
        setIsPlaying(false);
      });
    }
  };

  const toggleMute = () => {
    if (!videoRef.current) return;
    if (soundEnabled) sound.playBeep();
    const nextMute = !isMuted;
    videoRef.current.muted = nextMute;
    setIsMuted(nextMute);
  };

  const handleTimeUpdate = () => {
    if (!videoRef.current) return;
    setCurrentTime(videoRef.current.currentTime);
  };

  const handleLoadedMetadata = () => {
    if (!videoRef.current) return;
    setDuration(videoRef.current.duration);
  };

  const handleSeek = (e: ChangeEvent<HTMLInputElement>) => {
    if (!videoRef.current) return;
    const time = parseFloat(e.target.value);
    videoRef.current.currentTime = time;
    setCurrentTime(time);
  };

  const handleVolumeChange = (e: ChangeEvent<HTMLInputElement>) => {
    if (!videoRef.current) return;
    const vol = parseFloat(e.target.value);
    videoRef.current.volume = vol;
    setVolume(vol);
    if (vol > 0 && isMuted) {
      videoRef.current.muted = false;
      setIsMuted(false);
    }
  };

  const restartVideo = () => {
    if (!videoRef.current) return;
    if (soundEnabled) sound.playLaser();
    videoRef.current.currentTime = 0;
    setCurrentTime(0);
    videoRef.current.play();
    setIsPlaying(true);
  };

  const toggleFullscreen = () => {
    if (!videoRef.current) return;
    if (soundEnabled) sound.playBeep();
    if (videoRef.current.requestFullscreen) {
      videoRef.current.requestFullscreen();
    }
  };

  const formatTime = (time: number) => {
    const mins = Math.floor(time / 60);
    const secs = Math.floor(time % 60);
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  };

  const clearVideo = () => {
    if (soundEnabled) sound.playFail();
    setVideoSrc("");
    setFileName("");
    setFileSize("");
    setIsPlaying(false);
  };

  return (
    <div className={`relative w-full transition-all duration-500 ${theaterMode ? "ring-8 ring-[#6FFF00]/30 rounded-[36px]" : ""}`}>
      
      {/* Surrounding ambient lighting glow projection if theater mode is active */}
      {theaterMode && isPlaying && (
        <div className="absolute -inset-10 bg-[#6FFF00]/5 filter blur-3xl animate-pulse rounded-[48px] pointer-events-none z-0" />
      )}

      <div className="liquid-glass rounded-[32px] p-6 border border-white/10 grid grid-cols-1 lg:grid-cols-12 gap-6 relative z-10">
        
        {/* Left Column: Video screen player (7 cols) */}
        <div className="lg:col-span-8 flex flex-col gap-4">
          
          <AnimatePresence mode="wait">
            {!videoSrc ? (
              /* Drag & Drop Uploader */
              <motion.div
                key="uploader"
                initial={{ opacity: 0, scale: 0.98 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.98 }}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
                className={`relative aspect-video w-full rounded-2xl border-2 border-dashed flex flex-col items-center justify-center p-6 text-center transition-all duration-300 cursor-pointer ${
                  isDragOver 
                    ? "border-[#6FFF00] bg-[#6FFF00]/10 shadow-[0_0_20px_rgba(111,255,0,0.2)]" 
                    : "border-white/15 bg-black/40 hover:border-white/30"
                }`}
                onClick={() => fileInputRef.current?.click()}
              >
                <div className="flex flex-col items-center gap-3">
                  <div className={`w-14 h-14 rounded-full flex items-center justify-center bg-white/5 border transition-transform duration-300 ${isDragOver ? "scale-110 border-[#6FFF00]" : "border-white/10"}`}>
                    <UploadCloud className={`w-7 h-7 ${isDragOver ? "text-[#6FFF00] animate-bounce" : "text-cream/50"}`} />
                  </div>
                  
                  <div>
                    <span className="text-sm font-bold text-cream uppercase block mb-1">
                      {lang === "mn" ? "ВИДЕО ФАЙЛ ОРУУЛАХ" : "LOAD MUSIC VIDEO SIGNAL"}
                    </span>
                    <span className="text-xs text-cream/40 block max-w-sm uppercase font-mono tracking-wide leading-relaxed">
                      {lang === "mn" 
                        ? "'City_Leaves_the_Floor (1).mp4' эсвэл дурын дууны видео файлыг чирч тавих уу эсвэл дарж сонгоно уу"
                        : "Drag and drop your 'City_Leaves_the_Floor (1).mp4' or click to browse local video files"}
                    </span>
                  </div>

                  <div className="flex flex-col sm:flex-row gap-2 mt-2">
                    <button
                      type="button"
                      className="px-4 py-2 rounded-lg bg-white/5 border border-white/10 text-[10px] font-bold text-cream hover:bg-white/10 transition-all uppercase"
                    >
                      📁 {lang === "mn" ? "Локал файл сонгох" : "SELECT LOCAL FILE"}
                    </button>
                    
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        loadSampleVideo();
                      }}
                      className="px-4 py-2 rounded-lg bg-[#6FFF00]/15 border border-[#6FFF00]/30 text-[10px] font-bold text-[#6FFF00] hover:bg-[#6FFF00]/25 transition-all uppercase"
                    >
                      ⚡ {lang === "mn" ? "Видео Симуляци ажиллуулах" : "SIMULATE VIDEO LOOP"}
                    </button>
                  </div>
                </div>

                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleFileChange}
                  accept="video/*"
                  className="hidden"
                />
              </motion.div>
            ) : (
              /* Custom Styled Video Player */
              <motion.div
                key="player"
                initial={{ opacity: 0, scale: 0.98 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.98 }}
                className="relative aspect-video w-full rounded-2xl overflow-hidden bg-black border border-white/10 flex flex-col justify-end group shadow-2xl"
              >
                {/* Real HTML5 Video Tag */}
                <video
                  ref={videoRef}
                  src={videoSrc}
                  onTimeUpdate={handleTimeUpdate}
                  onLoadedMetadata={handleLoadedMetadata}
                  onClick={togglePlay}
                  className="w-full h-full object-contain cursor-pointer"
                  loop
                  playsInline
                />

                {/* Subspace Glow Backdrop inside video container */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none" />

                {/* Simulated equalizer overlays on top of video when playing */}
                {isPlaying && (
                  <div className="absolute top-4 right-4 flex items-end gap-1 p-2 rounded-lg bg-black/60 border border-white/10 backdrop-blur-sm pointer-events-none z-10">
                    <Radio className="w-3.5 h-3.5 text-[#6FFF00] animate-pulse shrink-0" />
                    <span className="text-[9px] font-mono font-bold text-[#6FFF00] uppercase tracking-wider">AUDIO ACTIVE</span>
                    <div className="flex items-end gap-0.5 h-3 ml-2">
                      {[1.2, 0.8, 1.5, 0.6, 1.1].map((dur, idx) => (
                        <div
                          key={idx}
                          className="w-1 bg-[#6FFF00] rounded-full"
                          style={{
                            height: "100%",
                            animation: `eq-anim ${dur}s infinite alternate ease-in-out`
                          }}
                        />
                      ))}
                    </div>
                  </div>
                )}

                {/* Custom Spaceship Controller Bar overlay */}
                <div className="absolute bottom-0 inset-x-0 p-4 flex flex-col gap-3 bg-gradient-to-t from-black/95 via-black/80 to-transparent opacity-0 group-hover:opacity-100 focus-within:opacity-100 transition-opacity duration-300 z-10">
                  
                  {/* Progress Seek bar slider */}
                  <div className="flex items-center gap-3">
                    <span className="text-[10px] font-mono text-cream/60">{formatTime(currentTime)}</span>
                    <input
                      type="range"
                      min={0}
                      max={duration || 100}
                      value={currentTime}
                      onChange={handleSeek}
                      className="flex-1 accent-[#6FFF00] bg-white/20 h-1.5 rounded-lg appearance-none cursor-pointer hover:bg-white/35 transition-all"
                    />
                    <span className="text-[10px] font-mono text-cream/60">{formatTime(duration)}</span>
                  </div>

                  {/* Core controls row */}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      {/* Play / Pause */}
                      <button
                        onClick={togglePlay}
                        className="w-8 h-8 rounded-full bg-white/10 border border-white/15 hover:bg-[#6FFF00]/20 hover:border-[#6FFF00]/50 hover:text-[#6FFF00] flex items-center justify-center transition-all cursor-pointer"
                        title={isPlaying ? "Pause" : "Play"}
                      >
                        {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4 ml-0.5" />}
                      </button>

                      {/* Restart / Loop */}
                      <button
                        onClick={restartVideo}
                        className="w-8 h-8 rounded-full bg-white/10 border border-white/15 hover:bg-white/20 flex items-center justify-center transition-all cursor-pointer text-cream/80 hover:text-white"
                        title="Restart Track"
                      >
                        <RotateCcw className="w-4 h-4" />
                      </button>

                      {/* Volume slider & mute toggle */}
                      <div className="flex items-center gap-2 bg-white/5 px-2.5 py-1 rounded-xl border border-white/5">
                        <button
                          onClick={toggleMute}
                          className="text-cream/70 hover:text-[#6FFF00] transition-colors cursor-pointer"
                        >
                          {isMuted || volume === 0 ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
                        </button>
                        <input
                          type="range"
                          min={0}
                          max={1}
                          step={0.05}
                          value={isMuted ? 0 : volume}
                          onChange={handleVolumeChange}
                          className="w-16 accent-[#6FFF00] bg-white/20 h-1 rounded-lg cursor-pointer"
                        />
                      </div>
                    </div>

                    <div className="flex items-center gap-3">
                      {/* Close / Eject */}
                      <button
                        onClick={clearVideo}
                        className="px-3 py-1.5 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-[10px] font-bold font-mono hover:bg-red-500/20 transition-all uppercase cursor-pointer"
                        title="Eject Video"
                      >
                        ⚡ {lang === "mn" ? "ГАРГАХ" : "EJECT"}
                      </button>

                      {/* Fullscreen */}
                      <button
                        onClick={toggleFullscreen}
                        className="w-8 h-8 rounded-full bg-white/10 border border-white/15 hover:bg-white/20 flex items-center justify-center transition-all cursor-pointer text-cream/80 hover:text-white"
                        title="Fullscreen"
                      >
                        <Maximize2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Quick interactive stats sub-bar */}
          <div className="grid grid-cols-3 gap-2 bg-white/[0.01] border border-white/5 p-3 rounded-xl text-center text-[10px] font-mono">
            <div>
              <span className="text-cream/40 block uppercase">STATION CORNER:</span>
              <span className="text-neon font-bold">ONLINE SPECTRUM</span>
            </div>
            <div>
              <span className="text-cream/40 block uppercase">HARDWARE ACCEL:</span>
              <span className="text-cream font-bold">H.264 // GL</span>
            </div>
            <div>
              <span className="text-cream/40 block uppercase">THEATER LIGHTS:</span>
              <button
                onClick={() => {
                  setTheaterMode(!theaterMode);
                  if (soundEnabled) sound.playBeep();
                }}
                className={`px-2 py-0.5 rounded font-bold text-[9px] cursor-pointer transition-all ${
                  theaterMode 
                    ? "bg-[#6FFF00] text-[#010828] shadow-sm shadow-[#6FFF00]/20" 
                    : "bg-white/5 text-white/50 hover:bg-white/10"
                }`}
              >
                {theaterMode ? (lang === "mn" ? "ОН" : "ON") : (lang === "mn" ? "ОФФ" : "OFF")}
              </button>
            </div>
          </div>
        </div>

        {/* Right Column: Audio details panel & stats (5 cols) */}
        <div className="lg:col-span-4 flex flex-col gap-4">
          <span className="text-neon text-[10px] font-bold tracking-[0.25em] uppercase block">[ FLUID COGNITIVE AUDIO ]</span>
          
          <h3 className="font-grotesk text-2xl text-cream uppercase leading-none">
            {lang === "mn" ? "САНСАРЫН МУЗЫК & КИНО" : "ORBIS CINEMA DECK"}
          </h3>

          <p className="text-xs text-cream/70 leading-relaxed uppercase">
            {lang === "mn"
              ? "Миний хувийн сансарын станцын медиа дамжуулагч системд тавтай морил. Та өөрийн байршуулсан 'City_Leaves_the_Floor (1).mp4' дуу эсвэл дуртай видеог тоглуулан удирдах бүрэн боломжтой."
              : "Synchronized audio feedback matrix. Drag in any custom video signal, or load our spaceship simulated loop. Watch the frequency bars dance live with the beat."}
          </p>

          <div className="border-t border-white/5 pt-3.5 flex flex-col gap-2.5 font-mono text-xs text-cream/50">
            <span className="text-[10px] font-bold text-neon uppercase tracking-wider block">TRACK STATUS LOGS:</span>
            
            <div className="flex justify-between items-center bg-black/20 p-2.5 rounded-xl border border-white/5">
              <span>FILENAME:</span>
              <span className="text-cream font-bold truncate max-w-[180px]">
                {fileName || (lang === "mn" ? "ОРОЛТГҮЙ" : "NO ACTIVE SIGNAL")}
              </span>
            </div>

            <div className="flex justify-between items-center bg-black/20 p-2.5 rounded-xl border border-white/5">
              <span>DECODED SIZE:</span>
              <span className="text-cream font-bold">{fileSize || "0.00 MB"}</span>
            </div>

            <div className="flex justify-between items-center bg-black/20 p-2.5 rounded-xl border border-white/5">
              <span>STATUS:</span>
              <span className={`font-bold flex items-center gap-1 ${isPlaying ? "text-[#6FFF00]" : "text-amber-500"}`}>
                <span className={`w-1.5 h-1.5 rounded-full ${isPlaying ? "bg-[#6FFF00] animate-ping" : "bg-amber-500"}`} />
                {isPlaying ? (lang === "mn" ? "ТОГЛОЖ БАЙНА" : "TRANSMITTING") : (lang === "mn" ? "ЗОГССОН" : "IDLE LOGGED")}
              </span>
            </div>
          </div>

          <div className="p-4 rounded-2xl bg-white/[0.01] border border-white/5 mt-auto flex items-start gap-3">
            <Info className="w-5 h-5 text-[#6FFF00] shrink-0 mt-0.5" />
            <div className="text-[10px] text-cream/50 uppercase leading-relaxed font-mono">
              <strong className="text-cream block mb-0.5">{lang === "mn" ? "ХОЛБОЛТЫН ЗААВАР:" : "CALIBRATION TIPS:"}</strong>
              {lang === "mn" 
                ? "Хэрэв та өөрийн 'City_Leaves_the_Floor (1).mp4' файлыг локал компьютэрээсээ шууд сонговол таны хөтөч дээр бүрэн хамгаалалттайгаар шууд тоглогдох болно." 
                : "Select or drag any video from your computer to run it inside the fluid web-sandbox. The playback remains 100% private."}
            </div>
          </div>

        </div>

      </div>
    </div>
  );
}
