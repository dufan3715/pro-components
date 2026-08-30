import { describe, it, expect, vi, afterEach } from 'vitest';
import { defineComponent, h, ref, nextTick } from 'vue';
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

/** 构造可测量的假表单元素：单行高 32、自然高度 200 */
const createFakeFormEl = () => ({
  querySelector: () => ({ getBoundingClientRect: () => ({ height: 32 }) }),
  scrollHeight: 200,
  getBoundingClientRect: () => ({ height: 200 }),
});

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

/** 收集 ResizeObserver 回调并替换全局实现：observe/unobserve/disconnect 均为空操作 */
const stubResizeObserver = () => {
  const callbacks: Array<() => void> = [];
  vi.stubGlobal(
    'ResizeObserver',
    class {
      constructor(cb: () => void) {
        callbacks.push(cb);
      }
      observe() {}
      unobserve() {}
      disconnect() {}
    }
  );
  return callbacks;
};

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
  it('SE-03 [判别]: 测量完成后按折叠配置落定高度', async () => {
    const form = { formRef: ref<any>({ $el: createFakeFormEl() }) };
    const { api, wrapper } = mountHook({
      form,
      expand: true,
      layout: 'grid',
      rowGap: 16,
    });
    await nextTick();

    expect(api.proFormHeight.value).toBe(200);
    expect(api.showExpandToggle.value).toBe(true);
    // collapseHeight = 2 行 * 32 + (2 - 1) * 16 = 80
    expect(api.expandStatus.value).toBe(false);
    expect(api.currentHeight.value).toBe(80);
    expect(api.heightStyle.value).toBe('80px');
    wrapper.unmount();
  });

  // ----------------------------------------------------
  // SE-04: expandStatus: true 配置在测量后保持展开高度
  // ----------------------------------------------------
  it('SE-04: expandStatus: true 配置在测量后保持展开高度', async () => {
    const form = { formRef: ref<any>({ $el: createFakeFormEl() }) };
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
    const fakeEl = {
      querySelector: () => ({ getBoundingClientRect: () => ({ height: 32 }) }),
      get scrollHeight() {
        measureCount += 1;
        return 200;
      },
      getBoundingClientRect: () => ({ height: 200 }),
    };
    const roCallbacks = stubResizeObserver();
    const raf = stubRafQueue();

    const form = { formRef: ref<any>({ $el: fakeEl }) };
    const { api, wrapper } = mountHook({ form, expand: true, layout: 'grid' });
    await nextTick();
    expect(api.proFormHeight.value).toBe(200);
    const initialMeasureCount = measureCount;

    // 同帧内三次 RO 触发只保留一个待执行帧
    roCallbacks[0]!();
    roCallbacks[0]!();
    roCallbacks[0]!();
    expect(raf.pending()).toBe(1);
    expect(measureCount).toBe(initialMeasureCount);

    raf.flush();
    expect(measureCount).toBe(initialMeasureCount + 1);
    expect(api.proFormHeight.value).toBe(200);

    // 卸载后待执行帧被取消，不再测量
    roCallbacks[0]!();
    wrapper.unmount();
    raf.flush();
    expect(measureCount).toBe(initialMeasureCount + 1);
  });

  // ----------------------------------------------------
  // SE-06 [判别]: 测量写入死区——±1px 抖动不写状态，≥2px 变化与累计漂移写入
  // ----------------------------------------------------
  it('SE-06 [判别]: 测量写入死区——±1px 抖动不写状态，≥2px 变化与累计漂移写入', async () => {
    let naturalHeight = 200;
    let itemHeight = 32;
    const createFakeEl = () => ({
      querySelector: () => ({
        getBoundingClientRect: () => ({ height: itemHeight }),
      }),
      get scrollHeight() {
        return naturalHeight;
      },
      getBoundingClientRect: () => ({ height: naturalHeight }),
    });
    const roCallbacks = stubResizeObserver();
    const raf = stubRafQueue();

    const form = { formRef: ref<any>({ $el: createFakeEl() }) };
    const { api, wrapper } = mountHook({
      form,
      expand: true,
      layout: 'grid',
      rowGap: 16,
    });
    await nextTick();
    expect(api.proFormHeight.value).toBe(200);
    expect(api.rowHeight.value).toBe(32);

    const triggerMeasure = () => {
      roCallbacks[0]!();
      raf.flush();
    };

    // ±1px 抖动：不写状态
    naturalHeight = 201;
    itemHeight = 33;
    triggerMeasure();
    expect(api.proFormHeight.value).toBe(200);
    expect(api.rowHeight.value).toBe(32);

    // 抖动回落：状态保持 200/32
    naturalHeight = 200;
    itemHeight = 32;
    triggerMeasure();
    expect(api.proFormHeight.value).toBe(200);

    // ≥2px 变化：写入
    naturalHeight = 203;
    itemHeight = 35;
    triggerMeasure();
    expect(api.proFormHeight.value).toBe(203);
    expect(api.rowHeight.value).toBe(35);

    // 累计漂移：与上次写入值差异达到 2px 时写入
    naturalHeight = 204;
    itemHeight = 36;
    triggerMeasure();
    expect(api.proFormHeight.value).toBe(203);
    naturalHeight = 205;
    itemHeight = 37;
    triggerMeasure();
    expect(api.proFormHeight.value).toBe(205);

    // 更换表单元素：基线重建，1px 差异同样写入
    naturalHeight = 206;
    itemHeight = 38;
    form.formRef.value = { $el: createFakeEl() };
    await nextTick();
    expect(api.proFormHeight.value).toBe(206);
    expect(api.rowHeight.value).toBe(38);

    wrapper.unmount();
  });
});
