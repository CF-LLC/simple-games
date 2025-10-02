'use client'

import { useState, useEffect, useRef } from 'react'
import { Button } from '@/components/ui/button'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'

type GameMode = 'pvp' | 'computer'
type GameState = 'start' | 'playing' | 'paused' | 'gameOver'

interface Position {
  x: number
  y: number
}

interface Ball extends Position {
  dx: number
  dy: number
  speed: number
  size: number
}

interface Paddle {
  y: number
  speed: number
  width: number
  height: number
}

interface GameData {
  ball: Ball
  leftPaddle: Paddle
  rightPaddle: Paddle
  leftScore: number
  rightScore: number
}

const CANVAS_WIDTH = 800
const CANVAS_HEIGHT = 600
const PADDLE_WIDTH = 15
const PADDLE_HEIGHT = 90
const BALL_SIZE = 10
const BALL_SPEED = 5
const PADDLE_SPEED = 12
const INITIAL_BALL_SPEED = 5
const MAX_BOUNCE_ANGLE = Math.PI / 4 // 45 degrees
const MOVE_SPEED = 20 // Speed for all paddles

const getRandomDirection = () => (Math.random() > 0.5 ? 1 : -1)

const clamp = (value: number, min: number, max: number) => {
  return Math.max(min, Math.min(max, value))
}

export default function PongGame() {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const gameDataRef = useRef<GameData>({
    ball: {
      x: CANVAS_WIDTH / 2,
      y: CANVAS_HEIGHT / 2,
      dx: INITIAL_BALL_SPEED,
      dy: INITIAL_BALL_SPEED,
      speed: BALL_SPEED,
      size: BALL_SIZE
    },
    leftPaddle: {
      y: CANVAS_HEIGHT / 2 - PADDLE_HEIGHT / 2,
      speed: PADDLE_SPEED,
      width: PADDLE_WIDTH,
      height: PADDLE_HEIGHT
    },
    rightPaddle: {
      y: CANVAS_HEIGHT / 2 - PADDLE_HEIGHT / 2,
      speed: PADDLE_SPEED,
      width: PADDLE_WIDTH,
      height: PADDLE_HEIGHT
    },
    leftScore: 0,
    rightScore: 0
  })
  const keysPressed = useRef<Set<string>>(new Set())
  const [gameMode, setGameMode] = useState<GameMode>('pvp')
  const [gameState, setGameState] = useState<GameState>('start')
  const [scores, setScores] = useState({ left: 0, right: 0 })

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const draw = () => {
      const gameData = gameDataRef.current
      
      // Clear canvas
      ctx.fillStyle = 'black'
      ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT)

      // Draw center line
      ctx.strokeStyle = 'white'
      ctx.setLineDash([5, 15])
      ctx.beginPath()
      ctx.moveTo(CANVAS_WIDTH / 2, 0)
      ctx.lineTo(CANVAS_WIDTH / 2, CANVAS_HEIGHT)
      ctx.stroke()
      ctx.setLineDash([])

      // Draw paddles
      ctx.fillStyle = 'white'
      ctx.fillRect(0, gameData.leftPaddle.y, gameData.leftPaddle.width, gameData.leftPaddle.height)
      ctx.fillRect(
        CANVAS_WIDTH - gameData.rightPaddle.width,
        gameData.rightPaddle.y,
        gameData.rightPaddle.width,
        gameData.rightPaddle.height
      )

      // Draw ball
      ctx.beginPath()
      ctx.arc(gameData.ball.x, gameData.ball.y, gameData.ball.size, 0, Math.PI * 2)
      ctx.fillStyle = 'white'
      ctx.fill()
      ctx.closePath()

      // Draw scores
      ctx.font = '48px Arial'
      ctx.fillStyle = 'white'
      ctx.fillText(scores.left.toString(), CANVAS_WIDTH / 4, 60)
      ctx.fillText(scores.right.toString(), (CANVAS_WIDTH * 3) / 4, 60)
    }

    let animationFrameId: number

    const update = () => {
      if (gameState !== 'playing') return

      const gameData = gameDataRef.current
      const keys = keysPressed.current

      // Handle paddle movement
      if (gameMode === 'pvp') {
        // Left paddle controls (W/S)
        if (keys.has('w')) {
          gameData.leftPaddle.y = clamp(
            gameData.leftPaddle.y - MOVE_SPEED,
            0,
            CANVAS_HEIGHT - gameData.leftPaddle.height
          )
        }
        if (keys.has('s')) {
          gameData.leftPaddle.y = clamp(
            gameData.leftPaddle.y + MOVE_SPEED,
            0,
            CANVAS_HEIGHT - gameData.leftPaddle.height
          )
        }
      }

      // Right paddle controls (always active)
      if (keys.has('arrowup')) {
        gameData.rightPaddle.y = clamp(
          gameData.rightPaddle.y - MOVE_SPEED,
          0,
          CANVAS_HEIGHT - gameData.rightPaddle.height
        )
      }
      if (keys.has('arrowdown')) {
        gameData.rightPaddle.y = clamp(
          gameData.rightPaddle.y + MOVE_SPEED,
          0,
          CANVAS_HEIGHT - gameData.rightPaddle.height
        )
      }

      // Update ball position
      gameData.ball.x += gameData.ball.dx
      gameData.ball.y += gameData.ball.dy

      // Ball collision with top and bottom walls
      if (gameData.ball.y - gameData.ball.size <= 0 || gameData.ball.y + gameData.ball.size >= CANVAS_HEIGHT) {
        gameData.ball.dy = -gameData.ball.dy
      }

      // Ball collision with paddles
      if (
        gameData.ball.x - gameData.ball.size <= gameData.leftPaddle.width &&
        gameData.ball.y >= gameData.leftPaddle.y &&
        gameData.ball.y <= gameData.leftPaddle.y + gameData.leftPaddle.height
      ) {
        gameData.ball.dx = -gameData.ball.dx * 1.1 // Increase speed slightly
        const relativeIntersectY = (gameData.leftPaddle.y + gameData.leftPaddle.height / 2) - gameData.ball.y
        const normalizedIntersect = relativeIntersectY / (gameData.leftPaddle.height / 2)
        gameData.ball.dy = -normalizedIntersect * gameData.ball.speed
      }

      if (
        gameData.ball.x + gameData.ball.size >= CANVAS_WIDTH - gameData.rightPaddle.width &&
        gameData.ball.y >= gameData.rightPaddle.y &&
        gameData.ball.y <= gameData.rightPaddle.y + gameData.rightPaddle.height
      ) {
        gameData.ball.dx = -gameData.ball.dx * 1.1 // Increase speed slightly
        const relativeIntersectY = (gameData.rightPaddle.y + gameData.rightPaddle.height / 2) - gameData.ball.y
        const normalizedIntersect = relativeIntersectY / (gameData.rightPaddle.height / 2)
        gameData.ball.dy = -normalizedIntersect * gameData.ball.speed
      }

      // Scoring
      if (gameData.ball.x + gameData.ball.size < 0) {
        setScores(prev => ({ ...prev, right: prev.right + 1 }))
        resetBall()
        return
      }
      if (gameData.ball.x - gameData.ball.size > CANVAS_WIDTH) {
        setScores(prev => ({ ...prev, left: prev.left + 1 }))
        resetBall()
        return
      }

      // AI movement for computer mode
      if (gameMode === 'computer') {
        const aiPaddleCenter = gameData.leftPaddle.y + gameData.leftPaddle.height / 2
        const ballY = gameData.ball.y

        if (Math.abs(aiPaddleCenter - ballY) > MOVE_SPEED) {
          if (aiPaddleCenter < ballY) {
            gameData.leftPaddle.y = clamp(
              gameData.leftPaddle.y + MOVE_SPEED,
              0,
              CANVAS_HEIGHT - gameData.leftPaddle.height
            )
          } else {
            gameData.leftPaddle.y = clamp(
              gameData.leftPaddle.y - MOVE_SPEED,
              0,
              CANVAS_HEIGHT - gameData.leftPaddle.height
            )
          }
        }
      }
    }

    const gameLoop = () => {
      update()
      draw()
      animationFrameId = requestAnimationFrame(gameLoop)
    }

    gameLoop()

    return () => {
      cancelAnimationFrame(animationFrameId)
    }
  }, [gameState, gameMode, scores])

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      keysPressed.current.add(e.key.toLowerCase())
      
      // Handle escape key separately (not for continuous movement)
      if (e.key === 'Escape') {
        setGameState(prev => prev === 'playing' ? 'paused' : 'playing')
      }
    }

    const handleKeyUp = (e: KeyboardEvent) => {
      keysPressed.current.delete(e.key.toLowerCase())
    }

    window.addEventListener('keydown', handleKeyDown)
    window.addEventListener('keyup', handleKeyUp)

    return () => {
      window.removeEventListener('keydown', handleKeyDown)
      window.removeEventListener('keyup', handleKeyUp)
      keysPressed.current.clear()
    }
  }, [])

  const handleModeChange = (value: string) => {
    setGameMode(value as GameMode)
    resetGame()
  }

  const resetBall = () => {
    const gameData = gameDataRef.current
    gameData.ball = {
      x: CANVAS_WIDTH / 2,
      y: CANVAS_HEIGHT / 2,
      dx: INITIAL_BALL_SPEED * getRandomDirection(),
      dy: INITIAL_BALL_SPEED * getRandomDirection(),
      speed: BALL_SPEED,
      size: BALL_SIZE
    }
  }

  const resetGame = () => {
    const gameData = gameDataRef.current
    
    gameData.ball = {
      x: CANVAS_WIDTH / 2,
      y: CANVAS_HEIGHT / 2,
      dx: INITIAL_BALL_SPEED,
      dy: INITIAL_BALL_SPEED,
      speed: BALL_SPEED,
      size: BALL_SIZE
    }
    
    gameData.leftPaddle = {
      y: CANVAS_HEIGHT / 2 - PADDLE_HEIGHT / 2,
      speed: PADDLE_SPEED,
      width: PADDLE_WIDTH,
      height: PADDLE_HEIGHT
    }
    
    gameData.rightPaddle = {
      y: CANVAS_HEIGHT / 2 - PADDLE_HEIGHT / 2,
      speed: PADDLE_SPEED,
      width: PADDLE_WIDTH,
      height: PADDLE_HEIGHT
    }
    
    setScores({ left: 0, right: 0 })
    setGameState('start')
  }

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-background text-foreground p-4">
      <h1 className="text-4xl font-bold mb-4">Pong</h1>
      <div className="mb-6 w-[200px]">
        <Select onValueChange={handleModeChange} value={gameMode}>
          <SelectTrigger>
            <SelectValue placeholder="Select Game Mode" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="pvp">Player vs Player</SelectItem>
            <SelectItem value="computer">Player vs Computer</SelectItem>
          </SelectContent>
        </Select>
      </div>
      <div className="relative">
        <canvas
          ref={canvasRef}
          width={CANVAS_WIDTH}
          height={CANVAS_HEIGHT}
          className="border border-white"
        />
        {(gameState === 'start' || gameState === 'paused') && (
          <div className="absolute top-0 left-0 w-full h-full bg-black bg-opacity-75 flex flex-col items-center justify-center text-white">
            <div className="mb-8 text-center">
              <h2 className="text-2xl font-bold mb-4">
                {gameState === 'start' ? 'How to Play' : 'Game Paused'}
              </h2>
              {gameMode === 'pvp' ? (
                <div className="space-y-2">
                  <p>Left Player: W/S to move up/down</p>
                  <p>Right Player: ↑/↓ to move up/down</p>
                </div>
              ) : (
                <div className="space-y-2">
                  <p>Use ↑/↓ to move up/down</p>
                  <p>Try to beat the computer!</p>
                </div>
              )}
              <p className="mt-2">Press ESC to pause/resume</p>
            </div>
            <Button onClick={() => setGameState('playing')}>
              {gameState === 'start' ? 'Start Game' : 'Resume Game'}
            </Button>
          </div>
        )}
      </div>
      <div className="mt-4 text-center">
        <p>First to 10 points wins!</p>
      </div>
    </div>
  )
}