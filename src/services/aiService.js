import { fetchPlacesForAI, formatPrice } from './databaseService';
import { isSupabaseConfigured } from '../lib/supabase';

const API_KEY = import.meta.env.VITE_GROQ_API_KEY;
const MODEL = import.meta.env.VITE_GROQ_MODEL || 'llama-3.3-70b-versatile';
const API_URL = 'https://api.groq.com/openai/v1/chat/completions';

export const hasGroqApiKey = Boolean(API_KEY);

// =========================
// 🧠 SMART MEMORY ENGINE
// =========================
const MEMORY_KEY = 'yolchi_ai_pro_memory';

const loadMemory = () => {
  try {
    const saved = localStorage.getItem(MEMORY_KEY);
    return saved ? JSON.parse(saved) : {
      summary: '',
      history: [],
      profile: { budget: 'not specified', interests: [], visitedCities: [], preferredLang: 'uz' },
    };
  } catch {
    return { summary: '', history: [], profile: {} };
  }
};

const saveMemory = (m) => localStorage.setItem(MEMORY_KEY, JSON.stringify(m));
let memory = loadMemory();

// =========================
// 🗺️ GEOGRAPHIC & CONTEXT LOGIC
// =========================
const UZBEKISTAN_CITIES = [
  'toshkent', 'samarqand', 'buxoro', 'xiva', 'termiz', 'nukus', 'namangan', 
  'andijon', 'farg\'ona', 'jizzax', 'guliston', 'navoiy', 'qarshi', 'shaxrisabz'
];

const isTravelRelated = (text = '') => {
  const t = text.toLowerCase();
  const travelTokens = [
    'sayohat', 'travel', 'borish', 'ko\'rish', 'zayer', 'qayerda', 'hotel', 'mehmonxona',
    'ovqat', 'restoran', 'bilet', 'chipta', 'uzbekistan', 'osh', 'tog\'', 'dam olish',
    ...UZBEKISTAN_CITIES
  ];
  return travelTokens.some(token => t.includes(token));
};

// =========================
// 🔍 PROFILE ANALYZER
// =========================
const updateProfile = (text) => {
  const t = text.toLowerCase();
  
  // Byudjetni aniqlash
  if (t.includes('arzon') || t.includes('tejamkor')) memory.profile.budget = 'low';
  if (t.includes('qimmat') || t.includes('lyuks') || t.includes('premium')) memory.profile.budget = 'high';

  // Qiziqishlarni aniqlash
  const interestMap = {
    'tarix': 'historical sites',
    'tabiat': 'nature',
    'ovqat': 'gastronomy',
    'shahar': 'urban exploration',
    'tog': 'mountains'
  };
  
  Object.keys(interestMap).forEach(key => {
    if (t.includes(key) && !memory.profile.interests.includes(interestMap[key])) {
      memory.profile.interests.push(interestMap[key]);
    }
  });

  // Shaharlarni aniqlash
  UZBEKISTAN_CITIES.forEach(city => {
    if (t.includes(city) && !memory.profile.visitedCities.includes(city)) {
      memory.profile.visitedCities.push(city);
    }
  });
};

// =========================
// 🎭 SYSTEM ARCHITECT
// =========================
const getSystemPrompt = (context, lang) => {
  const profile = memory.profile;
  return `
Sizning ismingiz "Yo'lchiAI". Siz O'zbekiston bo'ylab professional sayohat gidi va aqlli yordamchisiz.

Xarakteringiz:
- Bilimli, samimiy va mehmondo'st (xuddi o'zbek mehmondo'stligidek).
- Ma'lumotlarni qisqa, aniq va foydali ko'rinishda berasiz.
- Foydalanuvchi bilan "siz" deb muloqot qilasiz.

Foydalanuvchi haqida ma'lumot (Xotira):
- Byudjeti: ${profile.budget}
- Qiziqishlari: ${profile.interests.join(', ')}
- Avval so'ragan shaharlari: ${profile.visitedCities.join(', ')}

Ma'lumotlar bazasidan olingan real joylar:
${JSON.stringify(context)}

Qoidalar:
1. Faqat O'zbekiston turizmi va sayohat haqida gapiring.
2. Agar savol sayohatga bog'liq bo'lmasa, muloyimlik bilan rad eting.
3. Foydalanuvchi byudjetiga mos tavsiyalar bering.
4. Javobingizda har doim kamida bitta qiziqarli maslahat (lifehack) bo'lsin.
5. Javob tili: ${lang === 'english' ? 'English' : 'O\'zbek tili'}.
`;
};

// =========================
// 🚀 ENGINE CORE
// =========================
export const getAIResponse = async (userMessage, history = [], options = {}) => {
  const text = userMessage?.trim();
  if (!text) return "Kechirasiz, xabar mazmuni bo'sh.";

  // 1. Greeting Check
  const greetings = ['salom', 'hello', 'hi', 'assalom'];
  if (greetings.some(g => text.toLowerCase().startsWith(g)) && text.length < 15) {
    return "Assalomu alaykum! Men Yo'lchiAI - sizning shaxsiy gidingizman. O'zbekistonning qaysi go'shasiga sayohat qilishni istaysiz?";
  }

  // 2. Travel Context Validation
  if (!isTravelRelated(text) && history.length === 0) {
    return "Men faqat O'zbekiston bo'ylab sayohat va turizm masalalarida yordam bera olaman. Iltimos, sayohatga oid savol bering!";
  }

  const lang = options.locale === 'en' ? 'english' : 'o\'zbek';

  try {
    // 3. Data Fetching
    let context = [];
    if (isSupabaseConfigured) {
      context = await fetchPlacesForAI(options.locale || 'uz');
    }

    // 4. Memory Update
    updateProfile(text);

    // 5. AI Call
    const response = await fetch(API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${API_KEY}`,
      },
      body: JSON.stringify({
        model: MODEL,
        temperature: 0.7, // Ijodkorlik va aniqlik balansi
        messages: [
          { role: 'system', content: getSystemPrompt(context, lang) },
          ...history.slice(-10).map(m => ({
            role: m.sender === 'user' ? 'user' : 'assistant',
            content: m.text
          })),
          { role: 'user', content: text }
        ],
      }),
    });

    const data = await response.json();
    const aiAnswer = data?.choices?.[0]?.message?.content;

    if (!aiAnswer) throw new Error("Empty AI response");

    // 6. Finalize Memory
    memory.history.push({ u: text, a: aiAnswer });
    if (memory.history.length > 10) memory.history.shift();
    saveMemory(memory);

    return aiAnswer;

  } catch (error) {
    console.error("Yo'lchiAI Error:", error);
    return "Hozircha bog'lana olmayapman, lekin O'zbekiston yo'llari doim sizga ochiq! Birozdan so'ng urinib ko'ring.";
  }
};