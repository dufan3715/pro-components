import type { App, Plugin } from 'vue';
import Form from './components/form';
import ComponentProvider from './components/component-provider';

export * from './components/form';
export * from './components/component-provider';

type SFCWithInstall<T> = T & Plugin;
const withInstall = <T>(comp: T) => {
  (comp as SFCWithInstall<T>).install = (app: App) => {
    app.component((comp as any).name, comp as any);
  };
  return comp as SFCWithInstall<T>;
};

const ProForm = withInstall(Form);
const ProComponentProvider = withInstall(ComponentProvider);

export { ProForm, ProComponentProvider };

const components = [ProForm, ProComponentProvider];

export default {
  /**
   * @qin-ui/vant-pro 安装方法
   * @description 全局注册所有组件（ProForm、ProComponentProvider）
   *
   * @param {App} app - Vue 应用实例
   *
   * @example
   * ```ts
   * import { createApp } from 'vue'
   * import QinUI from '@qin-ui/vant-pro'
   * const app = createApp(App)
   * app.use(QinUI)
   * ```
   */
  install(app: App) {
    components.forEach(component => {
      if (component.name) {
        app.component(component.name, component);
      }
    });
  },
};
