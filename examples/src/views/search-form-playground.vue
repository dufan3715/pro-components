<script lang="ts" setup>
import {
  ref,
  reactive,
  computed,
  onMounted,
  onUnmounted,
  h,
  defineComponent,
} from 'vue';
import { ProTable, useTable } from '../../../packages/antd-vue-pro/src';
import SearchForm from '../../../packages/antd-vue-pro/src/components/table/components/SearchForm.vue';

// ----------------------------------------------------
// 1. 模拟表格数据与列配置
// ----------------------------------------------------
type UserRecord = {
  id: number;
  name: string;
  phone: string;
  dept: string;
  role: string;
  status: 'active' | 'inactive' | 'pending';
  email: string;
  createTime: string;
  remark: string;
};

const mockDatabase: UserRecord[] = Array.from({ length: 45 }).map((_, i) => ({
  id: i + 1,
  name: `用户_${i + 1}`,
  phone: `1380000${String(i + 1).padStart(4, '0')}`,
  dept: ['研发部', '产品部', '市场部', '运营部', '财务部'][i % 5],
  role: ['管理员', '开发工程师', '产品经理', '测试工程师', '运维专家'][i % 5],
  status: (['active', 'inactive', 'pending'] as const)[i % 3],
  email: `user${i + 1}@company.com`,
  createTime: `2026-08-${String((i % 28) + 1).padStart(2, '0')} 10:00:00`,
  remark: i % 2 === 0 ? '重点跟踪客户' : '常规用户档案',
}));

const tableColumns = [
  { title: 'ID', dataIndex: 'id' as const, width: 70 },
  { title: '姓名', dataIndex: 'name' as const, width: 100 },
  { title: '手机号', dataIndex: 'phone' as const, width: 130 },
  { title: '部门', dataIndex: 'dept' as const, width: 100 },
  { title: '角色', dataIndex: 'role' as const, width: 120 },
  { title: '状态', dataIndex: 'status' as const, width: 90 },
  { title: '邮箱', dataIndex: 'email' as const, width: 180 },
  { title: '创建时间', dataIndex: 'createTime' as const, width: 160 },
  { title: '备注', dataIndex: 'remark' as const, ellipsis: true },
];

// 全局事件日志
const eventLogs = ref<
  Array<{ id: number; time: string; type: string; details: any }>
>([]);
const addLog = (type: string, details: any) => {
  eventLogs.value.unshift({
    id: Date.now() + Math.random(),
    time: new Date().toLocaleTimeString(),
    type,
    details,
  });
  if (eventLogs.value.length > 30) {
    eventLogs.value.pop();
  }
};

// ----------------------------------------------------
// 2. 视口 / 容器尺寸调节状态 (Viewport Resizer)
// ----------------------------------------------------
const containerWidth = ref<string | number>('100%');
const measuredWidth = ref<number>(0);
const sandboxRef = ref<HTMLElement | null>(null);
let resizeObserver: ResizeObserver | null = null;

const presets = [
  { label: '100% 自适应', value: '100%' },
  { label: '超宽屏 (1600px)', value: 1600 },
  { label: '桌面端 (1200px / lg)', value: 1200 },
  { label: '平板横屏 (992px / md)', value: 992 },
  { label: '平板竖屏 (768px / sm)', value: 768 },
  { label: '移动端 (480px / xs)', value: 480 },
];

const setPreset = (val: string | number) => {
  containerWidth.value = val;
};

// 拖拽手柄拉伸
const isDragging = ref(false);
const startDrag = (e: MouseEvent) => {
  e.preventDefault();
  isDragging.value = true;
  const startX = e.clientX;
  const startW = sandboxRef.value ? sandboxRef.value.offsetWidth : 1200;

  const onMouseMove = (moveEvent: MouseEvent) => {
    if (!isDragging.value) return;
    const deltaX = moveEvent.clientX - startX;
    const nextW = Math.max(360, Math.min(1800, startW + deltaX * 2));
    containerWidth.value = nextW;
  };

  const onMouseUp = () => {
    isDragging.value = false;
    window.removeEventListener('mousemove', onMouseMove);
    window.removeEventListener('mouseup', onMouseUp);
  };

  window.addEventListener('mousemove', onMouseMove);
  window.addEventListener('mouseup', onMouseUp);
};

// ----------------------------------------------------
// 3. 场景定义与实例管理
// ----------------------------------------------------
const activeScenarioKey = ref<string>('all');

// 场景 1: 标准 Grid 网格布局 (8个字段，默认2行折叠)
const table1 = useTable({
  columns: tableColumns,
  dataSource: mockDatabase.slice(0, 5),
  searchFields: [
    {
      path: 'name',
      label: '用户姓名',
      component: 'input',
      placeholder: '请输入姓名',
    },
    {
      path: 'phone',
      label: '手机号码',
      component: 'input',
      placeholder: '请输入手机号',
    },
    {
      path: 'dept',
      label: '所属部门',
      component: 'select',
      options: [
        { label: '研发部', value: '研发部' },
        { label: '产品部', value: '产品部' },
        { label: '市场部', value: '市场部' },
        { label: '财务部', value: '财务部' },
      ],
      placeholder: '请选择部门',
    },
    {
      path: 'status',
      label: '用户状态',
      component: 'select',
      options: [
        { label: '正常', value: 'active' },
        { label: '停用', value: 'inactive' },
        { label: '待激活', value: 'pending' },
      ],
      placeholder: '请选择状态',
    },
    {
      path: 'role',
      label: '所属角色',
      component: 'select',
      options: [
        { label: '管理员', value: '管理员' },
        { label: '工程师', value: '开发工程师' },
        { label: '产品经理', value: '产品经理' },
      ],
      placeholder: '请选择角色',
    },
    {
      path: 'email',
      label: '电子邮箱',
      component: 'input',
      placeholder: '请输入邮箱',
    },
    {
      path: 'createDate',
      label: '创建日期',
      component: 'date-picker',
      placeholder: '选择日期',
    },
    {
      path: 'remark',
      label: '备注说明',
      component: 'input',
      placeholder: '请输入备注关键词',
    },
  ],
});
const onSearch1 = async () => {
  addLog('场景1 触发查询', table1.searchForm.formData);
};

// 场景 2: 响应式断点栅格 (Responsive Span)
const table2 = useTable({
  columns: tableColumns,
  dataSource: mockDatabase.slice(0, 5),
  searchFields: [
    {
      path: 'name',
      label: '响应式姓名',
      component: 'input',
      span: 24,
      sm: 12,
      md: 8,
      lg: 6,
      xl: 6,
    },
    {
      path: 'dept',
      label: '响应式部门',
      component: 'select',
      span: 24,
      sm: 12,
      md: 8,
      lg: 6,
      xl: 6,
      options: [
        { label: '研发部', value: '研发部' },
        { label: '产品部', value: '产品部' },
      ],
    },
    {
      path: 'status',
      label: '响应式状态',
      component: 'select',
      span: 24,
      sm: 12,
      md: 8,
      lg: 6,
      xl: 6,
      options: [
        { label: '正常', value: 'active' },
        { label: '停用', value: 'inactive' },
      ],
    },
    {
      path: 'email',
      label: '响应式邮箱',
      component: 'input',
      span: 24,
      sm: 12,
      md: 8,
      lg: 6,
      xl: 6,
    },
    {
      path: 'role',
      label: '宽栏角色(跨2列)',
      component: 'select',
      span: 24,
      sm: 24,
      md: 16,
      lg: 12,
      xl: 12,
      options: [
        { label: '管理员', value: '管理员' },
        { label: '开发者', value: '开发者' },
      ],
    },
    {
      path: 'remark',
      label: '备注说明',
      component: 'input',
      span: 24,
      sm: 12,
      md: 8,
      lg: 6,
      xl: 6,
    },
  ],
});
const onSearch2 = async () => {
  addLog('场景2 响应式查询', table2.searchForm.formData);
};

// 场景 3: Inline 行内紧凑布局 (layout: 'inline')
const table3 = useTable({
  columns: tableColumns,
  dataSource: mockDatabase.slice(0, 5),
  searchFields: [
    {
      path: 'keyword',
      label: '关键字',
      component: 'input',
      placeholder: '搜索姓名/手机',
    },
    {
      path: 'status',
      label: '状态',
      component: 'select',
      options: [
        { label: '全部', value: '' },
        { label: '启用', value: 'active' },
        { label: '禁用', value: 'inactive' },
      ],
      style: { width: '110px' },
    },
    {
      path: 'dept',
      label: '部门',
      component: 'select',
      options: [
        { label: '全部', value: '' },
        { label: '研发', value: '研发部' },
        { label: '产品', value: '产品部' },
      ],
      style: { width: '110px' },
    },
  ],
});
const onSearch3 = async () => {
  addLog('场景3 Inline 查询', table3.searchForm.formData);
};

// 场景 4: 单行折叠极简模式 (minExpandRows: 1)
const table4 = useTable({
  columns: tableColumns,
  dataSource: mockDatabase.slice(0, 5),
  searchFields: [
    { path: 'name', label: '核心检索1', component: 'input' },
    { path: 'phone', label: '核心检索2', component: 'input' },
    { path: 'dept', label: '核心检索3', component: 'input' },
    { path: 'extra1', label: '高级条件1', component: 'input' },
    { path: 'extra2', label: '高级条件2', component: 'input' },
    { path: 'extra3', label: '高级条件3', component: 'input' },
  ],
});
const onSearch4 = async () => {
  addLog('场景4 单行折叠查询', table4.searchForm.formData);
};

// 场景 5: 隐藏字段初值自动展开
const table5 = useTable({
  columns: tableColumns,
  dataSource: mockDatabase.slice(0, 5),
  searchParam: {
    hiddenRemark: 'VIP客户',
    hiddenEmail: 'vip@domain.com',
  },
  searchFields: [
    { path: 'name', label: '前置字段1', component: 'input' },
    { path: 'phone', label: '前置字段2', component: 'input' },
    { path: 'dept', label: '前置字段3', component: 'input' },
    { path: 'role', label: '前置字段4', component: 'input' },
    { path: 'status', label: '前置字段5', component: 'input' },
    { path: 'hiddenEmail', label: '初值邮箱(深层)', component: 'input' },
    { path: 'hiddenRemark', label: '初值备注(深层)', component: 'input' },
  ],
});
const onSearch5 = async () => {
  addLog('场景5 初值自动展开查询', table5.searchForm.formData);
};

// 场景 6: 禁用折叠 / 始终平铺 (expand: false)
const table6 = useTable({
  columns: tableColumns,
  dataSource: mockDatabase.slice(0, 5),
  searchFields: [
    { path: 'f1', label: '平铺字段 A', component: 'input' },
    { path: 'f2', label: '平铺字段 B', component: 'input' },
    { path: 'f3', label: '平铺字段 C', component: 'input' },
    { path: 'f4', label: '平铺字段 D', component: 'input' },
    { path: 'f5', label: '平铺字段 E', component: 'input' },
    { path: 'f6', label: '平铺字段 F', component: 'input' },
    { path: 'f7', label: '平铺字段 G', component: 'input' },
  ],
});
const onSearch6 = async () => {
  addLog('场景6 完全平铺查询', table6.searchForm.formData);
};

// 场景 7: 自定义按钮组件与插槽
const table7 = useTable({
  columns: tableColumns,
  dataSource: mockDatabase.slice(0, 5),
  searchFields: [
    { path: 'title', label: '项目名称', component: 'input' },
    { path: 'code', label: '项目编码', component: 'input' },
    { path: 'manager', label: '负责人', component: 'input' },
    { path: 'stage', label: '项目阶段', component: 'input' },
  ],
});
const onSearch7 = () => {
  table7.setPageParam({ current: 1 });
  addLog('场景7 插槽定制查询', table7.searchForm.formData);
};
const onReset7 = () => {
  table7.resetQueryParams();
  addLog('场景7 重置操作', table7.searchForm.formData);
};

// 场景 8: 自定义间距与 Form Props (Dense 紧凑型)
const table8 = useTable({
  columns: tableColumns,
  dataSource: mockDatabase.slice(0, 5),
  searchFields: [
    { path: 'a', label: '紧凑字段1', component: 'input' },
    { path: 'b', label: '紧凑字段2', component: 'input' },
    { path: 'c', label: '紧凑字段3', component: 'input' },
    { path: 'd', label: '紧凑字段4', component: 'input' },
  ],
});
const onSearch8 = async () => {
  addLog('场景8 紧凑间距查询', table8.searchForm.formData);
};

// 场景 9: 自定义容器包裹与动态显隐 (hidden: boolean)
const table9 = useTable({
  columns: tableColumns,
  dataSource: mockDatabase.slice(0, 5),
  searchFields: [
    { path: 'keyword', label: '检索词', component: 'input' },
    { path: 'category', label: '类别', component: 'input' },
    { path: 'tag', label: '标签', component: 'input' },
  ],
});
const isFormHidden = ref(false);
const CustomCardContainer = defineComponent({
  name: 'CustomCardContainer',
  setup(_, { slots }) {
    return () =>
      h(
        'div',
        {
          style: {
            background: 'linear-gradient(135deg, #f0f7ff 0%, #e6f4ff 100%)',
            border: '1px solid #91caff',
            borderRadius: '8px',
            padding: '16px',
            marginBottom: '16px',
            boxShadow: '0 2px 8px rgba(22, 119, 255, 0.08)',
          },
        },
        [
          h(
            'div',
            {
              style: {
                fontWeight: 'bold',
                color: '#0958d9',
                marginBottom: '12px',
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
              },
            },
            ['🛡️ 自定义渐变高亮包裹容器 (Container Component)']
          ),
          slots.default ? slots.default() : null,
        ]
      );
  },
});
const onSearch9 = async () => {
  addLog('场景9 容器与显隐查询', table9.searchForm.formData);
};

// ----------------------------------------------------
// 场景 10: Modal 缩放动画与单字段防误判 (Modal Zoom & Single-field Defense)
// ----------------------------------------------------
const isSingleModalVisible = ref(false);
const isMultiModalVisible = ref(false);

// 场景 10-1: 单字段 AddModal 场景 (1个字段，1行)
const table10Single = useTable({
  columns: tableColumns,
  dataSource: mockDatabase.slice(0, 3),
  searchFields: [
    {
      path: 'keyword',
      label: '检索关键字',
      component: 'input',
      placeholder: '请输入关键字检索...',
    },
  ],
});
const onSearch10Single = async () => {
  addLog('场景10 单字段Modal查询', table10Single.searchForm.formData);
};

// 场景 10-2: 多字段 Modal 场景 (6个字段)
const table10Multi = useTable({
  columns: tableColumns,
  dataSource: mockDatabase.slice(0, 3),
  searchFields: [
    { path: 'name', label: '用户姓名', component: 'input' },
    { path: 'phone', label: '联系电话', component: 'input' },
    {
      path: 'dept',
      label: '部门',
      component: 'select',
      options: [
        { label: '研发部', value: '研发部' },
        { label: '市场部', value: '市场部' },
      ],
    },
    {
      path: 'role',
      label: '角色',
      component: 'select',
      options: [
        { label: '管理员', value: '管理员' },
        { label: '普通用户', value: '普通用户' },
      ],
    },
    { path: 'email', label: '邮箱', component: 'input' },
    { path: 'remark', label: '备注', component: 'input' },
  ],
});
const onSearch10Multi = async () => {
  addLog('场景10 多字段Modal查询', table10Multi.searchForm.formData);
};

// ----------------------------------------------------
// 场景 11: Textarea 不均匀行高与真实行边界截断 (Non-uniform Row Heights)
// ----------------------------------------------------
const s11MinRows = ref(2);
const table11 = useTable({
  columns: tableColumns,
  dataSource: mockDatabase.slice(0, 5),
  searchFields: [
    {
      path: 'desc',
      label: '多行备注(76px)',
      component: 'textarea',
      rows: 3,
      span: 16,
      placeholder: '第1行Textarea高度约76px，按真实行底折叠',
    },
    {
      path: 'dept',
      label: '所属部门',
      component: 'select',
      span: 8,
      options: [
        { label: '研发部', value: '研发部' },
        { label: '产品部', value: '产品部' },
        { label: '财务部', value: '财务部' },
      ],
      placeholder: '请选择部门',
    },
    {
      path: 'name',
      label: '用户姓名',
      component: 'input',
      span: 8,
      placeholder: '第2行字段 (32px)',
    },
    {
      path: 'phone',
      label: '手机号码',
      component: 'input',
      span: 8,
      placeholder: '第2行字段 (32px)',
    },
    {
      path: 'status',
      label: '状态',
      component: 'select',
      span: 8,
      options: [
        { label: '正常', value: 'active' },
        { label: '停用', value: 'inactive' },
      ],
    },
    {
      path: 'date',
      label: '登记日期',
      component: 'date-picker',
      span: 8,
    },
    {
      path: 'email',
      label: '电子邮箱',
      component: 'input',
      span: 8,
    },
    {
      path: 'extraInfo',
      label: '详细补充',
      component: 'input',
      span: 8,
    },
  ],
});
const onSearch11 = async () => {
  addLog('场景11 Textarea不均匀行高查询', table11.searchForm.formData);
};

// ----------------------------------------------------
// 场景 12: ResizeObserver 行元素动态尺寸自愈 (Textarea AutoSize & Dynamic Resize Auto-heal)
// ----------------------------------------------------
const table12 = useTable({
  columns: tableColumns,
  dataSource: mockDatabase.slice(0, 5),
  searchFields: [
    {
      path: 'dynamicDesc',
      label: '自适应描述(autoSize)',
      component: 'textarea',
      autoSize: { minRows: 2, maxRows: 8 },
      span: 16,
      placeholder:
        '在此输入多行文字打字换行，或点击下方预设按钮，观察表单折叠高度实时自愈...',
    },
    {
      path: 'title',
      label: '任务标题',
      component: 'input',
      span: 8,
      placeholder: '请输入任务名称',
    },
    {
      path: 'priority',
      label: '任务优先级',
      component: 'select',
      span: 8,
      options: [
        { label: '高 (P0)', value: 'high' },
        { label: '中 (P1)', value: 'medium' },
        { label: '低 (P2)', value: 'low' },
      ],
    },
    {
      path: 'owner',
      label: '负责人',
      component: 'input',
      span: 8,
    },
    {
      path: 'deadline',
      label: '截止时间',
      component: 'date-picker',
      span: 8,
    },
    {
      path: 'category',
      label: '所属分类',
      component: 'input',
      span: 8,
    },
  ],
});

const setShortText = () => {
  table12.searchForm.setFormData('dynamicDesc', '这是单行短文本内容。');
  addLog('场景12 注入短文本 (32px)', table12.searchForm.formData);
};

const setMediumText = () => {
  table12.searchForm.setFormData(
    'dynamicDesc',
    '第1行：需求分析与架构设计\n第2行：Core层真实行边界算法改造\n第3行：ResizeObserver观察行元素\n第4行：表单高度平滑自愈刷新'
  );
  addLog('场景12 注入4行文本 (88px)', table12.searchForm.formData);
};

const setLongText = () => {
  table12.searchForm.setFormData(
    'dynamicDesc',
    '第1行：需求调研与缺陷分析 (Modal 28.8px 缩放污染)\n第2行：分析 offsetTop 与 getBoundingClientRect 差异\n第3行：构建行区间垂直重叠聚类算法\n第4行：ResizeObserver 扩展至全部行元素并同步 diff\n第5行：解决 textarea autoSize 增长后表单高度钉死问题\n第6行：提供行边界不可测时的安全行高算术降级\n第7行：补充全量同构单元测试与用例编号\n第8行：验证收起态与展开态自愈刷新成功'
  );
  addLog('场景12 注入8行长文本 (176px)', table12.searchForm.formData);
};

const clearText = () => {
  table12.searchForm.setFormData('dynamicDesc', '');
  addLog('场景12 清空描述文本', table12.searchForm.formData);
};

const onSearch12 = async () => {
  addLog('场景12 自愈调试台查询', table12.searchForm.formData);
};

// ----------------------------------------------------
// 场景 13: 复杂混合跨列与行边界可视化标尺 (Mixed Spans & Boundary Visualizer)
// ----------------------------------------------------
const showBoundaryRuler = ref(true);
const table13 = useTable({
  columns: tableColumns,
  dataSource: mockDatabase.slice(0, 5),
  searchFields: [
    {
      path: 'projectIntro',
      label: '项目简介(跨16列/90px)',
      component: 'textarea',
      rows: 3,
      span: 16,
      placeholder: '行1字段：跨16列多行输入框',
    },
    {
      path: 'projectType',
      label: '项目类型(跨8列)',
      component: 'select',
      span: 8,
      options: [
        { label: '重点攻坚', value: 'key' },
        { label: '常规迭代', value: 'normal' },
      ],
    },
    {
      path: 'projectName',
      label: '项目名称',
      component: 'input',
      span: 8,
      placeholder: '行2字段 (32px)',
    },
    {
      path: 'projectLeader',
      label: '负责人',
      component: 'input',
      span: 8,
      placeholder: '行2字段 (32px)',
    },
    {
      path: 'projectCycle',
      label: '项目周期',
      component: 'range-picker',
      span: 8,
    },
    {
      path: 'techStack',
      label: '技术选型(跨16列)',
      component: 'input',
      span: 16,
    },
    {
      path: 'projectLevel',
      label: '重要级别(跨8列)',
      component: 'select',
      span: 8,
      options: [
        { label: 'S级', value: 'S' },
        { label: 'A级', value: 'A' },
        { label: 'B级', value: 'B' },
      ],
    },
  ],
});
const onSearch13 = async () => {
  addLog('场景13 复杂混合跨列查询', table13.searchForm.formData);
};

// ----------------------------------------------------
// 4. 场景 10: 交互式实时调试台 (Live Playground)
// ----------------------------------------------------
const liveConfig = reactive({
  layout: 'grid' as 'grid' | 'inline',
  expand: true,
  minExpandRows: 2,
  defaultExpandStatus: false,
  rowGap: 16,
  columnGap: 24,
  hidden: false,
  fieldCount: 8,
  labelAlign: 'right' as 'right' | 'left',
  showSearchButton: true,
  showResetButton: true,
  showExpandButton: true,
});

const generateLiveFields = (count: number): any[] => {
  const allFieldList: any[] = [
    { path: 'f_name', label: '用户姓名', component: 'input' },
    { path: 'f_phone', label: '联系电话', component: 'input' },
    {
      path: 'f_dept',
      label: '所属组织',
      component: 'select',
      options: [
        { label: '总部', value: 'hq' },
        { label: '分部', value: 'branch' },
      ],
    },
    {
      path: 'f_role',
      label: '分配角色',
      component: 'select',
      options: [
        { label: '管理员', value: 'admin' },
        { label: '成员', value: 'member' },
      ],
    },
    { path: 'f_email', label: '邮箱地址', component: 'input' },
    { path: 'f_city', label: '常驻城市', component: 'input' },
    { path: 'f_tag', label: '用户标签', component: 'input' },
    { path: 'f_date', label: '入职日期', component: 'date-picker' },
    { path: 'f_score', label: '综合评分', component: 'input-number' },
    { path: 'f_remark', label: '详细备注', component: 'input' },
    { path: 'f_extra1', label: '拓展字段1', component: 'input' },
    { path: 'f_extra2', label: '拓展字段2', component: 'input' },
  ];
  return allFieldList.slice(0, count);
};

const liveTable = useTable({
  columns: tableColumns,
  dataSource: mockDatabase.slice(0, 5),
  searchFields: generateLiveFields(8),
});

const updateLiveFields = () => {
  liveTable.searchForm.fields.value = generateLiveFields(liveConfig.fieldCount);
};

const computedLiveExpand = computed(() => {
  if (!liveConfig.expand) return false;
  return {
    minExpandRows: liveConfig.minExpandRows,
    expandStatus: liveConfig.defaultExpandStatus,
  };
});

const onLiveSearch = async () => {
  addLog('Live 调试台查询', liveTable.searchForm.formData);
};

// ----------------------------------------------------
// 生命周期与 Observer 监听
// ----------------------------------------------------
onMounted(() => {
  if (sandboxRef.value) {
    resizeObserver = new ResizeObserver(entries => {
      for (const entry of entries) {
        measuredWidth.value = Math.round(entry.contentRect.width);
      }
    });
    resizeObserver.observe(sandboxRef.value);
  }
});

onUnmounted(() => {
  resizeObserver?.disconnect();
});
</script>

<template>
  <div class="playground-root">
    <!-- 顶部控制台 -->
    <header class="playground-header">
      <div class="header-main">
        <div class="header-title">
          <span class="logo-badge">PRO</span>
          <h1>SearchForm 布局多场景测试工作台</h1>
          <a-tag color="blue">@qin-ui/antd-vue-pro</a-tag>
          <a-tag color="cyan">Ant Design Vue 4.x</a-tag>
        </div>

        <!-- 场景切换 -->
        <div class="scenario-selector">
          <span class="label">测试视图：</span>
          <a-segmented
            v-model:value="activeScenarioKey"
            :options="[
              { label: '平铺全景 (All)', value: 'all' },
              { label: 'Live 交互调试台', value: 'live' },
              { label: '01 标准网格', value: 's1' },
              { label: '02 响应式断点', value: 's2' },
              { label: '03 Inline 流式', value: 's3' },
              { label: '04 单行折叠', value: 's4' },
              { label: '05 初值自展开', value: 's5' },
              { label: '06 禁用折叠', value: 's6' },
              { label: '07 按钮插槽', value: 's7' },
              { label: '08 间距定制', value: 's8' },
              { label: '09 容器与显隐', value: 's9' },
              { label: '10 Modal Zoom', value: 's10' },
              { label: '11 Textarea 行高', value: 's11' },
              { label: '12 动态行高自愈', value: 's12' },
              { label: '13 混合高度标尺', value: 's13' },
            ]"
          />
        </div>
      </div>

      <!-- 屏幕 / 容器尺寸调节栏 (Viewport Resizer Bar) -->
      <div class="viewport-bar">
        <div class="viewport-left">
          <span class="bar-title">🖥️ 屏幕 / 容器尺寸模拟：</span>
          <a-space wrap>
            <a-button
              v-for="p in presets"
              :key="p.label"
              size="small"
              :type="containerWidth === p.value ? 'primary' : 'default'"
              @click="setPreset(p.value)"
            >
              {{ p.label }}
            </a-button>
          </a-space>
        </div>

        <div class="viewport-right">
          <span class="slider-label">滑块微调：</span>
          <a-slider
            :value="typeof containerWidth === 'number' ? containerWidth : 1400"
            :min="360"
            :max="1600"
            :step="20"
            style="width: 180px; margin: 0 12px"
            @change="(v: any) => (containerWidth = v)"
          />
          <span class="pixel-badge"
            >当前容器实际宽度：<b>{{ measuredWidth }}px</b></span
          >
        </div>
      </div>
    </header>

    <!-- 主展示区 (可调宽度沙箱) -->
    <main class="playground-body">
      <div
        ref="sandboxRef"
        class="sandbox-container"
        :style="{
          width:
            typeof containerWidth === 'number'
              ? `${containerWidth}px`
              : containerWidth,
        }"
      >
        <!-- 右侧拖拽拉伸条 -->
        <div
          class="resizer-handle"
          :class="{ dragging: isDragging }"
          title="按住鼠标拖拽拉伸容器宽度"
          @mousedown="startDrag"
        >
          <div class="handle-line"></div>
        </div>

        <!-- ==================================================== -->
        <!-- LIVE 调试台 -->
        <!-- ==================================================== -->
        <div
          v-if="activeScenarioKey === 'live' || activeScenarioKey === 'all'"
          class="scenario-card live-card"
        >
          <div class="card-header">
            <div class="header-left">
              <span class="scenario-tag live-tag">Live Playground</span>
              <h3>🎯 交互式参数实时调试台</h3>
            </div>
            <span class="header-desc"
              >可动态调节各项配置，实时观测 ProTable 的 SearchForm
              渲染与折叠表现</span
            >
          </div>

          <!-- 控制面板 -->
          <div class="live-controls-panel">
            <a-row :gutter="[16, 12]">
              <a-col :xs="24" :sm="12" :md="6">
                <div class="control-item">
                  <span class="ctl-label">布局模式 (layout)：</span>
                  <a-radio-group v-model:value="liveConfig.layout" size="small">
                    <a-radio-button value="grid">Grid 网格</a-radio-button>
                    <a-radio-button value="inline">Inline 行内</a-radio-button>
                  </a-radio-group>
                </div>
              </a-col>

              <a-col :xs="24" :sm="12" :md="6">
                <div class="control-item">
                  <span class="ctl-label">启用展开/折叠 (expand)：</span>
                  <a-switch
                    v-model:checked="liveConfig.expand"
                    checked-children="开启"
                    un-checked-children="关闭"
                  />
                </div>
              </a-col>

              <a-col :xs="24" :sm="12" :md="6">
                <div class="control-item">
                  <span class="ctl-label">折叠默认行数 (minExpandRows)：</span>
                  <a-input-number
                    v-model:value="liveConfig.minExpandRows"
                    :min="1"
                    :max="5"
                    size="small"
                    :disabled="!liveConfig.expand"
                  />
                </div>
              </a-col>

              <a-col :xs="24" :sm="12" :md="6">
                <div class="control-item">
                  <span class="ctl-label">字段数量 (fields)：</span>
                  <a-slider
                    v-model:value="liveConfig.fieldCount"
                    :min="1"
                    :max="12"
                    style="flex: 1; margin: 0 8px"
                    @change="updateLiveFields"
                  />
                  <span>{{ liveConfig.fieldCount }}个</span>
                </div>
              </a-col>

              <a-col :xs="24" :sm="12" :md="6">
                <div class="control-item">
                  <span class="ctl-label">列间距 (columnGap)：</span>
                  <a-slider
                    v-model:value="liveConfig.columnGap"
                    :min="0"
                    :max="48"
                    style="flex: 1; margin: 0 8px"
                  />
                  <span>{{ liveConfig.columnGap }}px</span>
                </div>
              </a-col>

              <a-col :xs="24" :sm="12" :md="6">
                <div class="control-item">
                  <span class="ctl-label">行间距 (rowGap)：</span>
                  <a-slider
                    v-model:value="liveConfig.rowGap"
                    :min="0"
                    :max="36"
                    style="flex: 1; margin: 0 8px"
                  />
                  <span>{{ liveConfig.rowGap }}px</span>
                </div>
              </a-col>

              <a-col :xs="24" :sm="12" :md="6">
                <div class="control-item">
                  <span class="ctl-label">标签对齐 (labelAlign)：</span>
                  <a-radio-group
                    v-model:value="liveConfig.labelAlign"
                    size="small"
                  >
                    <a-radio-button value="right">右对齐</a-radio-button>
                    <a-radio-button value="left">左对齐</a-radio-button>
                  </a-radio-group>
                </div>
              </a-col>

              <a-col :xs="24" :sm="12" :md="6">
                <div class="control-item">
                  <span class="ctl-label">隐藏搜索栏 (hidden)：</span>
                  <a-switch
                    v-model:checked="liveConfig.hidden"
                    checked-children="隐藏"
                    un-checked-children="显示"
                  />
                </div>
              </a-col>
            </a-row>
          </div>

          <!-- 调试台 ProTable 渲染 -->
          <div class="table-wrapper">
            <ProTable
              :table="liveTable"
              :search="onLiveSearch"
              :search-form-config="{
                layout: liveConfig.layout,
                expand: computedLiveExpand,
                columnGap: liveConfig.columnGap,
                rowGap: liveConfig.rowGap,
                labelAlign: liveConfig.labelAlign,
                hidden: liveConfig.hidden,
                searchButton: liveConfig.showSearchButton ? undefined : false,
                resetButton: liveConfig.showResetButton ? undefined : false,
                expandButton: liveConfig.showExpandButton ? undefined : false,
              }"
            />
          </div>

          <!-- 实时表单数据展示 -->
          <div class="live-data-preview">
            <span class="preview-title"
              >📊 Live Table SearchForm 实时响应式数据：</span
            >
            <pre class="json-box">{{
              JSON.stringify(liveTable.searchForm.formData, null, 2)
            }}</pre>
          </div>
        </div>

        <!-- ==================================================== -->
        <!-- 场景 1: 标准 Grid 网格布局 -->
        <!-- ==================================================== -->
        <div
          v-if="activeScenarioKey === 's1' || activeScenarioKey === 'all'"
          class="scenario-card"
        >
          <div class="card-header">
            <div class="header-left">
              <span class="scenario-tag">场景 01</span>
              <h3>标准 Grid 网格布局（默认自适应折叠，8个字段，2行折叠）</h3>
            </div>
            <span class="header-desc"
              >验证：多字段网格排布、超行自动出现展开/收起、点击流畅高度过渡</span
            >
          </div>
          <div class="table-wrapper">
            <ProTable :table="table1" :search="onSearch1" />
          </div>
        </div>

        <!-- ==================================================== -->
        <!-- 场景 2: 响应式断点栅格 -->
        <!-- ==================================================== -->
        <div
          v-if="activeScenarioKey === 's2' || activeScenarioKey === 'all'"
          class="scenario-card"
        >
          <div class="card-header">
            <div class="header-left">
              <span class="scenario-tag">场景 02</span>
              <h3>屏幕尺寸响应式断点栅格 (Responsive Span: xs/sm/md/lg/xl)</h3>
            </div>
            <span class="header-desc"
              >验证：拖拽上方尺寸滑块改变宽度，观察各字段列宽自适应重排与
              ResizeObserver 重算折叠行</span
            >
          </div>
          <div class="table-wrapper">
            <ProTable :table="table2" :search="onSearch2" />
          </div>
        </div>

        <!-- ==================================================== -->
        <!-- 场景 3: Inline 行内流式紧凑布局 -->
        <!-- ==================================================== -->
        <div
          v-if="activeScenarioKey === 's3' || activeScenarioKey === 'all'"
          class="scenario-card"
        >
          <div class="card-header">
            <div class="header-left">
              <span class="scenario-tag">场景 03</span>
              <h3>Inline 行内流式紧凑布局 (layout: 'inline')</h3>
            </div>
            <span class="header-desc"
              >验证：字段水平紧凑流式排列，操作按钮跟在表单末尾，适合快速轻量检索</span
            >
          </div>
          <div class="table-wrapper">
            <ProTable
              :table="table3"
              :search="onSearch3"
              :search-form-config="{
                layout: 'inline',
                columnGap: 16,
                rowGap: 12,
              }"
            />
          </div>
        </div>

        <!-- ==================================================== -->
        <!-- 场景 4: 单行折叠极简模式 -->
        <!-- ==================================================== -->
        <div
          v-if="activeScenarioKey === 's4' || activeScenarioKey === 'all'"
          class="scenario-card"
        >
          <div class="card-header">
            <div class="header-left">
              <span class="scenario-tag">场景 04</span>
              <h3>单行折叠极简模式 (minExpandRows: 1)</h3>
            </div>
            <span class="header-desc"
              >验证：默认只展示第一行核心检索条件，次要条件全收拢在展开按钮内</span
            >
          </div>
          <div class="table-wrapper">
            <ProTable
              :table="table4"
              :search="onSearch4"
              :search-form-config="{
                expand: { minExpandRows: 1, expandStatus: false },
              }"
            />
          </div>
        </div>

        <!-- ==================================================== -->
        <!-- 场景 5: 隐藏字段初值自动展开 -->
        <!-- ==================================================== -->
        <div
          v-if="activeScenarioKey === 's5' || activeScenarioKey === 'all'"
          class="scenario-card"
        >
          <div class="card-header">
            <div class="header-left">
              <span class="scenario-tag">场景 05</span>
              <h3>隐藏字段初值自动展开 (IntersectionObserver)</h3>
            </div>
            <span class="header-desc"
              >验证：初始深层折叠字段包含搜索值时，表单自动触发展开以暴露当前生效的筛选条件</span
            >
          </div>
          <div class="table-wrapper">
            <ProTable
              :table="table5"
              :search="onSearch5"
              :search-form-config="{
                expand: { minExpandRows: 1, expandStatus: false },
              }"
            />
          </div>
        </div>

        <!-- ==================================================== -->
        <!-- 场景 6: 禁用折叠 / 始终平铺 -->
        <!-- ==================================================== -->
        <div
          v-if="activeScenarioKey === 's6' || activeScenarioKey === 'all'"
          class="scenario-card"
        >
          <div class="card-header">
            <div class="header-left">
              <span class="scenario-tag">场景 06</span>
              <h3>禁用折叠 / 始终完全平铺 (expand: false)</h3>
            </div>
            <span class="header-desc"
              >验证：多行字段直接完整展示，不出现任何展开折叠切换按钮</span
            >
          </div>
          <div class="table-wrapper">
            <ProTable
              :table="table6"
              :search="onSearch6"
              :search-form-config="{
                expand: false,
              }"
            />
          </div>
        </div>

        <!-- ==================================================== -->
        <!-- 场景 7: 自定义按钮组件与插槽定制 -->
        <!-- ==================================================== -->
        <div
          v-if="activeScenarioKey === 's7' || activeScenarioKey === 'all'"
          class="scenario-card"
        >
          <div class="card-header">
            <div class="header-left">
              <span class="scenario-tag">场景 07</span>
              <h3>
                自定义按钮插槽定制 (#search-form 插槽定制子组件 SearchForm)
              </h3>
            </div>
            <span class="header-desc"
              >验证：在 search-form
              插槽中使用定制的按钮扩展与展开折叠自定义控制</span
            >
          </div>
          <div class="table-wrapper">
            <ProTable :table="table7">
              <template #search-form>
                <SearchForm
                  :form="table7.searchForm"
                  @search="onSearch7"
                  @reset="onReset7"
                >
                  <!-- 自定义重置插槽 -->
                  <template #reset-button="{ onReset }">
                    <a-button danger ghost @click="onReset">
                      🧹 一键清空条件
                    </a-button>
                  </template>

                  <!-- 自定义查询插槽 -->
                  <template #search-button="{ onSearch }">
                    <a-button
                      type="primary"
                      style="background: #52c41a; border-color: #52c41a"
                      @click="onSearch"
                    >
                      🔍 精准检索
                    </a-button>
                  </template>

                  <!-- 自定义展开插槽 -->
                  <template
                    #expand-button="{ expandStatus, changeExpandStatus }"
                  >
                    <a-button type="dashed" @click="changeExpandStatus">
                      {{ expandStatus ? '收缩高级面板 ▲' : '展开更多维度 ▼' }}
                    </a-button>
                  </template>
                </SearchForm>
              </template>
            </ProTable>
          </div>
        </div>

        <!-- ==================================================== -->
        <!-- 场景 8: 间距与对齐定制 -->
        <!-- ==================================================== -->
        <div
          v-if="activeScenarioKey === 's8' || activeScenarioKey === 'all'"
          class="scenario-card"
        >
          <div class="card-header">
            <div class="header-left">
              <span class="scenario-tag">场景 08</span>
              <h3>
                自定义间距与 Form Props (Dense 紧凑型: rowGap=6, colGap=12,
                labelAlign='left')
              </h3>
            </div>
            <span class="header-desc"
              >验证：高密度数据管理场景下紧凑型间距与标签左对齐</span
            >
          </div>
          <div class="table-wrapper">
            <ProTable
              :table="table8"
              :search="onSearch8"
              :search-form-config="{
                rowGap: 6,
                columnGap: 12,
                labelAlign: 'left',
              }"
            />
          </div>
        </div>

        <!-- ==================================================== -->
        <!-- 场景 9: 自定义容器包裹与动态显隐 -->
        <!-- ==================================================== -->
        <div
          v-if="activeScenarioKey === 's9' || activeScenarioKey === 'all'"
          class="scenario-card"
        >
          <div class="card-header">
            <div class="header-left">
              <span class="scenario-tag">场景 09</span>
              <h3>自定义容器包裹 (container) 与动态显隐 (hidden)</h3>
            </div>
            <div class="header-action">
              <a-button
                size="small"
                :type="isFormHidden ? 'primary' : 'default'"
                @click="isFormHidden = !isFormHidden"
              >
                {{ isFormHidden ? '点击显示搜索栏' : '点击隐藏搜索栏' }}
              </a-button>
            </div>
          </div>
          <div class="table-wrapper">
            <ProTable
              :table="table9"
              :search="onSearch9"
              :search-form-config="{
                container: CustomCardContainer,
                hidden: isFormHidden,
              }"
            />
          </div>
        </div>

        <!-- ==================================================== -->
        <!-- 场景 10: Modal 缩放动画与单字段防误判 -->
        <!-- ==================================================== -->
        <div
          v-if="activeScenarioKey === 's10' || activeScenarioKey === 'all'"
          class="scenario-card"
        >
          <div class="card-header">
            <div class="header-left">
              <span
                class="scenario-tag"
                style="color: #0369a1; background: #e0f2fe"
                >场景 10</span
              >
              <h3>
                Modal 缩放动画防污染与单字段防误判 (Modal Zoom & Single-field
                Defense)
              </h3>
            </div>
            <span class="header-desc"
              >验证：Antd Modal scale(0.2)→1
              进入动画首帧读取布局盒属性（offsetTop/offsetHeight），不受祖先
              transform 缩放污染（解决 28.8px 假溢出）</span
            >
          </div>

          <div class="scenario-actions-bar">
            <span class="actions-label">弹窗场景触发器：</span>
            <a-space wrap>
              <a-button type="primary" @click="isSingleModalVisible = true">
                🪟 打开单字段弹窗 (AddModal 场景 - 1 字段 1 行)
              </a-button>
              <a-button @click="isMultiModalVisible = true">
                🪟 打开多字段弹窗 (复杂 6 字段场景)
              </a-button>
            </a-space>
          </div>

          <div class="diagnose-box">
            <span class="diagnose-title">🔍 核心修复与验证判定标准：</span>
            <div class="diagnose-list">
              <div class="diagnose-item">
                1.
                <b>单字段弹窗</b
                >：自然高度=32px，折叠高度=32px，<b>展开/收起按钮绝对不出现</b>（旧版因
                28.8px 缩放污染误报出现按钮）。
              </div>
              <div class="diagnose-item">
                2.
                <b>多字段弹窗</b>：弹窗缩放动画结束后折叠高度依然精准落在真实第
                2 行底部，展开收起交互平滑流畅。
              </div>
            </div>
          </div>

          <!-- 单字段弹窗 -->
          <a-modal
            v-model:open="isSingleModalVisible"
            title="单字段 AddModal 场景测试 (1 个字段 1 行)"
            :footer="null"
            width="600px"
            destroy-on-close
          >
            <div class="modal-inner-info">
              💡
              <b>防误判验证</b
              >：观察表单右侧是否出现多余的「展开/收起」按钮。正确表现为：只有 1
              个输入框与查询/重置按钮，无展开按钮。
            </div>
            <ProTable
              :table="table10Single"
              :search="onSearch10Single"
              :search-form-config="{
                expand: { minExpandRows: 2, expandStatus: false },
              }"
            />
          </a-modal>

          <!-- 多字段弹窗 -->
          <a-modal
            v-model:open="isMultiModalVisible"
            title="多字段 Modal 场景测试 (6 个字段)"
            :footer="null"
            width="800px"
            destroy-on-close
          >
            <div class="modal-inner-info">
              💡 <b>多行测量验证</b>：Modal 缩放动画完成后，表单折叠高度取前 2
              行真实底部，点击展开/收起平稳过渡。
            </div>
            <ProTable
              :table="table10Multi"
              :search="onSearch10Multi"
              :search-form-config="{
                expand: { minExpandRows: 2, expandStatus: false },
              }"
            />
          </a-modal>
        </div>

        <!-- ==================================================== -->
        <!-- 场景 11: Textarea 不均匀行高与真实行边界截断 -->
        <!-- ==================================================== -->
        <div
          v-if="activeScenarioKey === 's11' || activeScenarioKey === 'all'"
          class="scenario-card"
        >
          <div class="card-header">
            <div class="header-left">
              <span
                class="scenario-tag"
                style="color: #92400e; background: #fef3c7"
                >场景 11</span
              >
              <h3>
                Textarea 不均匀行高与真实行边界截断 (Non-uniform Row Heights)
              </h3>
            </div>
            <span class="header-desc"
              >验证：第 1 行为 76px Textarea 时，折叠高度准确取第 1
              行真实底部，不再被 32px input 算术行高拦腰切断</span
            >
          </div>

          <div class="scenario-actions-bar">
            <span class="actions-label">折叠行数切换 (minExpandRows)：</span>
            <a-radio-group
              v-model:value="s11MinRows"
              button-style="solid"
              size="small"
            >
              <a-radio-button :value="1"
                >折叠保留 1 行 (含 76px Textarea 行)</a-radio-button
              >
              <a-radio-button :value="2"
                >折叠保留 2 行 (Textarea行 + 普通Input行)</a-radio-button
              >
            </a-radio-group>
          </div>

          <div class="table-wrapper">
            <ProTable
              :table="table11"
              :search="onSearch11"
              :search-form-config="{
                expand: { minExpandRows: s11MinRows, expandStatus: false },
              }"
            />
          </div>

          <div
            class="diagnose-box"
            style="background: #fffbeb; border-color: #fde68a"
          >
            <span class="diagnose-title" style="color: #92400e"
              >📐 布局盒真实行聚类分析：</span
            >
            <div class="diagnose-list" style="color: #78350f">
              <div class="diagnose-item">
                • <b>第 1 行 (Row 1)</b>：包含 Textarea (跨16列, 高度约76px) +
                Select (跨8列, 高度32px)，垂直重叠聚类为一行，行底约为
                <b>76px</b>。
              </div>
              <div class="diagnose-item">
                • <b>传统算法缺陷对比</b>：旧算术推算 `1 × 32px = 32px`，导致
                Textarea 只有上半截可见；新算法精准测量行底 `76px`，完整呈现。
              </div>
            </div>
          </div>
        </div>

        <!-- ==================================================== -->
        <!-- 场景 12: ResizeObserver 行元素动态自愈测试 -->
        <!-- ==================================================== -->
        <div
          v-if="activeScenarioKey === 's12' || activeScenarioKey === 'all'"
          class="scenario-card"
        >
          <div class="card-header">
            <div class="header-left">
              <span
                class="scenario-tag"
                style="color: #15803d; background: #dcfce7"
                >场景 12</span
              >
              <h3>
                ResizeObserver 行元素观察与动态尺寸自愈 (Dynamic Resize
                Auto-heal)
              </h3>
            </div>
            <span class="header-desc"
              >验证：RO 同时监听全部顶层行元素，Textarea autoSize
              内容增高触发行盒变化，表单高度在折叠态/展开态均能实时自愈重测刷新</span
            >
          </div>

          <!-- 动态文本注入快捷按钮 -->
          <div class="scenario-actions-bar">
            <span class="actions-label">动态内容模拟注入：</span>
            <a-space wrap>
              <a-button size="small" @click="setShortText">
                📝 填入 1 行短文本 (32px)
              </a-button>
              <a-button size="small" type="dashed" @click="setMediumText">
                📝 填入 4 行中等文本 (88px)
              </a-button>
              <a-button size="small" type="primary" ghost @click="setLongText">
                📝 填入 8 行长文本 (176px - 触发大幅自愈)
              </a-button>
              <a-button size="small" danger ghost @click="clearText">
                🗑️ 清空文本
              </a-button>
            </a-space>
          </div>

          <div class="table-wrapper">
            <ProTable
              :table="table12"
              :search="onSearch12"
              :search-form-config="{
                expand: { minExpandRows: 1, expandStatus: false },
              }"
            />
          </div>

          <div class="diagnose-box">
            <span class="diagnose-title">🔄 动态自愈机制说明：</span>
            <div class="diagnose-list">
              <div class="diagnose-item">
                • <b>折叠状态下自愈</b>：即使外层表单容器被 `overflow: hidden`
                钉死在折叠高度，Textarea 行高度变高时，同一 RO
                立即感知到该行元素变化并合帧重测，折叠高度自动变大贴合新行底。
              </div>
              <div class="diagnose-item">
                • <b>展开状态下自愈</b>：展开时 Textarea autoSize 增高，自然高度
                `scrollHeight` 动态重测，页面布局不发生遮挡。
              </div>
            </div>
          </div>
        </div>

        <!-- ==================================================== -->
        <!-- 场景 13: 复杂混合跨列与行边界可视化标尺 -->
        <!-- ==================================================== -->
        <div
          v-if="activeScenarioKey === 's13' || activeScenarioKey === 'all'"
          class="scenario-card"
        >
          <div class="card-header">
            <div class="header-left">
              <span
                class="scenario-tag"
                style="color: #7e22ce; background: #f3e8ff"
                >场景 13</span
              >
              <h3>
                复杂混合跨列与可视化行边界分析 (Mixed Spans & Boundary
                Visualizer)
              </h3>
            </div>
            <div class="header-action">
              <a-switch
                v-model:checked="showBoundaryRuler"
                checked-children="显示行聚类说明"
                un-checked-children="隐藏行聚类说明"
              />
            </div>
          </div>

          <div class="table-wrapper">
            <ProTable
              :table="table13"
              :search="onSearch13"
              :search-form-config="{
                expand: { minExpandRows: 2, expandStatus: false },
              }"
            />
          </div>

          <div
            v-if="showBoundaryRuler"
            class="diagnose-box"
            style="background: #faf5ff; border-color: #e9d5ff"
          >
            <span class="diagnose-title" style="color: #7e22ce"
              >📊 多列与多高度垂直区间重叠聚类结果分析：</span
            >
            <div class="diagnose-list" style="color: #6b21a8">
              <div class="diagnose-item">
                • <b>第 1 行</b>：项目简介 (span: 16, 高度90px) 与 项目类型
                (span: 8, 高度32px) 在同处于 top 0px 区间，聚类为 Row 1，行底为
                90px。
              </div>
              <div class="diagnose-item">
                • <b>第 2 行</b>：项目名称 (span: 8) + 负责人 (span: 8) +
                项目周期 (span: 8)，聚类为 Row 2，行底为 90px + rowGap + 32px。
              </div>
              <div class="diagnose-item">
                • <b>自适应联动</b>：拖动上方「视口滑块」至 480px (移动端)
                时，所有 span 自动变为 24 满宽单列，行数重排为 7
                行，折叠高度自动按前 2 单行重算！
              </div>
            </div>
          </div>
        </div>
      </div>
    </main>

    <!-- 底部操作日志面板 -->
    <footer class="playground-logs">
      <div class="logs-header">
        <span class="logs-title"
          >📝 实时搜索/重置触发事件日志 (Event Stream)：</span
        >
        <a-button size="small" type="link" @click="eventLogs = []"
          >清空日志</a-button
        >
      </div>
      <div class="logs-content">
        <div v-if="eventLogs.length === 0" class="log-empty">
          暂无事件，请在上方点击任意场景的“查询”或“重置”按钮
        </div>
        <div v-for="log in eventLogs" :key="log.id" class="log-item">
          <span class="log-time">[{{ log.time }}]</span>
          <span class="log-badge">{{ log.type }}</span>
          <span class="log-data">{{ JSON.stringify(log.details) }}</span>
        </div>
      </div>
    </footer>
  </div>
</template>

<style scoped>
.playground-root {
  display: flex;
  flex-direction: column;
  min-height: 100vh;
  color: #1f2937;
  font-family:
    -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue',
    Arial, sans-serif;
  background: #f5f7fa;
}

/* 顶部导航与控制栏 */
.playground-header {
  position: sticky;
  top: 0;
  z-index: 100;
  padding: 16px 24px;
  background: #ffffff;
  border-bottom: 1px solid #e5e7eb;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.04);
}

.header-main {
  display: flex;
  flex-wrap: wrap;
  gap: 16px;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 14px;
}

.header-title {
  display: flex;
  gap: 10px;
  align-items: center;
}

.logo-badge {
  padding: 2px 7px;
  color: #fff;
  font-weight: 800;
  font-size: 13px;
  letter-spacing: 0.5px;
  background: #1677ff;
  border-radius: 4px;
}

.header-title h1 {
  margin: 0;
  color: #111827;
  font-weight: 700;
  font-size: 18px;
}

.scenario-selector {
  display: flex;
  gap: 8px;
  align-items: center;
}

.scenario-selector .label {
  color: #6b7280;
  font-weight: 500;
  font-size: 13px;
}

/* 视口尺寸栏 */
.viewport-bar {
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
  align-items: center;
  justify-content: space-between;
  padding: 8px 16px;
  background: #f8fafc;
  border: 1px solid #e2e8f0;
  border-radius: 8px;
}

.viewport-left {
  display: flex;
  gap: 10px;
  align-items: center;
}

.bar-title {
  color: #374151;
  font-weight: 600;
  font-size: 13px;
}

.viewport-right {
  display: flex;
  align-items: center;
}

.slider-label {
  color: #6b7280;
  font-size: 12px;
}

.pixel-badge {
  padding: 2px 10px;
  color: #1677ff;
  font-size: 13px;
  background: #e6f4ff;
  border: 1px solid #91caff;
  border-radius: 12px;
}

/* 主展示区 */
.playground-body {
  display: flex;
  flex: 1;
  justify-content: center;
  padding: 24px;
  overflow-x: auto;
}

.sandbox-container {
  position: relative;
  min-height: 500px;
  padding: 24px;
  background: #ffffff;
  border: 1px solid #e5e7eb;
  border-radius: 12px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.06);
  transition: width 0.15s ease-out;
}

/* 拖拽手柄 */
.resizer-handle {
  position: absolute;
  top: 0;
  right: -10px;
  z-index: 10;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 20px;
  height: 100%;
  cursor: ew-resize;
}

.handle-line {
  width: 4px;
  height: 48px;
  background: #cbd5e1;
  border-radius: 2px;
  transition: all 0.2s;
}

.resizer-handle:hover .handle-line,
.resizer-handle.dragging .handle-line {
  width: 6px;
  height: 80px;
  background: #1677ff;
  box-shadow: 0 0 8px rgba(22, 119, 255, 0.5);
}

/* 场景卡片 */
.scenario-card {
  margin-bottom: 24px;
  padding: 20px;
  background: #ffffff;
  border: 1px solid #e5e7eb;
  border-radius: 10px;
  transition: all 0.2s;
}

.scenario-card:hover {
  border-color: #cbd5e1;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.03);
}

.scenario-card:last-child {
  margin-bottom: 0;
}

.card-header {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 16px;
  padding-bottom: 12px;
  border-bottom: 1px solid #f1f5f9;
}

.header-left {
  display: flex;
  gap: 10px;
  align-items: center;
}

.scenario-tag {
  padding: 2px 8px;
  color: #475569;
  font-weight: 700;
  font-size: 12px;
  letter-spacing: 0.5px;
  background: #f1f5f9;
  border-radius: 4px;
}

.card-header h3 {
  margin: 0;
  color: #1e293b;
  font-weight: 600;
  font-size: 15px;
}

.header-desc {
  color: #64748b;
  font-size: 13px;
}

.table-wrapper {
  margin-top: 10px;
}

/* Live 调试台专属样式 */
.live-card {
  background: #fbfdff;
  border: 2px solid #91caff;
}

.live-tag {
  color: #ffffff;
  background: #1677ff;
}

.live-controls-panel {
  margin-bottom: 20px;
  padding: 16px;
  background: #ffffff;
  border: 1px solid #e2e8f0;
  border-radius: 8px;
}

.control-item {
  display: flex;
  align-items: center;
  color: #334155;
  font-size: 13px;
}

.ctl-label {
  font-weight: 500;
  white-space: nowrap;
}

.live-data-preview {
  margin-top: 18px;
  padding: 12px 16px;
  background: #f8fafc;
  border: 1px solid #e2e8f0;
  border-radius: 6px;
}

.preview-title {
  color: #475569;
  font-weight: 600;
  font-size: 12px;
}

.json-box {
  max-height: 160px;
  margin: 8px 0 0;
  padding: 10px;
  overflow-y: auto;
  color: #38bdf8;
  font-size: 12px;
  font-family: 'Fira Code', Consolas, Monaco, monospace;
  background: #1e293b;
  border-radius: 6px;
}

/* 日志区域 */
.playground-logs {
  padding: 12px 24px;
  background: #ffffff;
  border-top: 1px solid #e5e7eb;
}

.logs-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 8px;
}

.logs-title {
  color: #374151;
  font-weight: 600;
  font-size: 13px;
}

.logs-content {
  max-height: 130px;
  padding: 10px 14px;
  overflow-y: auto;
  color: #e2e8f0;
  font-size: 12px;
  font-family: 'Fira Code', Consolas, Monaco, monospace;
  background: #0f172a;
  border-radius: 6px;
}

.log-empty {
  color: #64748b;
  font-style: italic;
}

.log-item {
  margin-bottom: 4px;
  line-height: 1.5;
}

.log-time {
  margin-right: 8px;
  color: #94a3b8;
}

.log-badge {
  margin-right: 8px;
  padding: 1px 6px;
  color: #ffffff;
  font-weight: 600;
  font-size: 11px;
  background: #0284c7;
  border-radius: 3px;
}

.log-data {
  color: #38bdf8;
  word-break: break-all;
}

/* 新增场景相关扩展样式 */
.scenario-actions-bar {
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
  align-items: center;
  margin-bottom: 16px;
  padding: 12px 16px;
  background: #f8fafc;
  border: 1px dashed #cbd5e1;
  border-radius: 8px;
}

.actions-label {
  color: #475569;
  font-weight: 600;
  font-size: 13px;
}

.diagnose-box {
  margin-top: 14px;
  padding: 12px 16px;
  background: #f0fdf4;
  border: 1px solid #bbf7d0;
  border-radius: 6px;
}

.diagnose-title {
  display: block;
  margin-bottom: 6px;
  color: #166534;
  font-weight: 600;
  font-size: 13px;
}

.diagnose-list {
  display: flex;
  flex-direction: column;
  gap: 6px;
  color: #15803d;
  font-size: 12px;
}

.diagnose-item b {
  color: #14532d;
}

.modal-inner-info {
  margin-bottom: 16px;
  padding: 10px 14px;
  color: #0369a1;
  font-size: 13px;
  background: #f0f9ff;
  border: 1px solid #bae6fd;
  border-radius: 6px;
}
</style>
