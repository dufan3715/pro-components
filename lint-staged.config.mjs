/**
 * @filename : lint-staged.config.js
 * @type { import('lint-staged').Configuration }
 */
export default {
  '*.vue': ['eslint --fix', 'prettier --write', 'stylelint --fix'],
  '*.{js,jsx,ts,tsx}': ['eslint --fix', 'prettier --write'],
  '*.{css,scss,less}': ['stylelint --fix', 'prettier --write'],
  '!(package)*.json': ['prettier --write--parser json'],
  'package.json': ['prettier --write'],
  '*.md': ['prettier --write'],
};
