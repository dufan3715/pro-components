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

export type PopupProps = ComponentProps<typeof Popup> & {
  container: ContainerComponent;
};

export type FormPopup = {
  props: PopupProps;
  open: (path: string) => void;
  close: () => void;
  updateProps: (props: Partial<PopupProps>) => void;
  visible: ComputedRef<boolean>;
  popupFieldPath: Ref<string | undefined>;
  popupFieldValue: Ref<any | undefined>;
};

// popup injection key
export const InjectionPopupKey = Symbol('form-popup');

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
