import { Field } from '../types';
import { COMPONENT_MAP } from '../constants';
import {
  INJECT_KEYS,
  INIT_PROPS_MAP,
  useInjectProps,
} from '../../component-provider';

const useInitProps = () => {
  const initPropsMap = new Map();

  INIT_PROPS_MAP.forEach((val, key) => {
    const injectProps = useInjectProps(key);
    initPropsMap.set(key, injectProps);
  });

  const getInitProps = (field: Field): Record<string, any> => {
    const { component, type = '' } = field as any;
    if (COMPONENT_MAP.has(component)) {
      const k = [component, type]
        .filter(Boolean)
        .join('.') as keyof typeof INJECT_KEYS;
      return initPropsMap.get(INJECT_KEYS[k]) || {};
    }
    return {};
  };

  return { getInitProps };
};

export default useInitProps;
