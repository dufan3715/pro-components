import { defineConfig } from 'vitepress';

const antdVueProSidebar = [
  {
    text: '指南',
    items: [
      { text: '介绍', link: '/antd-vue-pro/guide/introduction' },
      { text: '快速开始', link: '/antd-vue-pro/guide/getting-started' },
    ],
  },
  {
    text: '组件',
    items: [
      {
        text: 'ProForm',
        items: [
          { text: 'ProForm文档', link: '/antd-vue-pro/components/pro-form/' },
          {
            text: '使用示例',
            items: [
              {
                text: '基础表单',
                link: '/antd-vue-pro/components/pro-form/demos/basic/',
              },
              {
                text: '复杂表单',
                link: '/antd-vue-pro/components/pro-form/demos/complex/',
              },
              {
                text: '使用自定义组件',
                link: '/antd-vue-pro/components/pro-form/demos/custom-component/',
              },
              {
                text: '处理逻辑联动',
                link: '/antd-vue-pro/components/pro-form/demos/linkage/',
              },
              {
                text: '高级：拓展、覆盖组件',
                link: '/antd-vue-pro/components/pro-form/demos/advanced-component-typing/',
              },
            ],
          },
        ],
      },
      {
        text: 'ProTable',
        items: [
          { text: 'ProTable文档', link: '/antd-vue-pro/components/pro-table/' },
          {
            text: '使用示例',
            items: [
              {
                text: '基础表格',
                link: '/antd-vue-pro/components/pro-table/demos/basic/',
              },
              {
                text: '表格配置项',
                link: '/antd-vue-pro/components/pro-table/demos/configurable/',
              },
            ],
          },
        ],
      },
      {
        text: 'ProComponentProvider',
        items: [
          {
            text: 'ProComponentProvider文档',
            link: '/antd-vue-pro/components/pro-component-provider/',
          },
          {
            text: '使用示例',
            items: [
              {
                text: '基础使用',
                link: '/antd-vue-pro/components/pro-component-provider/demos/basic/',
              },
            ],
          },
        ],
      },
    ],
  },
];

const antdvNextProSidebar = [
  {
    text: '指南',
    items: [
      { text: '介绍', link: '/antdv-next-pro/guide/introduction' },
      { text: '快速开始', link: '/antdv-next-pro/guide/getting-started' },
    ],
  },
  {
    text: '组件',
    items: [
      {
        text: 'ProForm',
        items: [
          { text: 'ProForm文档', link: '/antdv-next-pro/components/pro-form/' },
          {
            text: '使用示例',
            items: [
              {
                text: '基础表单',
                link: '/antdv-next-pro/components/pro-form/demos/basic/',
              },
              {
                text: '复杂表单',
                link: '/antdv-next-pro/components/pro-form/demos/complex/',
              },
              {
                text: '使用自定义组件',
                link: '/antdv-next-pro/components/pro-form/demos/custom-component/',
              },
              {
                text: '处理逻辑联动',
                link: '/antdv-next-pro/components/pro-form/demos/linkage/',
              },
              {
                text: '高级：拓展、覆盖组件',
                link: '/antdv-next-pro/components/pro-form/demos/advanced-component-typing/',
              },
            ],
          },
        ],
      },
      {
        text: 'ProTable',
        items: [
          {
            text: 'ProTable文档',
            link: '/antdv-next-pro/components/pro-table/',
          },
          {
            text: '使用示例',
            items: [
              {
                text: '基础表格',
                link: '/antdv-next-pro/components/pro-table/demos/basic/',
              },
              {
                text: '表格配置项',
                link: '/antdv-next-pro/components/pro-table/demos/configurable/',
              },
            ],
          },
        ],
      },
      {
        text: 'ProComponentProvider',
        items: [
          {
            text: 'ProComponentProvider文档',
            link: '/antdv-next-pro/components/pro-component-provider/',
          },
        ],
      },
    ],
  },
];

const elementPlusProSidebar = [
  {
    text: '指南',
    items: [
      { text: '介绍', link: '/element-plus-pro/guide/introduction' },
      { text: '快速开始', link: '/element-plus-pro/guide/getting-started' },
    ],
  },
  {
    text: '组件',
    items: [
      {
        text: 'ProForm',
        items: [
          {
            text: 'ProForm文档',
            link: '/element-plus-pro/components/pro-form/',
          },
          {
            text: '使用示例',
            items: [
              {
                text: '基础表单',
                link: '/element-plus-pro/components/pro-form/demos/basic/',
              },
              {
                text: '复杂表单',
                link: '/element-plus-pro/components/pro-form/demos/complex/',
              },
              {
                text: '使用自定义组件',
                link: '/element-plus-pro/components/pro-form/demos/custom-component/',
              },
              {
                text: '处理逻辑联动',
                link: '/element-plus-pro/components/pro-form/demos/linkage/',
              },
              {
                text: '高级：拓展、覆盖组件',
                link: '/element-plus-pro/components/pro-form/demos/advanced-component-typing/',
              },
            ],
          },
        ],
      },
      {
        text: 'ProTable',
        items: [
          {
            text: 'ProTable文档',
            link: '/element-plus-pro/components/pro-table/',
          },
          {
            text: '使用示例',
            items: [
              {
                text: '基础表格',
                link: '/element-plus-pro/components/pro-table/demos/basic/',
              },
              {
                text: '表格配置项',
                link: '/element-plus-pro/components/pro-table/demos/configurable/',
              },
              {
                text: 'Columns 渲染',
                link: '/element-plus-pro/components/pro-table/demos/columns-render/',
              },
            ],
          },
        ],
      },
      {
        text: 'ProComponentProvider',
        items: [
          {
            text: 'ProComponentProvider文档',
            link: '/element-plus-pro/components/pro-component-provider/',
          },
          {
            text: '使用示例',
            items: [
              {
                text: '基础使用',
                link: '/element-plus-pro/components/pro-component-provider/demos/basic/',
              },
            ],
          },
        ],
      },
    ],
  },
];

// https://vitepress.dev/reference/site-config
export default defineConfig({
  base: process.env.GITHUB_REPOSITORY
    ? `/${process.env.GITHUB_REPOSITORY.split('/')[1]}/`
    : '/',
  title: 'Qin UI Pro',
  description: '基于 Vue3 UI 组件库二次封装的高级组件集合',
  themeConfig: {
    search: {
      provider: 'local',
    },
    nav: [
      { text: '首页', link: '/' },
      {
        text: 'antdv-next-pro',
        link: '/antdv-next-pro/guide/introduction',
        activeMatch: '^/antdv-next-pro/',
      },
      {
        text: 'antd-vue-pro',
        link: '/antd-vue-pro/guide/introduction',
        activeMatch: '^/antd-vue-pro/',
      },
      {
        text: 'element-plus-pro',
        link: '/element-plus-pro/guide/introduction',
        activeMatch: '^/element-plus-pro/',
      },
    ],
    sidebar: {
      '/antdv-next-pro/': antdvNextProSidebar,
      '/antd-vue-pro/': antdVueProSidebar,
      '/element-plus-pro/': elementPlusProSidebar,
    },
    socialLinks: [
      {
        icon: 'github',
        link: 'https://github.com/dufan3715/pro-components',
      },
    ],
  },
  vite: {
    optimizeDeps: {
      include: [
        'ant-design-vue',
        '@ant-design/icons-vue',
        '@qin-ui/antd-vue-pro',
        'antdv-next',
        '@qin-ui/antdv-next-pro',
        'element-plus',
        '@qin-ui/element-plus-pro',
      ],
    },
    ssr: {
      noExternal: [
        'ant-design-vue',
        '@ant-design/icons-vue',
        '@qin-ui/antd-vue-pro',
        'antdv-next',
        '@qin-ui/antdv-next-pro',
        'element-plus',
        '@qin-ui/element-plus-pro',
      ],
    },
  },
});
