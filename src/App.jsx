import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { CartProvider } from './context/CartContext';
import ApexStorefront from './pages/ApexStorefront';
import ProductPage from './pages/ProductPage';
import Terms from './pages/Terms';
import Refunds from './pages/Refunds';
import Contact from './pages/Contact';

export default function App() {
  return (
    <CartProvider>
      <Router>
        <Routes>
          <Route path="/" element={<ApexStorefront />} />
          <Route path="/apex" element={<ApexStorefront />} />
          <Route path="/product/:id" element={<ProductPage />} />
          <Route path="/products/:id" element={<ProductPage />} />

          {/* Terms & Conditions Aliases */}
          <Route path="/terms" element={<Terms />} />
          <Route path="/terms-and-conditions" element={<Terms />} />
          <Route path="/pages/terms" element={<Terms />} />
          <Route path="/pages/terms-and-conditions" element={<Terms />} />
          <Route path="/policies/terms-of-service" element={<Terms />} />

          {/* Refunds & Cancellations Aliases */}
          <Route path="/refunds" element={<Refunds />} />
          <Route path="/refund-policy" element={<Refunds />} />
          <Route path="/refunds-and-cancellations" element={<Refunds />} />
          <Route path="/pages/refunds" element={<Refunds />} />
          <Route path="/pages/refund-policy" element={<Refunds />} />
          <Route path="/policies/refund-policy" element={<Refunds />} />

          {/* Contact Us Aliases */}
          <Route path="/contact" element={<Contact />} />
          <Route path="/contact-us" element={<Contact />} />
          <Route path="/pages/contact" element={<Contact />} />
          <Route path="/pages/contact-us" element={<Contact />} />
          <Route path="/policies/contact-information" element={<Contact />} />
        </Routes>
      </Router>
    </CartProvider>
  );
}
