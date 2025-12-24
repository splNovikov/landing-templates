/**
 * Theme configuration
 * Central entry point for application theme setup
 */

export type ThemeMode = 'light' | 'dark';

export interface ThemeConfig {
  mode: ThemeMode;
}

export const defaultTheme: ThemeConfig = {
  mode: 'light',
};

/**
 * Theme provider configuration
 * This is the entry point for theme management
 */
export const themeConfig = {
  defaultMode: defaultTheme.mode,
  storageKey: 'app-theme',
} as const;
