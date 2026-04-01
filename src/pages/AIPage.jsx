import React, { useState, useRef, useEffect } from 'react'
import { Send, Bot, User, Sparkles, Mic, MicOff, Volume2, VolumeX, Loader2 } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { useLocation } from 'react-router-dom'
import '../styles/AIPage.css'
import { getAIResponse } from '../services/aiService'

const AIPage = () => {
  const { t } = useTranslation()
  const location = useLocation()
  const [messages, setMessages] = useState([
    { id: 1, text: 'Salom! Men sizning premium yordamchingizman. Savolingiz bo\'lsa mikrofondan foydalanib so\'rashingiz mumkin.', sender: 'ai' }
  ])
  const [input, setInput] = useState('')
  const [isListening, setIsListening] = useState(false)
  const [isSpeaking, setIsSpeaking] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const chatEndRef = useRef(null)
  
  const recognitionRef = useRef(null)
  const synthRef = useRef(window.speechSynthesis)

  useEffect(() => {
    if (location.state?.initialMessage) {
        handleSendRequest(location.state.initialMessage)
    }
  }, [location.state])

  useEffect(() => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition
    if (SpeechRecognition) {
      recognitionRef.current = new SpeechRecognition()
      recognitionRef.current.continuous = false
      recognitionRef.current.interimResults = false
      recognitionRef.current.lang = 'uz-UZ'

      recognitionRef.current.onresult = (event) => {
        const transcript = event.results[0][0].transcript
        setInput(transcript)
        handleSendRequest(transcript, true)
      }

      recognitionRef.current.onend = () => setIsListening(false)
      recognitionRef.current.onerror = () => setIsListening(false)
    }
  }, [])

  const scrollToBottom = () => chatEndRef.current?.scrollIntoView({ behavior: "smooth" })

  useEffect(() => {
    scrollToBottom()
  }, [messages, isLoading])

  const speakText = (text) => {
    if (synthRef.current) {
        synthRef.current.cancel()
        const utterance = new SpeechSynthesisUtterance(text)
        utterance.lang = 'uz-UZ'
        utterance.onstart = () => setIsSpeaking(true)
        utterance.onend = () => setIsSpeaking(false)
        synthRef.current.speak(utterance)
    }
  }

  const handleSendRequest = async (text, viaVoice = false) => {
    if (!text.trim() || isLoading) return

    const userMsg = { id: Date.now(), text: text, sender: 'user' }
    setMessages(prev => [...prev, userMsg])
    setInput('')
    setIsLoading(true)

    try {
        const history = messages.map(m => ({
            role: m.sender === 'user' ? 'user' : 'model',
            text: m.text
        }))

        const responseText = await getAIResponse(text, history)
        
        const aiResponse = { id: Date.now() + 1, text: responseText, sender: 'ai' }
        setMessages(prev => [...prev, aiResponse])
        if (viaVoice) speakText(responseText)
    } catch (error) {
        console.error("AI Chat Error:", error)
        const errorMsg = { id: Date.now() + 1, text: "Kechirasiz, hozirda ulanishda muammo bor.", sender: 'ai' }
        setMessages(prev => [...prev, errorMsg])
    } finally {
        setIsLoading(false)
    }
  }

  const toggleListening = () => {
    if (isListening) {
      recognitionRef.current?.stop()
    } else {
      setIsListening(true)
      recognitionRef.current?.start()
    }
  }

  const SUGGESTED_QUESTIONS = [
    t('suggested_mountains', "Eng mashhur tog'lar qayerda?"),
    t('suggested_tashkent', "Toshkentda qayerga borish mumkin?"),
    t('suggested_samarkand', "Samarqand obidalari haqida ma'lumot ber."),
    t('suggested_hotels', "Eng yaxshi mehmonxonalar qaysilar?")
  ]

  const handleSuggestedClick = (question) => {
    handleSendRequest(question)
  }

  return (
    <div className="ai-page fade-in">
      <div className="ai-header animate-up">
        <div className="sparkle-container">
            <Sparkles className="sparkle-icon" size={28} />
        </div>
        <h1>{t('ai_assistant', 'AI Assistant')}</h1>
        <p>{t('ask_about_uzb', 'O\'zbekiston bo\'ylab sayohat haqida so\'rang')}</p>
      </div>

      <div className="chat-container no-scrollbar">
        <div className="suggested-questions animate-up">
            {SUGGESTED_QUESTIONS.map((q, idx) => (
                <button 
                  key={idx} 
                  className="suggest_chip glass" 
                  onClick={() => handleSuggestedClick(q)}
                  disabled={isLoading}
                >
                    {q}
                </button>
            ))}
        </div>

        {messages.map(msg => (
          <div key={msg.id} className={`message-wrapper ${msg.sender} animate-up`}>
            <div className="message-icon glass">
              {msg.sender === 'ai' ? <Bot size={18} /> : <User size={18} />}
            </div>
            <div className={`message-bubble ${msg.sender === 'user' ? 'user-msg' : 'ai-msg'} glass`}>
              {msg.text}
            </div>
          </div>
        ))}
        {isLoading && (
          <div className="message-wrapper ai animate-up">
            <div className="message-icon glass">
              <Bot size={18} className="animate-pulse" />
            </div>
            <div className="message-bubble ai-msg glass thinking">
               <span></span><span></span><span></span>
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

      <div className="chat-controls glass animate-up">
        <form className="chat-input-form" onSubmit={(e) => { e.preventDefault(); handleSendRequest(input); }}>
          <button 
            type="button" 
            className={`btn-mic ${isListening ? 'active' : ''}`} 
            onClick={toggleListening}
            disabled={isLoading}
          >
            {isListening ? <Loader2 className="animate-spin" /> : <Mic size={22} />}
          </button>
          
          <div className="input-group glass">
            <input 
                type="text" 
                placeholder={isLoading ? "AI o'ylamoqda..." : (isListening ? "Eshityapman..." : t('search_placeholder', 'Savolingizni yozing...'))} 
                value={input}
                onChange={(e) => setInput(e.target.value)}
                disabled={isListening || isLoading}
            />
            <button type="submit" className="btn-send-ai" disabled={!input.trim() || isLoading}>
                {isLoading ? <Loader2 className="animate-spin" size={20} /> : <Send size={20} />}
            </button>
          </div>
        </form>
      </div>

    </div>
  )
}

export default AIPage
