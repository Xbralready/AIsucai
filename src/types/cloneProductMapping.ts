// Product-Fitted Structure Schema v0.1

export interface ProductContext {
  product_name: string;
  category: string;
  target_user: string;
  core_problem: string;
  core_benefit: string[];
  risk_sensitive: boolean;
}

export type FeasibilityLevel = 'strong' | 'medium' | 'weak' | 'not_applicable';
export type RequirementLevel = 'required' | 'optional' | 'not_needed';

export interface SlotFeasibility {
  [slotName: string]: FeasibilityLevel | RequirementLevel;
}

export interface SlotStrategy {
  [slotName: string]: string;
}

export interface ProductMapping {
  slot: string;
  expression_strategy: string;
  example_direction: string;
}

export interface MappedSegment {
  segment_id: string;
  type: string;
  structure: {
    function: string;
    time_ratio: { start: number; end: number };
  };
  product_mapping: ProductMapping;
}

export interface ProductFittedStructure {
  source_pattern_id: string;
  source_pattern_name: string;
  product_context: ProductContext;
  slot_feasibility: SlotFeasibility;
  slot_strategy: SlotStrategy;
  mapped_structure: MappedSegment[];
  overall_fit_score: number;
  risk_warnings: string[];
}

// 产品信息输入（用户填写/AI解析后的草稿）
export interface ProductInfoDraft {
  product_name: string;
  product_url?: string;
  category: string;
  target_user: string;
  core_problem: string;
  core_benefits: string[];
  key_features: string[];
  differentiators: string[];
  risk_sensitive: boolean;
  additional_notes?: string;
  image_urls?: string[];
}
