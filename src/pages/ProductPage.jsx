import { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { useCart, formatPrice, useUserCurrency } from '../context/CartContext';
import './ProductPage.css';

export default function ProductPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { products, loadingProducts, addItem } = useCart();
  const currency = useUserCurrency();
  
  const [product, setProduct] = useState(null);
  const [mainImage, setMainImage] = useState('');
  
  const [selectedSize, setSelectedSize] = useState('');
  const [sizeError, setSizeError] = useState(false);
  
  const [selectedColor, setSelectedColor] = useState('');
  const [colorError, setColorError] = useState(false);

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

  if (loadingProducts) return <div className="product-page-loading">Loading Product...</div>;
  if (!product) return (
    <div className="product-page-empty">
      <h1>Product Not Found</h1>
      <Link to="/" className="back-link">← Return to APEX Collection</Link>
    </div>
  );

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

  const isApex = typeof window !== 'undefined' && (
    window.location.hostname.includes('myshopify.com') ||
    window.location.hostname.includes('apex')
  );

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

  // Split description if it contains "Key Features:"
  const descParts = product.desc.split(/(?=Key Features:)/i);
  const introDesc = descParts[0];
  const featuresDesc = descParts[1];

  return (
    <div className="product-page">
      <div className="product-page-header">
        <Link to={isApex ? "/" : "/shop"} className="back-link">
          {isApex ? "← Back to APEX" : "← Back to The Store"}
        </Link>
      </div>
      
      <div className="product-layout">
        {/* Left Col: Images & Features */}
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
                  >
                    <img src={img} alt={`Thumbnail ${idx}`} loading="lazy" />
                  </button>
                ))}
              </div>
            )}
          </div>
          {featuresDesc && (
            <div className="product-features-desc">
              <h3>Specifications</h3>
              <ul>
                {featuresDesc.split(/(?<=\.)\s+(?=[A-Z])/).filter(Boolean).map((feature, idx) => (
                  <li key={idx}>
                    {feature.includes(':') ? (
                      <>
                        <strong>{feature.split(':')[0]}:</strong>
                        {feature.substring(feature.indexOf(':') + 1)}
                      </>
                    ) : (
                      feature
                    )}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>

        {/* Right Col: Details */}
        <div className="product-details">
          <div className="product-category-label">{product.category}</div>
          <h1 className="product-title">{product.name}</h1>
          <div className="product-price">{formatPrice(product, currency)}</div>
          
          <div className="product-description">
            <p>{introDesc}</p>
          </div>

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
                  className="add-to-cart-btn"
                  style={{ background: 'var(--red)', color: '#FFFFFF', border: 'none' }}
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
             <div className="trust-row"><span className="trust-icon">🌍</span> Ships to 220+ countries</div>
             <div className="trust-row"><span className="trust-icon">🔒</span> Secure Checkout</div>
          </div>
        </div>
      </div>
    </div>
  );
}
