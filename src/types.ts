export interface Persona {
  name: string;
  instructions: string;
  avatarUrl?: string;
}

export interface ApiSettings {
  apiUrl: string;
  apiKey: string;
  model: string;
  temperature: number;
}

export interface ThemeSettings {
  wallpaper: string;
  lockScreenWallpaper: string;
  momentsBg: string;
  iconBgColor: string;
  fontUrl: string;
  customIcons: Record<string, string>;
}

export interface Message {
  id: string;
  role: 'user' | 'model';
  text: string;
  msgType?: 'text' | 'transfer';
  amount?: number;
}

export type Screen = 'home' | 'chat' | 'persona' | 'api' | 'theme';



