import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useCart, useUserCurrency, formatPrice } from '../context/CartContext';
import { countries } from '../utils/countries';
import { db } from '../firebase';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import heroGothicRoseMaleImg from '../../assets/01_gothic_rose_male_front.jpg';
import heroGothicRoseBackImg from '../../assets/02_gothic_rose_male_back.jpg';
import heroImperialDragonFemaleImg from '../../assets/04_imperial_dragon_female_front.jpg';
import heroOriginsSneakerImg from '../../assets/06_the_arc_originals_sneaker.jpg';
import './ApexStorefront.css';

// Safely resolve Shopify CDN asset from Liquid window.APEX_ASSETS or live CDN fallback
const getShopifyAsset = (key, fallback) => {
  if (typeof window !== 'undefined' && window.APEX_ASSETS && window.APEX_ASSETS[key]) {
    return window.APEX_ASSETS[key];
  }
  return fallback;
};

function stripGsm(text) {
  if (!text || typeof text !== 'string') return text;
  return text
    .replace(/\b\d+\s*GSM\b/gi, '')
    .replace(/\(\s*\)/g, '')
    .replace(/\s{2,}/g, ' ')
    .trim();
}

function formatCardTitle(name) {
  if (!name || typeof name !== 'string') return '';
  const match = name.match(/"([^"]+)"/);
  if (match && match[1]) {
    return match[1].trim();
  }
  return stripGsm(name)
    .replace(/^APEX\s*/i, '')
    .replace(/\bHAUTE COUTURE BOMBER JACKET\b/gi, '')
    .replace(/\((MEN'S|WOMEN'S|UNISEX)\)/gi, '')
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

/* ── Curated Architectural Sections for Drop 001 (OWR Style: 1 Clean Banner Above Each Section) ── */
const SECTION_DEFS = [
  {
    key: 'tshirts',
    title: 'Heavyweight Streetwear T-Shirts',
    eyebrow: 'Section 01 // Drop 001 • Limited Run',
    categoryFilter: 'T-SHIRTS',
    banner: {
      pill: 'HEAVYWEIGHT APPAREL // 280 GSM',
      title: 'Avant-Garde Oversized Streetwear Tees',
      desc: '280 GSM combed cotton jersey with high-density archival prints and relaxed drop-shoulder drape.',
      btnText: 'Explore T-Shirts →',
      targetCategory: 'T-SHIRTS',
      image: 'https://cdn.shopify.com/s/files/1/0996/5194/4767/files/00_Duo_Hero_Front_Back.jpg?v=1791993388'
    }
  },
  {
    key: 'outerwear',
    title: 'Haute Couture Bomber Jackets',
    eyebrow: 'Section 02 // Drop 001 • 50 Pieces Worldwide',
    categoryFilter: 'OUTERWEAR',
    banner: {
      pill: 'HAUTE COUTURE // 50 PIECES WORLDWIDE',
      title: 'Hand-Tailored Bomber Division',
      desc: 'Individually numbered editions with heavyweight silk interior lining, dual-needle architectural seams, and metallic embroidery.',
      btnText: 'Explore Outerwear →',
      targetCategory: 'OUTERWEAR',
      assetKey: 'heroGothicRoseBack',
      fallbackImage: 'https://cdn.shopify.com/s/files/1/0996/5194/4767/files/01_Gothic_Blood_Rose_Editorial_Model_Mockup.jpg?v=1790055421'
    }
  },
  {
    key: 'footwear',
    title: 'Hand-Lasted Craft Footwear',
    eyebrow: 'Section 03 // Drop 001 • 20 Pairs Worldwide',
    categoryFilter: 'FOOTWEAR',
    banner: {
      pill: 'LIMITED EDITION // 20 PAIRS ONLY',
      title: 'The Origins Vulcanized High-Top',
      desc: 'Hand-lasted 16oz duck canvas, dual-density memory foam footbed, and architectural vulcanized rubber outsoles.',
      btnText: 'Explore Footwear →',
      targetCategory: 'FOOTWEAR',
      assetKey: 'heroOriginsSneaker',
      fallbackImage: 'https://cdn.shopify.com/s/files/1/0996/5194/4767/files/16340475902737369818_2048.jpg?v=1788675203'
    }
  },
  {
    key: 'accessories',
    title: 'Headwear & Objects // Accessories',
    eyebrow: 'Section 04 // Drop 001 • Limited Allocation',
    categoryFilter: 'ACCESSORIES',
    banner: {
      pill: 'ARCHIVAL OBJECTS // LIMITED ALLOCATION',
      title: 'Headwear & Objects // Accessories',
      desc: 'Structured 6-panel architectural baseball caps with custom engraved hardware and tonal embroidery.',
      btnText: 'Shop Accessories →',
      targetCategory: 'ACCESSORIES',
      image: 'https://cdn.shopify.com/s/files/1/0996/5194/4767/files/Front_1_c_2_a61d98f4-85c0-4118-8013-2babd2b8e272.jpg?v=1791365773'
    }
  },
  {
    key: 'shorts',
    title: 'Architectural Modular Shorts',
    eyebrow: 'Section 05 // Drop 001 • Limited Run',
    categoryFilter: 'SHORTS',
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

/* ── Interactive Multi-Image Product Card (OWR Carousel Style) ── */
function ApexProductCard({
  item,
  currency,
  activeColor,
  activeImage,
}) {
  const navigate = useNavigate();
  const images = React.useMemo(() => {
    const list = [];
    if (activeImage) list.push(activeImage);
    if (item.images && item.images.length > 0) {
      item.images.forEach(img => {
        const src = typeof img === 'string' ? img : img.src;
        if (src && !list.includes(src)) {
          list.push(src);
        }
      });
    }
    return list.length > 0 ? list : [item.image];
  }, [activeImage, item.images, item.image]);

  const [currentIdx, setCurrentIdx] = React.useState(0);
  const touchStartX = React.useRef(null);
  const touchStartY = React.useRef(null);

  // Reset to index 0 whenever selected color changes
  React.useEffect(() => {
    setCurrentIdx(0);
  }, [activeColor]);

  const handlePrev = (e) => {
    e.stopPropagation();
    setCurrentIdx(prev => (prev === 0 ? images.length - 1 : prev - 1));
  };

  const handleNext = (e) => {
    e.stopPropagation();
    setCurrentIdx(prev => (prev === images.length - 1 ? 0 : prev + 1));
  };

  const handleTouchStart = (e) => {
    touchStartX.current = e.touches[0].clientX;
    touchStartY.current = e.touches[0].clientY;
  };

  const handleTouchEnd = (e) => {
    if (touchStartX.current === null || touchStartY.current === null) return;
    const diffX = touchStartX.current - e.changedTouches[0].clientX;
    const diffY = touchStartY.current - e.changedTouches[0].clientY;
    if (Math.abs(diffX) > Math.abs(diffY) && Math.abs(diffX) > 35) {
      if (diffX > 0) {
        handleNext(e);
      } else {
        handlePrev(e);
      }
    }
    touchStartX.current = null;
    touchStartY.current = null;
  };

  const handleCardClick = () => {
    const productHandle = item.handle || item.id;
    if (typeof window !== 'undefined' && window.location.hostname.includes('myshopify.com')) {
      window.location.href = `/products/${productHandle}`;
    } else {
      navigate(`/products/${productHandle}`);
    }
  };

  const displayedImage = images[currentIdx] || activeImage || item.image;

  return (
    <div 
      className="apex-garment-card" 
      onClick={handleCardClick}
    >
      {/* Media Wrapper with Multi-Image Swipe Carousel (OWR style) */}
      <div 
        className="apex-garment-card-media"
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
      >
        <img 
          src={displayedImage} 
          alt={`${item.name} view ${currentIdx + 1}`} 
          className="apex-garment-img-primary" 
          loading="lazy" 
        />

        {/* Carousel Prev/Next Buttons (hover on desktop, accessible on mobile) */}
        {images.length > 1 && (
          <>
            <button 
              type="button" 
              className="apex-card-carousel-arrow prev"
              onClick={handlePrev}
              aria-label="Previous image"
              title="Previous image"
            >
              &#8249;
            </button>
            <button 
              type="button" 
              className="apex-card-carousel-arrow next"
              onClick={handleNext}
              aria-label="Next image"
              title="Next image"
            >
              &#8250;
            </button>
          </>
        )}

        {/* Carousel Pagination Indicator Dots (OWR Minimalist) */}
        {images.length > 1 && (
          <div className="apex-card-carousel-dots" aria-hidden="true">
            {images.slice(0, 6).map((_, idx) => (
              <span 
                key={idx}
                className={`apex-card-carousel-dot ${currentIdx === idx ? 'active' : ''}`}
                onClick={(e) => {
                  e.stopPropagation();
                  setCurrentIdx(idx);
                }}
              />
            ))}
          </div>
        )}
      </div>

      {/* Card Body (OWR Minimalist Stack) */}
      <div className="apex-garment-card-body">
        <h3 
          className="apex-garment-card-title" 
          title={item.name}
          onClick={handleCardClick}
        >
          {formatCardTitle(item.name) || stripGsm(item.name)}
        </h3>
        <div className="apex-garment-card-price">{formatPrice(item, currency)}</div>
      </div>
    </div>
  );
}

/* ── Top Hero Streetwear Campaign (OWR Style: 1-2 Clean Slides Only) ── */
const HERO_SLIDES = [
  {
    id: 'hero-01',
    eyebrow: 'COLLECTION 001 // ARCHIVE',
    title: 'APEX',
    subtitle: 'BY THE ARC',
    tagline: "Wear what others can't. Limited to 50 pieces per edition. Zero restocks.",
    ctaText: 'Explore Collection ↓',
    categoryTarget: 'ALL',
    desktopImg: getShopifyAsset('heroGothicRoseMale', 'https://cdn.shopify.com/s/files/1/0996/5194/4767/files/01_Gothic_Blood_Rose_Editorial_Model_Mockup.jpg?v=1790055421'),
    mobileImg: getShopifyAsset('heroGothicRoseMale', 'https://cdn.shopify.com/s/files/1/0996/5194/4767/files/01_Gothic_Blood_Rose_Editorial_Model_Mockup.jpg?v=1790055421'),
    alt: 'APEX Gothic Blood Rose Haute Couture Bomber Jacket'
  },
  {
    id: 'hero-02',
    eyebrow: 'HAUTE COUTURE // 50 PIECES WORLDWIDE',
    title: 'BOMBERS',
    subtitle: 'KINETIC ARCHITECTURE',
    tagline: 'Hand-tailored silk lining, high-density gold bullion embroidery, and monolithic drape.',
    ctaText: 'Shop Outerwear →',
    categoryTarget: 'OUTERWEAR',
    desktopImg: getShopifyAsset('heroImperialDragonFemale', 'https://cdn.shopify.com/s/files/1/0996/5194/4767/files/02_Sukajan_Gold_Dragon_Casablanca_Female_Model_Mockup.jpg?v=1791130251'),
    mobileImg: getShopifyAsset('heroImperialDragonFemale', 'https://cdn.shopify.com/s/files/1/0996/5194/4767/files/02_Sukajan_Gold_Dragon_Casablanca_Female_Model_Mockup.jpg?v=1791130251'),
    alt: 'APEX Imperial Gold Dragon Sukajan Bomber Jacket'
  }
];

export default function ApexStorefront() {
  const { products, loadingProducts, addItem, totalItems, setCartOpen } = useCart();
  const currency = useUserCurrency();

  // Active Category Filter for Streetwear House (Apparel default)
  const [activeCategory, setActiveCategory] = useState('ALL');

  // Active Gender Filter ('ALL' | 'MENS' | 'WOMENS')
  const [activeGender, setActiveGender] = useState('ALL');

  // Header scroll detection (header stays permanently sticky while scrolling)
  const [scrolled, setScrolled] = useState(false);

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
      setScrolled(window.scrollY > 20);
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Multi-slide Hero Campaign Slider state & controls
  const [heroSlideIdx, setHeroSlideIdx] = useState(0);
  const [heroPaused, setHeroPaused] = useState(false);
  const heroTouchStartX = useRef(0);
  const heroTouchEndX = useRef(0);

  useEffect(() => {
    if (heroPaused) return;
    const timer = setInterval(() => {
      setHeroSlideIdx(prev => (prev + 1) % HERO_SLIDES.length);
    }, 5500);
    return () => clearInterval(timer);
  }, [heroPaused]);

  const nextHeroSlide = () => {
    setHeroSlideIdx(prev => (prev + 1) % HERO_SLIDES.length);
  };

  const prevHeroSlide = () => {
    setHeroSlideIdx(prev => (prev - 1 + HERO_SLIDES.length) % HERO_SLIDES.length);
  };

  const handleHeroTouchStart = (e) => {
    if (e.targetTouches && e.targetTouches.length > 0) {
      heroTouchStartX.current = e.targetTouches[0].clientX;
      heroTouchEndX.current = e.targetTouches[0].clientX;
    }
  };

  const handleHeroTouchMove = (e) => {
    if (e.targetTouches && e.targetTouches.length > 0) {
      heroTouchEndX.current = e.targetTouches[0].clientX;
    }
  };

  const handleHeroTouchEnd = () => {
    const diff = heroTouchStartX.current - heroTouchEndX.current;
    if (diff > 45) {
      nextHeroSlide();
    } else if (diff < -45) {
      prevHeroSlide();
    }
  };

  // State per product: { [productId]: { color, size } }
  const [selectedSizes, setSelectedSizes] = useState({});
  const [selectedColors, setSelectedColors] = useState({});

  // Active Lookbook Card for modal inspection
  const [activeLookbook, setActiveLookbook] = useState(null);

  // Dedicated Size Guide Modal state
  const [sizeGuideProduct, setSizeGuideProduct] = useState(null);
  const [sizeUnit, setSizeUnit] = useState('IN'); // 'IN' | 'CM'

  // Mobile Navigation Drawer & Grid View State
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [mobileGridCols, setMobileGridCols] = useState(2); // 2-column default for mobile

  // Wishlist state (persisted to localStorage)
  const [wishlist, setWishlist] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem('apex_wishlist') || '[]');
    } catch {
      return [];
    }
  });

  const toggleWishlist = (id) => {
    setWishlist(prev => {
      const next = prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id];
      try {
        localStorage.setItem('apex_wishlist', JSON.stringify(next));
      } catch {}
      return next;
    });
  };

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

  // Dynamic Category Extraction: Outerwear prioritized first, followed by Footwear, T-Shirts, Shorts
  const dynamicCategories = React.useMemo(() => {
    const map = {};
    genderFilteredProducts.forEach(p => {
      const cat = p.category || 'Apparel';
      map[cat] = (map[cat] || 0) + 1;
    });
    const priority = ['T-Shirts', 'Outerwear', 'Footwear', 'Accessories', 'Shorts', 'Tops'];
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
  const filteredProducts = React.useMemo(() => {
    if (activeCategory === 'ALL') return genderFilteredProducts;
    return genderFilteredProducts.filter(p => {
      if (!p.category) return false;
      const catUpper = p.category.toUpperCase();
      if (activeCategory === 'T-SHIRTS' || activeCategory === 'TSHIRTS' || activeCategory === 'TOPS') {
        return catUpper === 'T-SHIRTS' || catUpper === 'TOPS' || (p.handle && /tee|t-shirt/i.test(p.handle)) || (p.name && /t-shirt|tee\b/i.test(p.name));
      }
      if (activeCategory === 'ACCESSORIES') {
        return catUpper === 'ACCESSORIES' || p.sectionKey === 'accessories' || (p.name && /cap|hat|accessory/i.test(p.name)) || (p.handle && /cap|hat/i.test(p.handle));
      }
      return catUpper === activeCategory;
    });
  }, [genderFilteredProducts, activeCategory]);

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

  const handleNavCategory = (cat) => {
    setActiveCategory(cat);
    setMobileMenuOpen(false);
    const el = document.getElementById('wardrobe');
    if (el) {
      el.scrollIntoView({ behavior: 'smooth' });
    }
  };

  const handleNavEditorial = (id) => {
    setActiveCategory('ALL');
    setMobileMenuOpen(false);
    setTimeout(() => {
      const el = document.getElementById(id);
      if (el) {
        el.scrollIntoView({ behavior: 'smooth' });
      }
    }, 50);
  };

  const renderProductCard = (item) => {
    const currentColor = getProductColor(item);
    const activeImage = getProductImage(item, currentColor);

    return (
      <ApexProductCard
        key={item.id}
        item={item}
        currency={currency}
        wishlist={wishlist}
        toggleWishlist={toggleWishlist}
        openProductDetail={openProductDetail}
        activeColor={currentColor}
        activeImage={activeImage}
      />
    );
  };

  return (
    <div className="apex-light">

      {/* ── TOP ANNOUNCEMENT BAR ── */}
      <div className="apex-top-bar">
        <div className="apex-top-bar-marquee-wrapper">
          <div className="apex-top-bar-marquee-track">
            <span>WEAR WHAT OTHERS CAN'T • 50 PIECES WORLDWIDE // ZERO RESTOCKS • 20 PAIRS PER FOOTWEAR EDITION • PAN-INDIA PRIORITY EXPRESS DISPATCH • COMPLIMENTARY PRESENTATION PACKAGING •&nbsp;</span>
            <span aria-hidden="true">WEAR WHAT OTHERS CAN'T • 50 PIECES WORLDWIDE // ZERO RESTOCKS • 20 PAIRS PER FOOTWEAR EDITION • PAN-INDIA PRIORITY EXPRESS DISPATCH • COMPLIMENTARY PRESENTATION PACKAGING •&nbsp;</span>
          </div>
        </div>
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

      {/* ── HEADER (PERMANENTLY STICKY) ── */}
      <header className={`apex-header ${scrolled ? 'scrolled' : ''}`}>
        <div className="apex-header-left-group">
          {/* Mobile Navigation Toggle Button (Left-Aligned) */}
          <button
            type="button"
            className={`apex-mobile-nav-btn ${mobileMenuOpen ? 'active' : ''}`}
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            aria-label="Toggle navigation menu"
          >
            <span className="apex-hamburger-line"></span>
            <span className="apex-hamburger-line"></span>
            <span className="apex-hamburger-line"></span>
          </button>

          <a href="#hero" className="apex-logo">
            <ApexLogoMark />
            <div className="apex-logo-text">
              <span className="apex-logo-name">Apex</span>
              <div className="apex-logo-rule" />
              <span className="apex-logo-sub">By The ARC</span>
            </div>
          </a>

          <nav className="apex-header-nav-wrap">
            <ul className="apex-header-nav">
              <li>
                <button
                  type="button"
                  className={`apex-nav-link-btn ${activeCategory === 'ALL' ? 'active' : ''}`}
                  onClick={() => handleNavCategory('ALL')}
                >
                  Collection
                </button>
              </li>
              <li>
                <button
                  type="button"
                  className={`apex-nav-link-btn ${activeCategory === 'T-SHIRTS' ? 'active' : ''}`}
                  onClick={() => handleNavCategory('T-SHIRTS')}
                >
                  T-Shirts
                </button>
              </li>
              <li>
                <button
                  type="button"
                  className={`apex-nav-link-btn ${activeCategory === 'OUTERWEAR' ? 'active' : ''}`}
                  onClick={() => handleNavCategory('OUTERWEAR')}
                >
                  Outerwear
                </button>
              </li>
              <li>
                <button
                  type="button"
                  className={`apex-nav-link-btn ${activeCategory === 'SHORTS' ? 'active' : ''}`}
                  onClick={() => handleNavCategory('SHORTS')}
                >
                  Bottomwear
                </button>
              </li>
              <li>
                <button
                  type="button"
                  className={`apex-nav-link-btn ${activeCategory === 'FOOTWEAR' ? 'active' : ''}`}
                  onClick={() => handleNavCategory('FOOTWEAR')}
                >
                  Footwear
                </button>
              </li>
              <li>
                <button
                  type="button"
                  className={`apex-nav-link-btn ${activeCategory === 'ACCESSORIES' ? 'active' : ''}`}
                  onClick={() => handleNavCategory('ACCESSORIES')}
                >
                  Accessories
                </button>
              </li>
            </ul>

            {/* Audience Filter under Navigation */}
            <div className="apex-nav-audience-filter" title="Filter by audience">
              <button
                type="button"
                className={`apex-nav-filter-btn ${activeGender === 'ALL' ? 'active' : ''}`}
                onClick={() => {
                  setActiveGender('ALL');
                  document.getElementById('wardrobe')?.scrollIntoView({ behavior: 'smooth' });
                }}
              >
                All
              </button>
              <button
                type="button"
                className={`apex-nav-filter-btn ${activeGender === 'MENS' ? 'active' : ''}`}
                onClick={() => {
                  setActiveGender('MENS');
                  document.getElementById('wardrobe')?.scrollIntoView({ behavior: 'smooth' });
                }}
              >
                Men
              </button>
              <button
                type="button"
                className={`apex-nav-filter-btn ${activeGender === 'WOMENS' ? 'active' : ''}`}
                onClick={() => {
                  setActiveGender('WOMENS');
                  document.getElementById('wardrobe')?.scrollIntoView({ behavior: 'smooth' });
                }}
              >
                Women
              </button>
            </div>
          </nav>
        </div>

        {/* Top Right Options Cleanly Grouped */}
        <div className="apex-header-right">
          <button
            type="button"
            className="apex-nav-objects-btn desktop-only"
            onClick={() => setDrawerOpen(true)}
          >
            Objects ({objectsCount})
          </button>
          <a 
            href="https://thearc-rev.online" 
            target="_blank" 
            rel="noopener noreferrer" 
            className="apex-nav-universe-pill desktop-only"
            title="Explore The ARC Universe"
          >
            The ARC Universe ↗
          </a>
          <span className="apex-curr-pill">{currency}</span>
          <button className="apex-cart-trigger" onClick={() => setCartOpen(true)}>
            Bag {totalItems > 0 && <span className="apex-cart-pip">{totalItems}</span>}
          </button>
        </div>
      </header>

      {/* ── MOBILE SLIDE-OUT NAVIGATION DRAWER ── */}
      <div 
        className={`apex-mobile-drawer-bg ${mobileMenuOpen ? 'open' : ''}`} 
        onClick={() => setMobileMenuOpen(false)}
      >
        <div className="apex-mobile-drawer-sheet" onClick={e => e.stopPropagation()}>
          <div className="apex-mobile-drawer-head">
            <div className="apex-logo">
              <ApexLogoMark />
              <div className="apex-logo-text">
                <span className="apex-logo-name">Apex</span>
                <div className="apex-logo-rule" />
                <span className="apex-logo-sub">By The ARC</span>
              </div>
            </div>
            <button 
              type="button" 
              className="apex-modal-x" 
              onClick={() => setMobileMenuOpen(false)}
              aria-label="Close menu"
            >
              ×
            </button>
          </div>

          <div className="apex-mobile-drawer-body">
            <div className="apex-mobile-drawer-sec-label">Navigation</div>
            <ul className="apex-mobile-drawer-links">
              <li>
                <button
                  type="button"
                  className={`apex-mobile-nav-cat-btn ${activeCategory === 'ALL' ? 'active' : ''}`}
                  onClick={() => handleNavCategory('ALL')}
                >
                  All Collection <span className="apex-mobile-link-badge">({streetwearProducts.length})</span>
                </button>
              </li>
              <li>
                <button
                  type="button"
                  className={`apex-mobile-nav-cat-btn ${activeCategory === 'T-SHIRTS' ? 'active' : ''}`}
                  onClick={() => handleNavCategory('T-SHIRTS')}
                >
                  T-Shirts
                </button>
              </li>
              <li>
                <button
                  type="button"
                  className={`apex-mobile-nav-cat-btn ${activeCategory === 'OUTERWEAR' ? 'active' : ''}`}
                  onClick={() => handleNavCategory('OUTERWEAR')}
                >
                  Outerwear
                </button>
              </li>
              <li>
                <button
                  type="button"
                  className={`apex-mobile-nav-cat-btn ${activeCategory === 'SHORTS' ? 'active' : ''}`}
                  onClick={() => handleNavCategory('SHORTS')}
                >
                  Bottomwear
                </button>
              </li>
              <li>
                <button
                  type="button"
                  className={`apex-mobile-nav-cat-btn ${activeCategory === 'FOOTWEAR' ? 'active' : ''}`}
                  onClick={() => handleNavCategory('FOOTWEAR')}
                >
                  Footwear
                </button>
              </li>
              <li>
                <button
                  type="button"
                  className={`apex-mobile-nav-cat-btn ${activeCategory === 'ACCESSORIES' ? 'active' : ''}`}
                  onClick={() => handleNavCategory('ACCESSORIES')}
                >
                  Accessories
                </button>
              </li>
              <li>
                <button
                  type="button"
                  className="apex-mobile-nav-cat-btn"
                  onClick={() => handleNavEditorial('lookbook')}
                >
                  Editorial Lookbook
                </button>
              </li>
              <li>
                <button
                  type="button"
                  className="apex-mobile-nav-cat-btn"
                  onClick={() => handleNavEditorial('manifesto')}
                >
                  The Manifesto
                </button>
              </li>
              <li>
                <button
                  type="button"
                  className="apex-mobile-drawer-obj-btn"
                  onClick={() => {
                    setMobileMenuOpen(false);
                    setDrawerOpen(true);
                  }}
                >
                  Objects &amp; Stationery ({objectsCount}) →
                </button>
              </li>
              <li>
                <a 
                  href="https://thearc-rev.online" 
                  target="_blank" 
                  rel="noopener noreferrer" 
                  className="apex-mobile-universe-link"
                >
                  The ARC Universe ↗
                </a>
              </li>
            </ul>

            <div className="apex-mobile-drawer-divider" />

            <div className="apex-mobile-drawer-sec-label">Audience Filter</div>
            <div className="apex-mobile-drawer-filter-chips">
              <button
                type="button"
                className={`apex-mobile-filter-chip ${activeGender === 'ALL' ? 'active' : ''}`}
                onClick={() => {
                  setActiveGender('ALL');
                  setMobileMenuOpen(false);
                }}
              >
                All Pieces ({streetwearProducts.length})
              </button>
              <button
                type="button"
                className={`apex-mobile-filter-chip ${activeGender === 'MENS' ? 'active' : ''}`}
                onClick={() => {
                  setActiveGender('MENS');
                  setMobileMenuOpen(false);
                }}
              >
                Men's ({mensCount})
              </button>
              <button
                type="button"
                className={`apex-mobile-filter-chip ${activeGender === 'WOMENS' ? 'active' : ''}`}
                onClick={() => {
                  setActiveGender('WOMENS');
                  setMobileMenuOpen(false);
                }}
              >
                Women's ({womensCount})
              </button>
            </div>

            <div className="apex-mobile-drawer-divider" />

            <a 
              href="https://thearc-rev.online" 
              target="_blank" 
              rel="noopener noreferrer" 
              className="apex-mobile-universe-banner"
            >
              <span>✦ Explore The ARC Universe</span>
              <span className="apex-mobile-arr">↗</span>
            </a>
          </div>
        </div>
      </div>

      {/* ── LUXURY STREETWEAR CAMPAIGN HERO SLIDER ── */}
      <section 
        className="apex-streetwear-hero" 
        id="hero"
        onMouseEnter={() => setHeroPaused(true)}
        onMouseLeave={() => setHeroPaused(false)}
        onTouchStart={handleHeroTouchStart}
        onTouchMove={handleHeroTouchMove}
        onTouchEnd={handleHeroTouchEnd}
      >
        <div className="apex-hero-slider-container" aria-hidden="true">
          {HERO_SLIDES.map((slide, idx) => (
            <div 
              key={slide.id}
              className={`apex-hero-slide ${idx === heroSlideIdx ? 'active' : ''}`}
            >
              <picture>
                <source media="(max-width: 768px)" srcSet={slide.mobileImg} />
                <img 
                  src={slide.desktopImg} 
                  alt={slide.alt} 
                  className="apex-hero-backdrop-img"
                />
              </picture>
              <div className="apex-hero-backdrop-overlay" />
              <div className="apex-hero-backdrop-glow" />
            </div>
          ))}
        </div>
        <div className="apex-hero-grid-lines" />

        {/* Slide Content */}
        <div className="apex-hero-content-editorial" key={HERO_SLIDES[heroSlideIdx].id}>
          <div className="apex-hero-season-pill">
            <span className="apex-hero-live-dot" />
            <span>{HERO_SLIDES[heroSlideIdx].eyebrow}</span>
          </div>

          <h1 className="apex-hero-title-monolithic">
            {HERO_SLIDES[heroSlideIdx].title}
            <span className="apex-hero-sub-title">{HERO_SLIDES[heroSlideIdx].subtitle}</span>
          </h1>

          <p className="apex-hero-editorial-tagline">
            {HERO_SLIDES[heroSlideIdx].tagline}
          </p>

          <div className="apex-hero-cta-group">
            <button 
              type="button"
              onClick={() => {
                const targetCat = HERO_SLIDES[heroSlideIdx].categoryTarget;
                if (targetCat) setActiveCategory(targetCat);
                document.getElementById('wardrobe')?.scrollIntoView({ behavior: 'smooth' });
              }}
              className="apex-hero-btn-primary"
            >
              {HERO_SLIDES[heroSlideIdx].ctaText}
            </button>
          </div>
        </div>

        {/* Slider Navigation Controls */}
        <button 
          type="button" 
          className="apex-hero-slider-arrow prev" 
          onClick={prevHeroSlide}
          aria-label="Previous slide"
        >
          ‹
        </button>
        <button 
          type="button" 
          className="apex-hero-slider-arrow next" 
          onClick={nextHeroSlide}
          aria-label="Next slide"
        >
          ›
        </button>

        <div className="apex-hero-slider-dots">
          {HERO_SLIDES.map((slide, idx) => (
            <button
              key={slide.id}
              type="button"
              className={`apex-hero-slider-dot ${idx === heroSlideIdx ? 'active' : ''}`}
              onClick={() => setHeroSlideIdx(idx)}
              aria-label={`Go to slide ${idx + 1}`}
            />
          ))}
        </div>
      </section>

      {/* ── WARDROBE CATALOGUE & MINIMAL CATEGORY FILTER ── */}
      <section className="apex-section" id="wardrobe">
        {/* Minimal Luxury Filter Bar (OWR Aesthetic) */}
        <div className="apex-minimal-filter-bar">
          <div className="apex-minimal-cat-tabs">
            <button
              type="button"
              className={`apex-minimal-tab ${activeCategory === 'ALL' ? 'active' : ''}`}
              onClick={() => setActiveCategory('ALL')}
            >
              All
            </button>
            <button
              type="button"
              className={`apex-minimal-tab ${activeCategory === 'T-SHIRTS' || activeCategory === 'TSHIRTS' ? 'active' : ''}`}
              onClick={() => setActiveCategory('T-SHIRTS')}
            >
              T-Shirts
            </button>
            <button
              type="button"
              className={`apex-minimal-tab ${activeCategory === 'OUTERWEAR' ? 'active' : ''}`}
              onClick={() => setActiveCategory('OUTERWEAR')}
            >
              Outerwear
            </button>
            <button
              type="button"
              className={`apex-minimal-tab ${activeCategory === 'FOOTWEAR' ? 'active' : ''}`}
              onClick={() => setActiveCategory('FOOTWEAR')}
            >
              Footwear
            </button>
            <button
              type="button"
              className={`apex-minimal-tab ${activeCategory === 'ACCESSORIES' ? 'active' : ''}`}
              onClick={() => setActiveCategory('ACCESSORIES')}
            >
              Accessories
            </button>
            <button
              type="button"
              className={`apex-minimal-tab ${activeCategory === 'SHORTS' ? 'active' : ''}`}
              onClick={() => setActiveCategory('SHORTS')}
            >
              Bottomwear
            </button>
          </div>
        </div>

        {/* Product Catalogue Display: Curated Sections when ALL, or Unified Grid when Category Selected */}
        {activeCategory === 'ALL' ? (
          <div className="apex-catalogue-sections-wrap">
            {SECTION_DEFS.map(sec => {
              const secProds = filteredProducts.filter(p => {
                if (sec.key === 'tshirts') {
                  return (
                    p.sectionKey === 'tshirts' ||
                    p.category === 'T-Shirts' ||
                    p.category === 'Tops' ||
                    (p.name && /t-shirt|tee\b/i.test(p.name)) ||
                    (p.handle && /tee|t-shirt/i.test(p.handle))
                  );
                }
                if (sec.key === 'outerwear') {
                  return (
                    p.sectionKey === 'couture' ||
                    p.sectionKey === 'outerwear' ||
                    p.sectionKey === 'collegiate' ||
                    p.category === 'Outerwear' ||
                    p.category === 'Jackets' ||
                    (p.name && /jacket|bomber|outerwear/i.test(p.name)) ||
                    (p.handle && /jacket|bomber|outerwear/i.test(p.handle))
                  );
                }
                if (sec.key === 'footwear') {
                  return (
                    p.sectionKey === 'footwear' ||
                    p.category === 'Footwear' ||
                    p.category === 'Shoes' ||
                    (p.name && /sneaker|shoe|boot|high top|low top/i.test(p.name)) ||
                    (p.handle && /sneaker|shoe|high-top|low-top/i.test(p.handle))
                  );
                }
                if (sec.key === 'accessories') {
                  return (
                    p.sectionKey === 'accessories' ||
                    p.category === 'Accessories' ||
                    (p.name && /cap|hat|accessory/i.test(p.name)) ||
                    (p.handle && /cap|hat/i.test(p.handle))
                  );
                }
                if (sec.key === 'shorts') {
                  return (
                    (p.sectionKey === 'shorts' || p.category === 'Shorts' || (p.name && /short/i.test(p.name)) || (p.handle && /short/i.test(p.handle))) &&
                    !/tee|t-shirt/i.test(p.name || '') &&
                    !/tee|t-shirt/i.test(p.handle || '')
                  );
                }
                return p.sectionKey === sec.key;
              });
              if (secProds.length === 0) return null;
              return (
                <React.Fragment key={sec.key}>
                  {/* Category Showcase Banner immediately BEFORE section products (OWR Style) */}
                  {sec.banner && (
                    <div className="apex-inter-section-showcase">
                      <div 
                        className="apex-inter-showcase-bg" 
                        style={{ 
                          backgroundImage: `url(${sec.banner.assetKey ? getShopifyAsset(sec.banner.assetKey, sec.banner.fallbackImage) : sec.banner.image})` 
                        }}
                      >
                        <div className="apex-inter-showcase-overlay" />
                        <div className="apex-inter-showcase-content">
                          <span className="apex-inter-showcase-pill">{sec.banner.pill}</span>
                          <h3 className="apex-inter-showcase-title">{sec.banner.title}</h3>
                          <p className="apex-inter-showcase-desc">{sec.banner.desc}</p>
                          <button
                            type="button"
                            className="apex-inter-showcase-btn"
                            onClick={() => {
                              setActiveCategory(sec.banner.targetCategory);
                              document.getElementById('wardrobe')?.scrollIntoView({ behavior: 'smooth' });
                            }}
                          >
                            {sec.banner.btnText}
                          </button>
                        </div>
                      </div>
                    </div>
                  )}

                  <div className="apex-catalogue-section" id={`section-${sec.key}`}>
                    {/* Clean Editorial Section Header (OWR Style) */}
                    <div className="apex-editorial-row-head">
                      <div className="apex-editorial-head-left">
                        <span className="apex-editorial-tag">{sec.eyebrow}</span>
                        <h3 className="apex-editorial-title">{sec.title}</h3>
                      </div>
                      <button
                        type="button"
                        className="apex-editorial-filter-btn"
                        onClick={() => {
                          setActiveCategory(sec.categoryFilter);
                          document.getElementById('wardrobe')?.scrollIntoView({ behavior: 'smooth' });
                        }}
                      >
                        View All ({secProds.length}) &rarr;
                      </button>
                    </div>

                    <div className={`apex-streetwear-grid ${mobileGridCols === 2 ? 'mobile-2col' : 'mobile-1col'}`}>
                      {secProds.map(renderProductCard)}
                    </div>
                  </div>
                </React.Fragment>
              );
            })}
          </div>
        ) : (
          <div className={`apex-streetwear-grid ${mobileGridCols === 2 ? 'mobile-2col' : 'mobile-1col'}`}>
            {filteredProducts.length > 0 ? (
              filteredProducts.map(renderProductCard)
            ) : (
              <div className="apex-empty-cat-container">
                <div className="apex-empty-cat-mark">✦</div>
                <h3 className="apex-empty-cat-heading">
                  Drop 001 // {activeCategory === 'SHORTS' ? 'Bottomwear' : activeCategory}
                </h3>
                <p className="apex-empty-cat-message">
                  Modular architectural silhouettes are currently in pattern production. Limited allocation dropping soon.
                </p>
                <button
                  type="button"
                  className="apex-btn-editorial-return"
                  onClick={() => setActiveCategory('ALL')}
                >
                  ← Return to Complete Collection
                </button>
              </div>
            )}
          </div>
        )}
      </section>

      {/* ── EDITORIAL CONTENT (HOMEPAGE ONLY) ── */}
      {/* Category pages (e.g. Bottomwear/Shorts) strictly display only their products and end directly at the footer */}
      {activeCategory === 'ALL' && (
        <>
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

          {/* ── EDITORIAL CAMPAIGN RUNWAY LOOKBOOK (Homepage Only) ── */}
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

          {/* ── THE CRAFT & MATERIAL MANIFESTO (At the end before footer) ── */}
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
        </>
      )}

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

                <h2 className="apex-detail-title">{formatCardTitle(detailProduct.name) || stripGsm(detailProduct.name)}</h2>
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
        <div className="apex-modal-bg apex-size-guide-modal-bg" onClick={() => setSizeGuideProduct(null)}>
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
                Drop 001 garments are tailored to precision architectural specifications. Standard garment tolerance +/- 0.5 inches (1.2 cm).
              </p>

              {/* Units Switcher Toggle */}
              {sizeGuideProduct.category !== 'Footwear' && (
                <div className="apex-size-unit-toggle-wrap">
                  <span className="apex-size-unit-label">Units:</span>
                  <button
                    type="button"
                    className={`apex-size-unit-pill ${sizeUnit === 'IN' ? 'active' : ''}`}
                    onClick={() => setSizeUnit('IN')}
                  >
                    Inches (IN)
                  </button>
                  <button
                    type="button"
                    className={`apex-size-unit-pill ${sizeUnit === 'CM' ? 'active' : ''}`}
                    onClick={() => setSizeUnit('CM')}
                  >
                    Centimeters (CM)
                  </button>
                </div>
              )}
            </div>

            {/* If Outerwear / Bomber Jackets / Tops / Shorts */}
            {sizeGuideProduct.category !== 'Footwear' && (
              <div className="apex-size-guide-content">
                <div className="apex-size-table-wrap">
                  <table className="apex-size-table">
                    <thead>
                      <tr>
                        <th>SIZE</th>
                        <th>CHEST ({sizeUnit === 'IN' ? 'INCHES' : 'CM'})</th>
                        <th>LENGTH ({sizeUnit === 'IN' ? 'INCHES' : 'CM'})</th>
                        <th>RECOMMENDED SILHOUETTE</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr>
                        <td><strong>XS</strong></td>
                        <td>{sizeUnit === 'IN' ? '38"' : '96.5 cm'}</td>
                        <td>{sizeUnit === 'IN' ? '26"' : '66.0 cm'}</td>
                        <td>Tailored Unisex / Petite Drape</td>
                      </tr>
                      <tr>
                        <td><strong>S</strong></td>
                        <td>{sizeUnit === 'IN' ? '40"' : '101.6 cm'}</td>
                        <td>{sizeUnit === 'IN' ? '27"' : '68.6 cm'}</td>
                        <td>Clean Tailored Streetwear Fit</td>
                      </tr>
                      <tr>
                        <td><strong>M</strong></td>
                        <td>{sizeUnit === 'IN' ? '42"' : '106.7 cm'}</td>
                        <td>{sizeUnit === 'IN' ? '28"' : '71.1 cm'}</td>
                        <td>Standard Athletic Silhouette</td>
                      </tr>
                      <tr>
                        <td><strong>L</strong></td>
                        <td>{sizeUnit === 'IN' ? '44"' : '111.8 cm'}</td>
                        <td>{sizeUnit === 'IN' ? '29"' : '73.7 cm'}</td>
                        <td>Structured Regular Drape</td>
                      </tr>
                      <tr>
                        <td><strong>XL</strong></td>
                        <td>{sizeUnit === 'IN' ? '46"' : '116.8 cm'}</td>
                        <td>{sizeUnit === 'IN' ? '30"' : '76.2 cm'}</td>
                        <td>Relaxed Streetwear / Layered Drape</td>
                      </tr>
                      <tr>
                        <td><strong>2XL</strong></td>
                        <td>{sizeUnit === 'IN' ? '48"' : '121.9 cm'}</td>
                        <td>{sizeUnit === 'IN' ? '31"' : '78.7 cm'}</td>
                        <td>Effortless Oversized Fit</td>
                      </tr>
                      <tr>
                        <td><strong>3XL</strong></td>
                        <td>{sizeUnit === 'IN' ? '50"' : '127.0 cm'}</td>
                        <td>{sizeUnit === 'IN' ? '32"' : '81.3 cm'}</td>
                        <td>Generous Extended Drape</td>
                      </tr>
                      <tr>
                        <td><strong>4XL</strong></td>
                        <td>{sizeUnit === 'IN' ? '52"' : '132.1 cm'}</td>
                        <td>{sizeUnit === 'IN' ? '33"' : '83.8 cm'}</td>
                        <td>Relaxed Big &amp; Tall Silhouette</td>
                      </tr>
                      <tr>
                        <td><strong>5XL</strong></td>
                        <td>{sizeUnit === 'IN' ? '54"' : '137.2 cm'}</td>
                        <td>{sizeUnit === 'IN' ? '34"' : '86.4 cm'}</td>
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