/** @type {import('jest').Config} */
module.exports = {
  preset: "ts-jest",
  testEnvironment: "jsdom",
  roots: ["<rootDir>/src", "<rootDir>/tests"],
  testMatch: ["**/*.test.ts", "**/*.test.tsx"],
  // macOS AppleDouble (._*) cop dosyalari test sanilmasin
  testPathIgnorePatterns: ["/node_modules/", "/\\._"],
  setupFilesAfterEnv: ["<rootDir>/tests/setup.ts"],
  moduleNameMapper: {
    "^@layout/(.*)$": "<rootDir>/src/common/layout/$1",
    "^@opsTable/(.*)$": "<rootDir>/src/common/opsTable/$1",
    "^@common/(.*)$": "<rootDir>/src/common/$1",
    "^@components/(.*)$": "<rootDir>/src/components/$1",
    "^@enums/(.*)$": "<rootDir>/src/enums/$1",
    "^@features/(.*)$": "<rootDir>/src/features/$1",
    "^@forms/(.*)$": "<rootDir>/src/forms/$1",
    "^@helpers/(.*)$": "<rootDir>/src/helpers/$1",
    "^@hooks/(.*)$": "<rootDir>/src/hooks/$1",
    "^@network/(.*)$": "<rootDir>/src/network/$1",
    "^@redux/(.*)$": "<rootDir>/src/redux/$1",
    "^@/(.*)$": "<rootDir>/src/$1",
  },
  transform: {
    "^.+\\.tsx?$": [
      "ts-jest",
      { tsconfig: { jsx: "react-jsx", esModuleInterop: true } },
    ],
  },
};
