// Sora2 Script Schema v0.1

export interface ScriptSegment {
  segment_id: string;
  slot: 'hook' | 'explain' | 'proof' | 'trust' | 'end_card';
  visual_description: string;
  action_description: string;
  spoken_or_text: string;
  duration_hint: string;
}

export interface GlobalConstraints {
  max_characters: number;
  max_scenes: number;
  camera_motion: 'static' | 'slow' | 'static_or_slow';
}

export interface SoraScriptOutput {
  script_type: 'sora2';
  segments: ScriptSegment[];
  global_constraints: GlobalConstraints;
  sora_generation_hints: {
    avoid: string[];
    prefer: string[];
  };
}

// Slot 级生成规则（硬编码）
export const SLOT_RULES: Record<string, {
  must: string[];
  must_not: string[];
}> = {
  hook: {
    must: ['疑问句形式'],
    must_not: ['产品名', '承诺词（保证、一定、100%）']
  },
  explain: {
    must: ['第一人称', '描述过程简化'],
    must_not: ['夸大承诺']
  },
  proof: {
    must: ['象征性操作（如手指滑动）'],
    must_not: ['真实UI截图', '具体数字']
  },
  trust: {
    must: ['否定式安全说明（不会...、不影响...）'],
    must_not: ['正面承诺']
  },
  end_card: {
    must: ['静态画面', 'Logo', '短slogan'],
    must_not: ['动态元素', '长文案']
  }
};

// Sora2 生成硬约束
export const SORA2_CONSTRAINTS = {
  avoid: [
    'fast cuts',
    'multiple people',
    'complex UI',
    'scene switching'
  ],
  prefer: [
    'single scene',
    'slow movement',
    'simple gestures',
    'clear face'
  ]
};
