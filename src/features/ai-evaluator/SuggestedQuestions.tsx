
import React from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { MessageCircle } from 'lucide-react';

interface SuggestedQuestionsProps {
  onSelect: (question: string) => void;
}

const SUGGESTED_QUESTIONS = [
  "Bagaimana cara mengurangi pengeluaran terbesar saya?",
  "Berapa persen ideal untuk ditabung dari penghasilan?",
  "Kategori mana yang perlu saya batasi bulan depan?",
  "Apakah cash flow saya sudah sehat?",
  "Tips praktis untuk meningkatkan saving rate?",
  "Bagaimana cara membuat budget yang realistis?"
];

export const SuggestedQuestions: React.FC<SuggestedQuestionsProps> = ({ onSelect }) => {
  return (
    <Card className="mb-6">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base">
          <MessageCircle className="w-4 h-4 text-green-600" />
          Pertanyaan yang Sering Ditanyakan
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
          {SUGGESTED_QUESTIONS.map((question, index) => (
            <Button
              key={index}
              variant="outline"
              size="sm"
              className="text-left justify-start h-auto py-2 px-3 text-xs"
              onClick={() => onSelect(question)}
            >
              {question}
            </Button>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};
