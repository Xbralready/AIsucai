import type { ProductInfoDraft, ProductFittedStructure } from '../types/cloneProductMapping';

// Mock: AI 解析产品后的草稿
export const mockProductDraft: ProductInfoDraft = {
  product_name: '奇富借条',
  product_url: 'https://www.qifu.tech',
  category: '金融/消费信贷',
  target_user: '23-59岁，有短期资金周转需求的上班族及灵活就业人群',
  core_problem: '传统银行贷款流程繁琐、审批慢、门槛高，灵活就业者难以获得信贷服务',
  core_benefits: [
    '最快3分钟完成申请，极速放款',
    '最高额度20万，灵活分期3-24期',
    '纯线上操作，刷脸认证免抵押',
    '日息低至1毛2/千元起（年化7.2%起），息费透明'
  ],
  key_features: [
    '全程线上申请，无需线下跑腿',
    'AI智能信用评估，多维数据综合授信',
    '人脸识别快速认证，免纸质材料',
    '灵活还款：3/6/12/24期可选',
    '持牌金融机构放款，资金安全有保障'
  ],
  differentiators: [
    '2.5亿+用户选择的信贷科技品牌',
    '奇富科技（NYSE: QFIN）旗下，原360借条',
    'AI驱动的Argus信用评估引擎，审批更精准',
    '查额度不上征信，0风险了解自己的额度'
  ],
  risk_sensitive: true,
  additional_notes: '需要合规声明，不能承诺100%通过率或具体放款金额；海外投放需注意当地金融监管要求'
};

// Mock: 产品 × 爆款结构融合结果
export const mockProductFittedStructure: ProductFittedStructure = {
  source_pattern_id: 'dialogue_ugc_with_proof',
  source_pattern_name: '对话式UGC口播+证明叠层',

  product_context: {
    product_name: '奇富借条',
    category: '金融/消费信贷',
    target_user: '23-59岁上班族及灵活就业者',
    core_problem: '急需用钱时贷款流程繁琐、审批慢、门槛高',
    core_benefit: ['3分钟极速申请', '最高20万额度', '刷脸认证免抵押', '日息低至1毛2起'],
    risk_sensitive: true
  },

  slot_feasibility: {
    hook_question: 'strong',
    core_value_statement: 'strong',
    proof: 'strong',
    trust_objection: 'required',
    end_card: 'required'
  },

  slot_strategy: {
    hook_question: '从"急需用钱"的高频场景切入：房租到期、医疗应急、教育缴费等，制造即时共鸣',
    core_value_statement: '强调"快"和"简单"，用具体数字说话——3分钟申请、最高20万、日息1毛2起，打破"网贷=高利贷"的认知',
    proof: '展示App操作流程：打开奇富借条 → 填写基本信息 → 刷脸认证 → 查看额度，强调0门槛体验感',
    trust_objection: '主动回应两大核心顾虑：①查额度不上征信 ②持牌机构放款资金安全，用2.5亿用户的信任背书',
    end_card: '必须包含合规声明（借贷需谨慎）+ 奇富借条品牌logo + 奇富科技背书'
  },

  mapped_structure: [
    {
      segment_id: 'seg_1',
      type: 'hook',
      structure: {
        function: 'hook_question',
        time_ratio: { start: 0.00, end: 0.10 }
      },
      product_mapping: {
        slot: 'hook_question',
        expression_strategy: '从"急需用钱却借不到"的焦虑场景切入，制造共鸣',
        example_direction: '"房租明天到期，钱还没凑够？别慌"'
      }
    },
    {
      segment_id: 'seg_2',
      type: 'explain',
      structure: {
        function: 'core_value_statement',
        time_ratio: { start: 0.10, end: 0.40 }
      },
      product_mapping: {
        slot: 'core_value_statement',
        expression_strategy: '用具体数字打破"网贷复杂"的认知，强调速度和低息优势',
        example_direction: '"我用奇富借条，3分钟就申请完了，日息才1毛2，比我想象的简单太多了"'
      }
    },
    {
      segment_id: 'seg_3',
      type: 'proof',
      structure: {
        function: 'product_usage_proof',
        time_ratio: { start: 0.40, end: 0.78 }
      },
      product_mapping: {
        slot: 'proof',
        expression_strategy: '展示App操作全流程，强调"刷脸就行、免抵押"的简单体验，避免展示具体放款金额',
        example_direction: '屏幕录制：打开奇富借条App → 填写信息 → 刷脸认证 → 额度到账提示'
      }
    },
    {
      segment_id: 'seg_4',
      type: 'trust',
      structure: {
        function: 'trust_objection',
        time_ratio: { start: 0.78, end: 0.90 }
      },
      product_mapping: {
        slot: 'trust_objection',
        expression_strategy: '主动打消征信顾虑和安全顾虑，强调持牌机构和用户规模背书',
        example_direction: '"查额度不上征信，而且是持牌机构放款，2.5亿人都在用，放心"'
      }
    },
    {
      segment_id: 'seg_5',
      type: 'end_card',
      structure: {
        function: 'compliance_or_brand_end',
        time_ratio: { start: 0.90, end: 1.00 }
      },
      product_mapping: {
        slot: 'end_card',
        expression_strategy: '品牌露出 + 奇富科技背书 + 合规声明',
        example_direction: '奇富借条 Logo + "奇富科技旗下，2.5亿用户的选择" + "借贷有风险，借款需谨慎"'
      }
    }
  ],

  overall_fit_score: 0.88,

  risk_warnings: [
    '金融产品必须包含合规声明："借贷有风险，借款需谨慎"',
    '不得承诺具体通过率或放款金额，需标注"以审核结果为准"',
    '需标注"广告"或"演员演绎"，不得暗示为真实用户体验',
    '利率展示需符合当地监管要求，标注年化利率（单利）'
  ]
};
