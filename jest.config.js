export default {
  "testEnvironment": "node",
  "transform": {
    "^.+\\.js$": "babel-jest"
  },
  "collectCoverage": true,
  "coverageDirectory": "coverage",
  "coverageReporters": [
    "text",
    "lcov",
    "html"
  ],
  "testMatch": [
    "**/__tests__/**/*.test.js",
    "**/?(*.)+(spec|test).js"
  ],
  "testPathIgnorePatterns": [
    "/node_modules/",
    "/__tests__/helpers/",
    "/__tests__/mocks/",
    "/__tests__/fixtures/"
  ],
  "coveragePathIgnorePatterns": [
    "/node_modules/",
    "/coverage/",
    "/.git/",
    "/docs/",
    "/__tests__/"
  ],
  "setupFilesAfterEnv": [
    "<rootDir>/jest.setup.js"
  ],
  "verbose": true,
  "collectCoverageFrom": [
    "modules/**/*.js",
    "scripts/**/*.js",
    "cli/**/*.js",
    "utils/**/*.js",
    "!**/__tests__/**",
    "!**/node_modules/**"
  ]
};
