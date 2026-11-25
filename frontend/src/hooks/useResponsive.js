import { useState, useEffect } from 'react';

export const useResponsive = () => {
  const [dimensions, setDimensions] = useState({
    windowWidth: typeof window !== 'undefined' ? window.innerWidth : 1200,
    windowHeight: typeof window !== 'undefined' ? window.innerHeight : 800,
  });

  useEffect(() => {
    let timeoutId = null;
    const handleResize = () => {
      // Debounce slightly for performance during continuous window drag
      if (timeoutId) clearTimeout(timeoutId);
      timeoutId = setTimeout(() => {
        setDimensions({
          windowWidth: window.innerWidth,
          windowHeight: window.innerHeight,
        });
      }, 50);
    };

    window.addEventListener('resize', handleResize);
    window.addEventListener('orientationchange', handleResize);
    return () => {
      if (timeoutId) clearTimeout(timeoutId);
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('orientationchange', handleResize);
    };
  }, []);

  const { windowWidth, windowHeight } = dimensions;

  // Granular breakpoint categories matching R01-R15 matrix
  const isSmallMobile = windowWidth < 375; // 320px - 374px (R01, R02)
  const isStandardMobile = windowWidth >= 375 && windowWidth < 480; // 375px - 479px (R03, R04, R05)
  const isLargeMobile = windowWidth >= 480 && windowWidth < 768; // 480px - 767px (R06)
  const isMobile = windowWidth < 768; // Standard mobile boundary

  const isSmallTablet = windowWidth >= 768 && windowWidth < 840; // 768px - 839px (R07)
  const isLargeTablet = windowWidth >= 840 && windowWidth < 1024; // 840px - 1023px (R08)
  const isTablet = windowWidth >= 768 && windowWidth < 1024; // Standard tablet boundary

  const isLaptop = windowWidth >= 1024 && windowWidth < 1280; // 1024px - 1279px (R09)
  const isStandardDesktop = windowWidth >= 1280 && windowWidth < 1440; // 1280px - 1439px (R10, R11)
  const isDesktop = windowWidth >= 1024; // Standard desktop boundary

  const isLargeDesktop = windowWidth >= 1440 && windowWidth < 1920; // 1440px - 1919px (R12, R13)
  const isWide = windowWidth >= 1440; // Standard wide boundary
  const isUltraWide = windowWidth >= 1920; // >= 1920px (R14, R15)

  // Device category tag
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

  const orientation = windowWidth >= windowHeight ? 'landscape' : 'portrait';
  const isTouchDevice =
    typeof window !== 'undefined' &&
    ('ontouchstart' in window || (navigator.maxTouchPoints && navigator.maxTouchPoints > 0));

  return {
    windowWidth,
    windowHeight,
    // Universal Coarse Breakpoints (Preserves 100% Backward Compatibility)
    isMobile,
    isTablet,
    isDesktop,
    isWide,
    // Granular Viewport Breakpoints
    isSmallMobile,
    isStandardMobile,
    isLargeMobile,
    isSmallTablet,
    isLargeTablet,
    isLaptop,
    isStandardDesktop,
    isLargeDesktop,
    isUltraWide,
    // Contextual Helpers
    deviceCategory,
    orientation,
    isTouchDevice,
  };
};
