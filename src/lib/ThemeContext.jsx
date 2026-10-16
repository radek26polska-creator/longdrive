import React, { createContext, useState, useContext, useEffect } from 'react';

const defaultSettings = {
  theme: 'dark',
  backgroundColor: 'bg-app-gradient1',
  textColor: 'white',
  fontColor: '#f8fafc',
  fontFamily: 'Inter, ui-sans-serif, system-ui, sans-serif',
  fontSize: 14,
  buttonColor: '#5b7cfa',
  buttonTextColor: '#ffffff',
  buttonHoverColor: null,
  menuHighlightColor: '#7c3aed',
  menuTextColor: null,
  menuActiveTextColor: null,
  requireKeyForTrip: false,
  animationType: 'fade',
  animationSpeed: 0.3,
  menuOpacity: 0.5,
  cardOpacity: 0.5,
  cardColor: 'slate',
  customBackground: null,
  menuBackgroundColor: '#0f172a',
  cardBackgroundColor: '#1e293b',
  cardBorderColor: '#475569',
  cardBorderWidth: 1,
};

const STORAGE_KEY = 'app_settings';

// Klasy motywów (dla przycisków i gradientów)
const themeClasses = [
  'theme-dark', 'theme-blue', 'theme-purple', 'theme-green',
  'theme-rose', 'theme-amber', 'theme-cyan', 'theme-orange',
  'theme-pink', 'theme-lime', 'theme-sky'
];

// Klasy tła - DODANE 5 NOWYCH (STAXX)
const bgClasses = [
  'bg-app-gradient1', 'bg-app-gradient2', 'bg-app-gradient3', 'bg-app-gradient4',
  'bg-app-gradient5', 'bg-app-gradient6', 'bg-app-gradient7', 'bg-app-gradient8',
  'bg-app-gradient9', 'bg-app-gradient10', 'bg-app-gradient11', 'bg-app-gradient12',
  'bg-app-gradient13', 'bg-app-gradient14', 'bg-app-gradient15',
  'bg-app-solid1', 'bg-app-solid2', 'bg-app-solid3', 'bg-app-solid4',
  'bg-app-solid5', 'bg-app-solid6', 'bg-app-solid7', 'bg-app-solid8',
  'bg-app-solid9', 'bg-app-solid10', 'bg-app-solid11', 'bg-app-solid12',
  'bg-app-solid13', 'bg-app-solid14', 'bg-app-solid15',
  'bg-app-staxx1', 'bg-app-staxx2', 'bg-app-staxx3', 'bg-app-staxx4', 'bg-app-staxx5'
];

// Klasy kolorów tekstu
const textColorClasses = [
  'text-theme-white', 'text-theme-white-secondary', 'text-theme-white-muted',
  'text-theme-blue', 'text-theme-blue-secondary', 'text-theme-blue-muted',
  'text-theme-purple', 'text-theme-purple-secondary', 'text-theme-purple-muted',
  'text-theme-green', 'text-theme-green-secondary', 'text-theme-green-muted',
  'text-theme-amber', 'text-theme-amber-secondary', 'text-theme-amber-muted',
  'text-theme-rose', 'text-theme-rose-secondary', 'text-theme-rose-muted',
  'text-theme-cyan', 'text-theme-cyan-secondary', 'text-theme-cyan-muted',
  'text-theme-orange', 'text-theme-orange-secondary', 'text-theme-orange-muted',
  'text-theme-pink', 'text-theme-pink-secondary', 'text-theme-pink-muted',
  'text-theme-lime', 'text-theme-lime-secondary', 'text-theme-lime-muted',
  'text-theme-sky', 'text-theme-sky-secondary', 'text-theme-sky-muted'
];

// Klasy kolorów dla kafelków (GlassCard i StatCard)
const cardColorClasses = [
  'card-slate', 'card-blue', 'card-purple', 'card-green',
  'card-amber', 'card-rose', 'card-cyan', 'card-orange',
  'card-pink', 'card-lime', 'card-sky'
];

const AppSettingsContext = createContext();

export const AppSettingsProvider = ({ children }) => {
  const [settings, setSettings] = useState(defaultSettings);
  const [loading, setLoading] = useState(true);
  const [customBackground, setCustomBackground] = useState(null);
  const [menuOpacity, setMenuOpacity] = useState(0.5);
  const [cardOpacity, setCardOpacity] = useState(0.5);
  
  // NOWE STATE DLA KOLORÓW TŁA
  const [menuBackgroundColor, setMenuBackgroundColor] = useState('#0f172a');
  const [cardBackgroundColor, setCardBackgroundColor] = useState('#1e293b');

  const loadSettings = async () => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      const legacySettings = localStorage.getItem('theme_settings') || localStorage.getItem('appearance_settings');
      if (saved || legacySettings) {
        const parsed = JSON.parse(saved || legacySettings);
        const nextSettings = {
          ...defaultSettings,
          ...parsed,
          fontColor: parsed.fontColor ?? parsed.font_color ?? defaultSettings.fontColor,
          fontFamily: parsed.fontFamily ?? parsed.font_family ?? defaultSettings.fontFamily,
          fontSize: parsed.fontSize ?? parsed.font_size ?? defaultSettings.fontSize,
          buttonColor: parsed.buttonColor ?? parsed.button_color ?? defaultSettings.buttonColor,
          buttonTextColor: parsed.buttonTextColor ?? parsed.button_text_color ?? defaultSettings.buttonTextColor,
          buttonHoverColor: parsed.buttonHoverColor ?? parsed.button_hover_color ?? defaultSettings.buttonHoverColor,
          menuHighlightColor: parsed.menuHighlightColor ?? parsed.menu_highlight_color ?? defaultSettings.menuHighlightColor,
          menuTextColor: parsed.menuTextColor ?? parsed.menu_text_color ?? defaultSettings.menuTextColor,
          menuActiveTextColor: parsed.menuActiveTextColor ?? parsed.menu_active_text_color ?? defaultSettings.menuActiveTextColor,
          menuOpacity: parsed.menuOpacity ?? parsed.menu_opacity,
          cardOpacity: parsed.cardOpacity ?? parsed.card_opacity,
          customBackground: parsed.customBackground ?? parsed.custom_background,
          menuBackgroundColor: parsed.menuBackgroundColor ?? parsed.menu_background_color,
          cardBackgroundColor: parsed.cardBackgroundColor ?? parsed.card_background_color,
          cardBorderColor: parsed.cardBorderColor ?? parsed.card_border_color,
          cardBorderWidth: parsed.cardBorderWidth ?? parsed.card_border_width,
        };
        setSettings(nextSettings);
        // Wczytaj kolory tła z ustawień
        if (nextSettings.menuBackgroundColor) setMenuBackgroundColor(nextSettings.menuBackgroundColor);
        if (nextSettings.cardBackgroundColor) setCardBackgroundColor(nextSettings.cardBackgroundColor);
      } else {
        setSettings(defaultSettings);
      }
      
      // Wczytaj przezroczystości
      const savedMenuOpacity = localStorage.getItem('menu_opacity');
      if (savedMenuOpacity) setMenuOpacity(parseFloat(savedMenuOpacity));
      else if (saved) setMenuOpacity(parseFloat(JSON.parse(saved).menuOpacity ?? defaultSettings.menuOpacity));
      const savedCardOpacity = localStorage.getItem('card_opacity');
      if (savedCardOpacity) setCardOpacity(parseFloat(savedCardOpacity));
      else if (saved) setCardOpacity(parseFloat(JSON.parse(saved).cardOpacity ?? defaultSettings.cardOpacity));
      
      // Wczytaj własne tło
      const savedBg = localStorage.getItem('custom_background');
      // Blob URLs are scoped to the previous document and cannot survive reloads.
      if (savedBg && !savedBg.startsWith('blob:')) setCustomBackground(savedBg);
      
      // Wczytaj kolory tła z localStorage (bezpośrednio dla zgodności)
      const savedMenuBg = localStorage.getItem('menu_background_color');
      if (savedMenuBg) setMenuBackgroundColor(savedMenuBg);
      const savedCardBg = localStorage.getItem('card_background_color');
      if (savedCardBg) setCardBackgroundColor(savedCardBg);
    } catch (error) {
      console.error('Błąd ładowania ustawień:', error);
      setSettings(defaultSettings);
    } finally {
      setLoading(false);
    }
  };

  const saveSettings = async (newSettings) => {
    const nextSettings = { ...defaultSettings, ...newSettings };
    setSettings(nextSettings);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(nextSettings));
    localStorage.setItem('menu_opacity', String(nextSettings.menuOpacity ?? menuOpacity));
    localStorage.setItem('card_opacity', String(nextSettings.cardOpacity ?? cardOpacity));
    if (nextSettings.customBackground) localStorage.setItem('custom_background', nextSettings.customBackground);
  };

  const saveMenuOpacity = (value) => {
    setMenuOpacity(value);
    const nextSettings = { ...settings, menuOpacity: value };
    setSettings(nextSettings);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(nextSettings));
    localStorage.setItem('menu_opacity', value);
  };

  const saveCardOpacity = (value) => {
    setCardOpacity(value);
    const nextSettings = { ...settings, cardOpacity: value };
    setSettings(nextSettings);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(nextSettings));
    localStorage.setItem('card_opacity', value);
  };

  const saveCustomBackground = (url) => {
    if (url?.startsWith('blob:')) return;
    const nextBackground = url || null;
    setCustomBackground(nextBackground);
    const nextSettings = { ...settings, customBackground: nextBackground };
    setSettings(nextSettings);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(nextSettings));
    if (url) {
      localStorage.setItem('custom_background', url);
    } else {
      localStorage.removeItem('custom_background');
    }
  };

  // NOWE FUNKCJE ZAPISU KOLORÓW TŁA
  const saveMenuBackgroundColor = (color) => {
    setMenuBackgroundColor(color);
    localStorage.setItem('menu_background_color', color);
    // Zapisz również w settings dla spójności
    const updatedSettings = { ...settings, menuBackgroundColor: color };
    setSettings(updatedSettings);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updatedSettings));
  };

  const saveCardBackgroundColor = (color) => {
    setCardBackgroundColor(color);
    localStorage.setItem('card_background_color', color);
    // Zapisz również w settings dla spójności
    const updatedSettings = { ...settings, cardBackgroundColor: color };
    setSettings(updatedSettings);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updatedSettings));
  };

  // Nakładanie klasy motywu na <html> (dla zmiennych CSS gradientów)
  useEffect(() => {
    const root = document.documentElement;
    root.classList.remove(...themeClasses);
    root.classList.add(`theme-${settings.theme}`);
    root.classList.toggle('dark', settings.theme === 'dark' || settings.mode === 'dark' || settings.darkMode === true);
  }, [settings.theme, settings.mode, settings.darkMode]);

  useEffect(() => {
    const root = document.documentElement;
    const fontColor = settings.fontColor || defaultSettings.fontColor;
    const fontFamily = settings.fontFamily || defaultSettings.fontFamily;
    const fontSize = settings.fontSize || defaultSettings.fontSize;
    const buttonColor = settings.buttonColor || defaultSettings.buttonColor;
    const buttonTextColor = settings.buttonTextColor || defaultSettings.buttonTextColor;
    const buttonHoverColor = settings.buttonHoverColor || buttonColor;
    const menuHighlightColor = settings.menuHighlightColor || defaultSettings.menuHighlightColor;

    const toRgba = (hex, alpha) => {
      const clean = hex.replace('#', '');
      const full = clean.length === 3 ? clean.split('').map((char) => char + char).join('') : clean;
      const value = parseInt(full, 16);
      const r = (value >> 16) & 255;
      const g = (value >> 8) & 255;
      const b = value & 255;
      return `rgba(${r}, ${g}, ${b}, ${alpha})`;
    };

    root.style.setProperty('--text-primary', fontColor);
    root.style.setProperty('--text-secondary', fontColor === '#0f172a' ? '#475569' : '#cbd5e1');
    root.style.setProperty('--primary-color', buttonColor);
    root.style.setProperty('--primary-dark', buttonHoverColor);
    root.style.setProperty('--button-text-color', buttonTextColor);
    root.style.setProperty('--button-hover-color', buttonHoverColor);
    root.style.setProperty('--accent-color', buttonColor);
    root.style.setProperty('--primary-light', buttonColor);
    root.style.setProperty('--primary-soft', toRgba(buttonColor, 0.12));
    root.style.setProperty('--menu-highlight-color', menuHighlightColor);
    root.style.setProperty('--menu-highlight-soft', toRgba(menuHighlightColor, 0.16));
    root.style.setProperty('--primary-gradient', `linear-gradient(135deg, ${buttonColor}, ${buttonColor})`);
    root.style.setProperty('--app-font-family', fontFamily);
    root.style.setProperty('--app-font-size', `${fontSize}px`);
    document.body.style.color = fontColor;
    document.body.style.fontFamily = fontFamily;
    document.body.style.fontSize = `${fontSize}px`;
  }, [settings.fontColor, settings.fontFamily, settings.fontSize, settings.buttonColor, settings.buttonTextColor, settings.buttonHoverColor, settings.menuHighlightColor]);

  // Nakładanie klasy tła na <body>
  useEffect(() => {
    const body = document.body;
    body.classList.remove(...bgClasses);
    body.classList.add(settings.backgroundColor);
  }, [settings.backgroundColor]);

  // Nakładanie klas koloru tekstu na <body>
  useEffect(() => {
    const body = document.body;
    body.classList.remove(...textColorClasses);
    if (settings.textColor === 'white') {
      body.classList.add('text-theme-white', 'text-theme-white-secondary', 'text-theme-white-muted');
    } else {
      body.classList.add(
        `text-theme-${settings.textColor}`,
        `text-theme-${settings.textColor}-secondary`,
        `text-theme-${settings.textColor}-muted`
      );
    }
  }, [settings.textColor]);

  // Nakładanie klasy koloru kafelków na <html>
  useEffect(() => {
    const root = document.documentElement;
    if (root) {
      root.classList.remove(...cardColorClasses);
      root.classList.add(`card-${settings.cardColor || 'slate'}`);
    }
  }, [settings.cardColor]);

  useEffect(() => {
    loadSettings();
  }, []);

  return (
    <AppSettingsContext.Provider value={{ 
      settings, 
      saveSettings, 
      loading,
      menuOpacity,
      cardOpacity,
      saveMenuOpacity,
      saveCardOpacity,
      customBackground,
      saveCustomBackground,
      cardColor: settings.cardColor,
      fontColor: settings.fontColor,
      fontFamily: settings.fontFamily,
      fontSize: settings.fontSize,
      buttonColor: settings.buttonColor,
      menuHighlightColor: settings.menuHighlightColor,
      menuBackgroundColor,
      cardBackgroundColor,
      cardBorderColor: settings.cardBorderColor,
      cardBorderWidth: settings.cardBorderWidth,
      saveMenuBackgroundColor,
      saveCardBackgroundColor,
    }}>
      {children}
    </AppSettingsContext.Provider>
  );
};

export const useAppSettings = () => {
  const context = useContext(AppSettingsContext);
  if (!context) {
    throw new Error('useAppSettings must be used within AppSettingsProvider');
  }
  return context;
};