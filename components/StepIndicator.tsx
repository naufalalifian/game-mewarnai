import React from 'react';
import { AppStep } from '../types';

interface Props {
  currentStep: AppStep;
}

const steps: AppStep[] = ['CATEGORY', 'ITEM', 'QUANTITY', 'RESULTS'];

export const StepIndicator: React.FC<Props> = ({ currentStep }) => {
  // Don't show stepper during loading or on home screen
  if (currentStep === 'GENERATING' || currentStep === 'HOME') return null;

  const getStepIndex = (s: AppStep) => {
    if (s === 'RESULTS') return 3;
    if (s === 'QUANTITY') return 2;
    if (s === 'ITEM') return 1;
    return 0;
  };

  const currentIndex = getStepIndex(currentStep);

  return (
    <div className="flex items-center justify-center space-x-2 md:space-x-4 mb-8">
      {steps.map((step, idx) => {
        const isActive = idx === currentIndex;
        const isCompleted = idx < currentIndex;
        
        return (
          <div key={step} className="flex items-center">
             {idx > 0 && (
                <div className={`w-8 h-1 md:w-16 rounded mr-2 md:mr-4 ${isCompleted ? 'bg-green-400' : 'bg-gray-200'}`} />
             )}
             <div 
               className={`
                 w-8 h-8 md:w-10 md:h-10 rounded-full flex items-center justify-center font-bold text-sm md:text-base
                 ${isActive ? 'bg-blue-500 text-white shadow-lg scale-110' : 
                   isCompleted ? 'bg-green-500 text-white' : 'bg-gray-200 text-gray-400'}
                 transition-all duration-300
               `}
             >
               {idx + 1}
             </div>
          </div>
        );
      })}
    </div>
  );
};