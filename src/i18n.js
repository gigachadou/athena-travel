import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';

const resources = {
  uz: {
    translation: {
      "profile": "Profil",
      "settings": "Sozlamalar",
      "notifications": "Xabarnomalar",
      "security": "Xavfsizlik",
      "dark_mode": "Tungi rejim",
      "language": "Til",
      "logout": "Chiqish",
      "delete_account": "Hisobni o'chirish",
      "edit_profile": "Profilni tahrirlash",
      "save": "Saqlash",
      "cancel": "Bekor qilish",
      "name": "Ism",
      "phone": "Telefon",
      "bio": "Men haqimda",
      "nearby_places": "Atrofdagi qiziqarli joylar",
      "historical_info": "Tarixiy Ma'lumot",
      "premium_selection": "Premium Tanlovlar",
      "quality_comfort": "Sifat va qulaylik uyg'unligi",
      "home": "Asosiy",
      "search": "Qidiruv",
      "ai_chat": "AI Chat",
      "map": "Xarita",
      "search_placeholder": "Yo'nalishlarni qidiring...",
      "filters": "Filtrlar",
      "results_found": "natija topildi",
      "no_results": "Hech narsa topilmadi",
      "ai_assistant": "AI Sayohat Yordamchisi",
      "ask_about_uzb": "O'zbekiston haqida so'rang...",
      "map_navigation": "Yo'llar va Navigatsiya",
      "map_instruction": "Xaritaga bosing va yo'l chizing",
      "all": "Hammasi",
      "landmarks": "Joylar",
      "museums": "Muzeylar",
      "parks": "Parklar",
      "hotels": "Hotellar",
      "restaurants": "Oshxonalar",
      "book_now": "Band qilish",
      "welcome_back": "Xush kelibsiz",
      "featured": "Tanlangan",
      "view_all": "Hammasi",
      "history": "Tarixi",
      "location": "Manzil",
      "price": "Narxi",
      "per_day": "sutka",
      "loading": "Yuklanmoqda",
      "scanner_text": "Skanerlang va band qiling"
    }
  },
  en: {
    translation: {
      "profile": "Profile",
      "settings": "Settings",
      "notifications": "Notifications",
      "security": "Security",
      "dark_mode": "Dark Mode",
      "language": "Language",
      "logout": "Logout",
      "delete_account": "Delete Account",
      "edit_profile": "Edit Profile",
      "save": "Save",
      "cancel": "Cancel",
      "name": "Name",
      "phone": "Phone",
      "bio": "Bio",
      "nearby_places": "Nearby Interesting Places",
      "historical_info": "Historical Information",
      "premium_selection": "Premium Selection",
      "quality_comfort": "Harmony of quality and comfort",
      "home": "Home",
      "search": "Search",
      "ai_chat": "AI Chat",
      "map": "Map",
      "search_placeholder": "Search destinations...",
      "filters": "Filters",
      "results_found": "results found",
      "no_results": "No results found",
      "ai_assistant": "AI Travel Assistant",
      "ask_about_uzb": "Ask about Uzbekistan...",
      "map_navigation": "Routes and Navigation",
      "map_instruction": "Click on map to draw route",
      "all": "All",
      "landmarks": "Landmarks",
      "museums": "Museums",
      "parks": "Parks",
      "hotels": "Hotels",
      "restaurants": "Restaurants",
      "book_now": "Book Now",
      "welcome_back": "Welcome back",
      "featured": "Featured",
      "view_all": "View All",
      "history": "History",
      "location": "Location",
      "price": "Price",
      "per_day": "per day",
      "loading": "Loading",
      "destination": "Destination",
      "date": "Date",
      "scanner_text": "Scan and Book Now"
    }
  }
};

i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources,
    fallbackLng: 'uz',
    interpolation: {
      escapeValue: false
    }
  });

export default i18n;
