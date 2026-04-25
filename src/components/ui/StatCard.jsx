import React from "react";
import { motion } from "framer-motion";
import { useAppSettings } from "@/lib/ThemeContext";

export default function StatCard({ 
  title, 
  value, 
  subtitle, 
  icon: Icon, 
  trend, 
  trendUp = true,
  gradient = "from-indigo-500 to-purple-500",
  delay = 0,
  onClick 
}) {
  const { cardOpacity, settings } = useAppSettings();
  
  // Pobierz kolor główny z motywu (dla tła kafelka)
  const primaryColor = getComputedStyle(document.documentElement)
    .getPropertyValue('--primary-color')
    .trim() || '#6366f1';
  
  // Tło kafelka z przezroczystością i delikatnym odcieniem koloru motywu
  // Używamy rgba z domieszką koloru głównego
  const bgColor = `rgba(30, 41, 59, ${cardOpacity})`;
  
  // Kolor akcentu dla przycisków i elementów wewnątrz kafelka
  const accentColor = primaryColor;
  
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay }}
      whileHover={{ y: -4, transition: { duration: 0.2 } }}
      className="relative group cursor-pointer"
      onClick={onClick}
    >
      <div className="absolute inset-0 bg-gradient-to-r opacity-0 group-hover:opacity-100 blur-xl transition-opacity duration-500"
        style={{ 
          backgroundImage: `linear-gradient(to right, ${accentColor}20, ${accentColor}40)`
        }} 
      />
      <div 
        className="relative backdrop-blur-xl rounded-2xl border border-white/5 p-6 overflow-hidden transition-all duration-300"
        style={{ 
          backgroundColor: bgColor,
          borderColor: `${accentColor}30`
        }}
      >
        {/* Background Glow z kolorem motywu */}
        <div 
          className={`absolute -top-12 -right-12 w-32 h-32 rounded-full blur-3xl opacity-20 group-hover:opacity-40 transition-opacity`}
          style={{ background: `radial-gradient(circle, ${accentColor}80, transparent)` }}
        />
        
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