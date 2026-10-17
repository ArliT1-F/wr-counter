import { useEffect, useState } from 'react';
import type { IconType } from '../lib/types';
import { ASSET_VERSION } from '../lib/constants';
import { t } from '../lib/strings';

interface GameIconProps {
  src?: string;
  fallbackLetter: string;
  fallbackColor?: string;
  size?: number;
  type: IconType; // "champion" | "item" | "rune" | "spell"
  alt?: string;
  className?: string;
}

const FALLBACK_COLOR = '#243044';

/**
 * Reusable icon with a visual fallback system:
 *   type="champion" -> colored circle
 *   type="item"     -> gray/colored rounded square
 *   type="rune"     -> diamond (rotated square)
 *   type="spell"    -> hexagon (clip-path)
 *
 * If the image fails to load (no real assets at launch), the fallback shape
 * shows the champion/item's first letter in its associated color.
 */
export default function GameIcon({
  src,
  fallbackLetter,
  fallbackColor = FALLBACK_COLOR,
  size = 48,
  type,
  alt,
  className = '',
}: GameIconProps) {
  const [failed, setFailed] = useState(false);
  const [attempt, setAttempt] = useState(0);

  // Reset when the icon target changes (e.g. the swap button reuses instances).
  useEffect(() => {
    setFailed(false);
    setAttempt(0);
  }, [src]);

  // Cache-busted URL: stale HTTP caches (browser or proxy) can hold the old
  // SPA-shell response for icon paths from before the files existed — a fresh
  // query string always gets a fresh cache key. One retry on load errors.
  const versionedSrc = src
    ? `${src}${src.includes('?') ? '&' : '?'}v=${ASSET_VERSION}${attempt > 0 ? `&r=${attempt}` : ''}`
    : undefined;

  const label =
    alt ??
    t(`a11y.${type === 'champion' ? 'championIcon' : type === 'item' ? 'itemIcon' : type === 'rune' ? 'runeIcon' : type === 'ability' ? 'abilityIcon' : 'spellIcon'}`, {
      name: fallbackLetter,
    });

  const shapeStyle: React.CSSProperties = { width: size, height: size };
  let shapeClass = '';
  let letterRotate = false;

  switch (type) {
    case 'champion':
      shapeClass = 'rounded-full';
      break;
    case 'item':
    case 'ability':
      shapeClass = 'rounded-[22%]';
      break;
    case 'rune':
      shapeClass = 'rounded-[18%] rotate-45';
      letterRotate = true;
      break;
    case 'spell':
      shapeStyle.clipPath = 'polygon(50% 0%, 93% 25%, 93% 75%, 50% 100%, 7% 75%, 7% 25%)';
      break;
  }

  if (versionedSrc && !failed) {
    return (
      <img
        src={versionedSrc}
        alt={label}
        width={size}
        height={size}
        loading="lazy"
        decoding="async"
        onError={() => (attempt < 1 ? setAttempt(attempt + 1) : setFailed(true))}
        className={`object-cover shrink-0 ${shapeClass} ${className}`}
        style={shapeStyle}
      />
    );
  }

  return (
    <div
      role="img"
      aria-label={label}
      className={`shrink-0 flex items-center justify-center font-bold select-none ${shapeClass} ${className}`}
      style={{
        ...shapeStyle,
        background: type === 'item' || type === 'ability' ? '#3A4557' : fallbackColor,
        color: '#F0E6D2',
        fontSize: Math.round(size * 0.42),
      }}
    >
      <span style={letterRotate ? { transform: 'rotate(-45deg)' } : undefined}>
        {fallbackLetter.toUpperCase()}
      </span>
    </div>
  );
}
