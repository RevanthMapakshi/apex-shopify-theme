import { createContext, useContext, useState, useEffect } from 'react';

const CartContext = createContext(null);

// ── 1. CORE ARCHIVAL & WAITLIST CATALOGUE (Main Website / The ARC) ──
export const LOCAL_PRODUCTS = [
  {
    id: 'ebook-salary-trap',
    name: 'The Salary Trap',
    category: 'Digital',
    priceINR: 44900,           // ₹449
    priceUSD: 599,             // $5.99
    image: 'https://thearc-rev.online/mockups/ebook_ipad_mockup.png',
    fabricTag: 'Instant PDF Delivery',
    specTag: 'The 5-Engine Blueprint // 240+ Pages',
    desc: 'The definitive guide to escaping the predictable life. Instant PDF delivery after payment.',
    sizes: [],
    requiresSize: false,
    digital: true,
    printroveId: null,
  },
  {
    id: 'journal-arc',
    name: 'The Arc Journal',
    category: 'Stationery',
    priceINR: 99900,           // ₹999
    priceUSD: 2499,            // $24.99
    image: 'https://thearc-rev.online/mockups/journal_desk_mockup.png',
    fabricTag: '192 Archival Pages',
    specTag: 'A5 Hardbound // Blind Debossed Cover',
    desc: 'A5. 192 archival acid-free pages. Built for time-audits, goal-logs, and daily discipline. Ships under The Arc brand.',
    sizes: [],
    requiresSize: false,
    printroveId: null,
    waitlist: false,
  },
  {
    id: 'planner-arc',
    name: 'The Arc Planner',
    category: 'Stationery',
    priceINR: 69900,           // ₹699
    priceUSD: 1999,            // $19.99
    image: 'https://thearc-rev.online/mockups/planner_hardbound_mockup.png',
    fabricTag: 'Structured Daily & Weekly',
    specTag: 'Flat-Writing Hardcover // 192 Pages',
    desc: '192-page daily & weekly structured planner. Spiral bound for flat writing. The ultimate discipline system.',
    sizes: [],
    requiresSize: false,
    printroveId: null,
    waitlist: false,
  },
  {
    id: 'habit-tracker-arc',
    name: 'The Arc Habit Tracker',
    category: 'Stationery',
    priceINR: 49900,           // ₹499
    priceUSD: 1499,            // $14.99
    image: 'https://thearc-rev.online/mockups/habit_tracker_mockup.png',
    fabricTag: 'Compact Digest Format',
    specTag: 'Perfect Bound // Daily Consistency Digest',
    desc: 'Track your discipline daily. Digest format, perfect bound for easy carrying. Simple, effective, and beautiful.',
    sizes: [],
    requiresSize: false,
    printroveId: null,
    waitlist: false,
  },
  {
    id: 'hoodie-black-v2',
    name: 'Arc Black v2',
    category: 'Apparel',
    priceINR: 349900,
    priceUSD: 4499,
    image: 'https://thearc-rev.online/mockups/hoodie_arc_black_v2.png',
    fabricTag: 'Heavyweight Fleece',
    specTag: 'Custom Red Cords // Brushed Aglets',
    desc: 'Premium cut-and-sew heavyweight fleece. Custom red cords, brushed steel aglets.',
    sizes: ['S', 'M', 'L', 'XL', 'XXL'],
    requiresSize: true,
    waitlist: true,
  },
  {
    id: 'hoodie-black-v4',
    name: 'Arc Black v4',
    category: 'Apparel',
    priceINR: 349900,
    priceUSD: 4499,
    image: 'https://thearc-rev.online/mockups/hoodie_arc_black_v4.png',
    fabricTag: 'Heavyweight Fleece',
    specTag: 'Dark Aesthetics // Custom Hardware',
    desc: 'Premium cut-and-sew heavyweight fleece. Subtle dark aesthetics, custom hardware.',
    sizes: ['S', 'M', 'L', 'XL', 'XXL'],
    requiresSize: true,
    waitlist: true,
  },
  {
    id: 'hoodie-white',
    name: 'Arc White',
    category: 'Apparel',
    priceINR: 349900,
    priceUSD: 4499,
    image: 'https://thearc-rev.online/mockups/hoodie_arc_white.png',
    fabricTag: 'Off-White Fleece',
    specTag: 'Crimson Arc Lettering // Premium Fit',
    desc: 'Heavyweight off-white cotton fleece. "The Arc" in crimson — understated, premium.',
    sizes: ['S', 'M', 'L', 'XL', 'XXL'],
    requiresSize: true,
    waitlist: true,
  },
  {
    id: 'hoodie-red',
    name: 'Arc Red',
    category: 'Apparel',
    priceINR: 349900,
    priceUSD: 4499,
    image: 'https://thearc-rev.online/mockups/hoodie_arc_red.png',
    fabricTag: 'Crimson Fleece',
    specTag: 'Bold Architectural Fit // Cut & Sew',
    desc: 'Deep crimson hoodie. The Arc in its boldest form. Premium cut-and-sew.',
    sizes: ['S', 'M', 'L', 'XL', 'XXL'],
    requiresSize: true,
    waitlist: true,
  }
];

// ── Currency detection ──────────────────────────────────────────────
export function useUserCurrency() {
  const [currency, setCurrency] = useState('INR');
  useEffect(() => {
    try {
      const tz = Intl.DateTimeFormat().resolvedOptions().timeZone;
      if (tz && (tz.includes('Kolkata') || tz.includes('Calcutta') || tz.includes('India'))) setCurrency('INR');
      else setCurrency('USD');
    } catch {
      setCurrency('INR');
    }
  }, []);
  return currency;
}

export function formatPrice(product, currency) {
  if (!product) return '';
  if (currency === 'INR') {
    const val = typeof product.priceINR === 'number' ? product.priceINR : 0;
    return `₹${(val / 100).toLocaleString('en-IN')}`;
  }
  const val = typeof product.priceUSD === 'number' ? product.priceUSD : 0;
  return `$${(val / 100).toFixed(2)}`;
}

// ── Cart Provider ──────────────────────────────────────────────────
export function CartProvider({ children }) {
  const [items, setItems] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem('arc_cart')) || [];
    } catch { return []; }
  });
  const [cartOpen, setCartOpen] = useState(false);
  const [products, setProducts] = useState(LOCAL_PRODUCTS);
  const [loadingProducts, setLoadingProducts] = useState(true);
  const currency = useUserCurrency();

  const isApex = typeof window !== 'undefined' && (
    window.location.hostname.includes('myshopify.com') ||
    window.location.hostname.includes('apex') ||
    window.location.pathname.startsWith('/apex')
  );

  useEffect(() => {
    localStorage.setItem('arc_cart', JSON.stringify(items));
  }, [items]);

  useEffect(() => {
    const fetchShopify = async () => {
      try {
        const { fetchShopifyProducts } = await import('../utils/shopify.js');
        const shopifyProds = await fetchShopifyProducts();
        if (shopifyProds && shopifyProds.length > 0) {
          const stationeryAndDigital = LOCAL_PRODUCTS.filter(p => p.category === 'Digital' || p.category === 'Stationery');
          setProducts([
            ...shopifyProds,
            ...stationeryAndDigital
          ]);
          setLoadingProducts(false);
          return;
        }
      } catch (err) {
        console.warn('[Shopify] Fetch fallback to LOCAL_PRODUCTS', err);
      }
      setLoadingProducts(false);
    };
    fetchShopify();
  }, []);

  const addItem = (product, size = null, color = null) => {
    const chosenSize = size || (product.sizes?.length ? product.sizes[0] : null);
    const chosenColor = color || (product.colors?.length ? product.colors[0] : null);
    const key = [product.id, chosenSize, chosenColor].filter(Boolean).join('-');

    let shopifyVariantId = null;
    if (product.parsedVariants && product.parsedVariants.length > 0) {
      const match = product.parsedVariants.find(v => 
        (!chosenSize || v.size === chosenSize) && 
        (!chosenColor || v.color === chosenColor)
      ) || product.parsedVariants[0];
      if (match?.shopifyVariantId || (typeof match?.id === 'string' && match.id.startsWith('gid://shopify'))) {
        shopifyVariantId = match.shopifyVariantId || match.id;
      }
    }

    setItems(prev => {
      const existing = prev.find(i => i.key === key);
      if (existing) {
        return prev.map(i => i.key === key ? { ...i, qty: i.qty + 1 } : i);
      }
      return [...prev, {
        key,
        productId: product.id,
        size: chosenSize,
        color: chosenColor,
        qty: 1,
        shopifyVariantId,
        isShopify: product.isShopify,
        category: product.category,
      }];
    });
    setCartOpen(true);
  };

  const removeItem = (key) => {
    setItems(prev => prev.filter(i => i.key !== key));
  };

  const updateQty = (key, qty) => {
    if (qty < 1) {
      removeItem(key);
      return;
    }
    setItems(prev => prev.map(i => i.key === key ? { ...i, qty } : i));
  };

  const clearCart = () => setItems([]);

  const totalItems = items.reduce((sum, i) => sum + i.qty, 0);

  const getTotal = (curr) => {
    return items.reduce((sum, item) => {
      const product = products.find(p => p.id === item.productId);
      if (!product) return sum;
      const price = curr === 'INR' ? (product.priceINR || 0) : (product.priceUSD || 0);
      return sum + price * item.qty;
    }, 0);
  };

  const checkoutWithShopify = async () => {
    // If running on Shopify or containing Shopify variants, redirect to Shopify Checkout
    const hasShopifyItems = items.some(i => i.shopifyVariantId || i.isShopify);
    if (hasShopifyItems || isApex) {
      const shopifyLines = items.map(i => {
        let vId = i.shopifyVariantId;
        if (!vId) {
          const prod = products.find(p => p.id === i.productId);
          if (prod?.parsedVariants?.[0]) {
            vId = prod.parsedVariants[0].shopifyVariantId || prod.parsedVariants[0].id;
          }
        }
        return vId ? { merchandiseId: vId, quantity: i.qty } : null;
      }).filter(Boolean);

      if (shopifyLines.length > 0) {
        try {
          const { redirectToShopifyCheckout } = await import('../utils/shopify.js');
          await redirectToShopifyCheckout(shopifyLines, currency === 'INR' ? 'IN' : 'US');
          return;
        } catch (err) {
          console.warn("Shopify checkout redirection error:", err);
        }
      }
    }

    // Default Main Website Cashfree checkout
    window.location.href = '/checkout';
  };

  const displayProducts = products.map(p => {
    if (p.id === 'planner-arc') {
      return {
        ...p,
        image: currency === 'INR' 
          ? 'https://thearc-rev.online/mockups/planner_hardbound_mockup.png' 
          : 'https://thearc-rev.online/mockups/planner_mockup.png',
        desc: currency === 'INR' 
          ? '192-page daily & weekly structured planner. Premium hardcover edition for flat writing. The ultimate discipline system.'
          : '192-page daily & weekly structured planner. Spiral bound for flat writing. The ultimate discipline system.'
      };
    }
    return p;
  });

  return (
    <CartContext.Provider value={{
      products: displayProducts,
      loadingProducts,
      items,
      addItem,
      removeItem,
      updateQty,
      clearCart,
      cartOpen,
      setCartOpen,
      totalItems,
      getTotal,
      checkoutWithShopify,
    }}>
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  return useContext(CartContext);
}