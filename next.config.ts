import type { NextConfig } from "next";
import { baseURL } from "./baseUrl";
import path from "path";

const stubPath = path.resolve('./lib/keyv-stub.js');

const nextConfig: NextConfig = {
  assetPrefix: baseURL,
  turbopack: {
    resolveAlias: {
      // Alias optional keyv adapters to stub module
      '@keyv/redis': stubPath,
      '@keyv/mongo': stubPath,
      '@keyv/sqlite': stubPath,
      '@keyv/postgres': stubPath,
      '@keyv/mysql': stubPath,
      '@keyv/etcd': stubPath,
      '@keyv/offline': stubPath,
      '@keyv/tiered': stubPath,
    },
  },
};

export default nextConfig;
