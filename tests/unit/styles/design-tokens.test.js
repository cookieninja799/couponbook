// Design token validation tests
import { describe, it, expect, beforeAll } from 'vitest';
import { readFileSync } from 'fs';
import { resolve } from 'path';

describe('Design Tokens', () => {
  let cssContent;

  beforeAll(() => {
    const cssPath = resolve(process.cwd(), 'src/assets/styles/design-tokens.css');
    cssContent = readFileSync(cssPath, 'utf-8');
  });

  describe('Color System', () => {
    it('should define primary brand colors', () => {
      expect(cssContent).toContain('--color-primary:');
      expect(cssContent).toContain('--color-primary-hover:');
      expect(cssContent).toContain('--color-primary-light:');
      expect(cssContent).toContain('--color-primary-dark:');
    });

    it('should define secondary colors', () => {
      expect(cssContent).toContain('--color-secondary:');
      expect(cssContent).toContain('--color-secondary-hover:');
    });

    it('should define tertiary colors', () => {
      expect(cssContent).toContain('--color-tertiary:');
      expect(cssContent).toContain('--color-tertiary-hover:');
      expect(cssContent).toContain('--color-text-on-tertiary:');
    });

    it('should define semantic colors', () => {
      expect(cssContent).toContain('--color-success:');
      expect(cssContent).toContain('--color-error:');
      expect(cssContent).toContain('--color-warning:');
      expect(cssContent).toContain('--color-info:');
    });

    it('should define text colors', () => {
      expect(cssContent).toContain('--color-text-primary:');
      expect(cssContent).toContain('--color-text-secondary:');
      expect(cssContent).toContain('--color-text-muted:');
      expect(cssContent).toContain('--color-text-inverse:');
    });

    it('should define background colors', () => {
      expect(cssContent).toContain('--color-bg-primary:');
      expect(cssContent).toContain('--color-bg-secondary:');
      expect(cssContent).toContain('--color-bg-muted:');
      expect(cssContent).toContain('--color-bg-surface:');
    });

    it('should define dark theme overrides', () => {
      // The new design system uses :root[data-theme="dark"] to override tokens
      // Check that dark theme selector exists
      expect(cssContent).toContain(':root[data-theme="dark"]');
      
      // Check that dark mode color variants are defined
      expect(cssContent).toContain('--clr-primary-dark-a0:');
      expect(cssContent).toContain('--clr-surface-dark-a0:');
      expect(cssContent).toContain('--clr-success-dark-a0:');
      expect(cssContent).toContain('--clr-danger-dark-a0:');
      expect(cssContent).toContain('--clr-warning-dark-a0:');
      expect(cssContent).toContain('--clr-info-dark-a0:');
      
      // Check that dark theme overrides backward compatibility mappings
      expect(cssContent).toContain(':root[data-theme="dark"]');
      // Verify that tokens are overridden in dark mode (not separate -dark tokens)
      const darkThemeSection = cssContent.split(':root[data-theme="dark"]')[1];
      expect(darkThemeSection).toContain('--color-bg-primary:');
      expect(darkThemeSection).toContain('--color-text-primary:');
      expect(darkThemeSection).toContain('--color-primary:');
    });
  });

  describe('Typography', () => {
    it('should define font families', () => {
      expect(cssContent).toContain('--font-family-base:');
      expect(cssContent).toContain('--font-family-heading:');
      expect(cssContent).toContain('--font-family-mono:');
    });

    it('should define font sizes', () => {
      const fontSizes = [
        '--font-size-xs:',
        '--font-size-sm:',
        '--font-size-base:',
        '--font-size-lg:',
        '--font-size-xl:',
        '--font-size-2xl:',
        '--font-size-3xl:',
        '--font-size-4xl:',
        '--font-size-5xl:',
        '--font-size-6xl:',
      ];

      fontSizes.forEach((size) => {
        expect(cssContent).toContain(size);
      });
    });

    it('should define font weights', () => {
      expect(cssContent).toContain('--font-weight-normal:');
      expect(cssContent).toContain('--font-weight-medium:');
      expect(cssContent).toContain('--font-weight-semibold:');
      expect(cssContent).toContain('--font-weight-bold:');
    });

    it('should define line heights', () => {
      expect(cssContent).toContain('--line-height-tight:');
      expect(cssContent).toContain('--line-height-normal:');
      expect(cssContent).toContain('--line-height-relaxed:');
    });
  });

  describe('Spacing', () => {
    it('should define spacing scale', () => {
      const spacing = [
        '--spacing-xs:',
        '--spacing-sm:',
        '--spacing-md:',
        '--spacing-lg:',
        '--spacing-xl:',
        '--spacing-2xl:',
        '--spacing-3xl:',
        '--spacing-4xl:',
      ];

      spacing.forEach((space) => {
        expect(cssContent).toContain(space);
      });
    });
  });

  describe('Breakpoints', () => {
    it('should define responsive breakpoints', () => {
      expect(cssContent).toContain('--breakpoint-xs:');
      expect(cssContent).toContain('--breakpoint-sm:');
      expect(cssContent).toContain('--breakpoint-md:');
      expect(cssContent).toContain('--breakpoint-lg:');
      expect(cssContent).toContain('--breakpoint-xl:');
    });
  });

  describe('Border Radius', () => {
    it('should define radius values', () => {
      expect(cssContent).toContain('--radius-sm:');
      expect(cssContent).toContain('--radius-md:');
      expect(cssContent).toContain('--radius-lg:');
      expect(cssContent).toContain('--radius-xl:');
      expect(cssContent).toContain('--radius-full:');
    });
  });

  describe('Shadows', () => {
    it('should define shadow system', () => {
      expect(cssContent).toContain('--shadow-xs:');
      expect(cssContent).toContain('--shadow-sm:');
      expect(cssContent).toContain('--shadow-md:');
      expect(cssContent).toContain('--shadow-lg:');
      expect(cssContent).toContain('--shadow-xl:');
    });
  });

  describe('Transitions', () => {
    it('should define transition timings', () => {
      expect(cssContent).toContain('--transition-fast:');
      expect(cssContent).toContain('--transition-base:');
      expect(cssContent).toContain('--transition-slow:');
    });
  });

  describe('Z-Index Layers', () => {
    it('should define z-index values', () => {
      expect(cssContent).toContain('--z-index-base:');
      expect(cssContent).toContain('--z-index-dropdown:');
      expect(cssContent).toContain('--z-index-modal:');
      expect(cssContent).toContain('--z-index-tooltip:');
    });
  });

  describe('Token Consistency', () => {
    it('should use consistent naming convention', () => {
      // All tokens should start with --
      const tokenPattern = /--[a-z-]+:/g;
      const tokens = cssContent.match(tokenPattern);
      expect(tokens).toBeTruthy();
      expect(tokens.length).toBeGreaterThan(0);

      // All tokens should use kebab-case
      tokens.forEach((token) => {
        const name = token.replace('--', '').replace(':', '');
        expect(name).toMatch(/^[a-z]+(-[a-z]+)*$/);
      });
    });

    it('should have responsive typography adjustments', () => {
      expect(cssContent).toContain('@media (max-width: 768px)');
      expect(cssContent).toContain('@media (max-width: 480px)');
    });
  });
});

