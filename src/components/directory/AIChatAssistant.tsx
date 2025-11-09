import { useState, useEffect, useRef } from 'react';
import { MessageCircle, Send, Sparkles, X, Loader2, ThumbsUp, ThumbsDown } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface ChatMessage {
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: Date;
  businessReferences?: number[];
}

export function AIChatAssistant() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      role: 'assistant',
      content: "Hi! I'm your AI guide to Michigan businesses. Ask me anything like:\n\n• 'Find pet-friendly cafes in Ann Arbor'\n• 'Best date night restaurants in Grand Rapids'\n• 'Where can I get authentic Detroit-style pizza?'",
      timestamp: new Date(),
    },
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [sessionId] = useState(() => `session_${Date.now()}_${Math.random().toString(36).substring(7)}`);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isOpen]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const sendMessage = async () => {
    if (!input.trim() || isLoading) return;

    const userMessage: ChatMessage = {
      role: 'user',
      content: input.trim(),
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);

    try {
      const response = await fetch('/api/directory/ai-chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sessionId,
          messages: [...messages, userMessage].map((m) => ({
            role: m.role,
            content: m.content,
          })),
        }),
      });

      if (response.ok) {
        const data = await response.json();
        const assistantMessage: ChatMessage = {
          role: 'assistant',
          content: data.message || 'Sorry, I encountered an error. Please try again.',
          timestamp: new Date(),
          businessReferences: data.businessIds,
        };
        setMessages((prev) => [...prev, assistantMessage]);
      } else {
        throw new Error('Failed to get response');
      }
    } catch (error) {
      console.error('Chat error:', error);
      setMessages((prev) => [
        ...prev,
        {
          role: 'assistant',
          content: "Sorry, I'm having trouble connecting right now. Please try again in a moment.",
          timestamp: new Date(),
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const quickQuestions = [
    'Best coffee shops near me',
    'Pet-friendly restaurants',
    'Live music venues',
    'Outdoor dining options',
  ];

  return (
    <>
      {/* Floating Chat Button */}
      <AnimatePresence>
        {!isOpen && (
          <motion.button
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0, opacity: 0 }}
            onClick={() => setIsOpen(true)}
            className="fixed bottom-6 right-6 w-16 h-16 bg-gradient-to-br from-lakes-blue via-copper-orange to-forest-green rounded-full shadow-2xl flex items-center justify-center hover:scale-110 transition-transform z-50 group"
          >
            <MessageCircle size={28} className="text-white" />
            <motion.div
              animate={{ scale: [1, 1.2, 1], opacity: [1, 0.7, 1] }}
              transition={{ repeat: Infinity, duration: 2 }}
              className="absolute -top-1 -right-1"
            >
              <Sparkles size={18} className="text-gold" />
            </motion.div>
            {/* Notification Pulse */}
            <span className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 rounded-full animate-ping" />
            <span className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 rounded-full" />
          </motion.button>
        )}
      </AnimatePresence>

      {/* Chat Window */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            transition={{ type: 'spring', damping: 20, stiffness: 300 }}
            className="fixed bottom-6 right-6 w-[420px] h-[650px] bg-white rounded-2xl shadow-2xl border-2 border-lakes-blue/20 flex flex-col z-50 overflow-hidden"
          >
            {/* Header */}
            <div className="p-5 bg-gradient-to-r from-lakes-blue to-copper-orange text-white flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="relative">
                  <Sparkles size={24} />
                  <span className="absolute -bottom-1 -right-1 w-3 h-3 bg-forest-green rounded-full border-2 border-white" />
                </div>
                <div>
                  <h3 className="font-heading font-bold text-lg">AI Business Guide</h3>
                  <p className="text-xs opacity-90">Powered by Cloudflare AI</p>
                </div>
              </div>
              <button
                onClick={() => setIsOpen(false)}
                className="hover:bg-white/20 p-2 rounded-lg transition-colors"
              >
                <X size={20} />
              </button>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-parchment-light/30">
              {messages.map((msg, idx) => (
                <motion.div
                  key={idx}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3 }}
                  className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  <div
                    className={`max-w-[80%] ${
                      msg.role === 'user'
                        ? 'bg-gradient-to-r from-lakes-blue to-copper-orange text-white'
                        : 'bg-white text-ink-primary border-2 border-parchment-mid'
                    } px-4 py-3 rounded-2xl shadow-sm`}
                  >
                    {msg.role === 'assistant' && (
                      <div className="flex items-center gap-2 mb-2 text-xs text-lakes-blue font-semibold">
                        <Sparkles size={12} />
                        <span>AI Assistant</span>
                      </div>
                    )}
                    <p className="text-sm whitespace-pre-wrap">{msg.content}</p>
                    {msg.businessReferences && msg.businessReferences.length > 0 && (
                      <div className="mt-3 pt-3 border-t border-parchment-mid">
                        <p className="text-xs text-ink-secondary mb-2">Referenced businesses:</p>
                        <div className="flex flex-wrap gap-2">
                          {msg.businessReferences.map((bizId) => (
                            <a
                              key={bizId}
                              href={`/directory/business/${bizId}`}
                              className="text-xs px-2 py-1 bg-lakes-blue/10 text-lakes-blue rounded-full hover:bg-lakes-blue/20 transition-colors"
                            >
                              View #{bizId}
                            </a>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </motion.div>
              ))}

              {isLoading && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="flex justify-start"
                >
                  <div className="bg-white border-2 border-parchment-mid px-4 py-3 rounded-2xl shadow-sm">
                    <div className="flex items-center gap-2">
                      <Loader2 className="animate-spin text-lakes-blue" size={16} />
                      <span className="text-sm text-ink-secondary">AI is thinking...</span>
                    </div>
                  </div>
                </motion.div>
              )}

              <div ref={messagesEndRef} />
            </div>

            {/* Quick Questions */}
            {messages.length === 1 && (
              <div className="px-4 pb-3 border-t border-parchment-mid bg-white">
                <p className="text-xs text-ink-secondary mb-2 mt-3">Try asking:</p>
                <div className="flex flex-wrap gap-2">
                  {quickQuestions.map((q) => (
                    <button
                      key={q}
                      onClick={() => {
                        setInput(q);
                        setTimeout(() => sendMessage(), 100);
                      }}
                      className="text-xs px-3 py-1.5 bg-parchment-light border border-parchment-mid rounded-full hover:border-lakes-blue hover:bg-lakes-blue/5 transition-colors"
                    >
                      {q}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Input */}
            <div className="p-4 border-t border-parchment-mid bg-white">
              <div className="flex gap-2">
                <input
                  ref={inputRef}
                  type="text"
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyPress={handleKeyPress}
                  placeholder="Ask about businesses..."
                  disabled={isLoading}
                  className="flex-1 px-4 py-3 border-2 border-parchment-mid rounded-xl focus:border-lakes-blue focus:outline-none text-sm disabled:opacity-50 disabled:cursor-not-allowed"
                />
                <button
                  onClick={sendMessage}
                  disabled={!input.trim() || isLoading}
                  className="px-5 py-3 bg-gradient-to-r from-lakes-blue to-copper-orange text-white rounded-xl hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                >
                  <Send size={18} />
                </button>
              </div>
              <p className="text-xs text-ink-secondary mt-2 text-center">
                AI responses may contain errors. Always verify information.
              </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
