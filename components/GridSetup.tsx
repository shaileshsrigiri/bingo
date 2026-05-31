'use client';

import { useState } from 'react';
import { initSocket, getSocket } from '@/lib/socket';

interface GridSetupProps {
  gameId: string;
  playerId: string | null;
}

export default function GridSetup({ gameId, playerId }: GridSetupProps) {
  const [grid, setGrid] = useState<string[]>(Array(25).fill(''));
  const [submitted, setSubmitted] = useState(false);

  const handleInputChange = (index: number, value: string) => {
    const num = parseInt(value) || 0;
    if (num < 1 || num > 25) return;
    const newGrid = [...grid];
    newGrid[index] = value;
    setGrid(newGrid);
  };

  const handleSubmit = () => {
    // Check if all filled
    if (grid.some(val => !val)) {
      alert('Please fill all 25 numbers');
      return;
    }

    // Check for duplicates
    const numbers = grid.map(v => parseInt(v));
    if (new Set(numbers).size !== 25) {
      alert('All numbers must be unique');
      return;
    }

    const gridMatrix = [];
    for (let i = 0; i < 5; i++) {
      gridMatrix.push(numbers.slice(i * 5, (i + 1) * 5));
    }

    const socket = initSocket();
    if (!socket) {
      alert('Failed to connect to server');
      return;
    }

    socket.emit('set_grid', gameId, gridMatrix, (response: any) => {
      setSubmitted(true);
    });
  };

  const fillRandom = () => {
    const numbers = new Set<number>();
    while (numbers.size < 25) {
      numbers.add(Math.floor(Math.random() * 25) + 1);
    }
    setGrid(Array.from(numbers).map(n => n.toString()));
  };

  if (submitted) {
    const copyToClipboard = () => {
      navigator.clipboard.writeText(gameId);
      alert('Game ID copied to clipboard!');
    };

    return (
      <div className="min-h-screen bg-green-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-lg shadow-lg p-8 text-center max-w-md">
          <h1 className="text-2xl font-bold text-green-600 mb-2">Grid Submitted!</h1>
          <p className="text-gray-600 mb-6">Share this Game ID with your friend</p>

          <div className="bg-gray-100 rounded-lg p-4 mb-4 border-2 border-gray-300">
            <p className="text-xs text-gray-600 mb-2">Game ID</p>
            <p className="text-2xl font-bold text-gray-800 font-mono break-all">{gameId}</p>
          </div>

          <button
            onClick={copyToClipboard}
            className="w-full bg-blue-600 text-white py-2 rounded-lg font-semibold mb-6 hover:bg-blue-700 transition"
          >
            Copy Game ID
          </button>

          <hr className="my-4" />

          <p className="text-sm text-gray-600 mb-4">
            <strong>Next steps:</strong><br/>
            1. Send the Game ID to your friend<br/>
            2. Your friend enters it and joins<br/>
            3. They submit their grid<br/>
            4. Game starts automatically!
          </p>

          <p className="text-xs text-gray-500 mb-4">Waiting for opponent...</p>
          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-green-600 mx-auto"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-600 to-purple-600 p-4 flex items-center justify-center">
      <div className="w-full max-w-sm">
        <h1 className="text-3xl font-bold text-white text-center mb-1">Enter Your Numbers</h1>
        <p className="text-white text-center mb-6 opacity-90 text-sm">Fill in 25 unique numbers (1-25)</p>

        <div className="bg-white rounded-lg shadow-2xl p-4">
          <div className="grid grid-cols-5 gap-1.5 mb-4">
            {grid.map((value, index) => (
              <input
                key={index}
                type="number"
                min="1"
                max="25"
                value={value}
                onChange={(e) => handleInputChange(index, e.target.value)}
                placeholder={`${index + 1}`}
                className="w-full h-12 border-2 border-gray-400 rounded text-center font-bold text-base text-black placeholder-gray-500 bg-white focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-300"
              />
            ))}
          </div>

          <div className="flex gap-3 mb-4">
            <button
              onClick={fillRandom}
              className="flex-1 bg-gray-500 text-white py-2 rounded font-semibold text-sm hover:bg-gray-600 transition"
            >
              Random
            </button>
            <button
              onClick={handleSubmit}
              disabled={grid.some(val => !val)}
              className="flex-1 bg-blue-600 text-white py-2 rounded font-semibold text-sm hover:bg-blue-700 disabled:bg-gray-400 transition"
            >
              Submit
            </button>
          </div>

          <div className="text-xs text-gray-600 text-center">
            Filled: {grid.filter(v => v).length} / 25
          </div>
        </div>
      </div>
    </div>
  );
}
