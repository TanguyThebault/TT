import type { Config } from "tailwindcss";
import animate from "tailwindcss-animate";
import typography from "@tailwindcss/typography";

export default {
  darkMode: ["class"],
  content: [
    "./pages/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
    "./app/**/*.{ts,tsx}",
    "./src/**/*.{ts,tsx}",
  ],
  prefix: "",
  theme: {
    container: {
      center: true,
      padding: '2rem',
      screens: {
        '2xl': '1400px'
      }
    },
    extend: {
      fontFamily: {
        mono: ['JetBrains Mono', 'Share Tech Mono', 'monospace'],
        sans: ['Inter', 'sans-serif'],
      },
      borderRadius: {
        lg: 'calc(var(--radius) + 2px)',
        md: 'var(--radius)',
        sm: 'calc(var(--radius) - 2px)'
      },
      colors: {
        // Inherited shadcn tokens (keep as-is)
        border:      'hsl(var(--border))',
        input:       'hsl(var(--input))',
        ring:        'hsl(var(--ring))',
        background:  'hsl(var(--background))',
        foreground:  'hsl(var(--foreground))',
        primary:     { DEFAULT: 'hsl(var(--primary))', foreground: 'hsl(var(--primary-foreground))' },
        secondary:   { DEFAULT: 'hsl(var(--secondary))', foreground: 'hsl(var(--secondary-foreground))' },
        destructive: { DEFAULT: 'hsl(var(--destructive))', foreground: 'hsl(var(--destructive-foreground))' },
        muted:       { DEFAULT: 'hsl(var(--muted))', foreground: 'hsl(var(--muted-foreground))' },
        accent:      { DEFAULT: 'hsl(var(--accent))', foreground: 'hsl(var(--accent-foreground))' },
        popover:     { DEFAULT: 'hsl(var(--popover))', foreground: 'hsl(var(--popover-foreground))' },
        card:        { DEFAULT: 'hsl(var(--card))', foreground: 'hsl(var(--card-foreground))' },
        sidebar: {
          DEFAULT:              'hsl(var(--sidebar-background))',
          foreground:           'hsl(var(--sidebar-foreground))',
          primary:              'hsl(var(--sidebar-primary))',
          'primary-foreground': 'hsl(var(--sidebar-primary-foreground))',
          accent:               'hsl(var(--sidebar-accent))',
          'accent-foreground':  'hsl(var(--sidebar-accent-foreground))',
          border:               'hsl(var(--sidebar-border))',
          ring:                 'hsl(var(--sidebar-ring))',
        },
        // Custom palette
        rust: {
          50:  '#fdf3ec', 100: '#fbe0cc', 200: '#f5be9a',
          300: '#ee946a', 400: '#e86b3e', 500: '#c9481e',
          600: '#a03418', 700: '#7d2815', 800: '#641f13',
          900: '#521911', 950: '#2d0a06',
        },
        phosphor: {
          50:  '#fffbea', 100: '#fff3c4', 200: '#ffe484',
          300: '#ffd043', 400: '#fbbf24', 500: '#f5a008',
          600: '#d97706', 700: '#b45309', 800: '#92400e',
          900: '#78350f', 950: '#431a03',
        },
        military: {
          50:  '#f3f6ed', 100: '#e5eed8', 200: '#cadfb4',
          300: '#a8c887', 400: '#87b260', 500: '#6a9540',
          600: '#527832', 700: '#3f5e28', 800: '#334b22',
          900: '#2b401e', 950: '#14210d',
        },
      },
      keyframes: {
        'accordion-down': {
          from: { height: '0' },
          to:   { height: 'var(--radix-accordion-content-height)' },
        },
        'accordion-up': {
          from: { height: 'var(--radix-accordion-content-height)' },
          to:   { height: '0' },
        },
        'fade-in':  { from: { opacity: '0' },                              to: { opacity: '1' } },
        'slide-in': { from: { transform: 'translateY(10px)', opacity: '0' }, to: { transform: 'translateY(0)', opacity: '1' } },
        'wl-flicker': {
          '0%, 89%, 91%, 93%, 96%, 100%': { opacity: '1'   },
          '90%': { opacity: '0.18' },
          '92%': { opacity: '0.7'  },
          '94%': { opacity: '0.45' },
          '95%': { opacity: '1'    },
        },
        'wl-phosphor': {
          '0%, 100%': { textShadow: '0 0 4px rgba(200,130,22,0.22), 0 0 1px rgba(200,130,22,0.5)' },
          '50%':      { textShadow: '0 0 10px rgba(220,150,30,0.55), 0 0 3px rgba(220,150,30,0.85)' },
        },
        'wl-corrode': {
          '0%, 100%': { borderColor: 'rgba(110,58,10,0.28)' },
          '40%':      { borderColor: 'rgba(145,78,14,0.42)' },
          '70%':      { borderColor: 'rgba(92,46,7,0.22)'   },
        },
      },
      animation: {
        'accordion-down': 'accordion-down 0.2s ease-out',
        'accordion-up':   'accordion-up 0.2s ease-out',
        'fade-in':        'fade-in 0.3s ease-out',
        'slide-in':       'slide-in 0.3s ease-out',
        'wl-flicker':     'wl-flicker 10s ease-in-out infinite',
        'wl-phosphor':    'wl-phosphor 5s ease-in-out infinite',
        'wl-corrode':     'wl-corrode 9s ease-in-out infinite',
      },
      typography: {
        DEFAULT: {
          css: {
            maxWidth: 'none',
          },
        },
      },
    }
  },
  plugins: [
    animate,
    typography,
  ],
} satisfies Config;
