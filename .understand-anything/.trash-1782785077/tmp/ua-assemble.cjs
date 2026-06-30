const fs = require('fs');

const PROJECT_ROOT = '/Users/dufan/Desktop/Code/My_project/pro-components';
const assembled = JSON.parse(fs.readFileSync(`${PROJECT_ROOT}/.understand-anything/intermediate/assembled-graph.json`, 'utf8'));
const layers = JSON.parse(fs.readFileSync(`${PROJECT_ROOT}/.understand-anything/intermediate/layers.json`, 'utf8'));
const tour = JSON.parse(fs.readFileSync(`${PROJECT_ROOT}/.understand-anything/intermediate/tour.json`, 'utf8'));

const graph = {
  version: "1.0.0",
  project: {
    name: "pro-components",
    languages: ["typescript", "vue", "javascript", "json", "markdown", "yaml"],
    frameworks: ["Vue 3", "Vite", "Vitepress", "Ant Design Vue", "Element Plus", "Vant", "GitHub Actions"],
    description: "基于主流 UI 框架二次封装的高级组件库（Pro Components）集合，提供高度可配置、Schema 驱动的 ProForm 和 ProTable，助力开发者极速构建企业级中后台系统与移动端应用。",
    analyzedAt: new Date().toISOString(),
    gitCommitHash: "60217979b460ab5e1eae701ad8ee85077fa24688"
  },
  nodes: assembled.nodes,
  edges: assembled.edges,
  layers: layers,
  tour: tour
};

fs.writeFileSync(
  `${PROJECT_ROOT}/.understand-anything/intermediate/assembled-graph.json`,
  JSON.stringify(graph, null, 2)
);
console.log(`Written: ${graph.nodes.length} nodes, ${graph.edges.length} edges, ${graph.layers.length} layers, ${graph.tour.length} tour steps`);
