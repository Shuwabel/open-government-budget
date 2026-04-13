import { vi } from 'vitest';
import '@testing-library/jest-dom';

// Mock Next.js modules
vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push: vi.fn(),
    replace: vi.fn(),
    prefetch: vi.fn(),
    back: vi.fn(),
    forward: vi.fn(),
    refresh: vi.fn(),
  }),
  usePathname: () => '/test',
  useSearchParams: () => new URLSearchParams(),
  useParams: () => ({}),
}));

// Mock Next.js Image component
vi.mock('next/image', () => ({
  default: ({ src, alt, ...props }: any) => (
    <img src={src} alt={alt} {...props} />
  ),
}));

// Mock Next.js Link component
vi.mock('next/link', () => ({
  default: ({ children, href, ...props }: any) => (
    <a href={href} {...props}>
      {children}
    </a>
  ),
}));

// Mock environment variables
Object.defineProperty(process.env, 'NEXT_PUBLIC_SUPABASE_URL', {
  value: 'https://test.supabase.co',
  writable: true,
});

Object.defineProperty(process.env, 'NEXT_PUBLIC_SUPABASE_ANON_KEY', {
  value: 'test-anon-key',
  writable: true,
});

Object.defineProperty(process.env, 'SUPABASE_SERVICE_ROLE_KEY', {
  value: 'test-service-role-key',
  writable: true,
});

Object.defineProperty(process.env, 'NEXT_PUBLIC_POLYGON_RPC_URL', {
  value: 'https://polygon-rpc.com',
  writable: true,
});

Object.defineProperty(process.env, 'NEXT_PUBLIC_BUDGET_CONTRACT_ADDRESS', {
  value: '0x' + 'a'.repeat(40),
  writable: true,
});

Object.defineProperty(process.env, 'NEXT_PUBLIC_CERTIFICATE_CONTRACT_ADDRESS', {
  value: '0x' + 'b'.repeat(40),
  writable: true,
});

// Mock Web3 providers
global.ethereum = {
  isMetaMask: true,
  request: vi.fn(),
  on: vi.fn(),
  removeListener: vi.fn(),
} as any;

// Mock fetch
global.fetch = vi.fn();

// Mock File API
global.File = class File {
  constructor(
    public content: any[],
    public name: string,
    public options: any = {}
  ) {}
};

global.FileReader = class FileReader {
  result: string | null = null;
  onload: ((event: any) => void) | null = null;
  onerror: ((event: any) => void) | null = null;

  readAsText(file: File) {
    setTimeout(() => {
      this.result = 'test content';
      if (this.onload) {
        this.onload({ target: { result: this.result } });
      }
    }, 0);
  }
};

// Mock crypto
Object.defineProperty(global, 'crypto', {
  value: {
    getRandomValues: (arr: any) => {
      for (let i = 0; i < arr.length; i++) {
        arr[i] = Math.floor(Math.random() * 256);
      }
      return arr;
    },
    subtle: {
      digest: vi.fn(),
      importKey: vi.fn(),
      sign: vi.fn(),
      verify: vi.fn(),
    },
  },
});

// Mock ResizeObserver
global.ResizeObserver = vi.fn().mockImplementation(() => ({
  observe: vi.fn(),
  unobserve: vi.fn(),
  disconnect: vi.fn(),
}));

// Mock IntersectionObserver
global.IntersectionObserver = vi.fn().mockImplementation(() => ({
  observe: vi.fn(),
  unobserve: vi.fn(),
  disconnect: vi.fn(),
}));

// Mock matchMedia
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: vi.fn().mockImplementation(query => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: vi.fn(), // deprecated
    removeListener: vi.fn(), // deprecated
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  })),
});

// Mock clipboard API
Object.defineProperty(navigator, 'clipboard', {
  value: {
    writeText: vi.fn().mockResolvedValue(undefined),
    readText: vi.fn().mockResolvedValue(''),
  },
});

// Mock URL.createObjectURL
global.URL.createObjectURL = vi.fn(() => 'blob:test-url');
global.URL.revokeObjectURL = vi.fn();

// Mock console methods to reduce noise in tests
const originalConsoleError = console.error;
const originalConsoleWarn = console.warn;

console.error = (...args: any[]) => {
  if (
    typeof args[0] === 'string' &&
    (args[0].includes('Warning:') || args[0].includes('Error:'))
  ) {
    return;
  }
  originalConsoleError.call(console, ...args);
};

console.warn = (...args: any[]) => {
  if (
    typeof args[0] === 'string' &&
    args[0].includes('Warning:')
  ) {
    return;
  }
  originalConsoleWarn.call(console, ...args);
};

// Clean up after each test
afterEach(() => {
  vi.clearAllMocks();
});

