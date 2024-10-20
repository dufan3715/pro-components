import type { App, Plugin } from 'vue';
import Form from './components/form';
import Table from './components/table';
import ComponentProvider from './components/component-provider';

export * from './components/form';
export * from './components/table';
export * from './components/component-provider';

type SFCWithInstall<T> = T & Plugin;
const withInstall = <T>(comp: T) => {
  // eslint-disable-next-line no-param-reassign
  (comp as SFCWithInstall<T>).install = (app: App) => {
    app.component((comp as any).name, comp as any);
  };
  return comp as SFCWithInstall<T>;
};

const ProForm = withInstall(Form);
const ProTable = withInstall(Table);
const ProComponentProvider = withInstall(ComponentProvider);

export { ProForm, ProTable, ProComponentProvider };

const components = [ProForm, ProTable as any, ProComponentProvider];

export default {
  install(app: import('vue').App) {
    components.forEach(component => {
      app.component(component.name!, component);
    });
  },
};
