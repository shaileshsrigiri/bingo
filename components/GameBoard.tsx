'use client';

import { useState, useEffect } from 'react';
import { getSocket } from '@/lib/socket';
import { BINGO } from '@/lib/types';

interface GameBoardProps {
  gameState: any;
  gameId: string;
  playerId: string | null;
}

export default function GameBoard({ gameState, gameId, playerId }: GameBoardProps) {
  const [calledNumbers, setCalledNumbers] = useState<number[]>([]);
  const currentPlayer = gameState.currentTurn === 'player1' ? gameState.player1 : gameState.player2;
  const isCurrentPlayer = currentPlayer.id === playerId;
  const myPlayer = gameState.player1.id === playerId ? gameState.player1 : gameState.player2;
  const opponent = gameState.player1.id === playerId ? gameState.player2 : gameState.player1;

  const handleCallNumber = (number: number) => {
    if (isCurrentPlayer && !calledNumbers.includes(number)) {
      const socket = getSocket();
      socket?.emit('call_number', gameId, number, () => {
        setCalledNumbers([...calledNumbers, number]);
      });
    }
  };

  const handleBingoPress = () => {
    if (myPlayer.completedLines.length >= 5) {
      const socket = getSocket();
      socket?.emit('bingo_pressed', gameId);
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 p-4">
      <div className="max-w-4xl mx-auto">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          {/* My Board */}
          <div className="bg-white rounded-lg shadow-lg p-4 lg:col-span-1">
            <h2 className="text-xl font-bold text-gray-800 mb-2">Your Board</h2>
            <p className="text-xs text-gray-600 mb-3">{myPlayer.name}</p>

            {/* BINGO Progress */}
            <div className="flex gap-1 mb-3 justify-center">
              {BINGO.map((letter, idx) => (
                <div
                  key={idx}
                  className={`w-8 h-8 flex items-center justify-center rounded font-bold text-xs transition-all ${
                    myPlayer.bingoLetters[idx]
                      ? 'bg-green-500 text-white'
                      : 'bg-gray-300 text-gray-600'
                  }`}
                >
                  {letter}
                </div>
              ))}
            </div>

            {/* Number Grid */}
            <div className="grid grid-cols-5 gap-1 mb-4">
              {myPlayer.grid.map((row: number[], i: number) =>
                row.map((num: number, j: number) => (
                  <div
                    key={`${i}-${j}`}
                    className={`h-10 rounded font-bold text-xs flex items-center justify-center transition-all ${
                      myPlayer.marked[i][j]
                        ? 'bg-green-500 text-white line-through'
                        : 'bg-blue-100 text-blue-900'
                    }`}
                  >
                    {num}
                  </div>
                ))
              )}
            </div>

            {/* Bingo Button */}
            <button
              onClick={handleBingoPress}
              disabled={myPlayer.completedLines.length < 5}
              className={`w-full py-2 rounded font-bold text-sm transition-all ${
                myPlayer.completedLines.length >= 5
                  ? 'bg-red-600 text-white hover:bg-red-700 cursor-pointer'
                  : 'bg-gray-400 text-gray-600 cursor-not-allowed'
              }`}
            >
              BINGO! ({myPlayer.completedLines.length}/5)
            </button>
          </div>

          {/* Center - Current Turn and Number Pad */}
          <div className="bg-white rounded-lg shadow-lg p-4">
            <div className="text-center mb-4">
              <p className={`text-lg font-bold ${isCurrentPlayer ? 'text-green-600' : 'text-blue-600'}`}>
                {isCurrentPlayer ? 'YOUR TURN' : "OPPONENT'S TURN"}
              </p>
              <p className="text-xs text-gray-600 mt-1">{currentPlayer.name}</p>
            </div>

            {gameState.lastCalledNumber !== null && (
              <div className="text-center mb-4">
                <p className="text-xs text-gray-600 mb-2">Last Called</p>
                <div className="w-16 h-16 bg-yellow-400 rounded flex items-center justify-center mx-auto">
                  <span className="text-3xl font-bold text-white">{gameState.lastCalledNumber}</span>
                </div>
              </div>
            )}

            {isCurrentPlayer && (
              <div>
                <p className="text-xs text-gray-600 mb-2 text-center font-semibold">Call a Number</p>
                <div className="grid grid-cols-5 gap-1">
                  {Array.from({ length: 25 }, (_, i) => i + 1).map((num) => (
                    <button
                      key={num}
                      onClick={() => handleCallNumber(num)}
                      disabled={calledNumbers.includes(num)}
                      className={`h-8 rounded font-bold text-xs transition-all ${
                        calledNumbers.includes(num)
                          ? 'bg-gray-400 text-gray-600 cursor-not-allowed'
                          : 'bg-blue-500 text-white hover:bg-blue-600 cursor-pointer'
                      }`}
                    >
                      {num}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Right Side - Hidden (Suspense!) */}
          <div className="hidden lg:block bg-white rounded-lg shadow-lg p-4">
            <p className="text-center text-gray-600 font-semibold">🤐</p>
            <p className="text-center text-gray-500 text-sm mt-4">Their board is hidden...</p>
            <p className="text-center text-gray-500 text-sm">Good luck! 🍀</p>
          </div>
        </div>
      </div>
    </div>
  );
}
