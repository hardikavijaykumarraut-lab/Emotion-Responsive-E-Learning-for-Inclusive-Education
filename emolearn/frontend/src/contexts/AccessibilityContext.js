import React, { createContext, useContext, useState, useEffect } from 'react';

const AccessibilityContext = createContext();

export const useAccessibility = () => {
  const context = useContext(AccessibilityContext);
  if (!context) {
    throw new Error('useAccessibility must be used within an AccessibilityProvider');
  }
  return context;
};

const AccessibilityProvider = ({ children, themeMode: propThemeMode, setThemeMode: propSetThemeMode, fontSize: propFontSize, setFontSize: propSetFontSize, highContrast: propHighContrast, setHighContrast: propSetHighContrast }) => {
  const [fontSize, setFontSizeState] = useState(propFontSize || 'normal');
  const [highContrast, setHighContrastState] = useState(propHighContrast || false);
  const [reducedMotion, setReducedMotion] = useState(false);
  const [screenReaderMode, setScreenReaderMode] = useState(false);
  const [keyboardNavigation, setKeyboardNavigation] = useState(false);
  
  // Update local state when props change
  useEffect(() => {
    if (propFontSize && propFontSize !== fontSize) {
      setFontSizeState(propFontSize);
    }
  }, [propFontSize, fontSize]);
  
  useEffect(() => {
    if (propHighContrast !== undefined && propHighContrast !== highContrast) {
      setHighContrastState(propHighContrast);
    }
  }, [propHighContrast, highContrast]);

  // Load accessibility preferences from localStorage
  useEffect(() => {
    const savedPrefs = localStorage.getItem('accessibility-preferences');
    if (savedPrefs) {
      const prefs = JSON.parse(savedPrefs);
      setFontSizeState(prefs.fontSize || 'normal');
      setHighContrastState(prefs.highContrast || false);
      setReducedMotion(prefs.reducedMotion || false);
      setScreenReaderMode(prefs.screenReaderMode || false);
    }

    // Detect system preferences
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
    setReducedMotion(prefersReducedMotion.matches);

    const prefersHighContrast = window.matchMedia('(prefers-contrast: high)');
    setHighContrastState(prefersHighContrast.matches);

    // Listen for keyboard navigation
    const handleKeyDown = (e) => {
      if (e.key === 'Tab') {
        setKeyboardNavigation(true);
      }
    };

    const handleMouseDown = () => {
      setKeyboardNavigation(false);
    };

    document.addEventListener('keydown', handleKeyDown);
    document.addEventListener('mousedown', handleMouseDown);

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.removeEventListener('mousedown', handleMouseDown);
    };
  }, []);

  // Save preferences to localStorage
  const savePreferences = (prefs) => {
    localStorage.setItem('accessibility-preferences', JSON.stringify(prefs));
  };

  const updateFontSize = (size) => {
    setFontSizeState(size);
    if (propSetFontSize) {
      propSetFontSize(size);
    }
    savePreferences({ fontSize: size, highContrast, reducedMotion, screenReaderMode });
  };

  const toggleHighContrast = () => {
    const newValue = !highContrast;
    setHighContrastState(newValue);
    if (propSetHighContrast) {
      propSetHighContrast(newValue);
    }
    savePreferences({ fontSize, highContrast: newValue, reducedMotion, screenReaderMode });
  };
  
  const updateThemeMode = (mode) => {
    if (propSetThemeMode) {
      propSetThemeMode(mode);
    }
  };

  const toggleReducedMotion = () => {
    const newValue = !reducedMotion;
    setReducedMotion(newValue);
    savePreferences({ fontSize, highContrast, reducedMotion: newValue, screenReaderMode });
  };

  const toggleScreenReaderMode = () => {
    const newValue = !screenReaderMode;
    setScreenReaderMode(newValue);
    savePreferences({ fontSize, highContrast, reducedMotion, screenReaderMode: newValue });
  };

  // Announce messages to screen readers
  const announceToScreenReader = (message) => {
    const announcement = document.createElement('div');
    announcement.setAttribute('aria-live', 'polite');
    announcement.setAttribute('aria-atomic', 'true');
    announcement.style.position = 'absolute';
    announcement.style.left = '-10000px';
    announcement.style.width = '1px';
    announcement.style.height = '1px';
    announcement.style.overflow = 'hidden';
    announcement.textContent = message;
    
    document.body.appendChild(announcement);
    
    setTimeout(() => {
      document.body.removeChild(announcement);
    }, 1000);
  };

  // Focus management utilities
  const focusElement = (selector) => {
    const element = document.querySelector(selector);
    if (element) {
      element.focus();
    }
  };

  const trapFocus = (containerSelector) => {
    const container = document.querySelector(containerSelector);
    if (!container) return;

    const focusableElements = container.querySelectorAll(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
    );
    
    const firstElement = focusableElements[0];
    const lastElement = focusableElements[focusableElements.length - 1];

    const handleTabKey = (e) => {
      if (e.key === 'Tab') {
        if (e.shiftKey) {
          if (document.activeElement === firstElement) {
            lastElement.focus();
            e.preventDefault();
          }
        } else {
          if (document.activeElement === lastElement) {
            firstElement.focus();
            e.preventDefault();
          }
        }
      }
    };

    container.addEventListener('keydown', handleTabKey);
    
    return () => {
      container.removeEventListener('keydown', handleTabKey);
    };
  };

  const value = {
    themeMode: propThemeMode || 'light',
    fontSize,
    highContrast,
    reducedMotion,
    screenReaderMode,
    keyboardNavigation,
    updateFontSize,
    toggleHighContrast,
    updateThemeMode,
    toggleReducedMotion,
    toggleScreenReaderMode,
    announceToScreenReader,
    focusElement,
    trapFocus
  };

  return (
    <AccessibilityContext.Provider value={value}>
      {children}
    </AccessibilityContext.Provider>
  );
};

export default AccessibilityProvider;
