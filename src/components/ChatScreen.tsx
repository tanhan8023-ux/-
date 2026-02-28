import React, { useState, useRef, useEffect } from 'react';
import { ChevronLeft, Loader2, Plus, ArrowLeftRight, MessageCircle, Compass, Bookmark, Image as ImageIcon, MoreHorizontal, MessageSquare, Heart, Camera, UserPlus, Trash2, Ban, Users, Play, RefreshCw, Wallet } from 'lucide-react';
import { Message, Persona, UserProfile, ApiSettings, ThemeSettings, Moment, Comment, WorldbookSettings } from '../types';
import { GoogleGenAI } from '@google/genai';

interface Props {
  personas: Persona[];
  setPersonas: React.Dispatch<React.SetStateAction<Persona[]>>;
  userProfile: UserProfile;
  apiSettings: ApiSettings;
  theme: ThemeSettings;
  worldbook: WorldbookSettings;
  messages: Message[];
  setMessages: React.Dispatch<React.SetStateAction<Message[]>>;
  moments: Moment[];
  setMoments: React.Dispatch<React.SetStateAction<Moment[]>>;
  onClearUnread: () => void;
  onBack: () => void;
  isActive: boolean;
  unreadCount: number;
  currentChatId: string | null;
  setCurrentChatId: (id: string | null) => void;
}

export function ChatScreen({ personas, setPersonas, userProfile, apiSettings, theme, worldbook, messages, setMessages, moments, setMoments, onClearUnread, onBack, isActive, unreadCount, currentChatId, setCurrentChatId }: Props) {
  const [activeTab, setActiveTab] = useState<'chat' | 'contacts' | 'moments' | 'favorites'>('chat');
  
  // Chat View State
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const [showPlusMenu, setShowPlusMenu] = useState(false);
  const [showChatSettings, setShowChatSettings] = useState(false);
  const [activeMessageMenu, setActiveMessageMenu] = useState<string | null>(null);
  
  // Transfer State
  const [showTransferModal, setShowTransferModal] = useState(false);
  const [transferAmount, setTransferAmount] = useState('520');
  
  // Moments State
  const [commentInput, setCommentInput] = useState('');
  const [commentingMomentId, setCommentingMomentId] = useState<string | null>(null);
  const [aiReplyingMomentId, setAiReplyingMomentId] = useState<string | null>(null);
  const [isPostingMoment, setIsPostingMoment] = useState(false);
  const [newMomentText, setNewMomentText] = useState('');
  const [isAiProcessingMoment, setIsAiProcessingMoment] = useState(false);

  // Add Friend State
  const [showAddFriend, setShowAddFriend] = useState(false);
  const [newFriendName, setNewFriendName] = useState('');
  const [newFriendPrompt, setNewFriendPrompt] = useState('');

  const pendingRequests = useRef(0);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const aiRef = useRef<GoogleGenAI | null>(null);

  const defaultAiAvatar = 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=100&q=80';
  const defaultUserAvatar = 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=100&q=80';

  const [currentTime, setCurrentTime] = useState(Date.now());

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(Date.now()), 60000); // Update every minute
    return () => clearInterval(timer);
  }, []);

  const formatRelativeTime = (timestampMs: number | undefined) => {
    if (!timestampMs) return '';
    const diff = currentTime - timestampMs;
    const minutes = Math.floor(diff / 60000);
    if (minutes < 1) return '刚刚';
    if (minutes < 60) return `${minutes}分钟前`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours}小时前`;
    const days = Math.floor(hours / 24);
    return `${days}天前`;
  };

  const currentPersona = personas.find(p => p.id === currentChatId);
  const currentMessages = messages.filter(m => m.personaId === currentChatId);

  useEffect(() => {
    if (isActive && activeTab === 'chat' && currentChatId) {
      onClearUnread();
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, activeTab, currentChatId, onClearUnread, isActive]);

  useEffect(() => {
    if (!currentChatId || pendingRequests.current > 0) return;
    
    const delayMs = (apiSettings.proactiveDelay || 10) * 1000;

    const timer = setTimeout(async () => {
       // 50% chance to proactively message if idle for the specified delay
       if (Math.random() < 0.5 && currentPersona) {
          pendingRequests.current += 1;
          setIsTyping(pendingRequests.current > 0);
          try {
            const promptText = `[系统提示：距离上次聊天已经过了一会儿，请主动找用户说句话，开启新话题或者继续之前的对话。必须完全符合你的人设，语气自然，像真人一样发微信。]`;
            const contextMessages = currentMessages.slice(-10).map(m => ({
              role: m.role === 'model' ? 'assistant' : 'user',
              content: m.text
            }));
            const responseText = await fetchAiResponse(promptText, contextMessages, currentPersona);
            
            const typingDelay = Math.min(responseText.length * 150, 5000) + Math.random() * 1000;
            await new Promise(resolve => setTimeout(resolve, typingDelay));

            const aiMsg: Message = { 
              id: Date.now().toString(), 
              personaId: currentChatId,
              role: 'model', 
              text: responseText,
              msgType: 'text',
              timestamp: new Date().toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit', hour12: false }),
              isRead: true,
              createdAt: Date.now()
            };
            setMessages(prev => [...prev, aiMsg]);
          } catch (e) {
            console.error("Proactive message error:", e);
          } finally {
            pendingRequests.current -= 1;
            setIsTyping(pendingRequests.current > 0);
          }
       }
    }, delayMs);

    return () => clearTimeout(timer);
  }, [currentMessages, currentChatId, isTyping, isLoading, currentPersona, apiSettings.proactiveDelay]);

  const fetchAiResponse = async (promptText: string, contextMessages: any[] = [], persona: Persona) => {
    const fullSystemInstruction = [
      worldbook.jailbreakPrompt,
      worldbook.globalPrompt,
      userProfile.persona ? `【用户人设】\n${userProfile.persona}` : "",
      persona.instructions ? `【角色人设】\n${persona.instructions}` : "",
      persona.prompt ? `【专属提示词】\n${persona.prompt}` : "",
      !persona.instructions && !persona.prompt ? "You are a helpful assistant." : ""
    ].filter(Boolean).join('\n\n');

    if (apiSettings.apiUrl) {
      const endpoint = apiSettings.apiUrl.endsWith('/') ? `${apiSettings.apiUrl}chat/completions` : `${apiSettings.apiUrl}/chat/completions`;
      const openAiMessages = [
        { role: 'system', content: fullSystemInstruction },
        ...contextMessages,
        { role: 'user', content: promptText }
      ];

      const res = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiSettings.apiKey}`
        },
        body: JSON.stringify({
          model: apiSettings.model,
          messages: openAiMessages,
          temperature: apiSettings.temperature,
        })
      });

      if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);
      const data = await res.json();
      return data.choices[0].message.content;
    } else {
      if (!aiRef.current) {
        const apiKey = apiSettings.apiKey || process.env.GEMINI_API_KEY;
        aiRef.current = new GoogleGenAI({ apiKey: apiKey as string });
      }

      const contents = contextMessages.map(m => ({
        role: m.role === 'assistant' ? 'model' : 'user',
        parts: [{ text: m.content }]
      }));
      contents.push({ role: 'user', parts: [{ text: promptText }] });

      const response = await aiRef.current.models.generateContent({
        model: apiSettings.model || 'gemini-3-flash-preview',
        contents: contents,
        config: {
          systemInstruction: fullSystemInstruction,
          temperature: apiSettings.temperature,
        }
      });
      return response.text || "...";
    }
  };

  const handleSend = async (text: string, msgType: 'text' | 'transfer' = 'text', amount?: number) => {
    if (!text.trim() || !currentPersona) return;

    const now = new Date();
    const timestamp = now.toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit', hour12: false });
    const userMsg: Message = { id: Date.now().toString(), personaId: currentPersona.id, role: 'user', text: text.trim(), msgType, amount, timestamp, isRead: false, status: 'sent', createdAt: Date.now() };
    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setShowPlusMenu(false);
    
    pendingRequests.current += 1;
    setIsLoading(pendingRequests.current > 0);

    setTimeout(() => {
      setMessages(prev => prev.map(m => m.id === userMsg.id && m.status === 'sent' ? { ...m, status: 'delivered' } : m));
    }, 600);

    try {
      // 1. Simulate delay before AI "reads" the message
      await new Promise(resolve => setTimeout(resolve, Math.random() * 2000 + 1000));
      
      // Mark as read
      setMessages(prev => prev.map(m => m.id === userMsg.id ? { ...m, isRead: true, status: 'read' } : m));
      
      // 2. Show typing indicator
      setIsTyping(true);

      const promptText = msgType === 'transfer' ? `[系统提示：用户向你转账了 ${amount} 元。请作出符合你人设的反应]` : text.trim();
      
      const contextMessages = currentMessages.map(m => ({
        role: m.role === 'model' ? 'assistant' : 'user',
        content: m.msgType === 'transfer' ? `[系统提示：用户向你转账了 ${m.amount} 元。请作出符合你人设的反应]` : 
                 m.msgType === 'music' && m.song ? `[系统提示：用户分享了歌曲《${m.song.title}》。请作出符合你人设的反应]` :
                 m.text
      }));

      const responseText = await fetchAiResponse(promptText, contextMessages, currentPersona);
      
      // 3. Simulate typing delay based on response length
      const typingDelay = Math.min(responseText.length * 100, 4000) + Math.random() * 1000;
      await new Promise(resolve => setTimeout(resolve, typingDelay));
      
      const aiMsg: Message = { 
        id: (Date.now() + 1).toString(), 
        personaId: currentPersona.id,
        role: 'model', 
        text: responseText,
        msgType: msgType === 'transfer' ? 'transfer' : 'text',
        amount: amount,
        timestamp: new Date().toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit', hour12: false }),
        isRead: true,
        createdAt: Date.now()
      };
      setMessages(prev => [...prev, aiMsg]);

      // AI random recall logic (5% chance)
      if (Math.random() < 0.05) {
        setTimeout(async () => {
          setMessages(prev => prev.map(m => m.id === aiMsg.id ? { ...m, isRecalled: true } : m));
          pendingRequests.current += 1;
          setIsTyping(pendingRequests.current > 0);
          
          try {
            const recallPrompt = `[系统提示：你刚才撤回了一条消息。请发一条新消息，可以解释一下为什么撤回（比如打错字了、发错表情了等），然后继续聊天。]`;
            const recallContext = currentMessages.map(m => ({
              role: m.role === 'model' ? 'assistant' : 'user',
              content: m.text
            }));
            const recallResponse = await fetchAiResponse(recallPrompt, recallContext, currentPersona);
            
            const newAiMsg: Message = { 
              id: (Date.now() + 2).toString(), 
              personaId: currentPersona.id,
              role: 'model', 
              text: recallResponse,
              msgType: 'text',
              timestamp: new Date().toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit', hour12: false }),
              isRead: true,
              createdAt: Date.now()
            };
            setMessages(prev => [...prev, newAiMsg]);
          } catch (e) {
            console.error("AI recall error:", e);
          } finally {
            pendingRequests.current -= 1;
            setIsTyping(pendingRequests.current > 0);
          }
        }, 2000 + Math.random() * 2000);
      }

    } catch (error: any) {
      console.error("Chat error:", error);
      setMessages(prev => [...prev, { id: Date.now().toString(), personaId: currentPersona.id, role: 'model', text: `Error: ${error.message}`, timestamp: new Date().toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit', hour12: false }), isRead: true }]);
    } finally {
      pendingRequests.current -= 1;
      setIsTyping(pendingRequests.current > 0);
      setIsLoading(pendingRequests.current > 0);
    }
  };

  const handleRecall = (msgId: string) => {
    setMessages(prev => prev.map(m => m.id === msgId ? { ...m, isRecalled: true } : m));
    setActiveMessageMenu(null);
  };

  const handlePat = async (target: 'user' | 'model') => {
    if (!currentPersona) return;
    
    const now = new Date();
    const timestamp = now.toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit', hour12: false });
    
    let patText = '';
    if (target === 'model') {
      const suffix = currentPersona.patSuffix || '肩膀';
      patText = `我拍了拍"${currentPersona.name}"的${suffix}`;
    } else {
      const suffix = userProfile.patSuffix || '肩膀';
      patText = `我拍了拍自己的${suffix}`;
    }

    const sysMsg: Message = {
      id: Date.now().toString(),
      personaId: currentPersona.id,
      role: 'user', // We use user role for alignment, but msgType system will center it
      text: patText,
      msgType: 'system',
      timestamp,
      createdAt: Date.now()
    };
    
    setMessages(prev => [...prev, sysMsg]);

    if (target === 'model') {
      pendingRequests.current += 1;
      setIsTyping(pendingRequests.current > 0);
      try {
        const promptText = `[系统提示：用户拍了拍你（${patText}）。请作出符合你人设的反应，可以是一句话，也可以是一个动作。]`;
        const contextMessages = currentMessages.slice(-5).map(m => ({
          role: m.role === 'model' ? 'assistant' : 'user',
          content: m.text
        }));
        
        const responseText = await fetchAiResponse(promptText, contextMessages, currentPersona);
        
        const typingDelay = Math.min(responseText.length * 100, 3000) + Math.random() * 1000;
        await new Promise(resolve => setTimeout(resolve, typingDelay));
        
        const aiMsg: Message = { 
          id: (Date.now() + 1).toString(), 
          personaId: currentPersona.id,
          role: 'model', 
          text: responseText,
          msgType: 'text',
          timestamp: new Date().toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit', hour12: false }),
          isRead: true,
          createdAt: Date.now()
        };
        setMessages(prev => [...prev, aiMsg]);
      } catch (e) {
        console.error("AI pat response error:", e);
      } finally {
        pendingRequests.current -= 1;
        setIsTyping(pendingRequests.current > 0);
      }
    }
  };

  const handleRegenerate = async () => {
    if (!currentPersona || currentMessages.length === 0) return;

    const lastUserMsgIndex = currentMessages.map(m => m.role).lastIndexOf('user');
    if (lastUserMsgIndex === -1) return;

    const lastUserMsg = currentMessages[lastUserMsgIndex];
    const newMessages = currentMessages.slice(0, lastUserMsgIndex + 1);
    
    setMessages(prev => prev.filter(m => {
      if (m.personaId !== currentPersona.id) return true;
      return Number(m.id) <= Number(lastUserMsg.id);
    }));
    
    pendingRequests.current += 1;
    setIsLoading(pendingRequests.current > 0);

    try {
      const promptText = lastUserMsg.msgType === 'transfer' ? `[系统提示：用户向你转账了 ${lastUserMsg.amount} 元。请作出符合你人设的反应]` : 
                         lastUserMsg.msgType === 'music' && lastUserMsg.song ? `[系统提示：用户分享了歌曲《${lastUserMsg.song.title}》。请作出符合你人设的反应]` :
                         lastUserMsg.text;
      
      const contextMessages = newMessages.slice(0, -1).map(m => ({
        role: m.role === 'model' ? 'assistant' : 'user',
        content: m.msgType === 'transfer' ? `[系统提示：用户向你转账了 ${m.amount} 元。请作出符合你人设的反应]` : 
                 m.msgType === 'music' && m.song ? `[系统提示：用户分享了歌曲《${m.song.title}》。请作出符合你人设的反应]` :
                 m.text
      }));

      const responseText = await fetchAiResponse(promptText, contextMessages, currentPersona);
      
      const aiMsg: Message = { 
        id: (Date.now() + 1).toString(), 
        personaId: currentPersona.id,
        role: 'model', 
        text: responseText,
        msgType: 'text',
        timestamp: new Date().toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit', hour12: false }),
        isRead: true
      };
      
      setMessages(prev => {
        const filtered = prev.filter(m => {
          if (m.personaId !== currentPersona.id) return true;
          return Number(m.id) <= Number(lastUserMsg.id);
        });
        const updated = filtered.map(m => m.id === lastUserMsg.id ? { ...m, isRead: true, status: 'read' } : m);
        return [...updated, aiMsg];
      });
    } catch (error: any) {
      console.error("Regenerate error:", error);
      setMessages(prev => [...prev, { id: Date.now().toString(), personaId: currentPersona.id, role: 'model', text: `Error: ${error.message}`, timestamp: new Date().toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit', hour12: false }), isRead: true }]);
    } finally {
      pendingRequests.current -= 1;
      setIsLoading(pendingRequests.current > 0);
    }
  };

  const handleTransferClick = () => {
    setShowTransferModal(true);
  };

  const confirmTransfer = () => {
    if (transferAmount && !isNaN(Number(transferAmount))) {
      handleSend(`转账 ¥${transferAmount}`, 'transfer', Number(transferAmount));
    }
    setShowTransferModal(false);
    setTransferAmount('520');
  };

  const handleDeletePersona = () => {
    if (currentChatId) {
      setPersonas(prev => prev.filter(p => p.id !== currentChatId));
      setMessages(prev => prev.filter(m => m.personaId !== currentChatId));
      setCurrentChatId(null);
      setShowChatSettings(false);
    }
  };

  const handleAddFriend = () => {
    if (!newFriendName.trim()) return;
    const newPersona: Persona = {
      id: Date.now().toString(),
      name: newFriendName.trim(),
      instructions: newFriendPrompt.trim() || '你是一个新朋友。',
    };
    setPersonas(prev => [...prev, newPersona]);
    setShowAddFriend(false);
    setNewFriendName('');
    setNewFriendPrompt('');
  };

  // --- Moments Handlers ---
  const handleToggleLike = (momentId: string) => {
    setMoments(prev => prev.map(m => {
      if (m.id === momentId) {
        const hasLiked = m.likedByIds.includes('user');
        const newLikedBy = hasLiked ? m.likedByIds.filter(u => u !== 'user') : [...m.likedByIds, 'user'];
        return { ...m, likedByIds: newLikedBy };
      }
      return m;
    }));
  };

  const handleAddComment = async (momentId: string) => {
    if (!commentInput.trim() || aiReplyingMomentId) return;

    const targetMoment = moments.find(m => m.id === momentId);
    if (!targetMoment) return;

    const newComment: Comment = {
      id: Date.now().toString(),
      authorId: 'user',
      text: commentInput.trim(),
      timestamp: '刚刚',
      createdAt: Date.now()
    };

    setMoments(prev => prev.map(m => 
      m.id === momentId ? { ...m, comments: [...m.comments, newComment] } : m
    ));
    setCommentInput('');
    setCommentingMomentId(null);

    // If the moment was posted by an AI, the AI should reply
    if (targetMoment.authorId !== 'user') {
      const authorPersona = personas.find(p => p.id === targetMoment.authorId);
      if (!authorPersona) return;

      setAiReplyingMomentId(momentId);
      try {
        const promptText = `[系统提示：你在朋友圈发了动态：“${targetMoment.text}”，用户评论了你：“${newComment.text}”。请直接输出回复用户的内容，符合你的人设，不要带引号，不要带“回复xx”等前缀。]`;
        const responseText = await fetchAiResponse(promptText, [], authorPersona);
        
        const aiReply: Comment = {
          id: (Date.now() + 1).toString(),
          authorId: authorPersona.id,
          text: responseText,
          timestamp: '刚刚',
          replyToId: 'user',
          createdAt: Date.now()
        };
        
        setMoments(prev => prev.map(m => 
          m.id === momentId ? { ...m, comments: [...m.comments, aiReply] } : m
        ));
      } catch (error) {
        console.error("Comment reply error:", error);
      } finally {
        setAiReplyingMomentId(null);
      }
    }
  };

  const handlePostMoment = async () => {
    if (!newMomentText.trim() || isAiProcessingMoment) return;

    const newMoment: Moment = {
      id: Date.now().toString(),
      authorId: 'user',
      text: newMomentText.trim(),
      timestamp: '刚刚',
      createdAt: Date.now(),
      likedByIds: [],
      comments: []
    };

    setMoments(prev => [newMoment, ...prev]);
    setNewMomentText('');
    setIsPostingMoment(false);
    setIsAiProcessingMoment(true);

    // Let all personas react to the new moment
    for (const persona of personas) {
      try {
        const promptText = `[系统提示：用户在朋友圈发了一条动态：“${newMoment.text}”。请决定你是否要点赞或评论。如果要点赞，请回复"LIKE"。如果要评论，请直接回复评论内容。如果你不想理会，请回复"IGNORE"。请只回复这三种情况之一，不要有其他多余的字。]`;
        const responseText = await fetchAiResponse(promptText, [], persona);
        
        const aiAction = responseText.trim();
        
        if (aiAction.includes('LIKE')) {
          setMoments(prev => prev.map(m => 
            m.id === newMoment.id ? { ...m, likedByIds: [...m.likedByIds, persona.id] } : m
          ));
        } else if (!aiAction.includes('IGNORE') && aiAction.length > 0) {
          const aiComment: Comment = {
            id: Date.now().toString() + Math.random(),
            authorId: persona.id,
            text: aiAction,
            timestamp: '刚刚',
            createdAt: Date.now()
          };
          setMoments(prev => prev.map(m => 
            m.id === newMoment.id ? { ...m, comments: [...m.comments, aiComment] } : m
          ));
        }
      } catch (error) {
        console.error(`AI processing moment error for ${persona.name}:`, error);
      }
    }
    setIsAiProcessingMoment(false);
  };

  return (
    <div className="w-full h-full bg-neutral-100 flex flex-col pt-12">
      {/* Header */}
      <div className="h-12 flex items-center px-2 bg-neutral-100 border-b border-neutral-200 shrink-0 z-10">
        {activeTab === 'chat' && currentChatId ? (
          <button onClick={() => setCurrentChatId(null)} className="text-neutral-800 p-2 active:opacity-70 flex items-center">
            <ChevronLeft size={24} />
          </button>
        ) : (
          <button onClick={onBack} className="text-neutral-800 p-2 active:opacity-70 flex items-center">
            <ChevronLeft size={24} />
          </button>
        )}
        
        <div className="flex-1 text-center pr-2">
          <h1 className="font-semibold text-neutral-900 text-[16px]">
            {activeTab === 'chat' 
              ? (currentChatId ? (isTyping ? '对方正在输入...' : currentPersona?.name) : '微信') 
              : activeTab === 'contacts' ? '通讯录'
              : activeTab === 'moments' ? '朋友圈' : '收藏'}
          </h1>
        </div>

        {activeTab === 'chat' && !currentChatId && (
          <button onClick={() => setShowAddFriend(true)} className="p-2 text-neutral-800">
            <Plus size={24} />
          </button>
        )}
        {activeTab === 'contacts' && (
          <button onClick={() => setShowAddFriend(true)} className="p-2 text-neutral-800">
            <UserPlus size={20} />
          </button>
        )}
        {activeTab === 'chat' && currentChatId && (
          <button onClick={() => setShowChatSettings(!showChatSettings)} className="p-2 text-neutral-800 relative">
            <MoreHorizontal size={20} />
            {showChatSettings && (
              <div className="absolute top-10 right-2 w-32 bg-white rounded-lg shadow-lg border border-neutral-200 py-1 z-50">
                <div onClick={handleDeletePersona} className="px-4 py-2 text-[14px] text-red-500 flex items-center gap-2 active:bg-neutral-100 cursor-pointer">
                  <Trash2 size={16} /> 删除好友
                </div>
                <div onClick={handleDeletePersona} className="px-4 py-2 text-[14px] text-red-500 flex items-center gap-2 active:bg-neutral-100 cursor-pointer">
                  <Ban size={16} /> 拉黑
                </div>
              </div>
            )}
          </button>
        )}
        {activeTab === 'moments' && (
          <button onClick={() => setIsPostingMoment(true)} className="p-2 text-neutral-800">
            <Camera size={20} />
          </button>
        )}
      </div>

      {/* Main Content Area */}
      <div className="flex-1 overflow-hidden relative">
        {/* Chat List View */}
        {activeTab === 'chat' && !currentChatId && (
          <div className="absolute inset-0 overflow-y-auto bg-white">
            {personas.map(p => {
              const lastMsg = messages.filter(m => m.personaId === p.id).pop();
              return (
                <div 
                  key={p.id} 
                  onClick={() => setCurrentChatId(p.id)}
                  className="flex items-center gap-3 p-3 border-b border-neutral-100 active:bg-neutral-50 cursor-pointer"
                >
                  <img src={p.avatarUrl || defaultAiAvatar} className="w-12 h-12 rounded-xl object-cover" alt="avatar" />
                  <div className="flex-1 overflow-hidden">
                    <div className="flex justify-between items-center">
                      <h3 className="text-[16px] font-medium text-neutral-900">{p.name}</h3>
                      <span className="text-[12px] text-neutral-400">
                        {lastMsg ? formatRelativeTime(lastMsg.createdAt) : ''}
                      </span>
                    </div>
                    <p className="text-[13px] text-neutral-500 truncate mt-0.5">
                      {lastMsg ? (lastMsg.msgType === 'transfer' ? '[转账]' : lastMsg.text) : '暂无消息'}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Contacts View */}
        {activeTab === 'contacts' && (
          <div className="absolute inset-0 overflow-y-auto bg-white pb-12">
            <div className="p-3 border-b border-neutral-100 bg-neutral-50 flex items-center gap-3 active:bg-neutral-100 cursor-pointer" onClick={() => setShowAddFriend(true)}>
              <div className="w-10 h-10 bg-orange-400 rounded-lg flex items-center justify-center text-white">
                <UserPlus size={20} />
              </div>
              <span className="text-[15px] font-medium text-neutral-800">新的朋友</span>
            </div>
            
            <div className="px-3 py-1 bg-neutral-100 text-[12px] text-neutral-500 font-medium">星标朋友</div>
            {personas.map(p => (
              <div 
                key={p.id} 
                onClick={() => {
                  setActiveTab('chat');
                  setCurrentChatId(p.id);
                }}
                className="flex items-center gap-3 p-3 border-b border-neutral-100 active:bg-neutral-50 cursor-pointer"
              >
                <img src={p.avatarUrl || defaultAiAvatar} className="w-10 h-10 rounded-lg object-cover" alt="avatar" />
                <h3 className="text-[16px] font-medium text-neutral-900 flex-1">{p.name}</h3>
              </div>
            ))}
          </div>
        )}

        {/* Direct Message View */}
        {activeTab === 'chat' && currentChatId && (
          <div 
            className="absolute inset-0 flex flex-col bg-neutral-100" 
            onClick={() => setShowChatSettings(false)}
            style={{
              backgroundImage: theme.chatBg ? `url(${theme.chatBg})` : undefined,
              backgroundSize: 'cover',
              backgroundPosition: 'center'
            }}
          >
            <div className="flex-1 p-4 overflow-y-auto flex flex-col gap-4 pb-8">
              {currentMessages.length === 0 && (
                <div className="flex-1 flex items-center justify-center text-neutral-400 text-sm text-center px-6">
                  Say hi to {currentPersona?.name || 'your AI'}!
                </div>
              )}
              {currentMessages.map((msg) => {
                if (msg.isRecalled) {
                  return (
                    <div key={msg.id} className="flex justify-center my-2">
                      <span className="text-[12px] text-neutral-400 bg-neutral-200/50 px-2 py-1 rounded-md">
                        {msg.role === 'user' ? '你' : currentPersona?.name}撤回了一条消息
                      </span>
                    </div>
                  );
                }

                if (msg.msgType === 'system') {
                  return (
                    <div key={msg.id} className="flex justify-center my-2">
                      <span className="text-[12px] text-neutral-400 bg-neutral-200/50 px-2 py-1 rounded-md">
                        {msg.text}
                      </span>
                    </div>
                  );
                }

                const canRecall = msg.role === 'user' && msg.createdAt && (Date.now() - msg.createdAt < 2 * 60 * 1000);

                return (
                <div key={msg.id} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'} relative`}>
                  {msg.role === 'model' && (
                    <img 
                      src={currentPersona?.avatarUrl || defaultAiAvatar} 
                      className="w-10 h-10 rounded-lg mr-3 object-cover shrink-0 cursor-pointer" 
                      alt="avatar" 
                      onDoubleClick={() => handlePat('model')}
                    />
                  )}
                  
                  {msg.role === 'user' && (
                    <div className="flex flex-col items-end mr-2 justify-end pb-1 shrink-0">
                      {msg.timestamp && <span className="text-[10px] text-neutral-400 mb-0.5">{msg.timestamp}</span>}
                      <span className={`text-[10px] ${msg.status === 'read' || msg.isRead ? 'text-neutral-400' : 'text-blue-500'}`}>
                        {msg.status === 'read' || msg.isRead ? '已读' : msg.status === 'delivered' ? '已送达' : msg.status === 'sent' ? '已发送' : '未读'}
                      </span>
                    </div>
                  )}

                  <div className="relative max-w-[70%]" onClick={() => setActiveMessageMenu(activeMessageMenu === msg.id ? null : msg.id)}>
                    {msg.msgType === 'music' && msg.song ? (
                      <div className={`flex flex-col gap-2 rounded-xl p-3 w-64 ${msg.role === 'user' ? 'bg-[#95ec69]' : 'bg-white border border-neutral-200'}`}>
                        <div className="text-[13px] text-neutral-600 mb-1">{msg.role === 'user' ? '我分享了歌曲' : '分享了歌曲'}</div>
                        <div className="flex items-center gap-3 bg-white/50 p-2 rounded-lg">
                          <img src={msg.song.cover} className="w-10 h-10 rounded-md object-cover" />
                          <div className="flex-1 overflow-hidden">
                            <div className="text-[14px] font-medium text-neutral-900 truncate">{msg.song.title}</div>
                            <div className="text-[12px] text-neutral-500 truncate">{msg.song.artist}</div>
                          </div>
                          <div className="w-6 h-6 rounded-full bg-white flex items-center justify-center shadow-sm">
                            <Play size={12} className="text-neutral-600 ml-0.5" />
                          </div>
                        </div>
                      </div>
                    ) : msg.msgType === 'transfer' ? (
                      <div className={`flex items-center gap-3 rounded-xl p-3 w-56 ${msg.role === 'user' ? 'bg-[#f39b3a] text-white' : 'bg-white border border-neutral-200 text-neutral-800'}`}>
                        <div className={`w-10 h-10 rounded-full flex items-center justify-center ${msg.role === 'user' ? 'bg-white/20' : 'bg-[#f39b3a]/10'}`}>
                          <ArrowLeftRight size={20} className={msg.role === 'user' ? 'text-white' : 'text-[#f39b3a]'} />
                        </div>
                        <div>
                          <div className="text-[16px] font-medium">¥{msg.amount?.toFixed(2)}</div>
                          <div className="text-[12px] opacity-80">{msg.role === 'user' ? '微信转账' : '已收款'}</div>
                        </div>
                      </div>
                    ) : (
                      <div className={`rounded-2xl px-4 py-2.5 text-[15px] leading-relaxed shadow-sm ${
                        msg.role === 'user' 
                          ? 'bg-[#95ec69] text-neutral-900 rounded-tr-sm' 
                          : 'bg-white border border-neutral-200 text-neutral-800 rounded-tl-sm'
                      }`}>
                        {msg.text}
                      </div>
                    )}

                    {activeMessageMenu === msg.id && canRecall && (
                      <div className="absolute -top-10 left-1/2 -translate-x-1/2 bg-neutral-800 text-white text-[12px] py-1.5 px-3 rounded-lg shadow-lg whitespace-nowrap z-50 flex gap-2">
                        <button onClick={(e) => { e.stopPropagation(); handleRecall(msg.id); }} className="active:opacity-70">撤回</button>
                      </div>
                    )}
                  </div>

                  {msg.role === 'model' && (
                    <div className="flex flex-col items-start ml-2 justify-end pb-1 shrink-0">
                      {msg.timestamp && <span className="text-[10px] text-neutral-400 mb-0.5">{msg.timestamp}</span>}
                      <span className="text-[10px] text-neutral-400">已读</span>
                    </div>
                  )}

                  {msg.role === 'user' && (
                    <img 
                      src={userProfile.avatarUrl || defaultUserAvatar} 
                      className="w-10 h-10 rounded-lg ml-3 object-cover shrink-0 cursor-pointer" 
                      alt="user avatar" 
                      onDoubleClick={() => handlePat('user')}
                    />
                  )}
                </div>
              )})}
              <div ref={messagesEndRef} />
            </div>

            {/* Input Area */}
            <div className="bg-neutral-100 border-t border-neutral-200 shrink-0">
              <div className="p-3 flex items-center gap-2">
                <input 
                  type="text" 
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleSend(input)}
                  className="flex-1 bg-white rounded-md px-3 py-2 outline-none text-[15px] text-neutral-800"
                />
                {input.trim() ? (
                  <button 
                    onClick={() => handleSend(input)}
                    className="bg-[#07c160] text-white px-4 py-2 rounded-md font-medium text-[15px] active:bg-[#06ad56] transition-colors"
                  >
                    发送
                  </button>
                ) : (
                  <>
                    {currentMessages.length > 0 && currentMessages[currentMessages.length - 1].role === 'model' && (
                      <button 
                        onClick={handleRegenerate}
                        disabled={isLoading}
                        className="w-9 h-9 rounded-full border border-neutral-400 flex items-center justify-center text-neutral-600 active:bg-neutral-200"
                      >
                        <RefreshCw size={18} className={isLoading ? "animate-spin" : ""} />
                      </button>
                    )}
                    <button 
                      onClick={() => setShowPlusMenu(!showPlusMenu)}
                      className="w-9 h-9 rounded-full border border-neutral-400 flex items-center justify-center text-neutral-600"
                    >
                      <Plus size={24} />
                    </button>
                  </>
                )}
              </div>
              {showPlusMenu && (
                <div className="h-48 border-t border-neutral-200 bg-neutral-100 p-6 grid grid-cols-4 gap-4">
                  <button onClick={handleTransferClick} className="flex flex-col items-center gap-2">
                    <div className="w-14 h-14 bg-white rounded-2xl flex items-center justify-center text-neutral-700 shadow-sm">
                      <ArrowLeftRight size={28} />
                    </div>
                    <span className="text-[12px] text-neutral-500">转账</span>
                  </button>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Moments View */}
        {activeTab === 'moments' && (
          <div className="absolute inset-0 overflow-y-auto bg-white pb-12">
            <div className="relative h-72 bg-neutral-200">
              <img src={theme.momentsBg || 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=800&q=80'} className="w-full h-full object-cover" alt="Moments Cover" />
              <div className="absolute -bottom-6 right-4 flex items-end gap-4">
                <span className="text-white font-bold text-xl drop-shadow-md mb-8">{userProfile.name || '我'}</span>
                <div className="w-20 h-20 rounded-xl bg-white p-0.5 shadow-sm">
                  <img src={userProfile.avatarUrl || defaultUserAvatar} className="w-full h-full rounded-lg object-cover" alt="Avatar" />
                </div>
              </div>
            </div>
            
            <div className="pt-14 px-4 pb-4 space-y-8">
              {isAiProcessingMoment && (
                <div className="flex items-center justify-center py-4 text-neutral-500 text-sm gap-2">
                  <Loader2 size={16} className="animate-spin" /> 朋友们正在看你的动态...
                </div>
              )}

              {moments.map(moment => {
                const isUser = moment.authorId === 'user';
                const authorPersona = personas.find(p => p.id === moment.authorId);
                const authorName = isUser ? (userProfile.name || '我') : (authorPersona?.name || 'AI');
                const authorAvatar = isUser ? (userProfile.avatarUrl || defaultUserAvatar) : (authorPersona?.avatarUrl || defaultAiAvatar);

                return (
                  <div key={moment.id} className="flex gap-3">
                    <img src={authorAvatar} className="w-10 h-10 rounded-lg object-cover shrink-0" alt="Avatar" />
                    <div className="flex-1 border-b border-neutral-100 pb-4">
                      <h3 className="font-semibold text-[#576b95] text-[16px]">{authorName}</h3>
                      <p className="text-[15px] text-neutral-800 mt-1 leading-relaxed">{moment.text}</p>
                      
                      {moment.song && (
                        <div className="mt-2 flex items-center gap-3 bg-neutral-100 p-2 rounded-lg active:bg-neutral-200 cursor-pointer">
                          <img src={moment.song.cover} className="w-10 h-10 rounded-md object-cover" />
                          <div className="flex-1 overflow-hidden">
                            <div className="text-[14px] font-medium text-neutral-900 truncate">{moment.song.title}</div>
                            <div className="text-[12px] text-neutral-500 truncate">{moment.song.artist}</div>
                          </div>
                          <div className="w-8 h-8 rounded-full border border-neutral-300 flex items-center justify-center mr-1">
                            <Play size={14} className="text-neutral-500 ml-0.5" />
                          </div>
                        </div>
                      )}

                      <div className="flex items-center justify-between mt-2 relative">
                        <div className="text-[12px] text-neutral-400">{moment.createdAt ? formatRelativeTime(moment.createdAt) : moment.timestamp}</div>
                        <div className="flex gap-2">
                          <button 
                            onClick={() => handleToggleLike(moment.id)}
                            className="bg-neutral-100 px-2 py-1 rounded flex items-center gap-1 text-neutral-500 active:bg-neutral-200 transition-colors"
                          >
                            <Heart size={14} className={moment.likedByIds.includes('user') ? "fill-red-500 text-red-500" : ""} />
                          </button>
                          <button 
                            onClick={() => setCommentingMomentId(commentingMomentId === moment.id ? null : moment.id)}
                            className="bg-neutral-100 px-2 py-1 rounded flex items-center gap-1 text-neutral-500 active:bg-neutral-200"
                          >
                            <MessageSquare size={14} />
                          </button>
                        </div>
                      </div>

                      {/* Comments Section */}
                      {(moment.likedByIds.length > 0 || moment.comments.length > 0) && (
                        <div className="mt-3 bg-neutral-100 rounded-md p-2.5 space-y-1.5">
                          {moment.likedByIds.length > 0 && (
                            <div className="flex items-center gap-1.5 text-[13px] text-[#576b95] font-medium border-b border-neutral-200/50 pb-1.5 mb-1.5">
                              <Heart size={12} className="fill-current" /> 
                              {moment.likedByIds.map(id => {
                                if (id === 'user') return userProfile.name || '我';
                                return personas.find(p => p.id === id)?.name || 'AI';
                              }).join(', ')}
                            </div>
                          )}
                          {moment.comments.map(comment => {
                            const cIsUser = comment.authorId === 'user';
                            const cPersona = personas.find(p => p.id === comment.authorId);
                            const cName = cIsUser ? (userProfile.name || '我') : (cPersona?.name || 'AI');
                            
                            let replyName = '';
                            if (comment.replyToId) {
                              if (comment.replyToId === 'user') replyName = userProfile.name || '我';
                              else replyName = personas.find(p => p.id === comment.replyToId)?.name || 'AI';
                            }

                            return (
                              <div key={comment.id} className="text-[13px] leading-relaxed">
                                {replyName ? (
                                  <>
                                    <span className="font-medium text-[#576b95]">{cName}</span>
                                    <span className="text-neutral-800 mx-1">回复</span>
                                    <span className="font-medium text-[#576b95]">{replyName}</span>
                                    <span className="text-neutral-800">：{comment.text}</span>
                                  </>
                                ) : (
                                  <>
                                    <span className="font-medium text-[#576b95]">{cName}</span>
                                    <span className="text-neutral-800">：{comment.text}</span>
                                  </>
                                )}
                              </div>
                            );
                          })}
                          {aiReplyingMomentId === moment.id && (
                            <div className="text-[13px] text-neutral-500 flex items-center gap-1">
                              <Loader2 size={12} className="animate-spin" /> AI 正在回复...
                            </div>
                          )}
                        </div>
                      )}

                      {/* Comment Input */}
                      {commentingMomentId === moment.id && (
                        <div className="mt-3 flex gap-2">
                          <input 
                            type="text" 
                            value={commentInput}
                            onChange={(e) => setCommentInput(e.target.value)}
                            onKeyDown={(e) => e.key === 'Enter' && handleAddComment(moment.id)}
                            placeholder="评论..."
                            className="flex-1 bg-neutral-100 border border-neutral-200 rounded px-3 py-1.5 text-[13px] outline-none focus:border-blue-400"
                            autoFocus
                          />
                          <button 
                            onClick={() => handleAddComment(moment.id)}
                            disabled={!commentInput.trim() || aiReplyingMomentId === moment.id}
                            className="bg-[#07c160] text-white px-3 py-1.5 rounded text-[13px] font-medium disabled:opacity-50"
                          >
                            发送
                          </button>
                        </div>
                      )}

                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Post Moment Modal */}
        {isPostingMoment && (
          <div className="absolute inset-0 bg-white z-50 flex flex-col">
            <div className="h-12 flex items-center justify-between px-4 border-b border-neutral-200">
              <button onClick={() => setIsPostingMoment(false)} className="text-neutral-800 text-[15px]">取消</button>
              <button 
                onClick={handlePostMoment}
                disabled={!newMomentText.trim()}
                className="bg-[#07c160] text-white px-4 py-1.5 rounded text-[14px] font-medium disabled:opacity-50"
              >
                发表
              </button>
            </div>
            <div className="p-4">
              <textarea 
                value={newMomentText}
                onChange={(e) => setNewMomentText(e.target.value)}
                placeholder="这一刻的想法..."
                className="w-full h-32 outline-none resize-none text-[15px] placeholder-neutral-400"
                autoFocus
              />
            </div>
          </div>
        )}

        {/* Transfer Modal */}
        {showTransferModal && (
          <div className="absolute inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl w-full max-w-sm overflow-hidden flex flex-col">
              <div className="bg-[#f39b3a] p-6 flex flex-col items-center justify-center text-white relative">
                <button onClick={() => setShowTransferModal(false)} className="absolute top-4 left-4 text-white/80 active:text-white">
                  <ChevronLeft size={24} />
                </button>
                <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center mb-3">
                  <ArrowLeftRight size={24} className="text-white" />
                </div>
                <h3 className="text-[16px] font-medium">微转账给 {currentPersona?.name}</h3>
              </div>
              <div className="p-6 flex flex-col gap-6">
                <div className="flex flex-col gap-2">
                  <label className="text-[14px] text-neutral-500 font-medium">转账金额</label>
                  <div className="flex items-center border-b border-neutral-200 pb-2">
                    <span className="text-3xl font-medium mr-2">¥</span>
                    <input 
                      type="number" 
                      value={transferAmount}
                      onChange={(e) => setTransferAmount(e.target.value)}
                      className="flex-1 text-4xl font-medium outline-none bg-transparent"
                      autoFocus
                    />
                  </div>
                </div>
                <button 
                  onClick={confirmTransfer}
                  disabled={!transferAmount || isNaN(Number(transferAmount))}
                  className="w-full py-3.5 bg-[#07c160] text-white rounded-xl text-[16px] font-medium active:bg-[#06ad56] disabled:opacity-50 transition-colors mt-4"
                >
                  转账
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Add Friend Modal */}
        {showAddFriend && (
          <div className="absolute inset-0 bg-neutral-100 z-50 flex flex-col">
            <div className="h-12 flex items-center justify-between px-4 bg-white border-b border-neutral-200">
              <button onClick={() => setShowAddFriend(false)} className="text-neutral-800 text-[15px]">取消</button>
              <h2 className="font-semibold text-[16px]">添加好友 (新角色)</h2>
              <button 
                onClick={handleAddFriend}
                disabled={!newFriendName.trim()}
                className="bg-[#07c160] text-white px-4 py-1.5 rounded text-[14px] font-medium disabled:opacity-50"
              >
                添加
              </button>
            </div>
            <div className="p-4 space-y-4">
              <div className="bg-white rounded-xl p-4 shadow-sm border border-neutral-200 space-y-4">
                <div className="space-y-1">
                  <label className="text-[12px] text-neutral-500">好友昵称</label>
                  <input 
                    type="text" 
                    value={newFriendName}
                    onChange={(e) => setNewFriendName(e.target.value)}
                    placeholder="输入好友名字"
                    className="w-full bg-neutral-50 border border-neutral-200 rounded-lg px-3 py-2 outline-none focus:border-[#07c160] text-[15px]"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[12px] text-neutral-500">人设提示词 (System Prompt)</label>
                  <textarea 
                    value={newFriendPrompt}
                    onChange={(e) => setNewFriendPrompt(e.target.value)}
                    placeholder="描述这个好友的性格、说话方式等..."
                    className="w-full h-32 bg-neutral-50 border border-neutral-200 rounded-lg px-3 py-2 outline-none focus:border-[#07c160] resize-none text-[15px]"
                  />
                </div>
                <p className="text-[11px] text-neutral-400">添加后，可以在“世界书”中修改TA的头像和详细设定。</p>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'favorites' && (
          <div className="absolute inset-0 overflow-y-auto bg-neutral-100 p-4 space-y-3 pb-12">
            {/* Wallet Section */}
            <div className="bg-white p-4 rounded-lg shadow-sm flex items-center justify-between mb-6">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-[#07c160]/10 rounded-lg flex items-center justify-center text-[#07c160]">
                  <Wallet size={24} />
                </div>
                <div>
                  <h3 className="text-[16px] text-neutral-800 font-medium">钱包</h3>
                  <p className="text-[13px] text-neutral-400 mt-0.5">余额、银行卡</p>
                </div>
              </div>
              <ChevronLeft size={20} className="text-neutral-400 rotate-180" />
            </div>

            <div className="bg-white p-4 rounded-lg shadow-sm flex items-center gap-4">
              <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center text-blue-500">
                <ImageIcon size={24} />
              </div>
              <div>
                <h3 className="text-[16px] text-neutral-800 font-medium">图片收藏</h3>
                <p className="text-[13px] text-neutral-400 mt-0.5">2026-12-25</p>
              </div>
            </div>
            <div className="bg-white p-4 rounded-lg shadow-sm flex items-center gap-4">
              <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center text-orange-500">
                <Bookmark size={24} />
              </div>
              <div>
                <h3 className="text-[16px] text-neutral-800 font-medium">文章收藏</h3>
                <p className="text-[13px] text-neutral-400 mt-0.5">来自朋友</p>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Bottom Tab Bar */}
      {!currentChatId && (
        <div className="h-[60px] bg-neutral-100 border-t border-neutral-200 flex justify-around items-center pb-2 shrink-0 z-10 relative">
          <button onClick={() => setActiveTab('chat')} className={`flex flex-col items-center gap-1 relative ${activeTab === 'chat' ? 'text-[#07c160]' : 'text-neutral-900'}`}>
            <MessageCircle size={24} className={activeTab === 'chat' ? 'fill-current' : ''} />
            {unreadCount > 0 && (
              <div className="absolute -top-1 -right-2 bg-red-500 text-white text-[10px] font-bold w-4 h-4 rounded-full flex items-center justify-center border-2 border-neutral-100 z-10">
                {unreadCount}
              </div>
            )}
            <span className="text-[10px] font-medium">微信</span>
          </button>
          <button onClick={() => setActiveTab('contacts')} className={`flex flex-col items-center gap-1 ${activeTab === 'contacts' ? 'text-[#07c160]' : 'text-neutral-900'}`}>
            <Users size={24} className={activeTab === 'contacts' ? 'fill-current' : ''} />
            <span className="text-[10px] font-medium">通讯录</span>
          </button>
          <button onClick={() => setActiveTab('moments')} className={`flex flex-col items-center gap-1 ${activeTab === 'moments' ? 'text-[#07c160]' : 'text-neutral-900'}`}>
            <Compass size={24} className={activeTab === 'moments' ? 'fill-current' : ''} />
            <span className="text-[10px] font-medium">发现</span>
          </button>
          <button onClick={() => setActiveTab('favorites')} className={`flex flex-col items-center gap-1 ${activeTab === 'favorites' ? 'text-[#07c160]' : 'text-neutral-900'}`}>
            <Bookmark size={24} className={activeTab === 'favorites' ? 'fill-current' : ''} />
            <span className="text-[10px] font-medium">我</span>
          </button>
        </div>
      )}
    </div>
  );
}
