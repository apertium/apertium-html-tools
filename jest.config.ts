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
  timers: 'modern',

  setupFiles: ['./src/testSetup.ts'],
  setupFilesAfterEnv: ['./src/testEnvSetup.ts'],

  collectCoverageFrom: ['src/**/*.ts', 'src/**/*.tsx'],
  coverageThreshold: {
    global: {
      branches: 75,
      functions: 90,
      lines: 90,
      statements: 90,
    },
  },
} as Config.InitialOptions;
