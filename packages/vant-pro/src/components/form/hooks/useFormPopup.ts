import {
  computed,
  ComputedRef,
  inject,
  provide,
  reactive,
  Ref,
  ref,
} from 'vue';
import { Popup } from '../../../shared/ui';
import { ComponentProps } from 'vue-component-type-helpers';
import { ContainerComponent } from '../types';

/**
 * Vant Popup 组件属性类型
 * @description 用于配置表单弹出层的属性
 
 * @public
 */
export type PopupProps = ComponentProps<typeof Popup> & {
  container: ContainerComponent;
};

/**
 * 表单弹出层管理对象
 * @description Vant 移动端特有的表单弹出层功能
 
 * @public
 */
export type FormPopup = {
  /** Popup 组件属性 */
  props: PopupProps;
  /** 打开指定路径字段的弹出层 */
  open: (path: string) => void;
  /** 关闭弹出层 */
  close: () => void;
  /** 更新 Popup 组件属性 */
  updateProps: (props: Partial<PopupProps>) => void;
  /** 弹出层是否可见 */
  visible: ComputedRef<boolean>;
  /** 当前弹出层对应的字段路径 */
  popupFieldPath: Ref<string | undefined>;
  /** 当前弹出层字段的值 */
  popupFieldValue: Ref<any | undefined>;
};

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
 * formPopup.open('address') // 打开地址选择弹出层
 * formPopup.close()         // 关闭
 * formPopup.updateProps({ position: 'top' })
 * ```
 
 * @public
 */
export function useFormPopup(root?: boolean): FormPopup;

export function useFormPopup(initRoot?: boolean) {
  if (!initRoot) {
    const injectStore = inject(InjectionPopupKey, undefined);
    if (injectStore) return injectStore as never;
  }

  const props = reactive<Partial<PopupProps>>({
    safeAreaInsetBottom: true,
    position: 'bottom',
    round: true,
  });

  const popupFieldPath = ref<string>();
  const popupFieldValue = ref();

  function open(path: string) {
    popupFieldPath.value = path;
  }

  function close() {
    popupFieldPath.value = undefined;
    popupFieldValue.value = undefined;
  }

  const visible = computed(() => !!popupFieldPath.value);

  function updateProps(_props: Partial<PopupProps>) {
    Object.assign(props, _props);
  }

  const store = {
    props,
    open,
    close,
    updateProps,
    visible,
    popupFieldPath,
    popupFieldValue,
  };
  provide(InjectionPopupKey, store);
  return store;
}
