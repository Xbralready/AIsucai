/** 产品信息（AI 解析或用户手动填写） */
export interface ProductInfo {
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
  images: string[]; // 产品图片 URL 列表
}
