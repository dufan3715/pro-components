import type { App, Plugin } from 'vue';
import Form from './components/form';
import Table from './components/table';
import ComponentProvider from './components/component-provider';

export * from './components/form';
export * from './components/table';
export * from './components/component-provider';

type SFCWithInstall<T> = T & Plugin;
const withInstall = <T>(comp: T) => {
  (comp as SFCWithInstall<T>).install = (app: App) => {
    app.component((comp as any).name, comp as any);
  };
  return comp as SFCWithInstall<T>;
};

const ProForm = withInstall(Form);
const ProTable = withInstall(Table) as typeof Table;
const ProComponentProvider = withInstall(ComponentProvider);

export { ProForm, ProTable, ProComponentProvider };

const components = [ProForm, ProTable as any, ProComponentProvider];

export default {
  /**
   * @qin-ui/antd-vue-pro 安装方法
   * @description 全局注册所有组件（ProForm、ProTable、ProComponentProvider）
   *
   * @param {App} app - Vue 应用实例
   *
   * @example
   * ```ts
   * import { createApp } from 'vue'
   * import QinUI from '@qin-ui/antd-vue-pro'
   *
   * const app = createApp(App)
   * app.use(QinUI) // 全局注册所有组件
   * ```
   */
  install(app: App) {
    components.forEach(component => {
      app.component(component.name!, component);
    });
  },
};
