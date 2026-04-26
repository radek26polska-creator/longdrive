import React, { createContext, useState, useContext, useEffect } from 'react';

const defaultSettings = {
  theme: 'dark',
  backgroundColor: 'bg-app-gradient1',
  textColor: 'white',
  requireKeyForTrip: false,
  animationType: 'fade',
  animationSpeed: 0.3,
  menuOpacity: 0.5,
  cardOpacity: 0.5,
  cardColor: 'slate',
  customBackground: null,
  // NOWE USTAWIENIA KOLORÓW TŁA
  menuBackgroundColor: '#0f172a',     // domyślnie ciemny granat
  cardBackgroundColor: '#1e293b',    // domyślnie jaśniejszy granat
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
      if (saved) {
        const parsed = JSON.parse(saved);
        setSettings({ ...defaultSettings, ...parsed });
        // Wczytaj kolory tła z ustawień
        if (parsed.menuBackgroundColor) setMenuBackgroundColor(parsed.menuBackgroundColor);
        if (parsed.cardBackgroundColor) setCardBackgroundColor(parsed.cardBackgroundColor);
      } else {
        setSettings(defaultSettings);
      }
      
      // Wczytaj przezroczystości
      const savedMenuOpacity = localStorage.getItem('menu_opacity');
      if (savedMenuOpacity) setMenuOpacity(parseFloat(savedMenuOpacity));
      const savedCardOpacity = localStorage.getItem('card_opacity');
      if (savedCardOpacity) setCardOpacity(parseFloat(savedCardOpacity));
      
      // Wczytaj własne tło
      const savedBg = localStorage.getItem('custom_background');
      if (savedBg) setCustomBackground(savedBg);
      
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
    setSettings(newSettings);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(newSettings));
  };

  const saveMenuOpacity = (value) => {
    setMenuOpacity(value);
    localStorage.setItem('menu_opacity', value);
  };

  const saveCardOpacity = (value) => {
    setCardOpacity(value);
    localStorage.setItem('card_opacity', value);
  };

  const saveCustomBackground = (url) => {
    setCustomBackground(url);
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
  }, [settings.theme]);

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
      // NOWE WARTOŚCI DLA KOLORÓW TŁA
      menuBackgroundColor,
      cardBackgroundColor,
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