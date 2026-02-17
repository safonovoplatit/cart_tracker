import React from 'react';

interface ProgressBarProps {
  current: number;
  max: number;
}

export const ProgressBar: React.FC<ProgressBarProps> = ({ current, max }) => {
  const percentage = Math.min(Math.max((current / max) * 100, 0), 100);
  
  let colorClass = "from-emerald-400 to-emerald-600";
  if (percentage > 75) colorClass = "from-yellow-300 to-yellow-500";
  if (percentage > 90) colorClass = "from-orange-400 to-orange-600";
  if (percentage >= 100) colorClass = "from-red-500 to-red-700";

  return (
    <div className="relative w-full bg-black/10 backdrop-blur-sm rounded-full h-5 shadow-[inset_0_2px_4px_rgba(0,0,0,0.1)] border border-white/20 p-[2px]">
      {/* Liquid Fill */}
      <div 
        className={`h-full rounded-full bg-gradient-to-r ${colorClass} transition-all duration-700 ease-out relative overflow-hidden shadow-sm`} 
        style={{ width: `${percentage}%` }}
      >
        {/* Gloss/Reflection on top of liquid */}
        <div className="absolute top-0 left-0 right-0 h-[40%] bg-white/40 rounded-t-full"></div>
      </div>
    </div>
  );
};