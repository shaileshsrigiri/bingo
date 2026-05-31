'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { initSocket } from '@/lib/socket';

export default function Home() {
  const [playerName, setPlayerName] = useState('');
  const [gameId, setGameId] = useState('');
  const [isCreating, setIsCreating] = useState(false);
  const [isJoining, setIsJoining] = useState(false);
  const router = useRouter();

  const handleCreateGame = () => {
    if (!playerName.trim()) return;

    setIsCreating(true);
    const socket = initSocket();

    socket.emit('create_game', playerName, ({ gameId: newGameId, playerId }: any) => {
      setGameId(newGameId);
      router.push(`/game/${newGameId}`);
    });
  };

  const handleJoinGame = () => {
    if (!playerName.trim() || !gameId.trim()) return;

    setIsJoining(true);
    const socket = initSocket();

    socket.emit('join_game', gameId, playerName, ({ error }: any) => {
      if (error) {
        alert(error);
        setIsJoining(false);
      } else {
        router.push(`/game/${gameId}`);
      }
    });
  };

  return (
    <main className="min-h-screen bg-gradient-to-br from-blue-600 to-purple-600 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg shadow-2xl p-8 max-w-md w-full">
        <h1 className="text-4xl font-bold text-center mb-2 text-gray-800">BINGO</h1>
        <p className="text-center text-gray-600 mb-8">Play online with a friend</p>

        <input
          type="text"
          placeholder="Enter your name"
          value={playerName}
          onChange={(e) => setPlayerName(e.target.value)}
          className="w-full px-4 py-3 border-2 border-gray-400 rounded-lg mb-6 text-black placeholder-gray-500 font-semibold focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          onKeyPress={(e) => e.key === 'Enter' && handleCreateGame()}
        />

        <button
          onClick={handleCreateGame}
          disabled={!playerName.trim() || isCreating}
          className="w-full bg-blue-600 text-white py-2 rounded-lg font-semibold mb-4 hover:bg-blue-700 disabled:bg-gray-400 transition"
        >
          {isCreating ? 'Creating...' : 'Create Game'}
        </button>

        <div className="relative my-6">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-gray-300"></div>
          </div>
          <div className="relative flex justify-center text-sm">
            <span className="px-2 bg-white text-gray-600">OR</span>
          </div>
        </div>

        <input
          type="text"
          placeholder="Game ID"
          value={gameId}
          onChange={(e) => setGameId(e.target.value)}
          className="w-full px-4 py-3 border-2 border-gray-400 rounded-lg mb-4 text-black placeholder-gray-500 font-semibold focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
          onKeyPress={(e) => e.key === 'Enter' && handleJoinGame()}
        />

        <button
          onClick={handleJoinGame}
          disabled={!playerName.trim() || !gameId.trim() || isJoining}
          className="w-full bg-purple-600 text-white py-2 rounded-lg font-semibold hover:bg-purple-700 disabled:bg-gray-400 transition"
        >
          {isJoining ? 'Joining...' : 'Join Game'}
        </button>
      </div>
    </main>
  );
}
