import React from 'react';

const Header = ({ data }) => {
  const { model, date, factory, cell, po, inspectorType } = data || {};

  return (
    <div className="flex justify-between items-start mb-6">
      <div>
        <h1 className="text-xl font-bold mb-3">100% INLINE INSPECTION ({model || 'N/A'})</h1>
        <div className="grid grid-cols-[120px_1fr] gap-x-2 text-base">
          <span className="text-gray-400">Date</span>
          <span>: {date || 'N/A'}</span>
          <span className="text-gray-400">Factory</span>
          <span>: {factory || 'N/A'}</span>
          <span className="text-gray-400">Cell</span>
          <span>: {cell || 'N/A'}</span>
          <span className="text-gray-400">PO#</span>
          <span>: {po || 'N/A'}</span>
          <span className="text-gray-400">Insp. Type</span>
          <span>: {inspectorType || 'ALL'}</span>
        </div>
      </div>
      <div className="flex flex-col items-end gap-4">
        <div className="bg-[#BDE0FE] text-black px-6 py-1 font-bold text-lg uppercase min-w-[250px] text-center">
          {data.inspector || 'INSPECTOR NAME'}
        </div>
      </div>
    </div>
  );
};

export default Header;
