// 🎨 Nisrine School Design System
// Inspired by Apple's minimalistic design language

export const theme = {
  // Color Palette
  colors: {
    // Primary Colors
    primary: '#FFCC00',
    primaryLight: '#FFD633',
    primaryDark: '#E6B800',
    
    // Accent Colors
    accent: '#FF9500',
    accentLight: '#FFB340',
    
    // Neutral Colors (Light Mode)
    background: '#F5F5F7',
    surface: '#FFFFFF',
    surfaceElevated: '#FAFAFA',
    
    // Text Colors
    textPrimary: '#1D1D1F',
    textSecondary: '#6E6E73',
    textTertiary: '#86868B',
    
    // Semantic Colors
    success: '#34C759',
    warning: '#FF9500',
    error: '#FF3B30',
    info: '#007AFF',
    
    // Dark Mode Colors
    dark: {
      background: '#000000',
      surface: '#1C1C1E',
      surfaceElevated: '#2C2C2E',
      textPrimary: '#F5F5F7',
      textSecondary: '#AEAEB2',
      textTertiary: '#8E8E93',
    },
    
    // Overlay & Borders
    overlay: 'rgba(0, 0, 0, 0.4)',
    border: 'rgba(0, 0, 0, 0.1)',
    divider: 'rgba(0, 0, 0, 0.05)',
  },
  
  // Typography
  typography: {
    fontFamily: {
      primary: '-apple-system, BlinkMacSystemFont, "SF Pro Display", "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
      secondary: '"SF Pro Text", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
      mono: '"SF Mono", "Monaco", "Courier New", monospace',
    },
    
    fontSize: {
      xs: '12px',
      sm: '14px',
      base: '16px',
      lg: '18px',
      xl: '20px',
      '2xl': '24px',
      '3xl': '28px',
      '4xl': '34px',
      '5xl': '40px',
    },
    
    fontWeight: {
      light: 300,
      regular: 400,
      medium: 500,
      semibold: 600,
      bold: 700,
    },
    
    lineHeight: {
      tight: 1.2,
      normal: 1.5,
      relaxed: 1.75,
    },
  },
  
  // Spacing (8px base unit)
  spacing: {
    xs: '4px',
    sm: '8px',
    md: '16px',
    lg: '24px',
    xl: '32px',
    '2xl': '48px',
    '3xl': '64px',
  },
  
  // Border Radius
  borderRadius: {
    sm: '8px',
    md: '12px',
    lg: '16px',
    xl: '20px',
    '2xl': '24px',
    full: '9999px',
  },
  
  // Shadows (Apple-style soft shadows)
  shadows: {
    sm: '0 1px 3px rgba(0, 0, 0, 0.08)',
    md: '0 4px 12px rgba(0, 0, 0, 0.08)',
    lg: '0 8px 24px rgba(0, 0, 0, 0.12)',
    xl: '0 16px 48px rgba(0, 0, 0, 0.16)',
    inner: 'inset 0 2px 4px rgba(0, 0, 0, 0.06)',
  },
  
  // Transitions
  transitions: {
    fast: '150ms cubic-bezier(0.4, 0, 0.2, 1)',
    base: '250ms cubic-bezier(0.4, 0, 0.2, 1)',
    slow: '350ms cubic-bezier(0.4, 0, 0.2, 1)',
    spring: '500ms cubic-bezier(0.34, 1.56, 0.64, 1)',
  },
  
  // Z-Index Scale
  zIndex: {
    base: 0,
    dropdown: 1000,
    sticky: 1100,
    fixed: 1200,
    modal: 1300,
    popover: 1400,
    tooltip: 1500,
  },
  
  // Breakpoints
  breakpoints: {
    xs: '320px',
    sm: '640px',
    md: '768px',
    lg: '1024px',
    xl: '1280px',
  },
};

// Component Styles
export const components = {
  // Button Styles
  button: {
    base: `
      font-family: ${theme.typography.fontFamily.primary};
      font-weight: ${theme.typography.fontWeight.semibold};
      border-radius: ${theme.borderRadius.lg};
      transition: all ${theme.transitions.base};
      cursor: pointer;
      border: none;
      display: inline-flex;
      align-items: center;
      justify-content: center;
      gap: ${theme.spacing.sm};
      user-select: none;
      -webkit-tap-highlight-color: transparent;
    `,
    
    sizes: {
      sm: `
        padding: ${theme.spacing.sm} ${theme.spacing.md};
        font-size: ${theme.typography.fontSize.sm};
        min-height: 36px;
      `,
      md: `
        padding: ${theme.spacing.md} ${theme.spacing.lg};
        font-size: ${theme.typography.fontSize.base};
        min-height: 44px;
      `,
      lg: `
        padding: ${theme.spacing.lg} ${theme.spacing.xl};
        font-size: ${theme.typography.fontSize.lg};
        min-height: 52px;
      `,
    },
    
    variants: {
      primary: `
        background: ${theme.colors.primary};
        color: ${theme.colors.textPrimary};
        box-shadow: ${theme.shadows.sm};
      `,
      secondary: `
        background: ${theme.colors.surface};
        color: ${theme.colors.textPrimary};
        box-shadow: ${theme.shadows.sm};
        border: 1px solid ${theme.colors.border};
      `,
      ghost: `
        background: transparent;
        color: ${theme.colors.textSecondary};
      `,
    },
  },
  
  // Card Styles
  card: {
    base: `
      background: ${theme.colors.surface};
      border-radius: ${theme.borderRadius.xl};
      box-shadow: ${theme.shadows.md};
      padding: ${theme.spacing.lg};
      transition: all ${theme.transitions.base};
    `,
    
    hover: `
      transform: translateY(-2px);
      box-shadow: ${theme.shadows.lg};
    `,
  },
  
  // Input Styles
  input: {
    base: `
      font-family: ${theme.typography.fontFamily.primary};
      font-size: ${theme.typography.fontSize.base};
      padding: ${theme.spacing.md} ${theme.spacing.lg};
      border-radius: ${theme.borderRadius.md};
      border: 1px solid ${theme.colors.border};
      background: ${theme.colors.surfaceElevated};
      transition: all ${theme.transitions.base};
      color: ${theme.colors.textPrimary};
    `,
    
    focus: `
      border-color: ${theme.colors.primary};
      box-shadow: 0 0 0 4px rgba(255, 204, 0, 0.1);
      outline: none;
    `,
  },
};

// Utility Functions
export const utils = {
  // Generate gradient
  gradient: (color1, color2) => `linear-gradient(135deg, ${color1} 0%, ${color2} 100%)`,
  
  // Generate glassmorphism effect
  glass: (opacity = 0.8) => `
    background: rgba(255, 255, 255, ${opacity});
    backdrop-filter: blur(20px) saturate(180%);
    -webkit-backdrop-filter: blur(20px) saturate(180%);
  `,
  
  // Truncate text
  truncate: `
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  `,
  
  // Center content
  center: `
    display: flex;
    align-items: center;
    justify-content: center;
  `,
};

export default theme;
