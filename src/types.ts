export interface Persona {
  id: string;
  name: string;
  instructions: string;
  prompt?: string;
  avatarUrl?: string;
  patSuffix?: string;
}

export interface UserProfile {
  name: string;
  avatarUrl?: string;
  anniversaryDate?: string;
  patSuffix?: string;
  persona?: string;
}

export interface ApiSettings {
  apiUrl: string;
  apiKey: string;
  model: string;
  temperature: number;
  proactiveDelay?: number;
}

export interface ThemeSettings {
  wallpaper: string;
  lockScreenWallpaper: string;
  momentsBg: string;
  chatBg?: string;
  iconBgColor: string;
  fontUrl: string;
  customIcons: Record<string, string>;
  widgetImages?: {
    topRight?: string;
    bottomLeft?: string;
  };
}

export interface WorldbookSettings {
  jailbreakPrompt: string;
  globalPrompt: string;
}

export interface Song {
  id: string;
  title: string;
  artist: string;
  cover: string;
  lyrics: string;
}

export interface Message {
  id: string;
  personaId: string;
  role: 'user' | 'model';
  text: string;
  msgType?: 'text' | 'transfer' | 'music' | 'system';
  amount?: number;
  song?: Song;
  timestamp?: string;
  isRead?: boolean;
  status?: 'sent' | 'delivered' | 'read';
  createdAt?: number;
  isRecalled?: boolean;
}

export interface Comment {
  id: string;
  authorId: string;
  text: string;
  timestamp: string;
  replyToId?: string;
  createdAt?: number;
}

export interface Moment {
  id: string;
  authorId: string;
  text: string;
  timestamp: string;
  likedByIds: string[];
  comments: Comment[];
  song?: Song;
  createdAt?: number;
}

export type Screen = 'home' | 'chat' | 'persona' | 'api' | 'theme' | 'music';




