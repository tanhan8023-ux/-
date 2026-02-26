import React, { useState, useRef, useEffect } from 'react';
import { ChevronLeft, Settings } from 'lucide-react';
import { ApiSettings } from '../types';

interface Props {
  settings: ApiSettings;
  onSave: (settings: ApiSettings) => void;
  onBack: () => void;
}

export function ApiSettingsScreen({ settings, onSave, onBack }: Props) {
  const [apiUrl, setApiUrl] = useState(settings.apiUrl);
  const [apiKey, setApiKey] = useState(settings.apiKey);
  const [model, setModel] = useState(settings.model);
  const [temperature, setTemperature] = useState(settings.temperature);
  const [logs, setLogs] = useState<string[]>(['> System initialized...']);
  const [fetchedModels, setFetchedModels] = useState<string[]>([]);
  const logsEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    logsEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [logs]);

  const handleSave = () => {
    onSave({ apiUrl, apiKey, model, temperature });
    setLogs(prev => [...prev, '> Settings saved successfully.']);
  };

  const handleFetchModels = async () => {
    const actualApiKey = apiKey || process.env.GEMINI_API_KEY;
    if (!actualApiKey) {
      setLogs(prev => [...prev, '> Error: 缺少 API KEY']);
      return;
    }

    setLogs(prev => [...prev, `> Fetching models...`]);
    
    try {
      let endpoint = '';
      let headers: any = { 'Content-Type': 'application/json' };
      let isGemini = false;

      if (apiUrl) {
        // OpenAI compatible endpoint
        endpoint = apiUrl.endsWith('/') ? `${apiUrl}models` : `${apiUrl}/models`;
        headers['Authorization'] = `Bearer ${actualApiKey}`;
      } else {
        // Default Gemini API
        endpoint = `https://generativelanguage.googleapis.com/v1beta/models?key=${actualApiKey}`;
        isGemini = true;
      }

      const response = await fetch(endpoint, { method: 'GET', headers });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      let models: string[] = [];

      if (isGemini) {
        if (data && data.models && Array.isArray(data.models)) {
          models = data.models.map((m: any) => m.name.replace('models/', ''));
        }
      } else {
        if (data && data.data && Array.isArray(data.data)) {
          models = data.data.map((m: any) => m.id);
        }
      }

      if (models.length > 0) {
        setFetchedModels(models);
        setLogs(prev => [...prev, `> Success: 成功拉取 ${models.length} 个模型`, `> 请在上方下拉框中选择模型`]);
        if (!models.includes(model)) {
          setModel(models[0]);
        }
      } else {
        throw new Error('未找到模型或返回格式不正确');
      }
    } catch (error: any) {
      setLogs(prev => [...prev, `> Error: ${error.message}`]);
    }
  };

  return (
    <div className="w-full h-full bg-neutral-50 flex flex-col pt-12">
      <div className="h-12 flex items-center justify-between px-2 bg-white border-b border-neutral-200 shrink-0">
        <button onClick={onBack} className="text-blue-500 p-2 active:opacity-70 flex items-center">
          <ChevronLeft size={24} />
          <span className="text-[15px] -ml-1">桌面</span>
        </button>
        <h1 className="font-semibold text-neutral-900 text-[15px]">接口与人设</h1>
        <div className="w-16"></div> {/* Spacer */}
      </div>

      <div className="flex-1 p-4 overflow-y-auto">
        <div className="bg-white rounded-2xl shadow-sm border border-neutral-100 p-5 space-y-6">
          
          <div className="flex items-center gap-2 text-neutral-700">
            <Settings size={20} className="text-blue-400" />
            <h2 className="font-semibold text-[15px]">API 接口设置</h2>
          </div>

          <div className="space-y-2">
            <label className="text-[11px] font-medium text-neutral-500 uppercase tracking-wider ml-1">API URL</label>
            <input 
              type="text" 
              value={apiUrl}
              onChange={(e) => setApiUrl(e.target.value)}
              className="w-full bg-neutral-50 border border-neutral-200 rounded-xl px-4 py-3 outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 text-[13px] text-neutral-800"
              placeholder="留空则使用默认 Gemini API"
            />
          </div>

          <div className="space-y-2">
            <label className="text-[11px] font-medium text-neutral-500 uppercase tracking-wider ml-1">API KEY</label>
            <input 
              type="password" 
              value={apiKey}
              onChange={(e) => setApiKey(e.target.value)}
              className="w-full bg-neutral-50 border border-neutral-200 rounded-xl px-4 py-3 outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 text-[13px] text-neutral-800 tracking-widest"
              placeholder="留空则使用系统自带 Key"
            />
          </div>

          <div className="flex gap-3">
            <button 
              onClick={handleSave}
              className="flex-1 bg-neutral-100 text-neutral-700 font-medium py-3 rounded-xl active:bg-neutral-200 transition-colors text-[13px]"
            >
              保存
            </button>
            <button 
              onClick={handleFetchModels}
              className="flex-[2] bg-blue-500 text-white font-medium py-3 rounded-xl active:bg-blue-600 transition-colors shadow-sm shadow-blue-500/30 text-[13px]"
            >
              拉取模型清单
            </button>
          </div>

          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <label className="text-[11px] font-medium text-neutral-500 uppercase tracking-wider ml-1">选择模型</label>
              {fetchedModels.length > 0 && (
                <button onClick={() => setFetchedModels([])} className="text-[10px] text-blue-500 active:opacity-70">手动输入</button>
              )}
            </div>
            {fetchedModels.length > 0 ? (
              <select 
                value={model}
                onChange={(e) => setModel(e.target.value)}
                className="w-full bg-neutral-50 border border-neutral-200 rounded-xl px-4 py-3 outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 text-[13px] text-neutral-800 appearance-none"
              >
                {fetchedModels.map(m => (
                  <option key={m} value={m}>{m}</option>
                ))}
              </select>
            ) : (
              <input 
                type="text" 
                value={model}
                onChange={(e) => setModel(e.target.value)}
                className="w-full bg-neutral-50 border border-neutral-200 rounded-xl px-4 py-3 outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 text-[13px] text-neutral-800"
                placeholder="gemini-3-flash-preview"
              />
            )}
          </div>

          <div className="space-y-2 pt-2">
            <label className="text-[11px] font-medium text-neutral-500 ml-1">发散度 Temperature ({temperature.toFixed(2)})</label>
            <input 
              type="range" 
              min="0" max="2" step="0.05"
              value={temperature}
              onChange={(e) => setTemperature(parseFloat(e.target.value))}
              className="w-full accent-blue-500 h-1.5 bg-neutral-200 rounded-lg appearance-none cursor-pointer"
            />
            <p className="text-[10px] text-neutral-400 ml-1 mt-1">
              (值越大越跳跃活泼，越小越严谨)
            </p>
          </div>

          <div className="space-y-2 pt-4">
            <label className="text-[11px] font-medium text-neutral-500 ml-1">终端日志</label>
            <div className="w-full h-32 bg-black rounded-xl p-4 overflow-y-auto font-mono text-[11px] text-green-400 leading-relaxed shadow-inner">
              {logs.map((log, i) => (
                <div key={i}>{log}</div>
              ))}
              <div ref={logsEndRef} className="animate-pulse">_</div>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
