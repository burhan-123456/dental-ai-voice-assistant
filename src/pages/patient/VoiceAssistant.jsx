import { useState, useEffect, useRef } from 'react';
import api from '../../api';
import { Mic, MicOff, Send, Trash2, Volume2, VolumeX } from 'lucide-react';
import toast from 'react-hot-toast';

export default function VoiceAssistant() {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [ttsEnabled, setTtsEnabled] = useState(true);
  const messagesEndRef = useRef(null);
  const recognitionRef = useRef(null);
  const synthRef = useRef(window.speechSynthesis);

  // Load chat history on mount
  useEffect(() => {
    api.getChatHistory()
      .then(history => setMessages(history.map(m => ({ role: m.role, content: m.message, timestamp: m.created_at }))))
      .catch(console.error);
  }, []);

  // Auto-scroll
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Initialize speech recognition
  useEffect(() => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (SpeechRecognition) {
      const recognition = new SpeechRecognition();
      recognition.continuous = false;
      recognition.interimResults = false;
      recognition.lang = 'en-IN';

      recognition.onresult = (event) => {
        const transcript = event.results[0][0].transcript;
        setInput(transcript);
        // Auto-send the voice message
        sendMessage(transcript);
      };

      recognition.onerror = (event) => {
        console.error('Speech recognition error:', event.error);
        setIsRecording(false);
        if (event.error === 'no-speech') {
          toast('No speech detected. Try again.', { icon: '🎙️' });
        } else if (event.error !== 'aborted') {
          toast.error('Voice recognition error. Please try again.');
        }
      };

      recognition.onend = () => {
        setIsRecording(false);
      };

      recognitionRef.current = recognition;
    }

    return () => {
      synthRef.current?.cancel();
    };
  }, []);

  const toggleRecording = () => {
    if (!recognitionRef.current) {
      toast.error('Voice recognition not supported in this browser. Use Chrome or Edge.');
      return;
    }

    if (isRecording) {
      recognitionRef.current.abort();
      setIsRecording(false);
    } else {
      synthRef.current?.cancel();
      recognitionRef.current.start();
      setIsRecording(true);
    }
  };

  const speak = (text) => {
    if (!ttsEnabled || !synthRef.current) return;
    synthRef.current.cancel();

    // Clean markdown-like formatting for TTS
    const cleanText = text.replace(/[*_#`]/g, '').replace(/\n+/g, '. ');

    const utterance = new SpeechSynthesisUtterance(cleanText);
    utterance.lang = 'en-IN';
    utterance.rate = 1;
    utterance.pitch = 1;

    // Try to find a good voice
    const voices = synthRef.current.getVoices();
    const preferredVoice = voices.find(v => v.lang.startsWith('en') && v.name.includes('Female')) ||
                           voices.find(v => v.lang.startsWith('en-IN')) ||
                           voices.find(v => v.lang.startsWith('en'));
    if (preferredVoice) utterance.voice = preferredVoice;

    synthRef.current.speak(utterance);
  };

  const sendMessage = async (text) => {
    const messageText = text || input.trim();
    if (!messageText) return;

    setInput('');
    const userMessage = { role: 'user', content: messageText, timestamp: new Date().toISOString() };
    setMessages(prev => [...prev, userMessage]);
    setLoading(true);

    try {
      const data = await api.sendMessage(messageText);
      const assistantMessage = { role: 'assistant', content: data.response, timestamp: new Date().toISOString() };
      setMessages(prev => [...prev, assistantMessage]);

      // Speak the response
      speak(data.response);
    } catch (err) {
      const errorMsg = { role: 'assistant', content: "I'm sorry, I'm having trouble connecting right now. Please try again in a moment.", timestamp: new Date().toISOString() };
      setMessages(prev => [...prev, errorMsg]);
      toast.error(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const clearChat = async () => {
    try {
      await api.clearChatHistory();
      setMessages([]);
      synthRef.current?.cancel();
      toast.success('Chat cleared');
    } catch (err) { toast.error(err.message); }
  };

  const suggestions = [
    "I want to book an appointment tomorrow",
    "Is Dr. Sharma available on Friday?",
    "I have tooth pain, what should I do?",
    "What services do you offer?",
    "Show me my upcoming appointments",
    "I need to cancel my appointment",
    "How much does teeth whitening cost?",
    "Which dentist specializes in braces?",
  ];

  const formatTime = (ts) => {
    if (!ts) return '';
    return new Date(ts).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' });
  };

  return (
    <>
      <div className="page-header">
        <div>
          <h1 className="page-title">🤖 AI Voice Assistant</h1>
          <p className="page-subtitle">Your intelligent dental receptionist</p>
        </div>
        <div style={{ display: 'flex', gap: '0.5rem' }}>
          <button className={`btn btn-sm ${ttsEnabled ? 'btn-primary' : 'btn-outline'}`}
            onClick={() => { setTtsEnabled(!ttsEnabled); synthRef.current?.cancel(); }}>
            {ttsEnabled ? <Volume2 size={16} /> : <VolumeX size={16} />}
            {ttsEnabled ? 'Voice On' : 'Voice Off'}
          </button>
          <button className="btn btn-sm btn-danger" onClick={clearChat}>
            <Trash2 size={16} /> Clear
          </button>
        </div>
      </div>

      <div className="chat-container">
        <div className="chat-messages">
          {messages.length === 0 ? (
            <div className="chat-welcome">
              <div className="chat-welcome-icon">🦷</div>
              <h2>Hi! I'm SmileCare AI</h2>
              <p>I'm your virtual dental receptionist. I can help you book appointments, check availability, answer dental questions, and more. Try speaking or typing!</p>
              <div className="chat-suggestions">
                {suggestions.map((s, i) => (
                  <button key={i} className="chat-suggestion" onClick={() => sendMessage(s)}>
                    {s}
                  </button>
                ))}
              </div>
            </div>
          ) : (
            <>
              {messages.map((msg, i) => (
                <div key={i} className={`chat-bubble ${msg.role}`}>
                  {msg.content}
                  <span className="timestamp">{formatTime(msg.timestamp)}</span>
                </div>
              ))}
              {loading && (
                <div className="typing-indicator">
                  <span /><span /><span />
                </div>
              )}
            </>
          )}
          <div ref={messagesEndRef} />
        </div>

        <div className="chat-input-area">
          <button
            className={`voice-btn ${isRecording ? 'recording' : ''}`}
            onClick={toggleRecording}
            title={isRecording ? 'Stop recording' : 'Start speaking'}
          >
            {isRecording ? <MicOff size={22} /> : <Mic size={22} />}
          </button>

          <input
            type="text"
            className="form-input"
            placeholder={isRecording ? '🎙️ Listening...' : 'Type a message or click the mic to speak...'}
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            disabled={loading || isRecording}
          />

          <button className="voice-btn" onClick={() => sendMessage()}
            disabled={!input.trim() || loading}
            style={input.trim() ? { background: 'var(--primary-600)', color: 'white' } : {}}>
            <Send size={20} />
          </button>
        </div>
      </div>
    </>
  );
}
