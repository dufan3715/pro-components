/** @type {import('stylelint').Config} */
export default {
  extends: [
    'stylelint-config-recommended-less',
    'stylelint-config-rational-order',
    'stylelint-config-recommended-vue',
    'stylelint-prettier/recommended',
  ],
  plugins: ['stylelint-less'],
  rules: {
    'no-empty-source': null,
  },
};
