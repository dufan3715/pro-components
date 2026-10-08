import { vi, afterEach, beforeEach } from 'vitest';

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
export type IntersectionObserverEntry_ = {
  callback: IntersectCallback;
  elements: Set<Element>;
};
export const activeIntersectionObservers =
  new Set<IntersectionObserverEntry_>();

class MockIntersectionObserver {
  private elements = new Set<Element>();
  private entry: IntersectionObserverEntry_;

  constructor(callback: IntersectCallback) {
    this.entry = { callback, elements: this.elements };
    activeIntersectionObservers.add(this.entry);
  }

  observe(element: Element) {
    this.elements.add(element);
  }

  unobserve(element: Element) {
    this.elements.delete(element);
  }

  disconnect() {
    this.elements.clear();
    activeIntersectionObservers.delete(this.entry);
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
// M6: 未放行告警守卫（未被用例显式消音的 console 告警即判失败）
// ----------------------------------------------------
/**
 * 放行的宿主机噪声：@v-c/trigger 校验触发元素与弹出层 shadow root 一致性时输出，
 * happy-dom 不实现 shadow root 语义，弹出层经 Teleport 渲染时必然命中
 */
const HOST_NOISE_PATTERNS: RegExp[] = [
  /^Warning: trigger element and popup element should in same shadow root\./,
];
const originalWarn = console.warn.bind(console);
const originalError = console.error.bind(console);
const unexpectedLogs: string[] = [];
const formatLog = (args: unknown[]) =>
  args.map(arg => (typeof arg === 'string' ? arg : String(arg))).join(' ');
const recordLog = (level: 'warn' | 'error', args: unknown[]) => {
  const msg = formatLog(args);
  if (!HOST_NOISE_PATTERNS.some(pattern => pattern.test(msg))) {
    unexpectedLogs.push(`[console.${level}] ${msg}`);
  }
  (level === 'warn' ? originalWarn : originalError)(...args);
};

console.warn = (...args: any[]) => recordLog('warn', args);
console.error = (...args: any[]) => recordLog('error', args);

// ----------------------------------------------------
// M5: 清理钩子
// ----------------------------------------------------
beforeEach(() => {
  unexpectedLogs.length = 0;
});

afterEach(() => {
  activeResizeObservers.clear();
  activeIntersectionObservers.clear();
  const logs = unexpectedLogs.splice(0);
  if (logs.length > 0) {
    throw new Error(
      `检测到未放行告警，如需放行请在用例内以 vi.spyOn(console, 'warn' | 'error') 显式断言：\n${logs.join('\n')}`
    );
  }
});
