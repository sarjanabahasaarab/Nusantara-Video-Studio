/**
 * Nusantara Video Studio - Toast Notifications
 */

import React from 'react';
import { useUIStore } from '../../stores/uiStore';
import { AlertCircle, CheckCircle2, Info, TriangleAlert, X } from 'lucide-react';
import { NotificationType } from '../../types';

export const ToastContainer: React.FC = () => {
  const notifications = useUIStore((s) => s.notifications);
  const dismiss = useUIStore((s) => s.dismissNotification);

  if (notifications.length === 0) return null;

  const getIcon = (type: NotificationType) => {
    switch (type) {
      case 'success':
        return <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />;
      case 'error':
        return <AlertCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />;
      case 'warning':
        return <TriangleAlert className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />;
      case 'info':
      default:
        return <Info className="w-4 h-4 text-cyan-400 shrink-0 mt-0.5" />;
    }
  };

  const getBorderColor = (type: NotificationType) => {
    switch (type) {
      case 'success':
        return 'border-emerald-500/30 bg-emerald-950/40';
      case 'error':
        return 'border-rose-500/30 bg-rose-950/40';
      case 'warning':
        return 'border-amber-500/30 bg-amber-950/40';
      case 'info':
      default:
        return 'border-cyan-500/30 bg-slate-900/90';
    }
  };

  return (
    <div className="fixed bottom-4 right-4 z-50 flex flex-col gap-2 max-w-sm pointer-events-none">
      {notifications.map((notif) => (
        <div
          key={notif.id}
          className={`pointer-events-auto flex items-start gap-3 p-3 rounded-lg border shadow-xl backdrop-blur-md transition-all duration-200 text-xs ${getBorderColor(
            notif.type
          )}`}
        >
          {getIcon(notif.type)}
          <div className="flex-1 min-w-0">
            <h4 className="font-semibold text-slate-100">{notif.title}</h4>
            <p className="text-slate-300 mt-0.5 leading-relaxed break-words">{notif.message}</p>
          </div>
          <button
            onClick={() => dismiss(notif.id)}
            className="text-slate-400 hover:text-slate-200 p-0.5 rounded transition-colors"
            title="Tutup"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      ))}
    </div>
  );
};
