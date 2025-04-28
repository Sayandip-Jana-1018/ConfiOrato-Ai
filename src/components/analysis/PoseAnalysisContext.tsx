import React, { createContext, useState, ReactNode } from 'react';

interface PoseAnalysisContextType {
  currentPrediction: { class: string; confidence: number } | null;
  setCurrentPrediction: (prediction: { class: string; confidence: number } | null) => void;
}

// Create context with default values
export const PoseAnalysisContext = createContext<PoseAnalysisContextType>({
  currentPrediction: null,
  setCurrentPrediction: () => {},
});

interface PoseAnalysisProviderProps {
  children: ReactNode;
}

export const PoseAnalysisProvider: React.FC<PoseAnalysisProviderProps> = ({ children }) => {
  const [currentPrediction, setCurrentPrediction] = useState<{ class: string; confidence: number } | null>(null);

  return (
    <PoseAnalysisContext.Provider value={{ currentPrediction, setCurrentPrediction }}>
      {children}
    </PoseAnalysisContext.Provider>
  );
};
