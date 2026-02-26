import React from 'react';
import { MessageCircle, Book, Music, Hash, HeartPulse, Mail, Truck, MoreHorizontal, Settings, Lock, Palette, Mic, Image as ImageIcon, PlusCircle, Smile } from 'lucide-react';
import { ThemeSettings } from '../types';

interface Props {
  onNavigate: (screen: 'chat' | 'persona' | 'api' | 'theme') => void;
  onLock: () => void;
  theme: ThemeSettings;
}

function AppIcon({ id, icon: Icon, label, onClick, theme }: { id: string, icon: any, label: string, onClick?: () => void, theme: ThemeSettings }) {
  const customImage = theme.customIcons?.[id];

  return (
    <button onClick={onClick} className="flex flex-col items-center gap-1.5 group">
      <div 
        className="w-[52px] h-[52px] backdrop-blur-md rounded-[1.2rem] flex items-center justify-center shadow-sm group-active:scale-95 transition-transform overflow-hidden"
        style={{ backgroundColor: customImage ? 'transparent' : theme.iconBgColor }}
      >
        {customImage ? (
          <img src={customImage} alt={label} className="w-full h-full object-cover" />
        ) : (
          <Icon size={26} className="text-neutral-700" strokeWidth={2} />
        )}
      </div>
      <span className="text-[11px] font-medium text-neutral-800 drop-shadow-sm">{label}</span>
    </button>
  );
}

export function HomeScreen({ onNavigate, onLock, theme }: Props) {
  return (
    <div className="w-full h-full pt-16 px-5 pb-8 flex flex-col">
      <div className="grid grid-cols-4 gap-x-4 gap-y-4 flex-1 content-start">
        
        {/* Top Left Widget (col-span-2) */}
        <div className="col-span-2 h-[110px] relative">
          <img 
            src="https://images.unsplash.com/photo-1516815231560-8f41ec531527?auto=format&fit=crop&w=200&q=80" 
            className="absolute top-0 left-0 w-[72px] h-[72px] rounded-2xl object-cover border-2 border-white shadow-sm"
            alt="Water drops"
          />
          <img 
            src="https://images.unsplash.com/photo-1534796636912-3b95b3ab5986?auto=format&fit=crop&w=200&q=80" 
            className="absolute bottom-0 right-2 w-[84px] h-[84px] rounded-2xl object-cover border-2 border-white shadow-md z-10"
            alt="Stars"
          />
        </div>

        {/* Top Right Widget (col-span-2) */}
        <div className="col-span-2 h-[110px] rounded-[1.5rem] overflow-hidden shadow-sm border border-white/40">
          <img 
            src="https://images.unsplash.com/photo-1529626455594-4ff0802cfb7e?auto=format&fit=crop&w=400&q=80" 
            className="w-full h-full object-cover"
            alt="Portrait"
          />
        </div>

        {/* Middle Left Icons (col-span-2) */}
        <div className="col-span-2 grid grid-cols-2 gap-y-3 gap-x-2 place-items-center">
          <AppIcon id="chat" icon={MessageCircle} label="微信" onClick={() => onNavigate('chat')} theme={theme} />
          <AppIcon id="persona" icon={Book} label="世界书" onClick={() => onNavigate('persona')} theme={theme} />
          <AppIcon id="music" icon={Music} label="音乐" theme={theme} />
          <AppIcon id="xhs" icon={Hash} label="小红书" theme={theme} />
        </div>

        {/* Middle Right Chat Widget (col-span-2) */}
        <div className="col-span-2 bg-white/50 backdrop-blur-xl rounded-[1.5rem] p-3 flex flex-col shadow-sm border border-white/50">
          <div className="text-center text-[9px] text-neutral-500 font-medium mb-1.5">15:50 PM</div>
          <div className="bg-white rounded-2xl rounded-tl-sm px-3 py-2 text-[11px] font-medium w-fit shadow-sm text-neutral-800">
            love yourself. 💕
          </div>
          <div className="flex justify-end mt-2 relative">
            <img 
              src="https://images.unsplash.com/photo-1500917293891-ef795e70e1f6?auto=format&fit=crop&w=100&q=80" 
              className="w-12 h-12 rounded-2xl object-cover shadow-sm border border-white/50"
              alt="Widget Image"
            />
            <div className="absolute -left-3 top-2 bg-white rounded-full p-1 shadow-sm text-neutral-600">
              <Smile size={12} />
            </div>
          </div>
          <div className="mt-2 bg-white rounded-full flex items-center px-2.5 py-1.5 gap-1.5 shadow-sm">
            <span className="text-[10px] text-neutral-400 flex-1 font-medium">Message...</span>
            <Mic size={12} className="text-neutral-600" />
            <ImageIcon size={12} className="text-neutral-600" />
            <div className="bg-black rounded-full p-0.5">
              <PlusCircle size={10} className="text-white" />
            </div>
          </div>
        </div>

        {/* Bottom Left Image Widget (col-span-2) */}
        <div className="col-span-2 h-[140px] rounded-[1.5rem] overflow-hidden shadow-sm border border-white/40 mt-1">
          <img 
            src="https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&w=400&q=80" 
            className="w-full h-full object-cover"
            alt="Portrait 2"
          />
        </div>

        {/* Bottom Right Icons (col-span-2) */}
        <div className="col-span-2 grid grid-cols-2 gap-y-3 gap-x-2 place-items-center mt-1">
          <AppIcon id="game" icon={HeartPulse} label="游戏" theme={theme} />
          <AppIcon id="mail" icon={Mail} label="信箱" theme={theme} />
          <AppIcon id="express" icon={Truck} label="驿站" theme={theme} />
          <AppIcon id="api" icon={MoreHorizontal} label="API" onClick={() => onNavigate('api')} theme={theme} />
        </div>

      </div>

      {/* Dock */}
      <div className="mt-auto h-[68px] bg-white/50 backdrop-blur-2xl rounded-[2rem] flex items-center justify-around px-6 shadow-sm border border-white/40">
        <button className="w-11 h-11 bg-black/20 rounded-full flex items-center justify-center text-white active:scale-95 transition-transform">
          <Settings size={22} />
        </button>
        <button onClick={onLock} className="w-11 h-11 bg-black/20 rounded-full flex items-center justify-center text-white active:scale-95 transition-transform">
          <Lock size={22} />
        </button>
        <button onClick={() => onNavigate('theme')} className="w-11 h-11 bg-black/20 rounded-full flex items-center justify-center text-white active:scale-95 transition-transform">
          <Palette size={22} />
        </button>
      </div>
    </div>
  );
}
