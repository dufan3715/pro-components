import { vi, afterEach } from 'vitest';

// ----------------------------------------------------
// M1: window.matchMedia polyfill (antdv-next Grid / useBreakpoint)
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
// M2: ResizeObserver 可控 mock (SearchForm 高度重测)
// ----------------------------------------------------
type ResizeCallback = (entries: any[], observer: any) => void;
export const activeResizeObservers = new Set<{
  callback: ResizeCallback;
  elements: Set<Element>;
}>();

class MockResizeObserver {
  private elements = new Set<Element>();
  private callback: ResizeCallback;

  constructor(callback: ResizeCallback) {
    this.callback = callback;
    activeResizeObservers.add({ callback, elements: this.elements });
  }

  observe(element: Element) {
    this.elements.add(element);
  }

  unobserve(element: Element) {
    this.elements.delete(element);
  }

  disconnect() {
    this.elements.clear();
    activeResizeObservers.delete({
      callback: this.callback,
      elements: this.elements,
    });
  }
}

// 暴露测试辅助钩子：手动触发所有或指定元素的 Resize 回调
export const triggerResize = (targetElement?: Element) => {
  activeResizeObservers.forEach(({ callback, elements }) => {
    if (!targetElement || elements.has(targetElement)) {
      callback([{ target: targetElement, contentRect: {} } as any], {} as any);
    }
  });
};

globalThis.ResizeObserver = MockResizeObserver as any;

// ----------------------------------------------------
// M3: IntersectionObserver 可控 mock (SearchForm 隐藏字段检测)
// ----------------------------------------------------
type IntersectCallback = (entries: any[], observer: any) => void;
export const activeIntersectionObservers = new Set<{
  callback: IntersectCallback;
  elements: Set<Element>;
}>();

class MockIntersectionObserver {
  private elements = new Set<Element>();
  private callback: IntersectCallback;

  constructor(callback: IntersectCallback) {
    this.callback = callback;
    activeIntersectionObservers.add({ callback, elements: this.elements });
  }

  observe(element: Element) {
    this.elements.add(element);
  }

  unobserve(element: Element) {
    this.elements.delete(element);
  }

  disconnect() {
    this.elements.clear();
    activeIntersectionObservers.delete({
      callback: this.callback,
      elements: this.elements,
    });
  }
}

// 暴露测试辅助钩子：手动触发 Intersection 回调
export const triggerIntersect = (
  entries: Partial<IntersectionObserverEntry>[]
) => {
  activeIntersectionObservers.forEach(({ callback }) => {
    callback(entries as any, {} as any);
  });
};

globalThis.IntersectionObserver = MockIntersectionObserver as any;

// ----------------------------------------------------
// M4: Element.prototype.scrollIntoView stub (antdv-next Select/Table 依赖)
// ----------------------------------------------------
Element.prototype.scrollIntoView = vi.fn();

// ----------------------------------------------------
// M6: console.warn 白名单过滤策略（过滤预期的开发期测试噪声）
// ----------------------------------------------------
const originalWarn = console.warn.bind(console);
const originalError = console.error.bind(console);
const IGNORED_WARN_PREFIXES = [
  '[Vue warn]: Vue received a Component that was made a reactive object',
  '[Vue warn]: Invalid prop: type check failed for prop',
  '[@vue/compiler-sfc] `defineSlots` is a compiler macro',
  'please transfer a valid name path to form item!',
  '[Vue warn]: Avoid app logic that relies on enumerating keys on a component instance',
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
  activeIntersectionObservers.clear();
});
