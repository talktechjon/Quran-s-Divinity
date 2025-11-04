import React, { useState, useRef, useCallback, useDeferredValue, useEffect, useMemo } from 'react';
import Visualization from './components/Visualization.tsx';
import SidePanel from './components/SidePanel.tsx';
import FooterMarquee from './components/FooterMarquee.tsx';
import Tooltip from './components/Tooltip.tsx';
import StarryBackground from './components/StarryBackground.tsx';
import VerseFinder from './components/VerseFinder.tsx';
import SettingsPanel from './components/SettingsPanel.tsx';
import KatharaGrid from './components/KatharaGrid.tsx';
import MiniKatharaGrid from './components/MiniKatharaGrid.tsx';
import Tutorial from './components/Tutorial.tsx';
import { VisualizationHandle, TooltipContent, VerseTooltipContent, ChapterTooltipContent, KatharaNodeTooltipContent, KatharaGateTooltipContent, VerseFinderContent, ChapterWithColor } from './types.ts';
import { TOTAL_SLICES, SLICE_DATA, SECRET_EMOJI_PATTERN, CHAPTER_DETAILS, MUQATTAT_LETTERS, KATHARA_STAGES, KATHARA_GATES, CLOCK_POINTS } from './constants.ts';
import { getVerse, getFullSurah, getVerseDetails } from './data/verseData.ts';
import { getSliceAtPoint, getChapterColor } from './utils.ts';
import { useIdle } from './hooks/useIdle.ts';

type LocalTranslationData = Record<string, string[]> | null;

const App: React.FC = () => {
  const [rotation, setRotation] = useState<number>(0);
  const [iconDialRotation, setIconDialRotation] = useState<number>(0);
  const [isSpinning, setIsSpinning] = useState(false);
  const vizRef = useRef<VisualizationHandle>(null);
  const [tooltipContent, setTooltipContent] = useState<TooltipContent | null>(null);
  const [tooltipPosition, setTooltipPosition] = useState({ x: 0, y: 0 });
  const [isSecretModeActive, setIsSecretModeActive] = useState(false);
  const [secretEmojiShift, setSecretEmojiShift] = useState(0);
  const [isVerseFinderVisible, setIsVerseFinderVisible] = useState(false);
  const [verseFinderContent, setVerseFinderContent] = useState<VerseFinderContent>({ type: 'empty' });
  const [visualizationMode, setVisualizationMode] = useState<'wheel' | 'kathara'>('wheel');
  const [isTutorialVisible, setIsTutorialVisible] = useState(false);

  // --- Kathara Grid State ---
  const [katharaShift, setKatharaShift] = useState(0);
  const [isKatharaPulsing, setIsKatharaPulsing] = useState(false);
  const [katharaPulseDirection, setKatharaPulseDirection] = useState<'forward' | 'backward'>('forward');
  const [customKatharaLabels, setCustomKatharaLabels] = useState<string[]>(Array(12).fill(''));


  // --- Low Resource Mode State ---
  const [isLowResourceMode, setIsLowResourceMode] = useState(false);

  // --- Translation Settings State ---
  const [isSettingsVisible, setIsSettingsVisible] = useState(false);
  const [translationMode, setTranslationMode] = useState<'online' | 'local'>('online');
  const [localTranslationData, setLocalTranslationData] = useState<LocalTranslationData>(null);
  const [localFileName, setLocalFileName] = useState<string | null>(null);

  // --- Idle Animation State ---
  const [isIdleAnimationEnabled, setIsIdleAnimationEnabled] = useState(false);
  const isIdle = useIdle(15000, isIdleAnimationEnabled && !isLowResourceMode && visualizationMode === 'wheel');
  const idleIntervalRef = useRef<number | null>(null);
  const idleStartPositionRef = useRef<number | null>(null);
  const animationFrameId = useRef<number | null>(null);
  const rotationRef = useRef(rotation);
  useEffect(() => { rotationRef.current = rotation; }, [rotation]);
  // --- End Idle Animation State ---

  // Show tutorial on first visit
  useEffect(() => {
    const tutorialShown = localStorage.getItem('tutorialShown');
    if (tutorialShown !== 'true') {
      setIsTutorialVisible(true);
    }
  }, []);

  // Defer updates to the most expensive, off-screen component (Footer)
  const deferredRotation = useDeferredValue(rotation);
  
  const miniKatharaChapters = useMemo((): ChapterWithColor[] => {
    if (!isSecretModeActive || visualizationMode !== 'wheel') return [];
    return CLOCK_POINTS.map(point => {
      const slice = getSliceAtPoint(point, rotation);
      return {
        ...slice,
        color: getChapterColor(slice.id),
      }
    });
  }, [rotation, isSecretModeActive, visualizationMode]);

  const animateRotation = useCallback((start: number, end: number, duration: number, onComplete?: () => void) => {
    if (animationFrameId.current) {
      cancelAnimationFrame(animationFrameId.current);
    }
    let startTime: number | null = null;
    const easeInOutCubic = (t: number) => t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
    
    const step = (timestamp: number) => {
      if (!startTime) startTime = timestamp;
      const elapsed = timestamp - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const easedProgress = easeInOutCubic(progress);

      const newRotation = start + (end - start) * easedProgress;
      setRotation(newRotation);

      if (progress < 1) {
        animationFrameId.current = requestAnimationFrame(step);
      } else {
        setRotation(end); 
        if (onComplete) onComplete();
      }
    };
    animationFrameId.current = requestAnimationFrame(step);
  }, []);

  // --- Kathara Grid Handlers ---
  const handleKatharaPlus = useCallback(() => {
      setIsKatharaPulsing(false);
      setKatharaPulseDirection('forward');
      setKatharaShift(prev => (prev + 1) % 12);
  }, []);

  const handleKatharaMinus = useCallback(() => {
      setIsKatharaPulsing(false);
      setKatharaPulseDirection('backward');
      setKatharaShift(prev => (prev - 1 + 12) % 12);
  }, []);

  const handleKatharaPulseToggle = () => {
      setIsKatharaPulsing(prev => !prev);
  };

  const handleKatharaReverse = () => {
    setKatharaPulseDirection(prev => prev === 'forward' ? 'backward' : 'forward');
  };
  
  const handleKatharaReset = () => {
    setIsKatharaPulsing(false);
    setKatharaShift(0);
  };

  // Kathara Pulse Animation Effect
  useEffect(() => {
      if (!isKatharaPulsing || visualizationMode !== 'kathara') {
          return;
      }

      const intervalId = setInterval(() => {
          if (katharaPulseDirection === 'forward') {
              setKatharaShift(prev => (prev + 1) % 12);
          } else {
              setKatharaShift(prev => (prev - 1 + 12) % 12);
          }
      }, 1000);

      return () => clearInterval(intervalId);
  }, [isKatharaPulsing, katharaPulseDirection, visualizationMode]);


  useEffect(() => {
    if (isIdle) {
      // Went idle, start animation
      idleStartPositionRef.current = rotationRef.current;
      if (idleIntervalRef.current) clearInterval(idleIntervalRef.current);
      idleIntervalRef.current = window.setInterval(() => {
        setRotation(prev => prev - (360 / TOTAL_SLICES));
      }, 1000);
    } else {
      // Became active, stop animation and return to start
      if (idleIntervalRef.current) {
        clearInterval(idleIntervalRef.current);
        idleIntervalRef.current = null;
      }
      
      if (idleStartPositionRef.current !== null) {
        const startRotation = rotationRef.current;
        const targetRotation = idleStartPositionRef.current;
        
        let diff = (targetRotation % 360) - (startRotation % 360);
        if (diff > 180) diff -= 360;
        if (diff < -180) diff += 360;
        
        const endRotation = startRotation + diff;
        animateRotation(startRotation, endRotation, 1500, () => {
          idleStartPositionRef.current = null; // Clear start position after returning
        });
      }
    }

    return () => {
      if (idleIntervalRef.current) clearInterval(idleIntervalRef.current);
    };
  }, [isIdle, animateRotation]);

  const handleToggleIdleAnimation = () => {
    setIsIdleAnimationEnabled(prev => !prev);
  };

  const loadSurahInFinder = async (surahNumber: number) => {
    setIsVerseFinderVisible(true);
    setVerseFinderContent({ type: 'loading_surah', number: surahNumber });
    const surahData = await getFullSurah(surahNumber, translationMode, localTranslationData);
    if (surahData) {
        setVerseFinderContent({ type: 'surah', data: surahData });
    } else {
        setVerseFinderContent({ type: 'empty' }); 
    }
  };

  const loadVerseInFinder = async (surah: number, ayah: number) => {
    setIsVerseFinderVisible(true);
    setVerseFinderContent({ type: 'loading_verse', surah, ayah });
    const verseData = await getVerseDetails(surah, ayah, translationMode, localTranslationData);
    if (verseData) {
        setVerseFinderContent({ type: 'single_verse', verse: verseData });
    } else {
        setVerseFinderContent({ type: 'empty' });
    }
  };

  const handleFileLoad = (data: LocalTranslationData, fileName: string) => {
    setLocalTranslationData(data);
    setLocalFileName(fileName);
    setTranslationMode('local');
  };

  const handleKeyDown = (event: React.KeyboardEvent) => {
    if (visualizationMode !== 'wheel') return;
    event.preventDefault();
    if (isSpinning) return;

    if (event.key === ' ') {
      vizRef.current?.spin();
      return;
    }

    if (isSecretModeActive) {
      const patternSize = SECRET_EMOJI_PATTERN.length;
      if (event.key === 'ArrowRight') {
          setSecretEmojiShift(prev => (prev + 1) % patternSize);
      } else if (event.key === 'ArrowLeft') {
          setSecretEmojiShift(prev => (prev - 1 + patternSize) % patternSize);
      }
    } else {
      const sliceAngle = 360 / TOTAL_SLICES;
      if (event.key === 'ArrowRight') {
        setIconDialRotation(prev => prev - sliceAngle);
      } else if (event.key === 'ArrowLeft') {
        setIconDialRotation(prev => prev + sliceAngle);
      }
    }
  };

  const showVerseTooltip = useCallback(async (event: React.MouseEvent, surah: number, verse: number, color: string) => {
    const { englishText, banglaText } = await getVerse(surah, verse, translationMode, localTranslationData);
    const tooltipData: VerseTooltipContent = {
      type: 'verse',
      surah,
      verse,
      color,
      englishText,
      banglaText
    };
    setTooltipContent(tooltipData);
    setTooltipPosition({ x: event.clientX, y: event.clientY });
  }, [translationMode, localTranslationData]);
  
  const showChapterTooltip = useCallback((event: React.MouseEvent, sliceId: number, color: string) => {
      const chapterDetails = CHAPTER_DETAILS.find(c => c.number === sliceId);
      const sliceData = SLICE_DATA.find(s => s.id === sliceId);
      const muqattat = MUQATTAT_LETTERS.get(sliceId);

      if (!chapterDetails || !sliceData) return;
      
      const tooltipData: ChapterTooltipContent = {
          type: 'chapter',
          chapterDetails,
          verseCount: sliceData.blockCount,
          muqattat,
          color,
      };
      setTooltipContent(tooltipData);
      setTooltipPosition({ x: event.clientX, y: event.clientY });
  }, []);

  const showKatharaTooltip = useCallback((event: React.MouseEvent, stageIndex: number) => {
    const stageData = KATHARA_STAGES[stageIndex];
    if (!stageData) return;
    const tooltipData: KatharaNodeTooltipContent = {
        type: 'kathara_node',
        stage: stageData.stage,
        title: stageData.title,
        verseRef: stageData.verseRef,
    };
    setTooltipContent(tooltipData);
    setTooltipPosition({ x: event.clientX, y: event.clientY });
  }, []);

  const showKatharaGateTooltip = useCallback((event: React.MouseEvent, gateInfo: typeof KATHARA_GATES[0]) => {
    const tooltipData: KatharaGateTooltipContent = {
        type: 'kathara_gate',
        title: gateInfo.title,
        verseRef: gateInfo.verseRef,
        chapter: gateInfo.chapter
    };
    setTooltipContent(tooltipData);
    setTooltipPosition({ x: event.clientX, y: event.clientY });
  }, []);


  const hideTooltip = useCallback(() => {
    setTooltipContent(null);
  }, []);

  return (
    <main 
      className="w-full h-screen text-gray-100 font-sans relative flex flex-col overflow-hidden"
    >
      {!isLowResourceMode && <StarryBackground />}
      <div className="absolute top-4 left-4 z-50 flex flex-col gap-y-2">
        <div className="flex flex-wrap gap-2">
          <button 
            onClick={() => setVisualizationMode(p => p === 'wheel' ? 'kathara' : 'wheel')}
            className="w-8 h-8 rounded-full bg-black/20 backdrop-blur-sm border border-cyan-500/30 text-cyan-400 flex items-center justify-center transition-all duration-300 hover:bg-cyan-900/50 hover:border-cyan-400 focus:outline-none focus-visible:ring-2 focus-visible:ring-cyan-300"
            title={visualizationMode === 'wheel' ? "Switch to Kathara Grid" : "Switch to Spinning Wheel"}
            aria-label="Toggle Visualization Mode"
          >
            {visualizationMode === 'wheel' ? (
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
                </svg>
            ) : (
                 <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                    <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
            )}
          </button>
          
          {visualizationMode === 'wheel' && (
            <>
              <button 
                onClick={() => setIsSecretModeActive(p => !p)}
                className="w-8 h-8 rounded-full bg-black/20 backdrop-blur-sm border border-cyan-500/30 text-cyan-400 flex items-center justify-center transition-all duration-300 hover:bg-cyan-900/50 hover:border-cyan-400 focus:outline-none focus-visible:ring-2 focus-visible:ring-cyan-300"
                title={isSecretModeActive ? "Deactivate Secret Pattern" : "Activate Secret Pattern"}
                aria-label="Toggle Secret Emoji Pattern"
              >
                <div className="w-2 h-2 rounded-full bg-cyan-400/70 shadow-[0_0_8px_1px_rgba(0,255,255,0.5)]"></div>
              </button>
              <button 
                onClick={handleToggleIdleAnimation}
                className={`w-8 h-8 rounded-full bg-black/20 backdrop-blur-sm border border-cyan-500/30 flex items-center justify-center transition-all duration-300 hover:bg-cyan-900/50 hover:border-cyan-400 focus:outline-none focus-visible:ring-2 focus-visible:ring-cyan-300 ${isIdleAnimationEnabled ? 'text-cyan-400' : 'text-gray-600'}`}
                title={isIdleAnimationEnabled ? "Disable Idle Animation" : "Enable Idle Animation"}
                aria-label="Toggle Idle Animation"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </button>
            </>
          )}

          {visualizationMode === 'kathara' && (
             <>
                <button
                    onClick={handleKatharaReset}
                    className="w-8 h-8 rounded-full bg-black/20 backdrop-blur-sm border border-cyan-500/30 text-cyan-400 flex items-center justify-center transition-all duration-300 hover:bg-cyan-900/50 hover:border-cyan-400 focus:outline-none focus-visible:ring-2 focus-visible:ring-cyan-300"
                    title="Reset Positions"
                    aria-label="Reset orb positions"
                >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM6.707 5.293a1 1 0 010 1.414L5.414 8H10a1 1 0 110 2H5.414l1.293 1.293a1 1 0 11-1.414 1.414l-3-3a1 1 0 010-1.414l3-3a1 1 0 011.414 0zM10 5a1 1 0 100 2h.01a1 1 0 100-2H10z" clipRule="evenodd" />
                    </svg>
                </button>
                <button
                    onClick={handleKatharaMinus}
                    className="w-8 h-8 rounded-full bg-black/20 backdrop-blur-sm border border-cyan-500/30 text-cyan-400 flex items-center justify-center transition-all duration-300 hover:bg-cyan-900/50 hover:border-cyan-400 focus:outline-none focus-visible:ring-2 focus-visible:ring-cyan-300 font-mono text-xl"
                    title="Shift Backward (-)"
                    aria-label="Shift nodes backward"
                >
                    -
                </button>
                <button
                    onClick={handleKatharaPulseToggle}
                    className={`w-8 h-8 rounded-full bg-black/20 backdrop-blur-sm border flex items-center justify-center transition-all duration-300 hover:bg-cyan-900/50 hover:border-cyan-400 focus:outline-none focus-visible:ring-2 focus-visible:ring-cyan-300 ${isKatharaPulsing ? 'text-cyan-400 border-cyan-400 animate-pulse' : 'text-gray-400 border-cyan-500/30'}`}
                    title={isKatharaPulsing ? "Stop Pulse" : "Start Pulse"}
                    aria-label="Toggle pulse animation"
                >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                        <path d="M10 3.5a1.5 1.5 0 011.5 1.5v1.445A5.002 5.002 0 0116.5 10a1.5 1.5 0 01-3 0 2.002 2.002 0 00-4 0 1.5 1.5 0 01-3 0A5.002 5.002 0 018.5 6.445V5A1.5 1.5 0 0110 3.5zM5 12a1.5 1.5 0 011.5-1.5h7A1.5 1.5 0 0115 12v1.5a1.5 1.5 0 01-1.5 1.5h-7A1.5 1.5 0 015 13.5V12z" />
                    </svg>
                </button>
                <button
                    onClick={handleKatharaReverse}
                    className="w-8 h-8 rounded-full bg-black/20 backdrop-blur-sm border border-cyan-500/30 text-cyan-400 flex items-center justify-center transition-all duration-300 hover:bg-cyan-900/50 hover:border-cyan-400 focus:outline-none focus-visible:ring-2 focus-visible:ring-cyan-300"
                    title="Reverse Pulse Direction"
                    aria-label="Reverse pulse animation direction"
                >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
                    </svg>
                </button>
                <button
                    onClick={handleKatharaPlus}
                    className="w-8 h-8 rounded-full bg-black/20 backdrop-blur-sm border border-cyan-500/30 text-cyan-400 flex items-center justify-center transition-all duration-300 hover:bg-cyan-900/50 hover:border-cyan-400 focus:outline-none focus-visible:ring-2 focus-visible:ring-cyan-300 font-mono text-xl"
                    title="Shift Forward (+)"
                    aria-label="Shift nodes forward"
                >
                    +
                </button>
             </>
          )}

          <button 
            onClick={() => setIsVerseFinderVisible(p => !p)}
            className="w-8 h-8 rounded-full bg-black/20 backdrop-blur-sm border border-cyan-500/30 text-cyan-400 flex items-center justify-center transition-all duration-300 hover:bg-cyan-900/50 hover:border-cyan-400 focus:outline-none focus-visible:ring-2 focus-visible:ring-cyan-300"
            title="Toggle Verse Finder"
            aria-label="Toggle Verse Finder"
          >
             <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </button>
           <button 
            onClick={() => setIsSettingsVisible(p => !p)}
            className="w-8 h-8 rounded-full bg-black/20 backdrop-blur-sm border border-cyan-500/30 text-cyan-400 flex items-center justify-center transition-all duration-300 hover:bg-cyan-900/50 hover:border-cyan-400 focus:outline-none focus-visible:ring-2 focus-visible:ring-cyan-300"
            title="Translation Settings"
            aria-label="Open Translation Settings"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
            </svg>
          </button>
           <button 
            onClick={() => setIsLowResourceMode(p => !p)}
            className={`w-8 h-8 rounded-full bg-black/20 backdrop-blur-sm border border-cyan-500/30 flex items-center justify-center transition-all duration-300 hover:bg-cyan-900/50 hover:border-cyan-400 focus:outline-none focus-visible:ring-2 focus-visible:ring-cyan-300 ${isLowResourceMode ? 'text-cyan-400' : 'text-gray-600'}`}
            title={isLowResourceMode ? "Deactivate Low Resource Mode" : "Activate Low Resource Mode"}
            aria-label="Toggle Low Resource Mode"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M9.59 4.59A2 2 0 1 1 11 8H2"/>
              <path d="M12.59 19.41A2 2 0 1 0 14 16H2"/>
              <path d="M19.59 11.41A2 2 0 1 0 21 8H2"/>
            </svg>
          </button>
          <button 
            onClick={() => setIsTutorialVisible(true)}
            className="w-8 h-8 rounded-full bg-black/20 backdrop-blur-sm border border-cyan-500/30 text-cyan-400 flex items-center justify-center transition-all duration-300 hover:bg-cyan-900/50 hover:border-cyan-400 focus:outline-none focus-visible:ring-2 focus-visible:ring-cyan-300"
            title="Show Tutorial"
            aria-label="Show application guide"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </button>
        </div>
        <SettingsPanel
          isVisible={isSettingsVisible}
          setIsVisible={setIsSettingsVisible}
          mode={translationMode}
          setMode={setTranslationMode}
          onFileLoad={handleFileLoad}
          fileName={localFileName}
        />
        <VerseFinder 
          isVisible={isVerseFinderVisible}
          setIsVisible={setIsVerseFinderVisible}
          content={verseFinderContent}
          setContent={setVerseFinderContent}
          translationMode={translationMode}
          localTranslationData={localTranslationData}
        />
      </div>


      <div className="relative z-10 flex flex-col lg:flex-row flex-1 min-h-0">
        <div 
          className="h-1/3 lg:h-full lg:flex-1 flex items-center justify-center p-4 focus:outline-none focus-visible:ring-2 focus-visible:ring-cyan-500/50"
          tabIndex={0}
          onKeyDown={handleKeyDown}
          role="application"
          aria-label="Interactive dial, click to focus and use arrow keys to rotate or spacebar to spin"
        >
          {visualizationMode === 'wheel' ? (
            <div className="flex w-full h-full items-center justify-center">
              {isSecretModeActive && <MiniKatharaGrid chapters={miniKatharaChapters} />}
              <div className="flex-1 h-full min-w-0">
                <Visualization
                    ref={vizRef}
                    rotation={rotation}
                    iconDialRotation={iconDialRotation}
                    setRotation={setRotation}
                    isSpinning={isSpinning}
                    onSpinStart={() => setIsSpinning(true)}
                    onSpinEnd={() => setIsSpinning(false)}
                    isSecretModeActive={isSecretModeActive}
                    secretEmojiShift={secretEmojiShift}
                    showTooltip={showChapterTooltip}
                    hideTooltip={hideTooltip}
                    onSliceSelect={loadSurahInFinder}
                    isLowResourceMode={isLowResourceMode}
                />
              </div>
            </div>
          ) : (
            <KatharaGrid
                katharaShift={katharaShift}
                showTooltip={showKatharaTooltip}
                showGateTooltip={showKatharaGateTooltip}
                hideTooltip={hideTooltip}
                onVerseSelect={loadVerseInFinder}
                customKatharaLabels={customKatharaLabels}
            />
          )}
        </div>
        <SidePanel 
          visualizationMode={visualizationMode}
          rotation={rotation}
          setRotation={setRotation}
          iconDialRotation={iconDialRotation}
          setIconDialRotation={setIconDialRotation}
          showTooltip={showVerseTooltip}
          hideTooltip={hideTooltip}
          isSecretModeActive={isSecretModeActive}
          secretEmojiShift={secretEmojiShift}
          isLowResourceMode={isLowResourceMode}
          customKatharaLabels={customKatharaLabels}
          setCustomKatharaLabels={setCustomKatharaLabels}
          miniKatharaChapters={miniKatharaChapters}
        />
      </div>
      {visualizationMode === 'wheel' && !isLowResourceMode && <FooterMarquee rotation={deferredRotation} translationMode={translationMode} localTranslationData={localTranslationData} />}
      <Tooltip 
        visible={!!tooltipContent}
        content={tooltipContent}
        position={tooltipPosition}
      />
      <Tutorial isVisible={isTutorialVisible} setIsVisible={setIsTutorialVisible} />
    </main>
  );
};

export default App;