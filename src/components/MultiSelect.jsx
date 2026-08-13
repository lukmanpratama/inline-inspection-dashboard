import React, { useState, useEffect, useRef } from 'react';

const MultiSelect = ({ label, options, selected, onChange }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const wrapperRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleToggle = (option) => {
    let newSelected;
    if (selected.includes(option)) {
      newSelected = selected.filter(item => item !== option);
    } else {
      newSelected = [...selected, option];
    }
    onChange(newSelected);
  };

  const handleSelectAll = () => {
    if (selected.length === options.length) {
      onChange([]);
    } else {
      onChange([...options]);
    }
  };

  const filteredOptions = (options || []).filter(opt => 
    String(opt).toLowerCase().includes(searchTerm.toLowerCase())
  );

  const displayLabel = (selected || []).length === 0 || (selected || []).length === (options || []).length
    ? `ALL ${label}`
    : `${(selected || []).length} ${label} Selected`;

  return (
    <div className="relative flex-1 min-w-[150px]" ref={wrapperRef}>
      <label className="block text-[10px] text-gray-400 uppercase font-bold mb-1 tracking-wider ml-1">
        {label}
      </label>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full bg-[#1A0F5A] border border-white/20 text-white px-3 py-1.5 text-xs flex justify-between items-center rounded hover:border-accent transition-colors"
      >
        <span className="truncate">{displayLabel}</span>
        <svg className={`w-3 h-3 ml-2 transition-transform ${isOpen ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {isOpen && (
        <div className="absolute top-full left-0 right-0 mt-1 bg-[#1A0F5A] border border-white/20 shadow-2xl z-[60] rounded-lg overflow-hidden animate-fade-in max-h-[300px] flex flex-col">
          <div className="p-2 border-b border-white/10 bg-[#2A1F6A]">
            <input
              type="text"
              placeholder="Search..."
              className="w-full bg-[#0A0520] border border-white/10 text-white text-[10px] px-2 py-1 rounded outline-none focus:border-accent"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              autoFocus
            />
          </div>
          
          <div className="flex-1 overflow-y-auto p-1 custom-scrollbar">
            <button
              onClick={handleSelectAll}
              className="w-full text-left px-2 py-1.5 text-[10px] hover:bg-white/10 flex items-center gap-2 border-b border-white/5 mb-1"
            >
              <div className={`w-3 h-3 rounded border flex items-center justify-center ${selected.length === options.length ? 'bg-accent border-accent' : 'border-white/30'}`}>
                {selected.length === options.length && <svg className="w-2 h-2 text-white" fill="currentColor" viewBox="0 0 20 20"><path d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"/></svg>}
              </div>
              <span className="font-bold">SELECT ALL</span>
            </button>
            
            {filteredOptions.length === 0 ? (
              <div className="px-2 py-3 text-[10px] text-gray-500 text-center">No options found</div>
            ) : (
              filteredOptions.map(opt => (
                <button
                  key={opt}
                  onClick={() => handleToggle(opt)}
                  className="w-full text-left px-2 py-1.5 text-[10px] hover:bg-white/10 flex items-center gap-2 transition-colors"
                >
                  <div className={`w-3 h-3 rounded border flex items-center justify-center ${selected.includes(opt) ? 'bg-blue-600 border-blue-600' : 'border-white/30'}`}>
                    {selected.includes(opt) && <svg className="w-2 h-2 text-white" fill="currentColor" viewBox="0 0 20 20"><path d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"/></svg>}
                  </div>
                  <span>{opt}</span>
                </button>
              ))
            )}
          </div>
          
          <div className="p-2 border-t border-white/10 bg-[#2A1F6A] flex justify-between items-center">
            <span className="text-[9px] text-gray-400">{selected.length} selected</span>
            <button 
              onClick={() => setIsOpen(false)}
              className="bg-accent text-white text-[9px] px-3 py-1 rounded font-bold hover:brightness-110"
            >
              DONE
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default MultiSelect;
