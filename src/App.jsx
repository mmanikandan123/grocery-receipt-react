// src/App.jsx

import React, { useState, useEffect, useRef, useCallback, createContext, useContext } from 'react';
import { Routes, Route, NavLink, useLocation } from 'react-router-dom';
import './style.css';
import languagesData from './data/languages.json';
import priceListData from './data/pricelist.json';

// --- Context for sharing translations and language functions ---
const AppContext = createContext();

// --- Main App Component: Manages layout and page routing ---
function App() {
  const [currentLang, setCurrentLang] = useState(localStorage.getItem('preferredLanguage') || 'ta-IN');

  const t = useCallback((key) => {
    return languagesData[currentLang]?.[key] || `[${key}]`;
  }, [currentLang]);
  
  const handleLanguageChange = (e) => {
    const newLang = e.target.value;
    setCurrentLang(newLang);
    localStorage.setItem('preferredLanguage', newLang);
  };

  return (
    <AppContext.Provider value={{ t, currentLang, handleLanguageChange }}>
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
    </AppContext.Provider>
  );
}

// --- Navigation Components ---
const Sidebar = () => {
  const { t, currentLang, handleLanguageChange } = useContext(AppContext);
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
        <div className="language-switcher">
            <span className="material-symbols-outlined">translate</span>
            <span>{t('changeLanguageLabel')}</span>
            <select id="languageSelector" value={currentLang} onChange={handleLanguageChange}>
                <option value="ta-IN">தமிழ்</option><option value="en-IN">English</option><option value="hi-IN">हिंदी</option><option value="ml-IN">മലയാളം</option><option value="te-IN">తెలుగు</option>
            </select>
        </div>
    </aside>
  );
};

const MobileAppBar = () => {
    const { t, currentLang, handleLanguageChange } = useContext(AppContext);
    return (
        <header className="mobile-app-bar">
            <div className="app-bar-content">
                <span className="material-symbols-outlined brand-logo">shopping_cart</span>
                <h1>{t('appTitle')}</h1>
            </div>
            <div className="language-switcher">
                <span className="material-symbols-outlined">translate</span>
                <select id="languageSelector" value={currentLang} onChange={handleLanguageChange}>
                    <option value="ta-IN">தமிழ்</option>
                    <option value="en-IN">English</option>
                    <option value="hi-IN">हिंदी</option>
                    <option value="ml-IN">മലയാളം</option>
                    <option value="te-IN">తెలుగు</option>
                </select>
            </div>
        </header>
    );
};

const BottomNav = () => {
  const { t } = useContext(AppContext);
  return(
    <nav className="bottom-nav">
        <NavLink to="/">
            <span className="material-symbols-outlined">receipt_long</span>
            <span>{t('navHome')}</span>
        </NavLink>
        <NavLink to="/addstock">
            <span className="material-symbols-outlined">inventory_2</span>
            <span>{t('navStock')}</span>
        </NavLink>
        <NavLink to="/reports">
            <span className="material-symbols-outlined">assessment</span>
            <span>{t('navReports')}</span>
        </NavLink>
    </nav>
  );
};

// --- Page Components ---
const HomePage = () => {
   const { t, currentLang } = useContext(AppContext);
  const [groceryItems, setGroceryItems] = useState([]);
  const [shopDetails, setShopDetails] = useState({ name: '', address: '', phone: '' });
  const [receiptNumber, setReceiptNumber] = useState('');
  const [isGstEnabled, setIsGstEnabled] = useState(false);
  const [inputMode, setInputMode] = useState('speech');
  const [statusText, setStatusText] = useState('');
  const [isListening, setIsListening] = useState(false);

  const recognitionRef = useRef(null);
  const codeReaderRef = useRef(null);
  const videoRef = useRef(null);

  const generateReceiptNumber = useCallback(() => { const now = new Date(); return `${now.getFullYear()}${(now.getMonth() + 1).toString().padStart(2, '0')}${now.getDate().toString().padStart(2, '0')}-${now.getHours().toString().padStart(2, '0')}${now.getMinutes().toString().padStart(2, '0')}`; }, []);
  const calculateItemTotal = useCallback((item, baseUnit = null) => { const parts = item.quantity.toLowerCase().split(' '); const num = parseFloat(parts[0]) || 1; const unit = parts[1] || 'piece'; const price = item.price || 0; if (baseUnit) { if (baseUnit === 'kg' && (unit === 'g' || unit === 'gram' || unit === 'கிராம்')) return (num / 1000) * price; if (baseUnit === 'liter' && (unit === 'ml' || unit === 'மில்லி')) return (num / 1000) * price; if (baseUnit === '100g' && (unit === 'g' || unit === 'gram' || unit === 'கிராம்')) return (num / 100) * price; } switch (unit) { case 'gram': case 'g': case 'கிராம்': return (num / 100) * price; case 'ml': case 'மில்லி': return (num / 100) * price; default: return num * price; } }, []);
  const findProductInfo = useCallback((itemName, barcode = null) => { if (barcode) return priceListData.find(p => p.barcode === barcode); if (itemName) { const searchTerm = itemName.toLowerCase(); const foundEntry = priceListData.find(p => p.name === searchTerm); if (!foundEntry) return null; if (foundEntry.price !== undefined) return foundEntry; if (foundEntry.mapsTo) return priceListData.find(p => p.name === foundEntry.mapsTo && p.price !== undefined); } return null; }, []);
  const parseTranscript = useCallback((text) => { const numberMap = { 'ഒന്ന്': 1, 'ఒకటి': 1, 'एक': 1, 'രണ്ട്': 2, 'రెండు': 2, 'दो': 2, 'മൂന്ന്': 3, 'మూడు': 3, 'तीन': 3, 'നാല്': 4, 'నాలుగు': 4, 'चार': 4, 'അഞ്ച്': 5, 'ఐదు': 5, 'पांच': 5, 'ஒன்று': 1, 'ஒண்ணு': 1, 'ஒரு': 1, 'ரெண்டு': 2, 'இரண்டு': 2, 'மூணு': 3, 'மூன்று': 3, 'நாலு': 4, 'நான்கு': 4, 'ஐந்து': 5, 'அஞ்சு': 5, 'ஆறு': 6, 'ஏழு': 7, 'எட்டு': 8, 'ஒன்பது': 9, 'பத்து': 10, 'அரை': 0.5, 'அர': 0.5, 'கால்': 0.25, 'முக்கால்': 0.75, 'ഒன்றര': 1.5, 'paav': 0.25, 'आधा': 0.5, 'അര': 0.5 }; const units = ['கிலோ', 'கிராம்', 'லிட்டர்', 'மில்லி', 'பீஸ்', 'டஜன்', 'പാക്കറ്റ്', 'kg', 'g', 'l', 'ml', 'kilo', 'gram', 'liter', 'किलो', 'ग्राम', 'लीटर', 'दर्जन', 'പീസ്', 'കിലോ', 'ഗ്രാം', 'కిలో', 'గ్రాము', 'లీటరు', 'పీస్', 'డజను']; let words = text.split(' '); let quantity = 1; let unit = 'piece'; let itemNameParts = []; words.forEach(word => { let w = word.toLowerCase(); if (numberMap[w] !== undefined) quantity = numberMap[w]; else if (!isNaN(parseFloat(w))) quantity = parseFloat(w); else if (units.includes(w)) unit = w; else itemNameParts.push(word); }); const itemName = itemNameParts.join(' ').trim(); if (itemName) return { itemName, quantity, unit }; return null; }, []);
  const createItemFromText = useCallback((text) => { const parsed = parseTranscript(text); if (!parsed) return null; const priceInfo = findProductInfo(parsed.itemName); const newItem = { name: parsed.itemName, quantity: `${parsed.quantity} ${parsed.unit}`, price: priceInfo ? priceInfo.price : 0, total: 0 }; newItem.total = calculateItemTotal(newItem, priceInfo ? priceInfo.baseUnit : null); return newItem; }, [parseTranscript, findProductInfo, calculateItemTotal]);
  const addNewItem = useCallback((item) => { setGroceryItems(prevItems => { const lastItem = prevItems[prevItems.length - 1]; if (lastItem && lastItem.quantity.includes('piece') && item.name.toLowerCase().startsWith(lastItem.name.toLowerCase())) { const newItems = [...prevItems]; newItems[newItems.length - 1] = item; return newItems; } else { return [...prevItems, item]; } }); }, []);

  useEffect(() => { const savedState = JSON.parse(localStorage.getItem('groceryReceiptState')); if (savedState) { setGroceryItems(savedState.items || []); setShopDetails(savedState.shopDetails || { name: '', address: '', phone: '' }); setIsGstEnabled(savedState.shopDetails?.gstEnabled || false); setReceiptNumber(savedState.shopDetails?.receiptNo || generateReceiptNumber()); } else { setReceiptNumber(generateReceiptNumber()); } }, [generateReceiptNumber]);
  useEffect(() => { setStatusText(t('statusInitial')); }, [t]);
  useEffect(() => { const state = { items: groceryItems, shopDetails: { ...shopDetails, gstEnabled: isGstEnabled, receiptNo: receiptNumber }}; localStorage.setItem('groceryReceiptState', JSON.stringify(state)); }, [groceryItems, shopDetails, isGstEnabled, receiptNumber]);

  const switchInputMode = (mode) => { if (isListening) recognitionRef.current?.stop(); codeReaderRef.current?.reset(); setInputMode(mode); };
  
  const startListening = () => { if (!recognitionRef.current) { if (!('SpeechRecognition' in window || 'webkitSpeechRecognition' in window)) return; const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition; recognitionRef.current = new SpeechRecognition(); recognitionRef.current.continuous = true; recognitionRef.current.interimResults = true; recognitionRef.current.onstart = () => setIsListening(true); recognitionRef.current.onend = () => setIsListening(false); recognitionRef.current.onerror = (e) => console.error('Speech Error:', e.error); recognitionRef.current.onresult = (event) => { let final = '', transcriptToProcess = ''; for (let i = event.resultIndex; i < event.results.length; ++i) { if (event.results[i].isFinal) final += event.results[i][0].transcript; } if(final.trim()) { transcriptToProcess = final.trim(); const newItem = createItemFromText(transcriptToProcess); if(newItem) addNewItem(newItem); setStatusText(`Added: ${transcriptToProcess}`); } }; } if (recognitionRef.current) { recognitionRef.current.lang = currentLang; recognitionRef.current.start(); } };
  const stopListening = () => recognitionRef.current?.stop();

  useEffect(() => { if (inputMode === 'scan' && codeReaderRef.current && videoRef.current) { codeReaderRef.current.decodeFromVideoDevice(undefined, videoRef.current, (result) => { if (result) { codeReaderRef.current.reset(); const productInfo = findProductInfo(null, result.getText()); if (productInfo) { const newItem = createItemFromText(productInfo.name); if (newItem) addNewItem(newItem); } else { alert(`Barcode ${result.getText()} not found.`); } switchInputMode('manual'); } }).catch(err => { if (!(err instanceof window.ZXing.NotFoundException)) console.error(err); }); } return () => codeReaderRef.current?.reset(); }, [inputMode, addNewItem, findProductInfo, createItemFromText]);
  
  const handleUndo = () => setGroceryItems(prev => prev.slice(0, -1));
  const handleManualSubmit = (e) => { e.preventDefault(); const name = e.target.elements.manualItemName.value; const qty = e.target.elements.manualItemQty.value; const unit = e.target.elements.manualItemUnit.value; const newItem = createItemFromText(`${name} ${qty} ${unit}`); if(newItem) addNewItem(newItem); e.target.reset(); };
  const handleDeleteItem = (index) => setGroceryItems(prev => prev.filter((_, i) => i !== index));
  const handlePriceChange = (e, index) => { const newPrice = parseFloat(e.target.value) || 0; setGroceryItems(prevItems => { const newItems = [...prevItems]; const item = newItems[index]; item.price = newPrice; item.total = calculateItemTotal(item); return newItems; }); };

    const handlePrint = () => {
      if (groceryItems.length === 0) {
          alert(t('listEmpty')); // Use the translation key
          return;
      }
      // ... rest of the print logic is the same ...
      const subTotal = groceryItems.reduce((total, item) => total + item.total, 0);
      const isGstEnabled = document.getElementById('gstCheckbox').checked; // get current state
      const cgst = isGstEnabled ? subTotal * 0.09 : 0;
      const sgst = isGstEnabled ? subTotal * 0.09 : 0;
      const grandTotal = subTotal + cgst + sgst;
      let totalsHtml = '';
      if (isGstEnabled) {
          totalsHtml += `<h3>${t('subTotal')}: ₹${subTotal.toFixed(2)}</h3>`;
          totalsHtml += `<h3>${t('cgst')}: ₹${cgst.toFixed(2)}</h3>`;
          totalsHtml += `<h3>${t('sgst')}: ₹${sgst.toFixed(2)}</h3>`;
      }
      totalsHtml += `<h3 style="font-weight: bold;">${t('grandTotal')}: ₹${grandTotal.toFixed(2)}</h3>`;
      document.getElementById('receipt-logo-container').innerHTML = `<span class="material-symbols-outlined brand-logo">shopping_cart</span>`;
      document.getElementById('receipt-header').innerHTML = `<h2>${shopDetails.name || 'Your Shop'}</h2><p>${shopDetails.address || 'Your Address'}</p><p>${shopDetails.phone || 'Your Phone'}</p><p>Date: ${new Date().toLocaleDateString('en-IN')} | Receipt No: ${receiptNumber}</p><hr>`;
      document.getElementById('receipt-table').innerHTML = `<thead><tr><th>${t('colSNo')}</th><th>${t('colItem')}</th><th>${t('colQty')}</th><th>${t('colPrice')}</th><th>${t('colTotal')}</th></tr></thead><tbody>${groceryItems.map((item, index) => `<tr><td>${index + 1}</td><td>${item.name}</td><td>${item.quantity}</td><td>${item.price.toFixed(2)}</td><td>${item.total.toFixed(2)}</td></tr>`).join('')}</tbody>`;
      document.getElementById('receipt-totals-breakdown').innerHTML = totalsHtml;
      const receiptEl = document.getElementById('receipt-to-print');
      receiptEl.classList.remove('hidden');
      window.print();
      receiptEl.classList.add('hidden');
      setTimeout(() => {
          if (confirm(t('clearListConfirm'))) {
              setGroceryItems([]);
              setReceiptNumber(generateReceiptNumber());
          }
      }, 500);
  };

  const subTotalCalc = groceryItems.reduce((total, item) => total + item.total, 0);
  const cgstCalc = isGstEnabled ? subTotalCalc * 0.09 : 0;
  const sgstCalc = isGstEnabled ? subTotalCalc * 0.09 : 0;
  const grandTotalCalc = subTotalCalc + cgstCalc + sgstCalc;

  return (
    <div className="container">
      <div className="shop-details">
        <h2 data-lang-key="shopDetailsTitle">{t('shopDetailsTitle')}</h2>
        <div className="shop-details-grid">
            <input type="text" id="shopName" placeholder={t('shopNamePlaceholder')} value={shopDetails.name} onChange={(e) => setShopDetails(s => ({...s, name: e.target.value}))}/>
            <input type="text" id="shopAddress" placeholder={t('shopAddressPlaceholder')} value={shopDetails.address} onChange={(e) => setShopDetails(s => ({...s, address: e.target.value}))}/>
            <input type="text" id="shopPhone" placeholder={t('shopPhonePlaceholder')} value={shopDetails.phone} onChange={(e) => setShopDetails(s => ({...s, phone: e.target.value}))}/>
            <input type="text" id="receiptNumber" placeholder={t('receiptNumberPlaceholder')} value={receiptNumber} readOnly/>
        </div>
        <div className="gst-toggle">
            <input type="checkbox" id="gstCheckbox" checked={isGstEnabled} onChange={(e) => setIsGstEnabled(e.target.checked)}/>
            <label htmlFor="gstCheckbox" data-lang-key="enableGstLabel">{t('enableGstLabel')}</label>
        </div>
      </div>
      
      <div className="input-mode-container">
        <h2 data-lang-key="addItemsTitle">{t('addItemsTitle')}</h2>
        <div className="input-toggle-buttons">
            <button onClick={() => switchInputMode('speech')} className={`toggle-btn ${inputMode === 'speech' ? 'active' : ''}`}><span className="material-symbols-outlined">mic</span> <span>{t('speak')}</span></button>
            <button onClick={() => switchInputMode('manual')} className={`toggle-btn ${inputMode === 'manual' ? 'active' : ''}`}><span className="material-symbols-outlined">keyboard</span> <span>{t('type')}</span></button>
            <button onClick={() => switchInputMode('scan')} className={`toggle-btn ${inputMode === 'scan' ? 'active' : ''}`}><span className="material-symbols-outlined">barcode_scanner</span> <span>{t('scan')}</span></button>
        </div>
        {inputMode === 'speech' && <div id="speechControls" className="input-panel"><button id="startBtn" className={isListening ? 'listening' : ''} onClick={isListening ? stopListening : startListening}><span className="material-symbols-outlined">mic</span><span>{isListening ? t('stopListening') : t('startListening')}</span></button><p id="status">{statusText}</p></div>}
        {inputMode === 'manual' && <div id="manualControls" className="input-panel"><form id="manualForm" onSubmit={handleManualSubmit}><input type="text" name="manualItemName" placeholder={t('itemNamePlaceholder')} required /><div className="manual-inputs"><input type="number" step="any" name="manualItemQty" placeholder={t('itemQtyPlaceholder')} defaultValue="1" required /><select name="manualItemUnit"><option value="piece">piece</option><option value="kg">kg</option><option value="gram">gram</option><option value="liter">liter</option><option value="ml">ml</option><option value="dozen">dozen</option><option value="packet">packet</option></select></div><button type="submit"><span className="material-symbols-outlined">add</span><span>{t('addToList')}</span></button><button type="button" className="secondary-btn" onClick={handleUndo}><span className="material-symbols-outlined">undo</span><span>{t('undo')}</span></button></form></div>}
        {inputMode === 'scan' && <div id="scannerControls" className="input-panel"><div className="scanner-viewport"><video id="barcode-scanner-video" ref={videoRef}></video></div><p id="scannerStatus">{t('scannerStatus')}</p></div>}
      </div>
      
      <div className="grocery-list">
        <h2 data-lang-key="itemListTitle">{t('itemListTitle')}</h2>
        <table>
          <thead><tr><th>{t('colSNo')}</th><th>{t('colItem')}</th><th>{t('colQty')}</th><th>{t('colPrice')}</th><th>{t('colTotal')}</th><th>{t('colDelete')}</th></tr></thead>
          <tbody>
            {groceryItems.map((item, index) => (
              <tr key={index}>
                <td data-label-mobile={t('colSNo')}>{index + 1}</td>
                <td data-label-mobile={t('colItem')}>{item.name}</td>
                <td data-label-mobile={t('colQty')}>{item.quantity}</td>
                <td data-label-mobile={t('colPrice')}><input type="text" inputMode="decimal" value={item.price} onChange={(e) => handlePriceChange(e, index)} /></td>
                <td data-label-mobile={t('colTotal')}>₹{item.total.toFixed(2)}</td>
                <td data-label-mobile={t('colDelete')}><button className="delete-btn" onClick={() => handleDeleteItem(index)}><span className="material-symbols-outlined">delete</span></button></td>
              </tr>
            ))}
          </tbody>
        </table>
        <div className="totals-breakdown">
           {!isGstEnabled && <h3 id="grandTotal">{t('grandTotal')}: ₹{grandTotalCalc.toFixed(2)}</h3>}
           {isGstEnabled && (<>
              <h3 id="subTotal">{t('subTotal')}: ₹{subTotalCalc.toFixed(2)}</h3>
              <h3 id="cgstTotal">{t('cgst')}: ₹{cgstCalc.toFixed(2)}</h3>
              <h3 id="sgstTotal">{t('sgst')}: ₹{sgstCalc.toFixed(2)}</h3>
              <h3 id="grandTotal" style={{fontWeight: 'bold'}}>{t('grandTotal')}: ₹{grandTotalCalc.toFixed(2)}</h3>
            </>)}
        </div>
      </div>
      <button id="printBtn" onClick={handlePrint}><span className="material-symbols-outlined">print</span><span>{t('print')}</span></button>
    </div>
  );
};

const StockPage = () => (
    <div className="container">
        <h2>Add/Edit Stock</h2>
        <p>This is where the form to add new items to the inventory will go.</p>
        <p>It will eventually connect to the backend database.</p>
    </div>
);

const ReportsPage = () => (
    <div className="container">
        <h2>Daily Reports</h2>
        <p>This page will show sales and stock reports.</p>
    </div>
);

// --- FULL HANDLE PRINT FUNCTION ---
const handlePrint = (groceryItems, shopDetails, receiptNumber, isGstEnabled, t) => {
    if (groceryItems.length === 0) { alert("The grocery list is empty."); return; }
    
    const subTotal = groceryItems.reduce((total, item) => total + item.total, 0);
    const cgst = isGstEnabled ? subTotal * 0.09 : 0;
    const sgst = isGstEnabled ? subTotal * 0.09 : 0;
    const grandTotal = subTotal + cgst + sgst;

    let totalsHtml = '';
    if (isGstEnabled) {
        totalsHtml += `<h3>${t('subTotal')}: ₹${subTotal.toFixed(2)}</h3>`;
        totalsHtml += `<h3>${t('cgst')}: ₹${cgst.toFixed(2)}</h3>`;
        totalsHtml += `<h3>${t('sgst')}: ₹${sgst.toFixed(2)}</h3>`;
    }
    totalsHtml += `<h3 style="font-weight: bold;">${t('grandTotal')}: ₹${grandTotal.toFixed(2)}</h3>`;
    
    document.getElementById('receipt-logo-container').innerHTML = `<span class="material-symbols-outlined brand-logo">shopping_cart</span>`;
    document.getElementById('receipt-header').innerHTML = `<h2>${shopDetails.name || 'Your Shop'}</h2><p>${shopDetails.address || 'Your Address'}</p><p>${shopDetails.phone || 'Your Phone'}</p><p>Date: ${new Date().toLocaleDateString('en-IN')} | Receipt No: ${receiptNumber}</p><hr>`;
    document.getElementById('receipt-table').innerHTML = `<thead><tr><th>S.No.</th><th>Item</th><th>Quantity</th><th>Price</th><th>Total</th></tr></thead><tbody>${groceryItems.map((item, index) => `<tr><td>${index + 1}</td><td>${item.name}</td><td>${item.quantity}</td><td>${item.price.toFixed(2)}</td><td>${item.total.toFixed(2)}</td></tr>`).join('')}</tbody>`;
    document.getElementById('receipt-totals-breakdown').innerHTML = totalsHtml;
    
    const receiptEl = document.getElementById('receipt-to-print');
    receiptEl.classList.remove('hidden');
    window.print();
    receiptEl.classList.add('hidden');
    
    // This part cannot directly modify state, so we handle it where the function is called
};

// Update the HomePage component to call handlePrint correctly
const HomePageWithPrint = () => {
    // ... all the state and logic from the HomePage component above ...
    const { t } = useContext(AppContext);
    // ... all other states ...
    const [groceryItems, setGroceryItems] = useState([]);
    const [shopDetails, setShopDetails] = useState({ name: '', address: '', phone: '' });
    const [receiptNumber, setReceiptNumber] = useState('');
    const [isGstEnabled, setIsGstEnabled] = useState(false);

    const fullHandlePrint = () => {
        handlePrint(groceryItems, shopDetails, receiptNumber, isGstEnabled, t);
        setTimeout(() => {
            if (confirm(t('clearListConfirm'))) {
                setGroceryItems([]);
                setReceiptNumber(generateReceiptNumber());
            }
        }, 500);
    };

    return (
        <div className="container">
            {/* ... all the other JSX ... */}
            <button id="printBtn" onClick={fullHandlePrint}><span className="material-symbols-outlined">print</span><span>{t('print')}</span></button>
        </div>
    );
};

export default App;