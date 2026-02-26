import React, { useState } from 'react';
import { Phone } from './components/Phone';
import { HomeScreen } from './components/HomeScreen';
import { PersonaScreen } from './components/PersonaScreen';
import { ApiSettingsScreen } from './components/ApiSettingsScreen';
import { ChatScreen } from './components/ChatScreen';
import { LockScreen } from './components/LockScreen';
import { ThemeSettingsScreen } from './components/ThemeSettingsScreen';
import { Screen, Persona, ApiSettings, ThemeSettings } from './types';
import { AnimatePresence, motion } from 'motion/react';

export default function App() {
  const [isLocked, setIsLocked] = useState(true);
  const [currentScreen, setCurrentScreen] = useState<Screen>('home');
  const [persona, setPersona] = useState<Persona>({
    name: '猫娘',
    instructions: '你是一只可爱的猫娘，说话句尾要带“喵~”。你很粘人，喜欢撒娇。',
  });
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

  const handleHomeClick = () => {
    if (!isLocked) {
      setCurrentScreen('home');
    }
  };

  return (
    <Phone onHomeClick={handleHomeClick} theme={theme}>
      <AnimatePresence mode="wait">
        {isLocked ? (
          <LockScreen key="lock" onUnlock={() => setIsLocked(false)} theme={theme} />
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
                    persona={persona} 
                    onSave={setPersona} 
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
                    onSave={setApiSettings} 
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

              {currentScreen === 'chat' && (
                <motion.div
                  key="chat"
                  initial={{ opacity: 0, x: '100%' }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: '100%' }}
                  transition={{ duration: 0.3, type: 'spring', bounce: 0 }}
                  className="w-full h-full absolute inset-0 z-20 bg-white"
                >
                  <ChatScreen 
                    persona={persona} 
                    apiSettings={apiSettings}
                    theme={theme}
                    onBack={() => setCurrentScreen('home')} 
                  />
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        )}
      </AnimatePresence>
    </Phone>
  );
}
