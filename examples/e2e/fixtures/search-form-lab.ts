import {
  createApp,
  defineComponent,
  h,
  markRaw,
  nextTick,
  reactive,
} from 'vue';

type LabWindow = Window & {
  __LAB_READY__?: boolean;
  __LAB__?: {
    growField: (path: string, height: number) => void;
    resetFields: () => void;
  };
};

const params = new URLSearchParams(location.search);
const lib = params.get('lib') ?? 'antd';
const expandStatus = params.get('expandStatus') !== 'false';

const heights = reactive<Record<string, number>>({
  f1: 32,
  f2: 32,
  f3: 32,
  f4: 32,
  f5: 32,
});

const makeHeightBox = (path: string) =>
  markRaw(
    defineComponent({
      name: `HeightBox_${path}`,
      inheritAttrs: false,
      setup() {
        return () =>
          h('div', {
            'data-testid': `height-box-${path}`,
            style: {
              height: `${heights[path]}px`,
              background: '#f0f0f0',
              borderRadius: '4px',
            },
          });
      },
    })
  );

const fields = ['f1', 'f2', 'f3', 'f4', 'f5'].map(path => ({
  path,
  label: `字段${path.slice(1)}`,
  component: makeHeightBox(path),
  xs: 24,
  lg: 8,
}));

const mountLab = async () => {
  let ProTable: any;
  let useTable: any;
  let tableParams: Record<string, any>;

  if (lib === 'element') {
    await import('element-plus/dist/index.css');
    ({ ProTable, useTable } = await import(
      '../../../packages/element-plus-pro/src'
    ));
    tableParams = {
      columns: [{ prop: 'id', label: 'ID' }],
      data: [{ id: 1 }],
      searchFields: fields,
    };
  } else if (lib === 'antdv-next') {
    ({ ProTable, useTable } = await import(
      '../../../packages/antdv-next-pro/src'
    ));
    tableParams = {
      columns: [{ title: 'ID', dataIndex: 'id' }],
      dataSource: [{ id: 1 }],
      searchFields: fields,
    };
  } else {
    await import('ant-design-vue/dist/reset.css');
    ({ ProTable, useTable } = await import(
      '../../../packages/antd-vue-pro/src'
    ));
    tableParams = {
      columns: [{ title: 'ID', dataIndex: 'id' }],
      dataSource: [{ id: 1 }],
      searchFields: fields,
    };
  }

  const Root = defineComponent({
    setup() {
      const table = useTable(tableParams);
      return () =>
        h(ProTable, {
          table,
          search: () => Promise.resolve(),
          searchFormConfig: {
            expand: { minExpandRows: 2, expandStatus },
          },
        });
    },
  });

  createApp(Root).mount('#app');

  (window as LabWindow).__LAB__ = {
    growField(path, height) {
      heights[path] = height;
    },
    resetFields() {
      Object.keys(heights).forEach(path => {
        heights[path] = 32;
      });
    },
  };

  await nextTick();
  requestAnimationFrame(() => {
    requestAnimationFrame(() => {
      (window as LabWindow).__LAB_READY__ = true;
    });
  });
};

mountLab().catch(error => {
  document.body.setAttribute('data-lab-error', String(error));
  throw error;
});
