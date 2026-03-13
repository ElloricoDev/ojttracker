import { useMemo } from 'react';
import { useWindowDimensions } from 'react-native';

const BASE_AREA = 360 * 800;
const MIN_SCALE = 0.95;
const MAX_SCALE = 1.12;

export function getScale(width: number, height: number) {
  if (!width || width <= 0 || !height || height <= 0) {
    return 1;
  }

  const area = width * height;
  const raw = Math.sqrt(area / BASE_AREA);
  return Math.max(MIN_SCALE, Math.min(MAX_SCALE, raw));
}

export function useResponsive() {
  const { width, height } = useWindowDimensions();
  const scale = getScale(width, height);

  const s = useMemo(() => {
    return (value: number) => Math.round(value * scale);
  }, [scale]);

  return { width, scale, s };
}
