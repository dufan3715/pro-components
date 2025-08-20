import { Field } from '../../../types';
import { COMPONENT_MAP } from '../../../constants';
import { INJECT_CONFIG } from '../../../../component-provider';
import { inject } from 'vue';

const initPropsMap = new Map();

export const getInitProps = (field: Field): Record<string, any> => {
  const { component, type = '' } = field as any;
  if (COMPONENT_MAP.has(component)) {
    const k = [component, type]
      .filter(Boolean)
      .join('.') as keyof typeof INJECT_CONFIG;

    if (initPropsMap.has(k)) {
      return initPropsMap.get(k);
    } else if (INJECT_CONFIG[k]) {
      const config = INJECT_CONFIG[k];
      const injectProps = inject(config.injectionKey, config.default);
      initPropsMap.set(k, injectProps);
      return injectProps;
    }
  }
  return {};
};
