import { Field } from '../../../types';
import { getInjectConfig } from '../../../../component-provider';
import { inject } from 'vue';

export const getInitProps = (field: Field): Record<string, any> => {
  const { component, type } = field as any;
  if (typeof component === 'string') {
    const k = [component, type].filter(Boolean).join('.');
    const config = getInjectConfig(k);
    if (!config) return {};
    const injectProps = inject(config.injectionKey, config.default);
    return injectProps;
  }
  return {};
};
