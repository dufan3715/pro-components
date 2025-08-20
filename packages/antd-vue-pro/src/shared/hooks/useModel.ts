import { computed, ref, toValue } from 'vue';

export default function useModel<T>(
  props: Record<string, any>,
  name: string,
  options?: { default?: T | (() => T) }
) {
  const eventName = `onUpdate:${name}` as const;
  const emitUpdate = props[eventName] as (value: T) => void;

  const _modelValue = ref(toValue(options?.default));

  const modelValue = computed({
    get: () => (props[name] === void 0 ? _modelValue.value : props[name]) as T,
    set: (val: T) => {
      _modelValue.value = val;
      emitUpdate?.(val);
    },
  });

  return modelValue;
}
