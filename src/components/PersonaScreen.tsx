import React, { useState } from 'react';
import { ChevronLeft, BookOpen, Download, Upload, Users, Image as ImageIcon } from 'lucide-react';
import { WorldbookSettings, Persona } from '../types';

interface Props {
  worldbook: WorldbookSettings;
  personas: Persona[];
  onSave: (worldbook: WorldbookSettings, personas: Persona[]) => void;
  onBack: () => void;
}

export function PersonaScreen({ worldbook: initialWorldbook, personas: initialPersonas, onSave, onBack }: Props) {
  const [worldbook, setWorldbook] = useState<WorldbookSettings>(initialWorldbook);
  const [personas, setPersonas] = useState<Persona[]>(initialPersonas);

  const handleSave = () => {
    onSave(worldbook, personas);
    onBack();
  };

  const handleImportWorldbook = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        try {
          const imported = JSON.parse(event.target?.result as string);
          if (imported && typeof imported === 'object') {
            setWorldbook({
              jailbreakPrompt: imported.jailbreakPrompt || '',
              globalPrompt: imported.globalPrompt || ''
            });
            alert('导入成功！');
          } else {
            throw new Error('Invalid format');
          }
        } catch (err) {
          alert('导入失败：文件格式不正确');
        }
      };
      reader.readAsText(file);
    }
  };

  const handleExportWorldbook = () => {
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(worldbook, null, 2));
    const downloadAnchorNode = document.createElement('a');
    downloadAnchorNode.setAttribute("href", dataStr);
    downloadAnchorNode.setAttribute("download", "worldbook.json");
    document.body.appendChild(downloadAnchorNode);
    downloadAnchorNode.click();
    downloadAnchorNode.remove();
  };

  const handleUpdatePersona = (id: string, prompt: string) => {
    setPersonas(personas.map(p => p.id === id ? { ...p, prompt } : p));
  };

  return (
    <div className="w-full h-full bg-neutral-50 flex flex-col pt-12">
      <div className="h-12 flex items-center justify-between px-2 bg-white border-b border-neutral-200 shrink-0">
        <button onClick={onBack} className="text-blue-500 p-2 active:opacity-70 flex items-center">
          <ChevronLeft size={24} />
          <span className="text-[15px] -ml-1">桌面</span>
        </button>
        <h1 className="font-semibold text-neutral-900 text-[15px]">世界书 (破限与提示词)</h1>
        <button onClick={handleSave} className="text-blue-500 font-semibold text-[15px] active:opacity-70 px-4">
          保存
        </button>
      </div>

      <div className="flex-1 p-4 overflow-y-auto space-y-6 pb-12">
        <div className="bg-white p-5 rounded-2xl shadow-sm border border-neutral-100 space-y-6">
          <div className="flex items-center justify-between border-b border-neutral-100 pb-3">
            <div className="flex items-center gap-2 text-neutral-700">
              <BookOpen size={20} className="text-blue-400" />
              <h2 className="font-semibold text-[15px]">全局设定</h2>
            </div>
            <div className="flex items-center gap-3">
              <label className="flex items-center gap-1 text-neutral-500 text-[12px] font-medium active:opacity-70 cursor-pointer">
                <Upload size={14} /> 导入
                <input type="file" accept=".json" className="hidden" onChange={handleImportWorldbook} />
              </label>
              <button 
                onClick={handleExportWorldbook}
                className="flex items-center gap-1 text-neutral-500 text-[12px] font-medium active:opacity-70"
              >
                <Download size={14} /> 导出
              </button>
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-[12px] font-medium text-neutral-600 uppercase tracking-wide">破限词 (Jailbreak Prompt)</label>
            <p className="text-[10px] text-neutral-400 leading-relaxed mb-2">
              用于突破 AI 模型的内置限制，例如允许 NSFW 内容或特定角色扮演。此内容将作为系统提示词的最前置部分发送。
            </p>
            <textarea 
              value={worldbook.jailbreakPrompt}
              onChange={(e) => setWorldbook({ ...worldbook, jailbreakPrompt: e.target.value })}
              placeholder="输入破限词..."
              className="w-full h-40 bg-neutral-50 border border-neutral-200 rounded-xl px-4 py-3 outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 resize-none text-[13px] text-neutral-900 leading-relaxed"
            />
          </div>

          <div className="space-y-2 pt-2">
            <label className="text-[12px] font-medium text-neutral-600 uppercase tracking-wide">全局提示词 (Global Prompt)</label>
            <p className="text-[10px] text-neutral-400 leading-relaxed mb-2">
              适用于所有角色的全局设定，例如世界观背景、通用规则等。此内容将附加在角色专属提示词之前。
            </p>
            <textarea 
              value={worldbook.globalPrompt}
              onChange={(e) => setWorldbook({ ...worldbook, globalPrompt: e.target.value })}
              placeholder="输入全局提示词..."
              className="w-full h-40 bg-neutral-50 border border-neutral-200 rounded-xl px-4 py-3 outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 resize-none text-[13px] text-neutral-900 leading-relaxed"
            />
          </div>
        </div>

        {/* Role Specific Prompts */}
        <div className="bg-white p-5 rounded-2xl shadow-sm border border-neutral-100 space-y-6">
          <div className="flex items-center gap-2 text-neutral-700 border-b border-neutral-100 pb-3">
            <Users size={20} className="text-blue-400" />
            <h2 className="font-semibold text-[15px]">角色专属提示词</h2>
          </div>

          <div className="space-y-6">
            {personas.map(persona => (
              <div key={persona.id} className="space-y-3">
                <div className="flex items-center gap-3">
                  {persona.avatarUrl ? (
                    <img src={persona.avatarUrl} className="w-8 h-8 rounded-lg object-cover shadow-sm" alt="avatar" />
                  ) : (
                    <div className="w-8 h-8 bg-neutral-100 rounded-lg flex items-center justify-center border border-neutral-200">
                      <ImageIcon size={14} className="text-neutral-400" />
                    </div>
                  )}
                  <label className="text-[14px] font-medium text-neutral-800">{persona.name}</label>
                </div>
                <textarea 
                  value={persona.prompt || ''}
                  onChange={(e) => handleUpdatePersona(persona.id, e.target.value)}
                  placeholder={`输入 ${persona.name} 的专属提示词 (例如：回复格式、行为规则)...`}
                  className="w-full h-32 bg-neutral-50 border border-neutral-200 rounded-xl px-4 py-3 outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 resize-none text-[13px] text-neutral-900 leading-relaxed"
                />
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
