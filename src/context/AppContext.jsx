// src/context/AppContext.jsx
import React, { useState, useCallback, createContext } from 'react';
import languagesData from '../data/languages.json';

export const AppContext = createContext();

export const AppProvider = ({ children }) => {
  const [currentLang, setCurrentLang] = useState(localStorage.getItem('preferredLanguage') || 'ta-IN');

  const t = useCallback((key) => {
    return languagesData[currentLang]?.[key] || `[${key}]`;
  }, [currentLang]);
  
  const handleLanguageChange = (e) => {
    const newLang = e.target.value;
    setCurrentLang(newLang);
    localStorage.setItem('preferredLanguage', newLang);
  };

  const value = { t, currentLang, handleLanguageChange };

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
};