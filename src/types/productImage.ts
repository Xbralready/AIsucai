/**
 * 产品图片类型定义
 */

// 图片类别
export type ProductImageCategory =
  | 'app_screenshot'   // APP 截图
  | 'product_photo'    // 产品实物照片
  | 'logo'             // Logo
  | 'packaging'        // 包装
  | 'other';           // 其他

// 产品图片
export interface ProductImage {
  id: string;
  file: File;
  previewUrl: string;      // blob URL 用于预览
  category: ProductImageCategory;
  label?: string;          // 用户自定义标签，如 "首页截图"、"借款流程"
  uploadedAt: number;      // 时间戳
  sourceUrl?: string;      // 网页抓取的图片用 URL 展示（非 File 上传）
}

// 图片类别的中文标签
export const CATEGORY_LABELS: Record<ProductImageCategory, string> = {
  app_screenshot: 'APP 截图',
  product_photo: '产品照片',
  logo: 'Logo',
  packaging: '包装',
  other: '其他',
};

// 场景图片关联
export interface SceneImageBinding {
  sceneId: string;
  imageId: string | null;  // null 表示不使用图片
}
