import type { Base } from '../../form/types';
import type { ProFormProps } from '../../form/components';
import type { AllowedComponentProps } from 'vue';
import type { GetComponentType, ComponentName } from '../../form/constants';
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

/** 各组件的全局默认属性类型：键为组件名，值为该组件可注入的默认属性 */
export type RequiredComponentVars = {
  /**
   * ProForm 全局默认属性
   *
   * @description `form` 不参与全局注入：由显式 `:form` 实例驱动。
   */
  'pro-form': PP<Omit<ProFormProps & FormProps, 'form'>>;
} & {
  [K in Exclude<ComponentName, 'custom'>]: FP<
    ComponentProps<GetComponentType<K>>
  >;
};

/**
 * 组件全局配置
 *
 * @description RequiredComponentVars 的 Partial 版本，作为 ProComponentProvider 的 `componentVars` 属性类型。
 *
 * @public
 */
export type ComponentVars = Partial<RequiredComponentVars>;
