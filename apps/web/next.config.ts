import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Imagem Docker menor (só server + deps rastreadas). Coolify/compose usam isso.
  output: "standalone",
  transpilePackages: ["@khoros/shared"],
};

export default nextConfig;
