import React, { useState, useEffect, useRef } from 'react';
import { ChevronLeft, Search, Play, Pause, SkipBack, SkipForward, Music as MusicIcon, Share2, Compass, X } from 'lucide-react';
import { Song, UserProfile, Persona } from '../types';

interface Props {
  onBack: () => void;
  userProfile: UserProfile;
  personas: Persona[];
  onShareToChat: (song: Song, personaId: string) => void;
  onShareToMoments: (song: Song) => void;
}

const MOCK_SONGS: Song[] = [
  { 
    id: '1', 
    title: '晴天', 
    artist: '周杰伦', 
    cover: 'https://images.unsplash.com/photo-1614613535308-eb5fbd3d2c17?auto=format&fit=crop&w=400&q=80', 
    lyrics: '[00:00.00] 故事的小黄花\n[00:04.00] 从出生那年就飘着\n[00:08.00] 童年的荡秋千\n[00:12.00] 随记忆一直晃到现在\n[00:16.00] Re So So Si Do Si La\n[00:20.00] So La Si Si Si Si La Si La So' 
  },
  { 
    id: '2', 
    title: '孤勇者', 
    artist: '陈奕迅', 
    cover: 'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?auto=format&fit=crop&w=400&q=80', 
    lyrics: '[00:00.00] 都是勇敢的\n[00:04.00] 你额头的伤口 你的不同 你犯的错\n[00:08.00] 都不必隐藏\n[00:12.00] 你破旧的玩偶 你的面具 你的自我\n[00:16.00] 他们说 要带着光 驯服每一头怪兽\n[00:20.00] 他们说 要缝好你的伤 没有人爱小丑' 
  },
  { 
    id: '3', 
    title: '稻香', 
    artist: '周杰伦', 
    cover: 'https://images.unsplash.com/photo-1493225457124-a1a2a5956093?auto=format&fit=crop&w=400&q=80', 
    lyrics: '[00:00.00] 对这个世界如果你有太多的抱怨\n[00:04.00] 跌倒了就不敢继续往前走\n[00:08.00] 为什么人要这么的脆弱 堕落\n[00:12.00] 请你打开电视看看\n[00:16.00] 多少人为生命在努力勇敢的走下去\n[00:20.00] 我们是不是该知足' 
  },
  { 
    id: '4', 
    title: '后来', 
    artist: '刘若英', 
    cover: 'https://images.unsplash.com/photo-1459749411175-04bf5292ceea?auto=format&fit=crop&w=400&q=80', 
    lyrics: '[00:00.00] 后来\n[00:04.00] 我总算学会了 如何去爱\n[00:08.00] 可惜你 早已远去\n[00:12.00] 消失在人海\n[00:16.00] 后来\n[00:20.00] 终于在眼泪中明白\n[00:24.00] 有些人 一旦错过就不再' 
  }
];

export function MusicScreen({ onBack, userProfile, personas, onShareToChat, onShareToMoments }: Props) {
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [currentSong, setCurrentSong] = useState(MOCK_SONGS[0]);
  const [isPlaying, setIsPlaying] = useState(false);
  const [progress, setProgress] = useState(0); // 0 to 100
  const [showLyrics, setShowLyrics] = useState(false);
  const [listenSeconds, setListenSeconds] = useState(0);
  const [showShare, setShowShare] = useState(false);

  // Simulate music playing progress
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isPlaying) {
      interval = setInterval(() => {
        setProgress(prev => {
          if (prev >= 100) {
            setIsPlaying(false);
            return 0;
          }
          return prev + 0.5; // Increment progress
        });
        setListenSeconds(s => s + 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [isPlaying]);

  const handlePlayPause = () => {
    setIsPlaying(!isPlaying);
  };

  const handleNext = () => {
    const currentIndex = MOCK_SONGS.findIndex(s => s.id === currentSong.id);
    const nextIndex = (currentIndex + 1) % MOCK_SONGS.length;
    setCurrentSong(MOCK_SONGS[nextIndex]);
    setProgress(0);
    setIsPlaying(true);
  };

  const handlePrev = () => {
    const currentIndex = MOCK_SONGS.findIndex(s => s.id === currentSong.id);
    const prevIndex = (currentIndex - 1 + MOCK_SONGS.length) % MOCK_SONGS.length;
    setCurrentSong(MOCK_SONGS[prevIndex]);
    setProgress(0);
    setIsPlaying(true);
  };

  const handleSelectSong = (song: typeof MOCK_SONGS[0]) => {
    setCurrentSong(song);
    setProgress(0);
    setIsPlaying(true);
    setIsSearching(false);
    setSearchQuery('');
  };

  const filteredSongs = MOCK_SONGS.filter(song => 
    song.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
    song.artist.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const formatListenTime = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  const defaultUserAvatar = 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=100&q=80';
  const defaultAiAvatar = 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=100&q=80';

  return (
    <div className="w-full h-full bg-neutral-900 flex flex-col text-white pt-12 relative overflow-hidden">
      
      {/* Blurred Background */}
      <div 
        className="absolute inset-0 bg-cover bg-center opacity-40 blur-3xl scale-110 transition-all duration-1000" 
        style={{ backgroundImage: `url(${currentSong.cover})` }} 
      />
      <div className="absolute inset-0 bg-black/40" />

      {/* Header */}
      <div className="h-14 flex items-center px-2 shrink-0 z-10 relative">
        <button onClick={onBack} className="text-white p-2 active:opacity-70 flex items-center">
          <ChevronLeft size={28} />
        </button>
        
        {isSearching ? (
          <div className="flex-1 flex items-center bg-white/10 rounded-full px-3 py-1.5 mx-2">
            <Search size={16} className="text-neutral-300" />
            <input 
              type="text" 
              placeholder="搜索热门歌曲..." 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="bg-transparent border-none outline-none text-[14px] text-white ml-2 w-full placeholder-neutral-400"
              autoFocus
            />
            {searchQuery && (
              <button onClick={() => setSearchQuery('')} className="p-1">
                <X size={14} className="text-neutral-400" />
              </button>
            )}
          </div>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center overflow-hidden px-2">
            <h2 className="text-[16px] font-medium truncate w-full text-center">{currentSong.title}</h2>
            <p className="text-[12px] text-neutral-300 truncate w-full text-center">{currentSong.artist}</p>
          </div>
        )}

        {isSearching ? (
          <button onClick={() => setIsSearching(false)} className="text-[15px] text-white p-2 active:opacity-70">
            取消
          </button>
        ) : (
          <div className="flex items-center">
            <button onClick={() => setIsSearching(true)} className="text-white p-2 active:opacity-70">
              <Search size={22} />
            </button>
            <button onClick={() => setShowShare(true)} className="text-white p-2 active:opacity-70">
              <Share2 size={22} />
            </button>
          </div>
        )}
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col relative z-10 overflow-hidden">
        
        {/* Search Results */}
        {isSearching ? (
          <div className="flex-1 overflow-y-auto p-4 space-y-2 bg-neutral-900/80 backdrop-blur-md">
            {filteredSongs.length > 0 ? filteredSongs.map(song => (
              <div 
                key={song.id} 
                onClick={() => handleSelectSong(song)}
                className="flex items-center gap-3 p-2 rounded-lg active:bg-white/10 cursor-pointer"
              >
                <img src={song.cover} alt={song.title} className="w-12 h-12 rounded-md object-cover" />
                <div className="flex-1">
                  <div className="text-[15px] font-medium">{song.title}</div>
                  <div className="text-[12px] text-neutral-400">{song.artist}</div>
                </div>
                {currentSong.id === song.id && isPlaying && (
                  <MusicIcon size={16} className="text-green-400 animate-pulse" />
                )}
              </div>
            )) : (
              <div className="text-center text-neutral-500 mt-10 text-[14px]">没有找到相关音乐</div>
            )}
          </div>
        ) : (
          /* Player View */
          <div className="flex-1 flex flex-col">
            
            {/* Listen Together UI - Top */}
            <div className="w-full pt-6 flex flex-col items-center justify-center gap-2 shrink-0">
              <div className="flex -space-x-2">
                <img src={userProfile.avatarUrl || defaultUserAvatar} className="w-7 h-7 rounded-full border border-neutral-900 object-cover z-10" alt="User" />
                <img src={personas[0]?.avatarUrl || defaultAiAvatar} className="w-7 h-7 rounded-full border border-neutral-900 object-cover" alt="AI" />
              </div>
              <span className="text-[11px] text-neutral-300 font-medium">
                一起听 {formatListenTime(listenSeconds)}
              </span>
            </div>

            {/* Vinyl Record Area */}
            <div className="flex-1 relative flex items-center justify-center" onClick={() => setShowLyrics(!showLyrics)}>
              {showLyrics ? (
                <div className="absolute inset-0 px-8 py-4 overflow-y-auto">
                  <div className="space-y-6 text-center pb-8">
                    {currentSong.lyrics.split('\n').map((line, i) => {
                      const text = line.replace(/\[.*?\]/, '').trim();
                      return text ? (
                        <p key={i} className={`text-[15px] transition-colors duration-300 ${i === Math.floor((progress / 100) * 6) ? 'text-white font-medium scale-105' : 'text-neutral-400'}`}>
                          {text}
                        </p>
                      ) : null;
                    })}
                  </div>
                </div>
              ) : (
                <div className="relative w-[280px] h-[280px] flex items-center justify-center">
                  {/* Vinyl Disc Background */}
                  <div className={`absolute inset-0 rounded-full bg-black border-4 border-white/10 shadow-2xl flex items-center justify-center ${isPlaying ? 'animate-[spin_20s_linear_infinite]' : ''}`}>
                    {/* Album Art inside Vinyl */}
                    <img src={currentSong.cover} alt="Album Art" className="w-[180px] h-[180px] rounded-full object-cover" />
                  </div>
                </div>
              )}
            </div>

            {/* Bottom Controls */}
            <div className="w-full pb-8 px-6 flex flex-col gap-6 shrink-0">
              {/* Progress Bar */}
              <div className="w-full flex items-center gap-3">
                <span className="text-[10px] text-neutral-400 font-mono w-8 text-right">0:{(progress * 0.6).toFixed(0).padStart(2, '0')}</span>
                <div className="flex-1 h-1 bg-white/20 rounded-full relative">
                  <div 
                    className="absolute top-0 left-0 h-full bg-white rounded-full transition-all duration-1000 ease-linear"
                    style={{ width: `${progress}%` }}
                  >
                    <div className="absolute right-0 top-1/2 -translate-y-1/2 w-2 h-2 bg-white rounded-full shadow" />
                  </div>
                </div>
                <span className="text-[10px] text-neutral-400 font-mono w-8">3:20</span>
              </div>

              {/* Play Controls */}
              <div className="flex items-center justify-center gap-8">
                <button onClick={handlePrev} className="text-white active:scale-90 transition-transform">
                  <SkipBack size={28} className="fill-current" />
                </button>
                <button 
                  onClick={handlePlayPause} 
                  className="w-16 h-16 border-2 border-white rounded-full flex items-center justify-center text-white active:bg-white/10 transition-colors"
                >
                  {isPlaying ? <Pause size={28} className="fill-current" /> : <Play size={28} className="fill-current ml-1" />}
                </button>
                <button onClick={handleNext} className="text-white active:scale-90 transition-transform">
                  <SkipForward size={28} className="fill-current" />
                </button>
              </div>
            </div>

          </div>
        )}
      </div>

      {/* Share Modal */}
      {showShare && (
        <div className="absolute inset-0 bg-black/60 z-50 flex flex-col justify-end" onClick={() => setShowShare(false)}>
          <div className="bg-neutral-800 rounded-t-2xl p-6 pb-10" onClick={e => e.stopPropagation()}>
            <h3 className="text-white text-[15px] font-medium mb-6 text-center">分享歌曲</h3>
            <div className="flex gap-6 overflow-x-auto pb-2">
              {personas.map(p => (
                <button 
                  key={p.id} 
                  onClick={() => { onShareToChat(currentSong, p.id); setShowShare(false); }} 
                  className="flex flex-col items-center gap-2 shrink-0 w-16"
                >
                  <img src={p.avatarUrl || defaultAiAvatar} className="w-12 h-12 rounded-xl object-cover" alt="avatar" />
                  <span className="text-[11px] text-neutral-300 truncate w-full text-center">{p.name}</span>
                </button>
              ))}
              <button 
                onClick={() => { onShareToMoments(currentSong); setShowShare(false); }} 
                className="flex flex-col items-center gap-2 shrink-0 w-16"
              >
                <div className="w-12 h-12 rounded-xl bg-neutral-700 flex items-center justify-center text-white">
                  <Compass size={24} />
                </div>
                <span className="text-[11px] text-neutral-300 truncate w-full text-center">朋友圈</span>
              </button>
            </div>
            <button 
              onClick={() => setShowShare(false)}
              className="w-full mt-6 py-3 bg-neutral-700 text-white rounded-xl text-[15px] font-medium active:bg-neutral-600"
            >
              取消
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
