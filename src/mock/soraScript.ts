import type { SoraScriptOutput } from '../types/soraScript';

export const mockSoraScript: SoraScriptOutput = {
  script_type: 'sora2',

  segments: [
    {
      segment_id: 'seg_1',
      slot: 'hook',
      visual_description: '年轻女性坐在咖啡厅窗边，自然光照亮面部，表情略带困惑',
      action_description: '女性抬头看向镜头，微微歪头，做出疑问的表情',
      spoken_or_text: '¿Tú también crees que pedir un préstamo es muy complicado?',
      duration_hint: '2-3s'
    },
    {
      segment_id: 'seg_2',
      slot: 'explain',
      visual_description: '同一场景，女性面带微笑，姿态放松，手中拿着手机',
      action_description: '女性微笑着举起手机，用手指轻轻点击屏幕，然后看向镜头',
      spoken_or_text: 'Yo usé QuickLoan. En 3 minutos terminé la solicitud, y en una hora ya tenía el dinero.',
      duration_hint: '5-6s'
    },
    {
      segment_id: 'seg_3',
      slot: 'proof',
      visual_description: '同一场景，手机屏幕对着镜头（不显示真实界面，只有模糊光影）',
      action_description: '女性手指在手机屏幕上缓慢滑动，做出填写和确认的手势',
      spoken_or_text: 'Solo contestas unas preguntas, verificación facial, y listo.',
      duration_hint: '4-5s'
    },
    {
      segment_id: 'seg_4',
      slot: 'trust',
      visual_description: '同一场景，女性放下手机，双手自然放在桌上，表情真诚',
      action_description: '女性轻轻摇头，然后点头，表情从否定转为肯定',
      spoken_or_text: 'No afecta tu historial crediticio. Tranquilo.',
      duration_hint: '2-3s'
    },
    {
      segment_id: 'seg_5',
      slot: 'end_card',
      visual_description: '纯色背景（深灰或黑色），中央显示 QuickLoan Logo',
      action_description: '静态画面，无动作',
      spoken_or_text: 'QuickLoan - Tu préstamo en minutos. Préstamo responsable.',
      duration_hint: '3-4s'
    }
  ],

  global_constraints: {
    max_characters: 1,
    max_scenes: 1,
    camera_motion: 'static_or_slow'
  },

  sora_generation_hints: {
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
  }
};
