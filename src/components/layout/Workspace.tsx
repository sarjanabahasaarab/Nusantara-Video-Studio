/**
 * Nusantara Video Studio - Main Workspace
 * Composes Sidebar, Video Preview, Properties Panel, and Timeline with resizable split handles
 */

import React from 'react';
import { Sidebar } from '../sidebar/Sidebar';
import { VideoPreview } from '../preview/VideoPreview';
import { PropertiesPanel } from '../properties/PropertiesPanel';
import { Timeline } from '../timeline/Timeline';
import { useUIStore } from '../../stores/uiStore';

export const Workspace: React.FC = () => {
  const sidebarOpen = useUIStore((s) => s.sidebarOpen);
  const sidebarWidth = useUIStore((s) => s.sidebarWidth);
  const setSidebarWidth = useUIStore((s) => s.setSidebarWidth);
  const propertiesWidth = useUIStore((s) => s.propertiesWidth);
  const setPropertiesWidth = useUIStore((s) => s.setPropertiesWidth);

  // Left sidebar horizontal resize drag
  const handleSidebarResize = (e: React.PointerEvent) => {
    e.preventDefault();
    const startX = e.clientX;
    const initialWidth = sidebarWidth;

    const onPointerMove = (moveEvent: PointerEvent) => {
      const deltaX = moveEvent.clientX - startX;
      setSidebarWidth(initialWidth + deltaX);
    };

    const onPointerUp = () => {
      window.removeEventListener('pointermove', onPointerMove);
      window.removeEventListener('pointerup', onPointerUp);
    };

    window.addEventListener('pointermove', onPointerMove);
    window.addEventListener('pointerup', onPointerUp);
  };

  // Right properties horizontal resize drag
  const handlePropertiesResize = (e: React.PointerEvent) => {
    e.preventDefault();
    const startX = e.clientX;
    const initialWidth = propertiesWidth;

    const onPointerMove = (moveEvent: PointerEvent) => {
      const deltaX = startX - moveEvent.clientX; // dragging leftwards increases width
      setPropertiesWidth(initialWidth + deltaX);
    };

    const onPointerUp = () => {
      window.removeEventListener('pointermove', onPointerMove);
      window.removeEventListener('pointerup', onPointerUp);
    };

    window.addEventListener('pointermove', onPointerMove);
    window.addEventListener('pointerup', onPointerUp);
  };

  return (
    <div className="flex-1 flex flex-col overflow-hidden relative">
      {/* Top Half: Sidebar | Preview Monitor | Properties */}
      <div className="flex-1 flex overflow-hidden relative">
        {/* Left Sidebar */}
        <Sidebar />

        {/* Sidebar Drag Resizer Handle */}
        {sidebarOpen && (
          <div
            onPointerDown={handleSidebarResize}
            className="w-1.5 hover:bg-blue-500/50 cursor-ew-resize transition-colors z-20 shrink-0 relative flex items-center justify-center group"
          >
            <div className="h-8 w-0.5 bg-[#252b39] group-hover:bg-blue-400 rounded-full" />
          </div>
        )}

        {/* Center Preview Monitor */}
        <VideoPreview />

        {/* Properties Drag Resizer Handle */}
        <div
          onPointerDown={handlePropertiesResize}
          className="w-1.5 hover:bg-blue-500/50 cursor-ew-resize transition-colors z-20 shrink-0 relative flex items-center justify-center group"
        >
          <div className="h-8 w-0.5 bg-[#252b39] group-hover:bg-blue-400 rounded-full" />
        </div>

        {/* Right Properties Panel */}
        <PropertiesPanel />
      </div>

      {/* Bottom Half: Multi-track Timeline */}
      <Timeline />
    </div>
  );
};
