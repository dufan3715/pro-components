import { vi, afterEach } from 'vitest';

// ----------------------------------------------------
// M1: window.matchMedia polyfill
// ----------------------------------------------------
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: vi.fn().mockImplementation((query: string) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: vi.fn(),
    removeListener: vi.fn(),
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  })),
});

// ----------------------------------------------------
// M2: ResizeObserver 可控 mock
// ----------------------------------------------------
type ResizeCallback = (entries: any[], observer: any) => void;
export type ResizeObserverEntry = {
  callback: ResizeCallback;
  elements: Set<Element>;
};
export const activeResizeObservers = new Set<ResizeObserverEntry>();

class MockResizeObserver {
  private elements = new Set<Element>();
  private entry: ResizeObserverEntry;

  constructor(callback: ResizeCallback) {
    this.entry = { callback, elements: this.elements };
    activeResizeObservers.add(this.entry);
  }

  observe(element: Element) {
    this.elements.add(element);
  }

  unobserve(element: Element) {
    this.elements.delete(element);
  }

  disconnect() {
    this.elements.clear();
    activeResizeObservers.delete(this.entry);
  }
}

export const triggerResize = (targetElement?: Element) => {
  activeResizeObservers.forEach(({ callback, elements }) => {
    if (!targetElement || elements.has(targetElement)) {
      callback([{ target: targetElement, contentRect: {} } as any], {} as any);
    }
  });
};

globalThis.ResizeObserver = MockResizeObserver as any;

// ----------------------------------------------------
// M3: Element.prototype.scrollIntoView stub
// ----------------------------------------------------
Element.prototype.scrollIntoView = vi.fn();

// ----------------------------------------------------
// M4: console.warn 白名单过滤策略
// ----------------------------------------------------
const originalWarn = console.warn.bind(console);
const originalError = console.error.bind(console);
const IGNORED_WARN_PREFIXES = [
  '[Vue warn]: Vue received a Component that was made a reactive object',
  '[Vue warn]: Invalid prop: type check failed for prop',
  '[@vue/compiler-sfc] `defineSlots` is a compiler macro',
];

console.warn = (...args: any[]) => {
  const msg = typeof args[0] === 'string' ? args[0] : '';
  if (IGNORED_WARN_PREFIXES.some(prefix => msg.includes(prefix))) {
    return;
  }
  originalWarn(...args);
};

console.error = (...args: any[]) => {
  const msg = typeof args[0] === 'string' ? args[0] : '';
  if (IGNORED_WARN_PREFIXES.some(prefix => msg.includes(prefix))) {
    return;
  }
  originalError(...args);
};

// ----------------------------------------------------
// M5: 清理钩子
// ----------------------------------------------------
afterEach(() => {
  activeResizeObservers.clear();
});
