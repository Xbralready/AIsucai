/**
 * 批量脚本生成服务
 * 根据产品信息和推荐的视频类型，批量生成营销脚本
 * GPT 自主判断品类并选择最佳产品展示策略
 */

import type { ProductInfo } from '../types/product';
import type { TypeRecommendation, VideoModel } from '../types/recommendation';
import type { VideoScript } from '../types/script';
import { VIDEO_CREATIVE_TYPES } from '../data/videoTypes';
import { callGPT } from './gptClient';

const LANGUAGE_LABELS: Record<string, string> = {
  zh: '中文',
  en: 'English',
  es: 'Español',
  pt: 'Português',
};

// ─── 模型能力定义 ────────────────────────────────────────────

interface ModelSpec {
  name: string;
  maxDuration: number;
  supportedDurations: string;
  features: string;
  promptTips: string;
}

const MODEL_SPECS: Record<string, ModelSpec> = {
  veo: {
    name: 'Veo 3.1',
    maxDuration: 8,
    supportedDurations: '4s / 5s / 6s / 7s / 8s',
    features: '支持口播 lip-sync（人物对着镜头说话）、纯画面、image-to-video（用产品图做参考帧）',
    promptTips: `- 单段最长 8 秒，内容必须精炼
- 口播类型用 lip-sync 格式：人物描述 + says: "台词"
- 无法渲染文字、UI 界面、品牌 logo
- 不支持运镜指令（zoom/pan/track）
- 结尾加 (no subtitles)`,
  },
  sora: {
    name: 'Sora 2',
    maxDuration: 12,
    supportedDurations: '4s / 8s / 12s',
    features: '纯画面生成、高质量场景、不支持口播 lip-sync',
    promptTips: `- 最长 12 秒，适合稍长的产品展示
- 纯画面描述，不含人物对话
- 英文 prompt，描述场景、动作、光线、风格`,
  },
};

// ─── Veo Prompt 品类参考示例（根据是否有产品图调整策略） ───────────

function getVeoCategoryExamples(hasProductImage: boolean): string {
  // App/数字产品 和 金融 品类的策略取决于是否有产品参考图
  // 有图时：image-to-video 模式，Veo 能在手机屏幕上渲染参考图的 UI
  // 无图时：纯文字模式，Veo 无法渲染 UI，只能用光效暗示

  const appCategory = hasProductImage
    ? `【App/软件/数字产品】→ 主持人 **手持手机对着镜头，手机屏幕必须清晰展示参考图中的 App 界面**
- 系统会将产品截图作为参考传给视频模型（image-to-video），手机屏幕上会展示参考图的 UI 风格
- 在 prompt 中明确描述：手机屏幕展示参考图中的界面样式（颜色主题、布局特征等）
- 要求屏幕清晰可读（keep the screen readable, no blur, no warped text）
- 动作模式：举起手机到镜头高度 → 指向屏幕关键信息 → 点头/手势 → 保持手机稳定展示 → 面对镜头说台词
- 示例：Medium shot, a young Latina woman, 28, dark hair in ponytail, wearing a white blouse, bright indoor setting, holding a smartphone facing the camera with both hands. Phone screen must clearly show the provided reference UI style: the app home page with visible key information area and action button. She raises the phone to camera level with a confident smile, points at the key area on the screen, nods and makes a small easy gesture, holds the phone steady for a moment so the app screen is clearly visible, then looks at camera and says: "I applied on my phone and got approved fast." (no subtitles)`
    : `【App/软件/数字产品】→ 主持人 **手持手机，用表情传达产品效果**
- 没有产品参考图，Veo 无法渲染真实 App 界面，不要描述屏幕内容
- 用手机屏幕光效 + 人物表情变化来暗示产品效果
- 动作模式：看手机 → 惊喜/开心 → 面对镜头说台词
- 示例：Close-up to medium shot, a young Latino man, 28, short fade haircut, wearing a navy polo shirt, sitting at a cafe table, looks at his phone screen glowing with approval, eyes widen with excitement, looks up at camera and says: "I just got approved in two minutes, no paperwork." (no subtitles)`;

  const financeCategory = hasProductImage
    ? `【金融/贷款/保险】→ 主持人 **手持手机对着镜头，展示 App 界面中的额度/审批结果**
- 系统会将产品截图作为参考传给视频模型，手机屏幕上会展示参考图的界面
- 明确描述手机屏幕展示参考图中的界面（额度区域、利率信息、操作按钮等）
- 要求屏幕清晰可读，不模糊，不变形
- 动作模式：举起手机 → 指向额度/审批信息 → 惊喜表情 → 保持展示 → 面对镜头说台词
- 示例：Medium shot, a young Latina woman, 30, professional look, dark hair in a low bun, wearing a light blue blouse, sitting on a couch, holding a smartphone facing the camera. Phone screen must clearly show the provided reference UI style: the loan app home page with visible credit amount area and approval status. She points at the amount on screen, face lights up with surprise and joy, holds the phone steady, then looks at camera and says: "I got approved instantly, money arrived in minutes." (no subtitles)`
    : `【金融/贷款/保险】→ 主持人 **手持手机，展示申请通过的惊喜反应**
- 没有产品参考图，不渲染真实界面，用光效 + 表情传达"秒批/到账"
- 示例：Medium shot, a young Latina woman, 30, professional look, dark hair in a low bun, wearing a light blue blouse, sitting on a couch, looks at phone screen glowing warmly, face lights up with surprise and joy, looks at camera and says: "I got approved instantly, money arrived in minutes." (no subtitles)`;

  return `
你需要根据产品性质，自主判断主持人应该如何与产品互动。以下是不同品类的参考策略，请灵活运用：

【服装/鞋/配饰】→ 主持人必须 **穿着/佩戴** 产品出镜
- 不要用 holding，衣服/鞋/包必须穿戴在身上
- 描述穿着效果：颜色、剪裁、面料质感、搭配
- 示例：Medium shot, a young Latina woman, 25, long dark hair, wearing a fitted black puffer jacket with matte finish and silver zipper details over a white crop top and high-waisted jeans, standing in a modern loft with warm lighting, smiles at camera and says: "Finally a jacket that keeps me warm and still looks fire." (no subtitles)

${appCategory}

【食品/饮品】→ 主持人 **展示产品后品尝，表情体现美味**
- 先展示食品/饮品外观或包装，再品尝
- 描述食品的颜色、质地、包装细节
- 示例：Medium shot, a young woman, 22, curly brown hair, wearing a casual yellow sundress, holding a tall glass of bright green matcha latte with creamy foam on top, takes a sip, closes eyes with a satisfied smile, looks at camera and says: "This is the smoothest matcha I have ever tried." (no subtitles)

【美妆/护肤】→ 主持人 **涂抹/使用** 产品，特写展示质地
- 先展示产品瓶身/包装，再在皮肤上涂抹
- 用特写镜头展示产品质地和肤感变化
- 示例：Close-up, a young woman, 24, smooth tan skin, dark straight hair, holding a small frosted glass bottle of serum with gold cap, squeezes a drop of clear liquid onto fingertip, gently pats it onto cheek, skin looks dewy, looks at camera and says: "My skin has never felt this smooth." (no subtitles)

【电子/数码】→ 主持人 **开箱或实际操作** 产品
- 展示产品外观细节（材质、颜色、大小），然后实际使用
- 耳机→戴上，充电器→插上，键盘→打字
- 示例：Medium shot, a young man, 26, clean-cut, wearing a grey hoodie, sitting at a minimalist white desk, lifts a pair of matte black wireless earbuds from a sleek charging case, puts one in ear, nods to music, looks at camera and says: "The noise canceling on these is unreal." (no subtitles)

${financeCategory}

【健身/运动】→ 主持人在 **运动场景中使用/穿着** 产品
- 运动服→穿着运动，器材→正在使用，补剂→运动后饮用
- 场景要有运动氛围
- 示例：Medium shot, an athletic young man, 27, toned build, wearing a bright red compression shirt and black shorts, in a modern gym, doing a bicep curl with a sleek chrome dumbbell, puts it down, looks at camera and says: "This grip feels so much better than my old set." (no subtitles)

【其他品类】→ 根据产品性质自行决定最自然的展示方式
- 能穿戴的就穿戴，能操作的就操作，能品尝的就品尝
- 实在无法直接互动的产品（如服务类），用手势 + 表情 + 场景暗示

以上只是参考，你需要根据具体产品灵活变通。比如一个"健身 App"应该结合"App"和"健身"的策略。
`;
}

// ─── 脚本生成 ─────────────────────────────────────────────────

export async function generateScriptsForType(
  product: ProductInfo,
  recommendation: TypeRecommendation,
  options: {
    language: string;
    count: number;
    videoModel: VideoModel;
  },
  onProgress?: (msg: string) => void
): Promise<VideoScript[]> {
  const typeData = VIDEO_CREATIVE_TYPES.find(t => t.id === recommendation.typeId);
  const langLabel = LANGUAGE_LABELS[options.language] || options.language;

  onProgress?.(`正在为「${recommendation.typeNameZh}」生成 ${options.count} 条脚本...`);

  const modelSpec = MODEL_SPECS[options.videoModel];
  const hasProductImage = product.images && product.images.length > 0;
  // 判断是否为口播类型（talking-head）且使用 Veo
  const isTalkingHead = recommendation.suggestedFormat === 'talking-head';
  // Veo + (talking-head 或 有产品图) → 使用 veoPrompt（含 Voiceover/lip-sync）
  // 有产品图时走 image-to-video，需要用 veoPrompt 的 Voiceover 格式才能产生语音
  const useVeoLipsync = options.videoModel === 'veo' && (isTalkingHead || !!hasProductImage);

  const systemPrompt = `你是一个短视频营销脚本专家。根据产品信息和指定的视频创意类型，生成高转化率的营销脚本。

视频类型：${recommendation.typeName} (${recommendation.typeNameZh})
类型说明：${typeData?.description || recommendation.typeName}
制作格式：${recommendation.suggestedFormat}
建议时长：${recommendation.suggestedDuration} 秒（仅供参考，以下模型约束优先）
产品参考图：${hasProductImage ? '有（会作为参考图传给视频模型）' : '无'}

═══ 视频模型：${modelSpec.name} ═══
支持时长：${modelSpec.supportedDurations}（最长 ${modelSpec.maxDuration} 秒）
模型能力：${modelSpec.features}
Prompt 要求：
${modelSpec.promptTips}

你必须根据以上模型约束来决定最合适的视频时长（duration 字段）。
如果建议时长超过模型最长时长，请选择模型支持的最长时长，并将内容精炼到该时长内。
口播台词（fullScript）的字数也要匹配你选定的时长（约每秒 2.5 个英文词 / 5 个中文字）。

参考钩子示例：
${typeData?.exampleHooks?.map(h => `- ${h}`).join('\n') || '无'}

返回 JSON 数组（${options.count} 条脚本）：
[
  {
    "id": "script_1",
    "typeId": "${recommendation.typeId}",
    "typeName": "${recommendation.typeNameZh}",
    "title": "脚本标题",
    "duration": "你选定的最佳时长（必须在模型支持范围内：${modelSpec.supportedDurations}）",
    "language": "${options.language}",
    "hook": "开场钩子（前3秒的文案）",
    "body": "主体内容（产品介绍/演示/故事）",
    "cta": "行动号召（结尾引导行动）",
    "fullScript": "完整口播文本（字数匹配你选定的时长）",
    "visualDirection": "画面方向描述（中文，描述每个镜头该拍什么，适配你选定的时长）",
    ${useVeoLipsync
      ? `"veoPrompt": "视频生成提示词（英文，Veo 口播格式，严格按下面的格式要求生成）"`
      : `"soraPrompt": "视频生成提示词（英文，150字以内，描述画面场景和动作，不含对话）"`}
  }
]

重要规则：
1. hook 必须在 3 秒内抓住注意力
2. body 紧扣产品核心卖点
3. cta 明确引导行动（下载/购买/了解更多）
4. fullScript 是完整的口播台词，使用 ${langLabel}，要求：
   - 自然口语化风格，像真人对着镜头聊天
   - 用短句，适当加语气词
   - 把 hook + body + cta 串成一段连贯的口播
   - 字数匹配你选定的 duration（约每秒 2.5 个英文词 / 5 个中文字）
   - 不要包含画面指示或非语言标记
${useVeoLipsync ? `5. veoPrompt 是给 Veo AI 视频模型的口播提示词，**极其重要**。

   你需要先分析这个产品属于什么品类，然后决定主持人应该如何与产品互动。
   不同品类的产品展示方式完全不同——衣服要穿在身上，食物要品尝，App 要用手机演示反应。

   以下是各品类的参考策略和示例：
${getVeoCategoryExamples(!!hasProductImage)}

   veoPrompt 的通用结构要求（150-250 英文词）：
   - 格式/时长声明：如 "Vertical 9:16, 8-second short ad, realistic UGC style"
   - 镜头描述：Close-up / Medium shot / Wide shot
   - 主持人外貌：年龄、性别、肤色、发型、表情（要具体，如 "single Chinese female spokesperson, age 25-30, dark hair"）
   - 产品互动：根据品类选择最合适的互动方式，详细描述产品外观
   - 场景/灯光：拍摄环境和光线
   - 动作时间线：用 Timeline 格式描述关键动作节拍（At the beginning / Then / After that / Finally）
   ${hasProductImage
     ? `- **语音**：在 prompt 末尾添加独立的 Voiceover 段落（不要用 says: "..." 内联格式），格式如下：
     Voiceover in [语言] ([性别], [语气特征]):
     "[口播台词的精炼版，与 fullScript 对应]"
   - 不要在末尾加 (no subtitles)`
     : `- **台词**：在视觉描述中用 says: "..." 格式，不超过 20 个英文词，是 fullScript 的精炼英文版
   - 结尾必须加 (no subtitles)`}
   - 视觉风格：clean, trustworthy, stable camera, soft natural lighting, realistic
   - Avoid 段落：列出要避免的东西（no fantasy UI, no shaking camera 等）

   **产品参考图**：${hasProductImage
     ? `系统会将真实产品图片作为参考传给视频模型（image-to-video 模式）。
   视频模型会看到产品的真实外观，你的 prompt 应该：
   - 描述主持人与参考图中产品的互动
   - 对于 App/数字产品：明确写 "Phone screen must clearly show the provided reference UI style"
   - 产品外观描述要与真实图片一致，不要瞎编颜色/形状`
     : `没有产品参考图，视频模型只能根据文字描述生成产品外观。
   你的 prompt 必须尽量详细地描述产品外观（颜色、形状、材质、大小、包装等），
   让视频模型能还原出接近真实的产品样子。`}

   **Veo 的限制（绝对不要写这些）**：
   ${hasProductImage
     ? `- 不要加品牌 logo 或文字水印描述
   - 不要写 "camera zooms/pans/tracks" 等运镜指令
   - 不要用 says: "..." 内联格式写台词，语音必须用独立的 Voiceover 段落`
     : `- 不要描述手机屏幕上的具体 UI 界面（Veo 无法渲染文字和界面）
   - 不要加品牌 logo 或文字水印描述
   - 不要写 "camera zooms/pans/tracks" 等运镜指令
   - 不要用引号以外的格式来写台词`}
` : `5. soraPrompt 是给视频模型的画面描述提示词，必须使用英文${hasProductImage
    ? '。注意：系统会将真实产品图作为参考传给视频模型，prompt 应描述如何从产品画面展开场景'
    : '。注意：没有产品参考图，需详细描述产品外观让视频模型还原'}`}
6. 每条脚本的 hook 要有差异化
7. 如果产品是风险敏感的，需在结尾加风险提示
8. id 格式为 script_1, script_2...
9. 只返回 JSON 数组`;

  const userContent = `产品：${product.product_name}
类别：${product.category}
目标用户：${product.target_user}
核心痛点：${product.core_problem}
核心卖点：${product.core_benefits.join('、')}
差异化优势：${product.differentiators.join('、')}
关键功能：${product.key_features.join('、')}
风险敏感：${product.risk_sensitive ? '是' : '否'}
${product.additional_notes ? `补充信息：${product.additional_notes}` : ''}

语言：${langLabel}
生成数量：${options.count} 条
推荐理由：${recommendation.reason}

请根据「${product.product_name}」的实际性质，自行判断最合适的产品展示方式。
${hasProductImage
    ? `该产品有真实图片，会作为参考图传给视频模型（image-to-video）。
视频模型能看到产品的真实外观，你的 prompt 要与产品图配合——描述从产品画面过渡到主持人场景的过程。`
    : `该产品没有图片，视频模型只能靠文字描述生成产品。请在 prompt 中尽量详细描述产品外观。`}
确保主持人与产品的互动方式自然、合理、符合品类特征。

请生成 ${options.count} 条不同角度的「${recommendation.typeNameZh}」类型脚本。`;

  const scripts = await callGPT<VideoScript[]>({
    systemPrompt,
    userContent,
    maxTokens: 4096,
    temperature: 0.6,
  });

  onProgress?.(`「${recommendation.typeNameZh}」脚本生成完成`);
  return scripts;
}

/** 批量为所有推荐类型生成脚本 */
export async function generateAllScripts(
  product: ProductInfo,
  recommendations: TypeRecommendation[],
  options: {
    language: string;
    countPerType: number;
    videoModel: VideoModel;
  },
  onProgress?: (msg: string) => void
): Promise<VideoScript[]> {
  const allScripts: VideoScript[] = [];

  for (const rec of recommendations) {
    const scripts = await generateScriptsForType(
      product,
      rec,
      { language: options.language, count: options.countPerType, videoModel: options.videoModel },
      onProgress
    );
    allScripts.push(...scripts);
  }

  onProgress?.(`全部脚本生成完成，共 ${allScripts.length} 条`);
  return allScripts;
}
