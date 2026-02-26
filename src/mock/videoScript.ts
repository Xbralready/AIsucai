import type { VideoScript } from '../services/cloneScriptGeneration';

/**
 * Mock VideoScript - 奇富借条 西班牙语版本
 * 用于无 API Key 时的演示
 */
export const mockVideoScript: VideoScript = {
  title: 'Qifu Jietiao - Préstamo inteligente, rápido y seguro',
  total_duration: 32,
  character: {
    description: 'A 28-year-old Latin American woman with long dark brown wavy hair, warm olive skin, brown eyes, natural makeup with soft pink lips, wearing a light cream knit sweater and gold hoop earrings, sitting in a modern bright coffee shop.',
    name: 'Sofía',
    age: '28',
    gender: 'female',
    appearance: 'Long dark brown wavy hair, warm olive skin, brown eyes, natural makeup',
    clothing: 'Light cream knit sweater, gold hoop earrings',
  },
  style: {
    visual_tone: 'Warm, trustworthy, modern, approachable',
    color_palette: ['#F5E6D3', '#1A3C6E', '#E8443A', '#FFFFFF'],
    camera_style: 'Intimate, steady, conversational close-ups',
  },
  scenes: [
    {
      scene_id: 'scene_1',
      segment_type: 'hook',
      duration: 4,
      time_range: { start: 0, end: 4 },
      sora_prompt: `A 28-year-old Latin American woman with long dark brown wavy hair, warm olive skin, brown eyes, natural makeup with soft pink lips, wearing a light cream knit sweater and gold hoop earrings, sitting in a modern bright coffee shop.

She is sitting at a wooden table near a large window with natural sunlight streaming in. A white coffee cup and her phone are on the table. She looks stressed, staring at her phone screen.

Cinematography:
Camera shot: Medium close-up, eye level
Mood: Relatable, anxious, urgent

Actions:
- She sighs, puts the phone face-down on the table, looks up at the camera with a worried but questioning expression, as if asking the viewer directly

Lighting: Warm natural window light from the left, soft diffused shadows
Color palette: cream, warm whites, soft wood tones`,
      visual: {
        setting: 'Cafetería moderna con luz natural, mesa de madera junto a ventana grande',
        subject: 'Mujer joven estresada mirando su teléfono',
        action: 'Suspira, deja el teléfono y mira a cámara con expresión preocupada',
        camera_movement: 'Plano medio corto, nivel de ojos, estático',
        lighting: 'Luz natural cálida de ventana lateral, sombras suaves',
      },
      copy: {
        voiceover: '¿La renta se vence mañana y todavía no juntas el dinero? Tranquila, a mí me pasó igual.',
        subtitle: '¿La renta se vence y no tienes el dinero?',
        text_overlay: '',
      },
      transition: { type: 'cut', duration: 0.3 },
    },
    {
      scene_id: 'scene_2',
      segment_type: 'explain',
      duration: 8,
      time_range: { start: 4, end: 12 },
      sora_prompt: `A 28-year-old Latin American woman with long dark brown wavy hair, warm olive skin, brown eyes, natural makeup with soft pink lips, wearing a light cream knit sweater and gold hoop earrings, sitting in a modern bright coffee shop.

Same coffee shop setting. Her expression transforms from worried to relieved and confident. She picks up her phone and holds it up.

Cinematography:
Camera shot: Medium shot, slight low angle to convey confidence
Mood: Bright, enthusiastic, trustworthy

Actions:
- She smiles warmly, picks up her phone and shows the screen toward the camera
- She taps the screen a few times with her finger, demonstrating ease of use
- She holds up three fingers, emphasizing "3 minutes"
- She nods with a relieved expression, gesturing "it was that easy"

Lighting: Warm natural window light, golden hour quality
Color palette: cream, warm whites, soft blues, gold accents`,
      visual: {
        setting: 'Misma cafetería, ambiente cálido y luminoso',
        subject: 'Mujer sonriente sosteniendo su teléfono móvil con confianza',
        action: 'Muestra el teléfono, toca la pantalla, levanta 3 dedos, asiente aliviada',
        camera_movement: 'Plano medio, ligero contrapicado, zoom lento hacia adelante',
        lighting: 'Luz natural cálida, calidad hora dorada',
      },
      copy: {
        voiceover: 'Descubrí Qifu Jietiao. En solo 3 minutos llené la solicitud desde mi cel, sin papeles, sin filas. Y lo mejor: los intereses son súper transparentes, desde 7.2% anual. ¡Más de 250 millones de personas ya la usan!',
        subtitle: '3 min solicitud · Desde 7.2% anual · 250M+ usuarios',
        text_overlay: '⚡ 3 min → Solicitud | 💰 Desde 7.2% anual',
      },
      transition: { type: 'dissolve', duration: 0.5 },
    },
    {
      scene_id: 'scene_3',
      segment_type: 'proof',
      duration: 8,
      time_range: { start: 12, end: 20 },
      sora_prompt: `A 28-year-old Latin American woman with long dark brown wavy hair, warm olive skin, brown eyes, natural makeup with soft pink lips, wearing a light cream knit sweater and gold hoop earrings, sitting in a modern bright coffee shop.

She demonstrates the app process step by step, holding her phone at chest level.

Cinematography:
Camera shot: Close-up on hands and phone, then pull back to medium shot of face
Mood: Clear, demonstrative, reassuring

Actions:
- She holds the phone at chest level and slowly scrolls through the screen
- She taps a few times, mimicking filling out a simple form
- She brings the phone close to her face and smiles (facial recognition gesture)
- She looks back at camera with a big smile and gives a thumbs up

Lighting: Warm natural window light, screen glow on face
Color palette: cream, whites, soft blue from screen glow`,
      visual: {
        setting: 'Misma cafetería, enfoque en las manos y el teléfono',
        subject: 'Manos de la mujer interactuando con la app Qifu Jietiao',
        action: 'Desplaza pantalla, llena formulario rápido, reconocimiento facial, pulgar arriba',
        camera_movement: 'Primer plano de manos → regreso a plano medio del rostro',
        lighting: 'Luz natural cálida con brillo de pantalla en el rostro',
      },
      copy: {
        voiceover: 'Mira qué fácil: abres la app, llenas unos datos básicos, te tomas una selfie para verificarte... ¡y listo! Sin garantías, sin papeleo, todo desde tu celular con inteligencia artificial.',
        subtitle: 'Datos básicos → Selfie → ¡Aprobado!',
        text_overlay: '✓ Sin garantías  ✓ Sin papeleo  ✓ 100% digital',
      },
      transition: { type: 'dissolve', duration: 0.5 },
    },
    {
      scene_id: 'scene_4',
      segment_type: 'trust',
      duration: 8,
      time_range: { start: 20, end: 28 },
      sora_prompt: `A 28-year-old Latin American woman with long dark brown wavy hair, warm olive skin, brown eyes, natural makeup with soft pink lips, wearing a light cream knit sweater and gold hoop earrings, sitting in a modern bright coffee shop.

She puts down the phone and speaks directly to camera with a sincere, reassuring expression.

Cinematography:
Camera shot: Close-up, eye level, intimate framing
Mood: Sincere, calm, trustworthy

Actions:
- She puts the phone down gently on the table
- She leans slightly forward, speaking directly to camera with genuine warmth
- She waves her hand dismissively (dismissing the worry), then nods reassuringly
- She places her hand on her chest briefly, showing sincerity and personal endorsement

Lighting: Soft warm natural light, creating an intimate atmosphere
Color palette: cream, warm earth tones, soft shadows`,
      visual: {
        setting: 'Misma cafetería, ambiente íntimo y cercano',
        subject: 'Rostro de la mujer en primer plano, expresión sincera y tranquilizadora',
        action: 'Deja el teléfono, habla directo a cámara, descarta preocupación con gesto, asiente',
        camera_movement: 'Primer plano, nivel de ojos, encuadre íntimo',
        lighting: 'Luz natural suave y cálida, atmósfera íntima',
      },
      copy: {
        voiceover: 'Y tranquilo: consultar tu límite no afecta tu historial crediticio. Además, es una institución financiera autorizada respaldada por Qifu Technology, que cotiza en la bolsa de Nueva York. Tu dinero está seguro.',
        subtitle: 'No afecta tu historial · Institución autorizada · NYSE: QFIN',
        text_overlay: '🔒 Consulta sin riesgo · Institución regulada',
      },
      transition: { type: 'dissolve', duration: 0.5 },
    },
    {
      scene_id: 'scene_5',
      segment_type: 'end_card',
      duration: 4,
      time_range: { start: 28, end: 32 },
      sora_prompt: `A clean, modern dark background fading from deep navy blue to black. A sleek logo reading "奇富借条" in white Chinese characters appears centered with a subtle glow animation. Below it in smaller text, "Qifu Jietiao" in Latin letters. A tagline slides in from below.

Cinematography:
Camera shot: Static, centered frame
Mood: Professional, clean, trustworthy

Actions:
- Logo fades in smoothly from center with subtle glow
- Tagline text appears below with a slight upward slide
- Compliance text appears at the bottom in smaller font
- A subtle "250M+ users" badge appears in the corner

Lighting: Subtle gradient lighting, logo has soft white glow
Color palette: deep navy, white, subtle red accent`,
      visual: {
        setting: 'Fondo oscuro degradado de azul marino profundo a negro',
        subject: 'Logo 奇富借条 centrado con brillo sutil, subtítulo Qifu Jietiao',
        action: 'Logo aparece con fade-in, eslogan desliza hacia arriba, texto legal aparece abajo',
        camera_movement: 'Estático, encuadre centrado',
        lighting: 'Iluminación gradiente sutil, logo con brillo blanco suave',
      },
      copy: {
        voiceover: 'Qifu Jietiao. Tu préstamo inteligente en minutos.',
        subtitle: '奇富借条 - Tu préstamo inteligente en minutos',
        text_overlay: '250M+ usuarios · Préstamo responsable. Consulta términos y condiciones.',
      },
      transition: { type: 'fade_to_black', duration: 1.0 },
    },
  ],
  global_audio: {
    bgm_style: 'Modern lo-fi beats, warm and optimistic, building confidence',
    bgm_tempo: 'medium',
    voice_style: 'Conversational, warm female voice, Latin American Spanish accent, friendly and natural, with genuine emotion',
  },
};
