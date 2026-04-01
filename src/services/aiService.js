import { GoogleGenAI } from '@google/genai';
import { SURKHANDARYA_POSTS } from '../data/posts';

const API_KEY = import.meta.env.VITE_GEMINI_API_KEY;
const MODEL_NAME = 'gemini-2.5-flash';

const DESTINATION_CONTEXT = SURKHANDARYA_POSTS.map((post) => ({
  title: post.title,
  location: post.location,
  type: post.type,
  price: post.price,
  description: post.description,
  amenities: post.amenities,
  bestSeason: post.bestSeason,
  rating: post.rating,
}));

const SYSTEM_PROMPT = `
Siz "Premium Travel AI" nomli premium sayohat yordamchisiz.
Siz foydalanuvchilarga Surxondaryo va O'zbekiston bo'ylab sayohat, mehmonxona, dam olish, marshrut va tavsiyalar bo'yicha yordam berasiz.

Platformadagi real joylar bazasi:
${JSON.stringify(DESTINATION_CONTEXT, null, 2)}

Qoidalar:
1. Doimo o'zbek tilida, xushmuomala va aniq uslubda javob bering.
2. Iloji bo'lsa, javoblarni yuqoridagi real ma'lumotlarga tayang.
3. Agar ma'lumot bazada bo'lmasa, buni ochiq ayting va foydali umumiy tavsiya bering.
4. Javoblarni o'qish oson bo'lsin: qisqa abzatslar, punktlar va aniq tavsiyalar ishlating.
5. Sayohat, narx va mavsum haqidagi savollarda amaliy tavsiya bering.
`;

let aiClient;

const getClient = () => {
  if (!API_KEY) {
    return null;
  }

  if (!aiClient) {
    aiClient = new GoogleGenAI({ apiKey: API_KEY });
  }

  return aiClient;
};

const normalizeHistory = (history) =>
  history
    .filter((message) => message?.text?.trim())
    .slice(-8)
    .map((message) => ({
      role: message.role === 'user' ? 'user' : 'model',
      parts: [{ text: message.text.trim() }],
    }));

const getFriendlyErrorMessage = (error) => {
  const message = error instanceof Error ? error.message : String(error);

  if (/api key/i.test(message) || /permission denied/i.test(message)) {
    return "Gemini API kaliti noto'g'ri yoki ruxsat berilmagan. `.env` ichidagi `VITE_GEMINI_API_KEY` ni tekshiring.";
  }

  if (/quota|rate|429/i.test(message)) {
    return "Gemini limiti vaqtincha tugagan ko'rinadi. Birozdan keyin qayta urinib ko'ring.";
  }

  return "AI xizmatiga ulanishda muammo yuz berdi. Internet va API sozlamalarini tekshirib, qayta urinib ko'ring.";
};

export const hasGeminiApiKey = Boolean(API_KEY);

export const getAIResponse = async (userMessage, history = []) => {
  const trimmedMessage = userMessage?.trim();

  if (!trimmedMessage) {
    return "Savol matni bo'sh bo'lmasligi kerak.";
  }

  const client = getClient();

  if (!client) {
    return "`.env` faylida `VITE_GEMINI_API_KEY` topilmadi. Kalitni qo'shib, Vite serverini qayta ishga tushiring.";
  }

  try {
    const response = await client.models.generateContent({
      model: MODEL_NAME,
      contents: [
        ...normalizeHistory(history),
        {
          role: 'user',
          parts: [{ text: trimmedMessage }],
        },
      ],
      config: {
        systemInstruction: SYSTEM_PROMPT,
      },
    });

    const text = response.text?.trim();

    if (!text) {
      return "Gemini hozircha aniq javob qaytarmadi. Savolni biroz boshqacharoq yozib qayta yuboring.";
    }

    return text;
  } catch (error) {
    console.error('Gemini AI Service Error:', error);
    return getFriendlyErrorMessage(error);
  }
};
