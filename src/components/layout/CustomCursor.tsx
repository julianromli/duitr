import React, { useState, useEffect, useRef } from 'react';

interface CursorPosition {
  x: number;
  y: number;
}

const CustomCursor: React.FC = () => {
  const [position, setPosition] = useState<CursorPosition>({ x: 0, y: 0 });
  const [isVisible, setIsVisible] = useState(false);
  const [isClicked, setIsClicked] = useState(false);
  const [isHovering, setIsHovering] = useState(false);
  const cursorRef = useRef<HTMLDivElement>(null);
  const navbarRef = useRef<HTMLElement | null>(null);

  useEffect(() => {
    // Find the navbar element in the DOM
    navbarRef.current = document.querySelector('nav.rounded-full');

    const updateCursorPosition = (e: MouseEvent) => {
      setPosition({ x: e.clientX, y: e.clientY });

      // Check if mouse is within navbar boundaries
      if (navbarRef.current) {
        const navRect = navbarRef.current.getBoundingClientRect();
        const isWithinNavbar = (
          e.clientX >= navRect.left &&
          e.clientX <= navRect.right &&
          e.clientY >= navRect.top &&
          e.clientY <= navRect.bottom
        );
        setIsVisible(isWithinNavbar);
        
        // Check if hovering over an icon (Link)
        if (isWithinNavbar) {
          const elementUnderMouse = document.elementFromPoint(e.clientX, e.clientY);
          const isOverIcon = elementUnderMouse?.closest('a') !== null;
          setIsHovering(isOverIcon);
        } else {
          setIsHovering(false);
        }
      }
    };

    const handleMouseDown = (e: MouseEvent) => {
      // Only trigger the click animation if we're within the navbar
      if (isVisible) {
        setIsClicked(true);
        setTimeout(() => setIsClicked(false), 300); // Duration of the click animation
      }
    };

    window.addEventListener('mousemove', updateCursorPosition);
    window.addEventListener('mousedown', handleMouseDown);

    return () => {
      window.removeEventListener('mousemove', updateCursorPosition);
      window.removeEventListener('mousedown', handleMouseDown);
    };
  }, [isVisible]);

  // Don't render cursor on mobile devices
  if (typeof window !== 'undefined' && window.matchMedia('(max-width: 768px)').matches) {
    return null;
  }

  return (
    <div
      ref={cursorRef}
      className="fixed pointer-events-none z-[100]"
      style={{
        left: `${position.x}px`,
        top: `${position.y}px`,
        width: '24px', // 12px radius * 2
        height: '24px', // 12px radius * 2
        opacity: isVisible ? 1 : 0,
        borderRadius: '50%',
        border: '2px solid black',
        backgroundColor: 'rgba(255, 255, 0, 0.3)',
        boxShadow: '0 0 8px rgba(255, 255, 0, 0.6)',
        transform: `translate(-50%, -50%) scale(${isClicked ? 1.5 : isHovering ? 1.2 : 1})`,
        transition: `
          transform 0.2s ease-in-out,
          opacity 0.2s ease-in-out,
          background-color 0.2s ease-in-out
        `
      }}
    />
  );
};

export default CustomCursor; 