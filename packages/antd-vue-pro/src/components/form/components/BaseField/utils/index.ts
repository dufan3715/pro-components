import { Field } from '../../../types';
import { COMPONENT_MAP } from '../../../constants';
import { INJECT_CONFIG } from '../../../../component-provider';
import { inject } from 'vue';

export const getInitProps = (field: Field): Record<string, any> => {
  const { component } = field as any;
  const type = component === 'input' ? '' : (field as any).type;
  if (COMPONENT_MAP.has(component)) {
    const k = [component, type]
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
