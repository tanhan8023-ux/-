import React, { useState, useEffect, useRef } from 'react';
import localforage from 'localforage';
import { Phone } from './components/Phone';
import { HomeScreen } from './components/HomeScreen';
import { PersonaScreen } from './components/PersonaScreen';
import { ApiSettingsScreen } from './components/ApiSettingsScreen';
import { ChatScreen } from './components/ChatScreen';
import { LockScreen } from './components/LockScreen';
import { ThemeSettingsScreen } from './components/ThemeSettingsScreen';
import { MusicScreen } from './components/MusicScreen';
import { Screen, Persona, UserProfile, ApiSettings, ThemeSettings, Message, Moment, Song, WorldbookSettings } from './types';
import { AnimatePresence, motion } from 'motion/react';

export default function App() {
  const [isReady, setIsReady] = useState(false);
  const [isLocked, setIsLocked] = useState(true);
  const [currentScreen, setCurrentScreen] = useState<Screen>('home');
  
  const [userProfile, setUserProfile] = useState<UserProfile>({
    name: '我',
    avatarUrl: '',
    anniversaryDate: ''
  });

  const [personas, setPersonas] = useState<Persona[]>([{
    id: 'p1',
    name: '猫娘',
    instructions: '你是一只可爱的猫娘，说话句尾要带“喵~”。你很粘人，喜欢撒娇。',
    prompt: '请保持猫娘的语气，每次回复不要超过50个字。',
  }]);

  const [apiSettings, setApiSettings] = useState<ApiSettings>({
    apiUrl: '',
    apiKey: '',
    model: 'gemini-3-flash-preview',
    temperature: 0.85,
  });

  const [theme, setTheme] = useState<ThemeSettings>({
    wallpaper: '',
    lockScreenWallpaper: '',
    momentsBg: '',
    iconBgColor: 'rgba(255, 255, 255, 0.9)',
    fontUrl: '',
    customIcons: {},
  });

  const [worldbook, setWorldbook] = useState<WorldbookSettings>({
    jailbreakPrompt: '',
    globalPrompt: ''
  });

  // Lifted State
  const [messages, setMessages] = useState<Message[]>([]);
  const [moments, setMoments] = useState<Moment[]>([{
    id: 'm1',
    authorId: 'p1',
    text: '今天天气真好呀，想和你一起去散步~ 🐾 记得多穿点衣服哦！',
    timestamp: '1小时前',
    likedByIds: ['user'],
    comments: []
  }]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [notification, setNotification] = useState<{title: string, body: string, personaId?: string} | null>(null);
  const [currentChatId, setCurrentChatId] = useState<string | null>(null);

  // Initialization
  useEffect(() => {
    const loadAll = async () => {
      try {
        const migrate = async (key: string, setter: any) => {
          let val = await localforage.getItem(key);
          if (!val) {
            const lsVal = localStorage.getItem(key);
            if (lsVal) {
              try {
                val = JSON.parse(lsVal);
                await localforage.setItem(key, val);
              } catch (e) {}
            }
          }
          if (val) setter(val);
        };

        await Promise.all([
          migrate('userProfile', setUserProfile),
          migrate('personas', setPersonas),
          migrate('apiSettings', setApiSettings),
          migrate('worldbook', setWorldbook),
          migrate('messages', setMessages),
          migrate('moments', setMoments),
        ]);

        // Handle theme separately to load font blob
        let themeVal = await localforage.getItem<ThemeSettings>('theme');
        if (!themeVal) {
          const lsVal = localStorage.getItem('theme');
          if (lsVal) {
            try {
              themeVal = JSON.parse(lsVal);
              await localforage.setItem('theme', themeVal);
            } catch (e) {}
          }
        }
        if (themeVal) {
          try {
            const fontBlob = await localforage.getItem<Blob>('themeFontBlob');
            if (fontBlob) {
              themeVal.fontUrl = URL.createObjectURL(fontBlob);
            }
          } catch (e) {
            console.error("Failed to load font blob", e);
          }
          setTheme(themeVal);
        }
      } catch (e) {
        console.error("Failed to load state", e);
      } finally {
        setIsReady(true);
      }
    };
    loadAll();
  }, []);

  // Persistence Effects
  const saveState = async (key: string, value: any) => {
    if (!isReady) return;
    try {
      await localforage.setItem(key, value);
    } catch (e) {
      console.error(`Failed to save ${key} to localforage:`, e);
      alert(`保存失败：${key} 数据过大，超出了浏览器存储限制。`);
    }
  };

  useEffect(() => { saveState('userProfile', userProfile); }, [userProfile, isReady]);
  useEffect(() => { saveState('personas', personas); }, [personas, isReady]);
  useEffect(() => { saveState('apiSettings', apiSettings); }, [apiSettings, isReady]);
  useEffect(() => { saveState('theme', theme); }, [theme, isReady]);
  useEffect(() => { saveState('worldbook', worldbook); }, [worldbook, isReady]);
  useEffect(() => { saveState('messages', messages); }, [messages, isReady]);
  useEffect(() => { saveState('moments', moments); }, [moments, isReady]);

  const prevMessagesLength = useRef(messages.length);
  const notificationTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (messages.length > prevMessagesLength.current) {
      const newMessages = messages.slice(prevMessagesLength.current);
      const newAiMessages = newMessages.filter(m => m.role === 'model');
      
      if (newAiMessages.length > 0) {
        const lastMsg = newAiMessages[newAiMessages.length - 1];
        if (currentScreen !== 'chat' || isLocked || currentChatId !== lastMsg.personaId) {
          setUnreadCount(prev => prev + newAiMessages.length);
          setNotification({ 
            title: personas.find(p => p.id === lastMsg.personaId)?.name || 'AI', 
            body: lastMsg.text,
            personaId: lastMsg.personaId
          });
          
          if (notificationTimeoutRef.current) {
            clearTimeout(notificationTimeoutRef.current);
          }
          notificationTimeoutRef.current = setTimeout(() => setNotification(null), 4000);
        }
      }
    }
    prevMessagesLength.current = messages.length;
  }, [messages, currentScreen, isLocked, personas]);

  // Background message simulator
  useEffect(() => {
    const timer = setTimeout(() => {
      if (messages.length === 0 && personas.length > 0) {
        const firstPersona = personas[0];
        const msgText = `主人，你在干嘛呀？快来陪我聊天喵~`;
        const newMsg: Message = { id: Date.now().toString(), personaId: firstPersona.id, role: 'model', text: msgText };
        setMessages(prev => [...prev, newMsg]);
      }
    }, 12000); // 12 seconds after load
    return () => clearTimeout(timer);
  }, [messages.length, personas]);

  const handleHomeClick = () => {
    if (!isLocked) {
      setCurrentScreen('home');
    }
  };

  const handleShareMusicToChat = (song: Song, personaId: string) => {
    const newMsg: Message = {
      id: Date.now().toString(),
      personaId,
      role: 'user',
      text: `分享了歌曲: ${song.title}`,
      msgType: 'music',
      song
    };
    setMessages(prev => [...prev, newMsg]);
    setCurrentScreen('chat');
    
    // Simulate AI response
    setTimeout(() => {
      const aiMsg: Message = {
        id: (Date.now() + 1).toString(),
        personaId,
        role: 'model',
        text: `这首歌很好听呢！我也喜欢 ${song.artist} 的歌~ 🎵`,
        msgType: 'text'
      };
      setMessages(prev => [...prev, aiMsg]);
    }, 2000);
  };

  const handleShareMusicToMoments = (song: Song) => {
    const newMoment: Moment = {
      id: Date.now().toString(),
      authorId: 'user',
      text: `分享了一首好听的歌 🎵`,
      timestamp: '刚刚',
      likedByIds: [],
      comments: [],
      song
    };
    setMoments(prev => [newMoment, ...prev]);
    setCurrentScreen('chat'); // User can navigate to moments from chat screen
  };

  if (!isReady) {
    return <div className="w-full h-[100dvh] bg-black flex items-center justify-center text-white">Loading...</div>;
  }

  return (
    <Phone onHomeClick={handleHomeClick} theme={theme}>
      {/* Notification Banner */}
      <AnimatePresence>
        {notification && !isLocked && (
          <motion.div
            initial={{ opacity: 0, y: -50, scale: 0.95 }}
            animate={{ opacity: 1, y: 16, scale: 1 }}
            exit={{ opacity: 0, y: -50, scale: 0.95 }}
            className="absolute top-0 left-4 right-4 bg-white/80 backdrop-blur-xl rounded-2xl p-3 shadow-lg z-[100] flex items-center gap-3 cursor-pointer border border-white/50"
            onClick={() => {
              if (notification.personaId) {
                setCurrentChatId(notification.personaId);
              }
              setNotification(null);
              setIsLocked(false);
              setCurrentScreen('chat');
            }}
          >
            <img src={personas.find(p => p.id === notification.personaId)?.avatarUrl || personas[0]?.avatarUrl || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=100&q=80'} className="w-10 h-10 rounded-xl object-cover shrink-0" alt="avatar" />
            <div className="flex-1 overflow-hidden">
              <div className="flex justify-between items-center">
                <span className="font-semibold text-[13px] text-neutral-900">{notification.title}</span>
                <span className="text-[10px] text-neutral-500">现在</span>
              </div>
              <p className="text-[12px] text-neutral-600 truncate mt-0.5">{notification.body}</p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence mode="wait">
        {isLocked ? (
          <LockScreen key="lock" onUnlock={() => setIsLocked(false)} theme={theme} notification={notification} personas={personas} />
        ) : (
          <motion.div
            key="unlocked"
            initial={{ opacity: 0, scale: 1.05 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.4, ease: "easeOut" }}
            className="w-full h-full absolute inset-0"
          >
            <AnimatePresence mode="wait">
              {currentScreen === 'home' && (
                <motion.div
                  key="home"
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  transition={{ duration: 0.2 }}
                  className="w-full h-full absolute inset-0"
                >
                  <HomeScreen 
                    onNavigate={setCurrentScreen} 
                    onLock={() => setIsLocked(true)}
                    theme={theme} 
                    unreadCount={unreadCount}
                    userProfile={userProfile}
                  />
                </motion.div>
              )}
              
              {currentScreen === 'persona' && (
                <motion.div
                  key="persona"
                  initial={{ opacity: 0, x: '100%' }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: '100%' }}
                  transition={{ duration: 0.3, type: 'spring', bounce: 0 }}
                  className="w-full h-full absolute inset-0 z-20 bg-white"
                >
                  <PersonaScreen 
                    worldbook={worldbook}
                    personas={personas}
                    onSave={(newWorldbook, newPersonas) => {
                      setWorldbook(newWorldbook);
                      setPersonas(newPersonas);
                    }} 
                    onBack={() => setCurrentScreen('home')} 
                  />
                </motion.div>
              )}

              {currentScreen === 'api' && (
                <motion.div
                  key="api"
                  initial={{ opacity: 0, x: '100%' }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: '100%' }}
                  transition={{ duration: 0.3, type: 'spring', bounce: 0 }}
                  className="w-full h-full absolute inset-0 z-20 bg-white"
                >
                  <ApiSettingsScreen 
                    settings={apiSettings} 
                    personas={personas}
                    userProfile={userProfile}
                    onSave={(newSettings, newPersonas, newUserProfile) => {
                      setApiSettings(newSettings);
                      setPersonas(newPersonas);
                      setUserProfile(newUserProfile);
                    }} 
                    onBack={() => setCurrentScreen('home')} 
                  />
                </motion.div>
              )}

              {currentScreen === 'theme' && (
                <motion.div
                  key="theme"
                  initial={{ opacity: 0, x: '100%' }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: '100%' }}
                  transition={{ duration: 0.3, type: 'spring', bounce: 0 }}
                  className="w-full h-full absolute inset-0 z-20 bg-white"
                >
                  <ThemeSettingsScreen 
                    theme={theme} 
                    onSave={setTheme} 
                    onBack={() => setCurrentScreen('home')} 
                  />
                </motion.div>
              )}

              {currentScreen === 'music' && (
                <motion.div
                  key="music"
                  initial={{ opacity: 0, y: '100%' }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: '100%' }}
                  transition={{ duration: 0.3, type: 'spring', bounce: 0 }}
                  className="w-full h-full absolute inset-0 z-20 bg-neutral-900"
                >
                  <MusicScreen 
                    onBack={() => setCurrentScreen('home')} 
                    userProfile={userProfile}
                    personas={personas}
                    onShareToChat={handleShareMusicToChat}
                    onShareToMoments={handleShareMusicToMoments}
                  />
                </motion.div>
              )}
            </AnimatePresence>

            <motion.div
              initial={false}
              animate={{ 
                x: currentScreen === 'chat' ? 0 : '100%',
                opacity: currentScreen === 'chat' ? 1 : 0
              }}
              transition={{ duration: 0.3, type: 'spring', bounce: 0 }}
              className={`w-full h-full absolute inset-0 z-20 bg-white ${currentScreen === 'chat' ? 'pointer-events-auto' : 'pointer-events-none'}`}
            >
              <ChatScreen 
                isActive={currentScreen === 'chat'}
                unreadCount={unreadCount}
                currentChatId={currentChatId}
                setCurrentChatId={setCurrentChatId}
                personas={personas} 
                setPersonas={setPersonas}
                userProfile={userProfile}
                apiSettings={apiSettings}
                theme={theme}
                worldbook={worldbook}
                messages={messages}
                setMessages={setMessages}
                moments={moments}
                setMoments={setMoments}
                onClearUnread={() => setUnreadCount(0)}
                onBack={() => setCurrentScreen('home')} 
              />
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </Phone>
  );
}
