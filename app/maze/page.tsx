'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { Button } from '@/components/ui/button'

// Utility to get the best cell size for the maze to fit viewport
function getCellSize(rows: number, cols: number) {
  // Always return a number, but only use window on client
  if (typeof window === 'undefined') return 20;
  const padding = 48 + 64; // header + controls + some margin
  const maxW = window.innerWidth - 300; // Account for sidebar
  const maxH = window.innerHeight - padding;
  return Math.floor(Math.min(maxW / cols, maxH / rows));
}

type Cell = { top: boolean; right: boolean; bottom: boolean; left: boolean }
type Position = { row: number; col: number }

function generateMaze(rows: number, cols: number): Cell[][] {
  function shuffle<T>(arr: T[]): T[] {
    for (let i = arr.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [arr[i], arr[j]] = [arr[j], arr[i]];
    }
    return arr;
  }

  function carveMaze(): Cell[][] {
    const maze: Cell[][] = Array.from({ length: rows }, () =>
      Array.from({ length: cols }, () => ({
        top: true,
        right: true,
        bottom: true,
        left: true
      }))
    );
    const visited = Array.from({ length: rows }, () => Array(cols).fill(false));
    
    function carve(row: number, col: number) {
      visited[row][col] = true;
      const directions: [number, number, keyof Cell, keyof Cell][] = [
        [-1, 0, 'top', 'bottom'],
        [1, 0, 'bottom', 'top'],
        [0, -1, 'left', 'right'],
        [0, 1, 'right', 'left']
      ];
      for (const [dr, dc, wall, oppWall] of shuffle(directions)) {
        const nr = row + dr;
        const nc = col + dc;
        if (
          nr >= 0 &&
          nr < rows &&
          nc >= 0 &&
          nc < cols &&
          !visited[nr][nc]
        ) {
          maze[row][col][wall] = false;
          maze[nr][nc][oppWall] = false;
          carve(nr, nc);
        }
      }
    }
    carve(0, 0);
    return maze;
  }

  // BFS to check if maze is solvable
  function isSolvable(maze: Cell[][]): boolean {
    const rows = maze.length, cols = maze[0].length;
    const visited = Array.from({ length: rows }, () => Array(cols).fill(false));
    const queue: Position[] = [{ row: 0, col: 0 }];
    while (queue.length) {
      const pos = queue.shift()!;
      if (pos.row === rows - 1 && pos.col === cols - 1) return true;
      if (visited[pos.row][pos.col]) continue;
      visited[pos.row][pos.col] = true;
      const cell = maze[pos.row][pos.col];
      const moves: [number, number, keyof Cell][] = [
        [-1, 0, 'top'],
        [1, 0, 'bottom'],
        [0, -1, 'left'],
        [0, 1, 'right']
      ];
      for (const [dr, dc, wall] of moves) {
        const nr = pos.row + dr, nc = pos.col + dc;
        if (
          nr >= 0 && nr < rows && nc >= 0 && nc < cols &&
          !cell[wall] && !visited[nr][nc]
        ) {
          queue.push({ row: nr, col: nc });
        }
      }
    }
    return false;
  }

  let maze: Cell[][];
  let attempts = 0;
  do {
    maze = carveMaze();
    attempts++;
  } while (!isSolvable(maze) && attempts < 100);
  return maze;
}

export default function MazeGame() {
  const [difficulty, setDifficulty] = useState<'easy' | 'hard' | 'veryhard'>('easy');
  const [maze, setMaze] = useState<Cell[][]>([]);
  const [player, setPlayer] = useState<Position>({ row: 0, col: 0 });
  const [goal, setGoal] = useState<Position>({ row: 7, col: 7 });
  const [won, setWon] = useState(false);
  const [pastPath, setPastPath] = useState<Position[]>([{ row: 0, col: 0 }]);
  const mazeRef = useRef<HTMLDivElement>(null);
  const [cellSize, setCellSize] = useState(() => '20px');
  const animationRef = useRef<number | null>(null);
  const heldDirection = useRef<string | null>(null);
  const lastMoveTime = useRef<number>(0);
  const runningRef = useRef(false);

  useEffect(() => {
    function setupMaze() {
      let rows = 8, cols = 8;
      if (difficulty === 'hard') { rows = cols = 16; }
      if (difficulty === 'veryhard') { rows = cols = 40; }
      if (typeof window !== 'undefined') {
        const newMaze = generateMaze(rows, cols);
        setMaze(newMaze);
        setPlayer({ row: 0, col: 0 });
        setGoal({ row: rows - 1, col: cols - 1 });
        setWon(false);
        setPastPath([{ row: 0, col: 0 }]);
        const size = getCellSize(rows, cols);
        setCellSize(`${size}px`);
      }
    }
    setupMaze();
  }, [difficulty, setMaze, setPlayer, setGoal, setWon, setPastPath, setCellSize]);

  useEffect(() => {
    function handleResize() {
      if (typeof window !== 'undefined' && maze.length && maze[0]?.length) {
        const size = getCellSize(maze.length, maze[0].length);
        setCellSize(`${size}px`);
      }
    }
    if (typeof window !== 'undefined') {
      window.addEventListener('resize', handleResize);
      handleResize();
      return () => window.removeEventListener('resize', handleResize);
    }
    return undefined;
  }, [maze]);

  useEffect(() => {
    setPastPath([{ row: 0, col: 0 }]);
  }, [maze]);

  useEffect(() => {
    setPastPath(path => {
      const last = path[path.length - 1];
      if (last.row !== player.row || last.col !== player.col) {
        return [...path, { row: player.row, col: player.col }];
      }
      return path;
    });
  }, [player]);

  const movePlayer = useCallback((direction: string) => {
    if (won) return;
    setPlayer(prev => {
      const { row, col } = prev;
      const cell = maze[row][col];
      let newRow = row;
      let newCol = col;
      if (direction === 'ArrowUp' && row > 0 && !cell.top && !maze[row-1][col].bottom) newRow--;
      else if (direction === 'ArrowDown' && row < maze.length - 1 && !cell.bottom && !maze[row+1][col].top) newRow++;
      else if (direction === 'ArrowLeft' && col > 0 && !cell.left && !maze[row][col-1].right) newCol--;
      else if (direction === 'ArrowRight' && col < maze[0].length - 1 && !cell.right && !maze[row][col+1].left) newCol++;
      
      if (newRow !== row || newCol !== col) {
        if (newRow === goal.row && newCol === goal.col) setWon(true);
        return { row: newRow, col: newCol };
      }
      return prev;
    });
  }, [maze, goal, won]);

  useEffect(() => {
    const allowed = ['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'];

    function step(ts: number) {
      if (heldDirection.current && runningRef.current) {
        const delay = 150; // Consistent delay for held movements
        if (ts - lastMoveTime.current > delay) {
          movePlayer(heldDirection.current);
          lastMoveTime.current = ts;
        }
        // Schedule next frame before the current movement is processed
        if (runningRef.current) {
          animationRef.current = requestAnimationFrame(step);
        }
      }
    }

    function handleKeyDown(e: KeyboardEvent) {
      if (!allowed.includes(e.key)) return;
      e.preventDefault();
      
      if (heldDirection.current === e.key) return; // Ignore repeat events
      
      // Handle initial key press
      heldDirection.current = e.key;
      movePlayer(e.key); // Immediate first move
      lastMoveTime.current = performance.now();

      // Start animation for held key
      if (!runningRef.current) {
        runningRef.current = true;
        animationRef.current = requestAnimationFrame(step);
      }
    }

    function handleKeyUp(e: KeyboardEvent) {
      if (heldDirection.current === e.key) {
        heldDirection.current = null;
        runningRef.current = false;
        lastMoveTime.current = 0;
        if (animationRef.current) {
          cancelAnimationFrame(animationRef.current);
          animationRef.current = null;
        }
      }
    }

    window.addEventListener('keydown', handleKeyDown, { passive: false });
    window.addEventListener('keyup', handleKeyUp);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
      if (animationRef.current) cancelAnimationFrame(animationRef.current);
    };
  }, [movePlayer]);

  return (
    <div className="flex flex-row items-center justify-center min-h-screen w-screen bg-background text-foreground p-4" style={{ overflow: 'hidden' }}>
      {/* Sidebar controls */}
      <div className="flex flex-col items-start gap-4 mr-8" style={{minWidth: 200}}>
        <h1 className="text-3xl font-bold mb-2">Maze Game</h1>
        <div className="flex flex-col gap-2">
          <Button
            variant={difficulty === 'easy' ? 'default' : 'outline'}
            onClick={() => setDifficulty('easy')}
          >
            Easy
          </Button>
          <Button
            variant={difficulty === 'hard' ? 'default' : 'outline'}
            onClick={() => setDifficulty('hard')}
          >
            Hard
          </Button>
          <Button
            variant={difficulty === 'veryhard' ? 'default' : 'outline'}
            onClick={() => setDifficulty('veryhard')}
          >
            Very Hard
          </Button>
          <Button 
            onClick={() => {
              let rows = 8, cols = 8;
              if (difficulty === 'hard') { rows = cols = 16; }
              if (difficulty === 'veryhard') { rows = cols = 40; }
              const newMaze = generateMaze(rows, cols);
              setMaze(newMaze);
              setPlayer({ row: 0, col: 0 });
              setGoal({ row: rows - 1, col: cols - 1 });
              setWon(false);
              setPastPath([{ row: 0, col: 0 }]);
            }}
          >
            Restart
          </Button>
        </div>
        <div className="mt-4 text-lg text-left" style={{minHeight: 32}}>
          {won ? 'You Win!' : 'Use arrow keys to move.'}
        </div>
      </div>

      {/* Maze grid */}
      {maze.length > 0 && maze[0]?.length > 0 && (
        <div
          ref={mazeRef}
          className="grid"
          style={{
            width: `calc(${cellSize} * ${maze[0].length})`,
            height: `calc(${cellSize} * ${maze.length})`,
            gridTemplateRows: `repeat(${maze.length}, 1fr)`,
            gridTemplateColumns: `repeat(${maze[0].length}, 1fr)`,
            border: '2px solid #333',
            maxWidth: 'calc(100vw - 300px)', // Account for sidebar
            maxHeight: 'calc(100vh - 48px)', // Account for padding
            overflow: 'hidden',
            background: '#fff',
            touchAction: 'none',
            margin: '0 auto',
            boxShadow: '0 2px 16px 0 #0002',
            display: 'grid',
          }}
        >
          {maze.map((rowArr, row) =>
            rowArr.map((cell, col) => {
              const isPlayer = player.row === row && player.col === col;
              const isGoal = goal.row === row && goal.col === col;
              const isPath = pastPath.some(p => p.row === row && p.col === col);
              return (
                <div
                  key={`${row}-${col}`}
                  style={{
                    width: cellSize,
                    height: cellSize,
                    minWidth: cellSize,
                    minHeight: cellSize,
                    maxWidth: cellSize,
                    maxHeight: cellSize,
                    boxSizing: 'border-box',
                    borderTop: cell.top ? '2px solid #333' : '2px solid transparent',
                    borderRight: cell.right ? '2px solid #333' : '2px solid transparent',
                    borderBottom: cell.bottom ? '2px solid #333' : '2px solid transparent',
                    borderLeft: cell.left ? '2px solid #333' : '2px solid transparent',
                    background: isPlayer
                      ? '#fbbf24'
                      : isGoal
                      ? '#22d3ee'
                      : isPath
                      ? '#a7f3d0'
                      : '#fff',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontWeight: 'bold',
                    fontSize: `clamp(12px, 0.6em, 18px)`,
                    transition: 'background 0.1s',
                  }}
                >
                  {isPlayer ? '🙂' : isGoal ? '🏁' : ''}
                </div>
              );
            })
          )}
        </div>
      )}
    </div>
  );
}