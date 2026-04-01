import { SURKHANDARYA_POSTS } from '../data/posts';

const API_KEY = import.meta.env.VITE_GEMINI_API_KEY;
const BASE_URL = "https://openrouter.ai/api/v1/chat/completions";

const SYSTEM_PROMPT = `
Siz "Premium Travel AI" - Surxondaryo va O'zbekiston bo'ylab sayohat qilish bo'yicha eng aqlli va tajribali yordamchisiz.
Bizning bazamizda quyidagi joylar mavjud:
${JSON.stringify(SURKHANDARYA_POSTS.map(p => ({
    title: p.title,
    location: p.location,
    type: p.type,
    price: p.price,
    description: p.description,
    amenities: p.amenities,
    bestSeason: p.bestSeason,
    rating: p.rating
})), null, 2)}

Qoidalar:
1. Doimo o'zbek tilida premium va xushmuomala tilda gapiring.
2. Tavsiyalaringizni yuqoridagi real ma'lumotlarga asoslang.
3. Javoblarni Markdown formatida (chiroyli) bering.
`;

export const getAIResponse = async (userMessage, history = []) => {
    try {
        const response = await fetch(BASE_URL, {
            method: "POST",
            headers: {
                "Authorization": `Bearer ${API_KEY}`,
                "HTTP-Referer": window.location.origin, // OpenRouter requires this
                "X-Title": "Premium Travel Platform", // OpenRouter requires this
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                "model": "google/gemini-2.0-flash-exp:free", // Using a free and fast model
                "messages": [
                    { "role": "system", "content": SYSTEM_PROMPT },
                    ...history.map(msg => ({
                        "role": msg.role === 'user' ? 'user' : 'assistant',
                        "content": msg.text
                    })),
                    { "role": "user", "content": userMessage }
                ]
            })
        });

        const data = await response.json();
        
        if (data.error) {
            console.error('OpenRouter Error:', data.error);
            return `Xatolik: ${data.error.message || 'Ulanishda muammo'}`;
        }

        return data.choices[0].message.content;
    } catch (error) {
        console.error('AI Service Error:', error);
        return "Tizimda xatolik yuz berdi. Internet aloqasini tekshiring.";
    }
};
