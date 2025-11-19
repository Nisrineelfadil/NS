// Gradient Theme Configuration
// Based on the design mockups provided

export const gradients = {
  // Primary gradients for main elements
  primary: 'linear-gradient(135deg, #FF6B6B 0%, #FF8E53 50%, #C471ED 100%)', // Orange → Pink → Purple
  pinkPurple: 'linear-gradient(135deg, #FF6B9D 0%, #C471ED 100%)', // Pink → Purple
  coralPink: 'linear-gradient(135deg, #FF6B6B 0%, #FF8E9E 100%)', // Coral → Pink
  bluePurple: 'linear-gradient(135deg, #667EEA 0%, #764BA2 100%)', // Blue → Purple
  purpleBlue: 'linear-gradient(135deg, #C471ED 0%, #667EEA 100%)', // Purple → Blue
  
  // Card gradients for dashboard
  grades: 'linear-gradient(135deg, #FF6B9D 0%, #C471ED 100%)', // Pink → Purple (large card)
  attendance: 'linear-gradient(135deg, #FF6B6B 0%, #FF8E9E 100%)', // Coral → Pink
  payment: 'linear-gradient(135deg, #667EEA 0%, #764BA2 100%)', // Blue → Purple
  messages: 'linear-gradient(135deg, #FF6B9D 0%, #FF8E9E 100%)', // Pink shades
  settings: 'linear-gradient(135deg, #667EEA 0%, #764BA2 100%)', // Blue → Purple
  
  // Background gradients
  lightBg: 'linear-gradient(180deg, #F8F9FA 0%, #E9ECEF 100%)',
  darkBg: 'linear-gradient(180deg, #1A1A2E 0%, #16213E 100%)',
  
  // Overlay gradients
  overlay: 'linear-gradient(180deg, rgba(0,0,0,0.3) 0%, rgba(0,0,0,0.1) 100%)',
};

// Color palette
export const colors = {
  // Primary colors
  coral: '#FF6B6B',
  pink: '#FF6B9D',
  purple: '#C471ED',
  blue: '#667EEA',
  darkPurple: '#764BA2',
  
  // Neutral colors
  white: '#FFFFFF',
  lightGray: '#F8F9FA',
  gray: '#E9ECEF',
  darkGray: '#6C757D',
  dark: '#1A1A2E',
  
  // Status colors
  success: '#10B981',
  warning: '#F59E0B',
  error: '#EF4444',
  info: '#3B82F6',
};

// Animation variants for Framer Motion
export const animations = {
  // Fade in animation
  fadeIn: {
    initial: { opacity: 0 },
    animate: { opacity: 1 },
    exit: { opacity: 0 },
    transition: { duration: 0.3 }
  },
  
  // Slide up animation
  slideUp: {
    initial: { opacity: 0, y: 20 },
    animate: { opacity: 1, y: 0 },
    exit: { opacity: 0, y: -20 },
    transition: { duration: 0.4, ease: 'easeOut' }
  },
  
  // Scale animation
  scale: {
    initial: { opacity: 0, scale: 0.9 },
    animate: { opacity: 1, scale: 1 },
    exit: { opacity: 0, scale: 0.9 },
    transition: { duration: 0.3 }
  },
  
  // Card hover animation
  cardHover: {
    rest: { scale: 1, y: 0 },
    hover: { 
      scale: 1.02, 
      y: -5,
      transition: { duration: 0.2, ease: 'easeOut' }
    },
    tap: { scale: 0.98 }
  },
  
  // Button press animation
  buttonPress: {
    rest: { scale: 1 },
    hover: { scale: 1.05 },
    tap: { scale: 0.95 }
  },
  
  // Stagger children animation
  staggerContainer: {
    animate: {
      transition: {
        staggerChildren: 0.1
      }
    }
  },
  
  // Stagger item animation
  staggerItem: {
    initial: { opacity: 0, y: 20 },
    animate: { opacity: 1, y: 0 }
  }
};

// Shadow styles
export const shadows = {
  small: '0 2px 4px rgba(0, 0, 0, 0.1)',
  medium: '0 4px 6px rgba(0, 0, 0, 0.1)',
  large: '0 10px 15px rgba(0, 0, 0, 0.1)',
  xl: '0 20px 25px rgba(0, 0, 0, 0.15)',
  gradient: '0 10px 30px rgba(196, 113, 237, 0.3)', // Purple glow
  hover: '0 15px 35px rgba(196, 113, 237, 0.4)', // Stronger purple glow on hover
};

export default { gradients, colors, animations, shadows };
