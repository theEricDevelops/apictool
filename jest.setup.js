// Add any custom setup for your tests here
import '@testing-library/jest-dom';

// If you need to mock window or other browser APIs
if (typeof window !== 'undefined') {
  // Add any window mocks here
}

// If you need to mock Next.js specific features
jest.mock('next/router', () => ({
  useRouter() {
    return {
      route: '/',
      pathname: '',
      query: '',
      asPath: '',
      push: jest.fn(),
      events: {
        on: jest.fn(),
        off: jest.fn()
      },
      beforePopState: jest.fn(() => null),
      prefetch: jest.fn(() => null)
    };
  },
}));

// Add any global mocks or setup here
