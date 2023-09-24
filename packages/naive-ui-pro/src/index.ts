import { withInstall } from './install';
import BaseForm from './components/form';
import ComponentProvider from './components/component-provider';

export * from './components/form';
export * from './components/component-provider';

const ProForm = withInstall(BaseForm);
const ProComponentProvider = withInstall(ComponentProvider);

export { ProForm, ProComponentProvider };

const components = [ProForm, ProComponentProvider];

export default {
  install(app: import('vue').App) {
    components.forEach(component => {
      app.component(component.name, component);
    });
  },
};
