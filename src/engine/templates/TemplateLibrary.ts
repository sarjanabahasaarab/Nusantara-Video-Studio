/**
 * Nusantara Video Studio - Text & Graphics Template Library Engine
 * Phase 5: Professional Text, Subtitle & Graphics Studio
 *
 * Provides factory presets for:
 * - Basic Titles (Simple, Center, Minimal, Bold)
 * - Modern Titles (Modern Intro, Clean Corporate, Cinematic, Documentary)
 * - Lower Thirds (Name & Position, Speaker Name, Interview Label, News Lower Third)
 * - Social Media (YouTube Title, Instagram Caption, TikTok Title, Short Video Caption)
 * - Credits (End Credits, Rolling Credits, Production Credits)
 * Plus custom user template creation, storage, renaming, deletion, and application.
 */

import { Clip, ClipTextProperties, GraphicLayer } from '../../types';

export type TemplateCategory =
  | 'basic-titles'
  | 'modern-titles'
  | 'lower-thirds'
  | 'social-media'
  | 'credits'
  | 'custom';

export interface TextTemplate {
  id: string;
  name: string;
  category: TemplateCategory;
  description: string;
  isUserTemplate?: boolean;
  duration: number; // default duration in seconds
  textProps: ClipTextProperties;
  transform?: {
    positionX: number;
    positionY: number;
    scaleX: number;
    scaleY: number;
    rotation: number;
    opacity: number;
  };
  graphicLayers?: GraphicLayer[];
}

export const BUILTIN_TEMPLATES: TextTemplate[] = [
  // 1. Basic Titles
  {
    id: 'tmpl-basic-simple',
    name: 'Simple Title',
    category: 'basic-titles',
    description: 'Judul sederhana bersih dengan font sans-serif modern.',
    duration: 5,
    textProps: {
      text: 'SIMPLE TITLE',
      fontFamily: 'Inter',
      fontSize: 54,
      fontWeight: 600,
      color: '#ffffff',
      alignment: 'center',
      outlineWidth: 0,
      shadowBlur: 8,
      shadowColor: '#000000',
    },
    transform: { positionX: 0, positionY: 0, scaleX: 1, scaleY: 1, rotation: 0, opacity: 1 },
  },
  {
    id: 'tmpl-basic-center',
    name: 'Center Title',
    category: 'basic-titles',
    description: 'Judul tengah berlatar gelap elegan.',
    duration: 6,
    textProps: {
      text: 'NUSANTARA ARCHIPELAGO',
      fontFamily: 'Montserrat',
      fontSize: 48,
      fontWeight: 700,
      color: '#f8fafc',
      backgroundColor: 'rgba(15, 23, 42, 0.75)',
      backgroundOpacity: 0.75,
      alignment: 'center',
      outlineWidth: 2,
      outlineColor: '#0284c7',
      shadowBlur: 14,
      shadowColor: '#000000',
      padding: 16,
    },
    transform: { positionX: 0, positionY: 0, scaleX: 1, scaleY: 1, rotation: 0, opacity: 1 },
  },
  {
    id: 'tmpl-basic-minimal',
    name: 'Minimal Title',
    category: 'basic-titles',
    description: 'Tipografi tipis minimalis dengan spasi huruf lebar.',
    duration: 5,
    textProps: {
      text: 'THE ESSENCE OF CREATION',
      fontFamily: 'Inter',
      fontSize: 36,
      fontWeight: 300,
      letterSpacing: 6,
      color: '#e2e8f0',
      alignment: 'center',
      shadowBlur: 4,
      shadowColor: '#000000',
    },
    transform: { positionX: 0, positionY: 0, scaleX: 1, scaleY: 1, rotation: 0, opacity: 1 },
  },
  {
    id: 'tmpl-basic-bold',
    name: 'Bold Title',
    category: 'basic-titles',
    description: 'Judul tebal berkarakter tegas dan kontras tinggi.',
    duration: 5,
    textProps: {
      text: 'BREAKTHROUGH',
      fontFamily: 'Impact',
      fontSize: 68,
      fontWeight: 900,
      letterSpacing: 2,
      color: '#facc15',
      outlineWidth: 3,
      outlineColor: '#000000',
      shadowBlur: 16,
      shadowColor: '#000000',
      alignment: 'center',
    },
    transform: { positionX: 0, positionY: 0, scaleX: 1, scaleY: 1, rotation: 0, opacity: 1 },
  },

  // 2. Modern Titles
  {
    id: 'tmpl-modern-intro',
    name: 'Modern Intro',
    category: 'modern-titles',
    description: 'Pembuka video modern dengan aksen warna cyan & biru.',
    duration: 6,
    textProps: {
      text: 'EPISODE 01\nJOURNEY TO INDONESIA',
      fontFamily: 'Montserrat',
      fontSize: 50,
      fontWeight: 800,
      lineHeight: 1.25,
      color: '#38bdf8',
      alignment: 'center',
      shadowBlur: 18,
      shadowColor: '#0369a1',
    },
    transform: { positionX: 0, positionY: 0, scaleX: 1, scaleY: 1, rotation: 0, opacity: 1 },
  },
  {
    id: 'tmpl-modern-corporate',
    name: 'Clean Corporate',
    category: 'modern-titles',
    description: 'Gaya presentasi bisnis korporat bersih dan profesional.',
    duration: 6,
    textProps: {
      text: 'ANNUAL PERFORMANCE REPORT\nPT Nusantara Digital Internasional',
      fontFamily: 'Roboto',
      fontSize: 42,
      fontWeight: 600,
      lineHeight: 1.3,
      color: '#ffffff',
      backgroundColor: 'rgba(23, 37, 84, 0.85)',
      backgroundOpacity: 0.85,
      alignment: 'center',
      outlineWidth: 1,
      outlineColor: '#3b82f6',
      padding: 20,
    },
    transform: { positionX: 0, positionY: 0, scaleX: 1, scaleY: 1, rotation: 0, opacity: 1 },
  },
  {
    id: 'tmpl-modern-cinematic',
    name: 'Cinematic Title',
    category: 'modern-titles',
    description: 'Gaya film sinematik dengan font serif mewah dan spasi lebar.',
    duration: 7,
    textProps: {
      text: 'WARISAN NUSANTARA',
      fontFamily: 'Playfair Display',
      fontSize: 56,
      fontWeight: 700,
      letterSpacing: 8,
      color: '#fef08a',
      alignment: 'center',
      shadowBlur: 20,
      shadowColor: '#78350f',
    },
    transform: { positionX: 0, positionY: 0, scaleX: 1, scaleY: 1, rotation: 0, opacity: 1 },
  },
  {
    id: 'tmpl-modern-doc',
    name: 'Documentary Title',
    category: 'modern-titles',
    description: 'Judul dokumenter alam dan budaya dengan garis aksen elegan.',
    duration: 6,
    textProps: {
      text: 'EXPEDITION: RAJA AMPAT\nA National Heritage Document',
      fontFamily: 'Georgia',
      fontSize: 44,
      lineHeight: 1.4,
      color: '#f1f5f9',
      alignment: 'center',
      shadowBlur: 10,
      shadowColor: '#0f172a',
    },
    transform: { positionX: 0, positionY: 0, scaleX: 1, scaleY: 1, rotation: 0, opacity: 1 },
  },

  // 3. Lower Thirds
  {
    id: 'tmpl-lower-name-pos',
    name: 'Name and Position',
    category: 'lower-thirds',
    description: 'Format nama lengkap dan jabatan narasumber di kiri bawah.',
    duration: 6,
    textProps: {
      text: 'Bambang Soedirman\nKepala Balai Konservasi Borobudur',
      fontFamily: 'Inter',
      fontSize: 26,
      lineHeight: 1.3,
      fontWeight: 600,
      color: '#38bdf8',
      backgroundColor: 'rgba(15, 23, 42, 0.85)',
      backgroundOpacity: 0.85,
      alignment: 'left',
      padding: 12,
      shadowBlur: 8,
      shadowColor: '#000000',
    },
    transform: { positionX: -260, positionY: 260, scaleX: 1, scaleY: 1, rotation: 0, opacity: 1 },
  },
  {
    id: 'tmpl-lower-speaker',
    name: 'Speaker Name',
    category: 'lower-thirds',
    description: 'Label pembicara seminar atau webinar dengan border aksen.',
    duration: 6,
    textProps: {
      text: 'Dr. Anisa Rahmawati, M.T.\nKeynote Speaker — AI & Media Technology',
      fontFamily: 'Poppins',
      fontSize: 24,
      lineHeight: 1.35,
      color: '#ffffff',
      backgroundColor: 'rgba(88, 28, 135, 0.85)',
      backgroundOpacity: 0.85,
      alignment: 'left',
      padding: 14,
      outlineWidth: 2,
      outlineColor: '#a855f7',
      shadowBlur: 10,
      shadowColor: '#000000',
    },
    transform: { positionX: -240, positionY: 270, scaleX: 1, scaleY: 1, rotation: 0, opacity: 1 },
  },
  {
    id: 'tmpl-lower-interview',
    name: 'Interview Label',
    category: 'lower-thirds',
    description: 'Label wawancara dengan lokasi dan topik bahasan.',
    duration: 6,
    textProps: {
      text: 'I Gede Wayan\nSeniman Ukir • Gianyar, Bali',
      fontFamily: 'Montserrat',
      fontSize: 26,
      lineHeight: 1.3,
      color: '#facc15',
      backgroundColor: 'rgba(20, 20, 25, 0.9)',
      backgroundOpacity: 0.9,
      alignment: 'left',
      padding: 12,
      shadowBlur: 8,
      shadowColor: '#000000',
    },
    transform: { positionX: -280, positionY: 260, scaleX: 1, scaleY: 1, rotation: 0, opacity: 1 },
  },
  {
    id: 'tmpl-lower-news',
    name: 'News Lower Third',
    category: 'lower-thirds',
    description: 'Format berita televisi dengan headline berita terkini.',
    duration: 8,
    textProps: {
      text: 'BREAKING NEWS: FESTIVAL BUDAYA NUSANTARA 2026 RESMI DIBUKA\nRibuan Pengunjung Padati Kawasan Monas Jakarta Pusat',
      fontFamily: 'Arial',
      fontSize: 22,
      lineHeight: 1.25,
      fontWeight: 700,
      color: '#ffffff',
      backgroundColor: 'rgba(185, 28, 28, 0.92)',
      backgroundOpacity: 0.92,
      alignment: 'left',
      padding: 12,
      outlineWidth: 1,
      outlineColor: '#fca5a5',
      shadowBlur: 8,
      shadowColor: '#000000',
    },
    transform: { positionX: 0, positionY: 300, scaleX: 1, scaleY: 1, rotation: 0, opacity: 1 },
  },

  // 4. Social Media
  {
    id: 'tmpl-social-yt',
    name: 'YouTube Title',
    category: 'social-media',
    description: 'Judul konten YouTube eye-catching dengan shadow tebal.',
    duration: 6,
    textProps: {
      text: 'CARA EDIT VIDEO SEPERTI PRO DI NUSANTARA STUDIO!',
      fontFamily: 'Impact',
      fontSize: 44,
      color: '#ffffff',
      backgroundColor: 'rgba(220, 38, 38, 0.95)',
      backgroundOpacity: 0.95,
      alignment: 'center',
      outlineWidth: 2,
      outlineColor: '#000000',
      shadowBlur: 14,
      shadowColor: '#000000',
      padding: 14,
    },
    transform: { positionX: 0, positionY: -180, scaleX: 1, scaleY: 1, rotation: 0, opacity: 1 },
  },
  {
    id: 'tmpl-social-ig',
    name: 'Instagram Caption',
    category: 'social-media',
    description: 'Caption bersih elegan untuk reels dan feed Instagram.',
    duration: 5,
    textProps: {
      text: 'Keindahan alam Indonesia yang tak pernah habis dieksplorasi. ✨\n#Nusantara #PesonaIndonesia',
      fontFamily: 'Inter',
      fontSize: 24,
      lineHeight: 1.4,
      color: '#ffffff',
      backgroundColor: 'rgba(0, 0, 0, 0.65)',
      backgroundOpacity: 0.65,
      alignment: 'center',
      padding: 12,
      shadowBlur: 6,
      shadowColor: '#000000',
    },
    transform: { positionX: 0, positionY: 220, scaleX: 1, scaleY: 1, rotation: 0, opacity: 1 },
  },
  {
    id: 'tmpl-social-tiktok',
    name: 'TikTok Title',
    category: 'social-media',
    description: 'Teks viral bold kuning dengan outline hitam kontras.',
    duration: 4,
    textProps: {
      text: 'JANGAN LEWATKAN INI! 😱🔥',
      fontFamily: 'Impact',
      fontSize: 46,
      color: '#facc15',
      outlineWidth: 3,
      outlineColor: '#000000',
      alignment: 'center',
      shadowBlur: 12,
      shadowColor: '#000000',
    },
    transform: { positionX: 0, positionY: -160, scaleX: 1, scaleY: 1, rotation: 0, opacity: 1 },
  },
  {
    id: 'tmpl-social-short',
    name: 'Short Video Caption',
    category: 'social-media',
    description: 'Caption tengah untuk format video vertikal atau landscape.',
    duration: 5,
    textProps: {
      text: 'Tips Kilat Video Editing: Selalu perhatikan Safe Area!',
      fontFamily: 'Poppins',
      fontSize: 26,
      color: '#38bdf8',
      backgroundColor: 'rgba(15, 23, 42, 0.85)',
      alignment: 'center',
      padding: 10,
    },
    transform: { positionX: 0, positionY: 200, scaleX: 1, scaleY: 1, rotation: 0, opacity: 1 },
  },

  // 5. Credits
  {
    id: 'tmpl-credits-end',
    name: 'End Credits',
    category: 'credits',
    description: 'Daftar nama kru dan ucapan terima kasih akhir video.',
    duration: 10,
    textProps: {
      text: 'SELESAI\n\nSutradara: Tim Nusantara Studio\nEditor: Video Director\nKamera: Drone & Cinema Unit\nMusik: Gamelan Nusantara Orchestra\n\nTerima kasih telah menonton.',
      fontFamily: 'Inter',
      fontSize: 24,
      lineHeight: 1.6,
      color: '#cbd5e1',
      alignment: 'center',
      shadowBlur: 8,
      shadowColor: '#000000',
    },
    transform: { positionX: 0, positionY: 0, scaleX: 1, scaleY: 1, rotation: 0, opacity: 1 },
  },
  {
    id: 'tmpl-credits-rolling',
    name: 'Rolling Credits',
    category: 'credits',
    description: 'Format kredit bergulir formal untuk film pendek atau dokumenter.',
    duration: 12,
    textProps: {
      text: 'NUSANTARA FILM PRODUCTIONS\n\nProduser Eksekutif\nADRIAN PRATAMA\n\nPenata Kamera\nRIZKY SAPUTRA\n\nPenata Artistik\nDEWI KUSUMA\n\nSound Engineer\nHENDRA KURNIAWAN',
      fontFamily: 'Roboto',
      fontSize: 24,
      lineHeight: 1.5,
      fontWeight: 500,
      color: '#f8fafc',
      alignment: 'center',
      shadowBlur: 6,
      shadowColor: '#000000',
    },
    transform: { positionX: 0, positionY: 0, scaleX: 1, scaleY: 1, rotation: 0, opacity: 1 },
  },
  {
    id: 'tmpl-credits-production',
    name: 'Production Credits',
    category: 'credits',
    description: 'Logo rumah produksi dan copyright tahun rilis.',
    duration: 6,
    textProps: {
      text: 'DIPRODUKSI OLEH\nNUSANTARA CREATIVE MEDIA LABS\nJAKARTA • INDONESIA\n© 2026 Hak Cipta Dilindungi Undang-Undang',
      fontFamily: 'Inter',
      fontSize: 22,
      letterSpacing: 2,
      lineHeight: 1.6,
      color: '#94a3b8',
      alignment: 'center',
      shadowBlur: 6,
      shadowColor: '#000000',
    },
    transform: { positionX: 0, positionY: 0, scaleX: 1, scaleY: 1, rotation: 0, opacity: 1 },
  },
];

const STORAGE_KEY_USER_TEMPLATES = 'nvs_user_templates_v5';

export class TemplateLibrary {
  /**
   * Get all builtin + user custom templates
   */
  static getAllTemplates(): TextTemplate[] {
    const userTemplates = this.getUserTemplates();
    return [...BUILTIN_TEMPLATES, ...userTemplates];
  }

  /**
   * Get templates filtered by category
   */
  static getTemplatesByCategory(category: TemplateCategory | 'all'): TextTemplate[] {
    const all = this.getAllTemplates();
    if (category === 'all') return all;
    return all.filter((t) => t.category === category);
  }

  /**
   * Get User Saved Templates
   */
  static getUserTemplates(): TextTemplate[] {
    try {
      const raw = localStorage.getItem(STORAGE_KEY_USER_TEMPLATES);
      if (!raw) return [];
      return JSON.parse(raw);
    } catch {
      return [];
    }
  }

  /**
   * Save a new custom user template
   */
  static saveUserTemplate(template: Omit<TextTemplate, 'id' | 'isUserTemplate'>): TextTemplate {
    const newTmpl: TextTemplate = {
      ...template,
      id: `tmpl-user-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      isUserTemplate: true,
      category: 'custom',
    };

    const current = this.getUserTemplates();
    const updated = [newTmpl, ...current];
    try {
      localStorage.setItem(STORAGE_KEY_USER_TEMPLATES, JSON.stringify(updated));
    } catch (err) {
      console.warn('Failed to save user template to localStorage', err);
    }
    return newTmpl;
  }

  /**
   * Rename an existing user template
   */
  static renameUserTemplate(id: string, newName: string): boolean {
    const current = this.getUserTemplates();
    const target = current.find((t) => t.id === id);
    if (!target) return false;

    target.name = newName;
    try {
      localStorage.setItem(STORAGE_KEY_USER_TEMPLATES, JSON.stringify(current));
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Delete a custom user template
   */
  static deleteUserTemplate(id: string): boolean {
    const current = this.getUserTemplates();
    const updated = current.filter((t) => t.id !== id);
    try {
      localStorage.setItem(STORAGE_KEY_USER_TEMPLATES, JSON.stringify(updated));
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Convert a clip into a reusable template
   */
  static createTemplateFromClip(clip: Clip, templateName: string): TextTemplate | null {
    if (clip.type !== 'text' || !clip.textProps) return null;

    return this.saveUserTemplate({
      name: templateName || clip.name || 'Custom Title Template',
      category: 'custom',
      description: `Disimpan dari clip "${clip.name}"`,
      duration: clip.duration || 5,
      textProps: JSON.parse(JSON.stringify(clip.textProps)),
      transform: clip.transform
        ? {
            positionX: clip.transform.positionX || 0,
            positionY: clip.transform.positionY || 0,
            scaleX: clip.transform.scaleX ?? 1,
            scaleY: clip.transform.scaleY ?? 1,
            rotation: clip.transform.rotation || 0,
            opacity: clip.transform.opacity ?? 1,
          }
        : undefined,
    });
  }
}
