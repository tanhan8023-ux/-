import React, { useState, useEffect } from 'react';
import { MessageCircle, Book, Music, Hash, HeartPulse, Mail, Truck, MoreHorizontal, Settings, Lock, Palette, Mic, Image as ImageIcon, PlusCircle, Smile, CloudSun, Heart, Sun, ShoppingBag } from 'lucide-react';
import { ThemeSettings, UserProfile } from '../types';

interface Props {
  onNavigate: (screen: 'chat' | 'persona' | 'api' | 'theme' | 'music') => void;
  onLock: () => void;
  theme: ThemeSettings;
  unreadCount: number;
  userProfile: UserProfile;
}

function AppIcon({ id, icon: Icon, label, onClick, theme, badge }: { id: string, icon: any, label: string, onClick?: () => void, theme: ThemeSettings, badge?: number }) {
  const customImage = theme.customIcons?.[id];

  return (
    <button onClick={onClick} className="flex flex-col items-center gap-1.5 group relative">
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
      {badge && badge > 0 ? (
        <div className="absolute -top-1.5 -right-1.5 bg-red-500 text-white text-[11px] font-bold w-5 h-5 rounded-full flex items-center justify-center border-2 border-white z-10 shadow-sm">
          {badge}
        </div>
      ) : null}
      <span className="text-[11px] font-medium text-neutral-800 drop-shadow-sm">{label}</span>
    </button>
  );
}

export function HomeScreen({ onNavigate, onLock, theme, unreadCount, userProfile }: Props) {
  const [time, setTime] = useState(new Date());
  const [currentPage, setCurrentPage] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit', hour12: false });
  };

  const formatDate = (date: Date) => {
    const options: Intl.DateTimeFormatOptions = { month: 'long', day: 'numeric', weekday: 'long' };
    return date.toLocaleDateString('zh-CN', options);
  };

  const getDaysTogether = () => {
    if (!userProfile.anniversaryDate) return 0;
    const start = new Date(userProfile.anniversaryDate).getTime();
    const now = new Date().getTime();
    const diff = now - start;
    return Math.max(0, Math.floor(diff / (1000 * 60 * 60 * 24)));
  };

  const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
    const scrollLeft = e.currentTarget.scrollLeft;
    const width = e.currentTarget.clientWidth;
    if (width === 0) return;
    const page = Math.round(scrollLeft / width);
    if (page !== currentPage) {
      setCurrentPage(page);
    }
  };

  return (
    <div className="w-full h-full pt-16 pb-6 flex flex-col overflow-hidden relative">
      {/* Scrollable Pages Container */}
      <div 
        className="flex-1 flex overflow-x-auto snap-x snap-mandatory no-scrollbar"
        onScroll={handleScroll}
      >
        {/* Page 1 */}
        <div className="min-w-full w-full h-full snap-center px-5 flex flex-col shrink-0 content-start gap-y-5">
          {/* Top Section - Time and Weather */}
          <div className="flex flex-col items-center justify-center py-1">
            <div className="text-[60px] font-medium text-white tracking-tight leading-none drop-shadow-md">
              {formatTime(time)}
            </div>
            <div className="text-[13px] text-white/90 mt-1.5 font-medium drop-shadow-sm">
              {formatDate(time)}
            </div>
            <div className="flex items-center gap-1.5 mt-2.5 text-white/90 bg-black/20 px-3 py-1 rounded-full backdrop-blur-sm">
              <Sun size={14} className="text-yellow-300" />
              <span className="text-[12px] font-medium">24°C 晴</span>
              <span className="text-[10px] opacity-80 ml-1">深圳市</span>
            </div>
          </div>

          {/* Widgets Row */}
          <div className="grid grid-cols-2 gap-4">
            {/* Anniversary Widget */}
            <div className="bg-white/60 backdrop-blur-xl rounded-[1.5rem] p-4 flex flex-col justify-center shadow-sm border border-white/50 relative overflow-hidden h-[130px]">
              <div className="absolute -right-4 -top-4 w-24 h-24 bg-pink-300/20 rounded-full blur-xl"></div>
              <div className="absolute -left-4 -bottom-4 w-24 h-24 bg-blue-300/20 rounded-full blur-xl"></div>
              
              <div className="relative z-10">
                <div className="flex items-center gap-2 mb-2">
                  <Heart size={16} className="fill-pink-400 text-pink-400 animate-pulse" />
                  <span className="text-[13px] text-neutral-600 font-medium">相恋</span>
                </div>
                <div className="flex items-baseline gap-1">
                  <span className="text-4xl font-bold text-neutral-800 tracking-tight">{getDaysTogether()}</span>
                  <span className="text-[14px] text-neutral-500 font-medium">天</span>
                </div>
                <div className="text-[11px] text-neutral-400 mt-2">
                  {userProfile.anniversaryDate ? `Since ${userProfile.anniversaryDate}` : '请在接口与人设中设置纪念日'}
                </div>
              </div>
            </div>

            {/* Image Widget */}
            <div className="h-[130px] rounded-[1.5rem] overflow-hidden shadow-sm border border-white/40">
              <img 
                src={theme.widgetImages?.bottomLeft || "https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&w=400&q=80"} 
                className="w-full h-full object-cover"
                alt="Portrait 2"
              />
            </div>
          </div>

          {/* Apps Row 1 */}
          <div className="grid grid-cols-4 gap-y-4 gap-x-2 place-items-center mt-2">
            <AppIcon id="chat" icon={MessageCircle} label="微信" onClick={() => onNavigate('chat')} theme={theme} badge={unreadCount} />
            <AppIcon id="persona" icon={Book} label="世界书" onClick={() => onNavigate('persona')} theme={theme} />
            <AppIcon id="music" icon={Music} label="音乐" onClick={() => onNavigate('music')} theme={theme} />
            <AppIcon id="xhs" icon={Hash} label="小红书" theme={theme} />
          </div>
        </div>

        {/* Page 2 */}
        <div className="min-w-full w-full h-full snap-center px-5 flex flex-col shrink-0 content-start pt-4">
          <div className="grid grid-cols-4 gap-y-4 gap-x-2 place-items-center">
            <AppIcon id="game" icon={HeartPulse} label="游戏" theme={theme} />
            <AppIcon id="mail" icon={Mail} label="信箱" theme={theme} />
            <AppIcon id="express" icon={Truck} label="快递" theme={theme} />
            <AppIcon id="taobao" icon={ShoppingBag} label="淘宝" theme={theme} />
            <AppIcon id="more" icon={MoreHorizontal} label="更多" theme={theme} />
          </div>
        </div>
      </div>

      {/* Pagination Indicators */}
      <div className="flex justify-center gap-2 my-3 shrink-0">
        <div className={`w-1.5 h-1.5 rounded-full transition-colors ${currentPage === 0 ? 'bg-white' : 'bg-white/40'}`} />
        <div className={`w-1.5 h-1.5 rounded-full transition-colors ${currentPage === 1 ? 'bg-white' : 'bg-white/40'}`} />
      </div>

      {/* Dock */}
      <div className="mt-auto h-[60px] mx-5 bg-white/50 backdrop-blur-2xl rounded-[2rem] flex items-center justify-around px-6 shadow-sm border border-white/40 shrink-0">
        <button onClick={() => onNavigate('api')} className="w-11 h-11 bg-black/20 rounded-full flex items-center justify-center text-white active:scale-95 transition-transform">
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
