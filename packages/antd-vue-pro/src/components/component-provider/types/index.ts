import { INJECT_COMPONENT_PROPS_KEYS } from '../../form/constants';

export type ComponentVars = {
  proForm?: Record<string, Record<string, any>>;
  proFormItems?: Record<string, Record<string, any>>;
  proFormField?: Partial<
    Record<keyof typeof INJECT_COMPONENT_PROPS_KEYS, Record<string, any>>
  >;
};
