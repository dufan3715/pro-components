import { inject, provide } from 'vue';
import { INIT_PROPS_MAP } from '../constants';

export const useInjectProps = (key: symbol): Record<string, any> => {
  const initProps = INIT_PROPS_MAP.get(key) ?? {};
  const injectProps = inject(key, {});
  return { ...initProps, ...injectProps };
};

export const useProviderProps = (key: symbol, value: Record<string, any>) => {
  provide(key, value);
};
