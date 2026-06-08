import type { Config } from 'tailwindcss'

const config: Config = {
  content: [
    './app/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './lib/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        // Neutrals (cool slate)
        bg:             'oklch(0.985 0.004 240)',
        surface:        '#ffffff',
        'surface-2':    'oklch(0.975 0.005 240)',
        'surface-3':    'oklch(0.962 0.006 240)',
        border:         'oklch(0.922 0.006 240)',
        'border-strong':'oklch(0.86 0.009 240)',
        text:           'oklch(0.29 0.021 246)',
        'text-muted':   'oklch(0.50 0.018 246)',
        'text-faint':   'oklch(0.62 0.014 246)',

        // Accent (deep clinical blue)
        accent: {
          DEFAULT: '#0369a1',
          50:      '#eff6fb',
          100:     '#dcebff',
          600:     '#0284c7',
          700:     '#0369a1',
          800:     '#075985',
          tint:    'oklch(0.96 0.018 238)',
          'tint-2':'oklch(0.93 0.03 238)',
          on:      '#ffffff',
        },

        // Confidence levels (text/bg/border per level)
        confidence: {
          hi: {
            text: '#15803d',
            bg:   '#e7f7ec',
            bd:   '#a7e0b8',
          },
          med: {
            text: '#b45309',
            bg:   '#fdf3df',
            bd:   '#f3d18a',
          },
          low: {
            text: '#be123c',
            bg:   '#fdeaee',
            bd:   '#f4b3c1',
          },
        },

        // Semantic status
        ok: {
          text: '#15803d',
          bg:   '#e7f7ec',
          bd:   '#a7e0b8',
        },
        warn: {
          text: '#b45309',
          bg:   '#fdf3df',
          bd:   '#f3d18a',
        },
        crit: {
          text: '#be123c',
          bg:   '#fdeaee',
          bd:   '#f4b3c1',
        },
      },

      fontFamily: {
        sans: ['"IBM Plex Sans"', 'system-ui', '-apple-system', 'sans-serif'],
        mono: ['"IBM Plex Mono"', 'ui-monospace', '"SF Mono"', 'Menlo', 'monospace'],
      },

      borderRadius: {
        xs: '5px',
        sm: '7px',
        md: '10px',
        lg: '14px',
        xl: '20px',
      },

      boxShadow: {
        'sh-1': '0 1px 2px rgba(15,33,54,0.05), 0 1px 1px rgba(15,33,54,0.04)',
        'sh-2': '0 2px 6px rgba(15,33,54,0.06), 0 1px 2px rgba(15,33,54,0.05)',
        'sh-3': '0 8px 28px rgba(15,33,54,0.10), 0 2px 8px rgba(15,33,54,0.06)',
        'sh-4': '0 18px 50px rgba(15,33,54,0.16), 0 6px 16px rgba(15,33,54,0.08)',
      },
    },
  },
  plugins: [],
}

export default config
