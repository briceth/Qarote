module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  roots: ['<rootDir>/src'],
  testMatch: ['**/__tests__/**/*.+(ts|tsx|js)', '**/?(*.)+(spec|test).+(ts|tsx|js)'],
  transform: {
    '^.+\.(ts|tsx)$': 'ts-jest',
  },
  moduleNameMapper: {
    '^../core/prisma$': '<rootDir>/src/core/__mocks__/prisma.ts', // Adjust if your prisma mock path is different
    '^../core/rabbitmq$': '<rootDir>/src/core/__mocks__/rabbitmq.ts', // Adjust if your rabbitmq mock path is different
    '^../core/auth$': '<rootDir>/src/core/__mocks__/auth.ts', // Adjust if your auth mock path is different
  },
  setupFilesAfterEnv: ['<rootDir>/src/tests/setup.ts'], // Optional: for global test setup
};
