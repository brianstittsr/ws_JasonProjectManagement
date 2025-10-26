import React, { useState } from 'react';
import { PlusCircle } from 'lucide-react';
import { Button } from '../../ui/button';

interface TableBlockProps {
  data: string[][];
  onChange: (data: string[][]) => void;
}

const TableBlock: React.FC<TableBlockProps> = ({ data, onChange }) => {
  const addRow = () => {
    const newRow = Array(data[0].length).fill('');
    onChange([...data, newRow]);
  };

  const addColumn = () => {
    const newData = data.map(row => [...row, '']);
    onChange(newData);
  };

  const updateCell = (rowIndex: number, colIndex: number, value: string) => {
    const newData = [...data];
    newData[rowIndex][colIndex] = value;
    onChange(newData);
  };

  return (
    <div className="overflow-x-auto">
      <table className="w-full border-collapse">
        <tbody>
          {data.map((row, rowIndex) => (
            <tr key={rowIndex}>
              {row.map((cell, colIndex) => (
                <td 
                  key={colIndex} 
                  className={`border border-border p-2 ${
                    rowIndex === 0 ? 'bg-muted font-medium' : ''
                  }`}
                >
                  <input
                    type="text"
                    value={cell}
                    onChange={(e) => updateCell(rowIndex, colIndex, e.target.value)}
                    className="w-full bg-transparent outline-none"
                    placeholder={rowIndex === 0 ? 'Header' : 'Cell'}
                  />
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
      
      <div className="flex gap-2 mt-2">
        <Button variant="outline" size="sm" onClick={addRow}>
          <PlusCircle className="h-4 w-4 mr-1" />
          Add Row
        </Button>
        <Button variant="outline" size="sm" onClick={addColumn}>
          <PlusCircle className="h-4 w-4 mr-1" />
          Add Column
        </Button>
      </div>
    </div>
  );
};

export default TableBlock;
