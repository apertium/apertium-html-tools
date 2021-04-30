import type { Config } from '@jest/types';

export default {
  transform: {
    '^.+\\.tsx?$': [
      'esbuild-jest',
      {
        sourcemap: true,
      },
    ],
  },
  moduleNameMapper: {
    '\\.(css)$': 'identity-obj-proxy',
    '\\.(gif|png|jpg)$': '<rootDir>/src/__mocks__/file.ts',
  },

  setupFiles: ['./src/testSetup.ts'],
  setupFilesAfterEnv: ['./src/testEnvSetup.ts'],

  collectCoverageFrom: ['src/**/*.ts', 'src/**/*.tsx'],
  coverageThreshold: {
    global: {
      branches: 20,
      functions: 30,
      lines: 40,
      statements: 40,
    },
  },
} as Config.InitialOptions;
