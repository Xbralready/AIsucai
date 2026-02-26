import { useRef, useState } from 'react';
import { X, Plus, Upload, Image as ImageIcon } from 'lucide-react';
import type { ProductInfoDraft } from '../../types/cloneProductMapping';
import type { ProductImage } from '../../types/productImage';

interface ProductInfoPreviewProps {
  draft: ProductInfoDraft;
  onDraftChange: (draft: ProductInfoDraft) => void;
  webImages: string[];
  productImages: ProductImage[];
  onProductImagesChange: (images: ProductImage[]) => void;
}

export function ProductInfoPreview({
  draft,
  onDraftChange,
  webImages,
  productImages,
  onProductImagesChange,
}: ProductInfoPreviewProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const update = (patch: Partial<ProductInfoDraft>) => {
    onDraftChange({ ...draft, ...patch });
  };

  const updateArrayItem = (
    field: 'core_benefits' | 'key_features' | 'differentiators',
    index: number,
    value: string
  ) => {
    const arr = [...draft[field]];
    arr[index] = value;
    update({ [field]: arr });
  };

  const removeArrayItem = (
    field: 'core_benefits' | 'key_features' | 'differentiators',
    index: number
  ) => {
    update({ [field]: draft[field].filter((_, i) => i !== index) });
  };

  const addArrayItem = (field: 'core_benefits' | 'key_features' | 'differentiators') => {
    update({ [field]: [...draft[field], ''] });
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    const remaining = 8 - productImages.length;
    const toAdd = files.slice(0, remaining).filter(f => f.size <= 5 * 1024 * 1024);

    const newImages: ProductImage[] = toAdd.map(file => ({
      id: crypto.randomUUID(),
      file,
      previewUrl: URL.createObjectURL(file),
      category: 'product_photo' as const,
      uploadedAt: Date.now(),
    }));

    onProductImagesChange([...productImages, ...newImages]);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const selectWebImage = (url: string) => {
    if (productImages.length >= 8) return;
    if (productImages.some(img => img.sourceUrl === url)) return;

    const newImage: ProductImage = {
      id: crypto.randomUUID(),
      file: new File([], 'web-image.jpg'),
      previewUrl: url,
      category: 'product_photo',
      uploadedAt: Date.now(),
      sourceUrl: url,
    };
    onProductImagesChange([...productImages, newImage]);
  };

  const removeImage = (id: string) => {
    onProductImagesChange(productImages.filter(img => img.id !== id));
  };

  const isWebImageSelected = (url: string) =>
    productImages.some(img => img.sourceUrl === url);

  return (
    <div className="space-y-4">
      {/* Basic info */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <Field label="产品名称" required>
          <input
            value={draft.product_name}
            onChange={e => update({ product_name: e.target.value })}
            placeholder="如：奇富借条"
            className="field-input"
          />
        </Field>
        <Field label="产品类别">
          <input
            value={draft.category}
            onChange={e => update({ category: e.target.value })}
            placeholder="如：金融/贷款"
            className="field-input"
          />
        </Field>
        <Field label="目标用户">
          <input
            value={draft.target_user}
            onChange={e => update({ target_user: e.target.value })}
            placeholder="如：25-45岁有资金需求的上班族"
            className="field-input"
          />
        </Field>
        <Field label="核心痛点">
          <input
            value={draft.core_problem}
            onChange={e => update({ core_problem: e.target.value })}
            placeholder="如：传统贷款审批慢、流程复杂"
            className="field-input"
          />
        </Field>
      </div>

      {/* Array fields */}
      <ChipListField
        label="核心卖点"
        items={draft.core_benefits}
        onChange={(i, v) => updateArrayItem('core_benefits', i, v)}
        onRemove={i => removeArrayItem('core_benefits', i)}
        onAdd={() => addArrayItem('core_benefits')}
        placeholder="如：3分钟极速放款"
        accentColor="emerald"
      />

      <ChipListField
        label="关键功能"
        items={draft.key_features}
        onChange={(i, v) => updateArrayItem('key_features', i, v)}
        onRemove={i => removeArrayItem('key_features', i)}
        onAdd={() => addArrayItem('key_features')}
        placeholder="如：全程线上申请"
        accentColor="blue"
      />

      <ChipListField
        label="差异化优势"
        items={draft.differentiators}
        onChange={(i, v) => updateArrayItem('differentiators', i, v)}
        onRemove={i => removeArrayItem('differentiators', i)}
        onAdd={() => addArrayItem('differentiators')}
        placeholder="如：2.5亿+用户信赖"
        accentColor="purple"
      />

      {/* Risk sensitive */}
      <label className="flex items-center gap-2 cursor-pointer">
        <input
          type="checkbox"
          checked={draft.risk_sensitive}
          onChange={e => update({ risk_sensitive: e.target.checked })}
          className="w-4 h-4 text-emerald-600 rounded border-slate-300 focus:ring-emerald-500"
        />
        <span className="text-xs text-slate-600">风险敏感产品（金融、医疗等，自动添加合规提示）</span>
      </label>

      {/* Additional notes */}
      <Field label="补充说明">
        <textarea
          value={draft.additional_notes || ''}
          onChange={e => update({ additional_notes: e.target.value })}
          placeholder="其他需要补充的产品信息..."
          rows={2}
          className="field-input resize-none"
        />
      </Field>

      {/* Images section */}
      <div>
        <p className="text-xs font-medium text-slate-600 mb-2 flex items-center gap-1.5">
          <ImageIcon size={12} />
          产品图片
          <span className="text-slate-400 font-normal">({productImages.length}/8)</span>
        </p>

        {/* Web extracted images */}
        {webImages.length > 0 && (
          <div className="mb-3">
            <p className="text-xs text-slate-400 mb-1.5">网页抓取的图片（点击选用）</p>
            <div className="flex gap-2 overflow-x-auto pb-1">
              {webImages.map((url, i) => (
                <WebImageThumb
                  key={i}
                  url={url}
                  selected={isWebImageSelected(url)}
                  onSelect={() => selectWebImage(url)}
                />
              ))}
            </div>
          </div>
        )}

        {/* Selected / uploaded images */}
        {productImages.length > 0 && (
          <div className="flex gap-2 flex-wrap mb-3">
            {productImages.map(img => (
              <div key={img.id} className="relative group w-16 h-16 rounded-lg overflow-hidden border border-slate-200 bg-slate-50">
                <img
                  src={img.previewUrl}
                  alt=""
                  className="w-full h-full object-cover"
                  onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
                />
                <button
                  onClick={() => removeImage(img.id)}
                  className="absolute top-0.5 right-0.5 w-4 h-4 bg-red-500 text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  <X size={10} />
                </button>
              </div>
            ))}
          </div>
        )}

        {/* Upload button */}
        {productImages.length < 8 && (
          <button
            onClick={() => fileInputRef.current?.click()}
            className="w-full py-3 border-2 border-dashed border-slate-200 hover:border-emerald-300 rounded-lg text-xs text-slate-500 hover:text-emerald-600 transition-colors flex items-center justify-center gap-1.5"
          >
            <Upload size={12} />
            上传产品图片（最多 8 张，单张 5MB）
          </button>
        )}
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          multiple
          onChange={handleImageUpload}
          className="hidden"
        />
      </div>
    </div>
  );
}

/** Simple field wrapper */
function Field({ label, required, children }: { label: string; required?: boolean; children: React.ReactNode }) {
  return (
    <div>
      <label className="text-xs font-medium text-slate-600 mb-1 block">
        {label}
        {required && <span className="text-red-400 ml-0.5">*</span>}
      </label>
      {children}
    </div>
  );
}

/** Web image thumbnail with error handling — hides broken images */
function WebImageThumb({
  url,
  selected,
  onSelect,
}: {
  url: string;
  selected: boolean;
  onSelect: () => void;
}) {
  const [broken, setBroken] = useState(false);

  if (broken) return null;

  return (
    <button
      onClick={onSelect}
      className={`relative flex-shrink-0 w-14 h-14 rounded-lg overflow-hidden border-2 transition-all ${
        selected
          ? 'border-emerald-500 ring-2 ring-emerald-200 opacity-60'
          : 'border-slate-200 hover:border-emerald-300'
      }`}
    >
      <img
        src={url}
        alt=""
        className="w-full h-full object-cover"
        referrerPolicy="no-referrer"
        crossOrigin="anonymous"
        onError={() => setBroken(true)}
      />
      {selected && (
        <div className="absolute inset-0 bg-emerald-500/20 flex items-center justify-center">
          <span className="text-emerald-700 text-xs font-bold">✓</span>
        </div>
      )}
    </button>
  );
}

/** Editable chip list for array fields */
function ChipListField({
  label,
  items,
  onChange,
  onRemove,
  onAdd,
  placeholder,
  accentColor,
}: {
  label: string;
  items: string[];
  onChange: (index: number, value: string) => void;
  onRemove: (index: number) => void;
  onAdd: () => void;
  placeholder: string;
  accentColor: 'emerald' | 'blue' | 'purple';
}) {
  const colors = {
    emerald: 'bg-emerald-50 border-emerald-200 focus-within:border-emerald-400',
    blue: 'bg-blue-50 border-blue-200 focus-within:border-blue-400',
    purple: 'bg-purple-50 border-purple-200 focus-within:border-purple-400',
  };
  const removeColors = {
    emerald: 'text-emerald-400 hover:text-emerald-600',
    blue: 'text-blue-400 hover:text-blue-600',
    purple: 'text-purple-400 hover:text-purple-600',
  };

  return (
    <div>
      <p className="text-xs font-medium text-slate-600 mb-1.5">{label}</p>
      <div className="flex flex-wrap gap-2">
        {items.map((item, i) => (
          <div
            key={i}
            className={`flex items-center gap-1 px-2 py-1 rounded-lg border text-xs transition-colors ${colors[accentColor]}`}
          >
            <input
              value={item}
              onChange={e => onChange(i, e.target.value)}
              placeholder={placeholder}
              className="bg-transparent outline-none min-w-[80px] max-w-[200px] text-slate-700"
              style={{ width: `${Math.max(80, (item.length + 1) * 8)}px` }}
            />
            <button
              onClick={() => onRemove(i)}
              className={`flex-shrink-0 ${removeColors[accentColor]}`}
            >
              <X size={12} />
            </button>
          </div>
        ))}
        <button
          onClick={onAdd}
          className="flex items-center gap-1 px-2 py-1 rounded-lg border border-dashed border-slate-300 text-xs text-slate-400 hover:text-emerald-600 hover:border-emerald-300 transition-colors"
        >
          <Plus size={12} />
          添加
        </button>
      </div>
    </div>
  );
}
