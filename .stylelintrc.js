module.exports = {
  extends: [
    'stylelint-config-standard',
    'stylelint-config-rational-order',
    'stylelint-config-recommended-less',
    'stylelint-config-recommended-vue',
    'stylelint-prettier/recommended',
  ],
  plugins: [
    'stylelint-order',
    'stylelint-declaration-block-no-ignored-properties',
  ],
  overrides: [
    {
      files: ['**/*.{less,css,vue,html}'],
      customSyntax: 'postcss-less',
    },
    {
      files: ['**/*.{html,vue}'],
      customSyntax: 'postcss-html',
    },
    {
      files: ['*.vue', '**/*.vue'],
      rules: {
        'no-empty-source': null,
      },
    },
  ],
  rules: {
    'plugin/declaration-block-no-ignored-properties': true,
    'function-name-case': 'lower',
    'no-descending-specificity': null,
    'no-invalid-double-slash-comments': null,
    'selector-class-pattern': null,
    'function-url-quotes': null,
    'font-family-name-quotes': null,
    'font-family-no-missing-generic-family-keyword': null,
  },
};
