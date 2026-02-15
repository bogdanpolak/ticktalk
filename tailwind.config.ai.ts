/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './app/**/*.{js,ts,jsx,tsx}',
    './components/**/*.{js,ts,jsx,tsx}',
  ],
  theme: {
    extend: {
      colors: {
        // Surfaces
        surface: {
          DEFAULT: '#0F172A',
          elevated: '#1E293B',
          subtle: '#334155',
        },
        // Text
        text: {
          primary: '#F8FAFC',
          secondary: '#CBD5E1',
          muted: '#94A3B8',
        },
        // Brand
        brand: {
          DEFAULT: '#5B8DEF',
          hover: '#4F46E5',
          active: '#3730A3',
          subtle: '#1E293B',
        },
        // Status
        success: '#22C55E',
        warning: '#F59E0B',
        error: '#EF4444',
        info: '#3B82F6',
        // Additional
        border: '#475569',
        'focus-ring': '#5B8DEF',
      },
      spacing: {
        xs: '4px',
        s: '8px',
        m: '16px',
        l: '24px',
        xl: '32px',
        xxl: '48px',
      },
      borderRadius: {
        none: '0px',
        sm: '4px',
        md: '8px',
        lg: '12px',
      },
      fontSize: {
        display: ['64px', { lineHeight: '1.2', fontWeight: '500' }],
        'headline-lg': ['32px', { lineHeight: '1.3', fontWeight: '500' }],
        'headline-md': ['24px', { lineHeight: '1.3', fontWeight: '500' }],
        'headline-sm': ['18px', { lineHeight: '1.4', fontWeight: '500' }],
        base: ['14px', { lineHeight: '1.5', fontWeight: '400' }],
        label: ['12px', { lineHeight: '1.4', fontWeight: '500' }],
        caption: ['11px', { lineHeight: '1.4', fontWeight: '400' }],
      },
      fontFamily: {
        base: [
          'Inter',
          '-apple-system',
          'BlinkMacSystemFont',
          '"Segoe UI"',
          'sans-serif',
        ],
      },
      boxShadow: {
        sm: '0 1px 2px 0 rgba(0, 0, 0, 0.5)',
        md: '0 4px 6px -1px rgba(0, 0, 0, 0.5), 0 2px 4px -1px rgba(0, 0, 0, 0.3)',
      },
      backgroundColor: (theme: (key: string) => any) => ({
        ...theme('colors'),
        'focus-ring': 'transparent', // Focus ring is outline, not bg
      }),
      outline: {
        focus: ['2px solid #5B8DEF', '0px'],
      },
      transitionDuration: {
        150: '150ms',
        200: '200ms',
      },
      transitionTimingFunction: {
        'ease-out': 'ease-out',
      },
    },
  },
  plugins: [
    function ({ addBase, addUtilities }: { addBase: (config: unknown) => void; addUtilities: (config: unknown) => void }) {
      // Global base styles for dark mode
      addBase({
        'html, body': {
          backgroundColor: '#0F172A',
          color: '#F8FAFC',
          fontFamily:
            'Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
        },
      });

      // Utility for focus ring (preferred over Tailwind's default)
      addUtilities({
        '@layer utilities': {
          '.focus-ring': {
            '@apply outline-none ring-2 ring-brand ring-offset-0':
              {},
          },
          '.focus-ring-inset': {
            '@apply outline-none ring-2 ring-inset ring-brand':
              {},
          },
          '.text-ellipsis-overflow': {
            '@apply overflow-hidden text-ellipsis whitespace-nowrap':
              {},
          },
          '.min-touch-target': {
            '@apply min-h-[44px] min-w-[44px]': {},
          },
        },
      });
    },
  ],
};
