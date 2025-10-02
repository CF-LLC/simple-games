'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'

type Direction = 'UP' | 'DOWN' | 'LEFT' | 'RIGHT'
type Position = { x: number; y: number }
type Theme = 'neon' | 'minimal' | 'retro'

const GRID_SIZE = 20
const CELL_SIZE = 25

const BASE_SPEED = 150 // Starting speed in ms
const MIN_SPEED = 50   // Fastest speed in ms
const SPEED_DECREASE = 3 // How much to decrease speed per point

const themes = {
  neon: {
    background: 'bg-gray-900',
    grid: 'bg-gray-800',
    snake: {
      head: 'bg-green-400 shadow-lg shadow-green-400/50',
      body: 'bg-green-500 shadow-md shadow-green-500/50',
      tail: 'bg-green-600 shadow-sm shadow-green-600/50'
    },
    food: 'bg-red-400 shadow-lg shadow-red-400/50',
    text: 'text-green-400',
    border: 'border-gray-700'
  },
  minimal: {
    background: 'bg-white',
    grid: 'bg-gray-50',
    snake: {
      head: 'bg-black',
      body: 'bg-gray-800',
      tail: 'bg-gray-600'
    },
    food: 'bg-red-500',
    text: 'text-black',
    border: 'border-gray-200'
  },
  retro: {
    background: 'bg-green-900',
    grid: 'bg-green-800',
    snake: {
      head: 'bg-yellow-400',
      body: 'bg-yellow-500',
      tail: 'bg-yellow-600'
    },
    food: 'bg-red-500',
    text: 'text-yellow-400',
    border: 'border-green-700'
  }
}

export default function SnakeGame() {
  // Initialize state with default values to avoid hydration mismatches
  const center = Math.floor(GRID_SIZE / 2)
  const initialSnake = [
    { x: center, y: center },
    { x: center - 1, y: center },
    { x: center - 2, y: center }
  ]

  const [isClient, setIsClient] = useState(false)
  const [snake, setSnake] = useState<Position[]>(initialSnake)
  const [direction, setDirection] = useState<Direction>('RIGHT')
  const [gameOver, setGameOver] = useState(false)
  const [score, setScore] = useState(0)
  const [highScore, setHighScore] = useState(0)
  const [isPlaying, setIsPlaying] = useState(false)
  const [currentSpeed, setCurrentSpeed] = useState(BASE_SPEED)
  const [theme, setTheme] = useState<Theme>('neon')
  const [, forceUpdate] = useState({})
  
  // Use refs for values that don't need to trigger re-renders
  const foodRef = useRef<Position>({
    x: 0, y: 0 // Will be set properly during initialization
  })
  const nextDirection = useRef<Direction>('RIGHT')
  const gameLoopId = useRef<number | null>(null)
  const lastMoveTime = useRef<number>(0)

  // Function to generate a valid food position
  const generateValidFoodPosition = useCallback((currentSnake: Position[]): Position => {
    if (!isClient) return { x: 0, y: 0 }
    
    const positions: Position[] = []
    for (let x = 0; x < GRID_SIZE; x++) {
      for (let y = 0; y < GRID_SIZE; y++) {
        if (!currentSnake.some(segment => segment.x === x && segment.y === y)) {
          positions.push({ x, y })
        }
      }
    }
    
    if (positions.length === 0) {
      return { x: 0, y: 0 } // Fallback position
    }
    
    return positions[Math.floor(Math.random() * positions.length)]
  }, [isClient])

  // Function to update food position
  const updateFoodPosition = useCallback((currentSnake: Position[]) => {
    if (!isClient) return
    
    const newPos = generateValidFoodPosition(currentSnake)
    foodRef.current = newPos
    forceUpdate({}) // Force a re-render to show the new food position
  }, [isClient, generateValidFoodPosition, forceUpdate])

  // Reset game function
  const resetGame = useCallback(() => {
    if (gameLoopId.current) {
      cancelAnimationFrame(gameLoopId.current)
      gameLoopId.current = null
    }

    const center = Math.floor(GRID_SIZE / 2)
    const initialSnake = [
      { x: center, y: center },       // Head
      { x: center - 1, y: center },   // Body
      { x: center - 2, y: center }    // Tail
    ]

    // Reset all state in a specific order
    setGameOver(false)
    setScore(0)
    setCurrentSpeed(BASE_SPEED)
    setIsPlaying(false)
    setSnake(initialSnake)
    setDirection('RIGHT')
    
    // Reset refs
    nextDirection.current = 'RIGHT'
    lastMoveTime.current = 0
    
    // Generate new food position
    updateFoodPosition(initialSnake)
  }, [setGameOver, setScore, setCurrentSpeed, setIsPlaying, setSnake, setDirection, updateFoodPosition])

  // Game loop
  const gameLoop = useCallback((timestamp: number) => {
    if (!isClient || gameOver) return

    if (timestamp - lastMoveTime.current >= currentSpeed) {
      setSnake(prevSnake => {
        // Create the new head position
        const head = { ...prevSnake[0] }
        const moveDirection = nextDirection.current

        // Update head position
        switch (moveDirection) {
          case 'UP': head.y = (head.y - 1 + GRID_SIZE) % GRID_SIZE; break
          case 'DOWN': head.y = (head.y + 1) % GRID_SIZE; break
          case 'LEFT': head.x = (head.x - 1 + GRID_SIZE) % GRID_SIZE; break
          case 'RIGHT': head.x = (head.x + 1) % GRID_SIZE; break
        }

        // Check for collisions with self
        if (prevSnake.some(segment => segment.x === head.x && segment.y === head.y)) {
          setGameOver(true)
          return prevSnake
        }

        // Create new snake with new head
        let newSnake = [head, ...prevSnake]

        // Check if we're eating food
        const eatingFood = head.x === foodRef.current.x && head.y === foodRef.current.y

        if (eatingFood) {
          // Update score
          setScore(prev => prev + 1)
          
          // Calculate new speed
          const newSpeed = Math.max(MIN_SPEED, BASE_SPEED - (score * SPEED_DECREASE))
          setCurrentSpeed(newSpeed)

          // Generate new food position
          updateFoodPosition(newSnake)
        } else {
          // Remove tail if not eating
          newSnake = newSnake.slice(0, -1)
        }

        return newSnake
      })

      lastMoveTime.current = timestamp
    }

    gameLoopId.current = requestAnimationFrame(gameLoop)
  }, [isClient, gameOver, currentSpeed, score, updateFoodPosition])

  // Handle keyboard input
  const handleKeyPress = useCallback((e: KeyboardEvent) => {
    if (gameOver) return

    if (!isPlaying) {
      setIsPlaying(true)
      lastMoveTime.current = performance.now()
      gameLoopId.current = requestAnimationFrame(gameLoop)
    }

    const currentDirection = nextDirection.current

    switch (e.key) {
      case 'ArrowUp':
        if (currentDirection !== 'DOWN') {
          nextDirection.current = 'UP'
          setDirection('UP')
        }
        break
      case 'ArrowDown':
        if (currentDirection !== 'UP') {
          nextDirection.current = 'DOWN'
          setDirection('DOWN')
        }
        break
      case 'ArrowLeft':
        if (currentDirection !== 'RIGHT') {
          nextDirection.current = 'LEFT'
          setDirection('LEFT')
        }
        break
      case 'ArrowRight':
        if (currentDirection !== 'LEFT') {
          nextDirection.current = 'RIGHT'
          setDirection('RIGHT')
        }
        break
    }
  }, [gameOver, isPlaying, gameLoop])

  // Set up event listeners and initialize
  useEffect(() => {
    setIsClient(true)
    resetGame()
    
    window.addEventListener('keydown', handleKeyPress)
    return () => {
      window.removeEventListener('keydown', handleKeyPress)
      if (gameLoopId.current) cancelAnimationFrame(gameLoopId.current)
    }
  }, [resetGame, handleKeyPress])

  // Track high score
  useEffect(() => {
    if (score > highScore) {
      setHighScore(score)
    }
  }, [score, highScore])

  // Prevent hydration mismatch
  if (!isClient) {
    return (
      <div className={`flex flex-col items-center justify-start min-h-screen ${themes[theme].background} ${themes[theme].text} p-4`}>
        <h1 className="text-4xl font-bold mb-4">Snake Game</h1>
        <div className="animate-pulse flex space-x-4">
          <div 
            className="rounded-lg bg-slate-700"
            style={{
              height: GRID_SIZE * CELL_SIZE,
              width: GRID_SIZE * CELL_SIZE
            }}
          />
        </div>
      </div>
    )
  }

  return (
    <div className={`flex flex-col items-center justify-start min-h-screen ${themes[theme].background} ${themes[theme].text} p-4 transition-colors duration-300`}>
      <h1 className="text-4xl font-bold mb-4">Snake Game</h1>
      
      <div className="flex flex-row items-center gap-4 mb-4">
        <Select value={theme} onValueChange={(value: Theme) => setTheme(value)}>
          <SelectTrigger className="w-[120px]">
            <SelectValue placeholder="Theme" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="neon">Neon</SelectItem>
            <SelectItem value="minimal">Minimal</SelectItem>
            <SelectItem value="retro">Retro</SelectItem>
          </SelectContent>
        </Select>

        <Button onClick={resetGame}>New Game</Button>
        
        <div className="flex flex-col items-end">
          <span className="text-sm opacity-70">High Score: {highScore}</span>
          <span className="text-2xl font-mono">{score}</span>
        </div>
      </div>
      
      <div className={`relative ${themes[theme].grid} rounded-lg overflow-hidden transition-colors duration-300`}>
        <div
          className="relative"
          style={{
            width: GRID_SIZE * CELL_SIZE,
            height: GRID_SIZE * CELL_SIZE,
          }}
        >
          {/* Grid lines */}
          <div 
            className="absolute inset-0 grid transition-colors duration-300"
            style={{
              gridTemplateColumns: `repeat(${GRID_SIZE}, 1fr)`,
              gridTemplateRows: `repeat(${GRID_SIZE}, 1fr)`,
            }}
          >
            {Array.from({ length: GRID_SIZE * GRID_SIZE }).map((_, i) => (
              <div 
                key={i} 
                className={`border-[0.5px] ${themes[theme].border} transition-colors duration-300`}
              />
            ))}
          </div>

          {/* Snake */}
          {snake.map((segment, index) => {
            const isHead = index === 0
            const isTail = index === snake.length - 1
            const segmentTheme = isHead ? themes[theme].snake.head : 
                               isTail ? themes[theme].snake.tail : 
                               themes[theme].snake.body

            return (
              <div
                key={`${segment.x}-${segment.y}-${index}`}
                className={`absolute rounded-full transition-all duration-75 ${segmentTheme}`}
                style={{
                  left: segment.x * CELL_SIZE + 2,
                  top: segment.y * CELL_SIZE + 2,
                  width: CELL_SIZE - 4,
                  height: CELL_SIZE - 4,
                  zIndex: snake.length - index,
                }}
              />
            )
          })}

          {/* Food */}
          <div
            className={`absolute rounded-full transition-all duration-200 ${themes[theme].food}`}
            style={{
              left: foodRef.current.x * CELL_SIZE + 2,
              top: foodRef.current.y * CELL_SIZE + 2,
              width: CELL_SIZE - 4,
              height: CELL_SIZE - 4,
              zIndex: snake.length + 1,
            }}
          />
        </div>

        {/* Game over overlay */}
        {gameOver && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/50 backdrop-blur-sm">
            <div className="text-center p-6 rounded-lg bg-background/90">
              <p className="text-2xl font-bold mb-2">Game Over!</p>
              <p className="mb-4">Score: {score}</p>
              <Button onClick={resetGame}>Play Again</Button>
            </div>
          </div>
        )}

        {/* Start message */}
        {!isPlaying && !gameOver && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/30 backdrop-blur-[2px]">
            <p className="text-white text-lg font-semibold">
              Press any arrow key to start
            </p>
          </div>
        )}
      </div>
    </div>
  )
}