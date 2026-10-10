import React, { useState, useEffect, useRef } from 'react';
import { useCart, useUserCurrency, formatPrice } from '../context/CartContext';
import { countries } from '../utils/countries';
import { db } from '../firebase';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import './ApexStorefront.css';

function stripGsm(text) {
  if (!text || typeof text !== 'string') return text;
  return text
    .replace(/\b\d+\s*GSM\b/gi, '')
    .replace(/\(\s*\)/g, '')
    .replace(/\s{2,}/g, ' ')
    .trim();
}

/* ── Editorial Campaign Runway Gallery (Using Live Shopify Products) ── */
const LOOKBOOK_ITEMS = [
  {
    id: 'look-01',
    title: 'Look 01 // Origins & The Monolith',
    subtitle: 'Signature Silhouette & Stealth Architecture',
    category: 'Footwear + Active Shorts',
    image: 'https://cdn.shopify.com/s/files/1/0996/5194/4767/files/16340475902737369818_2048.jpg?v=1788675203',
    secondaryImage: 'https://cdn.shopify.com/s/files/1/0996/5194/4767/files/Left_Pocket_6_c_1.jpg?v=1788804951',
    tags: ['16oz Canvas', 'Drop 001', 'Signature Silhouette'],
    desc: 'The definitive silhouette of Drop 001. Hand-lasted Origins signature high-top sneakers paired with architectural Monolith active modular shorts.'
  },
  {
    id: 'look-02',
    title: 'Look 02 // Liquid Marble Crimson Suite',
    subtitle: 'High-Impact Contrast & Fluid Motion',
    category: 'Fluid Series',
    image: 'https://cdn.shopify.com/s/files/1/0996/5194/4767/files/Left_Pocket_6_c_1_929bb280-57c3-4c3d-9e85-2e9933a58299.jpg?v=1788815501',
    secondaryImage: 'https://cdn.shopify.com/s/files/1/0996/5194/4767/files/15881962354647610567_2048_custom.jpg?v=1788675150',
    tags: ['Crimson Void', 'Low-Top Craft', 'Drop 001'],
    desc: 'Deep crimson void and midnight smoke fluid grain on technical micro-knit paired with the matching Liquid Marble low-top sneakers.'
  },
  {
    id: 'look-03',
    title: 'Look 03 // Vector Grid Geometry',
    subtitle: 'High-Frequency Geometric Streetwear',
    category: 'Geometric Suite',
    image: 'https://cdn.shopify.com/s/files/1/0996/5194/4767/files/16477481640706225762_2048.jpg?v=1788675111',
    secondaryImage: 'https://cdn.shopify.com/s/files/1/0996/5194/4767/files/Left_Pocket_1_c_2.jpg?v=1788788425',
    tags: ['Pure Vector', 'Heavy Cotton', 'Dual-Density'],
    desc: 'High-frequency isometric wireframe geometry rendered with sub-millimeter precision on hand-lasted craft footwear and varsity outerwear.'
  },
  {
    id: 'look-04',
    title: 'Look 04 // Urban Camo & Tie-Dye Wash',
    subtitle: 'Streetwear Form & Organic Wash Texture',
    category: 'Streetwear Capsule',
    image: 'https://cdn.shopify.com/s/files/1/0996/5194/4767/files/14063778369052034190_2048.jpg?v=1788675026',
    secondaryImage: 'https://cdn.shopify.com/s/files/1/0996/5194/4767/files/Front_1_c_7.jpg?v=1788787836',
    tags: ['Urban Camo', 'Streetwear Wash', 'Drop 001'],
    desc: 'Stealth stripe architectural camouflage high-top sneakers paired with oversized washed combed cotton jersey.'
  }
];

/* ── Five Curated Architectural Sections for Drop 001 ── */
const SECTION_DEFS = [
  {
    key: 'couture',
    title: 'Haute Couture Bomber Jackets',
    eyebrow: 'Section 01 // Drop 001 • 50 Pieces Worldwide',
    tagline: 'Museum-grade statement bombers tailored in complementary Men\'s and Women\'s silhouettes. Limited run of 50 pieces.'
  },
  {
    key: 'outerwear',
    title: 'Archival Kinetic & Streetwear Outerwear',
    eyebrow: 'Section 02 // Drop 001 • 50 Pieces Worldwide',
    tagline: 'High-voltage fluid dynamics, dimensional blackout minimalism, and celestial solar flares. Limited run of 50 pieces.'
  },
  {
    key: 'collegiate',
    title: 'Collegiate Outerwear',
    eyebrow: 'Section 03 // Drop 001 • 50 Pieces Worldwide',
    tagline: 'Heritage collegiate silhouette stripped down to pure stealth luxury. Limited run of 50 pieces.'
  },
  {
    key: 'footwear',
    title: 'Hand-Lasted Craft Footwear',
    eyebrow: 'Section 04 // Drop 001 • 20 Pairs Worldwide',
    tagline: 'Dual-density vulcanized rubber craft silhouettes. Strictly limited to 20 pairs per edition.'
  },
  {
    key: 'active',
    title: 'Architectural Shorts & Heavyweight Tops',
    eyebrow: 'Section 05 // Drop 001 • Limited Run',
    tagline: 'High-output poly mesh activewear bottoms and heavyweight washed boxy tees. Wear what others can\'t.'
  }
];

/* ── Material & Craft Engineering Manifesto ── */
const MANIFESTO_ITEMS = [
  {
    id: 'mat-01',
    weight: '16oz Canvas',
    title: 'Hand-Lasted Vulcanized Footwear',
    desc: 'Heavy-gauge 16oz duck canvas bonded to a dual-density vulcanized rubber outsole with custom Ortholite arch-support insoles for all-day comfort.'
  },
  {
    id: 'mat-02',
    weight: 'Drop 001',
    title: 'Technical Performance Micro-Knit',
    desc: 'Engineered high-density micro-knit with reinforced double-needle seam construction and water-resistant zip pockets for unrestricted active mobility.'
  },
  {
    id: 'mat-03',
    weight: 'Drop 001',
    title: 'Varsity Outerwear',
    desc: 'Athletic striped ribbed collar, durable metal snap fasteners, and ergonomic side welt pockets.'
  },
  {
    id: 'mat-04',
    weight: 'Combed Jersey',
    title: 'Oversized Streetwear Tees',
    desc: 'Soft washed combed cotton single-jersey with a tight ribbed collar, drop shoulders, and relaxed boxy drape.'
  }
];

/* ── Upcoming Silhouette Items for Shadows Section ── */
const SHADOW_ITEMS = [
  {
    id: 'shadow-jacket',
    name: 'Architectural Coach Jacket',
    category: 'Outerwear',
    status: 'Drop 002',
    desc: 'Boxy drop-shoulder cut, structured waterproof twill, matte gunmetal hardware, concealed zip storm bib.',
    svgPath: 'M30 18L50 12L70 18L90 36L78 52L70 44L70 108L30 108L30 44L22 52L10 36Z M50 12L50 108 M30 30Q40 36 50 32Q60 36 70 30'
  },
  {
    id: 'shadow-tee',
    name: 'Heavyweight Boxy Tee',
    category: 'Apparel',
    status: 'Drop 002',
    desc: 'Heavyweight single jersey cotton. High ribbed collar, elongated dropped hem. Zero exterior logos.',
    svgPath: 'M30 18Q50 26 70 18L90 34L78 50L70 42L70 105L30 105L30 42L22 50L10 34Z'
  },
  {
    id: 'shadow-cargo',
    name: 'Tailored Heavyweight Cargo',
    category: 'Bottoms',
    status: 'Drop 002',
    desc: 'Relaxed taper with articulated knee seaming and magnetic concealed cargo panels. Stone and shadow colourways.',
    svgPath: 'M28 18L72 18L70 110L54 110L50 60L46 110L30 110Z M20 42L30 42L30 60L20 60Z M70 42L80 42L80 60L70 60Z'
  }
];

function ApexLogoMark() {
  return (
    <svg className="apex-logo-icon" viewBox="0 0 2000 2000" fill="currentColor" aria-hidden="true">
      <path d="M 1022.0,1601.5 L 1018.5,1596.0 L 1015.5,1562.0 L 1001.5,1505.0 L 1000.5,1450.0 L 997.0,1447.5 L 972.0,1450.5 L 929.0,1448.5 L 905.0,1443.5 L 897.5,1434.0 L 895.5,1385.0 L 904.5,1338.0 L 903.5,1294.0 L 915.5,1236.0 L 916.0,1168.5 L 910.0,1170.5 L 866.0,1216.5 L 818.0,1249.5 L 764.0,1307.5 L 726.0,1339.5 L 684.0,1382.5 L 649.0,1405.5 L 620.5,1443.0 L 587.0,1473.5 L 574.5,1480.0 L 610.5,1430.0 L 628.5,1395.0 L 668.5,1351.0 L 737.5,1259.0 L 769.5,1196.0 L 857.5,1073.0 L 856.0,1067.5 L 851.0,1067.5 L 830.0,1074.5 L 821.5,1074.0 L 829.0,1063.5 L 847.5,1050.0 L 846.0,1047.5 L 813.0,1045.5 L 779.0,1050.5 L 745.0,1049.5 L 688.5,1108.0 L 647.5,1173.0 L 640.5,1189.0 L 636.5,1212.0 L 633.0,1215.5 L 528.0,1213.5 L 489.0,1217.5 L 432.0,1217.5 L 393.0,1214.5 L 380.0,1212.5 L 378.5,1204.0 L 398.5,1129.0 L 419.5,1088.0 L 434.5,1048.0 L 327.0,1043.5 L 287.0,1048.5 L 237.0,1041.5 L 222.0,1034.5 L 213.5,1025.0 L 208.5,1007.0 L 208.5,994.0 L 213.5,979.0 L 223.0,968.5 L 250.0,957.5 L 307.0,956.5 L 353.0,949.5 L 374.0,950.5 L 419.0,959.5 L 483.0,953.5 L 510.0,955.5 L 549.5,910.0 L 573.0,890.5 L 720.0,798.5 L 763.0,788.5 L 805.0,770.5 L 879.0,750.5 L 958.0,741.5 L 971.5,668.0 L 972.5,591.0 L 986.5,536.0 L 981.5,473.0 L 998.5,419.0 L 995.5,350.0 L 1000.5,303.0 L 1014.5,252.0 L 1013.5,173.0 L 1014.5,167.0 L 1017.0,164.5 L 1019.5,167.0 L 1022.5,183.0 L 1035.5,252.0 L 1042.5,359.0 L 1054.5,408.0 L 1053.5,452.0 L 1062.5,505.0 L 1063.5,568.0 L 1070.5,604.0 L 1068.5,656.0 L 1077.5,688.0 L 1080.5,732.0 L 1084.0,737.5 L 1189.0,753.5 L 1247.0,779.5 L 1301.0,794.5 L 1346.0,819.5 L 1383.0,828.5 L 1453.0,887.5 L 1496.0,910.5 L 1535.0,952.5 L 1556.0,952.5 L 1584.0,957.5 L 1689.0,951.5 L 1824.0,956.5 L 1840.0,962.5 L 1853.5,973.0 L 1862.5,988.0 L 1863.5,1002.0 L 1850.5,1031.0 L 1830.0,1041.5 L 1793.0,1042.5 L 1760.0,1049.5 L 1723.0,1044.5 L 1664.0,1049.5 L 1611.0,1048.5 L 1608.5,1051.0 L 1609.5,1059.0 L 1628.5,1094.0 L 1641.5,1132.0 L 1651.5,1170.0 L 1655.5,1201.0 L 1655.5,1210.0 L 1652.0,1213.5 L 1620.0,1216.5 L 1559.0,1213.5 L 1408.0,1214.5 L 1395.5,1196.0 L 1383.5,1158.0 L 1364.5,1122.0 L 1352.5,1106.0 L 1328.5,1085.0 L 1314.5,1062.0 L 1303.0,1049.5 L 1296.0,1045.5 L 1261.0,1048.5 L 1191.0,1045.5 L 1189.5,1049.0 L 1214.5,1070.0 L 1205.0,1071.5 L 1181.0,1066.5 L 1179.5,1072.0 L 1187.5,1090.0 L 1272.5,1194.0 L 1290.5,1228.0 L 1315.5,1256.0 L 1353.5,1318.0 L 1378.5,1347.0 L 1397.5,1385.0 L 1428.5,1413.0 L 1452.5,1456.0 L 1474.5,1487.0 L 1468.0,1485.5 L 1450.0,1471.5 L 1413.0,1430.5 L 1386.0,1414.5 L 1361.5,1386.0 L 1332.0,1360.5 L 1282.0,1306.5 L 1251.0,1285.5 L 1187.0,1217.5 L 1129.0,1166.5 L 1126.5,1169.0 L 1127.5,1216.0 L 1135.5,1280.0 L 1137.5,1345.0 L 1148.5,1429.0 L 1142.0,1440.5 L 1130.0,1443.5 L 1046.5,1449.0 L 1032.5,1499.0 L 1036.5,1556.0 L 1022.0,1601.5 Z" />
      <path d="M 762.0,722.5 L 755.0,722.5 L 746.5,715.0 L 717.5,671.0 L 677.5,625.0 L 634.5,557.0 L 597.5,506.0 L 572.5,478.0 L 565.5,467.0 L 564.5,462.0 L 567.0,461.5 L 604.0,488.5 L 711.0,589.5 L 738.0,609.5 L 780.0,648.5 L 827.5,697.0 L 826.0,704.5 L 762.0,722.5 Z" />
      <path d="M 1289.0,715.5 L 1279.0,715.5 L 1242.0,704.5 L 1211.0,699.5 L 1209.5,692.0 L 1227.0,676.5 L 1264.0,657.5 L 1339.0,578.5 L 1382.0,544.5 L 1425.5,501.0 L 1466.0,462.5 L 1466.5,467.0 L 1449.5,494.0 L 1422.5,527.0 L 1404.5,557.0 L 1376.5,598.0 L 1357.5,620.0 L 1342.5,647.0 L 1320.5,673.0 L 1302.5,703.0 L 1289.0,715.5 Z" />
      <path d="M 1534.0,855.5 L 1528.0,855.5 L 1508.0,844.5 L 1494.5,831.0 L 1493.5,826.0 L 1497.0,823.5 L 1718.0,778.5 L 1755.0,775.5 L 1755.5,778.0 L 1749.0,781.5 L 1631.0,818.5 L 1591.0,836.5 L 1560.0,844.5 L 1534.0,855.5 Z" />
      <path d="M 516.0,857.5 L 487.0,855.5 L 456.0,838.5 L 404.0,816.5 L 347.0,800.5 L 300.5,780.0 L 314.0,778.5 L 332.0,782.5 L 364.0,791.5 L 416.0,792.5 L 450.0,804.5 L 487.0,806.5 L 526.0,821.5 L 548.0,824.5 L 549.5,832.0 L 538.0,843.5 L 516.0,857.5 Z" />
    </svg>
  );
}

export default function ApexStorefront() {
  const { products, loadingProducts, addItem, totalItems, setCartOpen } = useCart();
  const currency = useUserCurrency();

  // Active Category Filter for Streetwear House (Apparel default)
  const [activeCategory, setActiveCategory] = useState('ALL');

  // Active Gender Filter ('ALL' | 'MENS' | 'WOMENS')
  const [activeGender, setActiveGender] = useState('ALL');

  // Header scroll detection
  const [scrolled, setScrolled] = useState(false);
  const [headerHidden, setHeaderHidden] = useState(false);
  const lastScrollY = useRef(0);

  useEffect(() => {
    document.title = "APEX by The ARC | Wear What Others Can't";
    let link = document.querySelector("link[rel~='icon']");
    if (!link) {
      link = document.createElement('link');
      link.rel = 'icon';
      document.head.appendChild(link);
    }
    link.type = 'image/svg+xml';
    const shopifyFavicon = window.APEX_ASSETS?.favicon || '/favicon.svg';
    link.href = shopifyFavicon;
  }, []);

  useEffect(() => {
    const handleScroll = () => {
      const y = window.scrollY;
      setScrolled(y > 50);
      setHeaderHidden(y > lastScrollY.current && y > 120);
      lastScrollY.current = y;
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // State per product: { [productId]: { color, size } }
  const [selectedSizes, setSelectedSizes] = useState({});
  const [selectedColors, setSelectedColors] = useState({});

  // Active Lookbook Card for modal inspection
  const [activeLookbook, setActiveLookbook] = useState(null);

  // Dedicated Size Guide Modal state
  const [sizeGuideProduct, setSizeGuideProduct] = useState(null);

  // Dedicated Product Detail Modal state
  const [detailProduct, setDetailProduct] = useState(null);
  const [detailActiveImg, setDetailActiveImg] = useState('');
  const [detailColor, setDetailColor] = useState('');
  const [detailSize, setDetailSize] = useState('');

  // Modals state: 'buy' | 'waitlist' | null
  const [activeModal, setActiveModal] = useState(null);
  const [modalProduct, setModalProduct] = useState(null);

  // Slide-out Drawer for Stationery & Objects
  const [drawerOpen, setDrawerOpen] = useState(false);

  // Waitlist form state
  const [wlEmail, setWlEmail] = useState('');
  const [wlSize, setWlSize] = useState('L');
  const [wlLoading, setWlLoading] = useState(false);
  const [wlConfirmed, setWlConfirmed] = useState(false);

  // Buy Now form state
  const [buyLoading, setBuyLoading] = useState(false);
  const [buyForm, setBuyForm] = useState({
    name: '',
    email: '',
    phone: '',
    address: '',
    city: '',
    state: '',
    zip: '',
    country: 'IN'
  });

  const allProducts = products || [];

  const heroBgDesktop = (typeof window !== 'undefined' && window.APEX_ASSETS?.heroBackdropDuo)
    ? window.APEX_ASSETS.heroBackdropDuo
    : '/backdrop-user-black-duo.jpg';

  const heroBgMobile = (typeof window !== 'undefined' && window.APEX_ASSETS?.heroBackdropMobile)
    ? window.APEX_ASSETS.heroBackdropMobile
    : '/backdrop-user-black-mobile.jpg';

  // Streetwear garments (Directly Visible) vs Stationery / Digital (Housed in Drawer/Vault)
  const streetwearProducts = allProducts.filter(p => p.category !== 'Stationery' && p.category !== 'Digital');
  const stationeryAndDigital = allProducts.filter(p => p.category === 'Stationery' || p.category === 'Digital');
  const objectsCount = stationeryAndDigital.length;

  // Gender Filter Evaluation
  const matchesGender = (p) => {
    if (activeGender === 'ALL') return true;
    if (activeGender === 'MENS') return p.gender === "Men's" || p.gender === 'Unisex';
    if (activeGender === 'WOMENS') return p.gender === "Women's" || p.gender === 'Unisex';
    return true;
  };

  const genderFilteredProducts = React.useMemo(() => {
    return streetwearProducts.filter(matchesGender);
  }, [streetwearProducts, activeGender]);

  const mensCount = React.useMemo(() => {
    return streetwearProducts.filter(p => p.gender === "Men's" || p.gender === 'Unisex').length;
  }, [streetwearProducts]);

  const womensCount = React.useMemo(() => {
    return streetwearProducts.filter(p => p.gender === "Women's" || p.gender === 'Unisex').length;
  }, [streetwearProducts]);

  // Dynamic Category Extraction: Outerwear prioritized first as requested, followed by Footwear, Shorts, Tops
  const dynamicCategories = React.useMemo(() => {
    const map = {};
    genderFilteredProducts.forEach(p => {
      const cat = p.category || 'Apparel';
      map[cat] = (map[cat] || 0) + 1;
    });
    const priority = ['Outerwear', 'Footwear', 'Shorts', 'Tops'];
    return Object.keys(map).sort((a, b) => {
      const ia = priority.indexOf(a);
      const ib = priority.indexOf(b);
      if (ia !== -1 && ib !== -1) return ia - ib;
      if (ia !== -1) return -1;
      if (ib !== -1) return 1;
      return a.localeCompare(b);
    }).map(cat => ({ name: cat, count: map[cat] }));
  }, [genderFilteredProducts]);

  // Default grid displays streetwear filtered by both category and gender
  const filteredProducts = activeCategory === 'ALL'
    ? genderFilteredProducts
    : genderFilteredProducts.filter(p => p.category && p.category.toUpperCase() === activeCategory);

  const getProductColor = (item) => {
    return selectedColors[item.id] || item.colors?.[0] || null;
  };

  const getProductSize = (item) => {
    return selectedSizes[item.id] || (item.sizes && item.sizes.length ? item.sizes[0] : null);
  };

  // Robust colorway image resolution: switches photo dynamically on color selection
  const getProductImage = (item, colorOverride = null) => {
    const color = colorOverride || getProductColor(item);
    if (!color) return item.image;

    // 1. Direct colorImages mapping
    if (item.colorImages && item.colorImages[color]) {
      return item.colorImages[color];
    }

    // 2. Parsed variant images
    if (item.parsedVariants) {
      const match = item.parsedVariants.find(v => v.color && v.color.toLowerCase() === color.toLowerCase() && v.image);
      if (match?.image) return match.image;
    }

    // 3. Parsed images with variantIds
    if (item.images && item.parsedVariants) {
      const matchingVariants = item.parsedVariants.filter(v => v.color && v.color.toLowerCase() === color.toLowerCase());
      const vIds = new Set(matchingVariants.map(v => v.id));
      const matchingImg = item.images.find(img => img.variantIds && img.variantIds.some(id => vIds.has(id)));
      if (matchingImg?.src) return matchingImg.src;
    }

    // 4. Heuristic fallback for footwear sole colors
    if (item.category === 'Footwear' && item.images && item.images.length > 1) {
      if (color.toLowerCase().includes('black') && item.images[1]?.src) return item.images[1].src;
      if (color.toLowerCase().includes('white') && item.images[0]?.src) return item.images[0].src;
    }

    return item.image;
  };

  // Open Product Detail Modal (with live color/size states)
  const openProductDetail = (item) => {
    const chosenColor = getProductColor(item) || (item.colors?.[0] || '');
    const chosenSize = getProductSize(item) || (item.sizes?.[0] || '');
    const activeImg = getProductImage(item, chosenColor);
    
    setDetailProduct(item);
    setDetailColor(chosenColor);
    setDetailSize(chosenSize);
    setDetailActiveImg(activeImg);
  };

  const handleDetailColorChange = (c) => {
    setDetailColor(c);
    if (detailProduct) {
      const nextImg = getProductImage(detailProduct, c);
      setDetailActiveImg(nextImg);
    }
  };

  // Direct 1-Click Shopify Checkout
  const openBuyNow = async (product, forcedColor = null, forcedSize = null) => {
    const chosenColor = forcedColor || getProductColor(product);
    const chosenSize = forcedSize || getProductSize(product);

    let match = null;
    if (product.parsedVariants && product.parsedVariants.length > 0) {
      // 1. Exact match (both size and color)
      match = product.parsedVariants.find(v => 
        (!chosenSize || v.size === chosenSize) && 
        (!chosenColor || v.color === chosenColor)
      );

      // 2. Match by size only
      if (!match && chosenSize) {
        match = product.parsedVariants.find(v => v.size === chosenSize);
      }

      // 3. Match by color only
      if (!match && chosenColor) {
        match = product.parsedVariants.find(v => v.color === chosenColor);
      }

      // 4. Fallback to first available variant
      if (!match) {
        match = product.parsedVariants[0];
      }
    }

    const vId = match?.shopifyVariantId || (typeof match?.id === 'string' && match.id.startsWith('gid://shopify') ? match.id : null);
    if (vId) {
      try {
        const { redirectToShopifyCheckout } = await import('../utils/shopify.js');
        await redirectToShopifyCheckout([{ merchandiseId: vId, quantity: 1 }]);
        return;
      } catch (err) {
        console.error("Direct Shopify checkout redirect error:", err);
        alert("Shopify checkout redirection error: " + err.message);
        return;
      }
    } else {
      alert("Please select an available size to proceed with Instant Buy.");
    }
  };

  const openWaitlistModal = (product, preselectedSize = 'L') => {
    setModalProduct(product);
    setWlSize(preselectedSize);
    setWlEmail('');
    setWlConfirmed(false);
    setActiveModal('waitlist');
  };

  const closeModal = () => {
    setActiveModal(null);
    setModalProduct(null);
    setWlConfirmed(false);
  };

  const submitWaitlist = async (email, productId, productName, size) => {
    try {
      const existing = JSON.parse(localStorage.getItem('apex_waitlist_entries') || '[]');
      existing.push({
        email,
        productId,
        productName,
        size: size || 'N/A',
        timestamp: new Date().toISOString()
      });
      localStorage.setItem('apex_waitlist_entries', JSON.stringify(existing));
    } catch (e) {
      console.warn('Local storage save:', e);
    }

    try {
      await addDoc(collection(db, 'waitlist'), {
        email,
        productId,
        productName,
        size: size || 'N/A',
        source: 'apex_streetwear_home',
        timestamp: serverTimestamp()
      });
    } catch (fsErr) {
      console.warn('Firestore sync note:', fsErr?.message);
    }

    try {
      await fetch('https://thearc-rev.online/api/joinWaitlist', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, productId, size: size || 'N/A' })
      });
    } catch (apiErr) {
      console.warn('API sync note:', apiErr?.message);
    }

    return true;
  };

  const handleProductWaitlist = async (e) => {
    e.preventDefault();
    if (!wlEmail) return;
    setWlLoading(true);
    await submitWaitlist(wlEmail, modalProduct?.id || 'apex_garment', modalProduct?.name || 'Drop 001 Garment', wlSize);
    setWlConfirmed(true);
    setWlLoading(false);
  };

  const loadCashfree = () => new Promise(resolve => {
    if (window.Cashfree) return resolve(true);
    const s = document.createElement('script');
    s.src = 'https://sdk.cashfree.com/js/v3/cashfree.js';
    s.onload = () => resolve(true);
    s.onerror = () => resolve(false);
    document.body.appendChild(s);
  });

  const handleBuyNowSubmit = async (e) => {
    e.preventDefault();
    if (!modalProduct) return;
    setBuyLoading(true);

    try {
      let pVariantId = null;
      if (modalProduct.parsedVariants && modalProduct.parsedVariants.length > 0) {
        const match = modalProduct.parsedVariants.find(
          x => (!modalProduct.selectedSize || x.size === modalProduct.selectedSize) &&
               (!modalProduct.selectedColor || x.color === modalProduct.selectedColor)
        ) || modalProduct.parsedVariants.find(x => !modalProduct.selectedSize || x.size === modalProduct.selectedSize)
          || modalProduct.parsedVariants[0];
        if (match) pVariantId = match.shopifyVariantId || match.id;
      }

      if (!pVariantId) {
        throw new Error('Please select an available size before continuing to checkout.');
      }

      const { redirectToShopifyCheckout } = await import('../utils/shopify.js');
      await redirectToShopifyCheckout([{ merchandiseId: pVariantId, quantity: 1 }]);
    } catch (err) {
      alert('Checkout error: ' + err.message);
      setBuyLoading(false);
    }
  };

  const renderProductCard = (item) => {
    const currentColor = getProductColor(item);
    const currentSize = getProductSize(item);
    const activeImage = getProductImage(item, currentColor);

    // Shopify order hover flash: image 2 by default, or image 1 if active is image 2
    const hoverImage = (item.images && item.images.length > 1)
      ? (item.images.find(img => img.src !== activeImage)?.src || item.images[1]?.src)
      : null;

    return (
      <div className="apex-garment-card" key={item.id}>
        {/* Media Wrapper */}
        <div 
          className="apex-garment-card-media"
          onClick={() => openProductDetail(item)}
          title="Click to view details & specifications"
        >
          <img src={activeImage} alt={item.name} className="apex-garment-img-primary" loading="lazy" />
          {hoverImage && (
            <img src={hoverImage} alt={`${item.name} alternate view`} className="apex-garment-img-hover" loading="lazy" />
          )}
          <div className="apex-garment-badges">
            <div className="apex-garment-badges-left">
              <span className="apex-garment-badge-cat">{item.category}</span>
              {item.gender && (
                <span className="apex-garment-badge-gender">{item.gender}</span>
              )}
            </div>
            <span className="apex-garment-badge-fabric">Drop 001</span>
          </div>
        </div>

        {/* Card Body */}
        <div className="apex-garment-card-body">
          <div className="apex-garment-card-top">
            <h3 
              className="apex-garment-card-title"
              onClick={() => openProductDetail(item)}
            >
              {stripGsm(item.name)}
            </h3>
            <span className="apex-garment-card-price">{formatPrice(item, currency)}</span>
          </div>

          {/* Clean Product Tagline (Only shown if defined, otherwise empty) */}
          {item.tagline && (
            <p className="apex-garment-tagline">{stripGsm(item.tagline)}</p>
          )}

          {/* Curated Spec / Silhouette Tag */}
          {item.specTag && (
            <div className="apex-garment-spec-line">
              <span>{stripGsm(item.specTag)}</span>
            </div>
          )}

          {/* Color / Sole Swatches if available - live switches image on click */}
          {item.colors && item.colors.length > 1 && (
            <div className="apex-garment-colors">
              <span className="apex-garment-opt-label">
                {item.category === 'Footwear' ? 'Sole Edition:' : 'Colorway:'} <strong>{currentColor}</strong>
              </span>
              <div className="apex-garment-color-btns">
                {item.colors.map(c => (
                  <button
                    key={c}
                    type="button"
                    className={`apex-garment-color-btn ${currentColor === c ? 'active' : ''}`}
                    onClick={(e) => {
                      e.stopPropagation();
                      setSelectedColors(prev => ({ ...prev, [item.id]: c }));
                    }}
                  >
                    {c}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Size Selector */}
          {item.sizes && item.sizes.length > 0 && (
            <div className="apex-garment-sizes">
              <div className="apex-size-header">
                <span>{item.category === 'Footwear' ? 'Select Shoe Size' : 'Select Size'}</span>
                <div className="apex-size-header-actions">
                  <button
                    type="button"
                    className="apex-size-guide-pill-btn"
                    onClick={(e) => {
                      e.stopPropagation();
                      setSizeGuideProduct(item);
                    }}
                    title="View official measurement table"
                  >
                    📐 Size Guide
                  </button>
                  <span className="apex-size-fit-tag">True to fit</span>
                </div>
              </div>
              <div className="apex-garment-size-pills">
                {item.sizes.map(size => (
                  <button
                    key={size}
                    type="button"
                    className={`apex-garment-size-pill ${currentSize === size ? 'active' : ''}`}
                    onClick={(e) => {
                      e.stopPropagation();
                      setSelectedSizes(prev => ({ ...prev, [item.id]: size }));
                    }}
                  >
                    {size}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Action Buttons */}
          <div className="apex-garment-cta-row">
            <button
              type="button"
              className="apex-btn-primary"
              onClick={() => openBuyNow(item, currentColor, currentSize)}
            >
              Instant Buy →
            </button>
            <button
              type="button"
              className="apex-btn-secondary"
              onClick={() => addItem(item, currentSize, currentColor)}
            >
              + Add to Bag
            </button>
          </div>

          <button
            type="button"
            className="apex-garment-details-btn"
            onClick={() => openProductDetail(item)}
          >
            View Specs &amp; Details →
          </button>
        </div>
      </div>
    );
  };

  return (
    <div className="apex-light">

      {/* ── TOP ANNOUNCEMENT BAR ── */}
      <div className="apex-top-bar">
        <span className="apex-top-bar-marquee">
          DROP 001 // WEAR WHAT OTHERS CAN'T • 50 PIECES PER JACKET • 20 PAIRS PER FOOTWEAR • PAN-INDIA PRIORITY DISPATCH
        </span>
        <a 
          href="https://thearc-rev.online" 
          target="_blank" 
          rel="noopener noreferrer" 
          className="apex-top-bar-universe-pill"
          title="Explore The ARC Universe"
        >
          <span className="apex-universe-dot">✦</span>
          The ARC Universe ↗
        </a>
      </div>

      {/* ── HEADER ── */}
      <header className={`apex-header ${scrolled ? 'scrolled' : ''} ${headerHidden ? 'hidden' : ''}`}>
        <a href="#hero" className="apex-logo">
          <ApexLogoMark />
          <div className="apex-logo-text">
            <span className="apex-logo-name">Apex</span>
            <div className="apex-logo-rule" />
            <span className="apex-logo-sub">By The ARC</span>
          </div>
        </a>

        <nav>
          <ul className="apex-header-nav">
            <li><a href="#wardrobe">Collection ({streetwearProducts.length})</a></li>
            <li><a href="#ensembles">Ensembles</a></li>
            <li><a href="#lookbook">Lookbook</a></li>
            <li><a href="#manifesto">Manifesto</a></li>
            <li>
              <button
                type="button"
                className="apex-nav-objects-btn"
                onClick={() => setDrawerOpen(true)}
              >
                Objects &amp; Stationery ({objectsCount})
              </button>
            </li>
            <li><a href="#shadows">Shadows</a></li>
            <li>
              <a 
                href="https://thearc-rev.online" 
                target="_blank" 
                rel="noopener noreferrer" 
                className="apex-nav-universe-pill"
                title="Explore The ARC Universe"
              >
                The ARC Universe ↗
              </a>
            </li>
          </ul>
        </nav>

        <div className="apex-header-right">
          <span className="apex-curr-pill">{currency}</span>
          <button className="apex-cart-trigger" onClick={() => setCartOpen(true)}>
            Bag {totalItems > 0 && <span className="apex-cart-pip">{totalItems}</span>}
          </button>
        </div>
      </header>

      {/* ── LUXURY STREETWEAR CAMPAIGN HERO ── */}
      <section className="apex-streetwear-hero" id="hero">
        {/* Shaded Campaign Backdrop (Hoodie & Sneaker Duo with Atmospheric Vignette) */}
        <div className="apex-hero-stage-backdrop" aria-hidden="true">
          <picture>
            <source media="(max-width: 768px)" srcSet={heroBgMobile} />
            <img 
              src={heroBgDesktop} 
              alt="APEX Streetwear Campaign" 
              className="apex-hero-backdrop-img"
            />
          </picture>
          <div className="apex-hero-backdrop-overlay" />
          <div className="apex-hero-backdrop-glow" />
        </div>
        <div className="apex-hero-grid-lines" />

        <div className="apex-hero-content-editorial">
          <div className="apex-hero-season-pill">
            <span className="apex-hero-live-dot" />
            <span>DROP 001 // WEAR WHAT OTHERS CAN'T</span>
          </div>

          <h1 className="apex-hero-title-monolithic">
            APEX
            <span className="apex-hero-sub-title">BY THE ARC</span>
          </h1>

          <p className="apex-hero-editorial-tagline">
            Wear what others can't. Every silhouette in Drop 001 is strictly limited — 50 pieces per jacket edition, 20 pairs per footwear silhouette. Once sold out, each model is permanently retired into the archive and succeeded by Drop 002.
          </p>

          <div className="apex-hero-cta-group">
            <a href="#wardrobe" className="apex-hero-btn-primary">
              Explore Drop 001 ({streetwearProducts.length}) ↓
            </a>
            <a href="#ensembles" className="apex-hero-btn-secondary">
              View Ensembles →
            </a>
            <button
              type="button"
              className="apex-hero-btn-ghost"
              onClick={() => setDrawerOpen(true)}
            >
              Objects of Discipline ({objectsCount}) →
            </button>
          </div>

          <div className="apex-hero-spec-matrix">
            <div className="apex-hero-matrix-item">
              <strong>50 Pieces</strong>
              <span>Per Jacket Edition</span>
            </div>
            <div className="apex-hero-matrix-sep" />
            <div className="apex-hero-matrix-item">
              <strong>20 Pairs</strong>
              <span>Per Footwear Silhouette</span>
            </div>
            <div className="apex-hero-matrix-sep" />
            <div className="apex-hero-matrix-item">
              <strong>Drop 001</strong>
              <span>Wear What Others Can't</span>
            </div>
            <div className="apex-hero-matrix-sep" />
            <div className="apex-hero-matrix-item">
              <strong>Drop 002</strong>
              <span>Succession Upon Sellout</span>
            </div>
          </div>
        </div>

        <div className="apex-hero-scroll-indicator">
          <span>SCROLL TO DISCOVER</span>
          <div className="apex-hero-scroll-line" />
        </div>
      </section>

      {/* ── KINETIC RUNWAY TICKER BAR ── */}
      <div className="apex-ticker-bar">
        <div className="apex-ticker-track">
          <span>WEAR WHAT OTHERS CAN'T</span>
          <span className="ticker-dot">✦</span>
          <span>DROP 001 // LIMITED ARCHIVE</span>
          <span className="ticker-dot">✦</span>
          <span>50 PIECES PER JACKET</span>
          <span className="ticker-dot">✦</span>
          <span>20 PAIRS PER FOOTWEAR</span>
          <span className="ticker-dot">✦</span>
          <span>HAND-LASTED CRAFT SILHOUETTES</span>
          <span className="ticker-dot">✦</span>
          <span>PAN-INDIA PRIORITY DISPATCH</span>
          <span className="ticker-dot">✦</span>
          <span>WEAR WHAT OTHERS CAN'T</span>
          <span className="ticker-dot">✦</span>
          <span>DROP 001 // LIMITED ARCHIVE</span>
          <span className="ticker-dot">✦</span>
          <span>50 PIECES PER JACKET</span>
          <span className="ticker-dot">✦</span>
          <span>20 PAIRS PER FOOTWEAR</span>
          <span className="ticker-dot">✦</span>
          <span>HAND-LASTED CRAFT SILHOUETTES</span>
          <span className="ticker-dot">✦</span>
          <span>PAN-INDIA PRIORITY DISPATCH</span>
        </div>
      </div>

      {/* ── WARDROBE CATALOGUE & CATEGORY FILTER ── */}
      <section className="apex-section" id="wardrobe">
        <div className="apex-section-head">
          <div>
            <div className="apex-section-eyebrow">Drop 001 // Wear What Others Can't</div>
            <h2 className="apex-section-title">The Complete Capsule</h2>
          </div>
          <p className="apex-section-caption">
            Every piece belongs to Drop 001 — strictly limited to 50 pieces per jacket edition and 20 pairs per footwear silhouette. Once sold out, each model is retired to the archive and replaced with Drop 002.
          </p>
        </div>

        {/* Dynamic Controls: Gender Toggle & Category Navigation Pills */}
        <div className="apex-filter-controls">
          {/* Gender Filter Segment */}
          <div className="apex-gender-nav-pills">
            <span className="apex-filter-heading-label">Audience:</span>
            <button
              type="button"
              className={`apex-gender-pill ${activeGender === 'ALL' ? 'active' : ''}`}
              onClick={() => setActiveGender('ALL')}
            >
              All Pieces ({streetwearProducts.length})
            </button>
            <button
              type="button"
              className={`apex-gender-pill ${activeGender === 'MENS' ? 'active' : ''}`}
              onClick={() => setActiveGender('MENS')}
            >
              Men's ({mensCount})
            </button>
            <button
              type="button"
              className={`apex-gender-pill ${activeGender === 'WOMENS' ? 'active' : ''}`}
              onClick={() => setActiveGender('WOMENS')}
            >
              Women's ({womensCount})
            </button>
          </div>

          {/* Dynamic Category Navigation Pills */}
          <div className="apex-category-nav-pills">
            <span className="apex-filter-heading-label">Category:</span>
            <button
              type="button"
              className={`apex-cat-pill ${activeCategory === 'ALL' ? 'active' : ''}`}
              onClick={() => setActiveCategory('ALL')}
            >
              All Categories ({genderFilteredProducts.length})
            </button>
            {dynamicCategories.map(cat => (
              <button
                key={cat.name}
                type="button"
                className={`apex-cat-pill ${activeCategory === cat.name.toUpperCase() ? 'active' : ''}`}
                onClick={() => setActiveCategory(cat.name.toUpperCase())}
              >
                {cat.name} ({cat.count})
              </button>
            ))}
            <button
              type="button"
              className="apex-cat-pill apex-cat-pill-vault"
              onClick={() => setDrawerOpen(true)}
            >
              Objects &amp; Stationery ({objectsCount}) ↗
            </button>
          </div>
        </div>

        {/* Product Catalogue Display: Curated Sections when ALL, or Unified Grid when Category Selected */}
        {activeCategory === 'ALL' ? (
          <div className="apex-catalogue-sections-wrap">
            {SECTION_DEFS.map(sec => {
              const secProds = filteredProducts.filter(p => p.sectionKey === sec.key);
              if (secProds.length === 0) return null;
              return (
                <div key={sec.key} className="apex-catalogue-section">
                  <div className="apex-sub-section-head">
                    <div className="apex-sub-section-eyebrow">{sec.eyebrow}</div>
                    <div className="apex-sub-section-title-row">
                      <h3 className="apex-sub-section-title">{sec.title}</h3>
                      <span className="apex-sub-section-count">({secProds.length} Pieces)</span>
                    </div>
                    <p className="apex-sub-section-desc">{sec.tagline}</p>
                  </div>
                  <div className="apex-streetwear-grid">
                    {secProds.map(renderProductCard)}
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="apex-streetwear-grid">
            {filteredProducts.map(renderProductCard)}
          </div>
        )}
      </section>

      {/* ── CURATED ENSEMBLES SECTION ── */}
      <section className="apex-section apex-section-highlight" id="ensembles">
        <div className="apex-section-head">
          <div>
            <div className="apex-section-eyebrow">Curated Silhouettes // Complete Looks</div>
            <h2 className="apex-section-title">Drop 001 Ensembles</h2>
          </div>
          <p className="apex-section-caption">
            Discover how hand-lasted craft footwear, active modular bottoms, varsity outerwear, and streetwear tees coordinate into complete outfits.
          </p>
        </div>

        <div className="apex-ensembles-grid">
          {LOOKBOOK_ITEMS.map(ens => (
            <div className="apex-ensemble-card" key={ens.id}>
              <div className="apex-ensemble-media-stack">
                <div className="apex-ensemble-main-img">
                  <img src={ens.image} alt={ens.title} />
                </div>
                {ens.secondaryImage && (
                  <div className="apex-ensemble-sub-imgs">
                    <div className="apex-ensemble-sub-img">
                      <img src={ens.secondaryImage} alt={`${ens.title} Sub`} />
                    </div>
                  </div>
                )}
              </div>

              <div className="apex-ensemble-body">
                <span className="apex-ensemble-eyebrow">{ens.category}</span>
                <h3 className="apex-ensemble-title">{ens.title}</h3>
                <h4 className="apex-ensemble-sub">{ens.subtitle}</h4>
                <p className="apex-ensemble-desc">{ens.desc}</p>
                <div className="apex-ensemble-tags">
                  {ens.tags.map(t => (
                    <span key={t} className="apex-badge-edition">{t}</span>
                  ))}
                </div>
                <button
                  type="button"
                  className="apex-btn-primary"
                  style={{ marginTop: '1.5rem', width: '100%' }}
                  onClick={() => setActiveLookbook(ens)}
                >
                  Inspect Complete Look →
                </button>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ── EDITORIAL CAMPAIGN RUNWAY LOOKBOOK ── */}
      <section className="apex-section" id="lookbook">
        <div className="apex-section-head">
          <div>
            <div className="apex-section-eyebrow">Campaign 001 // Visual Runway</div>
            <h2 className="apex-section-title">The Runway Lookbook</h2>
          </div>
          <p className="apex-section-caption">
            Visual documentation of Drop 001. Where industrial minimalism meets high-fashion luxury streetwear.
          </p>
        </div>

        <div className="apex-lookbook-grid">
          {LOOKBOOK_ITEMS.map((item, idx) => (
            <div 
              className={`apex-lookbook-card ${idx === 0 ? 'span-2' : ''}`}
              key={item.id}
              onClick={() => setActiveLookbook(item)}
            >
              <div className="apex-lookbook-img-wrap">
                <img src={item.image} alt={item.title} className="apex-lookbook-img-main" loading="lazy" />
                <div className="apex-lookbook-overlay">
                  <div className="apex-lookbook-tag-row">
                    {item.tags.map(t => (
                      <span key={t} className="apex-lookbook-tag-pill">{t}</span>
                    ))}
                  </div>
                  <div className="apex-lookbook-content">
                    <span className="apex-lookbook-cat">{item.category}</span>
                    <h3 className="apex-lookbook-title">{item.title}</h3>
                    <p className="apex-lookbook-desc">{item.desc}</p>
                    <span className="apex-lookbook-view-btn">Inspect Ensemble ↗</span>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ── ARCHIVAL INSTRUMENTS & OBJECTS BANNER ── */}
      {stationeryAndDigital.length > 0 && (
        <div className="apex-objects-banner-bar">
          <div className="apex-objects-banner-inner">
            <div>
              <div className="apex-section-eyebrow" style={{ marginBottom: '0.2rem' }}>Archival Daily Instruments</div>
              <h3 className="apex-objects-banner-title">The Arc Objects of Discipline</h3>
              <p className="apex-objects-banner-sub">
                Explore our hardbound discipline journals, daily planners, habit trackers, and The Salary Trap framework.
              </p>
            </div>
            <button
              type="button"
              className="apex-objects-banner-btn"
              onClick={() => setDrawerOpen(true)}
            >
              Access Archival Vault ({stationeryAndDigital.length}) →
            </button>
          </div>
        </div>
      )}

      {/* ── THE CRAFT & MATERIAL MANIFESTO ── */}
      <section className="apex-section" id="manifesto">
        <div className="apex-section-head">
          <div>
            <div className="apex-section-eyebrow">Streetwear Engineering // Material Science</div>
            <h2 className="apex-section-title">The Material Manifesto</h2>
          </div>
          <p className="apex-section-caption">
            Every APEX silhouette is constructed with genuine attention to material integrity, reinforced stitching, and precision finish.
          </p>
        </div>

        <div className="apex-manifesto-grid">
          {MANIFESTO_ITEMS.map(mat => (
            <div className="apex-manifesto-card" key={mat.id}>
              <div className="apex-manifesto-weight">{mat.weight}</div>
              <h3 className="apex-manifesto-title">{mat.title}</h3>
              <p className="apex-manifesto-desc">{mat.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── THE SHADOWS (FUTURE DROPS & CONFIDENTIAL PATTERNS) ── */}
      <section className="apex-section" id="shadows">
        <div className="apex-section-head">
          <div>
            <div className="apex-section-eyebrow">The Archive // Future Drops</div>
            <h2 className="apex-section-title">The Shadows</h2>
          </div>
          <p className="apex-section-caption">
            Confidential cuts, tailored technical trousers, and experimental outerwear currently on pattern tables for Drop 002. As Drop 001 silhouettes sell out (50 jackets / 20 footwear pairs), these next-generation forms activate.
          </p>
        </div>

        <div className="apex-shadow-grid">
          {SHADOW_ITEMS.map(shadow => (
            <div className="apex-shadow-item" key={shadow.id}>
              <div className="apex-shadow-media">
                <svg className="apex-shadow-svg-art" viewBox="0 0 100 130" fill="none" stroke="#111111" strokeWidth="1.2">
                  <path d={shadow.svgPath} />
                </svg>
                <div className="apex-shadow-veil" />
                <span className="apex-shadow-status-tag">{shadow.status}</span>
              </div>
              <div className="apex-shadow-body">
                <h3 className="apex-shadow-name">{shadow.name}</h3>
                <div className="apex-shadow-unrevealed">Confidential Pattern</div>
                <p className="apex-shadow-desc">{shadow.desc}</p>
                <button
                  type="button"
                  className="apex-shadow-btn"
                  onClick={() => openWaitlistModal(shadow, 'General')}
                >
                  Notify On Reveal →
                </button>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ── FOOTER ── */}
      <footer className="apex-footer">
        <div className="apex-footer-inner">
          <div className="apex-footer-brand">
            <span className="apex-footer-name">Apex</span>
            <div className="apex-footer-rule" />
            <span className="apex-footer-sub">By The ARC</span>
            <p className="apex-footer-copy">
              © {new Date().getFullYear()} APEX by The ARC. Wear what others can't. Luxury architectural streetwear, craft footwear, and archival instruments.
              <br />
              <span style={{ fontSize: '11px', color: '#888', marginTop: '6px', display: 'inline-block' }}>
                Legal Merchant Entity: REVANTH MAPAKSHI • Direct: +91 9491310928 • Concierge: revanthmapakshi15@gmail.com / apexbythearc@gmail.com • Bengaluru, India
              </span>
            </p>
          </div>

          <ul className="apex-footer-links">
            <li><a href="https://thearc-rev.online" target="_blank" rel="noopener noreferrer">The ARC Universe</a></li>
            <li><button type="button" className="apex-nav-trigger" onClick={() => setDrawerOpen(true)}>Objects &amp; Stationery ({objectsCount})</button></li>
            <li><a href="/terms">Terms &amp; Conditions</a></li>
            <li><a href="/refunds">Shipping &amp; Made-to-Order Policy</a></li>
            <li><a href="/contact">Direct Concierge Desk</a></li>
          </ul>
        </div>
      </footer>

      {/* ── DEDICATED PRODUCT DETAIL INSPECTION MODAL ── */}
      {detailProduct && (
        <div className="apex-modal-bg" onClick={() => setDetailProduct(null)}>
          <div className="apex-modal-sheet apex-product-detail-modal" onClick={e => e.stopPropagation()}>
            <button className="apex-modal-x" onClick={() => setDetailProduct(null)}>×</button>
            <div className="apex-detail-grid">
              {/* Left Column: Image & Gallery */}
              <div className="apex-detail-gallery">
                <div className="apex-detail-main-media">
                  <img src={detailActiveImg || detailProduct.image} alt={detailProduct.name} />
                </div>
                {detailProduct.images && detailProduct.images.length > 1 && (
                  <div className="apex-detail-thumb-strip">
                    {detailProduct.images.map((img, idx) => {
                      const src = img.src || img;
                      return (
                        <button
                          key={idx}
                          type="button"
                          className={`apex-detail-thumb-btn ${detailActiveImg === src ? 'active' : ''}`}
                          onClick={() => setDetailActiveImg(src)}
                        >
                          <img src={src} alt={`${detailProduct.name} view ${idx + 1}`} loading="lazy" />
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Right Column: Full Specifications, Description & Order */}
              <div className="apex-detail-info">
                <div className="apex-detail-badge-row">
                  <span className="apex-detail-cat-badge">{detailProduct.category}</span>
                  <span className="apex-detail-fabric-badge">Drop 001</span>
                  <span className="apex-detail-fabric-badge" style={{ color: 'var(--red)', borderColor: 'var(--red-border)' }}>
                    Wear What Others Can't
                  </span>
                </div>

                <h2 className="apex-detail-title">{stripGsm(detailProduct.name)}</h2>
                <div className="apex-detail-price">{formatPrice(detailProduct, currency)}</div>

                {detailProduct.tagline && (
                  <div className="apex-detail-tagline">{stripGsm(detailProduct.tagline)}</div>
                )}

                {/* Color / Sole Selector */}
                {detailProduct.colors && detailProduct.colors.length > 1 && (
                  <div className="apex-detail-opt-group">
                    <div className="apex-detail-opt-label">
                      {detailProduct.category === 'Footwear' ? 'Sole Edition:' : 'Colorway:'} <strong>{detailColor}</strong>
                    </div>
                    <div className="apex-garment-color-btns">
                      {detailProduct.colors.map(c => (
                        <button
                          key={c}
                          type="button"
                          className={`apex-garment-color-btn ${detailColor === c ? 'active' : ''}`}
                          onClick={() => handleDetailColorChange(c)}
                        >
                          {c}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* Size Selector */}
                {detailProduct.sizes && detailProduct.sizes.length > 0 && (
                  <div className="apex-detail-opt-group">
                    <div className="apex-size-header">
                      <span>{detailProduct.category === 'Footwear' ? 'Select Shoe Size:' : 'Select Size:'} <strong>{detailSize}</strong></span>
                      <div className="apex-size-header-actions">
                        <button
                          type="button"
                          className="apex-size-guide-pill-btn"
                          onClick={() => setSizeGuideProduct(detailProduct)}
                          title="View official measurement table"
                        >
                          📐 Size Guide
                        </button>
                        <span className="apex-size-fit-tag">True to fit</span>
                      </div>
                    </div>
                    <div className="apex-garment-size-pills">
                      {detailProduct.sizes.map(s => (
                        <button
                          key={s}
                          type="button"
                          className={`apex-garment-size-pill ${detailSize === s ? 'active' : ''}`}
                          onClick={() => setDetailSize(s)}
                        >
                          {s}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* Full Description & Specifications */}
                <div className="apex-detail-desc-box">
                  <h4 className="apex-detail-desc-title">Product Details &amp; Specifications</h4>
                  {detailProduct.descHtml ? (
                    <div 
                      className="apex-detail-desc-html"
                      dangerouslySetInnerHTML={{ __html: detailProduct.descHtml }}
                    />
                  ) : (
                    <p className="apex-detail-desc-text">{detailProduct.desc}</p>
                  )}
                </div>

                {/* Purchase Actions */}
                <div className="apex-detail-cta-row">
                  <button
                    type="button"
                    className="apex-btn-primary"
                    style={{ padding: '0.9rem 1.5rem', fontSize: '0.82rem' }}
                    onClick={() => {
                      setDetailProduct(null);
                      openBuyNow(detailProduct, detailColor, detailSize);
                    }}
                  >
                    Instant Buy Now →
                  </button>
                  <button
                    type="button"
                    className="apex-btn-secondary"
                    style={{ padding: '0.9rem 1.5rem', fontSize: '0.82rem' }}
                    onClick={() => {
                      addItem(detailProduct, detailSize, detailColor);
                      setDetailProduct(null);
                    }}
                  >
                    + Add to Bag
                  </button>
                </div>

                <div className="apex-detail-trust-row">
                  <span>🇮🇳 Pan-India Priority Dispatch</span>
                  <span>🔒 Direct Shopify Checkout</span>
                  <span>✦ Drop 001: 50 Jackets / 20 Footwear</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── INTERACTIVE MEASUREMENT & SIZE GUIDE MODAL ── */}
      {sizeGuideProduct && (
        <div className="apex-modal-bg" onClick={() => setSizeGuideProduct(null)}>
          <div className="apex-modal-sheet apex-size-guide-modal-sheet" onClick={e => e.stopPropagation()}>
            <button className="apex-modal-x" onClick={() => setSizeGuideProduct(null)}>×</button>
            
            <div className="apex-size-modal-header">
              <div className="apex-section-eyebrow">Drop 001 // Master Measurement Guide</div>
              <h3 className="apex-size-modal-title">
                {sizeGuideProduct.category === 'Footwear'
                  ? 'Footwear Sizing & Sole Specifications'
                  : `${sizeGuideProduct.name || 'Haute Couture Outerwear'} // Size Chart`}
              </h3>
              <p className="apex-size-modal-sub">
                Drop 001 garments are tailored to precision architectural specifications. All garment measurements are provided in inches. Standard garment tolerance +/- 0.5 inches.
              </p>
            </div>

            {/* If Outerwear / Bomber Jackets / Tops / Shorts */}
            {sizeGuideProduct.category !== 'Footwear' && (
              <div className="apex-size-guide-content">
                <div className="apex-size-table-wrap">
                  <table className="apex-size-table">
                    <thead>
                      <tr>
                        <th>SIZE</th>
                        <th>CHEST (INCHES)</th>
                        <th>LENGTH (INCHES)</th>
                        <th>RECOMMENDED SILHOUETTE</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr>
                        <td><strong>XS</strong></td>
                        <td>38"</td>
                        <td>26"</td>
                        <td>Tailored Unisex / Petite Drape</td>
                      </tr>
                      <tr>
                        <td><strong>S</strong></td>
                        <td>40"</td>
                        <td>27"</td>
                        <td>Clean Tailored Streetwear Fit</td>
                      </tr>
                      <tr>
                        <td><strong>M</strong></td>
                        <td>42"</td>
                        <td>28"</td>
                        <td>Standard Athletic Silhouette</td>
                      </tr>
                      <tr>
                        <td><strong>L</strong></td>
                        <td>44"</td>
                        <td>29"</td>
                        <td>Structured Regular Drape</td>
                      </tr>
                      <tr>
                        <td><strong>XL</strong></td>
                        <td>46"</td>
                        <td>30"</td>
                        <td>Relaxed Streetwear / Layered Drape</td>
                      </tr>
                      <tr>
                        <td><strong>2XL</strong></td>
                        <td>48"</td>
                        <td>31"</td>
                        <td>Effortless Oversized Fit</td>
                      </tr>
                      <tr>
                        <td><strong>3XL</strong></td>
                        <td>50"</td>
                        <td>32"</td>
                        <td>Generous Extended Drape</td>
                      </tr>
                      <tr>
                        <td><strong>4XL</strong></td>
                        <td>52"</td>
                        <td>33"</td>
                        <td>Relaxed Big & Tall Silhouette</td>
                      </tr>
                      <tr>
                        <td><strong>5XL</strong></td>
                        <td>54"</td>
                        <td>34"</td>
                        <td>Maximum Architectural Volume</td>
                      </tr>
                    </tbody>
                  </table>
                </div>

                <div className="apex-size-fit-notes">
                  <div className="apex-size-fit-card">
                    <h4>✦ Men's Fit & Styling Advice</h4>
                    <p>Tailored in a regular unisex streetwear drape with structured shoulders. Fits true to size for a sharp tailored silhouette. Order one size up for an effortless oversized drape layered over heavyweight hoodies.</p>
                  </div>
                  <div className="apex-size-fit-card">
                    <h4>✦ Women's Fit & Styling Advice</h4>
                    <p>Tailored in an architectural unisex streetwear cut. Order true to size for an effortless oversized boyfriend bomber silhouette draped over wide-leg trousers or boots. Size down one size for a more contoured, tailored fit.</p>
                  </div>
                </div>
              </div>
            )}

            {/* If Footwear */}
            {sizeGuideProduct.category === 'Footwear' && (
              <div className="apex-size-guide-content">
                <div className="apex-size-table-wrap">
                  <table className="apex-size-table">
                    <thead>
                      <tr>
                        <th>US SIZE</th>
                        <th>UK SIZE</th>
                        <th>EU SIZE</th>
                        <th>FOOT LENGTH (CM)</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr><td><strong>US 7</strong></td><td>UK 6.5</td><td>EU 40</td><td>25.0 cm</td></tr>
                      <tr><td><strong>US 8</strong></td><td>UK 7.5</td><td>EU 41</td><td>26.0 cm</td></tr>
                      <tr><td><strong>US 9</strong></td><td>UK 8.5</td><td>EU 42.5</td><td>27.0 cm</td></tr>
                      <tr><td><strong>US 10</strong></td><td>UK 9.5</td><td>EU 44</td><td>28.0 cm</td></tr>
                      <tr><td><strong>US 11</strong></td><td>UK 10.5</td><td>EU 45</td><td>29.0 cm</td></tr>
                      <tr><td><strong>US 12</strong></td><td>UK 11.5</td><td>EU 46</td><td>30.0 cm</td></tr>
                    </tbody>
                  </table>
                </div>
                <div className="apex-size-fit-notes">
                  <div className="apex-size-fit-card">
                    <h4>✦ Hand-Lasted Vulcanized Sole</h4>
                    <p>Crafted on a classic dual-density vulcanized rubber chassis with Ortholite arch-support insoles. Fits true to standard athletic sneaker sizing. If between sizes, we recommend ordering half a size up.</p>
                  </div>
                </div>
              </div>
            )}

            <div className="apex-size-modal-footer">
              <button
                type="button"
                className="apex-btn-primary"
                onClick={() => setSizeGuideProduct(null)}
              >
                Close Size Guide →
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── LOOKBOOK INSPECTION MODAL ── */}
      {activeLookbook && (
        <div className="apex-modal-bg" onClick={() => setActiveLookbook(null)}>
          <div className="apex-modal-sheet apex-lookbook-modal-sheet" onClick={e => e.stopPropagation()}>
            <button className="apex-modal-x" onClick={() => setActiveLookbook(null)}>×</button>
            <div className="apex-lookbook-modal-grid">
              <div className="apex-lookbook-modal-media">
                <img src={activeLookbook.image} alt={activeLookbook.title} />
                {activeLookbook.secondaryImage && (
                  <img src={activeLookbook.secondaryImage} alt={`${activeLookbook.title} Secondary`} className="apex-lookbook-modal-sub-img" />
                )}
              </div>
              <div className="apex-lookbook-modal-details">
                <div className="apex-section-eyebrow">{activeLookbook.category}</div>
                <h3 className="apex-lookbook-modal-title">{activeLookbook.title}</h3>
                <h4 className="apex-lookbook-modal-subtitle">{activeLookbook.subtitle}</h4>
                <p className="apex-lookbook-modal-desc">{activeLookbook.desc}</p>
                <div className="apex-lookbook-modal-tags">
                  {activeLookbook.tags.map(t => (
                    <span key={t} className="apex-badge-edition">{t}</span>
                  ))}
                </div>
                <div style={{ marginTop: '2rem' }}>
                  <a href="#wardrobe" onClick={() => setActiveLookbook(null)} className="apex-hero-btn-primary" style={{ display: 'inline-block', textAlign: 'center' }}>
                    Shop The Collection →
                  </a>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── STATIONERY & OBJECTS SLIDE-OUT VAULT DRAWER ── */}
      {drawerOpen && (
        <div className="apex-drawer-backdrop" onClick={() => setDrawerOpen(false)}>
          <div className="apex-drawer-sheet" onClick={e => e.stopPropagation()}>
            <div className="apex-drawer-header">
              <div>
                <div className="apex-drawer-sub">The ARC Universe Catalog</div>
                <h2 className="apex-drawer-title">Objects of Discipline</h2>
              </div>
              <button
                type="button"
                className="apex-modal-x"
                onClick={() => setDrawerOpen(false)}
              >
                ×
              </button>
            </div>

            <div className="apex-drawer-items-list">
              {stationeryAndDigital.map(item => (
                <div className="apex-drawer-item-row" key={item.id}>
                  <img 
                    src={item.image?.startsWith('http') ? item.image : `https://thearc-rev.online${item.image?.startsWith('/') ? '' : '/'}${item.image || ''}`} 
                    alt={item.name} 
                    className="apex-drawer-item-img"
                    onError={(e) => {
                      e.target.onerror = null;
                      const fallbackMap = {
                        'ebook-salary-trap': 'https://thearc-rev.online/mockups/ebook_ipad_mockup.png',
                        'journal-arc': 'https://thearc-rev.online/mockups/journal_desk_mockup.png',
                        'planner-arc': 'https://thearc-rev.online/mockups/planner_hardbound_mockup.png',
                        'habit-tracker-arc': 'https://thearc-rev.online/mockups/habit_tracker_mockup.png'
                      };
                      if (fallbackMap[item.id]) {
                        e.target.src = fallbackMap[item.id];
                      }
                    }}
                  />
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: '0.6rem', fontFamily: 'var(--mono)', color: 'var(--red)', textTransform: 'uppercase', marginBottom: '0.2rem' }}>
                      {item.digital ? 'Digital Framework' : 'Physical Stationery'}
                    </div>
                    <h4 className="apex-drawer-item-name">{item.name}</h4>
                    <p style={{ fontSize: '0.75rem', color: 'var(--ink-secondary)', margin: '0.3rem 0 0.5rem', lineHeight: 1.4 }}>
                      {item.desc}
                    </p>
                    <div className="apex-drawer-item-price">{formatPrice(item, currency)}</div>
                    <div className="apex-drawer-item-actions">
                      <button
                        type="button"
                        className="apex-btn-drawer-buy"
                        onClick={() => {
                          setDrawerOpen(false);
                          openBuyNow(item);
                        }}
                      >
                        Buy Now
                      </button>
                      <button
                        type="button"
                        className="apex-btn-drawer-bag"
                        onClick={() => addItem(item)}
                      >
                        + Bag
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ── INSTANT BUY NOW MODAL ── */}
      {activeModal === 'buy' && modalProduct && (
        <div className="apex-modal-bg" onClick={closeModal}>
          <div className="apex-modal-sheet" onClick={e => e.stopPropagation()}>
            <button className="apex-modal-x" onClick={closeModal}>×</button>

            <div className="apex-modal-product-strip">
              {modalProduct.image ? (
                <img src={modalProduct.image} alt={modalProduct.name} className="apex-modal-product-img" />
              ) : (
                <div className="apex-modal-product-img-ph">A</div>
              )}
              <div>
                <div className="apex-modal-product-tag">Instant Checkout</div>
                <div className="apex-modal-product-name">{modalProduct.name}</div>
                <div className="apex-modal-product-price">
                  {formatPrice(modalProduct, buyForm.country === 'IN' ? 'INR' : 'USD')}
                  {modalProduct.selectedColor && ` • ${modalProduct.selectedColor}`}
                  {modalProduct.selectedSize && ` • Size ${modalProduct.selectedSize}`}
                </div>
              </div>
            </div>

            <div className="apex-modal-form">
              <form onSubmit={handleBuyNowSubmit}>
                <div className="apex-modal-form-section">Delivery Details</div>

                <div className="apex-field">
                  <label>Full Name</label>
                  <input
                    type="text"
                    required
                    placeholder="Alex Morgan"
                    value={buyForm.name}
                    onChange={e => setBuyForm({ ...buyForm, name: e.target.value })}
                  />
                </div>

                <div className="apex-field-2col">
                  <div className="apex-field">
                    <label>Email Address</label>
                    <input
                      type="email"
                      required
                      placeholder="you@domain.com"
                      value={buyForm.email}
                      onChange={e => setBuyForm({ ...buyForm, email: e.target.value })}
                    />
                  </div>
                  <div className="apex-field">
                    <label>Phone Number</label>
                    <input
                      type="tel"
                      required
                      placeholder="+91 9876543210"
                      value={buyForm.phone}
                      onChange={e => setBuyForm({ ...buyForm, phone: e.target.value })}
                    />
                  </div>
                </div>

                <div className="apex-field">
                  <label>Street Address</label>
                  <input
                    type="text"
                    required
                    placeholder="Flat 102, Indiranagar"
                    value={buyForm.address}
                    onChange={e => setBuyForm({ ...buyForm, address: e.target.value })}
                  />
                </div>

                <div className="apex-field-2col">
                  <div className="apex-field">
                    <label>City</label>
                    <input
                      type="text"
                      required
                      placeholder="Bengaluru"
                      value={buyForm.city}
                      onChange={e => setBuyForm({ ...buyForm, city: e.target.value })}
                    />
                  </div>
                  <div className="apex-field">
                    <label>PIN / ZIP Code</label>
                    <input
                      type="text"
                      required
                      placeholder="560038"
                      value={buyForm.zip}
                      onChange={e => setBuyForm({ ...buyForm, zip: e.target.value })}
                    />
                  </div>
                </div>

                <div className="apex-field-2col">
                  <div className="apex-field">
                    <label>State</label>
                    <input
                      type="text"
                      required
                      placeholder="Karnataka"
                      value={buyForm.state}
                      onChange={e => setBuyForm({ ...buyForm, state: e.target.value })}
                    />
                  </div>
                  <div className="apex-field">
                    <label>Country</label>
                    <select
                      value={buyForm.country}
                      onChange={e => setBuyForm({ ...buyForm, country: e.target.value })}
                    >
                      {countries.map(c => (
                        <option key={c.code} value={c.code}>{c.name}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <button type="submit" className="apex-modal-submit" disabled={buyLoading}>
                  {buyLoading ? 'Connecting to Secure Gateway...' : 'Proceed to Payment →'}
                </button>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* ── WAITLIST / EARLY ACCESS MODAL ── */}
      {activeModal === 'waitlist' && modalProduct && (
        <div className="apex-modal-bg" onClick={closeModal}>
          <div className="apex-modal-sheet" onClick={e => e.stopPropagation()}>
            <button className="apex-modal-x" onClick={closeModal}>×</button>

            <div className="apex-modal-product-strip">
              {modalProduct.image ? (
                <img src={modalProduct.image} alt={modalProduct.name} className="apex-modal-product-img" />
              ) : (
                <div className="apex-modal-product-img-ph">A</div>
              )}
              <div>
                <div className="apex-modal-product-tag">VIP Early Access</div>
                <div className="apex-modal-product-name">{modalProduct.name}</div>
                <div className="apex-modal-product-price" style={{ color: 'var(--red)' }}>
                  Drop 002 // Limited Allocation
                </div>
              </div>
            </div>

            <div className="apex-modal-form">
              {wlConfirmed ? (
                <>
                  <div className="apex-perk-box" style={{ margin: '0 0 1.5rem' }}>
                    <div className="apex-perk-eyebrow">Priority Confirmed</div>
                    <span className="apex-perk-code-display">APEX10</span>
                    <p className="apex-perk-msg">
                      You're on the private queue. 10% launch privilege reserved for your order.
                    </p>
                  </div>
                  <button type="button" className="apex-modal-submit" onClick={closeModal}>
                    Return to Capsule
                  </button>
                </>
              ) : (
                <form onSubmit={handleProductWaitlist}>
                  <div className="apex-modal-form-section">Reserve Allocation</div>

                  {modalProduct.sizes && modalProduct.sizes.length > 0 && (
                    <div className="apex-field">
                      <label>Selected Size</label>
                      <div className="apex-modal-sizes">
                        {modalProduct.sizes.map(s => (
                          <button
                            key={s}
                            type="button"
                            className={`apex-modal-size ${wlSize === s ? 'active' : ''}`}
                            onClick={() => setWlSize(s)}
                          >
                            {s}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  <div className="apex-field" style={{ marginTop: modalProduct.sizes?.length ? '1rem' : 0 }}>
                    <label>Email Address</label>
                    <input
                      type="email"
                      required
                      placeholder="Enter your email"
                      value={wlEmail}
                      onChange={e => setWlEmail(e.target.value)}
                    />
                  </div>

                  <button type="submit" className="apex-modal-submit" disabled={wlLoading}>
                    {wlLoading ? 'Securing Allocation...' : 'Secure Private Access →'}
                  </button>
                </form>
              )}
            </div>
          </div>
        </div>
      )}

    </div>
  );
}