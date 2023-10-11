import { inject } from 'vue';
import { Field } from '../types';
import {
  COMPONENT_MAP,
  INJECT_COMPONENT_PROPS_KEYS as PROPS_KEYS,
  INIT_COMPONENT_PROPS_MAP as PROPS_MAP,
} from '../constants';

const useInitProps = () => {
  const initPropsMap = new Map();

  PROPS_MAP.forEach((val, key) => {
    const injectProps = inject(key, {});
    const mergedProps = { ...val, ...injectProps };
    initPropsMap.set(key, mergedProps);
  });

  const getInitProps = (field: Field): Record<string, any> => {
    const { component, type = '' } = field as any;
    if (COMPONENT_MAP.has(component)) {
      const k = `${component}${type}` as keyof typeof PROPS_KEYS;
      return initPropsMap.get(PROPS_KEYS[k]) || {};
    }
    return {};
  };

  return { getInitProps };
};

export default useInitProps;
