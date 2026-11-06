import React, { useState, useEffect, useRef } from 'react';
import { Bot, X, Send, Sparkles, User, RefreshCw, ChevronDown, ExternalLink, FileText, Mail, MessageSquare } from 'lucide-react';
import { ChatMessage, WebsiteSettings } from '../types';

interface AIAssistantChatbotProps {
  settings?: WebsiteSettings;
  onOpenCVModal?: () => void;
  onOpenContact?: () => void;
  onSelectProject?: (projectId: number) => void;
  whatsappNumber?: string;
}

export const AIAssistantChatbot: React.FC<AIAssistantChatbotProps> = ({
  settings,
  onOpenCVModal,
  onOpenContact,
  onSelectProject,
  whatsappNumber = '233244762558',
}) => {
  const [isOpen, setIsOpen] = useState<boolean>(false);
  const [isMinimized, setIsMinimized] = useState<boolean>(false);
  const [inputMessage, setInputMessage] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [hasUnread, setHasUnread] = useState<boolean>(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const assistantName = settings?.ai_assistant_name || 'DevBot';
  const isEnabled = settings?.ai_assistant_enabled !== undefined ? Number(settings.ai_assistant_enabled) === 1 : true;
  const welcomeMessage = settings?.ai_welcome_message || `Hello! I am ${assistantName}, Cisse's AI Portfolio Assistant. Ask me anything about Cisse's software development projects, Django expertise, technical skills, services, or career background!`;

  // Initialize with welcome message
  useEffect(() => {
    if (messages.length === 0) {
      setMessages([
        {
          role: 'assistant',
          content: welcomeMessage,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          suggestedActions: [
            { label: 'View Projects', action: 'open_project' },
            { label: 'Request CV', action: 'open_cv' },
            { label: 'Contact Cisse', action: 'open_contact' },
          ],
        },
      ]);
    }
  }, [welcomeMessage]);

  // Auto scroll to bottom
  useEffect(() => {
    if (isOpen && !isMinimized) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, isOpen, isMinimized, isLoading]);

  if (!isEnabled) {
    return null;
  }

  const handleSendMessage = async (textToSend?: string) => {
    const text = (textToSend || inputMessage).trim();
    if (!text || isLoading) return;

    const userMsg: ChatMessage = {
      role: 'user',
      content: text,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    const newHistory = [...messages, userMsg];
    setMessages(newHistory);
    setInputMessage('');
    setIsLoading(true);

    try {
      // Format history for backend
      const historyPayload = newHistory.slice(-10).map((m) => ({
        role: m.role,
        content: m.content,
      }));

      const res = await fetch('/api/assistant/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: text,
          history: historyPayload,
        }),
      });

      if (!res.ok) {
        throw new Error('Server returned an error');
      }

      const data = await res.json();

      const assistantMsg: ChatMessage = {
        role: 'assistant',
        content: data.reply || "I'm here to assist with any questions regarding Cisse's software background and projects.",
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        suggestedActions: data.actions || [],
      };

      setMessages((prev) => [...prev, assistantMsg]);
    } catch (error) {
      console.error('Chat Assistant error:', error);
      setMessages((prev) => [
        ...prev,
        {
          role: 'assistant',
          content: "I apologize, but I am temporarily experiencing connection delays. Please feel free to reach Cisse directly via WhatsApp or the contact form.",
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          suggestedActions: [
            { label: 'Chat on WhatsApp', action: 'open_whatsapp' },
            { label: 'Send Direct Message', action: 'open_contact' },
          ],
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleActionClick = (action: string, payload?: any) => {
    if (action === 'open_cv' && onOpenCVModal) {
      onOpenCVModal();
    } else if (action === 'open_contact') {
      if (onOpenContact) {
        onOpenContact();
      } else {
        const contactSection = document.getElementById('contact');
        contactSection?.scrollIntoView({ behavior: 'smooth' });
      }
    } else if (action === 'open_whatsapp') {
      const cleanPhone = whatsappNumber.replace(/\D/g, '');
      window.open(`https://wa.me/${cleanPhone}?text=Hello%20Cisse,%20I%20found%20your%20portfolio%20website%20and%20would%20like%20to%20connect!`, '_blank');
    } else if (action === 'open_project') {
      if (payload && onSelectProject) {
        onSelectProject(Number(payload));
      } else {
        const projSection = document.getElementById('projects');
        projSection?.scrollIntoView({ behavior: 'smooth' });
      }
    }
  };

  const handleClearChat = () => {
    setMessages([
      {
        role: 'assistant',
        content: welcomeMessage,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        suggestedActions: [
          { label: 'View Projects', action: 'open_project' },
          { label: 'Request CV', action: 'open_cv' },
          { label: 'Contact Cisse', action: 'open_contact' },
        ],
      },
    ]);
  };

  const quickPrompts = [
    'Tell me about Cisse',
    'Django & Python Projects',
    'AI & ML Experience',
    'Services Offered',
    'Official CV Request',
  ];

  return (
    <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end">
      {/* Floating Toggle Button */}
      {!isOpen && (
        <button
          onClick={() => {
            setIsOpen(true);
            setHasUnread(false);
          }}
          className="group relative flex items-center gap-3 bg-gradient-to-r from-blue-600 via-indigo-600 to-blue-700 hover:from-blue-700 hover:to-indigo-800 text-white px-5 py-3.5 rounded-full shadow-2xl hover:shadow-blue-500/30 transition-all duration-300 transform hover:-translate-y-1 focus:outline-none focus:ring-4 focus:ring-blue-300 active:scale-95"
          aria-label="Open AI Portfolio Assistant"
        >
          <div className="relative">
            <Bot className="w-6 h-6 animate-pulse" />
            <span className="absolute -top-1 -right-1 flex h-3 w-3">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500"></span>
            </span>
          </div>
          <div className="text-left hidden sm:block">
            <p className="text-xs font-semibold leading-tight tracking-wider uppercase opacity-90">Ask AI</p>
            <p className="text-sm font-bold tracking-tight">{assistantName}</p>
          </div>
          <Sparkles className="w-4 h-4 text-amber-300 hidden sm:inline" />
        </button>
      )}

      {/* Chat Window */}
      {isOpen && (
        <div
          className={`bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col transition-all duration-300 ${
            isMinimized
              ? 'w-80 h-16'
              : 'w-[92vw] sm:w-[420px] h-[580px] max-h-[85vh]'
          }`}
        >
          {/* Header */}
          <div className="bg-gradient-to-r from-slate-900 via-blue-950 to-indigo-950 text-white p-4 flex items-center justify-between shrink-0 border-b border-blue-900/40">
            <div className="flex items-center gap-3">
              <div className="relative bg-blue-600/40 p-2 rounded-xl border border-blue-400/30">
                <Bot className="w-5 h-5 text-blue-300" />
                <span className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-emerald-500 border-2 border-slate-900 rounded-full"></span>
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="font-bold text-sm tracking-tight text-white">{assistantName}</h3>
                  <span className="bg-blue-500/20 text-blue-300 border border-blue-400/30 text-[10px] font-semibold px-1.5 py-0.5 rounded-full">
                    Gemini AI
                  </span>
                </div>
                <p className="text-xs text-slate-300 flex items-center gap-1">
                  <span className="inline-block w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
                  Grounded in Verified Portfolio Data
                </p>
              </div>
            </div>

            <div className="flex items-center gap-1 text-slate-300">
              <button
                onClick={handleClearChat}
                title="Restart conversation"
                className="p-1.5 hover:text-white hover:bg-white/10 rounded-lg transition-colors text-xs"
              >
                <RefreshCw className="w-4 h-4" />
              </button>
              <button
                onClick={() => setIsMinimized(!isMinimized)}
                title={isMinimized ? 'Expand' : 'Minimize'}
                className="p-1.5 hover:text-white hover:bg-white/10 rounded-lg transition-colors text-xs"
              >
                <ChevronDown className={`w-4 h-4 transform transition-transform ${isMinimized ? 'rotate-180' : ''}`} />
              </button>
              <button
                onClick={() => setIsOpen(false)}
                title="Close Assistant"
                className="p-1.5 hover:text-white hover:bg-rose-500/20 rounded-lg transition-colors text-xs"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {!isMinimized && (
            <>
              {/* Messages Container */}
              <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-slate-50/70 text-slate-800 text-sm">
                {messages.map((msg, idx) => (
                  <div
                    key={idx}
                    className={`flex flex-col ${
                      msg.role === 'user' ? 'items-end' : 'items-start'
                    }`}
                  >
                    <div className="flex items-end gap-2 max-w-[85%]">
                      {msg.role === 'assistant' && (
                        <div className="w-7 h-7 rounded-full bg-blue-100 border border-blue-200 text-blue-700 flex items-center justify-center shrink-0 mb-1">
                          <Bot className="w-4 h-4" />
                        </div>
                      )}

                      <div
                        className={`rounded-2xl px-4 py-3 shadow-xs ${
                          msg.role === 'user'
                            ? 'bg-blue-600 text-white rounded-br-xs'
                            : 'bg-white text-slate-800 border border-slate-200/80 rounded-bl-xs'
                        }`}
                      >
                        <p className="whitespace-pre-line leading-relaxed text-[13.5px]">
                          {msg.content}
                        </p>
                        <span
                          className={`text-[10px] mt-1 block ${
                            msg.role === 'user' ? 'text-blue-100 text-right' : 'text-slate-400'
                          }`}
                        >
                          {msg.timestamp}
                        </span>
                      </div>

                      {msg.role === 'user' && (
                        <div className="w-7 h-7 rounded-full bg-slate-800 text-white flex items-center justify-center shrink-0 mb-1">
                          <User className="w-4 h-4" />
                        </div>
                      )}
                    </div>

                    {/* Action recommendations from AI */}
                    {msg.role === 'assistant' && msg.suggestedActions && msg.suggestedActions.length > 0 && (
                      <div className="flex flex-wrap gap-1.5 mt-2 ml-9">
                        {msg.suggestedActions.map((act, actIdx) => (
                          <button
                            key={actIdx}
                            onClick={() => handleActionClick(act.action, act.payload)}
                            className="inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1.5 bg-blue-50 text-blue-700 border border-blue-200 hover:bg-blue-600 hover:text-white rounded-lg transition-all shadow-xs"
                          >
                            {act.action === 'open_cv' && <FileText className="w-3.5 h-3.5" />}
                            {act.action === 'open_contact' && <Mail className="w-3.5 h-3.5" />}
                            {act.action === 'open_whatsapp' && <MessageSquare className="w-3.5 h-3.5" />}
                            {act.action === 'open_project' && <ExternalLink className="w-3.5 h-3.5" />}
                            {act.label}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                ))}

                {/* Typing Indicator */}
                {isLoading && (
                  <div className="flex items-center gap-2 text-slate-500 text-xs py-2">
                    <div className="w-7 h-7 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center">
                      <Bot className="w-4 h-4" />
                    </div>
                    <div className="bg-white border border-slate-200 rounded-2xl px-4 py-2.5 flex items-center gap-1.5 shadow-xs">
                      <span className="w-2 h-2 rounded-full bg-blue-600 animate-bounce"></span>
                      <span className="w-2 h-2 rounded-full bg-blue-600 animate-bounce [animation-delay:0.2s]"></span>
                      <span className="w-2 h-2 rounded-full bg-blue-600 animate-bounce [animation-delay:0.4s]"></span>
                      <span className="ml-2 text-slate-500 text-xs font-medium">DevBot is formulating a response...</span>
                    </div>
                  </div>
                )}
                <div ref={messagesEndRef} />
              </div>

              {/* Quick suggestions pills */}
              <div className="px-3 py-2 bg-slate-100/90 border-t border-slate-200 flex items-center gap-1.5 overflow-x-auto no-scrollbar shrink-0">
                <span className="text-[11px] font-semibold text-slate-500 shrink-0">Suggested:</span>
                {quickPrompts.map((prompt, pIdx) => (
                  <button
                    key={pIdx}
                    onClick={() => handleSendMessage(prompt)}
                    className="shrink-0 text-[11px] font-medium px-2.5 py-1 bg-white hover:bg-blue-50 text-slate-700 hover:text-blue-700 rounded-full border border-slate-200 transition-colors"
                  >
                    {prompt}
                  </button>
                ))}
              </div>

              {/* Input Bar */}
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  handleSendMessage();
                }}
                className="p-3 bg-white border-t border-slate-200 flex items-center gap-2 shrink-0"
              >
                <input
                  type="text"
                  value={inputMessage}
                  onChange={(e) => setInputMessage(e.target.value)}
                  placeholder="Ask about Cisse's skills, experience, or projects..."
                  disabled={isLoading}
                  className="flex-1 bg-slate-50 border border-slate-300 rounded-xl px-3.5 py-2.5 text-xs sm:text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 placeholder-slate-400 disabled:opacity-60"
                />
                <button
                  type="submit"
                  disabled={!inputMessage.trim() || isLoading}
                  className="p-2.5 bg-blue-600 hover:bg-blue-700 disabled:bg-slate-300 text-white rounded-xl shadow-md transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-blue-400"
                  aria-label="Send message"
                >
                  <Send className="w-4 h-4" />
                </button>
              </form>
            </>
          )}
        </div>
      )}
    </div>
  );
};
