'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'

type Difficulty = 'Easy' | 'Medium' | 'Hard' | 'Expert'

interface Level {
  id: number
  difficulty: Difficulty
  puzzle: (number | null)[][]
}

const levels: Level[] = [
  {
    id: 1,
    difficulty: 'Easy',
    puzzle: [
      [5, 3, null, null, 7, null, null, null, null],
      [6, null, null, 1, 9, 5, null, null, null],
      [null, 9, 8, null, null, null, null, 6, null],
      [8, null, null, null, 6, null, null, null, 3],
      [4, null, null, 8, null, 3, null, null, 1],
      [7, null, null, null, 2, null, null, null, 6],
      [null, 6, null, null, null, null, 2, 8, null],
      [null, null, null, 4, 1, 9, null, null, 5],
      [null, null, null, null, 8, null, null, 7, 9]
    ]
  },
  {
    id: 2,
    difficulty: 'Easy',
    puzzle: [
      [null, null, 3, null, 2, null, 6, null, null],
      [9, null, null, 3, null, 5, null, null, 1],
      [null, null, 1, 8, null, 6, 4, null, null],
      [null, null, 8, 1, null, 2, 9, null, null],
      [7, null, null, null, null, null, null, null, 8],
      [null, null, 6, 7, null, 8, 2, null, null],
      [null, null, 2, 6, null, 9, 5, null, null],
      [8, null, null, 2, null, 3, null, null, 9],
      [null, null, 5, null, 1, null, 3, null, null]
    ]
  },
  {
    id: 3,
    difficulty: 'Medium',
    puzzle: [
      [null, null, null, 2, 6, null, 7, null, 1],
      [6, 8, null, null, 7, null, null, 9, null],
      [1, 9, null, null, null, 4, 5, null, null],
      [8, 2, null, 1, null, null, null, 4, null],
      [null, null, 4, 6, null, 2, 9, null, null],
      [null, 5, null, null, null, 3, null, 2, 8],
      [null, null, 9, 3, null, null, null, 7, 4],
      [null, 4, null, null, 5, null, null, 3, 6],
      [7, null, 3, null, 1, 8, null, null, null]
    ]
  },
  {
    id: 4,
    difficulty: 'Medium',
    puzzle: [
      [null, 2, null, 6, null, 8, null, null, null],
      [5, 8, null, null, null, 9, 7, null, null],
      [null, null, null, null, 4, null, null, null, null],
      [3, 7, null, null, null, null, 5, null, null],
      [6, null, null, null, null, null, null, null, 4],
      [null, null, 8, null, null, null, null, 1, 3],
      [null, null, null, null, 2, null, null, null, null],
      [null, null, 9, 8, null, null, null, 3, 6],
      [null, null, null, 3, null, 6, null, 9, null]
    ]
  },
  {
    id: 5,
    difficulty: 'Medium',
    puzzle: [
      [null, null, null, null, null, null, 2, null, null],
      [null, 8, null, null, null, 7, null, 9, null],
      [6, null, 2, null, null, null, 5, null, null],
      [null, 7, null, null, 6, null, null, null, null],
      [null, null, null, 9, null, 1, null, null, null],
      [null, null, null, null, 2, null, null, 4, null],
      [null, null, 5, null, null, null, 6, null, 3],
      [null, 9, null, 4, null, null, null, 7, null],
      [null, null, 6, null, null, null, null, null, null]
    ]
  },
  {
    id: 6,
    difficulty: 'Hard',
    puzzle: [
      [8, null, null, null, null, null, null, null, null],
      [null, null, 3, 6, null, null, null, null, null],
      [null, 7, null, null, 9, null, 2, null, null],
      [null, 5, null, null, null, 7, null, null, null],
      [null, null, null, null, 4, 5, 7, null, null],
      [null, null, null, 1, null, null, null, 3, null],
      [null, null, 1, null, null, null, null, 6, 8],
      [null, null, 8, 5, null, null, null, 1, null],
      [null, 9, null, null, null, null, 4, null, null]
    ]
  },
  {
    id: 7,
    difficulty: 'Hard',
    puzzle: [
      [1, null, null, null, null, null, null, null, null],
      [null, null, null, null, null, null, null, null, null],
      [null, null, null, null, null, null, null, null, null],
      [null, null, null, null, null, null, null, null, null],
      [null, null, null, null, null, null, null, null, null],
      [null, null, null, null, null, null, null, null, null],
      [null, null, null, null, null, null, null, null, null],
      [null, null, null, null, null, null, null, null, null],
      [null, null, null, null, null, null, null, null, null]
    ]
  }
]

function isValid(board: (number | null)[][], row: number, col: number, value: number): boolean {
  for (let i = 0; i < 9; i++) {
    if (board[row][i] === value || board[i][col] === value) return false
  }
  const boxRow = Math.floor(row / 3) * 3
  const boxCol = Math.floor(col / 3) * 3
  for (let r = boxRow; r < boxRow + 3; r++) {
    for (let c = boxCol; c < boxCol + 3; c++) {
      if (board[r][c] === value) return false
    }
  }
  return true
}

export default function SudokuGame() {
  const [currentLevel, setCurrentLevel] = useState<Level>(levels[0])
  const [board, setBoard] = useState<(number | null)[][]>(currentLevel.puzzle.map(row => [...row]))
  const [selected, setSelected] = useState<[number, number] | null>(null)
  const [message, setMessage] = useState('')

  const handleCellClick = (row: number, col: number) => {
    if (currentLevel.puzzle[row][col] === null) setSelected([row, col])
  }

  const handleInput = (value: number) => {
    if (!selected) return
    const [row, col] = selected
    if (value < 1 || value > 9) return
    if (!isValid(board, row, col, value)) {
      setMessage('Invalid move!')
      return
    }
    const newBoard = board.map(r => [...r])
    newBoard[row][col] = value
    setBoard(newBoard)
    setSelected(null)
    setMessage('')
  }

  const handleLevelChange = (value: string) => {
    const level = levels.find(l => l.id === parseInt(value))
    if (level) {
      setCurrentLevel(level)
      setBoard(level.puzzle.map(row => [...row]))
      setSelected(null)
      setMessage('')
    }
  }

  const isComplete = board.every(row => row.every(cell => cell !== null))

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-background text-foreground p-4">
      <h1 className="text-4xl font-bold mb-4">Sudoku</h1>
      <div className="mb-6 w-[200px]">
        <Select onValueChange={handleLevelChange} value={currentLevel.id.toString()}>
          <SelectTrigger>
            <SelectValue placeholder="Select Level" />
          </SelectTrigger>
          <SelectContent>
            {levels.map((level) => (
              <SelectItem key={level.id} value={level.id.toString()}>
                Level {level.id} ({level.difficulty})
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <div className="mb-4">{isComplete ? 'Congratulations! Puzzle Complete.' : message}</div>
      <div
        className="grid"
        style={{
          gridTemplateRows: 'repeat(9, 40px)',
          gridTemplateColumns: 'repeat(9, 40px)',
          border: '2px solid #333'
        }}
      >
        {board.map((rowArr, row) =>
          rowArr.map((cell, col) => {
            const isPrefilled = currentLevel.puzzle[row][col] !== null
            const isSelected = selected?.[0] === row && selected?.[1] === col
            return (
              <button
                key={`${row}-${col}`}
                onClick={() => handleCellClick(row, col)}
                className={`border border-gray-400 text-xl font-bold focus:outline-none ${
                  isPrefilled ? 'bg-gray-200' : isSelected ? 'ring-2 ring-blue-500' : 'bg-white'
                }`}
                style={{
                  width: 40,
                  height: 40,
                  borderTop: row % 3 === 0 ? '2px solid #333' : undefined,
                  borderLeft: col % 3 === 0 ? '2px solid #333' : undefined
                }}
                disabled={isPrefilled}
              >
                {cell ?? ''}
              </button>
            )
          })
        )}
      </div>
      {selected && (
        <div className="flex space-x-2 mt-4">
          {[1,2,3,4,5,6,7,8,9].map(n => (
            <Button key={n} size="sm" onClick={() => handleInput(n)}>{n}</Button>
          ))}
        </div>
      )}
      <Button onClick={() => { setBoard(currentLevel.puzzle.map(row => [...row])); setSelected(null); setMessage('') }} className="mt-6">
        Restart
      </Button>
    </div>
  )
}