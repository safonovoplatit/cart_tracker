import React from 'react';

interface ProgressBarProps {
  current: number;
  max: number;
}

export const ProgressBar: React.FC<ProgressBarProps> = ({ current, max }) => {
  const percentage = Math.min(Math.max((current / max) * 100, 0), 100);
  
  let colorClass = "bg-emerald-500";
  if (percentage > 75) colorClass = "bg-yellow-400";
  if (percentage > 90) colorClass = "bg-orange-500";
  if (percentage >= 100) colorClass = "bg-red-500";

  return (
    <div className="w-full bg-gray-200 rounded-full h-4 dark:bg-gray-700 overflow-hidden shadow-inner">
      <div 
        className={`${colorClass} h-4 rounded-full transition-all duration-500 ease-out`} 
        style={{ width: `${percentage}%` }}
      ></div>
    </div>
  );
};
