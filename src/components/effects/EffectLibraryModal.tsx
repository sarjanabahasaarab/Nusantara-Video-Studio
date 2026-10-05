/**
 * Nusantara Video Studio - Effect Library Modal
 * Phase 4: Advanced Effects & Motion Engine
 *
 * Categorized picker dialog for 20+ effects across Color, Blur, Stylize,
 * Distortion, and Transform.
 */

import React, { useState } from 'react';
import { Modal } from '../common/Modal';
import { EFFECT_DEFINITIONS, EffectDefinition } from '../../engine/effects/EffectLibrary';
import { Sparkles, Search, Plus, Sliders, Eye, Sun, Droplets, Wand2, Compass } from 'lucide-react';

interface EffectLibraryModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectEffect: (type: string) => void;
}

export const EffectLibraryModal: React.FC<EffectLibraryModalProps> = ({
  isOpen,
  onClose,
  onSelectEffect,
}) => {
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');

  const categories = [
    { id: 'all', label: 'All Effects', icon: <Sparkles className="w-3.5 h-3.5" /> },
    { id: 'color', label: 'Color', icon: <Sun className="w-3.5 h-3.5" /> },
    { id: 'blur', label: 'Blur', icon: <Droplets className="w-3.5 h-3.5" /> },
    { id: 'stylize', label: 'Stylize', icon: <Wand2 className="w-3.5 h-3.5" /> },
    { id: 'distortion', label: 'Distortion', icon: <Compass className="w-3.5 h-3.5" /> },
    { id: 'transform', label: 'Transform', icon: <Sliders className="w-3.5 h-3.5" /> },
  ];

  const filteredEffects = EFFECT_DEFINITIONS.filter((eff) => {
    const matchesCat = selectedCategory === 'all' || eff.category === selectedCategory;
    const matchesQuery =
      eff.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      eff.description.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCat && matchesQuery;
  });

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Effect Library"
      subtitle="Pilih efek visual untuk ditambahkan ke stack clip terpilih"
      maxWidth="max-w-2xl"
    >
      <div className="flex flex-col gap-4 text-xs select-none">
        {/* Search & Categories Bar */}
        <div className="flex items-center justify-between gap-3">
          <div className="flex-1 relative">
            <Search className="w-3.5 h-3.5 text-slate-500 absolute left-2.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Cari efek visual (e.g. Blur, Vignette, Glow)..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-[#0d0f15] border border-[#212738] rounded-lg pl-8 pr-3 py-1.5 text-slate-200 placeholder-slate-500 focus:outline-none focus:border-blue-500"
            />
          </div>
        </div>

        {/* Category Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 border-b border-[#1e2332]">
          {categories.map((c) => (
            <button
              key={c.id}
              onClick={() => setSelectedCategory(c.id)}
              className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-medium transition-colors shrink-0 ${
                selectedCategory === c.id
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'bg-[#151924] text-slate-400 hover:text-slate-200 hover:bg-[#1c2233]'
              }`}
            >
              {c.icon}
              <span>{c.label}</span>
            </button>
          ))}
        </div>

        {/* Effect Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 max-h-80 overflow-y-auto pr-1">
          {filteredEffects.map((eff) => (
            <div
              key={eff.type}
              onClick={() => {
                onSelectEffect(eff.type);
                onClose();
              }}
              className="group p-3 bg-[#11141e] hover:bg-[#181d2c] border border-[#21283a] hover:border-blue-500/50 rounded-xl cursor-pointer transition-all flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-[10px] font-mono uppercase tracking-wider text-blue-400 font-semibold">
                    {eff.category}
                  </span>
                  <div className="w-5 h-5 rounded-md bg-[#192033] group-hover:bg-blue-600 flex items-center justify-center text-slate-400 group-hover:text-white transition-colors">
                    <Plus className="w-3 h-3" />
                  </div>
                </div>
                <h4 className="text-xs font-semibold text-slate-200 group-hover:text-white mb-1">
                  {eff.name}
                </h4>
                <p className="text-[10px] text-slate-400 line-clamp-2 leading-relaxed">
                  {eff.description}
                </p>
              </div>

              <div className="mt-3 pt-2 border-t border-[#1c2333] flex items-center justify-between text-[10px] text-slate-500">
                <span>{eff.parameters.length} parameter</span>
                <span className="text-blue-400 opacity-0 group-hover:opacity-100 font-medium transition-opacity">
                  + Terapkan
                </span>
              </div>
            </div>
          ))}

          {filteredEffects.length === 0 && (
            <div className="col-span-3 py-8 text-center text-slate-500 text-xs">
              Tidak ada efek yang cocok dengan pencarian Anda.
            </div>
          )}
        </div>
      </div>
    </Modal>
  );
};
