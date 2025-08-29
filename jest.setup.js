// Jest setup file for client tests - simplified approach
const { TextEncoder, TextDecoder } = require('util');

// Add TextEncoder and TextDecoder to global scope
global.TextEncoder = TextEncoder;
global.TextDecoder = TextDecoder;

// Create minimal window mock
global.window = {
  location: {
    hostname: 'localhost',
    protocol: 'http:',
    href: 'http://localhost:3000',
    pathname: '/',
    search: '',
    hash: ''
  },
  localStorage: {
    getItem: jest.fn(),
    setItem: jest.fn(),
    removeItem: jest.fn(),
    clear: jest.fn()
  }
};

// Mock document
global.document = {};

// Mock navigator
global.navigator = {};

// Mock fetch
global.fetch = jest.fn();

// Mock console methods to reduce noise in tests
const originalConsole = { ...console };
global.beforeAll(() => {
  console.log = jest.fn();
  console.info = jest.fn();
  console.warn = jest.fn();
  console.error = jest.fn();
});

global.afterAll(() => {
  Object.assign(console, originalConsole);
});