import React from 'react';
import { Routes, Route } from 'react-router-dom';
import MnbarLayout from './components/layout/MnbarLayout';

// Pages
import HomePage from './pages/HomePage.basic';
import SearchPage from './pages/SearchPage.basic';
import ProductPage from './pages/ProductPage.basic';

function App() {
  return (
    <MnbarLayout>
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/search" element={<SearchPage />} />
        <Route path="/product/:id" element={<ProductPage />} />
      </Routes>
    </MnbarLayout>
  );
}

export default App;
