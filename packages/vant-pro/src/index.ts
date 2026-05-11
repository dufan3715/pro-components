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
  install(app: App) {
    components.forEach(component => {
      if (component.name) {
        app.component(component.name, component);
      }
    });
  },
};
