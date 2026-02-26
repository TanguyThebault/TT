import React from 'react';
import AppLayout from '@/components/AppLayout';
import { GameProvider } from '@/contexts/GameContext';

const Index: React.FC = () => {
  return (
    <GameProvider>
      <AppLayout />
    </GameProvider>
  );
};

export default Index;
