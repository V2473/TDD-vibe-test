// Mock localStorage and sessionStorage
delete global.window.localStorage;
const localStorageMock = {
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
  clear: jest.fn(),
};
global.window.localStorage = localStorageMock;

const sessionStorageMock = {
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
  clear: jest.fn(),
};
Object.defineProperty(window, 'sessionStorage', {
  value: sessionStorageMock
});

// Mock Request for API routes
class MockRequest {
  json() {
    return Promise.resolve({});
  }
  constructor() {
    // Prevent constructor error
  }
}
global.Request = MockRequest;

// Mock NextResponse globally for API route tests
jest.mock('next/server', () => ({
  NextResponse: {
    json: jest.fn((data, options = {}) => ({
      status: options.status || 200,
      json: () => Promise.resolve(data),
      statusText: options.statusText || '',
    })),
    redirect: jest.fn(),
  },
}));

// Mock external dependencies globally - support both named and default imports
jest.mock('bcrypt', () => ({
  default: {
    compare: jest.fn(),
    hash: jest.fn(),
  },
  compare: jest.fn(),
  hash: jest.fn(),
}));

jest.mock('jsonwebtoken', () => ({
  default: {
    sign: jest.fn(),
    verify: jest.fn(),
  },
  sign: jest.fn(),
  verify: jest.fn(),
}));

// Mock fetch globally
global.fetch = jest.fn();

// Mock localStorage and sessionStorage
// Create mock user methods that tests can access
const mockUserMethods = {
  findUnique: jest.fn(),
  create: jest.fn(),
  update: jest.fn(),
  delete: jest.fn(),
  findMany: jest.fn(),
};

// Global Prisma mock - support both constructor and class mocking
const MockPrismaClient = jest.fn().mockImplementation(() => ({
  user: mockUserMethods,
  $disconnect: jest.fn(),
}));

jest.mock('@/generated/prisma', () => ({
  PrismaClient: MockPrismaClient,
  __esModule: true,
}));

// Export for tests to access
global.__mockUserMethods = mockUserMethods;
global.__mockPrismaClient = MockPrismaClient;

import '@testing-library/jest-dom';