/* PostCSS: Tailwind v4 va como plugin de PostCSS.
 *
 * En Tailwind v4 no hay `tailwind.config.js` por defecto: la
 * configuración son las variables de `@theme` de `globals.css`.
 *
 * Se escribe como `.mjs` porque el proyecto no declara
 * `"type": "module"`: un `.js` con `export` no arranca. */
export default {
  plugins: {
    "@tailwindcss/postcss": {},
  },
};
