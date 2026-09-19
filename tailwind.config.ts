import type { Config } from 'tailwindcss';

const config: Config = {
  content: [
    './src/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          // Colores principales de la marca
          sand: '#f2cb90',
          blue: '#155b9f',
          black: '#000000',
          
          // Escala de grises oficial (Porcentajes de Process Black)
          gray: {
            75: '#404040',
            50: '#808080',
            25: '#bfbfbf',
          }
        },
      },
      fontFamily: {
        // Tipografía Institucional Exclusiva para Titulares
        crumafood: ['Crumafood', 'sans-serif'],
        
        // Tipografía para textos secundarios o destacados
        grocry: ['Grocry', 'sans-serif'],
        
        // Tipografía Primaria Corporativa (Audiovisuales, banners, merchandising)
        arkibal: ['Arkibal Mono', 'monospace'],
      },
    },
  },
  plugins: [],
};

export default config;
