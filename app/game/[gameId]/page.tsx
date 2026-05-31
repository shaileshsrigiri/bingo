'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { initSocket, getSocket } from '@/lib/socket';
import GridSetup from '@/components/GridSetup';
import GameBoard from '@/components/GameBoard';

export default function GamePage() {
  const params = useParams();
  const gameId = params.gameId as string;
  const router = useRouter();

  const [gameState, setGameState] = useState<any>(null);
  const [playerId, setPlayerId] = useState<string | null>(null);
  const [gameStatus, setGameStatus] = useState('setup');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const socket = initSocket();

    // Get player ID from localStorage or create new one
    const storedPlayerId = localStorage.getItem('playerId') || socket.id || 'player-' + Math.random().toString(36).substr(2, 9);
    setPlayerId(storedPlayerId);
    localStorage.setItem('playerId', storedPlayerId);

    // Listen for game events
    socket.on('game_joined', (game) => {
      setGameState(game);
    });

    socket.on('game_started', (data) => {
      setGameState(data.game);
      setGameStatus('playing');
    });

    socket.on('number_called', (data: any) => {
      setGameState((prev: any) => {
        if (!prev) return prev;
        return { ...prev, lastCalledNumber: data.number };
      });
    });

    socket.on('line_completed', (data: any) => {
      setGameState((prev: any) => {
        if (!prev) return prev;
        const updatedState = { ...prev };
        if (updatedState.player1.id === data.playerId) {
          updatedState.player1.completedLines = data.lines;
          updatedState.player1.bingoLetters = new Array(Math.min(data.lines.length, 5)).fill(true).concat(new Array(Math.max(0, 5 - data.lines.length)).fill(false));
        } else if (updatedState.player2.id === data.playerId) {
          updatedState.player2.completedLines = data.lines;
          updatedState.player2.bingoLetters = new Array(Math.min(data.lines.length, 5)).fill(true).concat(new Array(Math.max(0, 5 - data.lines.length)).fill(false));
        }
        return updatedState;
      });
    });

    socket.on('bingo_pressed', (data) => {
      setGameStatus('finished');
      setTimeout(() => {
        alert(`${data.winner === playerId ? 'You' : 'Opponent'} won!`);
        router.push('/');
      }, 1000);
    });

    socket.on('player_left', () => {
      setError('Opponent disconnected');
      setTimeout(() => router.push('/'), 2000);
    });

    return () => {
      socket.off('game_joined');
      socket.off('game_started');
      socket.off('number_called');
      socket.off('line_completed');
      socket.off('bingo_pressed');
      socket.off('player_left');
    };
  }, [router, playerId]);

  if (error) {
    return (
      <div className="min-h-screen bg-red-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-lg shadow-lg p-8 text-center">
          <h1 className="text-2xl font-bold text-red-600 mb-4">Connection Error</h1>
          <p className="text-gray-600">{error}</p>
          <p className="text-sm text-gray-500 mt-2">Redirecting...</p>
        </div>
      </div>
    );
  }

  if (gameStatus === 'setup') {
    return <GridSetup gameId={gameId} playerId={playerId} />;
  }

  if (!gameState) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Waiting for opponent...</p>
        </div>
      </div>
    );
  }

  return <GameBoard gameState={gameState} gameId={gameId} playerId={playerId} />;
}
