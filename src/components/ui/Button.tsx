import React from 'react';
import { motion } from 'framer-motion';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'accent' | 'outline' | 'danger' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  children: React.ReactNode;
}

export const Button: React.FC<ButtonProps> = ({
  variant = 'primary',
  size = 'md',
  children,
  className = '',
  disabled,
  ...props
}) => {
  const baseStyle = "relative inline-flex items-center justify-center font-medium transition-colors rounded-full focus:outline-none focus:ring-2 focus:ring-accent/40 select-none overflow-hidden active:scale-95";
  
  const variants = {
    primary: "bg-primary text-white hover:bg-neutral-800 dark:bg-white dark:text-black dark:hover:bg-neutral-200 border border-transparent shadow-sm",
    secondary: "bg-neutral-100 text-neutral-800 hover:bg-neutral-200 dark:bg-neutral-900 dark:text-neutral-200 dark:hover:bg-neutral-800 border border-neutral-200/50 dark:border-neutral-800/50",
    accent: "bg-accent text-white hover:bg-accent-hover dark:bg-accent dark:text-white dark:hover:bg-accent-hover shadow-lg shadow-accent/20",
    outline: "bg-transparent text-neutral-700 hover:bg-neutral-50 dark:text-neutral-300 dark:hover:bg-neutral-900 border border-neutral-300 dark:border-neutral-700",
    danger: "bg-red-500 text-white hover:bg-red-600 dark:bg-red-600 dark:text-white dark:hover:bg-red-700 shadow-lg shadow-red-500/10",
    ghost: "bg-transparent text-neutral-700 hover:bg-neutral-100 dark:text-neutral-300 dark:hover:bg-neutral-900 border border-transparent"
  };

  const sizes = {
    sm: "px-4 py-1.5 text-xs font-semibold tracking-wide",
    md: "px-6 py-2.5 text-sm font-semibold tracking-wide",
    lg: "px-8 py-3.5 text-base font-semibold tracking-wide"
  };

  return (
    <motion.button
      whileHover={{ y: disabled ? 0 : -1 }}
      whileTap={{ scale: disabled ? 1 : 0.98 }}
      transition={{ type: 'spring', stiffness: 400, damping: 20 }}
      disabled={disabled}
      className={`${baseStyle} ${variants[variant]} ${sizes[size]} ${disabled ? 'opacity-40 cursor-not-allowed active:scale-100' : ''} ${className}`}
      {...(props as any)}
    >
      {children}
    </motion.button>
  );
};
