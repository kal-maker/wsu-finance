/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: ["class"],
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    container: {
      center: true,
      padding: "2rem",
      screens: {
        xs: "480px",
        ...require("tailwindcss/defaultTheme").screens,
      },
    },
    extend: {
      colors: {
        border: "hsl(var(--border))",
        input: "hsl(var(--input))",
        ring: "hsl(var(--ring))",
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        primary: {
          DEFAULT: "hsl(var(--primary))",
          foreground: "hsl(var(--primary-foreground))",
        },
        secondary: {
          DEFAULT: "hsl(var(--secondary))",
          foreground: "hsl(var(--secondary-foreground))",
        },
        destructive: {
          DEFAULT: "hsl(var(--destructive))",
          foreground: "hsl(var(--destructive-foreground))",
        },
        muted: {
          DEFAULT: "hsl(var(--muted))",
          foreground: "hsl(var(--muted-foreground))",
        },
        accent: {
          DEFAULT: "hsl(var(--accent))",
          foreground: "hsl(var(--accent-foreground))",
        },
        popover: {
          DEFAULT: "hsl(var(--popover))",
          foreground: "hsl(var(--popover-foreground))",
        },
        card: {
          DEFAULT: "hsl(var(--card))",
          foreground: "hsl(var(--card-foreground))",
        },
        // Navy shades for dark backgrounds
        navy: {
          50: '#f0f9ff',
          100: '#e0f2fe',
          200: '#bae6fd',
          300: '#7dd3fc',
          400: '#38bdf8',
          500: '#0ea5e9',
          600: '#0284c7',
          700: '#0369a1',
          800: '#075985',
          900: '#0c4a6e',
        },
        // Cyan shades for primary accents
        cyan: {
          50: '#f0fdff',
          100: '#ccfbff',
          200: '#99f6ff',
          300: '#66e6ff',
          400: '#33d1ff',
          500: '#00bcd4',
          600: '#00a0b4',
          700: '#008494',
          800: '#006874',
          900: '#004d54',
        },
        // Aqua shades for gradients
        aqua: {
          50: '#f0fffe',
          100: '#ccfffc',
          200: '#99fff9',
          300: '#66fff6',
          400: '#33fff3',
          500: '#00fff0',
          600: '#00e0d4',
          700: '#00c2b8',
          800: '#00a39c',
          900: '#00857f',
        },
        // Turquoise shades for additional accents
        turquoise: {
          50: '#f0fffd',
          100: '#ccfffa',
          200: '#99fff5',
          300: '#66fff0',
          400: '#33ffeb',
          500: '#00ffe6',
          600: '#00e0ca',
          700: '#00c2ae',
          800: '#00a392',
          900: '#008576',
        },
      },
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
      },
      animation: {
        'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'pulse-delay': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite 1s',
        'fade-in-up': 'fadeInUp 0.8s ease-out',
        'fade-in-down': 'fadeInDown 0.8s ease-out',
        "accordion-down": "accordion-down 0.2s ease-out",
        "accordion-up": "accordion-up 0.2s ease-out",
      },
      keyframes: {
        fadeInUp: {
          '0%': { opacity: '0', transform: 'translateY(50px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        fadeInDown: {
          '0%': { opacity: '0', transform: 'translateY(-50px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        "accordion-down": {
          from: { height: 0 },
          to: { height: "var(--radix-accordion-content-height)" },
        },
        "accordion-up": {
          from: { height: "var(--radix-accordion-content-height)" },
          to: { height: 0 },
        },
      },
      backgroundImage: {
        'gradient-radial': 'radial-gradient(var(--tw-gradient-stops))',
        'gradient-conic': 'conic-gradient(from 180deg at 50% 50%, var(--tw-gradient-stops))',
        'hero-gradient': 'linear-gradient(135deg, rgba(12, 74, 110, 0.9) 0%, rgba(0, 168, 107, 0.8) 100%)',
        'text-gradient': 'linear-gradient(135deg, #00bcd4 0%, #00fff0 100%)',
      },
      backdropBlur: {
        xs: '2px',
      },
      boxShadow: {
        'glow-cyan': '0 0 20px rgba(0, 188, 212, 0.3)',
        'glow-aqua': '0 0 20px rgba(0, 255, 240, 0.3)',
      },
    },
  },
  plugins: [require("tailwindcss-animate")],
}