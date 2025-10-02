'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'

type Direction = 'up' | 'down' | 'left' | 'right'
type GameState = {
  board: number[][]
  score: number
}

export default function Game2048() {
  const [board, setBoard] = useState<number[][]>([[]])
  const [score, setScore] = useState(0)
  const [gameOver, setGameOver] = useState(false)
  const [previousStates, setPreviousStates] = useState<GameState[]>([])
  const GRID_SIZE = 4

  // Initialize the board
  const initializeBoard = () => {
    const newBoard = Array(GRID_SIZE).fill(0).map(() => Array(GRID_SIZE).fill(0))
    addNewTile(newBoard)
    addNewTile(newBoard)
    setBoard(newBoard)
    setScore(0)
    setGameOver(false)
    setPreviousStates([])
  }

  // Add a new tile (2 or 4) to a random empty cell
  const addNewTile = (currentBoard: number[][]) => {
    const emptyCells = []
    for (let i = 0; i < GRID_SIZE; i++) {
      for (let j = 0; j < GRID_SIZE; j++) {
        if (currentBoard[i][j] === 0) {
          emptyCells.push({ i, j })
        }
      }
    }

    if (emptyCells.length > 0) {
      const { i, j } = emptyCells[Math.floor(Math.random() * emptyCells.length)]
      currentBoard[i][j] = Math.random() < 0.9 ? 2 : 4
    }
  }

  // Check if game is over
  const isGameOver = (currentBoard: number[][]) => {
    // Check for empty cells
    for (let i = 0; i < GRID_SIZE; i++) {
      for (let j = 0; j < GRID_SIZE; j++) {
        if (currentBoard[i][j] === 0) return false
      }
    }

    // Check for possible merges
    for (let i = 0; i < GRID_SIZE; i++) {
      for (let j = 0; j < GRID_SIZE; j++) {
        const current = currentBoard[i][j]
        // Check right
        if (j < GRID_SIZE - 1 && current === currentBoard[i][j + 1]) return false
        // Check down
        if (i < GRID_SIZE - 1 && current === currentBoard[i + 1][j]) return false
      }
    }

    return true
  }

  // Save current state before making a move
  const saveState = () => {
    setPreviousStates(prev => [...prev, { board: board.map(row => [...row]), score }])
  }

  // Undo last move
  const undoMove = () => {
    if (previousStates.length > 0 && !gameOver) {
      const lastState = previousStates[previousStates.length - 1]
      setBoard(lastState.board)
      setScore(lastState.score)
      setPreviousStates(prev => prev.slice(0, -1))
    }
  }

  // Handle moves
  const move = (direction: Direction) => {
    if (gameOver) return

    const rotateBoard = (board: number[][], times: number): number[][] => {
      let newBoard = board.map(row => [...row])
      for (let i = 0; i < times; i++) {
        newBoard = newBoard[0].map((_, index) =>
          newBoard.map(row => row[row.length - 1 - index])
        )
      }
      return newBoard
    }

    // Save current state before making the move
    saveState()

    let newBoard = [...board.map(row => [...row])]
    let moved = false
    let newScore = score

    // Rotate board to handle all directions using left move logic
    const rotations = {
      'left': 0,
      'up': 1,
      'right': 2,
      'down': 3
    }

    // Rotate board to make all moves work like left move
    newBoard = rotateBoard(newBoard, rotations[direction])

    // Process each row
    for (let i = 0; i < GRID_SIZE; i++) {
      let row = newBoard[i]
      let newRow = row.filter(cell => cell !== 0)
      
      // Merge tiles
      for (let j = 0; j < newRow.length - 1; j++) {
        if (newRow[j] === newRow[j + 1]) {
          newRow[j] *= 2
          newScore += newRow[j]
          newRow.splice(j + 1, 1)
          moved = true
        }
      }

      // Pad with zeros
      while (newRow.length < GRID_SIZE) {
        newRow.push(0)
      }

      // Check if the row changed
      if (newRow.some((cell, index) => cell !== row[index])) {
        moved = true
      }

      newBoard[i] = newRow
    }

    // Rotate back
    newBoard = rotateBoard(newBoard, (4 - rotations[direction]) % 4)

    if (moved) {
      addNewTile(newBoard)
      setBoard(newBoard)
      setScore(newScore)

      if (isGameOver(newBoard)) {
        setGameOver(true)
      }
    } else {
      // If no move was made, remove the saved state
      setPreviousStates(prev => prev.slice(0, -1))
    }
  }

  // Handle keyboard input
  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      switch (e.key) {
        case 'ArrowUp':
          move('up')
          break
        case 'ArrowDown':
          move('down')
          break
        case 'ArrowLeft':
          move('left')
          break
        case 'ArrowRight':
          move('right')
          break
        case 'z':
          if (e.ctrlKey || e.metaKey) {
            undoMove()
          }
          break
      }
    }

    window.addEventListener('keydown', handleKeyPress)
    return () => window.removeEventListener('keydown', handleKeyPress)
  }, [board, score, gameOver])

  // Initialize game on mount
  useEffect(() => {
    initializeBoard()
  }, [])

  // Get cell background color
  const getCellColor = (value: number) => {
    const colors: { [key: number]: string } = {
      0: 'bg-gray-200',
      2: 'bg-gray-100 text-gray-800',
      4: 'bg-yellow-100 text-gray-800',
      8: 'bg-orange-200 text-white',
      16: 'bg-orange-300 text-white',
      32: 'bg-orange-400 text-white',
      64: 'bg-orange-500 text-white',
      128: 'bg-yellow-400 text-white',
      256: 'bg-yellow-500 text-white',
      512: 'bg-yellow-600 text-white',
      1024: 'bg-yellow-700 text-white',
      2048: 'bg-yellow-800 text-white'
    }
    return colors[value] || 'bg-yellow-900 text-white'
  }

  return (
    <div className="flex flex-col items-center justify-start min-h-screen bg-background text-foreground p-4">
      <h1 className="text-4xl font-bold mb-4">2048</h1>
      
      <div className="flex flex-row items-center gap-4 mb-4">
        <Button onClick={initializeBoard}>New Game</Button>
        <Button 
          onClick={undoMove}
          disabled={previousStates.length === 0 || gameOver}
          variant="outline"
        >
          Undo Move
        </Button>
        <span className="font-mono text-xl">Score: {score}</span>
      </div>

      <div className="relative bg-muted p-4 rounded-lg shadow-lg">
        {/* Game Over Overlay */}
        {gameOver && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/30 z-10 rounded-lg">
            <div className="text-center bg-background p-4 rounded-lg shadow-lg">
              <p className="text-2xl font-bold mb-4">Game Over!</p>
              <Button onClick={initializeBoard}>Play Again</Button>
            </div>
          </div>
        )}

        {/* Game Board */}
        <div 
          className="grid gap-2 bg-gray-300 p-2 rounded-lg"
          style={{
            gridTemplateColumns: `repeat(${GRID_SIZE}, 80px)`,
            gridTemplateRows: `repeat(${GRID_SIZE}, 80px)`
          }}
        >
          {board.map((row, i) =>
            row.map((cell, j) => (
              <div
                key={`${i}-${j}`}
                className={`
                  flex items-center justify-center
                  rounded-lg font-bold text-2xl
                  transition-all duration-100
                  ${getCellColor(cell)}
                `}
              >
                {cell !== 0 && cell}
              </div>
            ))
          )}
        </div>
      </div>

      <div className="mt-4 text-sm text-muted-foreground">
        <p>Use arrow keys to move. Press Ctrl/Cmd + Z or click Undo to reverse one move.</p>
      </div>
    </div>
  )
}
