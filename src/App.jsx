// src/App.jsx
import React from 'react';
import { Routes, Route } from 'react-router-dom';
import { AppProvider } from './context/AppContext';
import { Sidebar, MobileAppBar, BottomNav } from './components/Navigation';
import HomePage from './pages/HomePage';
import StockPage from './pages/StockPage';
import ReportsPage from './pages/ReportsPage';

const AppContent = () => {
    return (
      <div className="app-layout">
        <Sidebar />
        <MobileAppBar />
        <main className="main-content">
          <Routes>
            <Route path="/" element={<HomePage />} />
            <Route path="/addstock" element={<StockPage />} />
            <Route path="/reports" element={<ReportsPage />} />
          </Routes>
        </main>
        <BottomNav />
      </div>
    );
};

function App() {
  return (
    <AppProvider>
      <AppContent />
    </AppProvider>
  );
}
export default App;