import React from 'react';

interface StepWizardProps {
  currentStep: number;
}

export const StepWizard: React.FC<StepWizardProps> = ({ currentStep }) => {
  const steps = [
    { num: 1, label: 'زانیاری' }, // Information
    { num: 2, label: 'دەموچاو' }, // Face
    { num: 3, label: 'جلوبەرگ' }, // Cloth
    { num: 4, label: 'ئەنجام' }   // Result
  ];

  return (
    <div className="w-full mb-8">
      <div className="flex justify-between items-center relative">
        <div className="absolute top-1/2 left-0 w-full h-1 bg-slate-200 -z-10 rounded-full"></div>
        <div 
          className="absolute top-1/2 right-0 h-1 bg-brand-500 -z-10 rounded-full transition-all duration-500 ease-in-out"
          style={{ width: `${((currentStep - 1) / (steps.length - 1)) * 100}%` }}
        ></div>
        
        {steps.map((step) => {
          const isActive = currentStep >= step.num;
          const isCurrent = currentStep === step.num;
          
          return (
            <div key={step.num} className="flex flex-col items-center group">
              <div 
                className={`
                  w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm border-4 transition-all duration-300
                  ${isActive 
                    ? 'bg-brand-500 border-brand-200 text-white shadow-lg shadow-brand-500/20 scale-110' 
                    : 'bg-white border-slate-200 text-slate-400'}
                `}
              >
                {step.num}
              </div>
              <span 
                className={`
                  mt-2 text-xs font-medium absolute -bottom-6 w-20 text-center transition-colors duration-300
                  ${isCurrent ? 'text-brand-600 font-bold' : 'text-slate-400'}
                `}
              >
                {step.label}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
};