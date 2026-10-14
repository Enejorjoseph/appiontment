import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // The application is entirely database- and request-driven (live availability,
  // sessions, staff edits), so opt out of the experimental Cache Components
  // prerendering model and render pages dynamically instead.
  typedRoutes: false,
  turbopack: {
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
};

export default nextConfig;
