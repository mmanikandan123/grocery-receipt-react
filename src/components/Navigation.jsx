// src/components/Navigation.jsx
import React, { useContext } from 'react';
import { NavLink } from 'react-router-dom';
import { AppContext } from '../context/AppContext';

export const Sidebar = () => {
  const { t } = useContext(AppContext);
  return (
    <aside className="sidebar">
        <div className="sidebar-header">
            <span className="material-symbols-outlined brand-logo">shopping_cart</span>
            <h1>{t('appTitle')}</h1>
        </div>
        <nav className="sidebar-nav">
            <ul>
                <li><NavLink to="/"><span className="material-symbols-outlined">receipt_long</span> {t('navHome')}</NavLink></li>
                <li><NavLink to="/addstock"><span className="material-symbols-outlined">inventory_2</span> {t('navStock')}</NavLink></li>
                <li><NavLink to="/reports"><span className="material-symbols-outlined">assessment</span> {t('navReports')}</NavLink></li>
            </ul>
        </nav>
        <LanguageSwitcher />
    </aside>
  );
};

export const MobileAppBar = () => {
    const { t } = useContext(AppContext);
    return (
        <header className="mobile-app-bar">
            <div className="app-bar-content">
                <span className="material-symbols-outlined brand-logo">shopping_cart</span>
                <h1>{t('appTitle')}</h1>
            </div>
            <LanguageSwitcher />
        </header>
    );
};

export const BottomNav = () => {
  const { t } = useContext(AppContext);
  return(
    <nav className="bottom-nav">
        <NavLink to="/"><span className="material-symbols-outlined">receipt_long</span><span>{t('navHome')}</span></NavLink>
        <NavLink to="/addstock"><span className="material-symbols-outlined">inventory_2</span><span>{t('navStock')}</span></NavLink>
        <NavLink to="/reports"><span className="material-symbols-outlined">assessment</span><span>{t('navReports')}</span></NavLink>
    </nav>
  );
};

const LanguageSwitcher = () => {
    const { t, currentLang, handleLanguageChange } = useContext(AppContext);
    return(
        <div className="language-switcher">
            <span className="material-symbols-outlined">translate</span>
            <select id="languageSelector" value={currentLang} onChange={handleLanguageChange}>
                <option value="ta-IN">தமிழ்</option><option value="en-IN">English</option><option value="hi-IN">हिंदी</option><option value="ml-IN">മലയാളം</option><option value="te-IN">తెలుగు</option>
            </select>
        </div>
    );
}