'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'

type CellContent = {
  isMine: boolean
  isRevealed: boolean
  isFlagged: boolean
  neighborMines: number
}

type GameSize = 'small' | 'medium' | 'big'

const GAME_CONFIGS = {
  small: { size: 9, mines: 10 },     // Classic beginner size
  medium: { size: 16, mines: 40 },   // Classic intermediate size
  big: { size: 22, mines: 99 }       // Classic expert size
}

export default function Minesweeper() {
  const [gameSize, setGameSize] = useState<GameSize>('small')
  const [board, setBoard] = useState<CellContent[][]>([])
  const [gameStatus, setGameStatus] = useState<'playing' | 'won' | 'lost'>('playing')
  const [minesLeft, setMinesLeft] = useState(GAME_CONFIGS[gameSize].mines)
  const [firstClick, setFirstClick] = useState(true)
  const cellSize = gameSize === 'small' ? 36 : gameSize === 'medium' ? 32 : 28

  // Initialize board
  const initializeBoard = () => {
    const { size } = GAME_CONFIGS[gameSize]
    const newBoard: CellContent[][] = Array(size).fill(null).map(() =>
      Array(size).fill(null).map(() => ({
        isMine: false,
        isRevealed: false,
        isFlagged: false,
        neighborMines: 0
      }))
    )
    setBoard(newBoard)
    setGameStatus('playing')
    setMinesLeft(GAME_CONFIGS[gameSize].mines)
    setFirstClick(true)
  }

  // Place mines avoiding the first clicked cell
  const placeMines = (firstClickRow: number, firstClickCol: number) => {
    const { size, mines } = GAME_CONFIGS[gameSize]
    const newBoard = [...board]
    let minesPlaced = 0

    while (minesPlaced < mines) {
      const row = Math.floor(Math.random() * size)
      const col = Math.floor(Math.random() * size)

      // Avoid placing mine on first click or its neighbors
      const isTooCloseToFirst = Math.abs(row - firstClickRow) <= 1 && Math.abs(col - firstClickCol) <= 1

      if (!newBoard[row][col].isMine && !isTooCloseToFirst) {
        newBoard[row][col].isMine = true
        minesPlaced++
      }
    }

    // Calculate neighbor mines
    for (let row = 0; row < size; row++) {
      for (let col = 0; col < size; col++) {
        if (!newBoard[row][col].isMine) {
          newBoard[row][col].neighborMines = countNeighborMines(newBoard, row, col)
        }
      }
    }

    setBoard(newBoard)
  }

  // Count neighboring mines
  const countNeighborMines = (board: CellContent[][], row: number, col: number) => {
    let count = 0
    const size = board.length

    for (let i = -1; i <= 1; i++) {
      for (let j = -1; j <= 1; j++) {
        const newRow = row + i
        const newCol = col + j
        if (
          newRow >= 0 && newRow < size &&
          newCol >= 0 && newCol < size &&
          board[newRow][newCol].isMine
        ) {
          count++
        }
      }
    }

    return count
  }

  // Reveal cell and its neighbors if it's empty
  const revealCell = (row: number, col: number) => {
    if (gameStatus !== 'playing') return
    if (board[row][col].isFlagged) return

    const newBoard = [...board]

    if (firstClick) {
      setFirstClick(false)
      placeMines(row, col)
      // Note: We need to reveal the cell after placing mines
      newBoard[row][col].isRevealed = true
      if (newBoard[row][col].neighborMines === 0) {
        revealEmptyNeighbors(newBoard, row, col)
      }
      setBoard(newBoard)
      return
    }

    if (newBoard[row][col].isMine) {
      // Game over - reveal all mines
      newBoard.forEach(row => row.forEach(cell => {
        if (cell.isMine) cell.isRevealed = true
      }))
      setBoard(newBoard)
      setGameStatus('lost')
      return
    }

    newBoard[row][col].isRevealed = true
    if (newBoard[row][col].neighborMines === 0) {
      revealEmptyNeighbors(newBoard, row, col)
    }

    setBoard(newBoard)
    checkWinCondition(newBoard)
  }

  // Reveal empty neighbors recursively
  const revealEmptyNeighbors = (board: CellContent[][], row: number, col: number) => {
    const size = board.length

    for (let i = -1; i <= 1; i++) {
      for (let j = -1; j <= 1; j++) {
        const newRow = row + i
        const newCol = col + j

        if (
          newRow >= 0 && newRow < size &&
          newCol >= 0 && newCol < size &&
          !board[newRow][newCol].isRevealed &&
          !board[newRow][newCol].isFlagged
        ) {
          board[newRow][newCol].isRevealed = true
          if (board[newRow][newCol].neighborMines === 0) {
            revealEmptyNeighbors(board, newRow, newCol)
          }
        }
      }
    }
  }

  // Toggle flag on cell
  const toggleFlag = (e: React.MouseEvent, row: number, col: number) => {
    e.preventDefault()
    if (gameStatus !== 'playing' || board[row][col].isRevealed) return

    const newBoard = [...board]
    newBoard[row][col].isFlagged = !newBoard[row][col].isFlagged
    setBoard(newBoard)
    setMinesLeft(prev => newBoard[row][col].isFlagged ? prev - 1 : prev + 1)
  }

  // Check win condition
  const checkWinCondition = (board: CellContent[][]) => {
    const allNonMinesRevealed = board.every(row =>
      row.every(cell =>
        cell.isMine || cell.isRevealed
      )
    )

    if (allNonMinesRevealed) {
      setGameStatus('won')
      // Flag all remaining mines
      const newBoard = [...board]
      newBoard.forEach(row => row.forEach(cell => {
        if (cell.isMine) cell.isFlagged = true
      }))
      setBoard(newBoard)
      setMinesLeft(0)
    }
  }

  // Initialize game on mount and size change
  useEffect(() => {
    initializeBoard()
  }, [gameSize])

  // Get cell color based on number of neighboring mines
  const getNumberColor = (num: number) => {
    const colors = [
      'text-transparent', // 0
      'text-blue-600',    // 1
      'text-green-600',   // 2
      'text-red-600',     // 3
      'text-purple-600',  // 4
      'text-yellow-600',  // 5
      'text-cyan-600',    // 6
      'text-gray-600',    // 7
      'text-gray-800'     // 8
    ]
    return colors[num]
  }

  return (
    <div className="flex flex-col items-center justify-start min-h-screen bg-background text-foreground p-4">
      <h1 className="text-4xl font-bold mb-4">Minesweeper</h1>
      
      <div className="flex flex-row items-center gap-4 mb-4">
        <Select value={gameSize} onValueChange={(value: GameSize) => setGameSize(value)}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Select size" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="small">Small (9x9)</SelectItem>
            <SelectItem value="medium">Medium (16x16)</SelectItem>
            <SelectItem value="big">Big (22x22)</SelectItem>
          </SelectContent>
        </Select>
        <Button onClick={initializeBoard}>New Game</Button>
        <span className="font-mono text-xl">
          💣 {minesLeft}
        </span>
      </div>

      <div 
        className="relative bg-muted p-4 rounded-lg shadow-lg"
        style={{
          width: GAME_CONFIGS[gameSize].size * cellSize + 32, // Add padding
          height: GAME_CONFIGS[gameSize].size * cellSize + 32
        }}
      >
        {/* Game Status Overlay */}
        {gameStatus !== 'playing' && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/30 z-10 rounded-lg">
            <div className="text-center bg-background p-4 rounded-lg shadow-lg">
              <p className="text-2xl font-bold mb-4">
                {gameStatus === 'won' ? '🎉 You Won!' : '💥 Game Over!'}
              </p>
              <Button onClick={initializeBoard}>Play Again</Button>
            </div>
          </div>
        )}

        {/* Game Board */}
        <div className="grid gap-[1px] bg-gray-300"
          style={{
            gridTemplateColumns: `repeat(${GAME_CONFIGS[gameSize].size}, ${cellSize}px)`
          }}
        >
          {board.map((row, rowIndex) =>
            row.map((cell, colIndex) => (
              <div
                key={`${rowIndex}-${colIndex}`}
                className={`
                  flex items-center justify-center
                  select-none font-bold
                  ${cell.isRevealed
                    ? cell.isMine
                      ? 'bg-red-500'
                      : 'bg-gray-100'
                    : 'bg-gray-200 hover:bg-gray-300 cursor-pointer'
                  }
                  ${!cell.isRevealed && 'active:bg-gray-400'}
                  transition-colors
                `}
                style={{
                  width: cellSize,
                  height: cellSize,
                  fontSize: Math.floor(cellSize * 0.6)
                }}
                onClick={() => revealCell(rowIndex, colIndex)}
                onContextMenu={(e) => toggleFlag(e, rowIndex, colIndex)}
              >
                {cell.isFlagged ? '🚩' :
                  cell.isRevealed ? (
                    cell.isMine ? '💣' :
                    cell.neighborMines > 0 ? (
                      <span className={getNumberColor(cell.neighborMines)}>
                        {cell.neighborMines}
                      </span>
                    ) : ''
                  ) : ''
                }
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  )
}
