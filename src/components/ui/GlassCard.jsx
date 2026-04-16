import React from "react";
import { motion } from "framer-motion";

export default function GlassCard({ 
  children, 
  className = "",
  animate = true,
  delay = 0,
  hover = true
}) {
  const content = (
    <div className={`bg-slate-800/50 backdrop-blur-xl rounded-2xl border border-white/5 ${className}`}>
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