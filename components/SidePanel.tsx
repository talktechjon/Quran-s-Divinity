import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { SLICE_DATA, TRIANGLE_POINTS, TOTAL_SLICES, CHAPTER_DETAILS, SECRET_EMOJI_PATTERN, MUQATTAT_CHAPTERS, MUQATTAT_LETTERS, TAFSIR_YOUTUBE_VIDEO_IDS, RECITATION_YOUTUBE_VIDEO_IDS, ENGLISH_RECITATION_YOUTUBE_VIDEO_IDS, MAKKI_ICON_SVG, MADANI_ICON_SVG, KATHARA_PRESET_1, KATHARA_PRESET_2 } from '../constants.ts';
import { getSliceAtPoint } from '../utils.ts';
import { PlaylistType, ChapterWithColor } from '../types.ts';
import PlaylistButtons from './PlaylistButtons.tsx';
import CustomAnimationControls from './CustomAnimationControls.tsx';
import ChapterGeometry from './ChapterGeometry.tsx';
import MarkerAlignment from './MarkerAlignment.tsx';
import CompletionCycleInfo from './CompletionCycleInfo.tsx';

interface SidePanelProps {
  visualizationMode: 'wheel' | 'kathara';
  rotation: number;
  iconDialRotation: number;
  setRotation: (rotation: number | ((prev: number) => number)) => void;
  setIconDialRotation: (rotation: number | ((prev: number) => number)) => void;
  showTooltip: (e: React.MouseEvent, surah: number, verse: number, color: string) => void;
  hideTooltip: () => void;
  isSecretModeActive: boolean;
  secretEmojiShift: number;
  isLowResourceMode: boolean;
  customKatharaLabels: string[];
  setCustomKatharaLabels: (labels: string[]) => void;
  miniKatharaChapters: ChapterWithColor[];
  katharaShift: number;
}

const KatharaCustomization: React.FC<{
  customKatharaLabels: string[];
  setCustomKatharaLabels: (labels: string[]) => void;
}> = ({ customKatharaLabels, setCustomKatharaLabels }) => {
  
  const handleChange = (index: number, value: string) => {
    const newLabels = [...customKatharaLabels];
    newLabels[index] = value;
    setCustomKatharaLabels(newLabels);
  };

  const handlePreset0 = () => {
    setCustomKatharaLabels(Array(12).fill(''));
  };

  const handlePreset1 = () => {
    setCustomKatharaLabels(KATHARA_PRESET_1);
  };

  const handlePreset2 = () => {
    setCustomKatharaLabels(KATHARA_PRESET_2);
  };

  return (
    <div className="space-y-4">
       <div>
        <div className="flex justify-between items-center">
          <h2 className="text-xl font-bold text-cyan-300 tracking-wider">CUSTOM LABELS</h2>
          <div className="flex space-x-2">
            <button
              onClick={handlePreset0}
              className="w-8 h-8 rounded-full bg-gray-700/50 hover:bg-cyan-700/50 text-gray-300 hover:text-white transition-colors duration-200 flex items-center justify-center font-mono text-sm"
              title="Load Preset 0 (Default)"
              aria-label="Load preset 0 which clears all labels"
            >
              0
            </button>
            <button
              onClick={handlePreset1}
              className="w-8 h-8 rounded-full bg-gray-700/50 hover:bg-cyan-700/50 text-gray-300 hover:text-white transition-colors duration-200 flex items-center justify-center font-mono text-sm"
              title="Load Preset 1"
              aria-label="Load preset 1 with custom labels"
            >
              1
            </button>
            <button
              onClick={handlePreset2}
              className="w-8 h-8 rounded-full bg-gray-700/50 hover:bg-cyan-700/50 text-gray-300 hover:text-white transition-colors duration-200 flex items-center justify-center font-mono text-sm"
              title="Load Preset 2"
              aria-label="Load preset 2 with custom labels"
            >
              2
            </button>
          </div>
        </div>
        <div className="w-full h-px bg-cyan-300/50 mt-2"></div>
      </div>
      <div className="grid grid-cols-2 gap-x-4 gap-y-3">
        {Array.from({ length: 12 }).map((_, i) => (
          <div key={i}>
            <label htmlFor={`kathara-label-${i + 1}`} className="text-sm font-medium text-gray-400">
              Position {i + 1}
            </label>
            <input
              id={`kathara-label-${i + 1}`}
              type="text"
              value={customKatharaLabels[i] || ''}
              onChange={(e) => handleChange(i, e.target.value)}
              placeholder={`Default: ${i + 1}`}
              className="mt-1 w-full bg-gray-800 border border-gray-600 rounded px-2 py-1 text-xs text-white placeholder-gray-500 focus:ring-1 focus:ring-cyan-500 focus:outline-none transition-colors"
            />
          </div>
        ))}
      </div>
    </div>
  );
};


const SidePanel: React.FC<SidePanelProps> = ({ 
  visualizationMode, 
  rotation, 
  iconDialRotation, 
  setRotation, 
  setIconDialRotation, 
  showTooltip, 
  hideTooltip, 
  isSecretModeActive, 
  secretEmojiShift, 
  isLowResourceMode,
  customKatharaLabels,
  setCustomKatharaLabels,
  miniKatharaChapters,
  katharaShift,
}) => {
  const [customSequence, setCustomSequence] = useState('');
  const [animationMode, setAnimationMode] = useState<'play' | 'step' | 'off'>('off');
  const [animationIndex, setAnimationIndex] = useState(0);

  const animationFrameId = useRef<number | null>(null);
  const animationTimeoutId = useRef<number | null>(null);
  const rotationRef = useRef(rotation);

  useEffect(() => {
    rotationRef.current = rotation;
  }, [rotation]);
  
  const handleStep = useCallback((direction: 'forward' | 'backward') => {
      if (!customSequence.trim()) return;
      setAnimationMode('step');
      if (direction === 'forward') {
          setAnimationIndex(prev => prev + 1);
      } else {
          setAnimationIndex(prev => Math.max(0, prev - 1));
      }
  }, [customSequence]);

  useEffect(() => {
      const handleKeyDown = (event: KeyboardEvent) => {
          if (document.activeElement?.tagName === 'INPUT') return;
          if (event.key.toLowerCase() === 'q') {
              event.preventDefault();
              handleStep('backward');
          } else if (event.key.toLowerCase() === 'e') {
              event.preventDefault();
              handleStep('forward');
          }
      };
      window.addEventListener('keydown', handleKeyDown);
      return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleStep]);

  const animationSequence = useMemo(() => {
    return (customSequence.match(/\d+/g) || [])
        .map(s => parseInt(s, 10))
        .filter(n => !isNaN(n) && n >= 1 && n <= TOTAL_SLICES);
  }, [customSequence]);


  useEffect(() => {
    const cleanup = () => {
        if (animationFrameId.current) cancelAnimationFrame(animationFrameId.current);
        if (animationTimeoutId.current) clearTimeout(animationTimeoutId.current);
    };

    if (animationMode === 'off') {
        cleanup();
        return;
    }

    const sequence = animationSequence;

    if (sequence.length === 0) {
        setAnimationMode('off');
        return;
    }
    
    let targetIndex = animationIndex;
    if (animationMode === 'play') {
      targetIndex = animationIndex % sequence.length;
    }

    if (targetIndex >= sequence.length || targetIndex < 0) {
        setAnimationMode('off');
        return;
    }

    const currentTargetSliceId = sequence[targetIndex];
    const sliceAngle = 360 / TOTAL_SLICES;
    const targetRotation = -(currentTargetSliceId - 1) * sliceAngle;

    const startRotation = rotationRef.current;
    
    const startSliceId = getSliceAtPoint(1, startRotation).id;
    const distance = Math.abs(currentTargetSliceId - startSliceId);
    const wrappedDistance = Math.min(distance, TOTAL_SLICES - distance);
    
    const BASE_DURATION = 500;
    const DURATION_PER_SLICE = 25;
    const DURATION = BASE_DURATION + wrappedDistance * DURATION_PER_SLICE;
    const PAUSE_DURATION = 700;

    let startTime: number | null = null;
    const easeInOutCubic = (t: number) => t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;

    let rotationDiff = targetRotation - startRotation;
    if (rotationDiff > 180) {
        rotationDiff -= 360;
    } else if (rotationDiff < -180) {
        rotationDiff += 360;
    }

    const animate = (timestamp: number) => {
        if (!startTime) startTime = timestamp;
        const elapsed = timestamp - startTime;
        const progress = Math.min(elapsed / DURATION, 1);
        const easedProgress = easeInOutCubic(progress);

        const newRotation = startRotation + rotationDiff * easedProgress;
        setRotation(newRotation);

        if (progress < 1) {
            animationFrameId.current = requestAnimationFrame(animate);
        } else {
            setRotation(targetRotation);
            if (animationMode === 'play') {
                animationTimeoutId.current = window.setTimeout(() => {
                    setAnimationIndex(prev => prev + 1);
                }, PAUSE_DURATION);
            } else if (animationMode === 'step') {
                setAnimationMode('off');
            }
        }
    };

    animationFrameId.current = requestAnimationFrame(animate);

    return cleanup;
  }, [animationMode, animationIndex, animationSequence, setRotation]);


  const createPlaylist = (type: PlaylistType, chapterIds: number[]) => {
    const videoSource = 
        type === 'recitation' ? RECITATION_YOUTUBE_VIDEO_IDS : 
        type === 'tafsir' ? TAFSIR_YOUTUBE_VIDEO_IDS :
        ENGLISH_RECITATION_YOUTUBE_VIDEO_IDS;
    
    const videoIds = chapterIds
      .map(id => videoSource[id - 1])
      .filter(id => id);

    if (videoIds.length > 0) {
      const url = `https://www.youtube.com/watch_videos?video_ids=${videoIds.join(',')}`;
      window.open(url, '_blank', 'noopener,noreferrer');
    }
  };
  
  const handleWatchSequence = (type: PlaylistType) => {
    const orderedPoints = [
      TRIANGLE_POINTS[1].points[0], // ▼ Downward 3- Wave
      TRIANGLE_POINTS[1].points[1], // ▼ Downward 6- Particle
      TRIANGLE_POINTS[1].points[2], // ▼ Downward 9 Vibration
      TRIANGLE_POINTS[0].points[0], // ▲ Upward 3- Repent
      TRIANGLE_POINTS[0].points[1], // ▲ Upward 6- Purify
      TRIANGLE_POINTS[0].points[2], // ▲ Upward 9- Energy
    ];
    const chapterIds = orderedPoints.map(point => getSliceAtPoint(point.value, rotation).id);
    createPlaylist(type, chapterIds);
  };
  
  const handleSliderChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setAnimationMode('off');
    const sliceId = Number(event.target.value);
    const sliceAngle = 360 / TOTAL_SLICES;
    const newRotation = -(sliceId - 1) * sliceAngle;
    setRotation(newRotation);
  };
  
  if (visualizationMode === 'kathara') {
    return (
       <aside className="w-full lg:w-96 bg-black/30 backdrop-blur-sm p-6 border-t lg:border-l lg:border-t-0 border-gray-700/50 flex flex-col space-y-4 overflow-y-auto">
          <KatharaCustomization
            customKatharaLabels={customKatharaLabels}
            setCustomKatharaLabels={setCustomKatharaLabels}
          />
          <CompletionCycleInfo katharaShift={katharaShift} />
       </aside>
    );
  }

  const currentSliceData = getSliceAtPoint(1, rotation);
  const currentSliceId = currentSliceData.id;
  const chapterInfo = CHAPTER_DETAILS[currentSliceId - 1];
  const isCurrentSliceMuqattat = MUQATTAT_CHAPTERS.has(currentSliceId);
  const muqattatLetters = MUQATTAT_LETTERS.get(currentSliceId);
  const iconSrc = chapterInfo.revelationType === 'Makki' ? MAKKI_ICON_SVG : MADANI_ICON_SVG;

  return (
    <aside className="w-full lg:w-96 bg-black/30 backdrop-blur-sm p-6 border-t lg:border-l lg:border-t-0 border-gray-700/50 flex flex-col space-y-4 overflow-y-auto">
      <div>
        <div className="flex justify-between items-center">
            <h2 className="text-xl font-bold text-cyan-300 tracking-wider">▼🕋▲</h2>
            <PlaylistButtons onWatch={handleWatchSequence} />
        </div>
        <div className="w-full h-px bg-cyan-300/50 mt-2"></div>
      </div>

      <div className="space-y-4">
          <div className="lg:static sticky top-0 z-10 bg-black/30 backdrop-blur-sm pt-1 pb-4 lg:bg-transparent lg:backdrop-blur-none lg:p-0">
            <div className="flex justify-between items-start min-h-[80px]">
              <label htmlFor="rotation-slider" className="font-semibold text-gray-200 pr-2">
                  <div className="flex items-baseline gap-x-2">
                      <img src={iconSrc} alt={chapterInfo.revelationType} title={chapterInfo.revelationType} className="w-5 h-5" />
                      <span className={`text-lg text-cyan-300 ${isCurrentSliceMuqattat ? 'muqattat-glow' : ''}`}>
                          {chapterInfo.number}. {chapterInfo.englishName}
                      </span>
                      {muqattatLetters && (
                          <span 
                              className={`font-mono text-xl ${isCurrentSliceMuqattat ? 'muqattat-glow' : 'text-white'}`}
                              dir="rtl"
                          >
                              {muqattatLetters.join(' · ')}
                          </span>
                      )}
                  </div>
                  <div className="flex gap-x-2 items-center">
                    <span className="text-base font-normal italic text-gray-400">
                        ({chapterInfo.transliteration})
                    </span>
                  </div>
              </label>
              <button
                onClick={() => setRotation(0)}
                className="bg-gray-600 hover:bg-cyan-700 text-white font-bold py-1 px-3 rounded text-sm transition-colors duration-200 flex-shrink-0 mt-1"
                aria-label="Reset rotation"
              >
                Reset
              </button>
            </div>
            <input
                id="rotation-slider"
                type="range"
                min="1"
                max={TOTAL_SLICES}
                step="1"
                value={currentSliceId}
                onChange={handleSliderChange}
                className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer mt-3"
            />
          </div>
          
          <CustomAnimationControls 
             customSequence={customSequence}
             setCustomSequence={setCustomSequence}
             animationMode={animationMode}
             setAnimationMode={setAnimationMode}
             setAnimationIndex={setAnimationIndex}
             createPlaylist={createPlaylist}
             rotation={rotation}
          />

          <div className="pt-4 space-y-6">
             <ChapterGeometry 
                rotation={rotation}
                showTooltip={showTooltip}
                hideTooltip={hideTooltip}
                isLowResourceMode={isLowResourceMode}
             />

             <MarkerAlignment 
                isSecretModeActive={isSecretModeActive}
                rotation={rotation}
                iconDialRotation={iconDialRotation}
                setIconDialRotation={setIconDialRotation}
                secretEmojiShift={secretEmojiShift}
                setCustomSequence={setCustomSequence}
                setAnimationMode={setAnimationMode}
                createPlaylist={createPlaylist}
                miniKatharaChapters={miniKatharaChapters}
                setCustomKatharaLabels={setCustomKatharaLabels}
             />
          </div>
      </div>
    </aside>
  );
};

export default SidePanel;