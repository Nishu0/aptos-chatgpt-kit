import type { NextConfig } from "next";
import { baseURL } from "./baseUrl";

const nextConfig: NextConfig = {
  assetPrefix: baseURL,
  turbopack: {
    resolveAlias: {
      // Alias optional keyv adapters to stub module
      '@keyv/redis': './lib/keyv-stub.js',
      '@keyv/mongo': './lib/keyv-stub.js',
      '@keyv/sqlite': './lib/keyv-stub.js',
      '@keyv/postgres': './lib/keyv-stub.js',
      '@keyv/mysql': './lib/keyv-stub.js',
      '@keyv/etcd': './lib/keyv-stub.js',
      '@keyv/offline': './lib/keyv-stub.js',
      '@keyv/tiered': './lib/keyv-stub.js',
    },
  },
};

export default nextConfig;
