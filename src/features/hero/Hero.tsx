import React, { useState } from 'react';
import { motion, useMotionValue, useTransform } from 'framer-motion';
import { Button } from '../../components/ui/Button';
import { ArrowDown } from 'lucide-react';

interface HeroProps {
  onCreateClick: () => void;
  onUploadClick: () => void;
}

export const Hero: React.FC<HeroProps> = ({ onCreateClick, onUploadClick }) => {
  // Mouse position tracking for 3D card tilt and background follow effect
  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);
  const [coords, setCoords] = useState({ x: 0, y: 0 });

  const handleMouseMove = (event: React.MouseEvent<HTMLDivElement>) => {
    const { clientX, clientY, currentTarget } = event;
    const { left, top, width, height } = currentTarget.getBoundingClientRect();
    
    // Calculate values relative to card center
    const x = (clientX - left - width / 2) / (width / 2);
    const y = (clientY - top - height / 2) / (height / 2);
    
    mouseX.set(x);
    mouseY.set(y);
    setCoords({ x: clientX - left, y: clientY - top });
  };

  const handleMouseLeave = () => {
    mouseX.set(0);
    mouseY.set(0);
  };

  // Card transform options
  const rotateX = useTransform(mouseY, [-1, 1], [15, -15]);
  const rotateY = useTransform(mouseX, [-1, 1], [-15, 15]);

  return (
    <div
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      className="relative min-h-[92vh] flex flex-col items-center justify-center overflow-hidden px-4 md:px-8 py-16 bg-[#FAFAFA] dark:bg-[#0A0A0A] transition-colors duration-300"
    >
      {/* Animated Background Line Grid */}
      <div className="absolute inset-0 bg-grid opacity-80 pointer-events-none" />

      {/* Mouse Follow Glow Spot */}
      <div
        className="absolute h-[500px] w-[500px] rounded-full pointer-events-none opacity-25 dark:opacity-10 blur-[130px] bg-gradient-to-r from-accent to-secondary transition-all duration-75 hidden md:block"
        style={{
          left: `${coords.x - 250}px`,
          top: `${coords.y - 250}px`,
        }}
      />

      {/* Ambient background blur circles */}
      <div className="absolute top-1/4 left-1/4 h-[350px] w-[350px] rounded-full bg-accent/10 blur-[100px] animate-pulse-subtle pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/4 h-[350px] w-[350px] rounded-full bg-secondary/10 blur-[100px] animate-pulse-subtle pointer-events-none" style={{ animationDelay: '2s' }} />


      {/* Hero Content Assembly */}
      <div className="max-w-7xl w-full grid grid-cols-1 lg:grid-cols-12 gap-12 items-center z-10">
        
        {/* Left Typography Block */}
        <div className="lg:col-span-7 space-y-6 text-center lg:text-left">
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-accent/10 border border-accent/15 text-accent text-[10px] font-bold tracking-wider uppercase"
          >
            <span>The Ultimate Open-Source QR Toolkit</span>
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="text-4xl sm:text-5xl md:text-6xl font-black tracking-tight leading-none bg-clip-text text-transparent bg-gradient-to-r from-neutral-900 via-neutral-950 to-neutral-800 dark:from-white dark:via-neutral-100 dark:to-neutral-300 font-sans"
          >
            Generate. <br className="hidden sm:inline" />
            <span className="text-accent">Decode.</span> Inspect.
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="text-sm md:text-base text-neutral-500 dark:text-neutral-400 max-w-xl mx-auto lg:mx-0 leading-relaxed font-medium"
          >
            Everything you need for QR codes. Beautiful, custom-designed, and lightning fast. Save styles, parse parameters, and print vectors.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.3 }}
            className="flex flex-wrap justify-center lg:justify-start gap-4"
          >
            <Button onClick={onCreateClick} variant="accent" size="lg" className="shadow-lg shadow-accent/20">
              Create QR
            </Button>
            <Button onClick={onUploadClick} variant="secondary" size="lg">
              Upload QR
            </Button>
          </motion.div>

          {/* Keyboard shortcut tips */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5, delay: 0.4 }}
            className="hidden sm:flex items-center justify-center lg:justify-start space-x-4 pt-4 text-[10px] text-neutral-400 font-semibold select-none uppercase"
          >
            <span>Press <kbd className="px-1.5 py-0.5 rounded border border-neutral-200 dark:border-neutral-800 bg-neutral-100 dark:bg-neutral-900 font-mono">G</kbd> to Generate</span>
            <span>•</span>
            <span>Press <kbd className="px-1.5 py-0.5 rounded border border-neutral-200 dark:border-neutral-800 bg-neutral-100 dark:bg-neutral-900 font-mono">D</kbd> to Decode</span>
            <span>•</span>
            <span>Press <kbd className="px-1.5 py-0.5 rounded border border-neutral-200 dark:border-neutral-800 bg-neutral-100 dark:bg-neutral-900 font-mono">⌘ K</kbd> for commands</span>
          </motion.div>
        </div>

        {/* Right 3D Visual Block */}
        <div className="lg:col-span-5 flex justify-center items-center">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.6, delay: 0.15 }}
            className="perspective-[1000px] w-full max-w-[350px] aspect-square"
          >
            <motion.div
              style={{ rotateX, rotateY, transformStyle: 'preserve-3d' }}
              transition={{ type: 'spring', stiffness: 200, damping: 25 }}
              className="relative w-full h-full rounded-3xl p-6 bg-white/40 dark:bg-[#0E0E0E]/40 backdrop-blur-xl border border-neutral-200 dark:border-white/5 shadow-2xl flex flex-col items-center justify-center group"
            >
              {/* Glowing ring overlay inside card */}
              <div className="absolute inset-0 rounded-3xl border border-accent/10 pointer-events-none group-hover:border-accent/30 transition-colors duration-300" />
              
              {/* Spinning Accent Border */}
              <div className="absolute inset-0 rounded-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none"
                   style={{
                     background: 'radial-gradient(circle at 50% 50%, rgba(109, 93, 252, 0.05) 0%, transparent 80%)'
                   }}
              />

              {/* Holographic matrix representation */}
              <div 
                style={{ transform: 'translateZ(30px)' }}
                className="w-[200px] h-[200px] flex items-center justify-center relative bg-white dark:bg-black rounded-2xl p-4 shadow-glass dark:shadow-glass-dark border border-neutral-200 dark:border-neutral-900"
              >
                {/* Simulated QR matrix elements that blink/glow */}
                <div className="grid grid-cols-5 gap-3 opacity-80">
                  <div className="h-7 w-7 border-4 border-accent rounded-md" />
                  <div className="h-7 w-7 bg-neutral-200 dark:bg-neutral-800 rounded-sm" />
                  <div className="h-7 w-7 bg-accent rounded-sm" />
                  <div className="h-7 w-7 bg-neutral-200 dark:bg-neutral-800 rounded-sm" />
                  <div className="h-7 w-7 border-4 border-accent rounded-md" />
                  
                  <div className="h-7 w-7 bg-neutral-200 dark:bg-neutral-800 rounded-sm" />
                  <div className="h-7 w-7 bg-secondary rounded-sm" />
                  <div className="h-7 w-7 bg-neutral-200 dark:bg-neutral-800 rounded-sm" />
                  <div className="h-7 w-7 bg-neutral-200 dark:bg-neutral-800 rounded-sm" />
                  <div className="h-7 w-7 bg-secondary rounded-sm" />
                  
                  <div className="h-7 w-7 bg-accent rounded-sm" />
                  <div className="h-7 w-7 bg-neutral-200 dark:bg-neutral-800 rounded-sm" />
                  <div className="h-7 w-7 bg-neutral-200 dark:bg-neutral-800 rounded-sm" />
                  <div className="h-7 w-7 bg-accent rounded-sm" />
                  <div className="h-7 w-7 bg-neutral-200 dark:bg-neutral-800 rounded-sm" />
                  
                  <div className="h-7 w-7 bg-neutral-200 dark:bg-neutral-800 rounded-sm" />
                  <div className="h-7 w-7 bg-neutral-200 dark:bg-neutral-800 rounded-sm" />
                  <div className="h-7 w-7 bg-secondary rounded-sm" />
                  <div className="h-7 w-7 bg-neutral-200 dark:bg-neutral-800 rounded-sm" />
                  <div className="h-7 w-7 bg-accent rounded-sm" />
                  
                  <div className="h-7 w-7 border-4 border-accent rounded-md" />
                  <div className="h-7 w-7 bg-accent rounded-sm" />
                  <div className="h-7 w-7 bg-neutral-200 dark:bg-neutral-800 rounded-sm" />
                  <div className="h-7 w-7 bg-secondary rounded-sm" />
                  <div className="h-7 w-7 border-4 border-accent rounded-md" />
                </div>
              </div>


            </motion.div>
          </motion.div>
        </div>
      </div>

      {/* Down arrow scroll helper */}
      <motion.div
        animate={{ y: [0, 8, 0] }}
        transition={{ duration: 2.5, repeat: Infinity, ease: 'easeInOut' }}
        className="absolute bottom-6 flex flex-col items-center cursor-pointer select-none"
        onClick={onCreateClick}
      >
        <span className="text-[9px] font-bold text-neutral-400 dark:text-neutral-500 tracking-wider uppercase mb-1">Scroll to Workspace</span>
        <ArrowDown className="h-4 w-4 text-neutral-400 dark:text-neutral-500" />
      </motion.div>
    </div>
  );
};
