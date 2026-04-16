import React from "react";
import { motion } from "framer-motion";
import { Button } from "./button";

export default function PageHeader({ 
  title, 
  subtitle, 
  icon: Icon,
  action 
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8"
    >
      <div className="flex items-center gap-4">
        {Icon && (
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-indigo-500 to-cyan-500 flex items-center justify-center shadow-lg shadow-indigo-500/25">
            <Icon className="w-7 h-7 text-white" />
          </div>
        )}
        <div>
          <h1 className="text-2xl lg:text-3xl font-bold text-white">{title}</h1>
          {subtitle && (
            <p className="text-slate-400 mt-1">{subtitle}</p>
          )}
        </div>
      </div>
      {action && (
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.2 }}
        >
          {action}
        </motion.div>
      )}
    </motion.div>
  );
}