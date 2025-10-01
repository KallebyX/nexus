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
    "**/__tests__/**/*.js",
    "**/?(*.)+(spec|test).js"
  ],
  "coveragePathIgnorePatterns": [
    "/node_modules/",
    "/coverage/",
    "/.git/",
    "/docs/"
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
