import { useState, useRef, useEffect } from 'react';
import { Bot, Send, User, Loader2 } from 'lucide-react';
import { api } from '../services/api';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

interface AIAgentProps {
  onActionComplete?: () => void;
}

export function AIAgent({ onActionComplete }: AIAgentProps) {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: 'welcome',
      role: 'assistant',
      content: "Hi! I'm your AI Calendar Assistant. I can help you add events, check availability, or calculate travel times. What can I do for you today?",
      timestamp: new Date()
    }
  ]);
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSendMessage = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!inputValue.trim() || isLoading) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: inputValue.trim(),
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setInputValue('');
    setIsLoading(true);

    try {
      const response = await api.chatWithAgent(userMessage.content);

      if (response.success && response.data) {
        const botMessage: Message = {
          id: (Date.now() + 1).toString(),
          role: 'assistant',
          content: response.data.response,
          timestamp: new Date()
        };
        setMessages(prev => [...prev, botMessage]);

        // If the agent performed an action (like adding an event), 
        // we might want to refresh the calendar. 
        if (onActionComplete) {
          onActionComplete();
        }
      } else {
        throw new Error(response.message || 'Failed to get response');
      }
    } catch (error) {
      console.error('Chat error:', error);
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: "I'm sorry, I encountered an error. Please try again.",
        timestamp: new Date()
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-sm h-[calc(100vh-12rem)] flex flex-col" style={{ borderWidth: '2px', borderColor: '#185177' }}>
      {/* Header */}
      <div className="p-4 flex items-center gap-3" style={{ borderBottom: '2px solid', borderColor: '#185177' }}>
        <div className="w-10 h-10 rounded-full flex items-center justify-center" style={{ backgroundColor: '#ffc971' }}>
          <Bot className="w-6 h-6" style={{ color: '#185177' }} />
        </div>
        <div>
          <h2 style={{ color: '#185177' }} className="font-semibold">AI Calendar Assistant</h2>
          <p className="text-xs" style={{ color: '#c95603' }}>Powered by Gemini 2.0</p>
        </div>
      </div>

      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map((msg) => (
          <div
            key={msg.id}
            className={`flex gap-3 ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}
          >
            <div
              className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0`}
              style={{ backgroundColor: msg.role === 'user' ? '#185177' : '#ffc971' }}
            >
              {msg.role === 'user' ? (
                <User className="w-4 h-4 text-white" />
              ) : (
                <Bot className="w-4 h-4" style={{ color: '#185177' }} />
              )}
            </div>
            <div
              className={`max-w-[80%] rounded-lg p-3 text-sm leading-relaxed`}
              style={{
                backgroundColor: msg.role === 'user' ? '#185177' : '#f3f4f6',
                color: msg.role === 'user' ? '#fff' : '#1f2937',
                borderTopRightRadius: msg.role === 'user' ? '0' : '0.5rem',
                borderTopLeftRadius: msg.role === 'assistant' ? '0' : '0.5rem'
              }}
            >
              {msg.content}
            </div>
          </div>
        ))}
        {isLoading && (
          <div className="flex gap-3">
            <div className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0" style={{ backgroundColor: '#ffc971' }}>
              <Bot className="w-4 h-4" style={{ color: '#185177' }} />
            </div>
            <div className="bg-gray-100 rounded-lg p-3 rounded-tl-none flex items-center">
              <Loader2 className="w-4 h-4 animate-spin text-gray-500" />
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input Area */}
      <form onSubmit={handleSendMessage} className="p-4 border-t" style={{ borderColor: '#e5e7eb' }}>
        <div className="flex gap-2">
          <input
            type="text"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            placeholder="Type a message..."
            className="flex-1 px-4 py-2 rounded-lg border focus:outline-none focus:ring-2 focus:ring-offset-whte"
            style={{ borderColor: '#d1d5db', }}
            disabled={isLoading}
          />
          <button
            type="submit"
            disabled={isLoading || !inputValue.trim()}
            className="p-2 rounded-lg text-white transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            style={{ backgroundColor: '#185177' }}
            onMouseEnter={(e) => !isLoading && (e.currentTarget.style.backgroundColor = '#e2711d')}
            onMouseLeave={(e) => !isLoading && (e.currentTarget.style.backgroundColor = '#185177')}
          >
            <Send className="w-5 h-5" />
          </button>
        </div>
      </form>
    </div>
  );
}
