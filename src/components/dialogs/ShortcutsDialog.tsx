/**
 * Nusantara Video Studio - Keyboard Shortcuts Reference Dialog
 */

import React from 'react';
import { Modal } from '../common/Modal';
import { useUIStore } from '../../stores/uiStore';
import { Keyboard } from 'lucide-react';

export const ShortcutsDialog: React.FC = () => {
  const activeDialog = useUIStore((s) => s.activeDialog);
  const closeDialog = useUIStore((s) => s.closeDialog);

  const isOpen = activeDialog === 'shortcuts';

  const shortcutGroups = [
    {
      group: 'Project & File',
      items: [
        { key: 'Ctrl + N', label: 'Create New Project' },
        { key: 'Ctrl + O', label: 'Open .nvproj Project File' },
        { key: 'Ctrl + S', label: 'Save Project' },
      ],
    },
    {
      group: 'Editing & Timeline',
      items: [
        { key: 'Ctrl + Z', label: 'Undo Last Action' },
        { key: 'Ctrl + Shift + Z', label: 'Redo Action' },
        { key: 'Ctrl + B', label: 'Split Clip at Playhead' },
        { key: 'Delete / Backspace', label: 'Delete Selected Clip' },
        { key: 'Ctrl + X', label: 'Cut Clip (Phase 3 & 4)' },
        { key: 'Ctrl + C', label: 'Copy Clip (Phase 3 & 4)' },
        { key: 'Ctrl + V', label: 'Paste Clip (Phase 3 & 4)' },
      ],
    },
    {
      group: 'Playback & Navigation',
      items: [
        { key: 'Space', label: 'Play / Pause Video' },
        { key: 'Ctrl + =', label: 'Zoom In Timeline' },
        { key: 'Ctrl + -', label: 'Zoom Out Timeline' },
        { key: 'F11', label: 'Toggle Fullscreen Editor' },
      ],
    },
  ];

  return (
    <Modal
      isOpen={isOpen}
      onClose={closeDialog}
      title="Keyboard Shortcuts"
      subtitle="Pintasan keyboard Nusantara Video Studio"
      maxWidth="max-w-lg"
    >
      <div className="flex flex-col gap-4">
        {shortcutGroups.map((g) => (
          <div key={g.group} className="flex flex-col gap-1.5">
            <h4 className="text-[11px] font-semibold text-slate-300 uppercase tracking-wider">
              {g.group}
            </h4>
            <div className="bg-[#0f1118] border border-[#212737] rounded-lg divide-y divide-[#1e2332] overflow-hidden text-xs">
              {g.items.map((it) => (
                <div key={it.key} className="flex items-center justify-between px-3 py-2">
                  <span className="text-slate-300">{it.label}</span>
                  <kbd className="px-2 py-0.5 bg-[#1b202c] border border-[#2c3447] rounded text-[11px] font-mono text-cyan-400 font-semibold shadow-inner">
                    {it.key}
                  </kbd>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </Modal>
  );
};
