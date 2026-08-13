import React, { useState } from 'react';

const DefectImages = ({ defects }) => {
  const [failedImages, setFailedImages] = useState({});

  // Ensure we have exactly 5 slots to match the UI layout, even if data is missing
  const slots = Array.from({ length: 5 }, (_, i) => defects[i] || { name: 'NO DATA', url: null });

  const handleImageError = (url) => {
    if (!url) return;
    setFailedImages((prev) => ({ ...prev, [url]: true }));
  };

  return (
    <div className="flex-1 flex flex-col gap-4">
      {/* Top Row: 3 Images */}
      <div className="grid grid-cols-3 gap-4">
        {slots.slice(0, 3).map((defect, idx) => (
          <div key={idx} className="flex flex-col industrial-border bg-white/5 overflow-hidden">
            <div className="h-[175px] xl:h-[200px] w-full bg-black/40 flex items-center justify-center">
              {defect.url && !failedImages[defect.url] ? (
                <img 
                  src={defect.url} 
                  alt={defect.name}
                  className="w-full h-full object-cover"
                  crossOrigin="anonymous"
                  loading="eager"
                  referrerPolicy="no-referrer"
                  onError={() => handleImageError(defect.url)}
                />
              ) : (
                <div className="flex flex-col items-center gap-2 opacity-20">
                  <svg className="w-10 h-10" fill="currentColor" viewBox="0 0 24 24"><path d="M21 19V5c0-1.1-.9-2-2-2H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c0 1.1.9-2 2-2zM8.5 13.5l2.5 3.01L14.5 12l4.5 6H5l3.5-4.5z"/></svg>
                  <span className="text-[10px] uppercase">No Image Available</span>
                </div>
              )}
            </div>
            <div className="bg-[#0D0731] py-2 text-center font-bold text-[12px] uppercase tracking-wider border-t border-white/10">
              {defect.name}
            </div>
          </div>
        ))}
      </div>
      
      {/* Bottom Row: 2 Images, Centered */}
      <div className="flex justify-center gap-4 px-[12%]">
        {slots.slice(3, 5).map((defect, idx) => (
          <div key={idx} className="flex flex-col industrial-border bg-white/5 overflow-hidden w-1/2">
            <div className="h-[175px] xl:h-[200px] w-full bg-black/40 flex items-center justify-center">
              {defect.url && !failedImages[defect.url] ? (
                <img 
                  src={defect.url} 
                  alt={defect.name}
                  className="w-full h-full object-cover"
                  crossOrigin="anonymous"
                  loading="eager"
                  referrerPolicy="no-referrer"
                  onError={() => handleImageError(defect.url)}
                />
              ) : (
                <div className="flex flex-col items-center gap-2 opacity-20">
                  <svg className="w-10 h-10" fill="currentColor" viewBox="0 0 24 24"><path d="M21 19V5c0-1.1-.9-2-2-2H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c0 1.1.9-2 2-2zM8.5 13.5l2.5 3.01L14.5 12l4.5 6H5l3.5-4.5z"/></svg>
                  <span className="text-[10px] uppercase">No Image Available</span>
                </div>
              )}
            </div>
            <div className="bg-[#0D0731] py-2 text-center font-bold text-[12px] uppercase tracking-wider border-t border-white/10">
              {defect.name}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default DefectImages;
