"use client";

import { AnimatePresence, HTMLMotionProps, motion } from "framer-motion";
import { useEffect, useState } from "react";

import { cn } from "@/lib/utils";

interface WordRotateProps {
  words: string[];
  duration?: number;
  framerProps?: HTMLMotionProps<"div">;
  className?: string;
}

export function WordRotate({
  words,
  duration = 2500,
  framerProps = {
    initial: { opacity: 0, y: -50 },
    animate: { opacity: 1, y: 0 },
    exit: { opacity: 0, y: 50 },
    transition: { duration: 0.25, ease: "easeOut" },
  },
  className,
}: WordRotateProps) {
  // Provide fallback array if words is undefined or empty
  const safeWords = words && words.length > 0 ? words : ['Loading...'];
  const [index, setIndex] = useState(0);

  useEffect(() => {
    // Only set up interval if we have valid words
    if (safeWords.length > 1) {
      const interval = setInterval(() => {
        setIndex((prevIndex) => (prevIndex + 1) % safeWords.length);
      }, duration);

      return () => clearInterval(interval);
    }
  }, [safeWords, duration]);

  // Reset index if it's out of bounds
  useEffect(() => {
    if (index >= safeWords.length) {
      setIndex(0);
    }
  }, [safeWords.length, index]);

  return (
    <div className="overflow-hidden py-2">
      <AnimatePresence mode="wait">
        <motion.div
          key={safeWords[index] || 'fallback'}
          className={cn("bg-gradient-to-r from-lime-400 to-green-400 bg-clip-text text-transparent", className)}
          {...framerProps}
        >
          {safeWords[index] || 'Loading...'}
        </motion.div>
      </AnimatePresence>
    </div>
  );
}