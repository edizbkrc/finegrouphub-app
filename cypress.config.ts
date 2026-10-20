import { defineConfig } from "cypress";

export default defineConfig({
  e2e: {
    setupNodeEvents(_on, config) {
      return config;
    },
    baseUrl: "http://localhost:3000",
    testIsolation: false,
    env: {
      apiUrl: process.env.NEXT_PUBLIC_API_URL,
      testUser: process.env.CYPRESS_TEST_USER || "testUser",
      testPassword: process.env.CYPRESS_TEST_PASSWORD || "testUser",
    },
    viewportHeight: 1080,
    viewportWidth: 1920,
  },

  component: {
    devServer: {
      framework: "next",
      bundler: "webpack",
    },
  },
});
