'use client'

import { useState, useEffect, useRef } from 'react'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'

type Direction = 'UP' | 'DOWN' | 'LEFT' | 'RIGHT'
type Position = { x: number; y: number }

const GRID_SIZE = 20
const CELL_SIZE = 20

const difficulties = {
  easy: { speed: 200, initialLength: 3 },
  medium: { speed: 150, initialLength: 5 },
  hard: { speed: 100, initialLength: 7 }
}

export default function SnakeGame() {
  const [snake, setSnake] = useState<Position[]>([])
  const [food, setFood] = useState<Position>({ x: 0, y: 0 })
  const [direction, setDirection] = useState<Direction>('RIGHT')
  const [gameOver, setGameOver] = useState(false)
  const [score, setScore] = useState(0)
  const [difficulty, setDifficulty] = useState<'easy' | 'medium' | 'hard'>('easy')
  const gameLoopRef = useRef<NodeJS.Timeout>()

  useEffect(() => {
    resetGame()
  }, [difficulty])

  useEffect(() => {
    window.addEventListener('keydown', handleKeyPress)
    return () => {
      window.removeEventListener('keydown', handleKeyPress)
      if (gameLoopRef.current) clearInterval(gameLoopRef.current)
    }
  }, [])

  const resetGame = () => {
    const { initialLength } = difficulties[difficulty]
    const initialSnake = Array.from({ length: initialLength }, (_, i) => ({ x: i, y: 0 }))
    setSnake(initialSnake)
    setDirection('RIGHT')
    setGameOver(false)
    setScore(0)
    generateFood(initialSnake)
    if (gameLoopRef.current) clearInterval(gameLoopRef.current)
    gameLoopRef.current =   setInterval(gameLoop, difficulties[difficulty].speed)
  }

  const generateFood = (currentSnake: Position[]) => {
    let newFood: Position
    do {
      newFood = {
        x: Math.floor(Math.random() * GRID_SIZE),
        y: Math.floor(Math.random() * GRID_SIZE)
      }
    } while (currentSnake.some(segment => segment.x === newFood.x && segment.y === newFood.y))
    setFood(newFood)
  }

  const gameLoop = () => {
    setSnake(prevSnake => {
      const newHead = { ...prevSnake[0] }
      switch (direction) {
        case 'UP': newHead.y -= 1; break
        case 'DOWN': newHead.y += 1; break
        case 'LEFT': newHead.x -= 1; break
        case 'RIGHT': newHead.x += 1; break
      }

      if (
        newHead.x < 0 || newHead.x >= GRID_SIZE ||
        newHead.y < 0 || newHead.y >= GRID_SIZE ||
        prevSnake.some(segment => segment.x === newHead.x && segment.y === newHead.y)
      ) {
        setGameOver(true)
        if (gameLoopRef.current) clearInterval(gameLoopRef.current)
        return prevSnake
      }

      const newSnake = [newHead, ...prevSnake]
      if (newHead.x === food.x && newHead.y === food.y) {
        setScore(prevScore => prevScore + 1)
        generateFood(newSnake)
      } else {
        newSnake.pop()
      }

      return newSnake
    })
  }

  const handleKeyPress = (e: KeyboardEvent) => {
    switch (e.key) {
      case 'ArrowUp': setDirection(prev => prev !== 'DOWN' ? 'UP' : prev); break
      case 'ArrowDown': setDirection(prev => prev !== 'UP' ? 'DOWN' : prev); break
      case 'ArrowLeft': setDirection(prev => prev !== 'RIGHT' ? 'LEFT' : prev); break
      case 'ArrowRight': setDirection(prev => prev !== 'LEFT' ? 'RIGHT' : prev); break
    }
  }

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-background text-foreground p-4">
      <h1 className="text-4xl font-bold mb-8">Snake Game</h1>
      <div className="mb-4 space-x-4">
        <Select value={difficulty} onValueChange={(value: 'easy' | 'medium' | 'hard') => setDifficulty(value)}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Select difficulty" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="easy">Easy</SelectItem>
            <SelectItem value="medium">Medium</SelectItem>
            <SelectItem value="hard">Hard</SelectItem>
          </SelectContent>
        </Select>
        <Button onClick={resetGame}>Restart</Button>
      </div>
      <div className="mb-4">Score: {score}</div>
      <div
        className="relative bg-muted"
        style={{
          width: GRID_SIZE * CELL_SIZE,
          height: GRID_SIZE * CELL_SIZE
        }}
      >
        {snake.map((segment, index) => (
          <div
            key={index}
            className="absolute bg-primary"
            style={{
              left: segment.x * CELL_SIZE,
              top: segment.y * CELL_SIZE,
              width: CELL_SIZE,
              height: CELL_SIZE
            }}
          />
        ))}
        <div
          className="absolute bg-destructive"
          style={{
            left: food.x * CELL_SIZE,
            top: food.y * CELL_SIZE,
            width: CELL_SIZE,
            height: CELL_SIZE,
            borderRadius: '50%'
          }}
        />
      </div>
      {gameOver && (
        <div className="mt-8 text-center">
          <h2 className="text-2xl font-bold mb-4">Game Over!</h2>
          <p>Your score: {score}</p>
          <Button onClick={resetGame} className="mt-4">Play Again</Button>
        </div>
      )}
    </div>
  )
}