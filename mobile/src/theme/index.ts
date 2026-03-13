// ─────────────────────────────────────────────
//  OJT Tracking System — Design Tokens
//  theme/index.ts
// ─────────────────────────────────────────────

export const appTheme = {

  // ── Colors ──────────────────────────────────
  colors: {
    // Brand
    primary:       '#6366F1',   // indigo-500
    primaryDark:   '#4F46E5',   // indigo-600
    primaryLight:  '#EEF2FF',   // indigo-50
    primaryRing:   '#C7D2FE',   // indigo-200

    // Backgrounds
    background:    '#FAFAFA',   // neutral-50
    surface:       '#FFFFFF',   // pure white cards
    surfaceAlt:    '#F4F4F5',   // neutral-100 (input bg, chips)

    // Text
    text:          '#18181B',   // zinc-900
    mutedText:     '#52525B',   // zinc-600
    subtleText:    '#A1A1AA',   // zinc-400 (placeholders, captions)

    // Borders
    border:        '#E4E4E7',   // zinc-200
    borderLight:   '#F4F4F5',   // zinc-100

    // Semantic
    success:       '#10B981',   // emerald-500
    successLight:  '#ECFDF5',   // emerald-50
    successText:   '#065F46',   // emerald-900

    warning:       '#F59E0B',   // amber-500
    warningLight:  '#FFFBEB',   // amber-50
    warningText:   '#92400E',   // amber-900

    error:         '#EF4444',   // red-500
    errorLight:    '#FEF2F2',   // red-50
    errorText:     '#991B1B',   // red-900

    info:          '#3B82F6',   // blue-500
    infoLight:     '#EFF6FF',   // blue-50
    infoText:      '#1E3A8A',   // blue-900
  },

  // ── Spacing ─────────────────────────────────
  // Use these everywhere — never raw numbers.
  spacing: {
    xxs:  2,
    xs:   4,
    sm:   8,
    md:   16,
    lg:   24,
    xl:   32,
    xxl:  48,
    xxxl: 64,
  },

  // ── Layout ─────────────────────────────────
  layout: {
    screenPadding: 20,
    cardRadius: 28,
    sectionGap: 20,
  },

  // ── Border Radius ────────────────────────────
  radius: {
    xs:   6,
    sm:   10,
    md:   14,
    lg:   18,
    xl:   24,
    xxl:  32,
    full: 999,
  },

  // ── Typography ───────────────────────────────
  // Font sizes — pair with fontWeight below.
  fontSize: {
    xs:      11,
    sm:      12,
    base:    13,
    md:      15,
    lg:      17,
    xl:      20,
    xxl:     22,
    display: 28,
    hero:    34,
  },

  fontWeight: {
    regular:  '400' as const,
    medium:   '500' as const,
    semibold: '600' as const,
    bold:     '700' as const,
  },

  lineHeight: {
    tight:   1.2,
    snug:    1.35,
    normal:  1.5,
    relaxed: 1.65,
  },

  // ── Elevation (shadows) ──────────────────────
  // iOS shadow props — use as spread: { ...appTheme.shadow.md }
  shadow: {
    none: {
      shadowColor: 'transparent',
      shadowOffset: { width: 0, height: 0 },
      shadowOpacity: 0,
      shadowRadius: 0,
      elevation: 0,
    },
    sm: {
      shadowColor: '#18181B',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.03,
      shadowRadius: 8,
      elevation: 1,
    },
    md: {
      shadowColor: '#18181B',
      shadowOffset: { width: 0, height: 8 },
      shadowOpacity: 0.04,
      shadowRadius: 24,
      elevation: 3,
    },
    lg: {
      shadowColor: '#18181B',
      shadowOffset: { width: 0, height: 16 },
      shadowOpacity: 0.06,
      shadowRadius: 32,
      elevation: 6,
    },
    // Colored button glow — matches primary
    primary: {
      shadowColor: '#6366F1',
      shadowOffset: { width: 0, height: 8 },
      shadowOpacity: 0.25,
      shadowRadius: 16,
      elevation: 4,
    },
  },

  // ── Input ────────────────────────────────────
  // Shared input dimensions used across all forms
  input: {
    height:          56,
    borderRadius:    16,
    borderWidth:     1,
    paddingH:        16,
    fontSize:        16,
    iconSize:        20,
  },

  // ── Animation ────────────────────────────────
  animation: {
    fast:   150,
    normal: 250,
    slow:   400,
  },

} as const;

// ── Convenience re-exports ──────────────────
// So you can do: import { colors, spacing } from '../theme'
export const { colors, spacing, radius, fontSize, fontWeight, shadow, input } = appTheme;

export type AppTheme = typeof appTheme;
