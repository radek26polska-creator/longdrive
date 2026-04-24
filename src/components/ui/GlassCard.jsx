import React from "react";
import { motion } from "framer-motion";

export default function GlassCard({ 
  children, 
  className = "",
  animate = true,
  delay = 0,
  hover = true,
  variant = "default" // default, stats, mentor, calendar
}) {
  // Mapowanie wariantów na dodatkowe klasy
  const variantClasses = {
    default: "",
    stats: "p-4 hover:shadow-indigo-500/10",
    mentor: "p-3 hover:shadow-indigo-500/5",
    calendar: "p-4",
  };

  const content = (
    <div className={`
      bg-slate-800/50 
      backdrop-blur-xl 
      rounded-2xl 
      border border-white/5 
      shadow-xl 
      transition-all 
      duration-300
      ${variantClasses[variant] || variantClasses.default}
      ${className}
    `}>
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