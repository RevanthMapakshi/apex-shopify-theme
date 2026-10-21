import { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { useCart, formatPrice, useUserCurrency } from '../context/CartContext';
import ApexHeader from '../components/ApexHeader';
import './ApexStorefront.css';
import './ProductPage.css';

function parseProductDescription(rawDesc) {
  if (!rawDesc) return { intro: '', sections: [] };

  const sectionRegex = /(FABRIC\s*&\s*BUILD\s*SPECS:|FABRIC\s*&\s*SPECS:|THE\s*ARTISTRY:|FIT\s*&\s*STYLING:|FIT\s*&\s*SIZING:|CARE:|KEY\s*FEATURES:|📐\s*SIZE\s*GUIDE(?:\s*\([^)]*\))?:?)/gi;
  const matches = [...rawDesc.matchAll(sectionRegex)];

  if (matches.length === 0) {
    return {
      intro: rawDesc,
      sections: []
    };
  }

  const intro = rawDesc.substring(0, matches[0].index).trim();
  const sections = [];

  for (let i = 0; i < matches.length; i++) {
    const rawHeading = matches[i][0].replace(/[:📐]/g, '').trim();
    const start = matches[i].index + matches[i][0].length;
    const end = (i + 1 < matches.length) ? matches[i + 1].index : rawDesc.length;
    const content = rawDesc.substring(start, end).trim();

    let title = rawHeading;
    if (/FABRIC/i.test(rawHeading)) title = 'Fabric & Specifications';
    else if (/ARTISTRY/i.test(rawHeading)) title = 'The Artistry & Print';
    else if (/FIT/i.test(rawHeading)) title = 'Fit & Styling Guide';
    else if (/CARE/i.test(rawHeading)) title = 'Care & Longevity';
    else if (/SIZE\s*GUIDE/i.test(rawHeading)) title = 'Size Dimensions';
    else if (/KEY\s*FEATURES/i.test(rawHeading)) title = 'Key Specifications';

    let items = null;
    if (/FABRIC/i.test(rawHeading) || /KEY\s*FEATURES/i.test(rawHeading)) {
      const splitItems = content.split(/(?=(?:Material|Design|Hardware|Print|Trim|Storage|Sole|Upper|Construction|Insole|Outsole|Lining|Closure|Fit):)/i);
      if (splitItems.length > 1) {
        items = splitItems.map(item => {
          const colonIdx = item.indexOf(':');
          if (colonIdx !== -1) {
            return {
              label: item.substring(0, colonIdx).trim(),
              value: item.substring(colonIdx + 1).replace(/\.\s*$/, '').trim()
            };
          }
          return { label: '', value: item.replace(/\.\s*$/, '').trim() };
        }).filter(it => it.value || it.label);
      }
    }

    sections.push({
      id: `sec-${i}`,
      title,
      rawContent: content,
      items
    });
  }

  sections.push({
    id: 'sec-shipping',
    title: 'Complimentary Priority Delivery',
    rawContent: 'Priority courier dispatch within 24–48 hours across India & worldwide. Hand-packaged in APEX custom matte-black archival packaging with tamper-evident seal.'
  });

  return { intro, sections };
}

export default function ProductPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { products = [], loadingProducts = false, addItem = () => {} } = useCart() || {};
  const currency = useUserCurrency();
  
  const [product, setProduct] = useState(null);
  const [mainImage, setMainImage] = useState('');
  
  const [selectedSize, setSelectedSize] = useState('');
  const [sizeError, setSizeError] = useState(false);
  
  const [selectedColor, setSelectedColor] = useState('');
  const [colorError, setColorError] = useState(false);

  // Accordion state: open the first section by default
  const [openSections, setOpenSections] = useState({ 'sec-0': true });

  const toggleSection = (secId) => {
    setOpenSections(prev => ({
      ...prev,
      [secId]: !prev[secId]
    }));
  };

  useEffect(() => {
    if (!loadingProducts) {
      const p = products.find(p => p.id === id || p.handle === id || p.shopifyId === id);
      if (p) {
        setProduct(p);
        const initialColor = p.colors?.[0] || '';
        setSelectedColor(initialColor);
        const initImg = (p.colorImages && initialColor && p.colorImages[initialColor]) || p.image;
        setMainImage(initImg);
        if (p.sizes && p.sizes.length > 0) {
          setSelectedSize(p.sizes[0]);
        }
      }
    }
  }, [id, products, loadingProducts]);

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'instant' });
  }, [id]);

  if (loadingProducts) {
    return (
      <>
        <ApexHeader />
        <div className="product-page-loading" style={{ minHeight: '60vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          Loading Product...
        </div>
      </>
    );
  }

  if (!product) {
    return (
      <>
        <ApexHeader />
        <div className="product-page-empty" style={{ minHeight: '60vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '1rem' }}>
          <h1>Product Not Found</h1>
          <button 
            type="button" 
            className="back-link" 
            onClick={() => navigate('/')}
            style={{ background: 'none', border: 'none', cursor: 'pointer', font: 'inherit', color: 'inherit' }}
          >
            ← Return to APEX Collection
          </button>
        </div>
      </>
    );
  }

  let allImages = product.images ? product.images.map(img => img?.src || img) : [product.image];
  if (product.images && product.parsedVariants && selectedColor) {
    const matchingVariant = product.parsedVariants.find(v => v.color === selectedColor);
    if (matchingVariant) {
      const filtered = product.images
        .filter(img => img.variantIds && img.variantIds.includes(matchingVariant.id))
        .map(img => img.src);
      if (filtered.length > 0) {
        allImages = filtered;
      }
    }
  }

  const handleColorSelect = (c) => {
    setSelectedColor(c);
    setColorError(false);
    
    if (product.colorImages && product.colorImages[c]) {
      setMainImage(product.colorImages[c]);
      return;
    }

    if (product.parsedVariants) {
      const matchingVariant = product.parsedVariants.find(v => v.color === c);
      if (matchingVariant?.image) {
        setMainImage(matchingVariant.image);
      } else if (matchingVariant && product.images) {
        const matchingImage = product.images.find(img => img.variantIds && img.variantIds.includes(matchingVariant.id));
        if (matchingImage?.src) setMainImage(matchingImage.src);
      }
    }
  };

  const handleAddToCart = () => {
    let hasError = false;
    
    if (product.requiresSize && !selectedSize) {
      setSizeError(true);
      setTimeout(() => setSizeError(false), 2000);
      hasError = true;
    }
    if (product.requiresColor && !selectedColor) {
      setColorError(true);
      setTimeout(() => setColorError(false), 2000);
      hasError = true;
    }
    
    if (hasError) return;

    addItem(product, selectedSize, selectedColor);
  };

  const handleInstantBuy = async () => {
    let hasError = false;
    if (product.requiresSize && !selectedSize) {
      setSizeError(true);
      setTimeout(() => setSizeError(false), 2000);
      hasError = true;
    }
    if (product.requiresColor && !selectedColor) {
      setColorError(true);
      setTimeout(() => setColorError(false), 2000);
      hasError = true;
    }
    if (hasError) return;

    if (product.parsedVariants) {
      const match = product.parsedVariants.find(v => 
        (!selectedSize || v.size === selectedSize) && 
        (!selectedColor || v.color === selectedColor)
      );
      const vId = match?.shopifyVariantId || (typeof match?.id === 'string' && match.id.startsWith('gid://shopify') ? match.id : null);
      if (vId) {
        try {
          const { redirectToShopifyCheckout } = await import('../utils/shopify.js');
          await redirectToShopifyCheckout([{ merchandiseId: vId, quantity: 1 }]);
          return;
        } catch (err) {
          console.warn("Direct checkout error", err);
        }
      }
    }
    addItem(product, selectedSize, selectedColor);
  };

  const { intro, sections } = parseProductDescription(product.desc);

  const handleBack = () => {
    if (window.history.length > 1) {
      navigate(-1);
    } else {
      navigate('/');
    }
  };

  return (
    <>
      <ApexHeader />
      <div className="product-page">
        <div className="product-page-header">
          <button 
            type="button" 
            className="back-link"
            onClick={handleBack}
            style={{ 
              background: 'none', 
              border: 'none', 
              cursor: 'pointer', 
              padding: '0.5rem 0',
              font: 'inherit',
              color: 'inherit'
            }}
          >
            ← Back to APEX Collection
          </button>
        </div>
      
      <div className="product-layout">
        {/* Left Col: Images */}
        <div className="product-gallery-section">
          <div className="product-gallery">
            <div className="main-image-container">
              <img src={mainImage} alt={product.name} className="main-image" />
            </div>
            {allImages.length > 1 && (
              <div className="thumbnail-list">
                {allImages.map((img, idx) => (
                  <button 
                    key={idx} 
                    className={`thumbnail-btn ${mainImage === img ? 'active' : ''}`}
                    onClick={() => setMainImage(img)}
                    aria-label={`View photo ${idx + 1}`}
                  >
                    <img src={img} alt={`Thumbnail ${idx}`} loading="lazy" />
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Right Col: Details, Options, Actions & Accordions */}
        <div className="product-details">
          <div className="product-category-label">{product.category}</div>
          <h1 className="product-title">{product.name}</h1>
          <div className="product-price">{formatPrice(product, currency)}</div>
          
          {intro && (
            <div className="product-editorial-intro">
              <p>{intro}</p>
            </div>
          )}

          <div className="product-options">
            {product.requiresColor && (
              <div className={`option-group ${colorError ? 'error-shake' : ''}`}>
                <div className="option-label">
                  Color {colorError && <span className="error-text">- Please select a color</span>}
                </div>
                <div className="option-buttons">
                  {product.colors.map(c => (
                    <button
                      key={c}
                      className={`option-btn ${selectedColor === c ? 'selected' : ''}`}
                      onClick={() => handleColorSelect(c)}
                    >
                      {c}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {product.requiresSize && (
              <div className={`option-group ${sizeError ? 'error-shake' : ''}`}>
                <div className="option-label">
                  Size {sizeError && <span className="error-text">- Please select a size</span>}
                </div>
                <div className="option-buttons">
                  {product.sizes.map(s => (
                    <button
                      key={s}
                      className={`option-btn ${selectedSize === s ? 'selected' : ''}`}
                      onClick={() => { setSelectedSize(s); setSizeError(false); }}
                    >
                      {s}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          <div className="product-actions">
            {product.waitlist ? (
               <button className="add-to-cart-btn waitlist" onClick={() => {
                 let waitlistStr = '';
                 if (selectedSize) waitlistStr += ` for size ${selectedSize}`;
                 if (selectedColor) waitlistStr += ` in ${selectedColor}`;
                 const email = window.prompt(`Enter your email to join the waitlist${waitlistStr}:`);
                 if (email) {
                   fetch("/api/joinWaitlist", {
                     method: "POST",
                     headers: { "Content-Type": "application/json" },
                     body: JSON.stringify({ email, productId: product.id, size: selectedSize, color: selectedColor })
                   }).then(() => alert("Your intent is registered."));
                 }
               }}>
                 Join Waitlist
               </button>
            ) : (
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                <button
                  className="add-to-cart-btn instant-buy"
                  onClick={handleInstantBuy}
                >
                  Instant Buy Now →
                </button>
                <button className="add-to-cart-btn" onClick={handleAddToCart}>
                  + Add to Bag
                </button>
              </div>
            )}
          </div>
          
          <div className="product-trust">
             <div className="trust-row"><span className="trust-icon">✦</span> 50 Pieces Worldwide // Zero Restocks</div>
             <div className="trust-row"><span className="trust-icon">🔒</span> Encrypted Checkout // Pan-India Priority</div>
          </div>

          {/* ── MINIMAL ARCHITECTURAL ACCORDIONS ── */}
          {sections.length > 0 && (
            <div className="product-accordions">
              {sections.map(sec => {
                const isOpen = !!openSections[sec.id];
                return (
                  <div key={sec.id} className={`product-accordion-item ${isOpen ? 'open' : ''}`}>
                    <button
                      type="button"
                      className="product-accordion-header"
                      onClick={() => toggleSection(sec.id)}
                      aria-expanded={isOpen}
                    >
                      <span className="product-accordion-title">{sec.title}</span>
                      <span className="product-accordion-icon">{isOpen ? '−' : '+'}</span>
                    </button>
                    {isOpen && (
                      <div className="product-accordion-content">
                        {sec.items ? (
                          <ul className="product-spec-list">
                            {sec.items.map((it, idx) => (
                              <li key={idx} className="product-spec-row">
                                {it.label && <strong className="product-spec-label">{it.label}: </strong>}
                                <span className="product-spec-value">{it.value}</span>
                              </li>
                            ))}
                          </ul>
                        ) : (
                          <p className="product-spec-text">{sec.rawContent}</p>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}

        </div>
      </div>
    </div>
  </>
  );
}
