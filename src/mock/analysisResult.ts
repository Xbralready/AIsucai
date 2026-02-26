import type { AnalysisResult } from '../types/analysis';

export const mockAnalysisResult: AnalysisResult = {
  _schema: {
    version: 'v0.1',
    status: 'exploratory',
    note: 'Analysis display layer only. Not for generation. Fields may be merged, downgraded, or removed based on user value validation.'
  },

  video_meta: {
    duration_seconds: 20.4,
    resolution: '720x1280',
    orientation: 'vertical'
  },

  pattern: {
    pattern_id: 'dialogue_ugc_with_proof',
    pattern_name: '对话式UGC口播+证明叠层',
    core_formula: '旁人提问 → 主角回答 → 产品演示 → 品牌收尾',
    confidence: 0.82
  },

  segments: [
    {
      segment_id: 'seg_1',
      type: 'hook',
      structure: {
        function: 'hook_question',
        time: { start: 0.0, end: 2.0 },
        time_ratio: { start: 0.00, end: 0.10 },
        variable_slot: 'hook_question'
      },
      evidence: {
        scene_observation: '阳台场景，主角坐椅子上，听到问题抬头看镜头',
        camera_observation: '手持晃动走近，制造随手拍感',
        performance_observation: '眼神先看旁边（假装听人说话），再看镜头',
        voiceover_raw: null,
        subtitle_main_raw: null,
        subtitle_secondary_raw: 'how did you pay your debt off so fast again?',
        overlay_detected: null
      },
      insights: [
        {
          point: '为什么这样开场有效',
          explanation: '以问句开场能立刻制造信息缺口，迫使观众继续观看。',
          confidence: 0.87
        },
        {
          point: '为什么用晃动镜头',
          explanation: '轻微晃动模拟随手拍，降低广告直视感。',
          confidence: 0.82
        }
      ]
    },
    {
      segment_id: 'seg_2',
      type: 'explain',
      structure: {
        function: 'core_value_statement',
        time: { start: 2.0, end: 8.0 },
        time_ratio: { start: 0.10, end: 0.39 },
        variable_slot: 'core_value_statement'
      },
      evidence: {
        scene_observation: '同场景，主角对镜头讲解',
        camera_observation: '稳定，人物居中偏右',
        performance_observation: '手里有动作（搅拌杯子），边说边比划',
        voiceover_raw: 'so I used NerdWallet\'s personal loan prequalification service, and I was able to consolidate my debt into one single payment',
        subtitle_main_raw: 'so I used NerdWallet\'s personal loan prequalification service\nand I was able to consolidate my debt into one single payment',
        subtitle_secondary_raw: 'really was it hard?',
        overlay_detected: null
      },
      insights: [
        {
          point: '为什么用绿字和白字区分',
          explanation: '绿色=对话方，白色=主角，视觉区分说话人，降低理解成本。',
          confidence: 0.85
        },
        {
          point: '为什么手里要有动作',
          explanation: '持续的小动作让画面不死板，同时分散观众对"背稿感"的注意。',
          confidence: 0.78
        }
      ]
    },
    {
      segment_id: 'seg_3',
      type: 'proof',
      structure: {
        function: 'product_usage_proof',
        time: { start: 8.0, end: 16.0 },
        time_ratio: { start: 0.39, end: 0.78 },
        variable_slot: 'proof_screens'
      },
      evidence: {
        scene_observation: '同场景，左侧叠加手机界面',
        camera_observation: '稳定',
        performance_observation: '手指向左侧叠层手机',
        voiceover_raw: 'you just answer a few questions and they\'ll compare the most suitable loan offers for you. Nope!',
        subtitle_main_raw: 'you just answer a few questions\nand they\'ll compare the most suitable loan offers for you\nnope!',
        subtitle_secondary_raw: 'yeah but does it affect your credit?\nwhat\'s it called again?',
        overlay_detected: 'phone_screen_left'
      },
      insights: [
        {
          point: '为什么在这个时间点出现手机叠层',
          explanation: '前面建立信任后再展示产品，避免过早广告化导致划走。',
          confidence: 0.88
        },
        {
          point: '为什么用手机外框而不是纯截图',
          explanation: '手机外框增加真实感，纯截图像P图，降低可信度。',
          confidence: 0.81
        },
        {
          point: '为什么要回应"影响信用吗"这个问题',
          explanation: '主动提出并打消核心顾虑，比用户自己想到再划走更有效。',
          confidence: 0.84
        }
      ]
    },
    {
      segment_id: 'seg_4',
      type: 'end_card',
      structure: {
        function: 'compliance_or_brand_end',
        time: { start: 16.0, end: 20.4 },
        time_ratio: { start: 0.78, end: 1.00 },
        variable_slot: 'brand_end_card'
      },
      evidence: {
        scene_observation: '纯色背景+Logo+免责文字',
        camera_observation: null,
        performance_observation: null,
        voiceover_raw: null,
        subtitle_main_raw: null,
        subtitle_secondary_raw: null,
        overlay_detected: 'logo_disclaimer'
      },
      insights: [
        {
          point: '为什么结尾卡要静音',
          explanation: '结尾卡是合规需求，静音处理避免打断观众情绪流。',
          confidence: 0.72
        }
      ]
    }
  ],

  layers: {
    _type: 'observed_implementation',
    _note: 'For analysis explanation only, not for generation.',
    confidence: 0.75,
    items: [
      {
        layer_id: 'layer_disclaimer',
        name: '顶部声明',
        position: 'top_center',
        style: { color: '#FFFFFF', size: 'small', stroke: 'none' },
        appears_in: ['seg_1', 'seg_2', 'seg_3']
      },
      {
        layer_id: 'layer_question',
        name: '绿字提问（旁人视角）',
        position: 'bottom',
        style: { color: '#00FF00', size: 'medium', stroke: 'white' },
        appears_in: ['seg_1', 'seg_2', 'seg_3']
      },
      {
        layer_id: 'layer_answer',
        name: '白字回答（主角视角）',
        position: 'center',
        style: { color: '#FFFFFF', size: 'large', stroke: 'black' },
        appears_in: ['seg_2', 'seg_3']
      },
      {
        layer_id: 'layer_phone',
        name: '手机叠层',
        position: 'left_center',
        style: { has_frame: 'true', shadow: 'true' },
        appears_in: ['seg_3']
      }
    ]
  },

  variables: {
    hook_question: {
      current_value: 'how did you pay your debt off so fast again?',
      is_example: true,
      description: '开场钩子问题，用户最痛的点',
      type: 'text',
      confidence: 0.76
    },
    core_value_statement: {
      current_value: 'NerdWallet\'s personal loan prequalification service / consolidate debt into one single payment',
      is_example: true,
      description: '核心卖点/方法名称',
      type: 'text',
      confidence: 0.71
    },
    proof_screens: {
      current_value: '4张产品界面截图',
      is_example: true,
      description: '证明素材，产品界面/数据/结果',
      type: 'image_sequence',
      confidence: 0.68
    },
    brand_end_card: {
      current_value: 'NerdWallet Logo + 免责声明',
      is_example: true,
      description: '品牌收尾卡',
      type: 'image',
      confidence: 0.54
    }
  },

  audio: {
    _type: 'observed_implementation',
    bgm: { type: 'none_or_subtle', volume: 'low' },
    voiceover: { style: 'casual_fast', pace: '每2-3秒一个信息点' }
  },

  replicate_checklist: {
    shooting: [
      '场景：阳台/露台，有远景空间感',
      '穿着：居家休闲（浴袍/睡衣）',
      '道具：饮料杯+手机',
      '机位：竖拍9:16，人物居中偏右，左侧留空给叠层',
      '表演：绿字出现时看旁边，回答时看镜头+手势'
    ],
    editing: [
      '总时长控制在18-22秒',
      '每2-3秒切换一条字幕',
      '9秒左右加入手机叠层',
      '16秒切到结尾卡',
      '结尾卡静音或极低音量'
    ]
  },

  summary_insights: [
    '这是一个典型的对话式UGC结构，通过模拟日常对话降低广告感',
    '通过颜色区分说话人（绿色=提问方，白色=主角）降低理解成本',
    '证明素材（手机叠层）只在中段出现，避免过早广告化',
    '主动提出并打消用户核心顾虑（影响信用吗），比被动等待更有效'
  ],

  replicability: {
    structure_score: 0.88,
    ip_dependency: 0.21,
    difficulty: 'easy',
    overall_score: 0.79
  }
};
