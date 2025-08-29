module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'jsdom',
  testMatch: ['**/*.test.ts'],
  moduleFileExtensions: ['ts', 'js', 'json'],
  transform: {
    '^.+\\.ts$': 'ts-jest',
  },
  moduleNameMapper: {
    '^@server/(.*)$': '<rootDir>/server/$1',
    '^@shared/(.*)$': '<rootDir>/shared/$1'
  },
  setupFilesAfterEnv: ['<rootDir>/jest.setup.js']
};