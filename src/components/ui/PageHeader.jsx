import React from "react";
import { motion } from "framer-motion";
import { Button } from "./button";

export default function PageHeader({ 
  title, 
  subtitle, 
  icon: Icon,
  action,
  className = ""
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      className={`flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6 lg:mb-8 ${className}`}
    >
      <div className="flex items-center gap-4">
        {Icon && (
          <div className="w-12 h-12 lg:w-14 lg:h-14 rounded-xl lg:rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-500 flex items-center justify-center shadow-lg shadow-indigo-500/25">
            <Icon className="w-6 h-6 lg:w-7 lg:h-7 text-white" />
          </div>
        )}
        <div>
          <h1 className="text-xl lg:text-2xl xl:text-3xl font-bold text-white tracking-tight">
            {title}
          </h1>
          {subtitle && (
            <p className="text-slate-400 text-sm lg:text-base mt-0.5 lg:mt-1">
              {subtitle}
            </p>
          )}
        </div>
      </div>
      {action && (
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.2 }}
          className="flex-shrink-0"
        >
          {action}
        </motion.div>
      )}
    </motion.div>
  );
}