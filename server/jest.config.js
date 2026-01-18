module.exports = {
  preset: "ts-jest",
  testEnvironment: "node",
  testMatch: ["**/tests/**/*.test.ts"],
  clearMocks: true,
  globals: {
    "ts-jest": {
      tsconfig: "tsconfig.test.json",
    },
  },
};
