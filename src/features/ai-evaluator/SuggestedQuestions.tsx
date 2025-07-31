
import React from 'react';
import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { MessageCircle } from 'lucide-react';

interface SuggestedQuestionsProps {
  onSelect: (question: string) => void;
}

// Suggested questions will be translated using i18n keys

export const SuggestedQuestions: React.FC<SuggestedQuestionsProps> = ({ onSelect }) => {
  const { t } = useTranslation();
  
  const SUGGESTED_QUESTIONS = [
    t('ai.suggestedQuestions.reduceExpenses', 'How can I reduce my biggest expenses?'),
    t('ai.suggestedQuestions.savingPercentage', 'What percentage should I save from my income?'),
    t('ai.suggestedQuestions.limitCategories', 'Which categories should I limit next month?'),
    t('ai.suggestedQuestions.cashFlowHealth', 'Is my cash flow healthy?'),
    t('ai.suggestedQuestions.savingTips', 'Practical tips to increase saving rate?'),
    t('ai.suggestedQuestions.realisticBudget', 'How to create a realistic budget?')
  ];
  
  return (
    <Card className="w-full mb-6 border-[#242425] overflow-hidden">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-base font-medium text-white">
          <MessageCircle className="w-4 h-4 text-green-500" />
          <span className="text-sm font-medium text-gray-300">{t('ai.frequentlyAskedQuestions', 'Frequently Asked Questions')}</span>
        </CardTitle>
      </CardHeader>
      <CardContent className="pt-0">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          {SUGGESTED_QUESTIONS.map((question, index) => (
            <Button
              key={index}
              variant="ghost"
              size="sm"
              className={`
                w-full h-auto min-h-10 py-2 px-3
                text-left text-xs sm:text-sm text-gray-300
                bg-gray-800/50 hover:bg-gray-700/70
                border border-gray-700 hover:border-gray-600
                transition-colors duration-200 ease-in-out
                hover:scale-[1.02] active:scale-100
                whitespace-normal break-words
                hover:text-white
                flex items-center
              `}
              onClick={() => onSelect(question)}
            >
              <span className="text-left">{question}</span>
            </Button>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};
