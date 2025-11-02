import React, { useMemo } from 'react';
import * as d3 from 'd3';
import { ChapterWithColor } from '../types.ts';

interface MiniKatharaGridProps {
  chapters: ChapterWithColor[];
}

const MiniKatharaGrid: React.FC<MiniKatharaGridProps> = ({ chapters }) => {
  const layout = useMemo(() => {
    const width = 200;
    const height = 240;
    const centerX = width / 2;

    const nodes = [
      { id: 1, pos: { x: centerX, y: height * 0.95 } }, // Bottom
      { id: 2, pos: { x: centerX, y: height * 0.85 } },
      { id: 3, pos: { x: centerX * 0.2, y: height * 0.75 } },
      { id: 4, pos: { x: centerX * 1.8, y: height * 0.75 } },
      { id: 5, pos: { x: centerX, y: height * 0.6 } },
      { id: 6, pos: { x: centerX * 0.2, y: height * 0.5 } },
      { id: 7, pos: { x: centerX * 1.8, y: height * 0.5 } },
      { id: 8, pos: { x: centerX, y: height * 0.35 } },
      { id: 9, pos: { x: centerX * 0.2, y: height * 0.25 } },
      { id: 10, pos: { x: centerX * 1.8, y: height * 0.25 } },
      { id: 11, pos: { x: centerX, y: height * 0.15 } },
      { id: 12, pos: { x: centerX, y: height * 0.05 } }, // Top
    ];

    const paths = [
      { from: 1, to: 2 }, { from: 2, to: 5 }, { from: 5, to: 8 }, { from: 8, to: 11 }, { from: 11, to: 12 },
      { from: 3, to: 6 }, { from: 6, to: 9 }, { from: 4, to: 7 }, { from: 7, to: 10 },
      { from: 3, to: 4 }, { from: 6, to: 7 }, { from: 9, to: 10 },
      { from: 2, to: 3 }, { from: 2, to: 4 }, { from: 3, to: 5 }, { from: 4, to: 5 },
      { from: 5, to: 6 }, { from: 5, to: 7 }, { from: 6, to: 8 }, { from: 7, to: 8 },
      { from: 8, to: 9 }, { from: 8, to: 10 }, { from: 9, to: 11 }, { from: 10, to: 11 },
    ].map(p => ({
      id: `path-${p.from}-${p.to}`,
      p1: nodes[p.from - 1].pos, p2: nodes[p.to - 1].pos,
    }));
    
    return { nodes, paths, width, height };
  }, []);
  
  const nodeToChapterMap: Record<number, ChapterWithColor | undefined> = {};
  if (chapters.length === 12) {
    chapters.forEach((chapter, index) => {
        nodeToChapterMap[index + 1] = chapter;
    });
  }

  return (
    <div className="w-48 h-full flex items-center justify-center pointer-events-none">
      <svg viewBox={`0 0 ${layout.width} ${layout.height}`} className="w-full h-full">
        <defs>
          {chapters.map(chapter => (
              <radialGradient key={`grad-mini-${chapter.id}`} id={`grad-mini-${chapter.id}`}>
                  <stop offset="0%" stopColor={chapter.color} stopOpacity="1" />
                  <stop offset="100%" stopColor={d3.color(chapter.color)?.darker(2).toString()} stopOpacity="1" />
              </radialGradient>
          ))}
          <filter id="kathara-glow" x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur stdDeviation="3" result="coloredBlur"/>
            <feMerge>
              <feMergeNode in="coloredBlur"/>
              <feMergeNode in="SourceGraphic"/>
            </feMerge>
          </filter>
        </defs>
        <g id="grid-paths">
          {layout.paths.map(path => (
            <line
              key={path.id} x1={path.p1.x} y1={path.p1.y} x2={path.p2.x} y2={path.p2.y}
              stroke="#0891b2" strokeWidth="1" strokeOpacity="0.5"
            />
          ))}
        </g>
        <g id="main-nodes">
            {layout.nodes.map(node => {
                const chapter = nodeToChapterMap[node.id];
                const chapterColor = chapter ? chapter.color : '#0e7490';
                const strokeColor = chapter ? d3.color(chapter.color)?.brighter(1.5).toString() : '#67e8f9';
                const textColor = chapter ? ((d3.color(chapterColor)?.l || 0) > 0.6 ? 'black' : 'white') : 'white';

                return (
                    <g key={node.id} transform={`translate(${node.pos.x}, ${node.pos.y})`} filter="url(#kathara-glow)">
                        <circle r="12" fill={chapter ? `url(#grad-mini-${chapter.id})` : '#0e7490'} stroke={strokeColor} strokeWidth="1" />
                        <text
                          textAnchor="middle" dominantBaseline="middle" fill={textColor}
                          fontSize="10" fontWeight="bold"
                        >
                          {chapter ? chapter.id : ''}
                        </text>
                    </g>
                );
            })}
        </g>
      </svg>
    </div>
  );
};

export default MiniKatharaGrid;