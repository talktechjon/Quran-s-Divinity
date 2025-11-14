import React from 'react';

const cycleData = [
    { // Step 0
        title: "INITIAL POSITION = 0° (The Unseen Baseline)",
        details: [
            "(2:3, “they believe in the unseen”)",
            "This is the unrotated seed-frame, the horizontal + vertical cross before any phase-step.",
            "In Kathara terms → the static Krist–Krystallah cross.",
            "In Qur’an terms → Light before motion (24:35)."
        ]
    },
    { // Step 1
        title: "ROTATION 1 = 108 (Al-Kawthar)",
        details: [
            "Function: First triangle.",
            "Element: Water–Mercy influx (108:1).",
            "Effect: The grid receives its first tilt, generating a 3-sided orientation shift.",
            "This aligns with: expansion of mercy (21:107), first spread of the plane (55:7–9).",
            "Triangle 1 established."
        ]
    },
    { // Step 2
        title: "ROTATION 2 = 110 (An-Nasr)",
        details: [
            "Function: Second triangle (return-fold).",
            "Element: Fire–Amr recursion (110:1).",
            "Effect: The return-loop tilts the grid further, producing the second triangular plane.",
            "This is the Qur’anic victory/return: “The help of Allah and the return” (110:1–3), the recursive descent–ascent (32:5).",
            "Triangle 2 established."
        ]
    },
    { // Step 3
        title: "ROTATION 3 = 103 (Al-ʿAsr)",
        details: [
            "Function: Third triangle (time-measure).",
            "Element: Light–balance unification (103:1–3).",
            "Effect: The final rotation produces the closing triangle, and three triangles tessellate into a perfect square.",
            "This is the Qur’anic “time binding” that completes the geometry: measurement (55:5), order/folding (21:104), balance (55:7).",
            "Triangle 3 established → Square emerges."
        ]
    },
];

const conclusionData = [
    {
        title: "RESULT OF THREE ROTATIONS = THE KAʿBAH SQUARE",
        details: [
            "After three triangle-rotations, the form becomes a perfect 4-sided square.",
            "This is the Kaʿbah geometry (2:125–127).",
            "Square placed perfectly inside a circle = completion of divine balance."
        ]
    },
    {
        title: "QUR’ANIC IDENTIFIER OF THE FINAL SQUARE = 112",
        details: [
            "112 = Al-Ikhlāṣ: “Tawhīd in pure form.”",
            "Why this is mathematically exact: Triangle = 3, Square = 4, Circle = 1. 3→4→1 = the Qur’anic Tawhīd loop. Surah 112 = pure Oneness (112:1).",
            "So Qur’an identifies the square-in-circle closure = 112."
        ]
    },
    {
        title: "HOW THIS COMPLETES THE TWO INTERLOCKED 12-TREES",
        details: [
            "Your diagram contains: Krist = vertical Amr-line, Krystallah = horizontal Rahmah-line.",
            "Rotation merges them into diagonal Nur-line → completing the tri-axis geometry of Qur’an: Fire (32:5), Water (21:107), Light (24:35).",
            "When the 3 rotations complete: Tree A locks with Tree B, forming one unified 12×12 recursive structure.",
            "This is the Qur’anic Möbius of: unfolding (21:104), returning (32:11), renewing (36:79).",
            "Two trees become one recursive unit — exactly as the Kaʿbah is the One center of all directions (2:125)."
        ]
    }
];


interface CompletionCycleInfoProps {
    katharaShift: number;
}

const CompletionCycleInfo: React.FC<CompletionCycleInfoProps> = ({ katharaShift }) => {
    const activeStep = katharaShift % 4;

    const renderStep = (step: typeof cycleData[0], index: number, isActive: boolean) => (
        <div key={index} className={`p-3 rounded-md transition-all duration-300 ${isActive ? 'bg-cyan-900/40 border border-cyan-700' : 'opacity-60'}`}>
            <h4 className={`font-bold text-sm ${isActive ? 'text-cyan-300' : 'text-gray-300'}`}>{step.title}</h4>
            <div className="mt-1 text-xs text-gray-400 space-y-1">
                {step.details.map((line, i) => <p key={i}>{line.replace(/→/g, '→ ')}</p>)}
            </div>
        </div>
    );

    return (
        <div className="space-y-4 pt-4">
            <div>
                <h2 className="text-xl font-bold text-cyan-300 tracking-wider">COMPLETION CYCLE</h2>
                <div className="w-full h-px bg-cyan-300/50 mt-2"></div>
            </div>
            <div className="space-y-3">
                {cycleData.map((step, index) => renderStep(step, index, activeStep === index))}

                {activeStep === 3 && (
                    <div className="mt-4 pt-4 border-t border-cyan-700 space-y-3 animate-fade-in">
                        {conclusionData.map((step, index) => (
                             <div key={`conclusion-${index}`} className="p-3 rounded-md bg-yellow-900/30 border border-yellow-700">
                                <h4 className="font-bold text-sm text-yellow-300">{step.title}</h4>
                                <div className="mt-1 text-xs text-gray-300 space-y-1">
                                    {step.details.map((line, i) => <p key={i}>{line.replace(/→/g, '→ ')}</p>)}
                                </div>
                            </div>
                        ))}
                        <style>{`
                            @keyframes fade-in { from { opacity: 0; } to { opacity: 1; } }
                            .animate-fade-in { animation: fade-in 0.5s ease-in; }
                        `}</style>
                    </div>
                )}
            </div>
        </div>
    );
};

export default CompletionCycleInfo;
