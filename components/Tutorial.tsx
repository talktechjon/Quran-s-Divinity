import React, { useState, useEffect } from 'react';

interface TutorialProps {
  isVisible: boolean;
  setIsVisible: (visible: boolean) => void;
}

const TUTORIAL_STEPS = [
  {
    title: 'Welcome to Key to Light!',
    content: "This is an interactive journey to explore the mathematical, geometric, and linguistic patterns within the Holy Quran. Let's walk through the key features.",
  },
  {
    title: 'The Wheel of Chapters',
    content: "The main wheel represents all 114 chapters (Surahs) of the Quran. The inner ring shows the chapter number, and the outer ring visualizes the number of verses (Ayahs) in that chapter.",
  },
  {
    title: 'Navigating the Wheel',
    content: "You can navigate the wheel in several ways:\n- Use the Left/Right arrow keys.\n- Use the slider in the side panel.\n- Click directly on a chapter slice to jump to it.\n- Click the center dial or press Spacebar to spin to a random chapter!",
  },
  {
    title: 'The Side Panel',
    content: "The panel on the right provides detailed information. It shows data about the currently selected chapter, displays geometric patterns based on key verses, and allows you to create custom animation sequences.",
  },
  {
    title: 'Kathara Grid View',
    content: "Click the grid icon in the top-left to switch to the Kathara Grid. This view maps Quranic concepts onto a mystical 'Tree of Life' structure. Use the controls to shift the positions and explore different alignments.",
  },
  {
    title: 'Verse Finder & Reader',
    content: "Click the magnifying glass icon to open the Verse Finder. You can search for specific verses (e.g., '2:255'), full chapters ('112'), or ranges ('97:1-5'). The panel becomes a reader with audio playback.",
  },
  {
    title: 'Secret Modes & Settings',
    content: "There are hidden patterns to discover! Try activating the 'Secret Pattern' button. You can also customize your experience in the settings, such as using a local translation file or enabling low-resource mode for better performance.",
  },
  {
    title: 'Exploration Complete',
    content: "You're now ready to explore. May your journey be filled with insight and wonder. Click 'Finish' to begin.",
  },
];

const Tutorial: React.FC<TutorialProps> = ({ isVisible, setIsVisible }) => {
  const [step, setStep] = useState(0);
  const [dontShowAgain, setDontShowAgain] = useState(false);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        handleFinish();
      }
    };
    if (isVisible) {
      window.addEventListener('keydown', handleKeyDown);
    }
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isVisible]);

  const handleFinish = () => {
    if (dontShowAgain) {
      localStorage.setItem('tutorialShown', 'true');
    }
    setStep(0);
    setIsVisible(false);
  };

  const handleNext = () => {
    if (step < TUTORIAL_STEPS.length - 1) {
      setStep(s => s + 1);
    } else {
      handleFinish();
    }
  };
  
  const handlePrev = () => {
    if (step > 0) {
      setStep(s => s - 1);
    }
  };

  if (!isVisible) return null;

  const currentStep = TUTORIAL_STEPS[step];

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-[100] flex items-center justify-center p-4" role="dialog" aria-modal="true" aria-labelledby="tutorial-title">
      <div className="w-full max-w-lg bg-gray-900 border border-cyan-500/50 rounded-lg shadow-2xl flex flex-col animate-fade-in">
        <div className="p-5 border-b border-cyan-500/20 flex justify-between items-center">
          <h2 id="tutorial-title" className="text-xl font-bold text-cyan-300">Application Guide</h2>
          <button onClick={handleFinish} className="text-gray-400 hover:text-white" aria-label="Close tutorial">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
          </button>
        </div>

        <div className="p-6 flex-1 min-h-[200px] text-gray-300">
          <h3 className="text-lg font-semibold text-white mb-3">{currentStep.title}</h3>
          <p className="text-base whitespace-pre-line">{currentStep.content}</p>
        </div>

        <div className="p-4 border-t border-cyan-500/20 flex justify-between items-center">
          <div className="flex items-center">
            {step === 0 && (
              <>
                <input
                  id="dont-show-again"
                  type="checkbox"
                  checked={dontShowAgain}
                  onChange={(e) => setDontShowAgain(e.target.checked)}
                  className="w-4 h-4 text-cyan-600 bg-gray-700 border-gray-600 rounded focus:ring-cyan-500"
                />
                <label htmlFor="dont-show-again" className="ml-2 text-sm text-gray-400">Don't show this again</label>
              </>
            )}
          </div>
          <div className="flex items-center gap-x-3">
            {step > 0 && (
              <button
                onClick={handlePrev}
                className="px-4 py-2 bg-gray-700/50 hover:bg-gray-600/50 text-gray-300 hover:text-white rounded-md transition-colors"
              >
                Previous
              </button>
            )}
            <button
              onClick={handleNext}
              className="px-4 py-2 bg-cyan-600 hover:bg-cyan-700 text-white font-bold rounded-md transition-colors"
            >
              {step === TUTORIAL_STEPS.length - 1 ? 'Finish' : 'Next'}
            </button>
          </div>
        </div>
      </div>
       <style>{`
        @keyframes fade-in {
          from { opacity: 0; transform: scale(0.95); }
          to { opacity: 1; transform: scale(1); }
        }
        .animate-fade-in {
          animation: fade-in 0.3s ease-out forwards;
        }
      `}</style>
    </div>
  );
};

export default Tutorial;
