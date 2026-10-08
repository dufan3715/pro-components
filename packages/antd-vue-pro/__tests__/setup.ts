import { vi, afterEach } from 'vitest';

// ----------------------------------------------------
// M1: window.matchMedia polyfill (antd Grid / useBreakpoint)
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
// M4: Element.prototype.scrollIntoView stub (antd Select/Table 依赖)
// ----------------------------------------------------
Element.prototype.scrollIntoView = vi.fn();

// ----------------------------------------------------
// M6: console.warn 白名单过滤策略（过滤预期的开发期测试噪声）
// ----------------------------------------------------
const originalWarn = console.warn.bind(console);
const originalError = console.error.bind(console);
/*
 * 本包运行期预期告警（按下发来源与文案片段精确匹配）；
 * 未命中条目的告警计入 unexpectedWarnings，由 afterEach 判定该用例失败
 */
const EXPECTED_WARNINGS = [
  // 用例经 :component / componentMap 传入 SFC 对象，宿主要求 markRaw 处理
  '[Vue warn]: Vue received a Component that was made a reactive object',
  // BF-B4 / BF-B10 的 formatter 旧值场景向宿主 input 传入对象
  '[Vue warn]: Invalid prop: type check failed for prop "value". Expected String | Number | Symbol, got Object',
  // PF-02 递归字段中无 name path 的子项由宿主 FormItem 提示
  'please transfer a valid name path to form item!',
  // SF-A16 断言 form 为必填 prop，缺省挂载即触发宿主缺参提示
  '[Vue warn]: Missing required prop: "form"',
  // 校验失败路径用例触发的真实校验告警
  'async-validator:',
  // PT-A10 / PT-A10b / IT-02 / IT-03 显式覆盖非 Promise 查询契约
  '[ProTable] search 未返回 Promise',
  // 「运行期替换 componentMap」用例在替换生效前的首帧降级渲染
  '[pro-components] 未识别的组件类型',
];

const unexpectedWarnings: string[] = [];

// 命中预期条目时静默，未命中条目透传原控制台并登记待判定
const isExpectedWarning = (args: any[]) => {
  const msg = typeof args[0] === 'string' ? args[0] : '';
  if (msg && EXPECTED_WARNINGS.some(prefix => msg.includes(prefix))) {
    return true;
  }
  if (msg) {
    unexpectedWarnings.push(msg);
  }
  return false;
};

console.warn = (...args: any[]) => {
  if (isExpectedWarning(args)) {
    return;
  }
  originalWarn(...args);
};

console.error = (...args: any[]) => {
  if (isExpectedWarning(args)) {
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
  const pending = unexpectedWarnings.splice(0);
  if (pending.length > 0) {
    throw new Error(
      `存在 ${pending.length} 条未放行的运行期告警：\n${pending
        .map(msg => `  - ${msg}`)
        .join('\n')}`
    );
  }
});
