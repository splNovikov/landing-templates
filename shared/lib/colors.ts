/**
 * Color utilities for accessing CSS variables in JavaScript
 * Used for canvas rendering and other JavaScript contexts
 */

/**
 * Get a CSS variable value as a string
 */
export function getCSSVariable(variableName: string): string {
  if (typeof window === 'undefined') {
    // SSR fallback - return default values
    return getDefaultColor(variableName);
  }
  return getComputedStyle(document.documentElement).getPropertyValue(variableName).trim();
}

/**
 * Get a CSS variable color and convert to rgba format
 * @param variableName - CSS variable name (e.g., '--color-secondary')
 * @param alpha - Alpha value (0-1)
 */
export function getColorWithAlpha(variableName: string, alpha: number): string {
  const color = getCSSVariable(variableName);
  if (!color) {
    return getDefaultColorWithAlpha(variableName, alpha);
  }

  // If it's already a hex color, convert to rgba
  if (color.startsWith('#')) {
    const hex = color.replace('#', '');
    const r = parseInt(hex.substring(0, 2), 16);
    const g = parseInt(hex.substring(2, 4), 16);
    const b = parseInt(hex.substring(4, 6), 16);
    return `rgba(${r}, ${g}, ${b}, ${alpha})`;
  }

  // If it's already rgba or rgb, extract and modify alpha
  const rgbaMatch = color.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)/);
  if (rgbaMatch) {
    return `rgba(${rgbaMatch[1]}, ${rgbaMatch[2]}, ${rgbaMatch[3]}, ${alpha})`;
  }

  return getDefaultColorWithAlpha(variableName, alpha);
}

/**
 * Get default color values for SSR
 */
function getDefaultColor(variableName: string): string {
  const defaults: Record<string, string> = {
    '--color-secondary': '#007aff',
    '--color-primary': '#1a1a1a',
    '--color-bg-body': '#ffffff',
    '--color-text-primary': '#000000',
  };
  return defaults[variableName] || '#000000';
}

/**
 * Get default color with alpha for SSR
 */
function getDefaultColorWithAlpha(variableName: string, alpha: number): string {
  const defaults: Record<string, [number, number, number]> = {
    '--color-secondary': [0, 122, 255],
    '--color-primary': [26, 26, 26],
    '--color-bg-body': [255, 255, 255],
    '--color-text-primary': [0, 0, 0],
  };

  const rgb = defaults[variableName] || [0, 0, 0];
  return `rgba(${rgb[0]}, ${rgb[1]}, ${rgb[2]}, ${alpha})`;
}

/**
 * Pre-computed color helpers for common use cases
 */
export const colors = {
  secondary: (alpha: number = 1) => getColorWithAlpha('--color-secondary', alpha),
  primary: (alpha: number = 1) => getColorWithAlpha('--color-primary', alpha),
  bgBody: () => getCSSVariable('--color-bg-body') || '#ffffff',
  textPrimary: (alpha: number = 1) => getColorWithAlpha('--color-text-primary', alpha),
};
