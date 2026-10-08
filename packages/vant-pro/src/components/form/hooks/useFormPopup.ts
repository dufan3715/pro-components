import {
  computed,
  type ComputedRef,
  inject,
  provide,
  reactive,
  type Ref,
  ref,
  getCurrentInstance,
  useId,
} from 'vue';
import { Popup } from '../../../shared/ui';
import type { ComponentProps } from 'vue-component-type-helpers';
import type { ContainerComponent } from '../types';

/**
 * Vant Popup 组件属性类型
 * @description 用于配置表单弹出层的属性
 
 * @public
 */
export type PopupProps = ComponentProps<typeof Popup> & {
  container?: ContainerComponent;
};

/**
 * Popup 默认属性配置
 * @public
 */
export const DEFAULT_POPUP_PROPS: Partial<PopupProps> = {
  safeAreaInsetBottom: true,
  position: 'bottom',
  round: true,
};

/**
 * 表单弹出层管理对象
 * @description Vant 移动端特有的表单弹出层功能
 
 * @public
 */
export type FormPopup = {
  /** Popup 组件消费的合并属性：基础属性叠加单次打开覆盖 */
  props: PopupProps;
  /** 打开指定路径字段的弹出层，支持传入控件侧初始值、仅本次生效的 PopupProps 和字段实例 ID */
  open: (
    path: string,
    initialValue?: any,
    customProps?: Partial<PopupProps>,
    fieldId?: number | string
  ) => void;
  /** 关闭弹出层 */
  close: () => void;
  /** 重置 Popup 基础属性为全局默认配置并清除单次打开覆盖 */
  resetProps: () => void;
  /** 更新 Popup 基础属性，后续每次打开均沿用 */
  updateProps: (props: Partial<PopupProps>) => void;
  /** 弹出层是否可见 */
  visible: ComputedRef<boolean>;
  /** 当前弹出层对应的字段路径 */
  popupFieldPath: Ref<string | undefined>;
  /** 当前激活的字段实例唯一 ID */
  activeFieldId: Ref<number | string | undefined>;
  /** 当前弹出层字段的值 */
  popupFieldValue: Ref<any | undefined>;
  /** 唯一 DOM 容器 ID */
  contentId: ComputedRef<string>;
  /** 唯一 Teleport 目标选择器 */
  teleportTo: ComputedRef<string>;
};

/**
 * 无组件上下文的独立弹层 id 兜底种子（`standalone-1`, `standalone-2`, ...）。
 *
 * @internal 模块级可变状态，不对外暴露。
 * @remarks 仅服务不在组件 setup 内调用的命令式独立弹层场景；组件上下文内的弹层容器 id 由 useId() 派生。
 */
let fallbackPopupIdSeed = 0;

/** 弹出层注入 key */
export const InjectionPopupKey = Symbol('form-popup');

/**
 * @qin-ui/vant-pro 表单弹出层管理 Hook
 *
 * @description 用于管理 Vant 移动端的表单弹出层（Popup）。
 * 在移动端表单中，某些字段（如地址选择、日期选择）需要以弹出层形式展示。
 *
 * @returns {FormPopup} 弹出层管理对象
 *
 * @example
 * ```ts
 * const formPopup = useFormPopup(true)
 * formPopup.open('address', ['110000', '110100']) // 打开地址选择弹出层
 * formPopup.close()                              // 关闭
 * formPopup.updateProps({ position: 'top' })
 * ```
 
 * @public
 */
export function useFormPopup(root?: boolean): FormPopup;

export function useFormPopup(initRoot?: boolean): FormPopup {
  if (!initRoot) {
    if (getCurrentInstance()) {
      const injectStore = inject<FormPopup | undefined>(
        InjectionPopupKey,
        undefined
      );
      if (injectStore) return injectStore;
    }
    console.warn(
      '[useFormPopup] root=false 但未找到注入的父弹层实例（当前不在 ProForm 组件上下文中），已回退为创建独立弹层。'
    );
  }

  const instanceId = getCurrentInstance()
    ? useId()
    : `standalone-${++fallbackPopupIdSeed}`;
  const contentId = computed(() => `pro-form-popup-content-${instanceId}`);
  const teleportTo = computed(() => `#${contentId.value}`);

  const popupFieldPath = ref<string>();
  const activeFieldId = ref<number | string>();
  const popupFieldValue = ref<any>();

  /** 持久基础属性：默认配置与 updateProps 写入的合并结果 */
  const baseProps = reactive<Partial<PopupProps>>({
    ...DEFAULT_POPUP_PROPS,
  });
  /** 单次打开的覆盖属性：随下一次 open 重置 */
  const openProps = reactive<Partial<PopupProps>>({});
  /** 弹层组件消费的合并属性：openProps 覆盖 baseProps */
  const props = reactive<Partial<PopupProps>>({
    ...DEFAULT_POPUP_PROPS,
  });

  /** 将基础属性与单次覆盖属性同步到合并属性 */
  function syncProps() {
    Object.keys(props).forEach(k => {
      if (!(k in baseProps) && !(k in openProps)) {
        delete (props as any)[k];
      }
    });
    Object.assign(props, baseProps, openProps);
  }

  /** 重置弹层基础属性：移除非默认项并还原为 DEFAULT_POPUP_PROPS，同时清空单次打开覆盖 */
  function resetProps() {
    Object.keys(baseProps).forEach(k => {
      if (!(k in DEFAULT_POPUP_PROPS)) {
        delete (baseProps as any)[k];
      }
    });
    Object.assign(baseProps, DEFAULT_POPUP_PROPS);
    Object.keys(openProps).forEach(k => {
      delete (openProps as any)[k];
    });
    syncProps();
  }

  /**
   * 打开指定路径字段的弹层
   * @param path - 字段路径
   * @param initialValue - 弹层初始值，取控件侧取值（已应用 valueFormatter.get）
   * @param customProps - 本次打开的 PopupProps 覆盖项，仅对本次打开生效
   * @param fieldId - 字段实例 ID，用于多实例隔离
   */
  function open(
    path: string,
    initialValue?: any,
    customProps?: Partial<PopupProps>,
    fieldId?: number | string
  ) {
    Object.keys(openProps).forEach(k => {
      delete (openProps as any)[k];
    });
    if (customProps) {
      Object.assign(openProps, customProps);
    }
    syncProps();
    popupFieldPath.value = path;
    activeFieldId.value = fieldId;
    // 无条件赋值：打开字段时写入当前初值，不残留上一个字段的旧值
    popupFieldValue.value = initialValue;
  }

  /** 关闭弹层并清空当前字段状态 */
  function close() {
    popupFieldPath.value = undefined;
    activeFieldId.value = undefined;
    popupFieldValue.value = undefined;
  }

  const visible = computed(() => !!popupFieldPath.value);

  /** 写入持久基础属性，后续每次打开均沿用 */
  function updateProps(_props: Partial<PopupProps>) {
    Object.assign(baseProps, _props);
    syncProps();
  }

  const store: FormPopup = {
    props: props as PopupProps,
    open,
    close,
    resetProps,
    updateProps,
    visible,
    popupFieldPath,
    activeFieldId,
    popupFieldValue,
    contentId,
    teleportTo,
  };
  if (getCurrentInstance()) {
    provide(InjectionPopupKey, store);
  }
  return store;
}
