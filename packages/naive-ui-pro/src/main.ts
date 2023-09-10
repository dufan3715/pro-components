import ProForm from './components/pro-form';

export { ProForm };

const components = [ProForm];

export default {
  install(app: any) {
    components.forEach(component => {
      app.component(component.name, component);
    });
  },
};

export * from './components/pro-form';
