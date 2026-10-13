import { describe, it, expect, vi, afterEach } from 'vitest';
import { defineComponent, h, ref, nextTick, markRaw } from 'vue';
import { mount } from '@vue/test-utils';
import useSearchFormExpand, {
  type UseSearchFormExpandProps,
} from '../src/table/useSearchFormExpand';

/**
 * 挂载宿主组件以提供 setup 上下文（hook 内含 onBeforeUnmount），
 * 并捕获 hook 返回值供断言。
 */
const mountHook = (props: Partial<UseSearchFormExpandProps>) => {
  let api: ReturnType<typeof useSearchFormExpand>;
  const Host = defineComponent({
    setup() {
      api = useSearchFormExpand(props as UseSearchFormExpandProps);
      return () => h('div');
    },
  });
  const wrapper = mount(Host);
  return { wrapper, api: api! };
};

/**
 * 行元素布局状态：top / height 为布局盒读数（offsetTop / offsetHeight），
 * viewportScale 模拟祖先元素 transform 缩放，仅污染 getBoundingClientRect 视口读数
 */
type FakeItemLayout = { top: number; height: number; viewportScale?: number };

const createFakeItemEl = (layout: FakeItemLayout) => ({
  className: 'ant-form-item',
  get offsetTop() {
    return layout.top;
  },
  get offsetHeight() {
    return layout.height;
  },
  offsetParent: null,
  getBoundingClientRect: () => ({
    height: layout.height * (layout.viewportScale ?? 1),
  }),
});

/**
 * 构造可测量的假表单 DOM：items 为顶层行元素，el 为表单元素，两者共享 state 布局状态；
 * [path] 选择器返回空集合（IntersectionObserver 初值检测路径不在行高测量测试范围内）
 */
const buildFakeForm = (state: {
  itemLayouts: FakeItemLayout[];
  naturalHeight: number;
  viewportScale?: number;
}) => {
  const items = state.itemLayouts.map(createFakeItemEl);
  const el = {
    get scrollHeight() {
      return state.naturalHeight;
    },
    getBoundingClientRect: () => ({
      height: state.naturalHeight * (state.viewportScale ?? 1),
    }),
    offsetTop: 0,
    offsetParent: null,
    querySelectorAll: (selector: string) =>
      selector.includes('[path]') ? [] : items,
  };
  return { el, items };
};

/** 用可控队列替换全局 rAF：flush 手动执行待执行帧，pending 返回帧数 */
const stubRafQueue = () => {
  const queue: Array<() => void> = [];
  vi.stubGlobal('requestAnimationFrame', (cb: (time: number) => void) => {
    queue.push(() => cb(0));
    return queue.length;
  });
  vi.stubGlobal('cancelAnimationFrame', (id: number) => {
    queue.splice(id - 1, 1);
  });
  return {
    flush: () => queue.splice(0).forEach(cb => cb()),
    pending: () => queue.length,
  };
};

/** 用可控实例替换全局 ResizeObserver：记录每个实例的观察集合与断开状态 */
const stubResizeObserver = () => {
  const instances: Array<{
    callback: () => void;
    elements: Set<any>;
    disconnected: boolean;
  }> = [];
  vi.stubGlobal(
    'ResizeObserver',
    class {
      callback: () => void;
      elements = new Set<any>();
      disconnected = false;
      constructor(cb: () => void) {
        this.callback = cb;
        instances.push(this);
      }
      observe(el: any) {
        this.elements.add(el);
      }
      unobserve(el: any) {
        this.elements.delete(el);
      }
      disconnect() {
        this.elements.clear();
        this.disconnected = true;
      }
    }
  );
  return instances;
};

type FakeIoInstance = {
  callback: (entries: any[]) => void;
  elements: Set<any>;
  disconnected: boolean;
};

/** 用可控实例替换全局 IntersectionObserver：手动触发回调、记录观察集合与断开状态 */
const stubIntersectionObserver = () => {
  const instances: FakeIoInstance[] = [];
  vi.stubGlobal(
    'IntersectionObserver',
    class {
      callback: (entries: any[]) => void;
      elements = new Set<any>();
      disconnected = false;
      constructor(cb: (entries: any[]) => void) {
        this.callback = cb;
        instances.push(this as unknown as FakeIoInstance);
      }
      observe(el: any) {
        this.elements.add(el);
      }
      unobserve(el: any) {
        this.elements.delete(el);
      }
      disconnect() {
        this.elements.clear();
        this.disconnected = true;
      }
    }
  );
  return instances;
};

/** 构造带 [path] 的可测量假行元素 */
const createFakePathItem = (path: string, top: number, height = 32) => ({
  className: 'ant-form-item',
  getAttribute: (name: string) => (name === 'path' ? path : null),
  get offsetTop() {
    return top;
  },
  get offsetHeight() {
    return height;
  },
  offsetParent: null,
  getBoundingClientRect: () => ({ height }),
});

/** 构造行元素查询与 [path] 查询均返回同一批行元素的假表单元素 */
const buildFakePathForm = (state: {
  items: any[];
  naturalHeight: number;
  viewportScale?: number;
}) => ({
  get scrollHeight() {
    return state.naturalHeight;
  },
  getBoundingClientRect: () => ({
    height: state.naturalHeight * (state.viewportScale ?? 1),
  }),
  offsetTop: 0,
  offsetParent: null,
  querySelectorAll: (selector: string) =>
    selector.includes('-form-item') ? state.items : [],
});

describe('useSearchFormExpand', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });
  // ----------------------------------------------------
  // SE-01 [判别]: 初始 expandStatus 与 expand 配置对齐（默认折叠）
  // ----------------------------------------------------
  it('SE-01 [判别]: 初始 expandStatus 与 expand 配置对齐（默认折叠）', () => {
    const a1 = mountHook({ expand: true }).api;
    expect(a1.expandStatus.value).toBe(false);

    const a2 = mountHook({ expand: { expandStatus: true } }).api;
    expect(a2.expandStatus.value).toBe(true);

    const a3 = mountHook({ expand: { minExpandRows: 3 } }).api;
    expect(a3.expandStatus.value).toBe(false);

    const a4 = mountHook({}).api;
    expect(a4.expandStatus.value).toBe(false);
  });

  // ----------------------------------------------------
  // SE-02 [判别]: 首次测量完成前不施加高度约束
  // ----------------------------------------------------
  it('SE-02 [判别]: 首次测量完成前 currentHeight 为 unset，不产生 0 高度帧', () => {
    const { api, wrapper } = mountHook({ expand: true, layout: 'grid' });
    expect(api.proFormHeight.value).toBe('unset');
    expect(api.collapseHeight.value).toBe(0);
    // 判别点：初始折叠语义依赖此守卫
    expect(api.currentHeight.value).toBe('unset');
    expect(api.heightStyle.value).toBeUndefined();
    wrapper.unmount();
  });

  // ----------------------------------------------------
  // SE-03 [判别]: 测量完成后按折叠配置落定高度
  // ----------------------------------------------------
  it('SE-03 [判别]: 测量完成后按折叠配置落定高度（行边界取第 minExpandRows 行底部）', async () => {
    // 三行均匀行：行底 [32, 80, 128]，折叠高度取第 2 行底部 80
    const state = {
      itemLayouts: [
        { top: 0, height: 32 },
        { top: 0, height: 32 },
        { top: 0, height: 32 },
        { top: 48, height: 32 },
        { top: 96, height: 32 },
      ],
      naturalHeight: 200,
    };
    const form = { formRef: ref<any>({ $el: buildFakeForm(state).el }) };
    const { api, wrapper } = mountHook({
      form,
      expand: true,
      layout: 'grid',
      rowGap: 16,
    });
    await nextTick();

    expect(api.proFormHeight.value).toBe(200);
    expect(api.rowHeight.value).toBe(32);
    expect(api.showExpandToggle.value).toBe(true);
    // collapseHeight = 第 2 行底部（与均匀行算术 2 * 32 + 16 等值）
    expect(api.expandStatus.value).toBe(false);
    expect(api.currentHeight.value).toBe(80);
    expect(api.heightStyle.value).toBe('80px');
    wrapper.unmount();

    // 行边界不可测（无可测行元素）时回退行高算术：行高取默认值 32，折叠高度 = 2 * 32 + 16
    const emptyState = { itemLayouts: [], naturalHeight: 200 };
    const emptyForm = {
      formRef: ref<any>({ $el: buildFakeForm(emptyState).el }),
    };
    const fallback = mountHook({
      form: emptyForm,
      expand: true,
      layout: 'grid',
      rowGap: 16,
    });
    await nextTick();
    expect(fallback.api.collapseHeight.value).toBe(80);
    expect(fallback.api.showExpandToggle.value).toBe(true);
    fallback.wrapper.unmount();
  });

  // ----------------------------------------------------
  // SE-04: expandStatus: true 配置在测量后保持展开高度
  // ----------------------------------------------------
  it('SE-04: expandStatus: true 配置在测量后保持展开高度', async () => {
    const state = {
      itemLayouts: [
        { top: 0, height: 32 },
        { top: 48, height: 32 },
        { top: 96, height: 32 },
      ],
      naturalHeight: 200,
    };
    const form = { formRef: ref<any>({ $el: buildFakeForm(state).el }) };
    const { api, wrapper } = mountHook({
      form,
      expand: { expandStatus: true },
      layout: 'grid',
      rowGap: 16,
    });
    await nextTick();

    expect(api.expandStatus.value).toBe(true);
    expect(api.currentHeight.value).toBe(200);
    expect(api.heightStyle.value).toBe('200px');
    wrapper.unmount();
  });

  // ----------------------------------------------------
  // SE-05 [判别]: RO 触发的测量经 rAF 合帧，同帧多次触发只测量一次
  // ----------------------------------------------------
  it('SE-05 [判别]: RO 触发的测量经 rAF 合帧，同帧多次触发只测量一次', async () => {
    let measureCount = 0;
    const itemEl = createFakeItemEl({ top: 0, height: 32 });
    const fakeEl = {
      get scrollHeight() {
        measureCount += 1;
        return 200;
      },
      getBoundingClientRect: () => ({ height: 200 }),
      offsetTop: 0,
      offsetParent: null,
      querySelectorAll: (selector: string) =>
        selector.includes('[path]') ? [] : [itemEl],
    };
    const roInstances = stubResizeObserver();
    const raf = stubRafQueue();

    const form = { formRef: ref<any>({ $el: fakeEl }) };
    const { api, wrapper } = mountHook({ form, expand: true, layout: 'grid' });
    await nextTick();
    expect(api.proFormHeight.value).toBe(200);
    const initialMeasureCount = measureCount;

    // 同帧内三次 RO 触发只保留一个待执行帧
    roInstances[0]!.callback();
    roInstances[0]!.callback();
    roInstances[0]!.callback();
    expect(raf.pending()).toBe(1);
    expect(measureCount).toBe(initialMeasureCount);

    raf.flush();
    expect(measureCount).toBe(initialMeasureCount + 1);
    expect(api.proFormHeight.value).toBe(200);

    // 卸载后待执行帧被取消，不再测量
    roInstances[0]!.callback();
    wrapper.unmount();
    raf.flush();
    expect(measureCount).toBe(initialMeasureCount + 1);
  });

  // ----------------------------------------------------
  // SE-06 [判别]: 测量写入死区——±1px 抖动不写状态，≥2px 变化与累计漂移写入
  // ----------------------------------------------------
  it('SE-06 [判别]: 测量写入死区——±1px 抖动不写状态，≥2px 变化与累计漂移写入', async () => {
    const state = {
      itemLayouts: [
        { top: 0, height: 32 },
        { top: 48, height: 32 },
        { top: 96, height: 32 },
      ],
      naturalHeight: 200,
    };
    const roInstances = stubResizeObserver();
    const raf = stubRafQueue();

    const form = { formRef: ref<any>({ $el: buildFakeForm(state).el }) };
    const { api, wrapper } = mountHook({
      form,
      expand: true,
      layout: 'grid',
      rowGap: 16,
    });
    await nextTick();
    expect(api.proFormHeight.value).toBe(200);
    expect(api.rowHeight.value).toBe(32);
    expect(api.collapseHeight.value).toBe(80);

    // 触发后需等待 post 队列（collapseHeight 由 flush: 'post' 的 watchEffect 写入）
    const triggerMeasure = async () => {
      roInstances[0]!.callback();
      raf.flush();
      await nextTick();
    };

    // ±1px 抖动：自然高度 / 行高 / 行边界均不写状态
    state.naturalHeight = 201;
    state.itemLayouts.forEach(layout => {
      layout.top += 0.5;
      layout.height += 0.5;
    });
    await triggerMeasure();
    expect(api.proFormHeight.value).toBe(200);
    expect(api.rowHeight.value).toBe(32);
    expect(api.collapseHeight.value).toBe(80);

    // 抖动回落：状态保持 200 / 32 / 80
    state.naturalHeight = 200;
    state.itemLayouts.forEach(layout => {
      layout.top -= 0.5;
      layout.height -= 0.5;
    });
    await triggerMeasure();
    expect(api.proFormHeight.value).toBe(200);

    // ≥2px 变化：写入（行底 [38, 86, 134]）
    state.naturalHeight = 203;
    state.itemLayouts.forEach(layout => {
      layout.top += 3;
      layout.height += 3;
    });
    await triggerMeasure();
    expect(api.proFormHeight.value).toBe(203);
    expect(api.rowHeight.value).toBe(35);
    expect(api.collapseHeight.value).toBe(86);

    // 累计漂移：与上次写入值差异达到 2px 时写入
    state.naturalHeight = 204;
    state.itemLayouts.forEach(layout => (layout.height += 1));
    await triggerMeasure();
    expect(api.proFormHeight.value).toBe(203);
    state.naturalHeight = 205;
    state.itemLayouts.forEach(layout => (layout.height += 1));
    await triggerMeasure();
    expect(api.proFormHeight.value).toBe(205);

    // 更换表单元素：基线重建，1px 差异同样写入
    const nextState = {
      itemLayouts: [
        { top: 1, height: 33 },
        { top: 49, height: 33 },
        { top: 97, height: 33 },
      ],
      naturalHeight: 201,
    };
    form.formRef.value = { $el: buildFakeForm(nextState).el };
    await nextTick();
    expect(api.proFormHeight.value).toBe(201);
    expect(api.rowHeight.value).toBe(33);

    wrapper.unmount();
  });

  // ----------------------------------------------------
  // SE-07 [判别]: 祖先 transform 缩放（Modal zoom 过渡）不污染测量
  // ----------------------------------------------------
  it('SE-07 [判别]: 祖先元素 transform 缩放期间测量，行高与折叠高度不受视口读数污染', async () => {
    // Modal zoom 过渡首帧：全部视口读数（getBoundingClientRect）按 scale 0.2 缩放，
    // 布局盒读数（offsetTop / offsetHeight / scrollHeight）保持真实值
    const MODAL_ZOOM_START_SCALE = 0.2;
    const state = {
      itemLayouts: [
        { top: 0, height: 32, viewportScale: MODAL_ZOOM_START_SCALE },
        { top: 0, height: 32, viewportScale: MODAL_ZOOM_START_SCALE },
        { top: 0, height: 32, viewportScale: MODAL_ZOOM_START_SCALE },
        { top: 48, height: 32, viewportScale: MODAL_ZOOM_START_SCALE },
        { top: 96, height: 32, viewportScale: MODAL_ZOOM_START_SCALE },
      ],
      naturalHeight: 200,
      viewportScale: MODAL_ZOOM_START_SCALE,
    };
    const form = { formRef: ref<any>({ $el: buildFakeForm(state).el }) };
    const { api, wrapper } = mountHook({
      form,
      expand: true,
      layout: 'grid',
      rowGap: 16,
    });
    await nextTick();

    // 判别点：行高读取布局盒高度 32（视口读数 6.4），折叠高度取行边界 80（污染读数会得到 28.8）
    expect(api.rowHeight.value).toBe(32);
    expect(api.collapseHeight.value).toBe(80);
    expect(api.showExpandToggle.value).toBe(true);
    expect(api.currentHeight.value).toBe(80);
    expect(api.heightStyle.value).toBe('80px');
    wrapper.unmount();
  });

  // ----------------------------------------------------
  // SE-08 [判别]: 不均匀行高（textarea 自适应高度）折叠在完整行边界
  // ----------------------------------------------------
  it('SE-08 [判别]: 行高不均匀时折叠高度落在完整行边界，行数不足时不显示展开按钮', async () => {
    // 三行：3 个 input(32) + textarea(76) + 2 个日期(32)，自然高度 32 + 16 + 76 + 16 + 32 = 172
    const state = {
      itemLayouts: [
        { top: 0, height: 32 },
        { top: 0, height: 32 },
        { top: 0, height: 32 },
        { top: 48, height: 76 },
        { top: 140, height: 32 },
        { top: 140, height: 32 },
      ],
      naturalHeight: 172,
    };
    const form = { formRef: ref<any>({ $el: buildFakeForm(state).el }) };
    const { api, wrapper } = mountHook({
      form,
      expand: true,
      layout: 'grid',
      rowGap: 16,
    });
    await nextTick();

    // 判别点：折叠高度取第 2 行（textarea 行）真实底部 124，textarea 行完整展示不截断；
    // 按首行行高算术（2 * 32 + 16 = 80）会拦腰截断 textarea
    expect(api.collapseHeight.value).toBe(124);
    expect(api.showExpandToggle.value).toBe(true);
    expect(api.currentHeight.value).toBe(124);
    expect(api.heightStyle.value).toBe('124px');
    wrapper.unmount();

    // 行数不足 minExpandRows：折叠高度为自然高度，无溢出行，不显示展开按钮
    const fewRowsForm = { formRef: ref<any>({ $el: buildFakeForm(state).el }) };
    const fewRows = mountHook({
      form: fewRowsForm,
      expand: { minExpandRows: 4 },
      layout: 'grid',
      rowGap: 16,
    });
    await nextTick();
    expect(fewRows.api.collapseHeight.value).toBe(172);
    expect(fewRows.api.showExpandToggle.value).toBe(false);
    expect(fewRows.api.currentHeight.value).toBe(172);
    fewRows.wrapper.unmount();
  });

  // ----------------------------------------------------
  // SE-09 [判别]: 行元素尺寸变化（textarea 自适应增高）经 RO 重测，表单实例切换重建观察集合
  // ----------------------------------------------------
  it('SE-09 [判别]: 行元素尺寸变化经 RO 重测全部高度；表单实例切换后行元素观察集合重建', async () => {
    const roInstances = stubResizeObserver();
    const raf = stubRafQueue();
    const state = {
      itemLayouts: [
        { top: 0, height: 32 },
        { top: 0, height: 32 },
        { top: 48, height: 76 },
        { top: 140, height: 32 },
      ],
      naturalHeight: 172,
    };
    const built = buildFakeForm(state);
    const form = { formRef: ref<any>({ $el: built.el }) };
    const { api, wrapper } = mountHook({
      form,
      expand: true,
      layout: 'grid',
      rowGap: 16,
    });
    await nextTick();
    expect(api.proFormHeight.value).toBe(172);
    expect(api.collapseHeight.value).toBe(124);

    // RO 观察集合包含全部顶层行元素
    expect(roInstances[0]!.elements.has(built.items[0])).toBe(true);
    expect(roInstances[0]!.elements.has(built.items[2])).toBe(true);

    // textarea 自适应内容长高：76 → 142，自然高度 172 → 238
    state.itemLayouts[2]!.height = 142;
    state.naturalHeight = 238;
    roInstances[0]!.callback();
    raf.flush();
    await nextTick();

    // 自然高度 / 行边界 / 折叠高度全部重测（第 2 行底部 48 + 142 = 190）
    expect(api.proFormHeight.value).toBe(238);
    expect(api.collapseHeight.value).toBe(190);
    expect(api.heightStyle.value).toBe('190px');

    // 展开态同样自愈到新的自然高度
    api.changeExpandStatus();
    expect(api.currentHeight.value).toBe(238);

    // 表单实例切换：旧观察断开，新表单的行元素重新登记，旧行元素不再被观察
    const nextState = {
      itemLayouts: [
        { top: 0, height: 32 },
        { top: 48, height: 32 },
      ],
      naturalHeight: 96,
    };
    const nextBuilt = buildFakeForm(nextState);
    form.formRef.value = { $el: nextBuilt.el };
    await nextTick();

    expect(roInstances[0]!.disconnected).toBe(true);
    const nextRo = roInstances[roInstances.length - 1]!;
    expect(nextRo.elements.has(nextBuilt.items[0])).toBe(true);
    expect(nextRo.elements.has(built.items[0])).toBe(false);
    expect(api.proFormHeight.value).toBe(96);

    wrapper.unmount();
  });

  // ----------------------------------------------------
  // SE-10 [判别]: 栅格列祖先（position: relative，如 antd Col）下坐标系碎片化，行边界仍正确测量
  // ----------------------------------------------------
  it('SE-10 [判别]: 行元素 offsetParent 为带 position: relative 的栅格列时，沿坐标链累加仍得正确行边界', async () => {
    // 复刻真实 antd DOM（playground 场景 11 实测）：
    // form-item 的 offsetParent 是 ant-col（position: relative），offsetTop 恒为 0；
    // ant-col 的 offsetParent 是 form，offsetTop 为真实行内偏移；
    // 三行：Row1 底部 98（textarea 98 + input 32）、Row2 底部 146、Row3 底部 194
    const rowTops = [0, 0, 114, 114, 114, 162, 162, 162];
    const itemHeights = [98, 32, 32, 32, 32, 32, 32, 32];
    const fakeColEls = rowTops.map((colTop, i) => ({
      className: 'ant-form-item',
      offsetTop: 0,
      offsetHeight: itemHeights[i],
      // 栅格列祖先：链上承载真实行偏移，offsetParent 指向表单元素
      offsetParent: { offsetTop: colTop, offsetParent: null },
      getBoundingClientRect: () => ({ height: itemHeights[i] }),
    }));
    const formEl = {
      scrollHeight: 194,
      getBoundingClientRect: () => ({ height: 194 }),
      offsetTop: 0,
      offsetParent: null,
      querySelectorAll: (selector: string) =>
        selector.includes('[path]') ? [] : fakeColEls,
    };
    const form = { formRef: ref<any>({ $el: formEl }) };
    const { api, wrapper } = mountHook({
      form,
      expand: { minExpandRows: 2 },
      layout: 'grid',
      rowGap: 16,
    });
    await nextTick();

    // 判别点：单级 offsetTop 全为 0（坐标系碎片化），链式累加还原真实行边界 [98, 146, 194]；
    // 退化为「共享 offsetParent 校验失败即回退算术」的实现会把 8 个 top=0 盒子聚成单行，
    // 折叠高度钳到自然高度 194、不显示展开按钮
    expect(api.collapseHeight.value).toBe(146);
    expect(api.showExpandToggle.value).toBe(true);
    expect(api.currentHeight.value).toBe(146);
    expect(api.heightStyle.value).toBe('146px');
    wrapper.unmount();
  });

  // ----------------------------------------------------
  // SE-11 [判别]: 折叠状态下隐藏字段有初值则自动展开，无值保持折叠
  // ----------------------------------------------------
  it('SE-11 [判别]: 隐藏字段有初值自动展开、无值保持折叠，判定后断开观察', async () => {
    const ioInstances = stubIntersectionObserver();

    // 带 path 属性的行元素：可见字段 a（有值）、隐藏字段 b
    const items = [createFakePathItem('a', 0), createFakePathItem('b', 48)];
    const buildForm = (values: Record<string, any>) => ({
      formRef: ref<any>({
        $el: {
          get scrollHeight() {
            return 200;
          },
          getBoundingClientRect: () => ({ height: 200 }),
          offsetTop: 0,
          offsetParent: null,
          querySelectorAll: (selector: string) =>
            selector.includes('[path]') ? items : [],
        },
      }),
      getFormData: (path: string) => values[path],
    });

    // 场景一：隐藏字段有值 → 自动展开
    const withValue = mountHook({
      form: buildForm({ a: 'x', b: 'y' }) as any,
      expand: true,
      layout: 'grid',
      rowGap: 16,
    });
    await nextTick();
    expect(withValue.api.showExpandToggle.value).toBe(true);
    expect(withValue.api.expandStatus.value).toBe(false);

    const io = ioInstances[ioInstances.length - 1]!;
    // 观察到全部带 path 的行元素
    expect(io.elements.size).toBe(2);
    // 隐藏项（intersectionRatio 0）且有值 → 展开
    io.callback([{ target: items[1], intersectionRatio: 0 }]);
    expect(withValue.api.expandStatus.value).toBe(true);
    // 判定后断开观察
    expect(io.disconnected).toBe(true);
    withValue.wrapper.unmount();

    // 场景二：隐藏字段无值 → 保持折叠
    ioInstances.length = 0;
    const empty = mountHook({
      form: buildForm({ a: 'x', b: '' }) as any,
      expand: true,
      layout: 'grid',
      rowGap: 16,
    });
    await nextTick();
    const io2 = ioInstances[ioInstances.length - 1]!;
    io2.callback([{ target: items[1], intersectionRatio: 0 }]);
    expect(empty.api.expandStatus.value).toBe(false);
    empty.wrapper.unmount();

    // 场景三：仅可见项（intersectionRatio > 0）→ 回退配置状态（保持折叠）
    ioInstances.length = 0;
    const visible = mountHook({
      form: buildForm({ a: 'x', b: 'y' }) as any,
      expand: true,
      layout: 'grid',
      rowGap: 16,
    });
    await nextTick();
    const io3 = ioInstances[ioInstances.length - 1]!;
    io3.callback([{ target: items[0], intersectionRatio: 1 }]);
    expect(visible.api.expandStatus.value).toBe(false);
    visible.wrapper.unmount();
  });

  // ----------------------------------------------------
  // SE-12 [判别]: 初值自动展开判定一次性产出，容器重测不打回配置初值
  // ----------------------------------------------------
  it('SE-12 [判别]: 初值自动展开后容器重测不打回配置初值', async () => {
    const ioInstances = stubIntersectionObserver();
    const roInstances = stubResizeObserver();
    const raf = stubRafQueue();

    const state = {
      items: [createFakePathItem('a', 0), createFakePathItem('b', 48)],
      naturalHeight: 200,
    };
    const form = {
      formRef: ref<any>({ $el: buildFakePathForm(state) }),
      getFormData: (path: string) => (path === 'b' ? 'hidden-value' : ''),
    };
    const { api, wrapper } = mountHook({
      form: form as any,
      expand: true,
      layout: 'grid',
      rowGap: 16,
    });
    await nextTick();

    expect(api.showExpandToggle.value).toBe(true);
    expect(api.expandStatus.value).toBe(false);

    // 隐藏字段有初值 → 自动展开
    ioInstances[0]!.callback([
      { target: state.items[1], intersectionRatio: 0 },
    ]);
    expect(api.expandStatus.value).toBe(true);

    // 容器尺寸 ≥2px 变化触发重测
    state.naturalHeight = 220;
    roInstances[0]!.callback();
    raf.flush();
    await nextTick();

    // 判别点：重测后保持自动展开结果，折叠高度与自然高度跟随新测量值
    expect(api.proFormHeight.value).toBe(220);
    expect(api.expandStatus.value).toBe(true);
    expect(api.currentHeight.value).toBe(220);
    wrapper.unmount();
  });

  // ----------------------------------------------------
  // SE-13 [判别]: 初值判定复用同一 IntersectionObserver，重测不产生新实例
  // ----------------------------------------------------
  it('SE-13 [判别]: 初值判定复用同一 IntersectionObserver，重测不产生新实例', async () => {
    const ioInstances = stubIntersectionObserver();
    const roInstances = stubResizeObserver();
    const raf = stubRafQueue();

    const state = {
      items: [createFakePathItem('a', 0), createFakePathItem('b', 48)],
      naturalHeight: 200,
    };
    const form = {
      formRef: ref<any>({ $el: buildFakePathForm(state) }),
      getFormData: (path: string) => (path === 'b' ? 'hidden-value' : ''),
    };
    const { api, wrapper } = mountHook({
      form: form as any,
      expand: true,
      layout: 'grid',
      rowGap: 16,
    });
    await nextTick();

    expect(ioInstances).toHaveLength(1);
    const io = ioInstances[0]!;
    expect(io.elements.size).toBe(2);

    // 连续两次 ≥2px 重测
    state.naturalHeight = 220;
    roInstances[0]!.callback();
    raf.flush();
    await nextTick();
    state.naturalHeight = 240;
    roInstances[0]!.callback();
    raf.flush();
    await nextTick();

    // 判别点：判定只创建一个 IO 实例，且重测后仍处于观察状态（未被旧回调断开）
    expect(ioInstances).toHaveLength(1);
    expect(io.disconnected).toBe(false);

    // 判定产出后断开自身观察
    io.callback([{ target: state.items[1], intersectionRatio: 0 }]);
    expect(api.expandStatus.value).toBe(true);
    expect(io.disconnected).toBe(true);
    wrapper.unmount();
  });

  // ----------------------------------------------------
  // SE-14 [判别]: 行元素坐标链不可测时放弃部分测量，回退行高算术
  // ----------------------------------------------------
  it('SE-14 [判别]: 行元素坐标链不可测时放弃部分测量并回退行高算术', async () => {
    // 五行两列：行高 32、行距 8，第二行坐标链不可测
    const rowsOf = (tops: Array<number | null>): FakeItemLayout[] =>
      tops.map(top => ({ top, height: 32 }) as FakeItemLayout);

    // 对照：全部可测 → 折叠高度取第 2 行真实底部 72
    const measurableState = {
      itemLayouts: rowsOf([0, 40, 80, 120, 160]),
      naturalHeight: 200,
    };
    const measurable = mountHook({
      form: {
        formRef: ref<any>({ $el: buildFakeForm(measurableState as any).el }),
      },
      expand: true,
      layout: 'grid',
      rowGap: 16,
    });
    await nextTick();
    expect(measurable.api.collapseHeight.value).toBe(72);
    measurable.wrapper.unmount();

    // 判别点：第二行不可测时整组行边界不可信，折叠高度回退算术 2 * 32 + 16 = 80；
    // 丢弃不可测行后继续测量会取到第 3 行底部 112，折叠态多显示一行
    const brokenState = {
      itemLayouts: rowsOf([0, null, 80, 120, 160]),
      naturalHeight: 200,
    };
    const broken = mountHook({
      form: {
        formRef: ref<any>({ $el: buildFakeForm(brokenState as any).el }),
      },
      expand: true,
      layout: 'grid',
      rowGap: 16,
    });
    await nextTick();
    expect(broken.api.rowHeight.value).toBe(32);
    expect(broken.api.collapseHeight.value).toBe(80);
    expect(broken.api.showExpandToggle.value).toBe(true);
    expect(broken.api.currentHeight.value).toBe(80);
    broken.wrapper.unmount();
  });

  // ----------------------------------------------------
  // SE-15 [判别]: cleanupObservers 后重测可重新建立容器与行元素观察
  // ----------------------------------------------------
  it('SE-15 [判别]: cleanupObservers 复位观察状态，updateHeights 重建容器与行元素观察', async () => {
    const roInstances = stubResizeObserver();

    const state = {
      itemLayouts: [
        { top: 0, height: 32 },
        { top: 48, height: 32 },
      ],
      naturalHeight: 200,
    };
    const built = buildFakeForm(state);
    // markRaw 对齐真实 DOM 元素：宿主元素不参与响应式包装，观察引用即原始元素
    const form = { formRef: ref<any>({ $el: markRaw(built.el) }) };
    const { api, wrapper } = mountHook({
      form,
      expand: true,
      layout: 'grid',
      rowGap: 16,
    });
    await nextTick();

    const firstRo = roInstances[0]!;
    expect(firstRo.elements.has(built.el)).toBe(true);
    expect(firstRo.elements.has(built.items[0])).toBe(true);

    api.cleanupObservers();
    expect(firstRo.disconnected).toBe(true);

    // 判别点：重新测量后新建观察器同时观察容器与全部顶层行元素
    api.updateHeights();
    const nextRo = roInstances[roInstances.length - 1]!;
    expect(nextRo).not.toBe(firstRo);
    expect(nextRo.elements.has(built.el)).toBe(true);
    expect(nextRo.elements.has(built.items[0])).toBe(true);
    expect(nextRo.elements.has(built.items[1])).toBe(true);

    // 重建后仍可正常测量
    expect(api.proFormHeight.value).toBe(200);
    expect(api.collapseHeight.value).toBe(80);
    wrapper.unmount();
  });

  // ----------------------------------------------------
  // SE-16 [判别]: 非 grid 布局或未启用折叠时不施加高度约束
  // ----------------------------------------------------
  it('SE-16 [判别]: 非 grid 布局下 currentHeight 为 unset、heightStyle 为 undefined', async () => {
    const state = {
      itemLayouts: [
        { top: 0, height: 32 },
        { top: 0, height: 32 },
        { top: 48, height: 32 },
      ],
      naturalHeight: 200,
    };
    const form = { formRef: ref<any>({ $el: buildFakeForm(state).el }) };

    // 对照：grid 布局正常施加折叠高度
    const grid = mountHook({
      form,
      expand: true,
      layout: 'grid',
      rowGap: 16,
    });
    await nextTick();
    expect(grid.api.collapseHeight.value).toBe(80);
    expect(grid.api.currentHeight.value).toBe(80);
    expect(grid.api.heightStyle.value).toBe('80px');
    grid.wrapper.unmount();

    // 判别点：inline 布局折叠高度不参与计算，currentHeight 不落 0、heightStyle 不为 '0px'
    const inline = mountHook({
      form,
      expand: true,
      layout: 'inline',
      rowGap: 16,
    });
    await nextTick();
    expect(inline.api.proFormHeight.value).toBe(200);
    expect(inline.api.showExpandToggle.value).toBe(false);
    expect(inline.api.currentHeight.value).toBe('unset');
    expect(inline.api.heightStyle.value).toBeUndefined();
    inline.wrapper.unmount();

    // 未启用折叠（expand 未传）同样不施加高度约束
    const disabled = mountHook({ form, layout: 'grid', rowGap: 16 });
    await nextTick();
    expect(disabled.api.currentHeight.value).toBe('unset');
    expect(disabled.api.heightStyle.value).toBeUndefined();
    disabled.wrapper.unmount();
  });

  // ----------------------------------------------------
  // CR-027 [判别]: 未参与折叠高度计算的 columnGap 不再出现在 hook props 中
  // ----------------------------------------------------
  it('CR-027 [判别]: useSearchFormExpand props 不含未使用的 columnGap', async () => {
    // 编译期契约：若 columnGap 重新声明进 props，本行 @ts-expect-error 将因「未使用」而报错
    const props: UseSearchFormExpandProps = {
      form: {} as any,
      expand: true,
      // @ts-expect-error columnGap 未参与折叠高度计算，已从 props 移除（其余必填项齐备，唯一错误来源即此行）
      columnGap: 16,
    };
    expect(props.expand).toBe(true);

    // 运行时契约：折叠高度算术只取 rowGap，附加的 columnGap 不参与计算
    const state = { itemLayouts: [], naturalHeight: 200 };
    const form = { formRef: ref<any>({ $el: buildFakeForm(state).el }) };
    const withRowGap = mountHook({
      form,
      expand: true,
      layout: 'grid',
      rowGap: 20,
    });
    await nextTick();
    expect(withRowGap.api.collapseHeight.value).toBe(84);
    withRowGap.wrapper.unmount();

    const withColumnGap = mountHook({
      form,
      expand: true,
      layout: 'grid',
      rowGap: 20,
      columnGap: 999,
    } as any);
    await nextTick();
    expect(withColumnGap.api.collapseHeight.value).toBe(84);
    withColumnGap.wrapper.unmount();
  });
});
