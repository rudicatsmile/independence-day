'use client';
import { TwibbonGenerator } from '@/components/twibbon/TwibbonGenerator';
import { MissionLockScreen } from '@/components/missions/MissionLockScreen';
import { useLiveStore } from '@/stores/useLiveStore';

export default function TwibbonPage() {
  const isMissionsEnabled = useLiveStore((state) => state.isMissionsEnabled);
  if (!isMissionsEnabled) {
    return (
      <div className="max-w-2xl mx-auto">
        <MissionLockScreen />
      </div>
    );
  }
  return <TwibbonGenerator />;
}
