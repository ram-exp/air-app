// Central registry of every AI provider the Assistant can talk to.
//
// `kind: 'gemini'` uses Google's native generateContent REST shape (see gemini.js).
// `kind: 'openai-compat'` uses the OpenAI-compatible /chat/completions shape that
// Groq, OpenRouter, Cerebras, and Together AI all implement (see openaiCompat.js) —
// only the baseURL, key, and model differ between them.
//
// Each provider's API key + model + enabled flag lives in useAssistantStore,
// keyed by provider id. Nothing here is secret; this is just static metadata.

export const PROVIDERS = {
  gemini: {
    id: 'gemini',
    label: 'Gemini',
    tagline: 'Google AI Studio',
    kind: 'gemini',
    defaultModel: 'gemini-3.6-flash',
    models: [
      'gemini-3.6-flash',
      'gemini-3.1-pro-preview',
      'gemini-3.5-flash-lite',
      'gemini-2.5-flash',
      'gemini-2.5-pro',
    ],
    keyUrl: 'https://aistudio.google.com/apikey',
    keyPlaceholder: 'AIza...',
    docsUrl: 'https://ai.google.dev/gemini-api/docs/models',
    supportsVision: true,
    supportsDocs: true, // native PDF/text inlineData support
    blurb: 'Sangat bagus untuk chat, coding, analisis dokumen, dan multimodal (gambar & PDF langsung).',
  },
  groq: {
    id: 'groq',
    label: 'Groq',
    tagline: 'LPU — super cepat',
    kind: 'openai-compat',
    baseURL: 'https://api.groq.com/openai/v1',
    defaultModel: 'llama-3.3-70b-versatile',
    models: [
      'llama-3.3-70b-versatile',
      'llama-3.1-8b-instant',
      'meta-llama/llama-4-scout-17b-16e-instruct',
      'meta-llama/llama-4-maverick-17b-128e-instruct',
      'qwen/qwen3-32b',
      'moonshotai/kimi-k2-instruct',
    ],
    keyUrl: 'https://console.groq.com/keys',
    keyPlaceholder: 'gsk_...',
    docsUrl: 'https://console.groq.com/docs/models',
    supportsVision: true, // only on llama-4 scout/maverick models
    supportsDocs: false,
    blurb: 'Inference tercepat di kelasnya — cocok buat chatbot yang butuh respons instan.',
  },
  openrouter: {
    id: 'openrouter',
    label: 'OpenRouter',
    tagline: 'Satu API, banyak model',
    kind: 'openai-compat',
    baseURL: 'https://openrouter.ai/api/v1',
    defaultModel: 'meta-llama/llama-3.3-70b-instruct:free',
    models: [
      'meta-llama/llama-3.3-70b-instruct:free',
      'deepseek/deepseek-chat-v3.1:free',
      'qwen/qwen3-235b-a22b:free',
      'mistralai/mistral-small-3.2-24b-instruct:free',
      'google/gemini-2.0-flash-exp:free',
    ],
    keyUrl: 'https://openrouter.ai/keys',
    keyPlaceholder: 'sk-or-...',
    docsUrl: 'https://openrouter.ai/models',
    supportsVision: true,
    supportsDocs: false,
    blurb: 'Gerbang ke banyak model (Qwen, DeepSeek, Llama, Mistral, dll) lewat satu API key.',
  },
  cerebras: {
    id: 'cerebras',
    label: 'Cerebras',
    tagline: 'Wafer-scale inference',
    kind: 'openai-compat',
    baseURL: 'https://api.cerebras.ai/v1',
    defaultModel: 'llama-3.3-70b',
    models: ['llama-3.3-70b', 'llama-4-scout-17b-16e-instruct', 'qwen-3-32b', 'gpt-oss-120b'],
    keyUrl: 'https://cloud.cerebras.ai',
    keyPlaceholder: 'csk-...',
    docsUrl: 'https://inference-docs.cerebras.ai/models',
    supportsVision: false,
    supportsDocs: false,
    blurb: 'Inference sangat cepat, bagus untuk coding dan chat berbasis teks.',
  },
  together: {
    id: 'together',
    label: 'Together AI',
    tagline: 'Model open-source',
    kind: 'openai-compat',
    baseURL: 'https://api.together.xyz/v1',
    defaultModel: 'meta-llama/Llama-3.3-70B-Instruct-Turbo-Free',
    models: [
      'meta-llama/Llama-3.3-70B-Instruct-Turbo-Free',
      'meta-llama/Llama-Vision-Free',
      'deepseek-ai/DeepSeek-V3',
      'Qwen/Qwen2.5-72B-Instruct-Turbo',
    ],
    keyUrl: 'https://api.together.ai/settings/api-keys',
    keyPlaceholder: 'tgp_v1_...',
    docsUrl: 'https://docs.together.ai/docs/serverless-models',
    supportsVision: true, // only on *Vision* models
    supportsDocs: false,
    blurb: 'Banyak model open-source berkualitas dengan free tier yang lumayan luas.',
  },
  mistral: {
    id: 'mistral',
    label: 'Mistral AI',
    tagline: '1 miliar token/bulan gratis',
    kind: 'openai-compat',
    baseURL: 'https://api.mistral.ai/v1',
    defaultModel: 'mistral-small-latest',
    models: ['mistral-small-latest', 'mistral-large-latest', 'pixtral-large-latest', 'open-mistral-nemo', 'codestral-latest'],
    keyUrl: 'https://console.mistral.ai/api-keys',
    keyPlaceholder: 'API key dari console.mistral.ai',
    docsUrl: 'https://docs.mistral.ai/getting-started/models/',
    supportsVision: true, // pixtral models
    supportsDocs: false,
    blurb: 'Free tier paling luas: 1 miliar token/bulan untuk semua model, termasuk yang paling besar.',
  },
  nvidia: {
    id: 'nvidia',
    label: 'NVIDIA NIM',
    tagline: '100+ model gratis',
    kind: 'openai-compat',
    baseURL: 'https://integrate.api.nvidia.com/v1',
    defaultModel: 'meta/llama-3.3-70b-instruct',
    models: [
      'meta/llama-3.3-70b-instruct',
      'meta/llama-3.1-405b-instruct',
      'mistralai/mixtral-8x22b-instruct-v0.1',
      'qwen/qwen2.5-72b-instruct',
      'deepseek-ai/deepseek-r1',
    ],
    keyUrl: 'https://build.nvidia.com',
    keyPlaceholder: 'nvapi-...',
    docsUrl: 'https://build.nvidia.com/models',
    supportsVision: false,
    supportsDocs: false,
    blurb: 'Katalog model gratis paling banyak — termasuk Llama 405B, akses lewat infrastruktur NVIDIA.',
  },
  sambanova: {
    id: 'sambanova',
    label: 'SambaNova',
    tagline: 'RDU — cepat & model besar',
    kind: 'openai-compat',
    baseURL: 'https://api.sambanova.ai/v1',
    defaultModel: 'Meta-Llama-3.3-70B-Instruct',
    models: ['Meta-Llama-3.3-70B-Instruct', 'Meta-Llama-3.1-405B-Instruct', 'DeepSeek-V3', 'Qwen2.5-72B-Instruct'],
    keyUrl: 'https://cloud.sambanova.ai/apis',
    keyPlaceholder: 'API key dari cloud.sambanova.ai',
    docsUrl: 'https://docs.sambanova.ai/cloud/docs/get-started/supported-models',
    supportsVision: false,
    supportsDocs: false,
    blurb: 'Salah satu dari sedikit tempat gratis buat akses Llama 3.1 405B, inference cepat.',
  },
  huggingface: {
    id: 'huggingface',
    label: 'Hugging Face',
    tagline: 'Router ke ratusan model',
    kind: 'openai-compat',
    baseURL: 'https://router.huggingface.co/v1',
    defaultModel: 'deepseek-ai/DeepSeek-V3',
    models: ['deepseek-ai/DeepSeek-V3', 'Qwen/Qwen2.5-72B-Instruct', 'meta-llama/Llama-3.3-70B-Instruct', 'mistralai/Mistral-Small-24B-Instruct-2501'],
    keyUrl: 'https://huggingface.co/settings/tokens',
    keyPlaceholder: 'hf_...',
    docsUrl: 'https://huggingface.co/docs/inference-providers',
    supportsVision: true,
    supportsDocs: false,
    blurb: 'Satu key, otomatis roting ke backend tercepat yang lagi nge-host model open-source pilihan kamu.',
  },
  githubModels: {
    id: 'githubModels',
    label: 'GitHub Models',
    tagline: 'Gratis pakai akun GitHub',
    kind: 'openai-compat',
    baseURL: 'https://models.inference.ai.azure.com',
    defaultModel: 'gpt-4o-mini',
    models: ['gpt-4o-mini', 'gpt-4o', 'Meta-Llama-3.1-405B-Instruct', 'Phi-3.5-MoE-instruct'],
    keyUrl: 'https://github.com/settings/tokens',
    keyPlaceholder: 'github_pat_... (Personal Access Token, tanpa scope khusus)',
    docsUrl: 'https://docs.github.com/en/github-models',
    supportsVision: true,
    supportsDocs: false,
    blurb: 'Akses model termasuk GPT-4o cukup pakai Personal Access Token GitHub — nggak perlu daftar baru.',
  },
  siliconflow: {
    id: 'siliconflow',
    label: 'SiliconFlow',
    tagline: 'DeepSeek & Qwen',
    kind: 'openai-compat',
    baseURL: 'https://api.siliconflow.cn/v1',
    defaultModel: 'deepseek-ai/DeepSeek-V3',
    models: ['deepseek-ai/DeepSeek-V3', 'Qwen/Qwen2.5-72B-Instruct', 'meta-llama/Llama-3.3-70B-Instruct'],
    keyUrl: 'https://cloud.siliconflow.cn/account/ak',
    keyPlaceholder: 'sk-...',
    docsUrl: 'https://docs.siliconflow.cn/en/userguide/introduction',
    supportsVision: false,
    supportsDocs: false,
    blurb: 'Free tier lumayan besar buat model DeepSeek dan Qwen terbaru.',
  },
}

export const PROVIDER_LIST = Object.values(PROVIDERS)
export const PROVIDER_IDS = Object.keys(PROVIDERS)

export function defaultProviderState() {
  const out = {}
  for (const p of PROVIDER_LIST) {
    out[p.id] = { apiKey: '', model: p.defaultModel, enabled: false }
  }
  return out
}

// Turns a user-defined custom provider record (id/label/baseURL/defaultModel
// /supportsVision, saved in useAssistantStore) into the same config shape as
// the built-in entries above, so the rest of the app (askOpenAICompat, the
// Settings UI, the provider dropdown) can't tell the difference. Any server
// that speaks the OpenAI-compatible /chat/completions shape works here —
// self-hosted Ollama/vLLM/LM Studio, a personal proxy, or any provider that
// isn't in the built-in list yet.
export function buildCustomProviderConfig(custom) {
  return {
    id: custom.id,
    label: custom.label || 'Custom',
    tagline: 'Custom endpoint',
    kind: 'openai-compat',
    baseURL: custom.baseURL,
    defaultModel: custom.defaultModel || '',
    models: custom.defaultModel ? [custom.defaultModel] : [],
    keyUrl: '',
    keyPlaceholder: 'API key (kosongkan kalau server-nya tidak butuh auth)',
    docsUrl: '',
    supportsVision: !!custom.supportsVision,
    supportsDocs: false,
    blurb: custom.baseURL || 'Endpoint OpenAI-compatible kustom.',
    isCustom: true,
  }
}
