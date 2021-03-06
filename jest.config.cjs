/** @type {import('ts-jest/dist/types').InitialOptionsTsJest} */
module.exports = {
  preset: 'ts-jest/presets/default-esm',
  modulePaths: [
    "<rootDir>/src/"
  ],
  testPathIgnorePatterns: [
    "dist"
  ],
  collectCoverageFrom: [
    "src/**/*.ts"
  ],
  globals: {
    'ts-jest': {
      tsconfig: 'tsconfig.json'
    },
  }
};
