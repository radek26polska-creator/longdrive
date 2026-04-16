import React from "react";
import { motion } from "framer-motion";

export default function StatCard({ 
  title, 
  value, 
  subtitle, 
  icon: Icon, 
  trend, 
  trendUp = true,
  gradient = "from-indigo-500 to-purple-500",
  delay = 0 
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay }}
      whileHover={{ y: -4, transition: { duration: 0.2 } }}
      className="relative group"
    >
      <div className="absolute inset-0 bg-gradient-to-r opacity-0 group-hover:opacity-100 blur-xl transition-opacity duration-500"
        style={{ backgroundImage: `linear-gradient(to right, var(--tw-gradient-stops))` }} 
      />
      <div className="relative bg-slate-800/50 backdrop-blur-xl rounded-2xl border border-white/5 p-6 overflow-hidden">
        {/* Background Glow */}
        <div className={`absolute -top-12 -right-12 w-32 h-32 bg-gradient-to-br ${gradient} rounded-full blur-3xl opacity-20 group-hover:opacity-40 transition-opacity`} />
        
        <div className="relative">
          <div className="flex items-start justify-between mb-4">
            <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${gradient} flex items-center justify-center shadow-lg`}>
              <Icon className="w-6 h-6 text-white" />
            </div>
            {trend && (
              <div className={`flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${trendUp ? 'bg-emerald-500/20 text-emerald-400' : 'bg-red-500/20 text-red-400'}`}>
                {trendUp ? '↑' : '↓'} {trend}
              </div>
            )}
          </div>
          
          <h3 className="text-slate-400 text-sm font-medium mb-1">{title}</h3>
          <p className="text-3xl font-bold text-white mb-1">{value}</p>
          {subtitle && (
            <p className="text-slate-500 text-sm">{subtitle}</p>
          )}
        </div>
      </div>
    </motion.div>
  );
}