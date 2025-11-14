import React from 'react';

const KristKrystallahDiagram: React.FC = () => {
  // A simplified, stylized representation of the Krist-Krystallah structure
  const center = { x: 0, y: 0 };
  const size = 60;

  // Outer blue 'Krist' structure (simplified as a cube)
  const kristPoints = [
    { x: center.x - size, y: center.y - size },
    { x: center.x + size, y: center.y - size },
    { x: center.x + size, y: center.y + size },
    { x: center.x - size, y: center.y + size },
  ];
  const kristPaths = [
    // Outer square
    "M -60 -60 L 60 -60 L 60 60 L -60 60 Z",
    // Inner connections
    "M -60 -60 L 0 0",
    "M 60 -60 L 0 0",
    "M 60 60 L 0 0",
    "M -60 60 L 0 0",
  ];

  // Inner red 'Krystallah' structure (simplified as a smaller, rotated cube)
  const krystallahSize = 15;
  const krystallahPoints = [
    { x: center.x, y: center.y - krystallahSize },
    { x: center.x + krystallahSize, y: center.y },
    { x: center.x, y: center.y + krystallahSize },
    { x: center.x - krystallahSize, y: center.y },
  ];
  
  return (
    <g transform="translate(450, 480)" className="pointer-events-none">
      <g opacity="0.4">
        {kristPaths.map((d, i) => (
          <path key={`krist-path-${i}`} d={d} stroke="#38bdf8" strokeWidth="1.5" fill="none" />
        ))}
        {kristPoints.map((p, i) => (
           <circle key={`krist-node-${i}`} cx={p.x} cy={p.y} r="5" fill="#38bdf8" />
        ))}
      </g>
      <g opacity="0.6" transform="rotate(45)">
         <rect x={-krystallahSize} y={-krystallahSize} width={krystallahSize*2} height={krystallahSize*2} stroke="#f87171" strokeWidth="1" fill="none"/>
         {krystallahPoints.map((p, i) => (
            <circle key={`krystallah-node-${i}`} cx={p.x} cy={p.y} r="2" fill="#f87171" />
         ))}
         <circle cx={0} cy={0} r="2" fill="#f87171" />
      </g>
      <text x={-size - 10} y={-size - 10} fill="white" fontSize="10" textAnchor="end" opacity="0.7">Krist</text>
      <text x={krystallahSize + 5} y={krystallahSize + 15} fill="white" fontSize="10" textAnchor="start" opacity="0.7">Krystallah</text>
    </g>
  );
};

export default KristKrystallahDiagram;
