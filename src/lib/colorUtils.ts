/**
 * Calculate the luminance of a color (perceived brightness)
 * Returns a value between 0 (black) and 1 (white)
 */
export function getLuminance(hex: string): number {
  // Remove # if present
  hex = hex.replace('#', '');
  
  // Convert to RGB
  const r = parseInt(hex.substring(0, 2), 16) / 255;
  const g = parseInt(hex.substring(2, 4), 16) / 255;
  const b = parseInt(hex.substring(4, 6), 16) / 255;

  // Apply gamma correction
  const [rLinear, gLinear, bLinear] = [r, g, b].map(val => {
    return val <= 0.03928 ? val / 12.92 : Math.pow((val + 0.055) / 1.055, 2.4);
  });

  // Calculate relative luminance
  return 0.2126 * rLinear + 0.7152 * gLinear + 0.0722 * bLinear;
}

/**
 * Determine if a color is light or dark
 * Returns true if the color is light (needs dark text), false if dark (needs light text)
 */
export function isLightColor(hex: string): boolean {
  const luminance = getLuminance(hex);
  return luminance > 0.5;
}

/**
 * Get appropriate text color (black or white) for a given background color
 */
export function getContrastTextColor(backgroundColor: string): string {
  return isLightColor(backgroundColor) ? '#1a1a1a' : '#ffffff';
}

/**
 * Darken a color by a percentage
 */
export function darkenColor(hex: string, percent: number): string {
  hex = hex.replace('#', '');
  const num = parseInt(hex, 16);
  const r = Math.max(0, Math.min(255, ((num >> 16) & 255) * (1 - percent / 100)));
  const g = Math.max(0, Math.min(255, (((num >> 8) & 0x00ff) & 255) * (1 - percent / 100)));
  const b = Math.max(0, Math.min(255, ((num & 0x0000ff) & 255) * (1 - percent / 100)));
  return `#${Math.round(r).toString(16).padStart(2, '0')}${Math.round(g).toString(16).padStart(2, '0')}${Math.round(b).toString(16).padStart(2, '0')}`;
}

/**
 * Lighten a color by a percentage
 */
export function lightenColor(hex: string, percent: number): string {
  hex = hex.replace('#', '');
  const num = parseInt(hex, 16);
  const r = Math.min(255, Math.max(0, ((num >> 16) & 255) + (255 - ((num >> 16) & 255)) * (percent / 100)));
  const g = Math.min(255, Math.max(0, (((num >> 8) & 0x00ff) & 255) + (255 - (((num >> 8) & 0x00ff) & 255)) * (percent / 100)));
  const b = Math.min(255, Math.max(0, ((num & 0x0000ff) & 255) + (255 - ((num & 0x0000ff) & 255)) * (percent / 100)));
  return `#${Math.round(r).toString(16).padStart(2, '0')}${Math.round(g).toString(16).padStart(2, '0')}${Math.round(b).toString(16).padStart(2, '0')}`;
}
