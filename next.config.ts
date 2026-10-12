import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* ⭐ LOS TYPESCRIPT
   * ------------------------
   * Con `ignoreBuildErrors: false` un error de tipos SÍ impide desplegar,
   * que es donde tiene que fallar. Un fallo de tipos en producción es un
   * cliente que no puede entrar.
   */
  typescript: {
    ignoreBuildErrors: false,
  },

  /* ⭐ `standalone`
   * ------------------------
   * Genera una copia mínima para la imagen Docker. Sin esto, el
   * `Dockerfile` copia `.next/standalone`, esa carpeta no existe y el
   * despliegue falla sin decir por qué.
   */
  output: "standalone",
};

export default nextConfig;
