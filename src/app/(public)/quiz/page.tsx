import React from 'react';
import { QuizGame } from '@/components/quiz/QuizGame';

export const metadata = {
  title: 'Kuis Trivia Kemerdekaan RI - Merdeka 81',
  description: 'Uji pengetahuan sejarah Kemerdekaan Indonesia ke-81 dan dapatkan Lencana Raja Trivia Sejarah!',
};

export default function QuizPage() {
  return <QuizGame />;
}
