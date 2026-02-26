// Schema v0.1 - Exploratory
// Analysis display layer only. Not for generation.
// Fields may be merged, downgraded, or removed based on user value validation.

export interface SchemaMetadata {
  version: string;
  status: 'exploratory' | 'stable';
  note: string;
}

export interface VideoMeta {
  duration_seconds: number;
  resolution: string;
  orientation: 'vertical' | 'horizontal' | 'square';
}

export interface Pattern {
  pattern_id: string;
  pattern_name: string;
  core_formula: string;
  confidence: number;
}

export interface TimeRange {
  start: number;
  end: number;
}

export interface SegmentStructure {
  function: string;
  time: TimeRange;
  time_ratio: TimeRange;
  variable_slot: string | null;
}

export interface SegmentEvidence {
  scene_observation: string;
  camera_observation: string | null;
  performance_observation: string | null;
  voiceover_raw: string | null;
  subtitle_main_raw: string | null;
  subtitle_secondary_raw: string | null;
  overlay_detected: string | null;
}

export interface Insight {
  point: string;
  explanation: string;
  confidence: number;
}

export interface Segment {
  segment_id: string;
  type: 'hook' | 'explain' | 'proof' | 'end_card' | 'transition';
  structure: SegmentStructure;
  evidence: SegmentEvidence;
  insights: Insight[];
}

export interface LayerItem {
  layer_id: string;
  name: string;
  position: string;
  style: Record<string, string>;
  appears_in: string[];
}

export interface Layers {
  _type: 'observed_implementation';
  _note: string;
  confidence: number;
  items: LayerItem[];
}

export interface Variable {
  current_value: string;
  is_example: boolean;
  description: string;
  type: 'text' | 'image' | 'image_sequence' | 'video_clip';
  confidence: number;
}

export interface Audio {
  _type: 'observed_implementation';
  bgm: {
    type: string;
    volume: string;
  };
  voiceover: {
    style: string;
    pace: string;
  };
}

export interface ReplicateChecklist {
  shooting: string[];
  editing: string[];
}

export interface Replicability {
  structure_score: number;
  ip_dependency: number;
  difficulty: 'easy' | 'medium' | 'hard';
  overall_score: number;
}

export interface AnalysisResult {
  _schema: SchemaMetadata;
  video_meta: VideoMeta;
  pattern: Pattern;
  segments: Segment[];
  layers: Layers;
  variables: Record<string, Variable>;
  audio: Audio;
  replicate_checklist: ReplicateChecklist;
  summary_insights: string[];
  replicability: Replicability;
}
