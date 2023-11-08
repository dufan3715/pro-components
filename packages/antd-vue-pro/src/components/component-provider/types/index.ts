import { INJECT_COMPONENT_PROPS_KEYS as BaseFieldPropsKeys } from '../../form/constants';
import { PRO_TABLE_INJECT_COMPONENT_PROPS_KEYS as TablePropsKeys } from '../../table/constants';

export type ComponentVars = {
  proForm?: Record<string, Record<string, any>>;
  proFormItems?: Record<string, Record<string, any>>;
  proFormField?: Partial<
    Record<keyof typeof BaseFieldPropsKeys, Record<string, any>>
  >;
  proTable?: Partial<Record<keyof typeof TablePropsKeys, Record<string, any>>>;
};
