import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface AnimatedTextProps {
  text: string;
  className?: string;
  as?: keyof JSX.IntrinsicElements;
  animationType?: 'fade' | 'slide' | 'scale';
  duration?: number;
}

/**
 * AnimatedText component provides smooth transitions when text content changes
 * 
 * @param text The text to display with animation when it changes
 * @param className Optional CSS classes to apply
 * @param as The HTML element to render (default: span)
 * @param animationType The type of animation (fade, slide, scale)
 * @param duration The animation duration in seconds
 */
const AnimatedText: React.FC<AnimatedTextProps> = ({
  text,
  className = '',
  as: Component = 'span',
  animationType = 'fade',
  duration = 0.5
}) => {
  const [key, setKey] = useState(0);

  // When text changes, update key to trigger animation
  useEffect(() => {
    setKey(prevKey => prevKey + 1);
  }, [text]);

  // Animation variants based on the selected type
  const getVariants = () => {
    switch (animationType) {
      case 'slide':
        return {
          initial: { y: 20, opacity: 0 },
          animate: { y: 0, opacity: 1 },
          exit: { y: -20, opacity: 0 }
        };
      case 'scale':
        return {
          initial: { scale: 0.8, opacity: 0 },
          animate: { scale: 1, opacity: 1 },
          exit: { scale: 0.8, opacity: 0 }
        };
      case 'fade':
      default:
        return {
          initial: { opacity: 0 },
          animate: { opacity: 1 },
          exit: { opacity: 0 }
        };
    }
  };

  return (
    <AnimatePresence mode="wait">
      <motion.span
        key={key}
        initial="initial"
        animate="animate"
        exit="exit"
        variants={getVariants()}
        transition={{ 
          duration, 
          ease: "easeInOut" 
        }}
        className={className}
      >
        {text}
      </motion.span>
    </AnimatePresence>
  );
};

export default AnimatedText; 