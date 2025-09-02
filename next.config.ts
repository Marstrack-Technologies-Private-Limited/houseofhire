import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  typescript: {
    ignoreBuildErrors: true,
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "placehold.co",
        port: "",
        pathname: "/**",
      },
      {
        protocol: "https",
        hostname: "picsum.photos",
        port: "",
        pathname: "/**",
      },
    ],
  },
  // Suppress Handlebars `require.extensions` warnings and avoid bundling it on the server
  webpack: (config, { isServer }) => {
    if (isServer) {
      const originalExternals = config.externals;
      const asCommonJs = (pkg) => `commonjs ${pkg}`;

      if (Array.isArray(originalExternals)) {
        config.externals = [...originalExternals, "handlebars", "dotprompt"];
      } else if (typeof originalExternals === "function") {
        config.externals = async (context, request, callback) => {
          if (["handlebars", "dotprompt"].includes(request)) {
            return callback(undefined, asCommonJs(request));
          }
          return (originalExternals as any)(context, request, callback);
        };
      } else {
        config.externals = ["handlebars", "dotprompt"];
      }
    }

    // Hide noisy warnings from Webpack about require.extensions
    config.ignoreWarnings = [
      ...(config.ignoreWarnings || []),
      /require\.extensions/,
    ];
    return config;
  },
};

export default nextConfig;
