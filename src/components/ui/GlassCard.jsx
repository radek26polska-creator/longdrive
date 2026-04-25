import React from "react";
import { motion } from "framer-motion";
import { useAppSettings } from "@/lib/ThemeContext";

export default function GlassCard({ 
  children, 
  className = "",
  animate = true,
  delay = 0,
  hover = true,
  customOpacity = null 
}) {
  const { cardOpacity, settings } = useAppSettings();
  const opacity = customOpacity !== null ? customOpacity : cardOpacity;
  
  // Pobierz kolor główny z motywu
  const primaryColor = typeof window !== 'undefined' 
    ? getComputedStyle(document.documentElement)
        .getPropertyValue('--primary-color')
        .trim() || '#6366f1'
    : '#6366f1';
  
  // Tło kafelka z przezroczystością i delikatnym odcieniem koloru motywu
  const bgColor = `rgba(30, 41, 59, ${opacity})`;
  
  const content = (
    <div 
      className={`backdrop-blur-xl rounded-2xl border border-white/5 shadow-xl transition-all duration-300 ${className}`}
      style={{ 
        backgroundColor: bgColor,
        borderColor: `${primaryColor}30`
      }}
    >
      {children}
    </div>
  );

  if (!animate) return content;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay }}
      whileHover={hover ? { y: -2, transition: { duration: 0.2 } } : {}}
    >
      {content}
    </motion.div>
  );
}