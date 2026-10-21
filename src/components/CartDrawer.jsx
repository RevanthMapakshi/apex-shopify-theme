import React, { useEffect, useState } from 'react';
import { useCart, useUserCurrency, formatPrice } from '../context/CartContext';
import './CartDrawer.css';

export default function CartDrawer() {
  const { 
    items = [], 
    products = [], 
    cartOpen = false, 
    setCartOpen = () => {}, 
    removeItem = () => {}, 
    updateQty = () => {}, 
    totalItems = 0, 
    getTotal = () => 0, 
    checkoutWithShopify = () => {} 
  } = useCart() || {};

  const currency = useUserCurrency();
  const [checkingOut, setCheckingOut] = useState(false);

  // Close on Escape key
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && cartOpen) {
        setCartOpen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [cartOpen, setCartOpen]);

  // Prevent background scroll when open
  useEffect(() => {
    if (cartOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [cartOpen]);

  const handleCheckout = async () => {
    setCheckingOut(true);
    try {
      await checkoutWithShopify();
    } catch (err) {
      console.error('Checkout error:', err);
    } finally {
      setCheckingOut(false);
    }
  };

  const formattedSubtotal = currency === 'INR' 
    ? `₹${((getTotal('INR') || 0) / 100).toLocaleString('en-IN')}` 
    : `$${((getTotal('USD') || 0) / 100).toFixed(2)}`;

  return (
    <div 
      className={`apex-cart-backdrop ${cartOpen ? 'open' : ''}`}
      onClick={() => setCartOpen(false)}
      aria-hidden={!cartOpen}
    >
      <div 
        className="apex-cart-panel"
        onClick={e => e.stopPropagation()}
        role="dialog"
        aria-label="Shopping Bag"
      >
        {/* Header */}
        <div className="apex-cart-header">
          <div className="apex-cart-title">
            <span>Your Bag</span>
            {totalItems > 0 && <span className="apex-cart-count-pill">{totalItems}</span>}
          </div>
          <button 
            type="button" 
            className="apex-cart-close" 
            onClick={() => setCartOpen(false)}
            aria-label="Close Bag"
          >
            &times;
          </button>
        </div>

        {/* Items List */}
        <div className="apex-cart-body">
          {items.length === 0 ? (
            <div className="apex-cart-empty">
              <div className="apex-cart-empty-icon">🛍️</div>
              <p className="apex-cart-empty-text">Your bag is currently empty.</p>
              <button 
                type="button" 
                className="apex-cart-continue-btn"
                onClick={() => setCartOpen(false)}
              >
                Continue Shopping
              </button>
            </div>
          ) : (
            items.map(item => {
              const product = products.find(p => p.id === item.productId) || {};
              const itemPrice = formatPrice(product, currency);
              const itemImg = product.image || (product.images?.[0]?.src) || '';

              return (
                <div key={item.key} className="apex-cart-item">
                  {itemImg && (
                    <img 
                      src={itemImg} 
                      alt={product.name || 'Product'} 
                      className="apex-cart-item-img"
                    />
                  )}
                  <div className="apex-cart-item-details">
                    <div>
                      <div className="apex-cart-item-name">{product.name || 'Item'}</div>
                      <div className="apex-cart-item-meta">
                        {item.size && <span className="apex-cart-badge">Size: {item.size}</span>}
                        {item.color && <span className="apex-cart-badge">Color: {item.color}</span>}
                      </div>
                    </div>

                    <div className="apex-cart-item-bottom">
                      <div className="apex-cart-item-price">{itemPrice}</div>
                      <div className="apex-cart-qty-ctrl">
                        <button 
                          type="button" 
                          className="apex-cart-qty-btn"
                          onClick={() => updateQty(item.key, item.qty - 1)}
                          aria-label="Decrease quantity"
                        >
                          &minus;
                        </button>
                        <span className="apex-cart-qty-val">{item.qty}</span>
                        <button 
                          type="button" 
                          className="apex-cart-qty-btn"
                          onClick={() => updateQty(item.key, item.qty + 1)}
                          aria-label="Increase quantity"
                        >
                          &#43;
                        </button>
                      </div>
                    </div>

                    <button 
                      type="button" 
                      className="apex-cart-remove-btn"
                      onClick={() => removeItem(item.key)}
                    >
                      Remove
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Footer */}
        {items.length > 0 && (
          <div className="apex-cart-footer">
            <div className="apex-cart-subtotal-row">
              <span className="apex-cart-subtotal-label">Subtotal</span>
              <span className="apex-cart-subtotal-val">{formattedSubtotal}</span>
            </div>
            <div className="apex-cart-shipping-note">
              Taxes and shipping calculated at checkout.
            </div>
            <button 
              type="button" 
              className="apex-cart-checkout-btn"
              onClick={handleCheckout}
              disabled={checkingOut}
            >
              {checkingOut ? 'Directing to Checkout...' : 'Proceed to Checkout →'}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
