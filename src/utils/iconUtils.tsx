// Icon utilities for category icon rendering
// Provides consistent icon mapping across all components

import React, { type JSX } from 'react';

export const getIconComponent = (iconName: string) => {
  const iconMap: { [key: string]: () => JSX.Element } = {
    'circle': () => <div className="w-4 h-4 rounded-full border-2 border-white" />,
    'square': () => <div className="w-4 h-4 border-2 border-white" />,
    'triangle': () => <div className="w-0 h-0 border-l-2 border-r-2 border-b-4 border-l-transparent border-r-transparent border-b-white" />,
    'star': () => <div className="text-white text-sm">★</div>,
    'heart': () => <div className="text-white text-sm">♥</div>,
    'diamond': () => <div className="text-white text-sm">♦</div>,
    'home': () => <div className="text-sm">🏠</div>,
    'car': () => <div className="text-sm">🚗</div>,
    'plane': () => <div className="text-sm">✈️</div>,
    'shopping-cart': () => <div className="text-sm">🛒</div>,
    'coffee': () => <div className="text-sm">☕</div>,
    'utensils': () => <div className="text-sm">🍴</div>,
    'gamepad': () => <div className="text-sm">🎮</div>,
    'music': () => <div className="text-sm">🎵</div>,
    'book': () => <div className="text-sm">📚</div>,
    'briefcase': () => <div className="text-sm">💼</div>,
    'graduation-cap': () => <div className="text-sm">🎓</div>,
    'stethoscope': () => <div className="text-sm">🩺</div>,
    'dumbbell': () => <div className="text-sm">🏋️</div>,
    'gift': () => <div className="text-sm">🎁</div>,
    'camera': () => <div className="text-sm">📷</div>,
    'smartphone': () => <div className="text-sm">📱</div>,
    'laptop': () => <div className="text-sm">💻</div>,
    'tv': () => <div className="text-sm">📺</div>
  };
  
  const IconComponent = iconMap[iconName] || iconMap['circle'];
  return <IconComponent />;
};

export default getIconComponent;