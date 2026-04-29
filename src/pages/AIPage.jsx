import React, { useEffect, useRef, useState } from 'react';
import { AlertCircle, Bot, Loader2, Mic, Send, Sparkles, User, Volume2 } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useLocation } from 'react-router-dom';
import '../styles/AIPage.css';
import { getAIResponse, hasGroqApiKey } from '../services/aiService';

const WELCOME_MESSAGE = {
  id: 1,
  text: "Salom. Men Premium Travel AI yordamchisiman. Surxondaryo va O'zbekiston bo'yicha marshrut, mehmonxona va premium tavsiyalar haqida so'rashingiz mumkin.",
  sender: 'ai',
};

const SUGGESTED_QUESTIONS = [
  "Boysun tomonga 2 kunlik premium sayohat reja tuzib bering.",
  "Termiz yaqinidagi eng qiziqarli tarixiy joylarni tavsiya qiling.",
  "Oilaviy dam olish uchun qulay mehmonxona variantlarini ayting.",
  "Bahor mavsumida Surxondaryoda qayerga borish yaxshi?",
];

const stripMarkdownForSpeech = (text) =>
  text
    .replace(/[*_`#>-]/g, ' ')
    .replace(/\[(.*?)\]\(.*?\)/g, '$1')
    .replace(/\s+/g, ' ')
    .trim();

const AIPage = () => {
  const { t, i18n } = useTranslation();
  const location = useLocation();
  const [messages, setMessages] = useState([WELCOME_MESSAGE]);
  const [input, setInput] = useState('');
  const [isListening, setIsListening] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [voiceSupported, setVoiceSupported] = useState(false);
  const chatEndRef = useRef(null);
  const recognitionRef = useRef(null);
  const synthRef = useRef(null);
  const handledInitialMessageRef = useRef('');

  useEffect(() => {
    synthRef.current = window.speechSynthesis || null;

    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      return;
    }

    setVoiceSupported(true);
    recognitionRef.current = new SpeechRecognition();
    recognitionRef.current.continuous = false;
    recognitionRef.current.interimResults = false;
    recognitionRef.current.lang = 'uz-UZ';

    recognitionRef.current.onresult = (event) => {
      const transcript = event.results?.[0]?.[0]?.transcript?.trim();
      if (!transcript) {
        return;
      }

      setInput(transcript);
      handleSendRequest(transcript, true);
    };

    recognitionRef.current.onend = () => setIsListening(false);
    recognitionRef.current.onerror = () => setIsListening(false);

    return () => {
      recognitionRef.current?.stop();
      synthRef.current?.cancel?.();
    };
  }, []);

  useEffect(() => {
    const nextInitialMessage = location.state?.initialMessage;
    if (!nextInitialMessage || handledInitialMessageRef.current === nextInitialMessage) {
      return;
    }

    handledInitialMessageRef.current = nextInitialMessage;
    handleSendRequest(nextInitialMessage);
  }, [location.state]);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isLoading]);

  const speakText = (text) => {
    if (!synthRef.current || !text) {
      return;
    }

    synthRef.current.cancel();
    const utterance = new SpeechSynthesisUtterance(stripMarkdownForSpeech(text));
    utterance.lang = 'uz-UZ';
    utterance.onstart = () => setIsSpeaking(true);
    utterance.onend = () => setIsSpeaking(false);
    utterance.onerror = () => setIsSpeaking(false);
    synthRef.current.speak(utterance);
  };

  const handleSendRequest = async (rawText, viaVoice = false) => {
    const trimmedText = rawText.trim();
    if (!trimmedText || isLoading) {
      return;
    }

    const userMessage = {
      id: Date.now(),
      text: trimmedText,
      sender: 'user',
    };

    const history = messages.map((message) => ({
      role: message.sender === 'user' ? 'user' : 'assistant',
      text: message.text,
    }));

    setMessages((previous) => [...previous, userMessage]);
    setInput('');
    setIsLoading(true);

    try {
      const responseText = await getAIResponse(trimmedText, history, { locale: i18n.language });
      const aiMessage = {
        id: Date.now() + 1,
        text: responseText,
        sender: 'ai',
      };

      setMessages((previous) => [...previous, aiMessage]);

      if (viaVoice) {
        speakText(responseText);
      }
    } catch (error) {
      console.error('AI Chat Error:', error);
      setMessages((previous) => [
        ...previous,
        {
          id: Date.now() + 1,
          text: "Kechirasiz, hozircha AI xizmatida muammo bor. Birozdan keyin qayta urinib ko'ring.",
          sender: 'ai',
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  const toggleListening = () => {
    if (!recognitionRef.current || isLoading) {
      return;
    }

    if (isListening) {
      recognitionRef.current.stop();
      return;
    }

    setIsListening(true);
    recognitionRef.current.start();
  };

  // Suggested chip handler — hoisted here for clarity
  const handleSuggestedClick = (question) => {
    if (!isLoading) handleSendRequest(question);
  };

  const MAX_CHARS = 1000;
  const charsLeft = MAX_CHARS - input.length;
  const isNearLimit = charsLeft < 100;

  return (
    <div className="ai-page fade-in">

      {!hasGroqApiKey && (
        <div className="ai-status-card warning animate-up">
          <AlertCircle size={18} />
          <span>`.env` ichidagi `VITE_GROQ_API_KEY` topilmadi. Kalitni qo'shib, `npm run dev` ni qayta ishga tushiring.</span>
        </div>
      )}

      {!voiceSupported && (
        <div className="ai-status-card animate-up">
          <AlertCircle size={18} />
          <span>Bu brauzer ovozli kiritishni qo'llab-quvvatlamaydi. Chat yozish orqali ishlaydi.</span>
        </div>
      )}

      <div className="chat-container no-scrollbar">
        <div className="suggested-questions animate-up">
          {SUGGESTED_QUESTIONS.map((question) => (
            <button
              key={question}
              className="suggest_chip glass"
              onClick={() => handleSuggestedClick(question)}
              disabled={isLoading}
            >
              {question}
            </button>
          ))}
        </div>

        {messages.map((message) => (
          <div key={message.id} className={`message-wrapper ${message.sender} animate-up`}>
            <div className="message-icon glass">
              {message.sender === 'ai' ? <Bot size={18} /> : <User size={18} />}
            </div>
            <div className={`message-bubble ${message.sender === 'user' ? 'user-msg' : 'ai-msg glass'}`}>
              <div className="message-text">{message.text}</div>
            </div>
          </div>
        ))}

        {isLoading && (
          <div className="message-wrapper ai animate-up">
            <div className="message-icon glass">
              <Bot size={18} className="animate-pulse" />
            </div>
            <div className="message-bubble ai-msg glass thinking">
              <span></span>
              <span></span>
              <span></span>
            </div>
          </div>
        )}

        {isSpeaking && (
          <div className="speaking-indicator">
            <Volume2 size={16} className="pulse" />
            <span>AI gapirmoqda...</span>
          </div>
        )}

        <div ref={chatEndRef} />
      </div>

      {/* ── Floating Chat Input ──────────────────────────────────────── */}
      <div className="chat-controls glass animate-up">
        <form
          className="chat-input-form"
          onSubmit={(event) => {
            event.preventDefault();
            handleSendRequest(input);
          }}
        >
          <button
            type="button"
            className={`btn-mic ${isListening ? 'active' : ''}`}
            onClick={toggleListening}
            disabled={!voiceSupported || isLoading}
            title={isListening ? "Tinglashni to'xtatish" : 'Ovozli kiritish'}
          >
            {isListening ? <Loader2 className="animate-spin" size={20} /> : <Mic size={20} />}
          </button>

          <input
            className="chat-input"
            type="text"
            placeholder={
              isLoading
                ? "AI o'ylamoqda..."
                : isListening
                  ? 'Eshityapman...'
                  : t('search_placeholder', 'Savolingizni yozing...')
            }
            value={input}
            maxLength={MAX_CHARS}
            onChange={(event) => setInput(event.target.value)}
            onKeyDown={(event) => {
              if ((event.ctrlKey || event.metaKey) && event.key === 'Enter') {
                event.preventDefault();
                handleSendRequest(input);
              }
            }}
            disabled={isListening || isLoading}
          />

          <button
            type="submit"
            className="btn-send-ai"
            disabled={!input.trim() || isLoading}
            title="Yuborish (Ctrl+Enter)"
          >
            {isLoading ? <Loader2 className="animate-spin" size={18} /> : <Send size={18} />}
          </button>
        </form>
      </div>
    </div>
  );
};

export default AIPage;
