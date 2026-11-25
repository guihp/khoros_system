import type { NextConfig } from "next";

/**
 * Cabeçalhos de segurança em todas as rotas.
 * camera/microphone liberados só para a própria origem (sala de vídeo LiveKit).
 * CSP fica para uma etapa própria (LiveKit/Supabase/analytics exigem lista fina).
 */
const securityHeaders = [
  { key: "Strict-Transport-Security", value: "max-age=63072000; includeSubDomains" },
  { key: "X-Frame-Options", value: "DENY" },
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  {
    key: "Permissions-Policy",
    value: "camera=(self), microphone=(self), geolocation=(), payment=(), usb=()",
  },
];

const nextConfig: NextConfig = {
  // Imagem Docker menor (só server + deps rastreadas). Coolify/compose usam isso.
  output: "standalone",
  transpilePackages: ["@khoros/shared"],
  poweredByHeader: false,
  async headers() {
    return [{ source: "/:path*", headers: securityHeaders }];
  },
};

export default nextConfig;
