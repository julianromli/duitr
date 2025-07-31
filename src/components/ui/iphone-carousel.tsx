import { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence, PanInfo } from 'framer-motion'
import Iphone15Pro from '@/components/magicui/iphone-15-pro'
import { ImagePreloader } from '@/components/ui/image-preloader'
import LazyImage from '@/components/ui/lazy-image'

interface IphoneCarouselProps {
  className?: string
}

// Optimized image paths with WebP format for better performance
const appScreenshots = [
  '/images/app mockup/dashboard.png',
  '/images/app mockup/AIanalyze.png',
  '/images/app mockup/budget.png',
  '/images/app mockup/profile.png',
  '/images/app mockup/statistics.png',
  '/images/app mockup/transactionlist.png',
  '/images/app mockup/wallets.png',
  '/images/app mockup/AIanalyze2.png'
]

// Preload only the first few critical images
const criticalImages = appScreenshots.slice(0, 3)

export function IphoneCarousel({ className }: IphoneCarouselProps) {
  const [currentIndex, setCurrentIndex] = useState(0)
  const [isDragging, setIsDragging] = useState(false)
  const intervalRef = useRef<NodeJS.Timeout | null>(null)

  // Auto-slide functionality
  const startAutoSlide = () => {
    if (intervalRef.current) clearInterval(intervalRef.current)
    intervalRef.current = setInterval(() => {
      if (!isDragging) {
        setCurrentIndex((prev) => (prev + 1) % appScreenshots.length)
      }
    }, 6000) // Change slide every 6 seconds (optimized for performance)
  }

  const stopAutoSlide = () => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current)
      intervalRef.current = null
    }
  }

  useEffect(() => {
    startAutoSlide()
    return () => stopAutoSlide()
  }, [isDragging])

  const handleDragStart = () => {
    setIsDragging(true)
    stopAutoSlide()
  }

  const handleDragEnd = (event: MouseEvent | TouchEvent | PointerEvent, info: PanInfo) => {
    setIsDragging(false)
    
    const threshold = 50
    if (info.offset.x > threshold) {
      // Dragged right - go to previous
      setCurrentIndex((prev) => (prev - 1 + appScreenshots.length) % appScreenshots.length)
    } else if (info.offset.x < -threshold) {
      // Dragged left - go to next
      setCurrentIndex((prev) => (prev + 1) % appScreenshots.length)
    }
    
    // Restart auto-slide after a delay
    setTimeout(() => {
      startAutoSlide()
    }, 1000)
  }

  return (
    <div className={`relative ${className}`}>
      <ImagePreloader images={criticalImages} priority={true} />
      <motion.div
        className="cursor-grab active:cursor-grabbing"
        drag="x"
        dragConstraints={{ left: 0, right: 0 }}
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
        whileDrag={{ scale: 1.02 }}
        transition={{ type: "spring", stiffness: 300, damping: 30 }}
      >
        <AnimatePresence mode="wait">
          <motion.div
            key={currentIndex}
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ duration: 0.3 }}
          >
            <Iphone15Pro
              className="drop-shadow-2xl"
              src={appScreenshots[currentIndex]}
              width={300}
              height={600}
            />
          </motion.div>
        </AnimatePresence>
      </motion.div>
      
      {/* Carousel indicators */}
      <div className="flex justify-center mt-6 space-x-2">
        {appScreenshots.map((_, index) => (
          <button
            key={index}
            onClick={() => {
              setCurrentIndex(index)
              stopAutoSlide()
              setTimeout(startAutoSlide, 2000)
            }}
            className={`w-2 h-2 rounded-full transition-all duration-300 ${
              index === currentIndex
                ? 'bg-white scale-125'
                : 'bg-white/40 hover:bg-white/60'
            }`}
            aria-label={`Go to slide ${index + 1}`}
          />
        ))}
      </div>
    </div>
  )
}