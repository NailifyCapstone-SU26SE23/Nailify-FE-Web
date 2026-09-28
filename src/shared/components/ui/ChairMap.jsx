import React from 'react';

export default function ChairMap({ chairs = [], renderCell }) {
  const rows = ['A', 'B', 'C', 'D', 'E'];
  const cols = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];

  return (
    <div className="flex flex-col gap-4 overflow-x-auto pb-4">
      {/* Column Labels */}
      <div className="flex gap-4 min-w-max mb-2">
        <div className="w-8"></div>
        {cols.map(col => (
          <div key={col} className="w-[90px] text-center font-bold text-pink-700 text-sm">
            {col}
          </div>
        ))}
      </div>

      {rows.map(row => (
        <div key={row} className="flex gap-4 min-w-max">
          {/* Row Label */}
          <div className="flex items-center justify-center w-8 font-bold text-pink-700 text-lg">
            {row}
          </div>
          {/* Grid Columns */}
          {cols.map(col => {
            const cellName = `${col}${row}`;
            const chair = chairs.find(
              c => c.chairName?.trim().toUpperCase() === cellName.toUpperCase()
            );

            return renderCell(cellName, chair);
          })}
        </div>
      ))}
    </div>
  );
}
