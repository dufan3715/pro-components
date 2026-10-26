/**
 * @module Core/useSearchFormExpand
 * @description 搜索表单的折叠高度测量与展开状态管理
 *
 * 取值链：`heightStyle`（当前应施加的高度）← `currentHeight` ← `expandStatus`（展开/折叠）× 测量结果；
 * 测量经 rAF 合帧，读布局盒属性（`scrollHeight` / `offsetTop` / `offsetHeight`）不受祖先 transform 缩放影响；
 * 折叠高度优先取第 `minExpandRows` 行真实底部，行边界不可测时回退行高算术。
 * 尺寸变化（ResizeObserver）与字段增减触发重测；用户手动切换后自动测量不再覆盖其状态。
 */
import {
  ref,
  computed,
  toValue,
  watch,
  watchEffect,
  onBeforeUnmount,
  type ComputedRef,
  type Ref,
} from 'vue';
import { isObjectItem } from '../shared/utils';

// 测量写入死区（px）：与上次写入值的差异小于该值时不更新状态
const MEASURE_DEAD_ZONE_PX = 2;

/**
 * useSearchFormExpand 入参
 */
export interface UseSearchFormExpandProps {
  /** 表单实例（读取 `formRef` 取容器元素、`getFormData` 判定隐藏区初值） */
  form: any;
  /**
   * 折叠配置：`false` / 未传不启用折叠；`true` 等价 `{ minExpandRows: 2, expandStatus: false }`
   */
  expand?: boolean | { minExpandRows?: number; expandStatus?: boolean };
  /** 布局模式：仅 `'grid'` 参与折叠高度计算，其余布局 `showExpandToggle` 恒为 false */
  layout?: 'grid' | 'inline';
  /** 行间距（px），仅在行边界不可测、回退行高算术时使用；默认 16 */
  rowGap?: number;
}

/**
 * useSearchFormExpand 返回值：跨包统一的高度状态与操作句柄
 */
export interface UseSearchFormExpandReturn {
  /** 表单自然展开高度（px）；首次测量前为 `'unset'` */
  proFormHeight: Ref<'unset' | number>;
  /** 折叠态高度（px），取第 minExpandRows 行底部或行高算术值 */
  collapseHeight: Ref<number>;
  /** 行高（px），取首个顶层行元素的布局盒高度；默认 32 */
  rowHeight: Ref<number>;
  /** 是否存在溢出行（自然高度 - 折叠高度 > 1px） */
  showExpandToggle: Ref<boolean>;
  /** 当前展开状态（受 expand 配置、初值自动展开与用户手动切换共同影响） */
  expandStatus: Ref<boolean>;
  /** 用户是否手动切换过（置位后自动测量不再覆盖 expandStatus） */
  isManualToggle: Ref<boolean>;
  /** `expand` 配置的标准化结果：`false` 表示未启用折叠 */
  computedExpand: ComputedRef<
    false | { minExpandRows: number; expandStatus: boolean }
  >;
  /** 当前应施加的高度：折叠态为 `collapseHeight`；首次测量前、非 grid 布局或未启用折叠时为 `'unset'` */
  currentHeight: ComputedRef<'unset' | number>;
  /** 供宿主绑定的高度样式值（如 `'72px'`）；`currentHeight` 为 `'unset'` 时为 `undefined`（非 grid 布局不施加高度） */
  heightStyle: ComputedRef<string | undefined>;
  /** 切换展开/折叠，并置位 `isManualToggle` */
  changeExpandStatus: () => void;
  /** 立即重测一次（自然高度 / 行高 / 行边界），并同步容器与行元素观察 */
  updateHeights: () => void;
  /** 断开 RO / IO 并复位观察与测量状态；调用后需再次 `updateHeights()` 才恢复观察 */
  cleanupObservers: () => void;
}

/**
 * 搜索表单高度测量与折叠状态 Hook
 *
 * @description 由 UI 适配层的 `SearchForm` 调用：测量表单自然高度与行边界，产出折叠高度、
 * 是否显示展开按钮与当前应施加的高度样式；容器或行元素尺寸变化后自动重测，
 * 折叠态下隐藏区存在已填值的字段时自动展开。
 *
 * @param props - 见 {@link UseSearchFormExpandProps}
 * @returns {UseSearchFormExpandReturn} 高度状态与操作句柄（见 {@link UseSearchFormExpandReturn}）
 *
 * @example
 * ```ts
 * const { heightStyle, showExpandToggle, expandStatus, changeExpandStatus } =
 *   useSearchFormExpand({ form, expand: true, layout: 'grid', rowGap: 16 })
 * ```
 */
export function useSearchFormExpand(
  props: UseSearchFormExpandProps
): UseSearchFormExpandReturn {
  const proFormHeight = ref<'unset' | number>('unset');
  const collapseHeight = ref(0);
  const rowHeight = ref(32);
  // 各行底部相对表单元素顶部的偏移（升序），空数组表示行边界不可测
  const rowBoundaries = ref<number[]>([]);

  let resizeObserver: ResizeObserver | null = null;
  let intersectionObserver: IntersectionObserver | null = null;
  let observedFormEl: Element | null = null;
  let observedItemEls = new Set<Element>();
  let observedInitEls = new Set<Element>();
  let initObserverGeneration = 0;
  // 初值自动展开判定是否已产出结果：产出后重测不覆盖当前展开状态
  let initExpandSettled = false;
  let measuredEl: any;
  let lastAppliedNaturalHeight: number | undefined;
  let lastAppliedRowHeight: number | undefined;
  let lastAppliedRowBoundaries: number[] | undefined;
  let measureRafId: number | null = null;

  const cleanupObservers = () => {
    if (measureRafId !== null) {
      cancelAnimationFrame(measureRafId);
      measureRafId = null;
    }
    if (resizeObserver) {
      resizeObserver.disconnect();
      resizeObserver = null;
    }
    if (intersectionObserver) {
      intersectionObserver.disconnect();
      intersectionObserver = null;
    }
    initObserverGeneration += 1;
    observedFormEl = null;
    observedItemEls = new Set();
    observedInitEls = new Set();
    measuredEl = undefined;
    // 初值判定随观察一并复位，下一次 updateHeights 重建 IO 后可再次产出判定
    initExpandSettled = false;
  };

  onBeforeUnmount(() => {
    cleanupObservers();
  });

  const computedExpand = computed(() => {
    if (!props.expand) return false;
    if (props.expand === true) return { minExpandRows: 2, expandStatus: false };
    return {
      minExpandRows: Math.max(Math.floor(props.expand.minExpandRows ?? 2), 1),
      expandStatus: props.expand.expandStatus ?? false,
    };
  });

  const showExpandToggle = ref(false);
  // 初始展开状态与 expand 配置对齐（默认折叠）
  const expandStatus = ref(
    computedExpand.value ? computedExpand.value.expandStatus : false
  );

  const isFormItemEl = (el: Element) =>
    typeof el.className === 'string' && el.className.includes('-form-item');

  /*
   * 收集表单内最外层行元素：剔除存在行元素祖先的嵌套表单项，
   * 行边界测量与尺寸观察仅统计顶层行
   */
  const getOuterFormItemEls = (formEl: Element): Element[] =>
    Array.from(formEl.querySelectorAll("[class*='-form-item']")).filter(el => {
      let parent = el.parentElement;
      while (parent && parent !== formEl) {
        if (isFormItemEl(parent)) return false;
        parent = parent.parentElement;
      }
      return true;
    });

  /*
   * 布局盒坐标系下的绝对 Y：沿 offsetParent 链逐级累加 offsetTop（栅格列等祖先带 position: relative 时
   * 行元素与表单元素不共享 offsetParent，单级 offsetTop 不足以换算，逐级累加收敛两坐标系）
   */
  const getAbsoluteTop = (el: any): number | null => {
    let top = 0;
    let current: any = el;
    while (current) {
      if (typeof current.offsetTop !== 'number') return null;
      top += current.offsetTop;
      current = current.offsetParent;
    }
    return top;
  };

  /*
   * 行边界测量：垂直区间重叠的相邻行元素归为同一行，
   * 返回各行底部相对表单元素顶部的偏移（升序），全部读取布局盒属性（offsetTop / offsetHeight）
   * 无可见行或任一元素坐标链不可测时返回 null
   */
  const measureRowBoundaries = (
    formEl: any,
    itemEls: Element[]
  ): number[] | null => {
    const formTop = getAbsoluteTop(formEl);
    if (formTop === null) return null;

    const measured: Array<{ el: HTMLElement; absTop: number }> = [];
    for (const el of itemEls as HTMLElement[]) {
      const absTop = getAbsoluteTop(el);
      // 任一元素坐标链不可测则整组行边界不可信，放弃本次测量
      if (absTop === null) return null;
      measured.push({ el, absTop });
    }

    const boxes = measured
      .filter(box => box.el.offsetHeight > 0)
      .map(box => ({
        top: box.absTop - formTop,
        bottom: box.absTop - formTop + box.el.offsetHeight,
      }))
      .sort((a, b) => a.top - b.top);
    if (boxes.length === 0) return null;

    const rows: Array<{ top: number; bottom: number }> = [];
    for (const box of boxes) {
      const current = rows[rows.length - 1];
      if (current && box.top < current.bottom) {
        current.bottom = Math.max(current.bottom, box.bottom);
      } else {
        rows.push({ top: box.top, bottom: box.bottom });
      }
    }

    const boundaries = rows.map(row => row.bottom);
    const measurable =
      boundaries.length > 0 &&
      boundaries.every(
        (bottom, i) => bottom > 0 && (i === 0 || bottom > boundaries[i - 1])
      );
    return measurable ? boundaries : null;
  };

  // 同一帧内的多次测量请求合并为一次
  const scheduleMeasure = () => {
    if (measureRafId !== null) return;
    measureRafId = requestAnimationFrame(() => {
      measureRafId = null;
      updateHeights();
    });
  };

  const createResizeObserver = (): ResizeObserver | null => {
    if (!resizeObserver && typeof ResizeObserver !== 'undefined') {
      resizeObserver = new ResizeObserver(() => scheduleMeasure());
    }
    return resizeObserver;
  };

  /*
   * 行元素观察集合同步：新增行元素补登记观察，离开表单的行元素解除观察；
   * 表单容器与行元素共用同一 ResizeObserver，任一尺寸变化均经 rAF 合帧后重测
   */
  const syncObservedItems = (itemEls: Element[]) => {
    const observer = createResizeObserver();
    if (!observer) return;
    const next = new Set(itemEls);
    next.forEach(el => {
      if (!observedItemEls.has(el)) observer.observe(el);
    });
    observedItemEls.forEach(el => {
      if (!next.has(el)) observer.unobserve(el);
    });
    observedItemEls = next;
  };

  /*
   * 表单容器观察同步：容器元素变化时改观察新容器，
   * 观察器缺失（重测前被 cleanupObservers 断开）时按需重建
   */
  const syncObservedForm = (formEl: Element) => {
    if (observedFormEl === formEl) return;
    const observer = createResizeObserver();
    if (!observer) return;
    if (observedFormEl) observer.unobserve(observedFormEl);
    observedFormEl = formEl;
    observer.observe(formEl);
  };

  const updateHeights = () => {
    if (!props.expand || !props.form?.formRef?.value) return;
    const proFormEl = (props.form.formRef.value as any)?.$el;
    if (!proFormEl) return;

    syncObservedForm(proFormEl);

    // 新表单元素重建测量基线
    if (measuredEl !== proFormEl) {
      measuredEl = proFormEl;
      lastAppliedNaturalHeight = undefined;
      lastAppliedRowHeight = undefined;
      lastAppliedRowBoundaries = undefined;
    }

    const itemEls = getOuterFormItemEls(proFormEl);
    syncObservedItems(itemEls);

    // 行高取首个行元素布局盒高度，布局盒读数缺失时回退 getBoundingClientRect
    const firstItemEl = itemEls[0] as HTMLElement | undefined;
    const itemHeight =
      firstItemEl?.offsetHeight ||
      firstItemEl?.getBoundingClientRect?.()?.height;
    if (
      itemHeight &&
      itemHeight > 0 &&
      (lastAppliedRowHeight === undefined ||
        Math.abs(itemHeight - lastAppliedRowHeight) >= MEASURE_DEAD_ZONE_PX)
    ) {
      rowHeight.value = itemHeight;
      lastAppliedRowHeight = itemHeight;
    }

    // 测量自然展开高度
    const naturalHeight =
      proFormEl.scrollHeight ||
      proFormEl.getBoundingClientRect?.()?.height ||
      0;
    if (
      naturalHeight > 0 &&
      (lastAppliedNaturalHeight === undefined ||
        Math.abs(naturalHeight - lastAppliedNaturalHeight) >=
          MEASURE_DEAD_ZONE_PX)
    ) {
      proFormHeight.value = naturalHeight;
      lastAppliedNaturalHeight = naturalHeight;
    }

    // 行边界不可测时清空基线，折叠高度回退行高算术
    const boundaries = measureRowBoundaries(proFormEl, itemEls);
    if (boundaries) {
      const prev = lastAppliedRowBoundaries;
      if (
        !prev ||
        prev.length !== boundaries.length ||
        boundaries.some(
          (bottom, i) => Math.abs(bottom - prev[i]) >= MEASURE_DEAD_ZONE_PX
        )
      ) {
        rowBoundaries.value = boundaries;
        lastAppliedRowBoundaries = boundaries;
      }
    } else if (lastAppliedRowBoundaries !== undefined) {
      rowBoundaries.value = [];
      lastAppliedRowBoundaries = undefined;
    }

    // 观察重建后仍存在溢出行时重新执行初值判定（cleanupObservers 已复位 settled）
    if (showExpandToggle.value) {
      setInitExpandStatus();
    }
  };

  // 手动展开/收起标记：置位后自动测量不覆盖用户操作
  const isManualToggle = ref(false);

  const changeExpandStatus = () => {
    isManualToggle.value = true;
    expandStatus.value = !expandStatus.value;
  };

  const hasFieldValue = (val: any) =>
    val !== null &&
    val !== undefined &&
    val !== '' &&
    !(Array.isArray(val) && val.length === 0) &&
    !(typeof val === 'object' && Object.keys(val).length === 0);

  /*
   * 使用 IntersectionObserver 检测折叠状态下隐藏字段是否有值
   * 如果有值则自动展开，判定结果一次性产出，后续重测保持当前状态
   */
  const setInitExpandStatus = () => {
    if (isManualToggle.value || initExpandSettled) return;
    const initStatus = computedExpand.value
      ? computedExpand.value.expandStatus
      : false;
    expandStatus.value = initStatus;
    if (!props.form?.formRef?.value || !computedExpand.value) return;
    const formEl = (props.form.formRef.value as any).$el;
    const formItemsEl = formEl?.querySelectorAll?.(
      "[class*='-form-item'] [path], [class*='-form-item'][path]"
    );
    if (!formItemsEl || formItemsEl.length === 0) return;
    if (typeof IntersectionObserver === 'undefined') return;

    if (!intersectionObserver) {
      const generation = ++initObserverGeneration;
      const observer = new IntersectionObserver(
        entries => {
          observer.disconnect();
          observedInitEls = new Set();
          // 表单实例切换前入队的回调不参与当前判定
          if (generation !== initObserverGeneration) return;
          if (isManualToggle.value) return;
          initExpandSettled = true;
          expandStatus.value = entries.some(e => {
            // 如果隐藏字段（intersectionRatio === 0）有值，则自动展开
            if (e.intersectionRatio === 0) {
              const path = e.target.getAttribute('path');
              const searchFieldValue = path
                ? props.form?.getFormData?.(path)
                : undefined;
              return hasFieldValue(searchFieldValue);
            }
            return computedExpand.value
              ? computedExpand.value.expandStatus
              : false;
          });
        },
        { root: formEl }
      );
      intersectionObserver = observer;
      observedInitEls = new Set();
    }

    const observer = intersectionObserver;
    formItemsEl.forEach((element: Element) => {
      if (observedInitEls.has(element)) return;
      observedInitEls.add(element);
      observer.observe(element);
    });
  };

  /*
   * ResizeObserver 随表单实例重挂：容器元素变化时重建观察（断开旧监听并观察新容器），
   * 行元素与初值判定元素在后续测量中重新登记
   */
  watch(
    () => props.form?.formRef?.value,
    val => {
      const formEl = (val as any)?.$el;
      if (observedFormEl === formEl) return;
      observedFormEl = formEl;
      if (resizeObserver) {
        resizeObserver.disconnect();
        resizeObserver = null;
      }
      observedItemEls = new Set();
      if (intersectionObserver) {
        intersectionObserver.disconnect();
        intersectionObserver = null;
        initObserverGeneration += 1;
      }
      observedInitEls = new Set();
      initExpandSettled = false;
      if (formEl) {
        createResizeObserver()?.observe(formEl);
      }
    },
    { immediate: true }
  );

  /*
   * 测量驱动：可见字段数 / formRef 实例 / expand 配置任一变化后重测
   * flush: 'post' 保证在 DOM 更新完成后读取新布局，immediate 覆盖首次挂载
   */
  watch(
    [
      () =>
        props.form?.fields?.value?.filter(
          (f: any) => isObjectItem(f) && !toValue(f.hidden)
        )?.length,
      () => props.form?.formRef?.value,
      () => props.expand,
    ],
    () => {
      updateHeights();
    },
    { flush: 'post', immediate: true }
  );

  /*
   * 计算折叠高度和是否显示展开按钮
   * 行边界可测且行数充足时折叠高度取第 minExpandRows 行的真实底部；行数不足 minExpandRows 时折叠高度为自然高度（无溢出行）
   * 行边界不可测时回退行高算术（minExpandRows * 行高 + 行间距）
   * 自然高度与折叠高度差异 > 1px，说明有字段溢出，显示展开按钮
   */
  watchEffect(
    () => {
      if (typeof proFormHeight.value !== 'number') return;
      if (props.layout === 'grid' && computedExpand.value) {
        const { minExpandRows } = computedExpand.value;
        const rows = rowBoundaries.value;
        const boundary = rows[minExpandRows - 1];
        const arithmeticHeight =
          minExpandRows * rowHeight.value +
          (minExpandRows - 1) * (props.rowGap ?? 16);
        const candidate =
          rows.length > 0
            ? (boundary ?? +proFormHeight.value)
            : arithmeticHeight;
        collapseHeight.value = Math.min(candidate, +proFormHeight.value);
        showExpandToggle.value =
          +proFormHeight.value - collapseHeight.value > 1;
        if (showExpandToggle.value) {
          setInitExpandStatus();
        }
      } else {
        showExpandToggle.value = false;
      }
    },
    { flush: 'post' }
  );

  // 首次测量完成前、非 grid 布局或未启用折叠时不施加高度约束
  const currentHeight = computed(() => {
    if (proFormHeight.value === 'unset') return 'unset';
    if (!computedExpand.value || props.layout !== 'grid') return 'unset';
    return expandStatus.value ? proFormHeight.value : collapseHeight.value;
  });

  const heightStyle = computed(() => {
    const h = currentHeight.value;
    return h !== 'unset' && h !== undefined ? `${h}px` : undefined;
  });

  return {
    proFormHeight,
    collapseHeight,
    rowHeight,
    showExpandToggle,
    expandStatus,
    isManualToggle,
    computedExpand,
    currentHeight,
    heightStyle,
    changeExpandStatus,
    updateHeights,
    cleanupObservers,
  };
}

export default useSearchFormExpand;
