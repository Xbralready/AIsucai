/**
 * Sora Prompt 编译器
 *
 * 核心理念：Sora 是"连续世界生成器"，不是"镜头生成器"
 *
 * 编译规则：
 * 1. 第一段：完整世界定义（人物、场景、服装、灯光）+ 动作
 * 2. Remix 段：不重复世界定义，只用 "Continue seamlessly..." + 新动作
 * 3. 分镜是给人看的，喂给 Sora 的是"编译后的连续 Prompt"
 */

import type { VideoScript, SceneScript } from './cloneScriptGeneration';

/**
 * 编译后的连续世界 Prompt
 */
export interface CompiledWorldPrompt {
  // 是否是 Remix 续接段（非首段）
  isRemix: boolean;

  // 世界定义（只有首段需要完整定义）
  world: {
    character: string;      // 人物完整描述
    setting: string;        // 场景环境
    lighting: string;       // 灯光
    colorPalette: string;   // 色调
    mood: string;           // 氛围
  };

  // 时间线事件（按顺序发生的事情）
  timeline: Array<{
    timeMarker: string;     // "At the beginning" / "Then" / "After that" / "Finally"
    action: string;         // 发生了什么
    duration: number;       // 这段持续多久
  }>;

  // 最终编译的 prompt（首段 vs Remix 格式不同）
  compiledPrompt: string;

  // 建议的视频时长
  suggestedDuration: 4 | 8 | 12;
}

/**
 * 时间标记词
 */
const TIME_MARKERS = [
  'At the beginning,',
  'Then,',
  'After that,',
  'Next,',
  'Finally,',
];

/**
 * 将分镜脚本编译成连续世界 Prompt（单个视频，<=12秒）
 */
export function compileToWorldPrompt(script: VideoScript, isRemix: boolean = false): CompiledWorldPrompt {
  // 1. 提取世界定义（从第一个场景或全局设置）
  const firstScene = script.scenes[0];
  const character = script.character?.description || extractCharacterFromPrompt(firstScene.sora_prompt);

  const world = {
    character: character,
    setting: firstScene.visual.setting,
    lighting: firstScene.visual.lighting,
    colorPalette: script.style.color_palette.join(', '),
    mood: script.style.visual_tone,
  };

  // 2. 提取时间线事件（从每个分镜提取动作，去掉重复的世界描述）
  const timeline = script.scenes.map((scene, index) => ({
    timeMarker: TIME_MARKERS[Math.min(index, TIME_MARKERS.length - 1)],
    action: extractActionFromScene(scene),
    duration: scene.duration,
  }));

  // 3. 计算总时长，决定建议的视频时长
  const totalDuration = timeline.reduce((sum, t) => sum + t.duration, 0);
  let suggestedDuration: 4 | 8 | 12;
  if (totalDuration <= 6) {
    suggestedDuration = 4;
  } else if (totalDuration <= 10) {
    suggestedDuration = 8;
  } else {
    suggestedDuration = 12;
  }

  // 4. 编译成最终 Prompt（首段 vs Remix 格式不同）
  const compiledPrompt = isRemix
    ? buildRemixPrompt(world, timeline)
    : buildFirstSegmentPrompt(world, timeline);

  return {
    isRemix,
    world,
    timeline,
    compiledPrompt,
    suggestedDuration,
  };
}

/**
 * 从 sora_prompt 中提取角色描述
 */
function extractCharacterFromPrompt(prompt: string): string {
  // 通常角色描述在开头，以 "A XX year old" 开始
  const match = prompt.match(/^(A \d+ year old[^.]+\.)/);
  if (match) {
    return match[1];
  }
  // 如果没有匹配，取第一句
  const firstSentence = prompt.split('.')[0];
  return firstSentence + '.';
}

/**
 * 从场景中提取动作描述（去掉角色/场景的重复描述）
 */
function extractActionFromScene(scene: SceneScript): string {
  // 优先使用 visual.action
  if (scene.visual.action && scene.visual.action.length > 10) {
    return scene.visual.action;
  }

  // 从 sora_prompt 中提取 Actions 部分
  const actionsMatch = scene.sora_prompt.match(/Actions?:\s*\n?([\s\S]*?)(?=\n\n|Lighting|Color|Dialogue|$)/i);
  if (actionsMatch) {
    // 清理格式
    return actionsMatch[1]
      .replace(/^-\s*/gm, '')
      .replace(/\n/g, ', ')
      .trim();
  }

  // 使用字幕/旁白作为备选
  return scene.copy.subtitle || scene.copy.voiceover || 'continues the scene';
}

/**
 * 构建第一段的完整 Prompt（包含世界定义）
 */
function buildFirstSegmentPrompt(
  world: CompiledWorldPrompt['world'],
  timeline: CompiledWorldPrompt['timeline']
): string {
  // 完整的世界定义
  const worldDefinition = `${world.character}

Setting: ${world.setting}
Lighting: ${world.lighting}
Color palette: ${world.colorPalette}
Mood: ${world.mood}

Single continuous shot. No scene cuts.`;

  // 时间线部分（描述发生的事情）
  const timelineDescription = timeline
    .map(t => `${t.timeMarker} ${t.action}`)
    .join('\n\n');

  // 组合成最终 prompt
  return `${worldDefinition}

---

${timelineDescription}`;
}

/**
 * 构建 Remix 续接段的 Prompt（不重复世界定义）
 *
 * 关键：用 "Continue seamlessly from the previous clip" 开头
 * 不再重复人物外貌、场景、灯光等定义
 */
function buildRemixPrompt(
  world: CompiledWorldPrompt['world'],
  timeline: CompiledWorldPrompt['timeline']
): string {
  // Remix 开头：强调继续同一视频
  const remixHeader = `Continue seamlessly from the previous clip. Do not change the person, hands, lighting, or camera style.`;

  // 只描述新的动作，不重复世界定义
  const actionDescription = timeline
    .map(t => t.action)
    .join(' ');

  // 如果场景有变化，简要说明（不重复完整定义）
  const settingHint = world.setting !== timeline[0]?.action
    ? `The scene transitions to: ${world.setting}.`
    : '';

  // 组合成 Remix prompt
  return `${remixHeader}

${settingHint}

${actionDescription}

Keep the same visual style and mood throughout. No abrupt changes.`;
}

/**
 * 将多个分镜编译成多个连续世界（如果内容太多无法放入一个视频）
 *
 * 策略：
 * - 如果总时长 <= 12秒，编译成 1 个视频（首段格式）
 * - 如果总时长 > 12秒，按场景边界分割成多个视频
 * - 第一个视频：完整世界定义
 * - 后续视频：Remix 格式（不重复定义，只说 "Continue..."）
 */
export function compileToMultipleWorlds(script: VideoScript): CompiledWorldPrompt[] {
  const totalDuration = script.scenes.reduce((sum, s) => sum + s.duration, 0);

  // 如果总时长 <= 12秒，生成单个视频（首段格式）
  if (totalDuration <= 12) {
    return [compileToWorldPrompt(script, false)];
  }

  // 需要分割成多个视频
  const results: CompiledWorldPrompt[] = [];
  let currentScenes: SceneScript[] = [];
  let currentDuration = 0;
  let segmentIndex = 0;

  // 提取全局世界设定（用于所有段落的 world 属性，但只有首段会在 prompt 中完整输出）
  const globalCharacter = script.character?.description || extractCharacterFromPrompt(script.scenes[0].sora_prompt);

  for (const scene of script.scenes) {
    // 如果加入这个场景会超过 12 秒，先编译当前批次
    if (currentDuration + scene.duration > 12 && currentScenes.length > 0) {
      const partialScript: VideoScript = {
        ...script,
        scenes: currentScenes,
        total_duration: currentDuration,
      };

      // 第一段用完整格式，后续用 Remix 格式
      const isRemix = segmentIndex > 0;
      const compiled = compileToWorldPrompt(partialScript, isRemix);
      compiled.world.character = globalCharacter; // 确保角色一致

      results.push(compiled);

      // 重置
      currentScenes = [];
      currentDuration = 0;
      segmentIndex++;
    }

    currentScenes.push(scene);
    currentDuration += scene.duration;
  }

  // 编译最后一批
  if (currentScenes.length > 0) {
    const partialScript: VideoScript = {
      ...script,
      scenes: currentScenes,
      total_duration: currentDuration,
    };

    const isRemix = segmentIndex > 0;
    const compiled = compileToWorldPrompt(partialScript, isRemix);
    compiled.world.character = globalCharacter;

    results.push(compiled);
  }

  return results;
}

/**
 * 检查编译后的 prompt 是否符合 Sora 的要求
 */
export function validateCompiledPrompt(compiled: CompiledWorldPrompt): {
  valid: boolean;
  issues: string[];
} {
  const issues: string[] = [];

  // 检查角色描述（只对首段检查）
  if (!compiled.isRemix && (!compiled.world.character || compiled.world.character.length < 20)) {
    issues.push('角色描述太短，可能导致人物不一致');
  }

  // 检查是否有镜头术语（不应该有）
  const cameraTerms = ['close-up', 'medium shot', 'wide shot', 'pan', 'zoom', 'rack focus', 'cut to'];
  for (const term of cameraTerms) {
    if (compiled.compiledPrompt.toLowerCase().includes(term)) {
      issues.push(`包含镜头术语 "${term}"，Sora 可能无法正确理解`);
    }
  }

  // 检查 Remix 段是否正确使用 "Continue" 格式
  if (compiled.isRemix && !compiled.compiledPrompt.toLowerCase().includes('continue')) {
    issues.push('Remix 段应该以 "Continue seamlessly" 开头');
  }

  // 检查时长
  if (compiled.suggestedDuration > 12) {
    issues.push('建议时长超过 12 秒，需要分割成多个视频');
  }

  return {
    valid: issues.length === 0,
    issues,
  };
}
