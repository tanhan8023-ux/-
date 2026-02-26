import React, { useState, useRef, useEffect } from 'react';
import { ChevronLeft, Loader2, Plus, ArrowLeftRight, MessageCircle, Compass, Bookmark, Image as ImageIcon, MoreHorizontal } from 'lucide-react';
import { Message, Persona, ApiSettings, ThemeSettings } from '../types';
import { GoogleGenAI } from '@google/genai';

interface Props {
  persona: Persona;
  apiSettings: ApiSettings;
  theme: ThemeSettings;
  onBack: () => void;
}

export function ChatScreen({ persona, apiSettings, theme, onBack }: Props) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<'chat' | 'moments' | 'favorites'>('chat');
  const [showPlusMenu, setShowPlusMenu] = useState(false);
  
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const aiRef = useRef<GoogleGenAI | null>(null);
  const chatRef = useRef<any>(null);

  useEffect(() => {
    // Only initialize Gemini SDK if we are NOT using a custom API URL.
    // If a custom API URL is provided, we will use standard fetch (OpenAI format) in handleSend.
    if (!apiSettings.apiUrl) {
      const apiKey = apiSettings.apiKey || process.env.GEMINI_API_KEY;
      aiRef.current = new GoogleGenAI({ apiKey });
      chatRef.current = aiRef.current.chats.create({
        model: apiSettings.model,
        config: {
          systemInstruction: persona.instructions || "You are a helpful assistant.",
          temperature: apiSettings.temperature,
        }
      });
    }
  }, [persona, apiSettings]);

  useEffect(() => {
    if (activeTab === 'chat') {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, activeTab]);

  const handleSend = async (text: string, msgType: 'text' | 'transfer' = 'text', amount?: number) => {
    if (!text.trim() || isLoading) return;

    const userMsg: Message = { id: Date.now().toString(), role: 'user', text: text.trim(), msgType, amount };
    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setShowPlusMenu(false);
    setIsLoading(true);

    try {
      const promptText = msgType === 'transfer' ? `[系统提示：用户向你转账了 ${amount} 元。请作出符合你人设的反应]` : text.trim();
      let responseText = "...";

      if (apiSettings.apiUrl) {
        // Use OpenAI-compatible fetch for custom API URLs
        const endpoint = apiSettings.apiUrl.endsWith('/') ? `${apiSettings.apiUrl}chat/completions` : `${apiSettings.apiUrl}/chat/completions`;
        
        const openAiMessages = [
          { role: 'system', content: persona.instructions || "You are a helpful assistant." },
          ...messages.map(m => ({
            role: m.role === 'model' ? 'assistant' : 'user',
            content: m.msgType === 'transfer' ? `[系统提示：用户向你转账了 ${m.amount} 元。请作出符合你人设的反应]` : m.text
          })),
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

        if (!res.ok) {
          throw new Error(`HTTP error! status: ${res.status}`);
        }
        const data = await res.json();
        responseText = data.choices[0].message.content;
      } else {
        // Use Gemini SDK for default API
        const response = await chatRef.current.sendMessage({ message: promptText });
        responseText = response.text || "...";
      }
      
      const aiMsg: Message = { 
        id: (Date.now() + 1).toString(), 
        role: 'model', 
        text: responseText,
        msgType: msgType === 'transfer' ? 'transfer' : 'text',
        amount: amount
      };
      setMessages(prev => [...prev, aiMsg]);
    } catch (error: any) {
      console.error("Chat error:", error);
      const errorMsg: Message = {
        id: (Date.now() + 1).toString(),
        role: 'model',
        text: `Error: ${error.message || 'Network error.'}`
      };
      setMessages(prev => [...prev, errorMsg]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleTransferClick = () => {
    const amountStr = prompt("请输入转账金额：", "520");
    if (amountStr && !isNaN(Number(amountStr))) {
      handleSend(`转账 ¥${amountStr}`, 'transfer', Number(amountStr));
    }
  };

  return (
    <div className="w-full h-full bg-neutral-100 flex flex-col pt-12">
      {/* Header */}
      <div className="h-12 flex items-center px-2 bg-neutral-100 border-b border-neutral-200 shrink-0">
        <button onClick={onBack} className="text-neutral-800 p-2 active:opacity-70 flex items-center">
          <ChevronLeft size={24} />
        </button>
        <div className="flex-1 text-center pr-10">
          <h1 className="font-semibold text-neutral-900 text-[16px]">
            {activeTab === 'chat' ? persona.name || 'AI' : activeTab === 'moments' ? '朋友圈' : '收藏'}
          </h1>
        </div>
        {activeTab === 'chat' && (
          <button className="p-2 text-neutral-800">
            <MoreHorizontal size={20} />
          </button>
        )}
      </div>

      {/* Main Content Area */}
      <div className="flex-1 overflow-hidden relative">
        {activeTab === 'chat' && (
          <div className="absolute inset-0 flex flex-col bg-neutral-100">
            <div className="flex-1 p-4 overflow-y-auto flex flex-col gap-4 pb-8">
              {messages.length === 0 && (
                <div className="flex-1 flex items-center justify-center text-neutral-400 text-sm text-center px-6">
                  Say hi to {persona.name || 'your AI'}!
                </div>
              )}
              {messages.map((msg) => (
                <div key={msg.id} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                  {msg.role === 'model' && (
                    <img src={persona.avatarUrl || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=100&q=80'} className="w-10 h-10 rounded-lg mr-3 object-cover" alt="avatar" />
                  )}
                  
                  {msg.msgType === 'transfer' ? (
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
                    <div className={`max-w-[70%] rounded-2xl px-4 py-2.5 text-[15px] leading-relaxed shadow-sm ${
                      msg.role === 'user' 
                        ? 'bg-[#95ec69] text-neutral-900 rounded-tr-sm' 
                        : 'bg-white border border-neutral-200 text-neutral-800 rounded-tl-sm'
                    }`}>
                      {msg.text}
                    </div>
                  )}
                </div>
              ))}
              {isLoading && (
                <div className="flex justify-start">
                  <img src={persona.avatarUrl || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=100&q=80'} className="w-10 h-10 rounded-lg mr-3 object-cover" alt="avatar" />
                  <div className="bg-white border border-neutral-200 text-neutral-800 rounded-2xl rounded-tl-sm px-4 py-2.5 shadow-sm">
                    <Loader2 size={16} className="animate-spin text-neutral-400" />
                  </div>
                </div>
              )}
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
                    disabled={isLoading}
                    className="bg-[#07c160] text-white px-4 py-2 rounded-md font-medium text-[15px]"
                  >
                    发送
                  </button>
                ) : (
                  <button 
                    onClick={() => setShowPlusMenu(!showPlusMenu)}
                    className="w-9 h-9 rounded-full border border-neutral-400 flex items-center justify-center text-neutral-600"
                  >
                    <Plus size={24} />
                  </button>
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

        {activeTab === 'moments' && (
          <div className="absolute inset-0 overflow-y-auto bg-white pb-12">
            <div className="relative h-72 bg-neutral-200">
              <img src={theme.momentsBg || 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=800&q=80'} className="w-full h-full object-cover" alt="Moments Cover" />
              <div className="absolute -bottom-6 right-4 flex items-end gap-4">
                <span className="text-white font-bold text-xl drop-shadow-md mb-8">{persona.name}</span>
                <div className="w-20 h-20 rounded-xl bg-white p-0.5 shadow-sm">
                  <img src={persona.avatarUrl || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=200&q=80'} className="w-full h-full rounded-lg object-cover" alt="Avatar" />
                </div>
              </div>
            </div>
            <div className="pt-14 px-4 pb-4 space-y-8">
              <div className="flex gap-3">
                <img src={persona.avatarUrl || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=200&q=80'} className="w-10 h-10 rounded-lg object-cover" alt="Avatar" />
                <div className="flex-1 border-b border-neutral-100 pb-4">
                  <h3 className="font-semibold text-[#576b95] text-[16px]">{persona.name}</h3>
                  <p className="text-[15px] text-neutral-800 mt-1 leading-relaxed">今天天气真好呀，想和你一起去散步~ 🐾 记得多穿点衣服哦！</p>
                  <div className="mt-2 text-[12px] text-neutral-400">1小时前</div>
                  <div className="mt-3 bg-neutral-100 p-2.5 rounded flex items-center gap-2 text-[13px] text-neutral-500">
                    <span className="text-[#576b95] font-medium">AI Studio</span> 赞了这条朋友圈
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'favorites' && (
          <div className="absolute inset-0 overflow-y-auto bg-neutral-100 p-4 space-y-3 pb-12">
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
                <p className="text-[13px] text-neutral-400 mt-0.5">来自 {persona.name}</p>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Bottom Tab Bar */}
      <div className="h-[60px] bg-neutral-100 border-t border-neutral-200 flex justify-around items-center pb-2 shrink-0">
        <button onClick={() => setActiveTab('chat')} className={`flex flex-col items-center gap-1 ${activeTab === 'chat' ? 'text-[#07c160]' : 'text-neutral-900'}`}>
          <MessageCircle size={24} className={activeTab === 'chat' ? 'fill-current' : ''} />
          <span className="text-[10px] font-medium">微信</span>
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
    </div>
  );
}
