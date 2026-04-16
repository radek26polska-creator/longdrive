import React, { createContext, useState, useContext, useEffect } from 'react';

const defaultSettings = {
  theme: 'dark',
  backgroundColor: 'bg-app-gradient1',
  textColor: 'white',
  requireKeyForTrip: false,
  animationType: 'fade',
  animationSpeed: 0.3,
};

const STORAGE_KEY = 'app_settings';

// Klasy motywów (dla przycisków i gradientów)
const themeClasses = [
  'theme-dark', 'theme-blue', 'theme-purple', 'theme-green',
  'theme-rose', 'theme-amber', 'theme-cyan', 'theme-orange',
  'theme-pink', 'theme-lime', 'theme-sky'
];

// Klasy tła
const bgClasses = [
  'bg-app-gradient1', 'bg-app-gradient2', 'bg-app-gradient3', 'bg-app-gradient4',
  'bg-app-gradient5', 'bg-app-gradient6', 'bg-app-gradient7', 'bg-app-gradient8',
  'bg-app-gradient9', 'bg-app-gradient10', 'bg-app-gradient11', 'bg-app-gradient12',
  'bg-app-gradient13', 'bg-app-gradient14', 'bg-app-gradient15',
  'bg-app-solid1', 'bg-app-solid2', 'bg-app-solid3', 'bg-app-solid4',
  'bg-app-solid5', 'bg-app-solid6', 'bg-app-solid7', 'bg-app-solid8',
  'bg-app-solid9', 'bg-app-solid10', 'bg-app-solid11', 'bg-app-solid12',
  'bg-app-solid13', 'bg-app-solid14', 'bg-app-solid15'
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

const AppSettingsContext = createContext();

export const AppSettingsProvider = ({ children }) => {
  const [settings, setSettings] = useState(defaultSettings);
  const [loading, setLoading] = useState(true);

  const loadSettings = async () => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        setSettings({ ...defaultSettings, ...parsed });
      } else {
        setSettings(defaultSettings);
      }
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

  useEffect(() => {
    loadSettings();
  }, []);

  return (
    <AppSettingsContext.Provider value={{ settings, saveSettings, loading }}>
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