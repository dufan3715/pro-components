import { vi, afterEach } from 'vitest';

// ----------------------------------------------------
// M1: window.matchMedia polyfill (element-plus / breakpoints)
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
// M2: ResizeObserver 可控 mock (SearchForm / ElTable 高度与布局重测)
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
// M4: Element.prototype.scrollIntoView stub (ElSelect/ElTable 依赖)
// ----------------------------------------------------
Element.prototype.scrollIntoView = vi.fn();

// ----------------------------------------------------
// M6: console.warn / console.error 白名单与未放行输出失败策略
// ----------------------------------------------------
const originalWarn = console.warn.bind(console);
const originalError = console.error.bind(console);
/* 本包运行期实际出现的预期噪声：reactive 组件配置触发的 Vue 性能提示 */
const IGNORED_WARN_PREFIXES = [
  '[Vue warn]: Vue received a Component that was made a reactive object',
];

/** 当前用例未放行的 warn/error 文本，afterEach 断言为空 */
let unexpectedMessages: string[] = [];

const formatArgs = (args: any[]) =>
  args
    .map(arg => (typeof arg === 'string' ? arg : String(arg)))
    .join(' ')
    .trim();

const isIgnored = (msg: string) =>
  IGNORED_WARN_PREFIXES.some(prefix => msg.includes(prefix));

const isIgnoredCall = (args: any[]) =>
  isIgnored(typeof args[0] === 'string' ? args[0] : '');

const collect = (args: any[]) => {
  const msg = formatArgs(args);
  if (!isIgnored(msg)) {
    unexpectedMessages.push(msg);
  }
};

console.warn = (...args: any[]) => {
  collect(args);
  if (isIgnoredCall(args)) {
    return;
  }
  originalWarn(...args);
};

console.error = (...args: any[]) => {
  collect(args);
  if (isIgnoredCall(args)) {
    return;
  }
  originalError(...args);
};

// ----------------------------------------------------
// M5: 清理钩子与未放行告警判定
// ----------------------------------------------------
afterEach(() => {
  activeResizeObservers.clear();
  activeIntersectionObservers.clear();
  const pending = unexpectedMessages;
  unexpectedMessages = [];
  if (pending.length > 0) {
    throw new Error(
      `存在 ${pending.length} 条未放行的 warn/error 输出，请在用例内精确断言或补充 M6 白名单：\n${pending.join('\n')}`
    );
  }
});
