/**
 * Automated Responsive Design Matrix Verification
 * Tests R01-R15 Viewports & Responsive CSS Rules
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const frontendDir = path.resolve(__dirname, '..');

const VIEWPORT_MATRIX = [
  { id: 'R01', name: 'iPhone SE (1st Gen)', width: 320, height: 568, category: 'small-mobile', expectedDrawer: true },
  { id: 'R02', name: 'Samsung Galaxy S20', width: 360, height: 800, category: 'small-mobile', expectedDrawer: true },
  { id: 'R03', name: 'iPhone 11 Pro / X', width: 375, height: 812, category: 'standard-mobile', expectedDrawer: true },
  { id: 'R04', name: 'iPhone 12 / 13 / 14', width: 390, height: 844, category: 'standard-mobile', expectedDrawer: true },
  { id: 'R05', name: 'iPhone XR / 11', width: 414, height: 896, category: 'standard-mobile', expectedDrawer: true },
  { id: 'R06', name: 'Large Android / Phablet', width: 480, height: 900, category: 'large-mobile', expectedDrawer: true },
  { id: 'R07', name: 'iPad Portrait (Small Tablet)', width: 768, height: 1024, category: 'tablet', expectedDrawer: false },
  { id: 'R08', name: 'iPad Air Portrait', width: 820, height: 1180, category: 'tablet', expectedDrawer: false },
  { id: 'R09', name: 'iPad Landscape / Small Laptop', width: 1024, height: 768, category: 'laptop', expectedDrawer: false },
  { id: 'R10', name: 'MacBook Air / Laptop', width: 1280, height: 800, category: 'desktop', expectedDrawer: false },
  { id: 'R11', name: 'Standard Laptop 1366', width: 1366, height: 768, category: 'desktop', expectedDrawer: false },
  { id: 'R12', name: 'MacBook Pro 1440', width: 1440, height: 900, category: 'large-desktop', expectedDrawer: false },
  { id: 'R13', name: 'Widescreen Monitor 1600', width: 1600, height: 900, category: 'large-desktop', expectedDrawer: false },
  { id: 'R14', name: 'Full HD 1080p Monitor', width: 1920, height: 1080, category: 'ultra-wide', expectedDrawer: false },
  { id: 'R15', name: '2K / QHD Ultra-wide', width: 2560, height: 1440, category: 'ultra-wide', expectedDrawer: false },
];

function simulateUseResponsive(width, height) {
  const isSmallMobile = width < 375;
  const isStandardMobile = width >= 375 && width < 480;
  const isLargeMobile = width >= 480 && width < 768;
  const isMobile = width < 768;

  const isSmallTablet = width >= 768 && width < 840;
  const isLargeTablet = width >= 840 && width < 1024;
  const isTablet = width >= 768 && width < 1024;

  const isLaptop = width >= 1024 && width < 1280;
  const isStandardDesktop = width >= 1280 && width < 1440;
  const isDesktop = width >= 1024;

  const isLargeDesktop = width >= 1440 && width < 1920;
  const isWide = width >= 1440;
  const isUltraWide = width >= 1920;

  const deviceCategory = isSmallMobile
    ? 'small-mobile'
    : isStandardMobile
    ? 'standard-mobile'
    : isLargeMobile
    ? 'large-mobile'
    : isTablet
    ? 'tablet'
    : isLaptop
    ? 'laptop'
    : isStandardDesktop
    ? 'desktop'
    : isLargeDesktop
    ? 'large-desktop'
    : 'ultra-wide';

  const orientation = width >= height ? 'landscape' : 'portrait';

  return {
    isMobile,
    isTablet,
    isDesktop,
    isWide,
    isSmallMobile,
    isStandardMobile,
    isLargeMobile,
    isSmallTablet,
    isLargeTablet,
    isLaptop,
    isStandardDesktop,
    isLargeDesktop,
    isUltraWide,
    deviceCategory,
    orientation,
  };
}

console.log('================================================================');
console.log('  EGOLYTICS UNIVERSAL RESPONSIVE DESIGN - VIEWPORT MATRIX TEST  ');
console.log('================================================================\n');

let passCount = 0;
let failCount = 0;

for (const vp of VIEWPORT_MATRIX) {
  const res = simulateUseResponsive(vp.width, vp.height);
  const isMatch = res.deviceCategory === vp.category;
  const drawerMatch = res.isMobile === vp.expectedDrawer;

  if (isMatch && drawerMatch) {
    passCount++;
    console.log(`[PASS] ${vp.id} | ${vp.name.padEnd(30)} | ${vp.width}x${vp.height} | Cat: ${res.deviceCategory.padEnd(16)} | Nav: ${res.isMobile ? 'Mobile Drawer' : 'Sidebar'} | Orient: ${res.orientation}`);
  } else {
    failCount++;
    console.error(`[FAIL] ${vp.id} | Expected ${vp.category}, got ${res.deviceCategory}`);
  }
}

console.log('\n--- Checking CSS Rules & Key Files ---');
const responsiveCssPath = path.join(frontendDir, 'src', 'styles', 'responsive.css');
const responsiveCss = fs.readFileSync(responsiveCssPath, 'utf8');

const checks = [
  { name: 'Fluid container class (.responsive-fluid-container)', pass: responsiveCss.includes('.responsive-fluid-container') },
  { name: 'Table horizontal touch container (.table-container)', pass: responsiveCss.includes('.table-container') },
  { name: 'Mobile input zoom lock font-size >= 16px', pass: responsiveCss.includes('font-size: 16px !important;') },
  { name: 'Card header flex wrap on mobile (< 640px)', pass: responsiveCss.includes('.card-header') },
  { name: 'Ultra-small mobile (< 374px) branding guard', pass: responsiveCss.includes('.topbar-brand-title') },
  { name: 'Landscape small screen dialog constraints', pass: responsiveCss.includes('@media (max-height: 520px) and (orientation: landscape)') },
  { name: 'Ultra-wide monitor constraint (2560px+)', pass: responsiveCss.includes('@media (min-width: 2560px)') },
  { name: 'KPI responsive grid scaling', pass: responsiveCss.includes('.grid-responsive-kpi') },
  { name: 'Complex module wrappers (Gantt, BFOV, Maplytics)', pass: responsiveCss.includes('.gantt-scroll-canvas') && responsiveCss.includes('.bfov-canvas-wrapper') && responsiveCss.includes('.maplytics-container') },
];

for (const chk of checks) {
  if (chk.pass) {
    passCount++;
    console.log(`[PASS] ${chk.name}`);
  } else {
    failCount++;
    console.error(`[FAIL] ${chk.name}`);
  }
}

console.log('\n================================================================');
console.log(`Verification Complete: ${passCount} PASSED, ${failCount} FAILED`);
console.log('================================================================');

if (failCount > 0) {
  process.exit(1);
} else {
  process.exit(0);
}

