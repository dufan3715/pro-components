import { INJECT_COMPONENT_PROPS_KEYS } from '../../form/constants';

export type ComponentVars = Partial<{
  proForm: Partial<{
    // form: {};
    // formItem: {};
    field: Partial<
      Record<keyof typeof INJECT_COMPONENT_PROPS_KEYS, Record<string, any>>
    >;
  }>;
  // proTable: Partial<{}>;
}>;
