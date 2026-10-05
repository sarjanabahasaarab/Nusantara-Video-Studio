/**
 * Nusantara Video Studio - Font Manager Engine
 * Phase 5: Professional Text, Subtitle & Graphics Studio
 *
 * Provides curated system safe fonts, font weights, search, font preview,
 * recently used fonts & favorites (persisted in localStorage), and graceful
 * fallback handling with non-destructive warnings.
 */

export interface SystemFontDefinition {
  family: string;
  name: string;
  category: 'sans-serif' | 'serif' | 'display' | 'monospace' | 'handwriting';
  weights: number[];
  fallback: string;
}

export const SYSTEM_FONTS: SystemFontDefinition[] = [
  {
    family: 'Inter',
    name: 'Inter',
    category: 'sans-serif',
    weights: [300, 400, 500, 600, 700, 800, 900],
    fallback: 'system-ui, -apple-system, sans-serif',
  },
  {
    family: 'Roboto',
    name: 'Roboto',
    category: 'sans-serif',
    weights: [300, 400, 500, 700, 900],
    fallback: 'Arial, sans-serif',
  },
  {
    family: 'Montserrat',
    name: 'Montserrat',
    category: 'sans-serif',
    weights: [400, 500, 600, 700, 800],
    fallback: 'Helvetica, sans-serif',
  },
  {
    family: 'Poppins',
    name: 'Poppins',
    category: 'sans-serif',
    weights: [300, 400, 500, 600, 700, 800],
    fallback: 'Arial, sans-serif',
  },
  {
    family: 'Open Sans',
    name: 'Open Sans',
    category: 'sans-serif',
    weights: [300, 400, 600, 700, 800],
    fallback: 'Helvetica, Arial, sans-serif',
  },
  {
    family: 'Arial',
    name: 'Arial',
    category: 'sans-serif',
    weights: [400, 700],
    fallback: 'sans-serif',
  },
  {
    family: 'Helvetica',
    name: 'Helvetica',
    category: 'sans-serif',
    weights: [400, 700],
    fallback: 'Arial, sans-serif',
  },
  {
    family: 'Trebuchet MS',
    name: 'Trebuchet MS',
    category: 'sans-serif',
    weights: [400, 700],
    fallback: 'sans-serif',
  },
  {
    family: 'Impact',
    name: 'Impact (Title & Meme)',
    category: 'display',
    weights: [400, 900],
    fallback: 'Charcoal, sans-serif',
  },
  {
    family: 'Oswald',
    name: 'Oswald',
    category: 'display',
    weights: [400, 500, 600, 700],
    fallback: 'Impact, sans-serif',
  },
  {
    family: 'Bebas Neue',
    name: 'Bebas Neue',
    category: 'display',
    weights: [400, 700],
    fallback: 'Impact, sans-serif',
  },
  {
    family: 'Times New Roman',
    name: 'Times New Roman',
    category: 'serif',
    weights: [400, 700],
    fallback: 'serif',
  },
  {
    family: 'Georgia',
    name: 'Georgia',
    category: 'serif',
    weights: [400, 700],
    fallback: 'serif',
  },
  {
    family: 'Playfair Display',
    name: 'Playfair Display',
    category: 'serif',
    weights: [400, 600, 700, 800],
    fallback: 'Georgia, serif',
  },
  {
    family: 'Courier New',
    name: 'Courier New',
    category: 'monospace',
    weights: [400, 700],
    fallback: 'monospace',
  },
];

const STORAGE_KEY_RECENT = 'nvs_recent_fonts';
const STORAGE_KEY_FAVORITES = 'nvs_favorite_fonts';

export class FontManager {
  /**
   * Returns all available fonts
   */
  static getAvailableFonts(): SystemFontDefinition[] {
    return SYSTEM_FONTS;
  }

  /**
   * Search fonts by name or category
   */
  static searchFonts(query: string): SystemFontDefinition[] {
    if (!query) return SYSTEM_FONTS;
    const lower = query.toLowerCase().trim();
    return SYSTEM_FONTS.filter(
      (f) => f.name.toLowerCase().includes(lower) || f.category.toLowerCase().includes(lower)
    );
  }

  /**
   * Get Recently used fonts from localStorage
   */
  static getRecentFonts(): string[] {
    try {
      const raw = localStorage.getItem(STORAGE_KEY_RECENT);
      if (!raw) return ['Inter', 'Montserrat', 'Impact'];
      return JSON.parse(raw);
    } catch {
      return ['Inter', 'Montserrat', 'Impact'];
    }
  }

  /**
   * Add a font to recently used list
   */
  static addRecentFont(fontFamily: string): void {
    try {
      const recents = this.getRecentFonts().filter((f) => f !== fontFamily);
      recents.unshift(fontFamily);
      const capped = recents.slice(0, 8);
      localStorage.setItem(STORAGE_KEY_RECENT, JSON.stringify(capped));
    } catch {
      // Storage unavailable or disabled
    }
  }

  /**
   * Get Favorite fonts
   */
  static getFavoriteFonts(): string[] {
    try {
      const raw = localStorage.getItem(STORAGE_KEY_FAVORITES);
      if (!raw) return ['Inter', 'Impact'];
      return JSON.parse(raw);
    } catch {
      return ['Inter', 'Impact'];
    }
  }

  /**
   * Toggle favorite font
   */
  static toggleFavoriteFont(fontFamily: string): boolean {
    try {
      const favs = this.getFavoriteFonts();
      let updated: string[];
      let isFav = false;
      if (favs.includes(fontFamily)) {
        updated = favs.filter((f) => f !== fontFamily);
        isFav = false;
      } else {
        updated = [...favs, fontFamily];
        isFav = true;
      }
      localStorage.setItem(STORAGE_KEY_FAVORITES, JSON.stringify(updated));
      return isFav;
    } catch {
      return false;
    }
  }

  /**
   * Check if a font family is available in curated list
   */
  static isFontAvailable(fontFamily: string): boolean {
    return SYSTEM_FONTS.some((f) => f.family.toLowerCase() === fontFamily.toLowerCase());
  }

  /**
   * Resolve safe fallback font name if given font is not present
   */
  static resolveSafeFont(fontFamily: string): string {
    const found = SYSTEM_FONTS.find((f) => f.family.toLowerCase() === fontFamily.toLowerCase());
    return found ? found.family : 'Inter';
  }

  /**
   * Resolve safe CSS font-family string with fallback.
   * If font not in system library, returns fallback and warns without crash.
   */
  static resolveFontFamily(fontFamily: string): { cssFont: string; isFallback: boolean; warning?: string } {
    const found = SYSTEM_FONTS.find((f) => f.family.toLowerCase() === fontFamily.toLowerCase());
    if (found) {
      return {
        cssFont: `"${found.family}", ${found.fallback}`,
        isFallback: false,
      };
    }

    // Font not found in curated library - provide safe fallback
    return {
      cssFont: `"${fontFamily}", Inter, system-ui, -apple-system, sans-serif`,
      isFallback: true,
      warning: `Font "${fontFamily}" tidak ditemukan dalam sistem library, menggunakan fallback font default.`,
    };
  }
}
