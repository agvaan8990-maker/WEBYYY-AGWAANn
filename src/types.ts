/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export interface GameDetails {
  name: string;
  genre: string;
  rank: string;
  favChar: string;
  mnDesc: string;
  enDesc: string;
  stats: {
    aim: number;
    speed: number;
    team: number;
    tactics: number;
  };
}

export interface QuizQuestion {
  id: number;
  questionMn: string;
  questionEn: string;
  optionsMn: string[];
  optionsEn: string[];
  correctIdx: number;
  funFactMn: string;
  funFactEn: string;
}

export interface GuestbookEntry {
  id: string;
  name: string;
  message: string;
  avatar: string;
  timestamp: string;
  likes: number;
  isAgvaanReply?: boolean;
}

export type ThemeName = "cyber" | "synthwave" | "purple" | "sunset";

export interface ThemeConfig {
  name: string;
  bgGrad: string;
  textNeon: string;
  accentColor: string;
  primaryBg: string;
  glowShadow: string;
}
