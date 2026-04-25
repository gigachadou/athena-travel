import OpenAI from 'openai';
import { fetchPlacesForAI, formatPrice } from './databaseService';
import { isSupabaseConfigured } from '../lib/supabase';

const API_KEY = import.meta.env.VITE_GROQ_API_KEY;
const MODEL_NAME = import.meta.env.VITE_GROQ_MODEL || 'llama-3.3-70b-versatile';
const BASE_URL = 'https://api.groq.com/openai/v1';

const FALLBACK_DESTINATION_CONTEXT = [];
let aiClient = null;

const CONTEXT_CACHE_TTL = 60_000;
let aiContextCache = {
  locale: null,
  fetchedAt: 0,
  value: null,
};

const getClient = () => {
  if (!API_KEY) {
    return null;
  }

  if (!aiClient) {
    aiClient = new OpenAI({
      apiKey: API_KEY,
      baseURL: BASE_URL,
      dangerouslyAllowBrowser: true,
    });
  }

  return aiClient;
};

const normalizeHistory = (history) =>
  history
    .filter((message) => message?.text?.trim())
    .slice(-8)
    .map((message) => ({
      role: message.role === 'user' ? 'user' : 'assistant',
      content: message.text.trim(),
    }));

const getFriendlyErrorMessage = (error) => {
  const message = error instanceof Error ? error.message : String(error);
  const status = error?.status;

  if (status === 401 || /api key|unauthorized|authentication|permission denied/i.test(message)) {
    return "Groq API kaliti noto'g'ri yoki ruxsat berilmagan. `.env` ichidagi `VITE_GROQ_API_KEY` ni tekshiring.";
  }

  if (status === 429 || /quota|rate|429/i.test(message)) {
    return "Groq limiti vaqtincha tugagan ko'rinadi. Birozdan keyin qayta urinib ko'ring.";
  }

  return "AI xizmatiga ulanishda muammo yuz berdi. Internet va API sozlamalarini tekshirib, qayta urinib ko'ring.";
};

export const hasGroqApiKey = Boolean(API_KEY);

const mapPlaceForPrompt = (place) => ({
  title: place.title,
  location: place.location,
  type: place.type,
  price: place.price || formatPrice(place.priceValue),
  pricePerPerson: place.pricePerPerson || null,
  description: place.aiSummary || place.description || '',
  amenities: place.amenities || [],
  bestSeason: place.bestSeason || '',
  duration: place.duration || '',
  difficulty: place.difficulty || '',
  airportDist: place.airportDist || '',
  metroDist: place.metroDist || '',
  busDist: place.busDist || '',
  rating: place.rating,
  ratingCount: place.ratingCount,
})

const getFallbackContext = () => FALLBACK_DESTINATION_CONTEXT

const getDatabaseContext = async (locale = 'uz') => {
  if (!isSupabaseConfigured) {
    return null
  }

  const normalizedLocale = locale === 'uz' ? 'uz' : 'en'
  const now = Date.now()

  if (
    aiContextCache.value &&
    aiContextCache.locale === normalizedLocale &&
    now - aiContextCache.fetchedAt < CONTEXT_CACHE_TTL
  ) {
    return aiContextCache.value
  }

  const places = await fetchPlacesForAI(normalizedLocale)
  const promptContext = places.map(mapPlaceForPrompt)

  aiContextCache = {
    locale: normalizedLocale,
    fetchedAt: now,
    value: promptContext,
  }

  return promptContext
}

const getDestinationContext = async (locale = 'uz') => {
  try {
    const databaseContext = await getDatabaseContext(locale)
    if (databaseContext?.length) {
      return databaseContext
    }
  } catch (error) {
    console.error('Failed to load AI context from database:', error)
  }

  return getFallbackContext()
}

const UZBEK_LANGUAGE_HINTS = [
  "o'z",
  "g'",
  "sh",
  "ch",
  "yaqin",
  "qayer",
  "qaysi",
  "uchun",
  "bilan",
  "bo'yicha",
  "iltimos",
  "mehmonxona",
  "sayohat",
  "tavsiya",
  "kerak",
  "mumkin",
]

const ENGLISH_LANGUAGE_HINTS = [
  'the',
  'and',
  'for',
  'with',
  'near',
  'best',
  'hotel',
  'travel',
  'plan',
  'recommend',
  'where',
  'what',
  'please',
]

const detectPreferredResponseLanguage = (message, locale = 'uz') => {
  const normalizedMessage = message?.trim().toLowerCase()

  if (!normalizedMessage) {
    return locale === 'en' ? 'english' : "o'zbek"
  }

  const uzbekScore = UZBEK_LANGUAGE_HINTS.reduce(
    (score, hint) => score + (normalizedMessage.includes(hint) ? 1 : 0),
    0,
  )
  const englishScore = ENGLISH_LANGUAGE_HINTS.reduce(
    (score, hint) => score + (normalizedMessage.includes(hint) ? 1 : 0),
    0,
  )

  if (uzbekScore > englishScore) {
    return "o'zbek"
  }

  if (englishScore > uzbekScore) {
    return 'english'
  }

  return locale === 'en' ? 'english' : "o'zbek"
}

const buildSystemPrompt = (destinationContext, responseLanguage = "o'zbek") => {

  return `
Siz "Premium Travel AI" nomli premium sayohat yordamchisiz.
Siz foydalanuvchilarga Surxondaryo va O'zbekiston bo'ylab sayohat, mehmonxona, dam olish, marshrut va tavsiyalar bo'yicha yordam berasiz.

Platformadagi real joylar bazasi:
${JSON.stringify(destinationContext, null, 2)}

Qoidalar:
1. Oxirgi foydalanuvchi xabari qaysi tilda yozilgan bo'lsa, aynan o'sha tilda javob bering. Hozirgi xabar uchun javob tili: ${responseLanguage}.
2. Iloji bo'lsa, javoblarni yuqoridagi real ma'lumotlarga tayang.
3. Agar ma'lumot bazada bo'lmasa, buni ochiq ayting va foydali umumiy tavsiya bering.
4. Javoblarni o'qish oson bo'lsin: qisqa abzatslar, punktlar va aniq tavsiyalar ishlating.
5. Sayohat, narx va mavsum haqidagi savollarda amaliy tavsiya bering.
6. Bitta joy haqida so'ralsa, shu joyning description/summary maydonlarini ustuvor manba sifatida ishlating.
7. Faqat platformadagi bazada bor faktlarni aniq fakt sifatida ayting. Ishonchingiz komil bo'lmasa, ehtiyotkor ibora ishlating.
`;
}

export const getAIResponse = async (userMessage, history = [], options = {}) => {
  const trimmedMessage = userMessage?.trim();
  const locale = options.locale === 'en' ? 'en' : 'uz'
  const responseLanguage = detectPreferredResponseLanguage(trimmedMessage, locale)

  if (!trimmedMessage) {
    return "Savol matni bo'sh bo'lmasligi kerak.";
  }

  const client = getClient();

  if (!client) {
    return "`.env` faylida `VITE_GROQ_API_KEY` topilmadi. Kalitni qo'shib, Vite serverini qayta ishga tushiring.";
  }

  try {
    const destinationContext = await getDestinationContext(locale)
    const systemPrompt = buildSystemPrompt(destinationContext, responseLanguage)

    const response = await client.chat.completions.create({
      model: MODEL_NAME,
      messages: [
        {
          role: 'system',
          content: systemPrompt,
        },
        ...normalizeHistory(history),
        {
          role: 'user',
          content: trimmedMessage,
        },
      ],
    });

    const text = response.choices?.[0]?.message?.content?.trim();

    if (!text) {
      return "Groq hozircha aniq javob qaytarmadi. Savolni biroz boshqacharoq yozib qayta yuboring.";
    }

    return text;
  } catch (error) {
    console.error('Groq AI Service Error:', error);
    return getFriendlyErrorMessage(error);
  }
};
