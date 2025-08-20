import { defineConfig } from 'vitepress';

// https://vitepress.dev/reference/site-config
export default defineConfig({
  base: process.env.GITHUB_REPOSITORY
    ? `/${process.env.GITHUB_REPOSITORY.split('/')[1]}/`
    : '/',
  title: 'antd-vue-pro',
  description: '二次封装ant-design-vue的高级组件',
  themeConfig: {
    search: {
      provider: 'local',
    },
    sidebar: [
      {
        text: '指南',
        items: [
          { text: '介绍', link: '/guide/introduction' },
          { text: '快速开始', link: '/guide/getting-started' },
        ],
      },
      {
        text: '组件',
        items: [
          {
            text: 'ProForm',
            items: [
              { text: '文档说明', link: '/components/pro-form/' },
              {
                text: '使用示例',
                items: [
                  {
                    text: '基础表单',
                    link: '/components/pro-form/demos/basic/',
                  },
                  {
                    text: '复杂表单',
                    link: '/components/pro-form/demos/complex/',
                  },
                  {
                    text: '使用自定义组件',
                    link: '/components/pro-form/demos/custom-component/',
                  },
                  {
                    text: '处理逻辑联动',
                    link: '/components/pro-form/demos/linkage/',
                  },
                ],
              },
            ],
          },
          {
            text: 'ProTable',
            items: [
              { text: '文档说明', link: '/components/pro-table/' },
              {
                text: '使用示例',
                items: [
                  {
                    text: '基础表格',
                    link: '/components/pro-table/demos/basic/',
                  },
                  {
                    text: '表格配置项',
                    link: '/components/pro-table/demos/configurable/',
                  },
                ],
              },
            ],
          },
          {
            text: 'ProComponentProvider',
            items: [
              { text: '文档说明', link: '/components/pro-component-provider/' },
              {
                text: '使用示例',
                items: [
                  {
                    text: '基础使用',
                    link: '/components/pro-component-provider/demos/basic/',
                  },
                ],
              },
            ],
          },
        ],
      },
    ],
    socialLinks: [
      {
        icon: 'github',
        link: 'https://github.com/dufan3715/pro-components/tree/main/packages/antd-vue-pro',
      },
    ],
  },
  vite: {
    optimizeDeps: {
      include: [
        'ant-design-vue',
        '@ant-design/icons-vue',
        '@qin-ui/antd-vue-pro',
      ],
    },
    ssr: {
      noExternal: [
        'ant-design-vue',
        '@ant-design/icons-vue',
        '@qin-ui/antd-vue-pro',
      ],
    },
  },
});
