
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Brain, TrendingUp } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { sanitizeHTML } from '@/utils/sanitize';

interface InsightDisplayProps {
  text: string;
  isLoading?: boolean;
}

export const InsightDisplay: React.FC<InsightDisplayProps> = ({ text, isLoading }) => {
  const { t } = useTranslation();
  if (isLoading) {
    return (
      <Card className="mb-6 border-[#242425]">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-white">
            <Brain className="w-5 h-5 text-blue-600" />
            {t('ai.evaluation')}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full"></div>
            <span className="ml-3 text-gray-300">{t('ai.analyzingData')}</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="mb-6 border-[#242425]">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-white">
          <Brain className="w-5 h-5 text-blue-600" />
          {t('ai.evaluation')}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="prose prose-sm max-w-none">
          {text.split('\n').map((paragraph, index) => {
            if (paragraph.trim() === '') return null;
            
            // Handle bold text with **
            const formattedText = paragraph.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
            
            return (
              <p 
                key={index} 
                className="mb-3 text-gray-300 leading-relaxed"
                dangerouslySetInnerHTML={{ __html: sanitizeHTML(formattedText) }}
              />
            );
          })}
        </div>
        
        <div className="mt-4 p-3 bg-blue-900/20 rounded-lg border-l-4 border-blue-600">
          <div className="flex items-center gap-2 text-blue-400 font-medium mb-1">
            <TrendingUp className="w-4 h-4" />
            {t('ai.tips')}
          </div>
          <p className="text-sm text-blue-300">
            {t('ai.useChatboxTip')}
          </p>
        </div>
      </CardContent>
    </Card>
  );
};
