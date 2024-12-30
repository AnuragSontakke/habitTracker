/**
 * Below are the colors that are used in the app. The colors are defined in the light and dark mode.
 * There are many other ways to style your app. For example, [Nativewind](https://www.nativewind.dev/), [Tamagui](https://tamagui.dev/), [unistyles](https://reactnativeunistyles.vercel.app), etc.
 */

const tintColorLight = '#0a7ea4';
const tintColorDark = '#fff';

export const Colors = {
  light: {
    text: '#11181C',
    background: '#fff',
    tint: tintColorLight,
    icon: '#687076',
    tabIconDefault: '#687076',
    tabIconSelected: tintColorLight,
  },
  dark: {
    text: '#ECEDEE',
    background: '#151718',
    tint: tintColorDark,
    icon: '#9BA1A6',
    tabIconDefault: '#9BA1A6',
    tabIconSelected: tintColorDark,
  },
  PRIMARY: '#8B8BFC',
  BACKGROUND: '#151718',
  PRIMARY_LIGHT: '#b3b3ff',
  PRIMARY_DARK: '#5c5cbf',
  GRAY: '#8f8f8f',
  
  // Role Colors
  ADMIN: '#FF5252',         // Red
  TEACHER: '#FFA500',       // Orange
  VOLUNTEER: '#1E90FF',     // Blue
  MEMBER: '#32CD32',        // Green
  
  // Status Colors
  SUCCESS: '#4CAF50',       // Green for success actions
  DANGER: '#FF5252',        // Red for danger actions
};
