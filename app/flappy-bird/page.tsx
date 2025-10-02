'use client'

import React, { useState, useEffect, useCallback, useRef } from 'react'
import { Button } from '@/components/ui/button'

// Game constants
const GRAVITY = 0.3
const JUMP_FORCE = -6
const PIPE_SPEED = 2
const PIPE_WIDTH = 60
const PIPE_GAP = 160
const BIRD_SIZE = 30
const SPAWN_INTERVAL = 1000
const GAME_HEIGHT = 500
const GAME_WIDTH = 800

// Bird physics and state
interface Bird {
  y: number
  velocity: number
}

// Pipe object structure
interface Pipe {
  x: number
  topHeight: number
  id: number
}

export default function FlappyBird() {
  const [gameStarted, setGameStarted] = useState(false)
  const [gameOver, setGameOver] = useState(false)
  const [score, setScore] = useState(0)
  const [highScore, setHighScore] = useState(0)
  
  // Bird state
  const [bird, setBird] = useState<Bird>({
    y: GAME_HEIGHT / 2,
    velocity: 0
  })
  
  // Pipes state
  const [pipes, setPipes] = useState<Pipe[]>([])
  const gameLoopId = useRef<number>()
  const lastPipeTime = useRef<number>(0)
  const pipesPassedRef = useRef<Set<number>>(new Set())

  // Reset game state
  const resetGame = useCallback(() => {
    setBird({
      y: GAME_HEIGHT / 2,
      velocity: 0
    })
    setPipes([])
    setScore(0)
    setGameOver(false)
    pipesPassedRef.current.clear()
    lastPipeTime.current = 0
  }, [])

  // Generate a new pipe
  const generatePipe = useCallback((time: number): Pipe => {
    const minHeight = 50
    const maxHeight = GAME_HEIGHT - PIPE_GAP - minHeight
    const topHeight = Math.random() * (maxHeight - minHeight) + minHeight
    return {
      x: GAME_WIDTH,
      topHeight,
      id: time
    }
  }, [])

  // Handle game physics and collision
  const gameLoop = useCallback((timestamp: number) => {
    if (!gameStarted || gameOver) return
    
    // Update bird position
    setBird(prevBird => ({
      y: prevBird.y + prevBird.velocity,
      velocity: prevBird.velocity + GRAVITY
    }))
    
    // Generate new pipes
    if (timestamp - lastPipeTime.current > SPAWN_INTERVAL) {
      setPipes(prevPipes => [...prevPipes, generatePipe(timestamp)])
      lastPipeTime.current = timestamp
    }
    
    // Move pipes and remove off-screen ones
    setPipes(prevPipes => {
      return prevPipes
        .map(pipe => ({ ...pipe, x: pipe.x - PIPE_SPEED }))
        .filter(pipe => pipe.x > -PIPE_WIDTH)
    })
    
    // Update score
    setPipes(prevPipes => {
      prevPipes.forEach(pipe => {
        if (pipe.x + PIPE_WIDTH < GAME_WIDTH / 2 - BIRD_SIZE / 2 && !pipesPassedRef.current.has(pipe.id)) {
          pipesPassedRef.current.add(pipe.id)
          setScore(prev => prev + 1)
        }
      })
      return prevPipes
    })

    // Check collisions
    const birdRect = {
      left: GAME_WIDTH / 2 - BIRD_SIZE / 2,
      right: GAME_WIDTH / 2 + BIRD_SIZE / 2,
      top: bird.y - BIRD_SIZE / 2,
      bottom: bird.y + BIRD_SIZE / 2
    }

    // Ground/ceiling collision
    if (birdRect.bottom > GAME_HEIGHT || birdRect.top < 0) {
      setGameOver(true)
      return
    }

    // Pipe collision
    const collision = pipes.some(pipe => {
      const pipeLeft = pipe.x
      const pipeRight = pipe.x + PIPE_WIDTH
      
      if (birdRect.right > pipeLeft && birdRect.left < pipeRight) {
        if (birdRect.top < pipe.topHeight || birdRect.bottom > pipe.topHeight + PIPE_GAP) {
          return true
        }
      }
      return false
    })

    if (collision) {
      setGameOver(true)
      return
    }

    gameLoopId.current = requestAnimationFrame(gameLoop)
  }, [bird.y, gameOver, gameStarted, generatePipe, pipes, setBird, setPipes, setScore, setGameOver])

  // Handle jump
  const handleJump = useCallback(() => {
    if (!gameStarted) {
      setGameStarted(true)
    }
    
    if (!gameOver) {
      setBird(prev => ({
        ...prev,
        velocity: JUMP_FORCE
      }))
    }
  }, [gameOver, gameStarted, setGameStarted, setBird])

  // Handle key press
  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      if (e.code === 'Space') {
        e.preventDefault()
        handleJump()
      }
    }

    window.addEventListener('keydown', handleKeyPress)
    return () => window.removeEventListener('keydown', handleKeyPress)
  }, [handleJump])

  // Start game loop
  useEffect(() => {
    if (gameStarted && !gameOver) {
      gameLoopId.current = requestAnimationFrame(gameLoop)
    }
    return () => {
      if (gameLoopId.current) {
        cancelAnimationFrame(gameLoopId.current)
      }
    }
  }, [gameLoop, gameStarted, gameOver])

  // Update high score
  useEffect(() => {
    if (gameOver && score > highScore) {
      setHighScore(score)
    }
  }, [gameOver, score, highScore, setHighScore])

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-blue-100 p-4">
      <div 
        className="relative bg-blue-300 rounded-lg overflow-hidden shadow-lg"
        style={{ width: GAME_WIDTH, height: GAME_HEIGHT }}
        onClick={handleJump}
      >
        {/* Bird */}
        <div
          className="absolute w-8 h-8 bg-yellow-400 rounded-full transform -translate-x-1/2 -translate-y-1/2 transition-transform"
          style={{
            left: GAME_WIDTH / 2,
            top: bird.y,
            transform: `translate(-50%, -50%) rotate(${bird.velocity * 5}deg)`
          }}
        >
          {/* Bird eye */}
          <div className="absolute right-1 top-2 w-2 h-2 bg-white rounded-full">
            <div className="absolute right-0 top-0.5 w-1 h-1 bg-black rounded-full" />
          </div>
          {/* Bird beak */}
          <div className="absolute right-0 top-3 w-3 h-2 bg-orange-500 rounded transform rotate-45" />
        </div>

        {/* Pipes */}
        {pipes.map(pipe => (
          <React.Fragment key={pipe.id}>
            {/* Top pipe */}
            <div
              className="absolute bg-green-500 w-[60px]"
              style={{
                left: pipe.x,
                height: pipe.topHeight,
                top: 0
              }}
            >
              <div className="absolute bottom-0 left-[-10px] right-[-10px] h-[20px] bg-green-600" />
            </div>
            {/* Bottom pipe */}
            <div
              className="absolute bg-green-500 w-[60px]"
              style={{
                left: pipe.x,
                top: pipe.topHeight + PIPE_GAP,
                bottom: 0
              }}
            >
              <div className="absolute top-0 left-[-10px] right-[-10px] h-[20px] bg-green-600" />
            </div>
          </React.Fragment>
        ))}

        {/* Ground */}
        <div className="absolute bottom-0 w-full h-16 bg-green-600" />

        {/* Score */}
        <div className="absolute top-4 left-0 right-0 text-center text-4xl font-bold text-white drop-shadow-md">
          {score}
        </div>

        {/* Game over screen */}
        {gameOver && (
          <div className="absolute inset-0 bg-black/50 flex flex-col items-center justify-center backdrop-blur-sm">
            <div className="bg-white p-6 rounded-lg text-center">
              <h2 className="text-2xl font-bold mb-4">Game Over!</h2>
              <p className="mb-2">Score: {score}</p>
              <p className="mb-4">High Score: {highScore}</p>
              <Button onClick={() => {
                resetGame()
                setGameStarted(true)
              }}>
                Play Again
              </Button>
            </div>
          </div>
        )}

        {/* Start screen */}
        {!gameStarted && !gameOver && (
          <div className="absolute inset-0 bg-black/30 flex items-center justify-center backdrop-blur-sm">
            <div className="text-center text-white">
              <h1 className="text-4xl font-bold mb-4">Flappy Bird</h1>
              <p className="mb-4">Click or press Space to jump</p>
              <Button onClick={() => setGameStarted(true)}>Start Game</Button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
