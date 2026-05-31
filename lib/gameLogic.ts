import { GameState, Player, CompletedLine, BINGO } from './types';

export const createPlayer = (id: string, name: string, grid: number[][]): Player => ({
  id,
  name,
  grid,
  marked: Array(5).fill(null).map(() => Array(5).fill(false)),
  bingoLetters: [false, false, false, false, false],
  completedLines: [],
});

export const markNumber = (player: Player, number: number): boolean => {
  for (let i = 0; i < 5; i++) {
    for (let j = 0; j < 5; j++) {
      if (player.grid[i][j] === number) {
        player.marked[i][j] = true;
        return true;
      }
    }
  }
  return false;
};

export const checkLines = (player: Player): CompletedLine[] => {
  const newLines: CompletedLine[] = [];
  const alreadyCompleted = new Set(
    player.completedLines.map(line => `${line.type}-${line.index}`)
  );

  // Check rows
  for (let i = 0; i < 5; i++) {
    const key = `row-${i}`;
    if (!alreadyCompleted.has(key)) {
      if (player.marked[i].every(m => m)) {
        newLines.push({ type: 'row', index: i });
        alreadyCompleted.add(key);
      }
    }
  }

  // Check columns
  for (let j = 0; j < 5; j++) {
    const key = `column-${j}`;
    if (!alreadyCompleted.has(key)) {
      if (Array(5).fill(null).every((_, i) => player.marked[i][j])) {
        newLines.push({ type: 'column', index: j });
        alreadyCompleted.add(key);
      }
    }
  }

  // Check diagonals
  const diag1Key = 'diagonal-0';
  if (!alreadyCompleted.has(diag1Key)) {
    if (Array(5).fill(null).every((_, i) => player.marked[i][i])) {
      newLines.push({ type: 'diagonal', index: 0 });
    }
  }

  const diag2Key = 'diagonal-1';
  if (!alreadyCompleted.has(diag2Key)) {
    if (Array(5).fill(null).every((_, i) => player.marked[i][4 - i])) {
      newLines.push({ type: 'diagonal', index: 1 });
    }
  }

  return newLines;
};

export const updateBingoLetters = (player: Player): boolean => {
  const lineCount = player.completedLines.length;
  for (let i = 0; i < Math.min(lineCount, 5); i++) {
    player.bingoLetters[i] = true;
  }
  return lineCount >= 5;
};

export const hasBingo = (player: Player): boolean => {
  return player.completedLines.length >= 5;
};
