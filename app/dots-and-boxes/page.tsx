'use client'

import { useState, useCallback, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'

const DOT_SIZE = 8
const LINE_WIDTH = 4
const SPACING = 50

const COLORS = {
  player1: '#ff0000',
  player2: '#0000ff',
  dot: '#000000',
  line: '#666666',
  hoverLine: '#999999'
} as const

const GRID_SIZES = {
  small: 4,
  medium: 6,
  large: 8
} as const

type GridSize = keyof typeof GRID_SIZES
type GameMode = 'pvp' | 'pvc'
type Player = 'player1' | 'player2'

interface Line {
  start: [number, number]
  end: [number, number]
  owner: Player
}

interface Box {
  owner: Player | null
  lines: Line[]
}

// eslint-disable-next-line react-hooks/exhaustive-deps
export default function DotsAndBoxes() {
  const [gameMode, setGameMode] = useState<GameMode>('pvp')
  const [gridSize, setGridSize] = useState<GridSize>('medium')
  const [currentPlayer, setCurrentPlayer] = useState<Player>('player1')
  const [lines, setLines] = useState<Line[]>([])
  const [boxes, setBoxes] = useState<Box[]>([])
  const [scores, setScores] = useState({ player1: 0, player2: 0 })
  const [hoveredLine, setHoveredLine] = useState<Line | null>(null)
  const [gameOver, setGameOver] = useState(false)

  // Initialize boxes
  useEffect(() => {
    const size = GRID_SIZES[gridSize]
    const initialBoxes: Box[] = []
    for (let i = 0; i < (size - 1) * (size - 1); i++) {
      initialBoxes.push({
        owner: null,
        lines: []
      })
    }
    setBoxes(initialBoxes)
  }, [gridSize])

  // Check if a line exists between two points
  const lineExists = useCallback((start: [number, number], end: [number, number]): Line | undefined => {
    return lines.find(line => 
      (line.start[0] === start[0] && line.start[1] === start[1] && 
       line.end[0] === end[0] && line.end[1] === end[1]) ||
      (line.start[0] === end[0] && line.start[1] === end[1] && 
       line.end[0] === start[0] && line.end[1] === start[1])
    )
  }, [lines])

  // Check if a box is completed
  const checkBox = useCallback((row: number, col: number): boolean => {
    const topLine = lineExists([col, row], [col + 1, row])
    const rightLine = lineExists([col + 1, row], [col + 1, row + 1])
    const bottomLine = lineExists([col, row + 1], [col + 1, row + 1])
    const leftLine = lineExists([col, row], [col, row + 1])
    
    return !!(topLine && rightLine && bottomLine && leftLine)
  }, [lineExists])

  // Make a move (for both human and computer players)
  const makeMove = useCallback((start: [number, number], end: [number, number]) => {
    const existingLine = lineExists(start, end)
    if (gameOver || existingLine) return

    const newLine = { start, end, owner: currentPlayer }
    const newLines = [...lines, newLine]
    setLines(newLines)

    // Check if any boxes were completed
    let boxesCompleted = false
    const newBoxes = [...boxes]
    const size = GRID_SIZES[gridSize]
    
    // Check both potential boxes that could be completed by this line
    const isHorizontal = start[1] === end[1]
    const row = start[1]
    const col = Math.min(start[0], end[0])

    if (isHorizontal) {
      // Check box above
      if (row > 0) {
        const topLine = lineExists([col, row - 1], [col + 1, row - 1])
        const rightLine = lineExists([col + 1, row - 1], [col + 1, row])
        const leftLine = lineExists([col, row - 1], [col, row])
        
        if (topLine && rightLine && leftLine && (start[1] === row)) {
          boxesCompleted = true
          const boxIndex = (row - 1) * (size - 1) + col
          newBoxes[boxIndex] = {
            owner: currentPlayer,
            lines: [topLine, rightLine, newLine, leftLine]
          }
          setScores(prev => ({ ...prev, [currentPlayer]: prev[currentPlayer] + 1 }))
        }
      }
      
      // Check box below
      if (row < size - 1) {
        const bottomLine = lineExists([col, row + 1], [col + 1, row + 1])
        const rightLine = lineExists([col + 1, row], [col + 1, row + 1])
        const leftLine = lineExists([col, row], [col, row + 1])
        
        if (bottomLine && rightLine && leftLine && (start[1] === row)) {
          boxesCompleted = true
          const boxIndex = row * (size - 1) + col
          newBoxes[boxIndex] = {
            owner: currentPlayer,
            lines: [newLine, rightLine, bottomLine, leftLine]
          }
          setScores(prev => ({ ...prev, [currentPlayer]: prev[currentPlayer] + 1 }))
        }
      }
    } else {
      // Check box to the left
      if (col > 0) {
        const topLine = lineExists([col - 1, row], [col, row])
        const bottomLine = lineExists([col - 1, row + 1], [col, row + 1])
        const leftLine = lineExists([col - 1, row], [col - 1, row + 1])
        
        if (topLine && bottomLine && leftLine && (start[0] === col)) {
          boxesCompleted = true
          const boxIndex = row * (size - 1) + (col - 1)
          newBoxes[boxIndex] = {
            owner: currentPlayer,
            lines: [topLine, newLine, bottomLine, leftLine]
          }
          setScores(prev => ({ ...prev, [currentPlayer]: prev[currentPlayer] + 1 }))
        }
      }
      
      // Check box to the right
      if (col < size - 1) {
        const topLine = lineExists([col, row], [col + 1, row])
        const bottomLine = lineExists([col, row + 1], [col + 1, row + 1])
        const rightLine = lineExists([col + 1, row], [col + 1, row + 1])
        
        if (topLine && bottomLine && rightLine && (start[0] === col)) {
          boxesCompleted = true
          const boxIndex = row * (size - 1) + col
          newBoxes[boxIndex] = {
            owner: currentPlayer,
            lines: [topLine, rightLine, bottomLine, newLine]
          }
          setScores(prev => ({ ...prev, [currentPlayer]: prev[currentPlayer] + 1 }))
        }
      }
    }

    // Only change turn if no boxes were completed
    if (!boxesCompleted) {
      setCurrentPlayer(prev => prev === 'player1' ? 'player2' : 'player1')
    }

    setBoxes(newBoxes)

    // Check for game over
    const remainingBoxes = newBoxes.filter(box => !box.owner).length
    if (remainingBoxes === 0) {
      setGameOver(true)
    }
  }, [gameOver, lineExists, boxes, currentPlayer, checkBox, gridSize])

 // Check if a move would complete a box
  const wouldCompleteBox = useCallback((start: [number, number], end: [number, number]): boolean => {
    const isHorizontal = start[1] === end[1]
    const row = start[1]
    const col = Math.min(start[0], end[0])

    if (isHorizontal) {
      // Check box above
      if (row > 0) {
        const topLine = lineExists([col, row - 1], [col + 1, row - 1])
        const rightLine = lineExists([col + 1, row - 1], [col + 1, row])
        const leftLine = lineExists([col, row - 1], [col, row])
        if (topLine && rightLine && leftLine) return true
      }
      // Check box below
      if (row < GRID_SIZES[gridSize] - 1) {
        const bottomLine = lineExists([col, row + 1], [col + 1, row + 1])
        const rightLine = lineExists([col + 1, row], [col + 1, row + 1])
        const leftLine = lineExists([col, row], [col, row + 1])
        if (bottomLine && rightLine && leftLine) return true
      }
    } else {
      // Check box to the left
      if (col > 0) {
        const topLine = lineExists([col - 1, row], [col, row])
        const bottomLine = lineExists([col - 1, row + 1], [col, row + 1])
        const leftLine = lineExists([col - 1, row], [col - 1, row + 1])
        if (topLine && bottomLine && leftLine) return true
      }
      // Check box to the right
      if (col < GRID_SIZES[gridSize] - 1) {
        const topLine = lineExists([col, row], [col + 1, row])
        const bottomLine = lineExists([col, row + 1], [col + 1, row + 1])
        const rightLine = lineExists([col + 1, row], [col + 1, row + 1])
        if (topLine && bottomLine && rightLine) return true
      }
    }
    return false
  }, [gridSize, lineExists])

  // Count how many boxes a move would complete
  const countCompletedBoxes = useCallback((start: [number, number], end: [number, number]): number => {
    let count = 0
    const isHorizontal = start[1] === end[1]
    const row = start[1]
    const col = Math.min(start[0], end[0])

    if (isHorizontal) {
      // Check box above
      if (row > 0) {
        const topLine = lineExists([col, row - 1], [col + 1, row - 1])
        const rightLine = lineExists([col + 1, row - 1], [col + 1, row])
        const leftLine = lineExists([col, row - 1], [col, row])
        if (topLine && rightLine && leftLine) count++
      }
      // Check box below
      if (row < GRID_SIZES[gridSize] - 1) {
        const bottomLine = lineExists([col, row + 1], [col + 1, row + 1])
        const rightLine = lineExists([col + 1, row], [col + 1, row + 1])
        const leftLine = lineExists([col, row], [col, row + 1])
        if (bottomLine && rightLine && leftLine) count++
      }
    } else {
      // Check box to the left
      if (col > 0) {
        const topLine = lineExists([col - 1, row], [col, row])
        const bottomLine = lineExists([col - 1, row + 1], [col, row + 1])
        const leftLine = lineExists([col - 1, row], [col - 1, row + 1])
        if (topLine && bottomLine && leftLine) count++
      }
      // Check box to the right
      if (col < GRID_SIZES[gridSize] - 1) {
        const topLine = lineExists([col, row], [col + 1, row])
        const bottomLine = lineExists([col, row + 1], [col + 1, row + 1])
        const rightLine = lineExists([col + 1, row], [col + 1, row + 1])
        if (topLine && bottomLine && rightLine) count++
      }
    }
    return count
  }, [gridSize, lineExists])

  // Computer move
  useEffect(() => {
    if (gameMode === 'pvc' && currentPlayer === 'player2' && !gameOver) {
      const timeout = setTimeout(() => {
        const size = GRID_SIZES[gridSize]
        const moveScores = new Map<string, { move: Line; score: number }>()
        
        // Generate and evaluate all possible moves
        for (let i = 0; i < size; i++) {
          for (let j = 0; j < size; j++) {
            // Horizontal lines
            if (j < size - 1) {
              const move: Line = { start: [j, i], end: [j + 1, i], owner: currentPlayer }
              if (!lineExists(move.start, move.end)) {
                const score = countCompletedBoxes(move.start, move.end)
                const key = `${move.start}-${move.end}`
                moveScores.set(key, { move, score })
              }
            }
            // Vertical lines
            if (i < size - 1) {
              const move: Line = { start: [j, i], end: [j, i + 1], owner: currentPlayer }
              if (!lineExists(move.start, move.end)) {
                const score = countCompletedBoxes(move.start, move.end)
                const key = `${move.start}-${move.end}`
                moveScores.set(key, { move, score })
              }
            }
          }
        }

        if (moveScores.size > 0) {
          // Find the highest scoring moves
          const moves = Array.from(moveScores.values())
          const maxScore = Math.max(...moves.map(m => m.score))
          const bestMoves = moves.filter(m => m.score === maxScore)
          
          // Choose a random move from the best options
          const selectedMove = bestMoves[Math.floor(Math.random() * bestMoves.length)].move
          makeMove(selectedMove.start, selectedMove.end)
        }
      }, 500)

      return () => clearTimeout(timeout)
    }
  }, [gameMode, currentPlayer, gameOver, lineExists, makeMove, gridSize])

  // Render game board
  const renderBoard = () => {
    const board = []
    const size = GRID_SIZES[gridSize]
    
    // Draw dots and potential lines
    for (let i = 0; i < size; i++) {
      for (let j = 0; j < size; j++) {
        const x = j * SPACING
        const y = i * SPACING

        // Draw dot
        board.push(
          <circle
            key={`dot-${i}-${j}`}
            cx={x}
            cy={y}
            r={DOT_SIZE / 2}
            fill={COLORS.dot}
          />
        )

        // Draw horizontal lines
        if (j < size - 1) {
          const isHovered = hoveredLine?.start[0] === j && hoveredLine?.start[1] === i &&
                           hoveredLine?.end[0] === j + 1 && hoveredLine?.end[1] === i
          const existingLine = lineExists([j, i], [j + 1, i])

          board.push(
            <line
              key={`h-line-${i}-${j}`}
              x1={x}
              y1={y}
              x2={x + SPACING}
              y2={y}
              stroke={existingLine ? COLORS[existingLine.owner] : isHovered ? COLORS.hoverLine : 'transparent'}
              strokeWidth={LINE_WIDTH}
              strokeDasharray={isHovered && !existingLine ? '5,5' : undefined}
              onMouseEnter={() => !existingLine && setHoveredLine({ start: [j, i], end: [j + 1, i], owner: currentPlayer })}
              onMouseLeave={() => setHoveredLine(null)}
              onClick={() => makeMove([j, i], [j + 1, i])}
              style={{ cursor: existingLine ? 'default' : 'pointer' }}
            />
          )
        }

        // Draw vertical lines
        if (i < size - 1) {
          const isHovered = hoveredLine?.start[0] === j && hoveredLine?.start[1] === i &&
                           hoveredLine?.end[0] === j && hoveredLine?.end[1] === i + 1
          const existingLine = lineExists([j, i], [j, i + 1])

          board.push(
            <line
              key={`v-line-${i}-${j}`}
              x1={x}
              y1={y}
              x2={x}
              y2={y + SPACING}
              stroke={existingLine ? COLORS[existingLine.owner] : isHovered ? COLORS.hoverLine : 'transparent'}
              strokeWidth={LINE_WIDTH}
              strokeDasharray={isHovered && !existingLine ? '5,5' : undefined}
              onMouseEnter={() => !existingLine && setHoveredLine({ start: [j, i], end: [j, i + 1], owner: currentPlayer })}
              onMouseLeave={() => setHoveredLine(null)}
              onClick={() => makeMove([j, i], [j, i + 1])}
              style={{ cursor: existingLine ? 'default' : 'pointer' }}
            />
          )
        }

        // Draw boxes
        if (i < size - 1 && j < size - 1) {
          const boxIndex = i * (size - 1) + j
          const box = boxes[boxIndex]
          if (box?.owner) {
            board.push(
              <rect
                key={`box-${i}-${j}`}
                x={x + LINE_WIDTH}
                y={y + LINE_WIDTH}
                width={SPACING - LINE_WIDTH * 2}
                height={SPACING - LINE_WIDTH * 2}
                fill={COLORS[box.owner]}
                fillOpacity={0.3}
              />
            )
          }
        }
      }
    }

    return board
  }

  // Reset game
  const resetGame = () => {
    const size = GRID_SIZES[gridSize]
    setLines([])
    setBoxes(Array((size - 1) * (size - 1)).fill({ owner: null, lines: [] }))
    setScores({ player1: 0, player2: 0 })
    setCurrentPlayer('player1')
    setGameOver(false)
  }

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-white p-4">
      <div className="mb-4 flex items-center gap-4">
        <Select value={gridSize} onValueChange={(value: GridSize) => {
          setGridSize(value)
          resetGame()
        }}>
          <SelectTrigger className="w-[200px]">
            <SelectValue placeholder="Select grid size" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="small">Small (4x4)</SelectItem>
            <SelectItem value="medium">Medium (6x6)</SelectItem>
            <SelectItem value="large">Large (8x8)</SelectItem>
          </SelectContent>
        </Select>

        <Select value={gameMode} onValueChange={(value: GameMode) => {
          setGameMode(value)
          resetGame()
        }}>
          <SelectTrigger className="w-[200px]">
            <SelectValue placeholder="Select game mode" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="pvp">Player vs Player</SelectItem>
            <SelectItem value="pvc">Player vs Computer</SelectItem>
          </SelectContent>
        </Select>
        
        <Button
          onClick={resetGame}
          className="bg-blue-500 hover:bg-blue-600"
        >
          Reset Game
        </Button>
      </div>

      <div className="flex gap-8 mb-4">
        <div className="font-bold" style={{ 
          color: COLORS.player1,
          fontSize: currentPlayer === 'player1' ? '1.5rem' : '1.25rem'
        }}>
          Player 1: {scores.player1}
        </div>
        <div className="font-bold" style={{ 
          color: COLORS.player2,
          fontSize: currentPlayer === 'player2' ? '1.5rem' : '1.25rem'
        }}>
          {gameMode === 'pvc' ? 'Computer' : 'Player 2'}: {scores.player2}
        </div>
      </div>

      <svg
        width={SPACING * GRID_SIZES[gridSize] + SPACING}
        height={SPACING * GRID_SIZES[gridSize] + SPACING}
        className="bg-white"
        viewBox={`-${SPACING/2} -${SPACING/2} ${SPACING * GRID_SIZES[gridSize] + SPACING} ${SPACING * GRID_SIZES[gridSize] + SPACING}`}
      >
        {renderBoard()}
      </svg>

      {gameOver && (
        <div className="mt-4 text-2xl font-bold">
          {scores.player1 === scores.player2
            ? "It's a tie!"
            : `${scores.player1 > scores.player2 ? 'Player 1' : (gameMode === 'pvc' ? 'Computer' : 'Player 2')} wins!`}
        </div>
      )}
    </div>
  )
}