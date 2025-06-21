// src/pages/StockPage.jsx
import React, { useContext } from 'react';
import { AppContext } from '../context/AppContext';
export const StockPage = () => {
    const { t } = useContext(AppContext);
    return (<div className="container"><h2>{t('navStock')}</h2><p>This is where the form to add new items to the inventory will go.</p></div>);
};
export default StockPage;