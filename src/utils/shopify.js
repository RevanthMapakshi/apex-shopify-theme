// ── APEX by The ARC — Shopify Storefront API Client ──────────────────────────
export const SHOPIFY_STORE_DOMAIN = 'apexbythearc.myshopify.com';
export const SHOPIFY_STOREFRONT_TOKEN = '112503bfe5bae2777ed484396d4d05fd';
export const SHOPIFY_API_VERSION = '2024-01';

const GRAPHQL_ENDPOINT = `https://${SHOPIFY_STORE_DOMAIN}/api/${SHOPIFY_API_VERSION}/graphql.json`;

export function stripGsm(text) {
  if (!text || typeof text !== 'string') return text;
  return text
    .replace(/\b\d+\s*GSM\b/gi, '')
    .replace(/\(\s*\)/g, '')
    .replace(/\s{2,}/g, ' ')
    .trim();
}

export async function shopifyFetch(query, variables = {}) {
  const res = await fetch(GRAPHQL_ENDPOINT, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-Shopify-Storefront-Access-Token': SHOPIFY_STOREFRONT_TOKEN,
    },
    body: JSON.stringify({ query, variables }),
  });

  if (!res.ok) {
    throw new Error(`Shopify API error: ${res.status} ${res.statusText}`);
  }

  const json = await res.json();
  if (json.errors) {
    throw new Error(json.errors.map(e => e.message).join(', '));
  }
  return json.data;
}

export async function fetchShopifyProducts() {
  const query = `
    {
      products(first: 50) {
        edges {
          node {
            id
            title
            handle
            descriptionHtml
            tags
            productType
            priceRange {
              minVariantPrice {
                amount
                currencyCode
              }
            }
            images(first: 20) {
              edges {
                node {
                  url
                  altText
                }
              }
            }
            options {
              name
              values
            }
            variants(first: 50) {
              edges {
                node {
                  id
                  title
                  price {
                    amount
                    currencyCode
                  }
                  selectedOptions {
                    name
                    value
                  }
                  image {
                    url
                  }
                }
              }
            }
          }
        }
      }
    }
  `;

  const data = await shopifyFetch(query);
  if (!data?.products?.edges) return [];

  const unrankedProducts = data.products.edges.map(({ node: p }) => {
    const titleUpper = p.title.toUpperCase();
    const isSignature = titleUpper.includes('SIGNATURE');

    const pType = (p.productType || '').toUpperCase();
    const tagsUpper = (p.tags || []).map(t => (t || '').toUpperCase());

    const isFootwear = 
      pType.includes('SHOE') || 
      pType.includes('FOOTWEAR') || 
      pType.includes('SNEAKER') ||
      tagsUpper.includes('FOOTWEAR') ||
      tagsUpper.includes('SHOES') ||
      titleUpper.includes('SNEAKER') ||
      titleUpper.includes('HIGH TOP') ||
      titleUpper.includes('HIGH-TOP') ||
      titleUpper.includes('LOW TOP') ||
      titleUpper.includes('LOW-TOP') ||
      titleUpper.includes('SLIP-ON');

    const isStationery =
      pType.includes('STATIONERY') ||
      tagsUpper.includes('STATIONERY') ||
      titleUpper.includes('JOURNAL') ||
      titleUpper.includes('PLANNER') ||
      titleUpper.includes('NOTEBOOK') ||
      titleUpper.includes('TRACKER');

    const isDigital =
      pType.includes('DIGITAL') ||
      tagsUpper.includes('DIGITAL') ||
      titleUpper.includes('EBOOK') ||
      titleUpper.includes('SALARY TRAP');

    let category = 'Apparel';
    if (isFootwear) {
      category = 'Footwear';
    } else if (titleUpper.includes('JACKET') || titleUpper.includes('HOODIE') || pType.includes('OUTERWEAR')) {
      category = 'Outerwear';
    } else if (titleUpper.includes('SHORT')) {
      category = 'Shorts';
    } else if (titleUpper.includes('T-SHIRT') || titleUpper.includes('TEE') || titleUpper.includes('TOP') || pType.includes('SHIRT')) {
      category = 'Tops';
    } else if (isStationery) {
      category = 'Stationery';
    } else if (isDigital) {
      category = 'Digital';
    } else if (p.productType && p.productType.trim() !== '') {
      category = p.productType.trim();
    } else {
      category = 'Apparel';
    }

    const currencyCode = p.priceRange?.minVariantPrice?.currencyCode || 'INR';
    const rawAmount = parseFloat(p.priceRange?.minVariantPrice?.amount || '0');

    // ── Drop 001 Synced Pricing Map (Ensures Printify USD default values are mapped to authentic drop pricing) ──
    const LUXURY_PRICES_INR = {
      'red-liquid-marble-bomber-jacket': 849900,
      'swirling-amber-flame-bomber-jacket': 799900,
      'teal-wave-abstract-bomber-jacket': 799900,
      'black-bomber-jacket-classic-mens-aop-zip-up': 799900,
      'mens-flame-swirl-bomber-jacket-orange-abstract-aop-outerwear': 799900,
      'men-s-bomber-jacket-gothic-red-rose-smoke-all-over-print': 849900,
      'vintage-gothic-rose-bomber-jacket': 599900,
      'dragon-wave-bomber-jacket-gold-asian-dragon-sakura-design': 899900,
      'dragon-cherry-blossom-bomber-jacket': 599900,
      'japanese-oni-mask-wave-bomber-jacket-sakura-great-wave-aop': 849900,
      'baroque-floral-bomber-jacket-gold-ornate-vase-design': 849900,
      'baroque-rose-bomber-jacket': 599900,
      'gothic-winged-skull-bomber-jacket': 849900,
      'apex-samurai-oni-the-great-wave-couture-bomber-jacket-womens': 599900,
      'apex-casablanca-palais-silk-twill-bomber-jacket-mens': 849900,
      'apex-casablanca-palais-silk-twill-bomber-jacket-womens': 599900,
      // Varsity / Shadow Division — kept at its Shopify-set price
      'unisex-varsity-jacket': 159900,
    };

    let priceINR = 0;
    let priceUSD = 0;

    if (LUXURY_PRICES_INR[p.handle]) {
      priceINR = LUXURY_PRICES_INR[p.handle];
      priceUSD = Math.round(priceINR / 83.5);
    } else if (currencyCode === 'INR') {
      priceINR = Math.round(rawAmount * 100);
      priceUSD = Math.round((rawAmount / 83.5) * 100);
    } else {
      priceUSD = Math.round(rawAmount * 100);
      priceINR = Math.round(rawAmount * 83.5 * 100);
    }

    // Protection against unsynced raw Printify prices in Outerwear
    if (category === 'Outerwear' && priceINR < 20000) {
      if (titleUpper.includes("WOMEN") || titleUpper.includes("FEMALE")) {
        priceINR = 599900;
      } else {
        priceINR = 799900;
      }
      priceUSD = Math.round(priceINR / 83.5);
    }

    const rawDescHtml = p.descriptionHtml || '';

    // Protect interactive accordions (<details>...</details>) containing size charts from table stripping
    const detailsBlocks = [];
    let preservedHtml = rawDescHtml.replace(/<details[\s\S]*?<\/details>/gi, (match) => {
      detailsBlocks.push(match);
      return `__DETAILS_BLOCK_${detailsBlocks.length - 1}__`;
    });

    let cleanDescHtml = preservedHtml
      .replace(/<table[^>]*>[\s\S]*?<\/table>/gi, '')
      .replace(/<p>\s*(?:&nbsp;|\s)*<\/p>/gi, '')
      .replace(/<p>\s*<br\s*\/?>\s*<\/p>/gi, '')
      .replace(/style="[^"]*"/gi, '')
      .trim();

    // If the HTML lacks paragraph tags but contains section keywords, structure it cleanly
    if (!/<(?:p|ul|li|div|br)[^>]*>/i.test(cleanDescHtml) && cleanDescHtml) {
      const parts = cleanDescHtml.split(/(FABRIC\s*&amp;?\s*BUILD\s*SPECS:|FIT\s*&amp;?\s*STYLING:|FIT\s*&amp;?\s*SIZING:|CARE:|KEY\s*FEATURES:)/i);
      let structured = '';
      for (let i = 0; i < parts.length; i++) {
        const seg = parts[i].trim();
        if (!seg) continue;
        if (/^(FABRIC\s*&amp;?\s*BUILD\s*SPECS:|FIT\s*&amp;?\s*STYLING:|FIT\s*&amp;?\s*SIZING:|CARE:|KEY\s*FEATURES:)$/i.test(seg)) {
          structured += `<p><strong>${seg}</strong></p>`;
        } else {
          structured += `<p>${seg}</p>`;
        }
      }
      if (structured) cleanDescHtml = structured;
    }

    // Restore protected accordions
    detailsBlocks.forEach((block, idx) => {
      cleanDescHtml = cleanDescHtml.replace(`__DETAILS_BLOCK_${idx}__`, block);
    });

    cleanDescHtml = cleanDescHtml.trim();

    let cleanDesc = stripGsm(
      cleanDescHtml
        .replace(/<[^>]+>/g, ' ')
        .replace(/&amp;/g, '&')
        .replace(/&quot;/g, '"')
        .replace(/&#39;/g, "'")
        .replace(/&lt;/g, '<')
        .replace(/&gt;/g, '>')
        .replace(/\s+/g, ' ')
        .trim()
    );

    const rawImages = p.images?.edges?.map(e => e.node.url) || [];

    const sizesSet = new Set();
    const colorsSet = new Set();

    const parsedVariants = p.variants?.edges?.map(({ node: v }) => {
      let sizeVal = '';
      let colorVal = '';

      v.selectedOptions?.forEach(opt => {
        const name = opt.name.toLowerCase();
        if (name.includes('size')) sizeVal = opt.value;
        if (name.includes('color') || name.includes('colour') || name.includes('sole') || isFootwear) {
          if (isFootwear) {
            const optVal = (opt.value || '').toLowerCase();
            if (optVal.includes('white')) colorVal = 'Clean White';
            else if (optVal.includes('black')) colorVal = 'Stealth Black';
            else if (optVal.includes('sole')) colorVal = opt.value;
            else if (name.includes('color') || name.includes('sole')) colorVal = opt.value;
          } else {
            // Filter out Printify's non-selectable seam-thread auto-match label
            const rawColor = opt.value || '';
            if (!rawColor.toLowerCase().includes('seam thread') && !rawColor.toLowerCase().includes('automatically matched')) {
              colorVal = rawColor;
            }
          }
        }
      });

      if (!sizeVal) {
        const parts = v.title.split('/').map(s => s.trim());
        for (const pt of parts) {
          if (!pt.toLowerCase().includes('seam thread') && !pt.toLowerCase().includes('automatically matched')) {
            sizeVal = pt;
            break;
          }
        }
      }

      if (isFootwear && colorVal) {
        const cLower = colorVal.toLowerCase();
        if (cLower.includes('white')) colorVal = 'Clean White';
        else if (cLower.includes('black')) colorVal = 'Stealth Black';
      }

      if (sizeVal) sizesSet.add(sizeVal);
      if (colorVal) colorsSet.add(colorVal);

      const vCurr = v.price?.currencyCode || currencyCode;
      const vAmt = parseFloat(v.price?.amount || rawAmount.toString());
      let vPriceINR = vCurr === 'INR' ? Math.round(vAmt * 100) : Math.round(vAmt * 83.5 * 100);
      let vPriceUSD = vCurr === 'USD' ? Math.round(vAmt * 100) : Math.round((vAmt / 83.5) * 100);

      if (LUXURY_PRICES_INR[p.handle]) {
        vPriceINR = LUXURY_PRICES_INR[p.handle];
        vPriceUSD = Math.round(vPriceINR / 83.5);
      } else if (category === 'Outerwear' && vPriceINR < 20000) {
        vPriceINR = priceINR;
        vPriceUSD = priceUSD;
      }

      return {
        id: v.id,
        shopifyVariantId: v.id,
        size: sizeVal,
        color: colorVal,
        priceINR: vPriceINR,
        priceUSD: vPriceUSD,
        image: v.image?.url || null,
      };
    }) || [];

    const APPAREL_SIZE_ORDER = ['XS', 'S', 'M', 'L', 'XL', 'XXL', '2XL', '3XL', '4XL', '5XL'];
    const sizes = Array.from(sizesSet).sort((a, b) => {
      const ai = APPAREL_SIZE_ORDER.indexOf(a.toUpperCase());
      const bi = APPAREL_SIZE_ORDER.indexOf(b.toUpperCase());
      if (ai !== -1 && bi !== -1) return ai - bi;
      if (ai !== -1) return -1;
      if (bi !== -1) return 1;
      return a.localeCompare(b, undefined, { numeric: true });
    });

    const COLOR_ORDER = ['Clean White', 'Stealth Black'];
    const colors = Array.from(colorsSet).sort((a, b) => {
      if (isFootwear) {
        const ai = COLOR_ORDER.indexOf(a);
        const bi = COLOR_ORDER.indexOf(b);
        return (ai === -1 ? 99 : ai) - (bi === -1 ? 99 : bi);
      }
      return a.localeCompare(b);
    });

    const N = rawImages.length;
    const half = Math.floor(N / 2);
    const whiteVariantIds = parsedVariants.filter(v => v.color === 'Clean White').map(v => v.id);
    const blackVariantIds = parsedVariants.filter(v => v.color === 'Stealth Black').map(v => v.id);

    // Build color to image map
    const colorImages = {};
    parsedVariants.forEach(v => {
      if (v.color && v.image && !colorImages[v.color]) {
        colorImages[v.color] = v.image;
      }
    });

    // In Printify footwear uploads to Shopify:
    // Index 0: Clean White main profile
    // Index 1: Stealth Black main profile
    if (isFootwear && N >= 2) {
      if (!colorImages['Clean White'] && rawImages[0]) colorImages['Clean White'] = rawImages[0];
      if (!colorImages['Stealth Black'] && rawImages[1]) colorImages['Stealth Black'] = rawImages[1];
    }

    const whiteIndices = new Set([0]);
    const blackIndices = new Set([1]);
    for (let i = 2; i < 1 + half; i++) {
      whiteIndices.add(i);
    }
    for (let i = 1 + half; i < N; i++) {
      blackIndices.add(i);
    }

    const parsedImages = rawImages.map((url, idx) => {
      let variantIds = [];
      if (isFootwear && colors.length === 2 && N >= 8) {
        if (whiteIndices.has(idx)) {
          variantIds = whiteVariantIds;
        } else if (blackIndices.has(idx)) {
          variantIds = blackVariantIds;
        } else {
          variantIds = parsedVariants.map(v => v.id);
        }
      } else {
        variantIds = parsedVariants.map(v => v.id);
      }
      return {
        src: url,
        variantIds,
      };
    });

    const PRODUCT_METADATA = {
      'the-arc-origins-high-top-sneakers-signature-edition': {
        fabricTag: 'Drop 001',
        specTag: 'Dual-Density Vulcanized Sole // Signature Edition',
        tagline: 'Dual-density vulcanized rubber with 16oz duck canvas.',
      },
      'the-arc-vector-grid-high-top-sneakers-geometric-edition': {
        fabricTag: 'Drop 001',
        specTag: 'Geometric Vector Print // Vulcanized Outsole',
        tagline: 'High-frequency isometric vector grid on 16oz canvas.',
      },
      'the-arc-liquid-marble-low-top-sneakers-crimson-edition': {
        fabricTag: 'Drop 001',
        specTag: 'Crimson Fluid Marble // Low-Top Profile',
        tagline: 'Hand-lasted low-top profile with crimson fluid marble grain.',
      },
      'the-arc-urban-camo-high-top-sneakers-stealth-stripe-edition': {
        fabricTag: 'Drop 001',
        specTag: 'Stealth Urban Camo // Dual-Density Sole',
        tagline: 'Stealth stripe architectural camouflage craft silhouette.',
      },
      'the-arc-cosmic-void-high-top-sneakers-nebula-edition': {
        fabricTag: 'Drop 001',
        specTag: 'Nebula Cosmic Void // Vulcanized Rubber',
        tagline: 'Deep space cosmic nebula grain on hand-lasted canvas.',
      },
      'the-arc-kanagawa-wave-high-top-sneakers-ukiyo-e-edition': {
        fabricTag: 'Drop 001',
        specTag: 'Ukiyo-e Wave Art // Dual-Density Sole',
        tagline: 'Ukiyo-e wave art rendered across heavy canvas.',
      },
      'the-arc-origins-womens-high-top-sneakers-signature-edition': {
        fabricTag: 'Drop 001',
        specTag: "Women's Specific Last // Signature Edition",
        tagline: "Tailored women's silhouette with signature crimson heel loop.",
      },
      'the-arc-monolith-active-shorts-stealth-modular-edition': {
        fabricTag: 'Drop 001',
        specTag: 'Water-Resistant Zips // Double-Needle Hem',
        tagline: 'Architectural minimalism. Deep shadow geometry built for high-output movement.',
      },
      'the-arc-vector-grid-active-shorts-geometric-edition': {
        fabricTag: 'Drop 001',
        specTag: 'Isometric Vector Print // Technical Cut',
        tagline: 'Wireframe brutalism. High-density techwear tailored for digital nomads.',
      },
      'apex-liquid-marble-fluid-shorts-crimson-void': {
        fabricTag: 'Drop 001',
        specTag: 'Crimson Void Fluid Flow // Athletic Cut',
        tagline: 'Molten veins of crimson suspended in obsidian stone. Chaos frozen in time.',
      },
      'apex-spec-001-heavyweight-washed-boxy-tee': {
        fabricTag: 'Drop 001',
        specTag: 'Oversized Architectural Cut // Limited Edition',
        tagline: 'Heavyweight architectural boxy armor, worn-in soul. Wear what others can\'t.',
      },
      'unisex-tie-dye-oversized-t-shirt': {
        fabricTag: 'Drop 001',
        specTag: 'Oversized Streetwear Cut // Limited Edition',
        tagline: 'Organic wash streetwear silhouette, worn-in soul. Wear what others can\'t.',
      },

      // ── HAUTE COUTURE BOMBER JACKETS (Drop 001 Qikink Native) ──
      'unisex-gothic-bomber-jacket': {
        title: 'APEX "Gothic Blood Rose" Haute Couture Bomber Jacket (Men\'s)',
        fabricTag: 'Drop 001',
        specTag: 'Gothic Rose & Smoke // Ribbed Trim',
        tagline: 'Dark romance tailored in thorns, smoke, and silk-twill drama.',
      },
      'unisex-gothic-bomber-jacket-1': {
        title: 'APEX "Gothic Blood Rose" Couture Bomber Jacket (Women\'s)',
        fabricTag: 'Drop 001',
        specTag: 'Gothic Rose & Smoke // Ribbed Trim',
        tagline: 'Dark romantic poetry cut for bold feminine elegance.',
      },
      'unisex-dragon-bomber-jacket': {
        title: 'APEX "Imperial Gold Dragon" Sukajan Bomber Jacket V2 (Men\'s)',
        fabricTag: 'Drop 001',
        specTag: 'Gold Sukajan Tapestry // YKK Hardware',
        tagline: 'Gilded myth meets Tokyo street couture. Relentless power in 24-karat hues.',
      },
      'unisex-dragon-bomber-jacket-1': {
        title: 'APEX "Imperial Gold Dragon" Sukajan Bomber Jacket V2 (Women\'s)',
        fabricTag: 'Drop 001',
        specTag: 'Gold Sukajan Tapestry // YKK Hardware',
        tagline: 'Ancient gilded royalty reimagined for the modern vanguard.',
      },
      'apex-samurai-oni-the-great-wave-couture-bomber-jacket-mens': {
        title: 'APEX "Samurai Oni & The Great Wave" Couture Bomber Jacket (Men\'s)',
        fabricTag: 'Drop 001',
        specTag: 'Ukiyo-e Tapestry // Matte Hardware',
        tagline: 'Demon armor born from cresting storms. Chaos harnessed into pure couture.',
      },
      'apex-samurai-oni-the-great-wave-couture-bomber-jacket-womens-1': {
        title: 'APEX "Samurai Oni & The Great Wave" Couture Bomber Jacket (Women\'s)',
        fabricTag: 'Drop 001',
        specTag: 'Ukiyo-e Tapestry // Matte Hardware',
        tagline: 'Untamed ocean tempest meets ancient warrior mysticism.',
      },
      'apex-baroque-burgundy-oil-tapestry-bomber-jacket-mens': {
        title: 'APEX "Baroque Burgundy" Oil Tapestry Bomber Jacket (Men\'s)',
        fabricTag: 'Drop 001',
        specTag: 'Baroque Oil Tapestry // Matte Trim',
        tagline: 'Old-world palace opulence. Renaissance oil masterpiece cut for the modern vanguard.',
      },
      'apex-baroque-burgundy-oil-tapestry-bomber-jacket-womens': {
        title: 'APEX "Baroque Burgundy" Oil Tapestry Bomber Jacket (Women\'s)',
        fabricTag: 'Drop 001',
        specTag: 'Baroque Oil Tapestry // Matte Trim',
        tagline: 'Palatial Renaissance grandeur woven in deep wine and gilded gold.',
      },
      'apex-casablanca-palais-silk-twill-tennis-club-bomber-jacket-mens': {
        title: 'APEX "Casablanca Palais" Silk-Twill Tennis Club Bomber Jacket (Men\'s)',
        fabricTag: 'Drop 001',
        specTag: 'Mediterranean Palais // YKK Hardware',
        tagline: 'Mediterranean sun drenched in North African grandeur. The pinnacle of leisure couture.',
      },
      'apex-casablanca-palais-silk-twill-tennis-club-bomber-jacket-womens': {
        title: 'APEX "Casablanca Palais" Silk-Twill Tennis Club Bomber Jacket (Women\'s)',
        fabricTag: 'Drop 001',
        specTag: 'Mediterranean Palais // YKK Hardware',
        tagline: 'Sun-drenched Riviera leisure meets opulent architectural grace.',
      },
      'apex-dark-romance-bone-wings-couture-bomber-jacket-mens': {
        title: 'APEX "Dark Romance Bone Wings" Couture Bomber Jacket (Men\'s)',
        fabricTag: 'Drop 001',
        specTag: 'Bone Wings Tapestry // Ribbed Trim',
        tagline: 'Ossuary royalty. Symmetrical bone wings and vertebrae spine forged in dark romance.',
      },
      'apex-dark-romance-bone-wings-couture-bomber-jacket-womens': {
        title: 'APEX "Dark Romance Bone Wings" Couture Bomber Jacket (Women\'s)',
        fabricTag: 'Drop 001',
        specTag: 'Bone Wings Tapestry // Ribbed Trim',
        tagline: 'Fallen angel anatomy. Sculpted bone wings and crimson neural veins.',
      },

      // ── HAUTE COUTURE BOMBER JACKETS (Master Section 1 - Legacy Fallbacks) ──
      'men-s-bomber-jacket-gothic-red-rose-smoke-all-over-print': {
        title: 'APEX "Gothic Blood Rose" Haute Couture Bomber Jacket (Men\'s)',
        fabricTag: 'Drop 001',
        specTag: 'Gothic Rose & Smoke // Ribbed Trim',
        tagline: 'Dark romance tailored in thorns, smoke, and silk-twill drama.',
      },
      'vintage-gothic-rose-bomber-jacket': {
        title: 'APEX "Gothic Blood Rose" Couture Bomber Jacket (Women\'s)',
        fabricTag: 'Drop 001',
        specTag: 'Gothic Rose & Smoke // Ribbed Trim',
        tagline: 'Dark romantic poetry cut for bold feminine elegance.',
      },
      'dragon-wave-bomber-jacket-gold-asian-dragon-sakura-design': {
        title: 'APEX "Imperial Gold Dragon" Sukajan Bomber Jacket V2 (Men\'s)',
        fabricTag: 'Drop 001',
        specTag: 'Gold Sukajan Tapestry // YKK Hardware',
        tagline: 'Gilded myth meets Tokyo street couture. Relentless power in 24-karat hues.',
      },
      'dragon-cherry-blossom-bomber-jacket': {
        title: 'APEX "Imperial Gold Dragon" Sukajan Bomber Jacket V2 (Women\'s)',
        fabricTag: 'Drop 001',
        specTag: 'Gold Sukajan Tapestry // YKK Hardware',
        tagline: 'Ancient gilded royalty reimagined for the modern vanguard.',
      },
      'japanese-oni-mask-wave-bomber-jacket-sakura-great-wave-aop': {
        title: 'APEX "Samurai Oni & The Great Wave" Couture Bomber Jacket (Men\'s)',
        fabricTag: 'Drop 001',
        specTag: 'Ukiyo-e Tapestry // Matte Hardware',
        tagline: 'Demon armor born from cresting storms. Chaos harnessed into pure couture.',
      },
      'apex-samurai-oni-the-great-wave-couture-bomber-jacket-womens': {
        title: 'APEX "Samurai Oni & The Great Wave" Couture Bomber Jacket (Women\'s)',
        fabricTag: 'Drop 001',
        specTag: 'Ukiyo-e Tapestry // Matte Hardware',
        tagline: 'Untamed ocean tempest meets ancient warrior mysticism.',
      },
      'baroque-floral-bomber-jacket-gold-ornate-vase-design': {
        title: 'APEX "Baroque Burgundy" Oil Tapestry Bomber Jacket (Men\'s)',
        fabricTag: 'Drop 001',
        specTag: 'Baroque Oil Tapestry // Matte Trim',
        tagline: 'Old-world palace opulence. Renaissance oil masterpiece cut for the modern vanguard.',
      },
      'baroque-rose-bomber-jacket': {
        title: 'APEX "Baroque Burgundy" Oil Tapestry Bomber Jacket (Women\'s)',
        fabricTag: 'Drop 001',
        specTag: 'Baroque Oil Tapestry // Matte Trim',
        tagline: 'Palatial Renaissance grandeur woven in deep wine and gilded gold.',
      },
      'apex-casablanca-palais-silk-twill-bomber-jacket-mens': {
        title: 'APEX "Casablanca Palais" Silk-Twill Tennis Club Bomber Jacket (Men\'s)',
        fabricTag: 'Drop 001',
        specTag: 'Mediterranean Palais // YKK Hardware',
        tagline: 'Mediterranean sun drenched in North African grandeur. The pinnacle of leisure couture.',
      },
      'apex-casablanca-palais-silk-twill-bomber-jacket-womens': {
        title: 'APEX "Casablanca Palais" Silk-Twill Tennis Club Bomber Jacket (Women\'s)',
        fabricTag: 'Drop 001',
        specTag: 'Mediterranean Palais // YKK Hardware',
        tagline: 'Sun-drenched Riviera leisure meets opulent architectural grace.',
      },
      'gothic-winged-skull-bomber-jacket': {
        title: 'APEX "Dark Romance Bone Wings" Couture Bomber Jacket (Men\'s)',
        fabricTag: 'Drop 001',
        specTag: 'Bone Wings Tapestry // Ribbed Trim',
        tagline: 'Ossuary royalty. Symmetrical bone wings and vertebrae spine forged in dark romance.',
      },

      // ── ARCHIVAL KINETIC & STREETWEAR OUTERWEAR (Master Section 4) ──
      'red-liquid-marble-bomber-jacket': {
        title: 'APEX "Liquid Marble Crimson Void" Bomber Jacket (Men\'s)',
        fabricTag: 'Drop 001',
        specTag: 'Crimson Void Fluid // YKK Zipper',
        tagline: 'Hypnotic molten crimson suspended in obsidian space. Raw kinetic street presence.',
      },
      'black-bomber-jacket-classic-mens-aop-zip-up': {
        title: 'APEX "Origins Stealth Monolith" Bomber Jacket (Men\'s)',
        fabricTag: 'Drop 001',
        specTag: 'Stealth Monolith AOP // Classic Ribbing',
        tagline: 'Architectural blackout minimalism. Monolithic prism geometry engineered for the shadows.',
      },
      'mens-flame-swirl-bomber-jacket-orange-abstract-aop-outerwear': {
        title: 'APEX "Solar Eclipse Dark Flare" Bomber Jacket (Men\'s)',
        fabricTag: 'Drop 001',
        specTag: 'Solar Flame Swirl // Ribbed Cuffs',
        tagline: 'Molten solar ember flare surging through the cosmic void. Fiery street kineticism.',
      },
      'swirling-amber-flame-bomber-jacket': {
        title: 'APEX "Solar Eclipse Dark Flare" Bomber Jacket (Women\'s)',
        fabricTag: 'Drop 001',
        specTag: 'All-Over Amber Flame Print // YKK Zipper',
        tagline: 'Radiant golden solar flares and burning embers woven into obsidian silk.',
      },
      'teal-wave-abstract-bomber-jacket': {
        title: 'APEX "Cyber Emerald Matrix" Bomber Jacket (Women\'s)',
        fabricTag: 'Drop 001',
        specTag: 'Teal Wave Hydro Print // Matte Hardware',
        tagline: 'Electric bioluminescent teal and cyber emerald cut for high-fashion nightlife.',
      },
      'unisex-varsity-jacket': {
        title: 'APEX "Shadow Division" Heavy Cotton Varsity Jacket',
        fabricTag: 'Drop 001',
        specTag: 'Ribbed Collar & Cuffs // Matte Snap Fasteners',
        tagline: 'Heritage collegiate silhouette stripped down to pure stealth luxury. Wear what others can\'t.',
      },
    };

    const meta = PRODUCT_METADATA[p.handle] || {};
    const defaultFabric = 'Drop 001';

    // Gender Determination
    const titleLower = (meta.title || p.title).toLowerCase();
    const tagsLower = (p.tags || []).map(t => (t || '').toLowerCase());
    const isWomensOnly = titleLower.includes("women's") || titleLower.includes("womens") || tagsLower.includes("women's clothing") || tagsLower.includes("women bomber") || tagsLower.includes("women jacket") || tagsLower.includes("gifting jacket") || tagsLower.includes("gift for her");
    const isMensOnly = titleLower.includes("(men's)") || titleLower.includes("men's") || titleLower.includes("mens") || tagsLower.includes("men's clothing") || tagsLower.includes("men bomber") || tagsLower.includes("men streetwear") || tagsLower.includes("gift for him");

    let gender = 'Unisex';
    if (isWomensOnly && !isMensOnly) gender = "Women's";
    else if (isMensOnly && !isWomensOnly) gender = "Men's";
    else if (titleLower.includes("women's")) gender = "Women's";
    else if (titleLower.includes("(men's)") || titleLower.includes("men's")) gender = "Men's";

    const COUTURE_HANDLES = new Set([
      'unisex-gothic-bomber-jacket',                                  // Model 01 Men's
      'unisex-gothic-bomber-jacket-1',                                // Model 01 Women's
      'unisex-dragon-bomber-jacket',                                  // Model 02 Men's
      'unisex-dragon-bomber-jacket-1',                                // Model 02 Women's
      'apex-samurai-oni-the-great-wave-couture-bomber-jacket-mens',   // Model 03 Men's
      'apex-samurai-oni-the-great-wave-couture-bomber-jacket-womens-1', // Model 03 Women's
      'apex-baroque-burgundy-oil-tapestry-bomber-jacket-mens',        // Model 04 Men's
      'apex-baroque-burgundy-oil-tapestry-bomber-jacket-womens',      // Model 04 Women's
      'apex-casablanca-palais-silk-twill-tennis-club-bomber-jacket-mens', // Model 05 Men's
      'apex-casablanca-palais-silk-twill-tennis-club-bomber-jacket-womens', // Model 05 Women's
      'apex-dark-romance-bone-wings-couture-bomber-jacket-mens',      // Model 06 Men's
      'apex-dark-romance-bone-wings-couture-bomber-jacket-womens',    // Model 06 Women's
      // Legacy Fallbacks
      'men-s-bomber-jacket-gothic-red-rose-smoke-all-over-print',
      'vintage-gothic-rose-bomber-jacket',
      'dragon-wave-bomber-jacket-gold-asian-dragon-sakura-design',
      'dragon-cherry-blossom-bomber-jacket',
      'japanese-oni-mask-wave-bomber-jacket-sakura-great-wave-aop',
      'apex-samurai-oni-the-great-wave-couture-bomber-jacket-womens',
      'baroque-floral-bomber-jacket-gold-ornate-vase-design',
      'baroque-rose-bomber-jacket',
      'apex-casablanca-palais-silk-twill-bomber-jacket-mens',
      'apex-casablanca-palais-silk-twill-bomber-jacket-womens',
      'gothic-winged-skull-bomber-jacket',
    ]);

    let sectionKey = 'active';
    if (COUTURE_HANDLES.has(p.handle)) {
      sectionKey = 'couture';
    } else if (p.handle === 'unisex-varsity-jacket') {
      sectionKey = 'collegiate';
    } else if (category === 'Outerwear') {
      sectionKey = 'outerwear';
    } else if (category === 'Footwear') {
      sectionKey = 'footwear';
    } else {
      sectionKey = 'active';
    }

    return {
      id: p.handle,
      shopifyId: p.id,
      handle: p.handle,
      name: stripGsm(meta.title || p.title),
      category,
      gender,
      sectionKey,
      priceUSD,
      priceINR,
      image: rawImages[0] || '',
      images: parsedImages,
      colorImages,
      fabricTag: stripGsm(meta.fabricTag || defaultFabric),
      specTag: stripGsm(meta.specTag || (isFootwear ? 'Dual-Density Sole // Drop 001' : (category === 'Shorts' ? 'Performance Micro-Knit' : ''))),
      tagline: stripGsm(meta.tagline || ''),
      tags: (p.tags || []).map(t => stripGsm(t)),
      parsedVariants,
      desc: cleanDesc,
      descHtml: cleanDescHtml,
      sizes,
      requiresSize: sizes.length > 0,
      colors: colors.length > 0 ? colors : (isFootwear ? ['Clean White', 'Stealth Black'] : []),
      requiresColor: colors.length > 0,
      waitlist: false,
      digital: false,
      limited: !isSignature,
      signature: isSignature,
      isShopify: true,
    };
  });

  // Curated Drop 001 Handle Sequence (Strictly aligned with APEX_WEBSITE_PRODUCT_MASTER.md)
  const DEFAULT_HANDLE_ORDER = [
    // ── 1. Flagship Haute Couture Bomber Jackets (Sequential: Model 01 -> Model 06, Men's & Women's) ──
    'unisex-gothic-bomber-jacket',                                  // Model 01 Gothic Blood Rose Men's
    'unisex-gothic-bomber-jacket-1',                                // Model 01 Gothic Blood Rose Women's
    'unisex-dragon-bomber-jacket',                                  // Model 02 Imperial Gold Dragon V2 Men's
    'unisex-dragon-bomber-jacket-1',                                // Model 02 Imperial Gold Dragon V2 Women's
    'apex-samurai-oni-the-great-wave-couture-bomber-jacket-mens',   // Model 03 Samurai Oni & Great Wave Men's
    'apex-samurai-oni-the-great-wave-couture-bomber-jacket-womens-1', // Model 03 Samurai Oni & Great Wave Women's
    'apex-baroque-burgundy-oil-tapestry-bomber-jacket-mens',        // Model 04 Baroque Burgundy Men's
    'apex-baroque-burgundy-oil-tapestry-bomber-jacket-womens',      // Model 04 Baroque Burgundy Women's
    'apex-casablanca-palais-silk-twill-tennis-club-bomber-jacket-mens', // Model 05 Casablanca Palais Men's
    'apex-casablanca-palais-silk-twill-tennis-club-bomber-jacket-womens', // Model 05 Casablanca Palais Women's
    'apex-dark-romance-bone-wings-couture-bomber-jacket-mens',      // Model 06 Dark Romance Bone Wings Men's
    'apex-dark-romance-bone-wings-couture-bomber-jacket-womens',    // Model 06 Dark Romance Bone Wings Women's
    // Legacy Printify Handle Fallbacks
    'men-s-bomber-jacket-gothic-red-rose-smoke-all-over-print',
    'vintage-gothic-rose-bomber-jacket',
    'dragon-wave-bomber-jacket-gold-asian-dragon-sakura-design',
    'dragon-cherry-blossom-bomber-jacket',
    'japanese-oni-mask-wave-bomber-jacket-sakura-great-wave-aop',
    'apex-samurai-oni-the-great-wave-couture-bomber-jacket-womens',
    'baroque-floral-bomber-jacket-gold-ornate-vase-design',
    'baroque-rose-bomber-jacket',
    'apex-casablanca-palais-silk-twill-bomber-jacket-mens',
    'apex-casablanca-palais-silk-twill-bomber-jacket-womens',
    'gothic-winged-skull-bomber-jacket',

    // ── 2. Archival Kinetic & Streetwear Outerwear (Master Section 4) ──
    'red-liquid-marble-bomber-jacket',                              // Model 01 Liquid Marble Crimson Void Men's
    'black-bomber-jacket-classic-mens-aop-zip-up',                 // Model 03 Origins Stealth Monolith Men's
    'mens-flame-swirl-bomber-jacket-orange-abstract-aop-outerwear',   // Model 04 Solar Eclipse Dark Flare Men's
    'swirling-amber-flame-bomber-jacket',                          // Model 04 Solar Eclipse Dark Flare Women's
    'teal-wave-abstract-bomber-jacket',                            // Model 05 Cyber Emerald Matrix Women's

    // ── 3. Collegiate Outerwear (Dedicated Spotlight Section) ──
    'unisex-varsity-jacket',                                       // Model 11 Shadow Division Varsity Jacket

    // ── 4. Hand-Lasted Craft Footwear (Origins Signature First) ──
    'the-arc-origins-high-top-sneakers-signature-edition',
    'the-arc-origins-womens-high-top-sneakers-signature-edition',
    'the-arc-urban-camo-high-top-sneakers-stealth-stripe-edition',
    'the-arc-vector-grid-high-top-sneakers-geometric-edition',
    'the-arc-liquid-marble-low-top-sneakers-crimson-edition',
    'the-arc-cosmic-void-high-top-sneakers-nebula-edition',
    'the-arc-kanagawa-wave-high-top-sneakers-ukiyo-e-edition',

    // ── 5. Architectural Active Bottoms & Boxy Streetwear Tops (Master Section 2 & 3) ──
    'the-arc-monolith-active-shorts-stealth-modular-edition',
    'the-arc-vector-grid-active-shorts-geometric-edition',
    'apex-liquid-marble-fluid-shorts-crimson-void',
    'apex-spec-001-heavyweight-washed-boxy-tee',
    'unisex-tie-dye-oversized-t-shirt'
  ];

  return unrankedProducts.sort((a, b) => {
    // 1. Merchant priority tag set in Shopify Admin: order:N, priority:N, rank:N
    const getTagOrder = (item) => {
      for (const t of (item.tags || [])) {
        const m = t.match(/^(?:order|priority|rank):(\d+)$/i);
        if (m) return parseInt(m[1], 10);
      }
      return null;
    };
    const orderA = getTagOrder(a);
    const orderB = getTagOrder(b);
    if (orderA !== null && orderB !== null) return orderA - orderB;
    if (orderA !== null) return -1;
    if (orderB !== null) return 1;

    // 2. Curated default order
    const idxA = DEFAULT_HANDLE_ORDER.indexOf(a.handle);
    const idxB = DEFAULT_HANDLE_ORDER.indexOf(b.handle);
    if (idxA !== -1 && idxB !== -1) return idxA - idxB;
    if (idxA !== -1) return -1;
    if (idxB !== -1) return 1;

    return a.name.localeCompare(b.name);
  });
}

export async function createShopifyCheckout(lines, country = 'IN') {
  const mutation = `
    mutation CreateCart($lines: [CartLineInput!]!, $country: CountryCode) @inContext(country: $country) {
      cartCreate(input: { lines: $lines }) {
        cart {
          id
          checkoutUrl
          cost {
            totalAmount {
              amount
              currencyCode
            }
          }
        }
        userErrors {
          field
          message
        }
      }
    }
  `;

  const data = await shopifyFetch(mutation, { lines, country });
  const cartResult = data?.cartCreate;

  if (cartResult?.userErrors && cartResult.userErrors.length > 0) {
    throw new Error(cartResult.userErrors.map(e => e.message).join(', '));
  }

  return cartResult?.cart;
}

export async function redirectToShopifyCheckout(lines, country = 'IN') {
  const cart = await createShopifyCheckout(lines, country);
  if (cart?.checkoutUrl) {
    window.location.href = cart.checkoutUrl;
  } else {
    throw new Error('Failed to generate Shopify checkout URL');
  }
}
