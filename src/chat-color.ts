const FALLBACK = "#b2f5d4";
function luminance(hex: string): number {
  const values = [1, 3, 5].map((offset) => {
    const s = parseInt(hex.slice(offset, offset + 2), 16) / 255;
    return s <= 0.04045 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4;
  });
  return values[0] * 0.2126 + values[1] * 0.7152 + values[2] * 0.0722;
}
// Twitch users choose arbitrary colors. Keep a hue only when it remains readable
// against our lightest chat surface; darker ink backgrounds have more contrast.
export function readableChatColor(color: string): string {
  if (!/^#[0-9a-f]{6}$/i.test(color)) return FALLBACK;
  const contrast = (luminance(color) + 0.05) / (luminance("#152129") + 0.05);
  return contrast >= 4.5 ? color : FALLBACK;
}
