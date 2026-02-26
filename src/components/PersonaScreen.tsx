import React, { useState } from 'react';
import { ChevronLeft } from 'lucide-react';
import { Persona } from '../types';

interface Props {
  persona: Persona;
  onSave: (persona: Persona) => void;
  onBack: () => void;
}

export function PersonaScreen({ persona, onSave, onBack }: Props) {
  const [name, setName] = useState(persona.name);
  const [instructions, setInstructions] = useState(persona.instructions);

  const handleSave = () => {
    onSave({ name, instructions });
    onBack();
  };

  return (
    <div className="w-full h-full bg-neutral-50 flex flex-col pt-12">
      <div className="h-12 flex items-center justify-between px-2 bg-white border-b border-neutral-200 shrink-0">
        <button onClick={onBack} className="text-blue-500 p-2 active:opacity-70 flex items-center">
          <ChevronLeft size={24} />
          <span className="text-[15px] -ml-1">Back</span>
        </button>
        <h1 className="font-semibold text-neutral-900 text-[15px]">Persona</h1>
        <button onClick={handleSave} className="text-blue-500 font-semibold text-[15px] active:opacity-70 px-4">
          Save
        </button>
      </div>

      <div className="flex-1 p-4 overflow-y-auto space-y-6">
        <div className="space-y-2">
          <label className="text-[13px] font-medium text-neutral-500 ml-1 uppercase tracking-wide">Name</label>
          <input 
            type="text" 
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full bg-white border border-neutral-200 rounded-xl px-4 py-3 outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 text-[15px] text-neutral-900 shadow-sm"
          />
        </div>

        <div className="space-y-2">
          <label className="text-[13px] font-medium text-neutral-500 ml-1 uppercase tracking-wide">System Instructions</label>
          <textarea 
            value={instructions}
            onChange={(e) => setInstructions(e.target.value)}
            className="w-full h-48 bg-white border border-neutral-200 rounded-xl px-4 py-3 outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 resize-none text-[15px] text-neutral-900 leading-relaxed shadow-sm"
          />
        </div>
      </div>
    </div>
  );
}
