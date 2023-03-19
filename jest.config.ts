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
    '\\.(gif|png|jpg|svg)$': '<rootDir>/src/__mocks__/file.ts',
  },
  timers: 'modern',

  setupFiles: ['./src/testSetup.ts'],
  setupFilesAfterEnv: ['./src/testEnvSetup.ts'],

  collectCoverageFrom: ['src/**/*.ts', 'src/**/*.tsx'],
  coverageThreshold: {
    global: {
      branches: 90,
      functions: 95,
      lines: 95,
      statements: 95,
    },
  },
} as Config.InitialOptions;
