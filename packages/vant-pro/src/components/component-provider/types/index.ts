import { Base, ProFormProps } from '../../form';
import { AllowedComponentProps } from 'vue';
import { GetComponentType, ComponentName } from '../../form/constants';
import type { ComponentProps } from 'vue-component-type-helpers';
import type { FormProps } from 'vant';

type PP<T extends Record<string, any>> = Partial<T & AllowedComponentProps>;

type FP<T extends Record<string, any>> = Partial<
  T &
    Pick<
      Base,
      | 'valueFormatter'
      | 'displayFormatter'
      | 'componentContainer'
      | 'modelProp'
      | 'popup'
    > &
    AllowedComponentProps
>;

export type RequiredComponentVars = {
  'pro-form': PP<Omit<ProFormProps & FormProps, 'form'>>;
} & {
  [K in Exclude<ComponentName, 'custom'>]: FP<
    ComponentProps<GetComponentType<K>>
  >;
};

export type ComponentVars = Partial<RequiredComponentVars>;
