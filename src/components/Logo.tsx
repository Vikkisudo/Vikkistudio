import React, { useState } from 'react';
import { ShieldCheck } from 'lucide-react';

interface LogoProps {
  className?: string;
  size?: 'sm' | 'md' | 'lg' | 'xl';
}

export const Logo: React.FC<LogoProps> = ({ className = '', size = 'md' }) => {
  const [error, setError] = useState(false);
  const sizeClasses = {
    sm: 'w-8 h-8 rounded-lg',
    md: 'w-12 h-12 rounded-xl',
    lg: 'w-16 h-16 rounded-2xl',
    xl: 'w-24 h-24 rounded-[2.5rem]'
  };

  const iconSizes = {
    sm: 'w-5 h-5',
    md: 'w-7 h-7',
    lg: 'w-9 h-9',
    xl: 'w-14 h-14'
  };

  return (
    <div className={`relative overflow-hidden flex items-center justify-center border-2 border-black dark:border-white/20 ring-4 ring-black/5 ${sizeClasses[size]} ${className}`}>
      {!error ? (
        <img 
          src="/attachment/0" 
          alt="SageVault Logo"
          referrerPolicy="no-referrer"
          className="w-full h-full object-cover"
          onError={() => {
            console.log("Logo failed to load from /attachment/0, trying fallback");
            setError(true);
          }}
        />
      ) : (
        <div className="w-full h-full flex flex-col items-center justify-center bg-gradient-to-br from-purple-600 to-indigo-800 rounded-2xl shadow-xl border-2 border-white/20">
          <div className="relative">
            <ShieldCheck className={`${iconSizes[size]} text-white`} strokeWidth={2.5} />
            <div className="absolute inset-0 flex items-center justify-center">
              <span className="text-white font-black text-[8px] mt-1 opacity-40">SV</span>
            </div>
          </div>
          {size !== 'sm' && (
            <span className={`font-black text-white leading-none ${size === 'xl' ? 'text-sm' : 'text-[10px]'} tracking-tighter uppercase mt-1`}>
              SageVault
            </span>
          )}
        </div>
      )}
    </div>
  );
};
