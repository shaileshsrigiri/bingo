export interface GameState {
  gameId: string;
  player1: Player;
  player2: Player | null;
  currentTurn: 'player1' | 'player2';
  gameStatus: 'waiting' | 'setup' | 'playing' | 'finished';
  lastCalledNumber: number | null;
}

export interface Player {
  id: string;
  name: string;
  grid: number[][]; // 5x5 grid
  marked: boolean[][]; // 5x5 marked grid
  bingoLetters: boolean[]; // [B, I, N, G, O] - 5 letters
  completedLines: CompletedLine[];
}

export interface CompletedLine {
  type: 'row' | 'column' | 'diagonal';
  index: number; // row/col index or 0/1 for diagonals
}

export interface GameMessage {
  type: 'game_created' | 'game_joined' | 'number_called' | 'line_completed' | 'bingo_pressed' | 'game_ended' | 'player_left';
  gameId: string;
  playerId?: string;
  data?: any;
}

export const BINGO = ['B', 'I', 'N', 'G', 'O'];
