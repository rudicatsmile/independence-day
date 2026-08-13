'use client';
import React from 'react';
import { QuizGame } from '@/components/quiz/QuizGame';
import { MissionLockScreen } from '@/components/missions/MissionLockScreen';
import { useLiveStore } from '@/stores/useLiveStore';

export default function QuizPage() {
  const isMissionsEnabled = useLiveStore((state) => state.isMissionsEnabled);
  if (!isMissionsEnabled) {
    return (
      <div className="max-w-2xl mx-auto">
        <MissionLockScreen />
      </div>
    );
  }
  return <QuizGame />;
}
