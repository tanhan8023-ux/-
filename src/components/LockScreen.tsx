import React from 'react';
import { Lock, ChevronUp } from 'lucide-react';
import { motion } from 'motion/react';
import { ThemeSettings } from '../types';

interface Props {
  onUnlock: () => void;
  theme: ThemeSettings;
  key?: string;
}

export function LockScreen({ onUnlock, theme }: Props) {
  return (
    <motion.div 
      className="absolute inset-0 z-40 flex flex-col items-center pt-20 pb-8 text-neutral-800 cursor-pointer overflow-hidden"
      onClick={onUnlock}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ y: '-100%', opacity: 0 }}
      transition={{ duration: 0.4, ease: "easeInOut" }}
    >
      {/* Background Image */}
      <div className="absolute inset-0 z-[-1] bg-neutral-100">
        {theme.lockScreenWallpaper ? (
          <img 
            src={theme.lockScreenWallpaper} 
            alt="Lock Screen Background" 
            className="w-full h-full object-cover opacity-90"
          />
        ) : theme.wallpaper ? (
          <img 
            src={theme.wallpaper} 
            alt="Background" 
            className="w-full h-full object-cover opacity-90 blur-sm"
          />
        ) : (
          <img 
            src="https://images.unsplash.com/photo-1491002052546-bf38f186af56?auto=format&fit=crop&w=800&q=80" 
            alt="Snowy Background" 
            className="w-full h-full object-cover opacity-90 blur-sm"
          />
        )}
      </div>

      <Lock size={20} className="mb-2 text-neutral-700 mix-blend-difference text-white" />
      <h1 className="text-7xl font-light tracking-tight text-neutral-800 drop-shadow-sm mix-blend-difference text-white">22:33</h1>
      <p className="text-lg mt-1 font-medium text-neutral-700 drop-shadow-sm mix-blend-difference text-white">12月25日 星期四</p>
      
      <div className="mt-auto flex flex-col items-center animate-bounce text-neutral-600 mix-blend-difference text-white">
        <ChevronUp size={24} />
        <span className="text-xs font-medium tracking-widest mt-1">向上滑动解锁</span>
      </div>
    </motion.div>
  );
}
