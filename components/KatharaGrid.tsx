import React, { useMemo, useRef, useLayoutEffect } from 'react';
import * as d3 from 'd3';
import { KATHARA_STAGES, SIZES, KATHARA_GATES } from '../constants.ts';

interface KatharaGridProps {
  katharaShift: number;
  showTooltip: (event: React.MouseEvent, stageIndex: number) => void;
  showGateTooltip: (event: React.MouseEvent, gateInfo: typeof KATHARA_GATES[0]) => void;
  hideTooltip: () => void;
  onVerseSelect: (surah: number, verse: number) => void;
  customKatharaLabels: string[];
}

const KATHARA_STATIC_LABELS = [
    "Book Intro", "Prophet", "Sign", "Messenger", "Mountain [Purity in Mother]", "Knowledge",
    "Abundance", "Trial", "Submit", "Sacrifice", "Return", "Book Ends"
];

const KatharaGrid: React.FC<KatharaGridProps> = ({ katharaShift, showTooltip, showGateTooltip, hideTooltip, onVerseSelect, customKatharaLabels }) => {
  const svgRef = useRef<SVGSVGElement>(null);
  const hasInitialized = useRef(false);

  const layout = useMemo(() => {
    const nodes = [
      { id: 1, pos: { x: 450, y: 860 }, color: '#dc2626' },
      { id: 2, pos: { x: 450, y: 780 }, color: '#f97316' },
      { id: 3, pos: { x: 250, y: 700 }, color: '#facc15' },
      { id: 4, pos: { x: 650, y: 700 }, color: '#22c55e' },
      { id: 5, pos: { x: 450, y: 580 }, color: '#3b82f6' },
      { id: 6, pos: { x: 250, y: 500 }, color: '#1e40af' },
      { id: 7, pos: { x: 650, y: 500 }, color: '#9333ea' },
      { id: 8, pos: { x: 450, y: 380 }, color: '#facc15' },
      { id: 9, pos: { x: 250, y: 300 }, color: '#e5e7eb' },
      { id: 10, pos: { x: 650, y: 300 }, color: '#1e3a8a' },
      { id: 11, pos: { x: 450, y: 220 }, color: '#6b7280' },
      { id: 12, pos: { x: 450, y: 100 }, color: '#ffffff' },
    ];

    const paths = [
      { from: 1, to: 2 }, { from: 2, to: 5 }, { from: 5, to: 8 }, { from: 8, to: 11 }, { from: 11, to: 12 },
      { from: 3, to: 6 }, { from: 6, to: 9 }, { from: 4, to: 7 }, { from: 7, to: 10 },
      { from: 3, to: 4, isGatePath: true }, { from: 6, to: 7, isGatePath: true }, { from: 9, to: 10, isGatePath: true },
      { from: 2, to: 3 }, { from: 2, to: 4 }, { from: 3, to: 5 }, { from: 4, to: 5 },
      { from: 5, to: 6 }, { from: 5, to: 7 }, { from: 6, to: 8 }, { from: 7, to: 8 },
      { from: 8, to: 9 }, { from: 8, to: 10 }, { from: 9, to: 11 }, { from: 10, to: 11 },
      { from: 9, to: 12 }, { from: 10, to: 12 },
    ].map(p => ({
      id: `path-${p.from}-${p.to}`,
      p1: nodes[p.from - 1].pos, p2: nodes[p.to - 1].pos, isGatePath: p.isGatePath || false,
    }));
    
    const gates = KATHARA_GATES.map(gate => ({...gate}));

    const juzPoints = [];
    const numJuz = 27;
    const nonGatePaths = paths.filter(p => !p.isGatePath);
    if (nonGatePaths.length > 0) {
      for (let i = 0; i < numJuz; i++) {
          const path = nonGatePaths[i % nonGatePaths.length];
          const t = Math.random() * 0.8 + 0.1;
          juzPoints.push({
              id: `juz-${i}`, x: path.p1.x * (1 - t) + path.p2.x * t, y: path.p1.y * (1 - t) + path.p2.y * t,
          });
      }
    }

    return { nodes, paths, gates, juzPoints };
  }, []);

  useLayoutEffect(() => {
    if (!svgRef.current) return;

    const svg = d3.select(svgRef.current);
    const orbData = KATHARA_STAGES.map((stage, i) => ({
        ...stage,
        originalIndex: i,
        color: layout.nodes[i].color,
        isSpecial: stage.stage === 11,
    }));

    const orbs = svg.select<SVGGElement>('#main-nodes')
        .selectAll<SVGGElement, typeof orbData[0]>('g.kathara-orb')
        .data(orbData, d => d.stage);

    const orbsEnter = orbs.enter()
        .append('g')
        .attr('class', 'kathara-orb cursor-pointer');
    
    orbsEnter.append('circle')
      .attr('r', d => d.isSpecial ? 22 : 30)
      .attr('stroke-width', '1.5');
      
    orbsEnter.append('text')
      .attr('text-anchor', 'middle')
      .attr('dominant-baseline', 'middle')
      .attr('font-weight', 'bold')
      .attr('class', 'pointer-events-none');

    orbsEnter.on('mouseenter', (event, d) => showTooltip(event, d.originalIndex))
        .on('mouseleave', hideTooltip)
        .on('click', (event, d) => onVerseSelect(d.surah, d.verse));

    const allOrbs = orbsEnter.merge(orbs);

    allOrbs.select('circle')
        .attr('fill', d => `url(#grad-${d.stage})`)
        .attr('stroke', d => d.isSpecial ? "#4b5563" : "#e5e7eb")
        .attr('opacity', d => d.isSpecial ? 0.7 : 1);

    allOrbs.select('text')
        .text(d => customKatharaLabels[d.originalIndex] || d.stage)
        .attr('fill', d => d.isSpecial ? "#d1d5db" : (d3.color(d.color)?.l || 0) > 0.5 ? "black" : "white")
        .attr('font-size', d => {
            const label = customKatharaLabels[d.originalIndex] || d.stage.toString();
            if (label.length > 8) return "10";
            if (label.length > 5) return "12";
            if (label.length > 2) return "16";
            return d.isSpecial ? "18" : "24";
        });

    const getTargetTransform = (d: typeof orbData[0]) => {
      const targetNodeIndex = (d.originalIndex - katharaShift + 12) % 12;
      const targetPos = layout.nodes[targetNodeIndex].pos;
      return `translate(${targetPos.x}, ${targetPos.y})`;
    };
    
    if (!hasInitialized.current) {
        allOrbs.attr('transform', getTargetTransform);
        hasInitialized.current = true;
    } else {
        allOrbs.transition()
            .duration(800)
            .ease(d3.easeCubicInOut)
            .attr('transform', getTargetTransform);
    }
  }, [katharaShift, layout, showTooltip, hideTooltip, onVerseSelect, customKatharaLabels]);


  return (
    <div className="w-full h-full">
        <svg ref={svgRef} viewBox={`0 0 ${SIZES.width} ${SIZES.height}`} className="w-full h-full">
            <defs>
                {layout.nodes.map(node => (
                    <radialGradient key={`grad-${node.id}`} id={`grad-${node.id}`}>
                        <stop offset="0%" stopColor={node.color} stopOpacity="1" />
                        <stop offset="100%" stopColor={d3.color(node.color)?.darker(2).toString()} stopOpacity="1" />
                    </radialGradient>
                ))}
            </defs>
            
            <g id="grid-paths">
                {layout.paths.map(path => (
                    <line
                        key={path.id} x1={path.p1.x} y1={path.p1.y} x2={path.p2.x} y2={path.p2.y}
                        stroke="#4b5563" strokeWidth="10" strokeLinecap="round"
                    />
                ))}
            </g>

            <g id="static-labels" className="pointer-events-none">
              {layout.nodes.map((node, i) => {
                const isLeft = node.pos.x < SIZES.width / 2;
                const textAnchor = isLeft ? 'end' : 'start';
                const xOffset = isLeft ? -45 : 45;
                const yOffset = (i === 0 || i === 11) ? (isLeft ? -5 : 5) : 0; // Adjust for top/bottom nodes

                // Special case for centered nodes
                let finalAnchor = textAnchor;
                let finalXOffset = xOffset;
                if(node.pos.x === SIZES.width/2){
                    finalAnchor = 'start';
                    finalXOffset = 45;
                }

                return (
                  <text
                    key={`label-${i}`}
                    x={node.pos.x + finalXOffset}
                    y={node.pos.y + yOffset + 5} // Vertically center a bit better
                    textAnchor={finalAnchor}
                    dominantBaseline="middle"
                    fill="#a1a1aa"
                    fontSize="12"
                    fontWeight="medium"
                  >
                    {KATHARA_STATIC_LABELS[i]}
                  </text>
                );
              })}
            </g>

            <g id="juz-points">
                {layout.juzPoints.map(point => (
                    <circle key={point.id} cx={point.x} cy={point.y} r="2" fill="rgba(255, 255, 255, 0.5)" />
                ))}
            </g>
            
            <g id="main-nodes" />
            
            <g id="gates">
                {layout.gates.map(gate => (
                    <g 
                        key={gate.id} className="cursor-pointer"
                        onMouseEnter={(e) => showGateTooltip(e, gate)}
                        onMouseLeave={hideTooltip}
                        onClick={() => onVerseSelect(gate.chapter, gate.verse)}
                    >
                        <circle
                            cx={gate.position.x} cy={gate.position.y} r="15"
                            fill="rgba(239, 68, 68, 0.1)" stroke="#ef4444" strokeWidth="1.5"
                            className="tree-gate-glow"
                        />
                    </g>
                ))}
            </g>
        </svg>
    </div>
  );
};

export default KatharaGrid;