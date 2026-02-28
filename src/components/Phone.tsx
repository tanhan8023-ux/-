import React, { useState, useEffect } from 'react';
import { Wifi, Signal, Zap } from 'lucide-react';
import { ThemeSettings } from '../types';

export function Phone({ children, onHomeClick, theme }: { children: React.ReactNode, onHomeClick: () => void, theme: ThemeSettings }) {
  const [battery, setBattery] = useState(100);
  const [isCharging, setIsCharging] = useState(false);
  const [time, setTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => {
      setBattery(b => {
        if (isCharging) return Math.min(100, b + 1);
        return Math.max(0, b - 1);
      });
    }, 3000); // Fast update for demo purposes
    return () => clearInterval(timer);
  }, [isCharging]);

  useEffect(() => {
    const timeTimer = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(timeTimer);
  }, []);

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit', hour12: false });
  };

  return (
    <div className="flex items-center justify-center min-h-[100dvh] bg-black sm:bg-neutral-900 sm:p-4 font-sans overflow-hidden">
      {theme.fontUrl && (
        <style>
          {`
            @font-face {
              font-family: 'CustomThemeFont';
              src: url('${theme.fontUrl}');
            }
            .theme-font {
              font-family: 'CustomThemeFont', sans-serif !important;
            }
          `}
        </style>
      )}
      
      {/* Phone Casing */}
      <div className="relative w-full h-[100dvh] sm:w-[393px] sm:h-[852px] bg-black sm:rounded-[50px] sm:shadow-2xl sm:border-[8px] border-neutral-800 flex flex-col shrink-0 overflow-hidden theme-font">
        
        {/* Background Image */}
        <div className="absolute inset-0 z-0 bg-neutral-100">
          {theme.wallpaper ? (
            <img 
              src={theme.wallpaper} 
              alt="Background" 
              className="w-full h-full object-cover opacity-90"
              referrerPolicy="no-referrer"
            />
          ) : (
            <img 
              src="https://images.unsplash.com/photo-1491002052546-bf38f186af56?auto=format&fit=crop&w=800&q=80" 
              alt="Snowy Background" 
              className="w-full h-full object-cover opacity-90"
              referrerPolicy="no-referrer"
            />
          )}
        </div>

        {/* Status Bar */}
        <div className="absolute top-0 w-full h-14 flex items-center justify-between px-6 z-50 text-neutral-800 text-xs font-bold pointer-events-none mix-blend-difference text-white pt-2">
          <span className="drop-shadow-md text-[13px]">{formatTime(time)}</span>
          
          {/* Dynamic Island / Notch */}
          <div className="absolute top-2 left-1/2 -translate-x-1/2 w-32 h-8 bg-black rounded-full z-50 pointer-events-auto"></div>
          
          <div className="flex items-center gap-1.5 drop-shadow-md">
            <span className="text-[10px] mr-1">VPN</span>
            <Signal size={14} strokeWidth={2.5} />
            <Wifi size={14} strokeWidth={2.5} />
            
            {/* Dynamic Battery */}
            <div 
              className="flex items-center gap-1 ml-1 cursor-pointer pointer-events-auto"
              onClick={() => setIsCharging(!isCharging)}
              title="Click to toggle charging"
            >
              <span className="text-[11px]">{battery}</span>
              <div className="relative w-6 h-3 border border-white rounded-[4px] p-[1px] flex items-center">
                <div 
                  className={`h-full rounded-[1px] transition-all duration-500 ${isCharging ? 'bg-[#34C759]' : battery <= 20 ? 'bg-red-500' : 'bg-white'}`} 
                  style={{ width: `${battery}%` }}
                ></div>
                <div className="absolute -right-[3px] top-1/2 -translate-y-1/2 w-[2px] h-1.5 bg-white rounded-r-sm opacity-80"></div>
                {isCharging && <Zap size={10} className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 text-white fill-white drop-shadow-sm" />}
              </div>
            </div>
          </div>
        </div>

        {/* Screen Content */}
        <div className="flex-1 relative z-10 overflow-hidden flex flex-col">
          {children}
        </div>

        {/* Home Indicator (Bottom Bar) */}
        <div className="absolute bottom-2 left-1/2 -translate-x-1/2 w-1/3 h-1.5 bg-neutral-800/50 backdrop-blur-sm rounded-full z-50 cursor-pointer pb-2" onClick={onHomeClick}></div>
      </div>
    </div>
  );
}
