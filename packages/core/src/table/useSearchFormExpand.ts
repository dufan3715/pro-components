/**
 * @module Core/useSearchFormExpand
 * @description 搜索表单高度测量、网格折叠与自适应展开状态管理核心 Hook
 *
 * ## 核心职责
 * 1. 自然高度与单行高度测量：测量表单自然展开高度与单行高度，并监听表单尺寸变化驱动更新（测量写入含死区）；
 * 2. 折叠高度计算与溢出检测：根据 minExpandRows 与 rowGap 计算折叠高度，判断是否显示展开/收起按钮；
 * 3. 溢出字段初值自动展开：检测隐藏区域内是否有已填写的搜索值，有值自动展开；
 * 4. 用户交互锁定：置位 isManualToggle 后，自动测量不覆盖用户手动折叠/展开状态；
 * 5. 跨包统一高度状态导出（heightStyle, currentHeight, showExpandToggle, expandStatus）。
 */
import {
  ref,
  computed,
  watch,
  watchEffect,
  onBeforeUnmount,
  type ComputedRef,
  type Ref,
} from 'vue';

// 测量写入死区（px）：与上次写入值的差异小于该值时不更新状态
const MEASURE_DEAD_ZONE_PX = 2;

export interface UseSearchFormExpandProps {
  form: any;
  expand?: boolean | { minExpandRows?: number; expandStatus?: boolean };
  layout?: 'grid' | 'inline';
  rowGap?: number;
  columnGap?: number;
}

export interface UseSearchFormExpandReturn {
  proFormHeight: Ref<'unset' | number>;
  collapseHeight: Ref<number>;
  rowHeight: Ref<number>;
  showExpandToggle: Ref<boolean>;
  expandStatus: Ref<boolean>;
  isManualToggle: Ref<boolean>;
  computedExpand: ComputedRef<
    false | { minExpandRows: number; expandStatus: boolean }
  >;
  currentHeight: ComputedRef<'unset' | number>;
  heightStyle: ComputedRef<string | undefined>;
  changeExpandStatus: () => void;
  updateHeights: () => void;
  cleanupObservers: () => void;
}

export function useSearchFormExpand(
  props: UseSearchFormExpandProps
): UseSearchFormExpandReturn {
  const proFormHeight = ref<'unset' | number>('unset');
  const collapseHeight = ref(0);
  const rowHeight = ref(32);

  let resizeObserver: ResizeObserver | null = null;
  let intersectionObserver: IntersectionObserver | null = null;
  let measuredEl: any;
  let lastAppliedNaturalHeight: number | undefined;
  let lastAppliedRowHeight: number | undefined;
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

  const updateHeights = () => {
    if (!props.expand || !props.form?.formRef?.value) return;
    const proFormEl = (props.form.formRef.value as any)?.$el;
    if (!proFormEl) return;

    // 新表单元素重建测量基线
    if (measuredEl !== proFormEl) {
      measuredEl = proFormEl;
      lastAppliedNaturalHeight = undefined;
      lastAppliedRowHeight = undefined;
    }

    const itemHeight = proFormEl
      ?.querySelector("[class*='-form-item']")
      ?.getBoundingClientRect?.()?.height;
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
  };

  // 同一帧内的多次测量请求合并为一次
  const scheduleMeasure = () => {
    if (measureRafId !== null) return;
    measureRafId = requestAnimationFrame(() => {
      measureRafId = null;
      updateHeights();
    });
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
   * 如果有值则自动展开，让用户看到已填写的搜索条件
   */
  const setInitExpandStatus = () => {
    if (isManualToggle.value) return;
    const initStatus = computedExpand.value
      ? computedExpand.value.expandStatus
      : false;
    expandStatus.value = initStatus;
    if (props.form?.formRef?.value && computedExpand.value) {
      const formEl = (props.form.formRef.value as any).$el;
      const formItemsEl = formEl?.querySelectorAll?.(
        "[class*='-form-item'] [path], [class*='-form-item'][path]"
      );
      if (!formItemsEl || formItemsEl.length === 0) return;
      if (intersectionObserver) {
        intersectionObserver.disconnect();
      }
      intersectionObserver = new IntersectionObserver(
        entries => {
          if (isManualToggle.value) return;
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
          intersectionObserver?.disconnect();
        },
        { root: formEl }
      );
      formItemsEl.forEach((element: Element) => {
        intersectionObserver?.observe(element);
      });
    }
  };

  /*
   * 测量驱动：可见字段数 / formRef 实例 / expand 配置任一变化后重测
   * flush: 'post' 保证在 DOM 更新完成后读取新布局，immediate 覆盖首次挂载
   */
  watch(
    [
      () => props.form?.fields?.value?.filter((f: any) => !f.hidden)?.length,
      () => props.form?.formRef?.value,
      () => props.expand,
    ],
    () => {
      updateHeights();
    },
    { flush: 'post', immediate: true }
  );

  /*
   * ResizeObserver 随表单实例重挂：实例替换时断开旧监听并观察新容器
   * 回调仅排队 scheduleMeasure，同一帧内的多次尺寸变化合并为一次测量
   */
  watch(
    () => props.form?.formRef?.value,
    val => {
      if (resizeObserver) {
        resizeObserver.disconnect();
        resizeObserver = null;
      }
      const formEl = (val as any)?.$el;
      if (formEl && typeof ResizeObserver !== 'undefined') {
        resizeObserver = new ResizeObserver(() => {
          scheduleMeasure();
        });
        resizeObserver.observe(formEl);
      }
    },
    { immediate: true }
  );

  /*
   * 计算折叠高度和是否显示展开按钮
   * 折叠高度 = minExpandRows * 行高 + (minExpandRows - 1) * 行间距
   * 如果实际高度与折叠高度差异 > 1px，说明有字段溢出，显示展开按钮
   */
  watchEffect(
    () => {
      if (typeof proFormHeight.value !== 'number') return;
      if (props.layout === 'grid' && computedExpand.value) {
        const { minExpandRows } = computedExpand.value;
        const rowGap = props.rowGap ?? 16;
        collapseHeight.value = Math.min(
          minExpandRows * rowHeight.value + (minExpandRows - 1) * rowGap,
          +proFormHeight.value
        );
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

  // 首次测量完成前不施加高度约束
  const currentHeight = computed(() => {
    if (proFormHeight.value === 'unset') return 'unset';
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
