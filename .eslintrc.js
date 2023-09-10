/**
 * eslint规则参考（https://eslint.org/docs/latest/rules/）
 * eslint配置使用vue团队维护的规则配置（https://eslint.vuejs.org/user-guide/）
 * 处理eslint规则和prettier的冲突（https://github.com/prettier/eslint-config-prettier）(https://github.com/prettier/eslint-plugin-prettier)
 */

module.exports = {
  root: true,
  env: {
    browser: true,
    es2021: true,
    node: true,
  },
  extends: [
    'eslint:recommended',
    'plugin:@typescript-eslint/recommended',
    'plugin:vue/vue3-recommended',
    'airbnb-base',
    'plugin:prettier/recommended',
  ],
  parser: 'vue-eslint-parser',
  parserOptions: {
    ecmaVersion: 'latest',
    parser: '@typescript-eslint/parser',
    sourceType: 'module',
  },
  plugins: ['vue', '@typescript-eslint', 'html'],
  rules: {
    'vue/multi-word-component-names': 'off',
    'import/no-extraneous-dependencies': ['error', { devDependencies: true }],
    'import/extensions': 'off',
    'import/no-unresolved': 'off',
    '@typescript-eslint/no-explicit-any': 'off',
    'no-undef': 'off',
  },
};
