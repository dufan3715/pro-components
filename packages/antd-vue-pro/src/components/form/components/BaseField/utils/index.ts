import { Field } from '../../../types';
import { componentMap } from '../../../constants';
import { INJECT_CONFIG } from '../../../../component-provider';
import { inject } from 'vue';

export const getInitProps = (field: Field): Record<string, any> => {
  const { component } = field as any;
  const picker = component === 'date-picker' ? '' : (field as any).picker;
  if (typeof component === 'string' && component in componentMap) {
    const k = [component, picker]
      .filter(Boolean)
      .join('.') as keyof typeof INJECT_CONFIG;

    if (INJECT_CONFIG[k]) {
      const config = INJECT_CONFIG[k];
      const injectProps = inject(config.injectionKey, config.default);
      return injectProps;
    }
  }
  return {};
};
