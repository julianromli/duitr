
// Component: ChatBox
// Description: AI chat interface with auto-fill functionality for suggested questions
// Fixed type errors and ensured proper context passing to AI

import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { Send, Bot, User } from 'lucide-react';
import { askAI } from './api';
import type { ChatMessage, FinanceSummary } from '@/types/finance';

interface ChatBoxProps {
  messages: ChatMessage[];
  onSendMessage: (messages: ChatMessage[]) => void;
  context: FinanceSummary;
  suggestedQuestion?: string;
  onQuestionUsed?: () => void;
}

export const ChatBox: React.FC<ChatBoxProps> = ({ 
  messages, 
  onSendMessage, 
  context, 
  suggestedQuestion, 
  onQuestionUsed 
}) => {
  const [currentQuestion, setCurrentQuestion] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  // Handle suggested question
  useEffect(() => {
    if (suggestedQuestion) {
      setCurrentQuestion(suggestedQuestion);
      // Call callback to reset the suggested question in parent
      if (onQuestionUsed) {
        onQuestionUsed();
      }
    }
  }, [suggestedQuestion, onQuestionUsed]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!currentQuestion.trim() || isLoading) return;

    const userMessage: ChatMessage = {
      id: Date.now().toString(),
      role: 'user',
      content: currentQuestion.trim(),
      timestamp: new Date()
    };

    const updatedMessages = [...messages, userMessage];
    onSendMessage(updatedMessages);
    setCurrentQuestion('');
    setIsLoading(true);

    try {
      const response = await askAI(currentQuestion, context);

      const aiMessage: ChatMessage = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: response,
        timestamp: new Date()
      };

      const finalMessages = [...updatedMessages, aiMessage];
      onSendMessage(finalMessages);
    } catch (error) {
      const errorMessage: ChatMessage = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: 'Maaf, terjadi error saat memproses pertanyaan Anda. Silakan coba lagi.',
        timestamp: new Date()
      };
      const finalMessages = [...updatedMessages, errorMessage];
      onSendMessage(finalMessages);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card className="border-[#242425]">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base text-white">
          <Bot className="w-4 h-4 text-purple-600" />
          Tanya AI Lebih Lanjut
        </CardTitle>
      </CardHeader>
      <CardContent>
        {/* Chat Messages */}
        {messages.length > 0 && (
          <div className="mb-4 max-h-64 overflow-y-auto space-y-3 p-3 bg-gray-800 rounded-lg">
            {messages.map((message) => (
              <div
                key={message.id}
                className={`flex gap-2 ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div className={`flex gap-2 max-w-[80%] ${message.role === 'user' ? 'flex-row-reverse' : 'flex-row'}`}>
                  <div className={`w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 ${
                    message.role === 'user' 
                      ? 'bg-blue-600 text-white' 
                      : 'bg-purple-600 text-white'
                  }`}>
                    {message.role === 'user' ? <User className="w-3 h-3" /> : <Bot className="w-3 h-3" />}
                  </div>
                  <div className={`p-3 rounded-lg ${
                    message.role === 'user'
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-700 border border-gray-600 text-gray-100'
                  }`}>
                    <p className="text-sm whitespace-pre-wrap">{message.content}</p>
                    <p className={`text-xs mt-1 opacity-70`}>
                      {message.timestamp.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}
                    </p>
                  </div>
                </div>
              </div>
            ))}
            
            {isLoading && (
              <div className="flex gap-2 justify-start">
                <div className="flex gap-2 max-w-[80%]">
                  <div className="w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 bg-purple-600 text-white">
                    <Bot className="w-3 h-3" />
                  </div>
                  <div className="p-3 rounded-lg bg-gray-700 border border-gray-600">
                    <div className="flex items-center gap-2">
                      <div className="animate-spin w-4 h-4 border-2 border-purple-600 border-t-transparent rounded-full"></div>
                      <span className="text-sm text-gray-300">AI sedang berpikir...</span>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Input Form */}
        <form onSubmit={handleSubmit} className="space-y-3">
          <Textarea
            value={currentQuestion}
            onChange={(e) => setCurrentQuestion(e.target.value)}
            placeholder="Tanyakan sesuatu tentang evaluasi keuangan Anda..."
            className="min-h-[80px] resize-none bg-gray-800 border-gray-700 text-white placeholder-gray-400"
            disabled={isLoading}
          />
          <div className="flex justify-end">
            <Button 
              type="submit" 
              disabled={!currentQuestion.trim() || isLoading}
              size="sm"
              className="flex items-center gap-2 bg-[#C6FE1E] text-black hover:bg-[#B5E619]"
            >
              <Send className="w-4 h-4" />
              Kirim
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
};
