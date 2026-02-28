import React, { useRef } from 'react';
import { ChevronLeft, Image as ImageIcon, Type, Palette, Lock, Grid } from 'lucide-react';
import { ThemeSettings } from '../types';
import localforage from 'localforage';

interface Props {
  theme: ThemeSettings;
  onSave: (theme: ThemeSettings) => void;
  onBack: () => void;
}

const ICON_KEYS = [
  { id: 'chat', label: '微信' },
  { id: 'persona', label: '世界书' },
  { id: 'music', label: '音乐' },
  { id: 'xhs', label: '小红书' },
  { id: 'game', label: '游戏' },
  { id: 'mail', label: '信箱' },
  { id: 'express', label: '驿站' },
  { id: 'more', label: '更多' },
];

export function ThemeSettingsScreen({ theme, onSave, onBack }: Props) {
  const wallpaperInputRef = useRef<HTMLInputElement>(null);
  const lockWallpaperInputRef = useRef<HTMLInputElement>(null);
  const momentsBgInputRef = useRef<HTMLInputElement>(null);
  const chatBgInputRef = useRef<HTMLInputElement>(null);
  const fontInputRef = useRef<HTMLInputElement>(null);
  const iconInputRef = useRef<HTMLInputElement>(null);
  const widgetTopRightInputRef = useRef<HTMLInputElement>(null);
  const widgetBottomLeftInputRef = useRef<HTMLInputElement>(null);
  const [activeIconId, setActiveIconId] = React.useState<string | null>(null);

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>, callback: (url: string) => void) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        if (event.target?.result) {
          callback(event.target.result as string);
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const handleFontChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      try {
        const url = URL.createObjectURL(file);
        onSave({ ...theme, fontUrl: url });
        await localforage.setItem('themeFontBlob', file);
      } catch (error) {
        console.error("Failed to save font", error);
        alert("保存字体失败");
      }
    }
  };

  const handleColorChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onSave({ ...theme, iconBgColor: e.target.value });
  };

  const triggerIconUpload = (id: string) => {
    setActiveIconId(id);
    iconInputRef.current?.click();
  };

  return (
    <div className="w-full h-full bg-neutral-50 flex flex-col pt-12">
      <div className="h-12 flex items-center justify-between px-2 bg-white border-b border-neutral-200 shrink-0">
        <button onClick={onBack} className="text-blue-500 p-2 active:opacity-70 flex items-center">
          <ChevronLeft size={24} />
          <span className="text-[15px] -ml-1">桌面</span>
        </button>
        <h1 className="font-semibold text-neutral-900 text-[15px]">主题设置</h1>
        <div className="w-16"></div>
      </div>

      <div className="flex-1 p-4 overflow-y-auto space-y-6 pb-12">
        
        {/* Wallpapers */}
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-3 min-w-0">
            <label className="text-[11px] font-medium text-neutral-500 ml-1 uppercase tracking-wide flex items-center gap-1.5">
              <Lock size={12} /> 锁屏壁纸
            </label>
            <div 
              className="w-full aspect-[9/16] bg-white border border-neutral-200 rounded-xl flex items-center justify-center cursor-pointer overflow-hidden relative shadow-sm"
              onClick={() => lockWallpaperInputRef.current?.click()}
            >
              {theme.lockScreenWallpaper ? (
                <img src={theme.lockScreenWallpaper} alt="Lock Wallpaper" className="w-full h-full object-cover" />
              ) : (
                <span className="text-neutral-400 text-xs text-center px-2">点击选择<br/>锁屏壁纸</span>
              )}
            </div>
            <input 
              type="file" accept="image/*" className="hidden" ref={lockWallpaperInputRef}
              onChange={(e) => handleImageUpload(e, (url) => onSave({ ...theme, lockScreenWallpaper: url }))}
            />
          </div>

          <div className="space-y-3 min-w-0">
            <label className="text-[11px] font-medium text-neutral-500 ml-1 uppercase tracking-wide flex items-center gap-1.5">
              <ImageIcon size={12} /> 桌面壁纸
            </label>
            <div 
              className="w-full aspect-[9/16] bg-white border border-neutral-200 rounded-xl flex items-center justify-center cursor-pointer overflow-hidden relative shadow-sm"
              onClick={() => wallpaperInputRef.current?.click()}
            >
              {theme.wallpaper ? (
                <img src={theme.wallpaper} alt="Wallpaper Preview" className="w-full h-full object-cover" />
              ) : (
                <span className="text-neutral-400 text-xs text-center px-2">点击选择<br/>桌面壁纸</span>
              )}
            </div>
            <input 
              type="file" accept="image/*" className="hidden" ref={wallpaperInputRef}
              onChange={(e) => handleImageUpload(e, (url) => onSave({ ...theme, wallpaper: url }))}
            />
          </div>

          {/* Moments Background */}
          <div className="space-y-3 col-span-2">
            <label className="text-[11px] font-medium text-neutral-500 ml-1 uppercase tracking-wide flex items-center gap-1.5">
              <ImageIcon size={12} /> 朋友圈背景图
            </label>
            <div 
              className="w-full h-32 bg-white border border-neutral-200 rounded-xl flex items-center justify-center cursor-pointer overflow-hidden relative shadow-sm"
              onClick={() => momentsBgInputRef.current?.click()}
            >
              {theme.momentsBg ? (
                <img src={theme.momentsBg} alt="Moments Background" className="w-full h-full object-cover" />
              ) : (
                <span className="text-neutral-400 text-xs text-center px-2">点击选择<br/>朋友圈背景</span>
              )}
            </div>
            <input 
              type="file" accept="image/*" className="hidden" ref={momentsBgInputRef}
              onChange={(e) => handleImageUpload(e, (url) => onSave({ ...theme, momentsBg: url }))}
            />
          </div>

          {/* Chat Background */}
          <div className="space-y-3 col-span-2 border-t border-neutral-200 pt-4 mt-2">
            <label className="text-[11px] font-medium text-neutral-500 ml-1 uppercase tracking-wide flex items-center gap-1.5">
              <ImageIcon size={12} /> 聊天背景图
            </label>
            <div 
              className="w-full h-32 bg-white border border-neutral-200 rounded-xl flex items-center justify-center cursor-pointer overflow-hidden relative shadow-sm"
              onClick={() => chatBgInputRef.current?.click()}
            >
              {theme.chatBg ? (
                <img src={theme.chatBg} alt="Chat Background" className="w-full h-full object-cover" />
              ) : (
                <span className="text-neutral-400 text-xs text-center px-2">点击选择<br/>聊天背景 (默认纯色)</span>
              )}
            </div>
            <input 
              type="file" accept="image/*" className="hidden" ref={chatBgInputRef}
              onChange={(e) => handleImageUpload(e, (url) => onSave({ ...theme, chatBg: url }))}
            />
          </div>

          {/* Desktop Widgets */}
          <div className="space-y-3 col-span-2 border-t border-neutral-200 pt-4 mt-2">
            <label className="text-[13px] font-medium text-neutral-500 ml-1 uppercase tracking-wide flex items-center gap-2">
              <Grid size={14} /> 桌面相框小组件
            </label>
            <div className="space-y-2">
              <span className="text-[11px] text-neutral-400 ml-1">自定义相框图片</span>
              <div 
                className="w-full aspect-[2/1] bg-white border border-neutral-200 rounded-xl flex items-center justify-center cursor-pointer overflow-hidden relative shadow-sm"
                onClick={() => widgetBottomLeftInputRef.current?.click()}
              >
                {theme.widgetImages?.bottomLeft ? (
                  <img src={theme.widgetImages.bottomLeft} alt="Desktop Widget" className="w-full h-full object-cover" />
                ) : (
                  <span className="text-neutral-400 text-xs text-center px-2">点击选择<br/>图片</span>
                )}
              </div>
              <input 
                type="file" accept="image/*" className="hidden" ref={widgetBottomLeftInputRef}
                onChange={(e) => handleImageUpload(e, (url) => onSave({ 
                  ...theme, 
                  widgetImages: { ...theme.widgetImages, bottomLeft: url } 
                }))}
              />
            </div>
          </div>
        </div>

        {/* Custom Icons */}
        <div className="space-y-3">
          <label className="text-[13px] font-medium text-neutral-500 ml-1 uppercase tracking-wide flex items-center gap-2">
            <Grid size={14} /> 自定义图标
          </label>
          <div className="bg-white border border-neutral-200 rounded-xl p-4 shadow-sm">
            <div className="grid grid-cols-4 gap-4">
              {ICON_KEYS.map((item) => (
                <div key={item.id} className="flex flex-col items-center gap-1.5">
                  <button 
                    onClick={() => triggerIconUpload(item.id)}
                    className="w-12 h-12 rounded-xl border border-neutral-200 flex items-center justify-center overflow-hidden bg-neutral-50 active:scale-95 transition-transform"
                  >
                    {theme.customIcons?.[item.id] ? (
                      <img src={theme.customIcons[item.id]} alt={item.label} className="w-full h-full object-cover" />
                    ) : (
                      <span className="text-[20px] text-neutral-300">+</span>
                    )}
                  </button>
                  <span className="text-[10px] text-neutral-500">{item.label}</span>
                </div>
              ))}
            </div>
          </div>
          <input 
            type="file" accept="image/*" className="hidden" ref={iconInputRef}
            onChange={(e) => {
              if (activeIconId) {
                handleImageUpload(e, (url) => {
                  onSave({
                    ...theme,
                    customIcons: { ...(theme.customIcons || {}), [activeIconId]: url }
                  });
                });
              }
            }}
          />
        </div>

        {/* Icon Background Color */}
        <div className="space-y-3">
          <label className="text-[13px] font-medium text-neutral-500 ml-1 uppercase tracking-wide flex items-center gap-2">
            <Palette size={14} /> 默认图标背景色
          </label>
          <div className="w-full bg-white border border-neutral-200 rounded-xl p-3 flex items-center justify-between shadow-sm">
            <span className="text-[15px] text-neutral-700">颜色</span>
            <div className="flex items-center gap-3">
              <span className="text-xs text-neutral-400 font-mono uppercase">{theme.iconBgColor}</span>
              <input 
                type="color" 
                value={theme.iconBgColor}
                onChange={handleColorChange}
                className="w-8 h-8 rounded-full border-0 p-0 cursor-pointer overflow-hidden"
              />
            </div>
          </div>
        </div>

        {/* Font */}
        <div className="space-y-3">
          <label className="text-[13px] font-medium text-neutral-500 ml-1 uppercase tracking-wide flex items-center gap-2">
            <Type size={14} /> 自定义字体
          </label>
          <button 
            onClick={() => fontInputRef.current?.click()}
            className="w-full bg-white border border-neutral-200 rounded-xl p-4 flex items-center justify-between shadow-sm active:bg-neutral-50"
          >
            <span className="text-[15px] text-neutral-700">选择字体文件 (.ttf, .woff)</span>
            <span className="text-blue-500 text-sm font-medium">浏览</span>
          </button>
          <input 
            type="file" 
            accept=".ttf,.otf,.woff,.woff2" 
            className="hidden" 
            ref={fontInputRef}
            onChange={handleFontChange}
          />
          {theme.fontUrl && (
            <p className="text-xs text-green-600 ml-1">✓ 已加载自定义字体</p>
          )}
        </div>

      </div>
    </div>
  );
}
