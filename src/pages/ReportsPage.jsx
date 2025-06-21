// src/pages/ReportsPage.jsx
import React, { useContext } from 'react';
import { AppContext } from '../context/AppContext';
export const ReportsPage = () => {
    const { t } = useContext(AppContext);
    return (<div className="container"><h2>{t('navReports')}</h2><p>This page will show sales and stock reports.</p></div>);
};
export default ReportsPage;