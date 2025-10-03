'use client'

import React, { useState, useEffect, useCallback, useRef } from 'react'
import { Button } from '@/components/ui/button'

// Game constants
const GAME_WIDTH = 800
const GAME_HEIGHT = 600
const SHIP_SIZE = 20
const ROTATION_SPEED = 5
const THRUST_SPEED = 0.1
const MAX_SPEED = 8
const FRICTION = 0.99
const BULLET_SPEED = 10
const BULLET_LIFE = 30
const ASTEROID_SPEEDS = [1.5, 2, 2.5]
const ASTEROID_SIZES = [50, 30, 20]
const INITIAL_ASTEROIDS = 4

// Types
interface Vector {
  x: number
  y: number
}

interface Ship {
  position: Vector
  velocity: Vector
  rotation: number
  thrusting: boolean
}

interface Bullet {
  position: Vector
  velocity: Vector
  life: number
}

interface Asteroid {
  position: Vector
  velocity: Vector
  size: number
  vertices: Vector[]
}

export default function Asteroids() {
  const [gameStarted, setGameStarted] = useState(false)
  const [gameOver, setGameOver] = useState(false)
  const [score, setScore] = useState(0)
  const [highScore, setHighScore] = useState(0)
  const [ship, setShip] = useState<Ship>({
    position: { x: GAME_WIDTH / 2, y: GAME_HEIGHT / 2 },
    velocity: { x: 0, y: 0 },
    rotation: 0,
    thrusting: false
  })
  const [bullets, setBullets] = useState<Bullet[]>([])
  const [asteroids, setAsteroids] = useState<Asteroid[]>([])
  const [lives, setLives] = useState(3)
  const gameLoopId = useRef<number>()
  const keysPressed = useRef<Set<string>>(new Set())

  // Create random asteroid vertices
  const createAsteroidVertices = useCallback((size: number): Vector[] => {
    const vertices: Vector[] = []
    const numVertices = Math.floor(Math.random() * 4) + 8
    for (let i = 0; i < numVertices; i++) {
      const angle = (i / numVertices) * Math.PI * 2
      const variance = Math.random() * (size * 0.2) - (size * 0.1)
      vertices.push({
        x: Math.cos(angle) * (size + variance),
        y: Math.sin(angle) * (size + variance)
      })
    }
    return vertices
  }, [])

  // Create new asteroid
  const createAsteroid = useCallback((x: number, y: number, size: number, level: number = 0): Asteroid => {
    const angle = Math.random() * Math.PI * 2
    const speed = ASTEROID_SPEEDS[level]
    return {
      position: { x, y },
      velocity: {
        x: Math.cos(angle) * speed,
        y: Math.sin(angle) * speed
      },
      size: ASTEROID_SIZES[level],
      vertices: createAsteroidVertices(ASTEROID_SIZES[level])
    }
  }, [createAsteroidVertices])

  // Initialize asteroids
  const initializeAsteroids = useCallback(() => {
    const newAsteroids: Asteroid[] = []
    for (let i = 0; i < INITIAL_ASTEROIDS; i++) {
      let x: number, y: number
      do {
        x = Math.random() * GAME_WIDTH
        y = Math.random() * GAME_HEIGHT
      } while (Math.sqrt(
        Math.pow(x - GAME_WIDTH / 2, 2) +
        Math.pow(y - GAME_HEIGHT / 2, 2)
      ) < 100) // Keep asteroids away from ship spawn
      newAsteroids.push(createAsteroid(x, y, ASTEROID_SIZES[0]))
    }
    return newAsteroids
  }, [createAsteroid])

  // Reset game
  const resetGame = useCallback(() => {
    setShip({
      position: { x: GAME_WIDTH / 2, y: GAME_HEIGHT / 2 },
      velocity: { x: 0, y: 0 },
      rotation: 0,
      thrusting: false
    })
    setBullets([])
    setAsteroids(initializeAsteroids())
    setScore(0)
    setLives(3)
    setGameOver(false)
    keysPressed.current.clear()
  }, [initializeAsteroids, setBullets, setScore, setLives, setGameOver])

  // Handle ship hit
  const handleShipHit = useCallback(() => {
    setLives(prev => {
      if (prev <= 1) {
        setGameOver(true)
        return 0
      }
      // Reset ship position
      setShip(prev => ({
        ...prev,
        position: { x: GAME_WIDTH / 2, y: GAME_HEIGHT / 2 },
        velocity: { x: 0, y: 0 },
        rotation: 0
      }))
      return prev - 1
    })
  }, [setGameOver, setShip, setLives])

  // Check collisions
  const checkCollisions = useCallback(() => {
    // Update high score on game over
    if (gameOver && score > highScore) {
      setHighScore(score)
    }
    // Bullet-asteroid collisions
    bullets.forEach((bullet, bulletIndex) => {
      asteroids.forEach((asteroid, asteroidIndex) => {
        const distance = Math.sqrt(
          Math.pow(bullet.position.x - asteroid.position.x, 2) +
          Math.pow(bullet.position.y - asteroid.position.y, 2)
        )
        if (distance < asteroid.size) {
          // Remove bullet
          setBullets(prev => prev.filter((_, i) => i !== bulletIndex))
          
          // Split or remove asteroid
          setAsteroids(prev => {
            const newAsteroids = prev.filter((_, i) => i !== asteroidIndex)
            const level = ASTEROID_SIZES.indexOf(asteroid.size)
            
            if (level < ASTEROID_SIZES.length - 1) {
              // Split into two smaller asteroids
              for (let i = 0; i < 2; i++) {
                newAsteroids.push(
                  createAsteroid(
                    asteroid.position.x,
                    asteroid.position.y,
                    ASTEROID_SIZES[level + 1],
                    level + 1
                  )
                )
              }
            }
            return newAsteroids
          })
          
          setScore(prev => prev + (100 / (ASTEROID_SIZES.indexOf(asteroid.size) + 1)))
        }
      })
    })

    // Ship-asteroid collisions
    asteroids.forEach(asteroid => {
      const distance = Math.sqrt(
        Math.pow(ship.position.x - asteroid.position.x, 2) +
        Math.pow(ship.position.y - asteroid.position.y, 2)
      )
      if (distance < asteroid.size + SHIP_SIZE / 2) {
        handleShipHit()
      }
    })
  }, [asteroids, bullets, ship, handleShipHit, createAsteroid, setBullets, setAsteroids, setScore, gameOver, score, highScore, setHighScore])

  // Game loop
  const gameLoop = useCallback(() => {
    if (!gameStarted || gameOver) return

    // Update high score
    if (gameOver && score > highScore) {
      setHighScore(score)
    }

    // Update ship
    setShip(prev => {
      const rotation = prev.rotation + 
        (keysPressed.current.has('ArrowLeft') ? -ROTATION_SPEED : 0) +
        (keysPressed.current.has('ArrowRight') ? ROTATION_SPEED : 0)

      const thrusting = keysPressed.current.has('ArrowUp')
      
      const velocity = { ...prev.velocity }
      if (thrusting) {
        velocity.x += Math.cos(rotation * Math.PI / 180) * THRUST_SPEED
        velocity.y += Math.sin(rotation * Math.PI / 180) * THRUST_SPEED
      }
      
      // Apply speed limit and friction
      const speed = Math.sqrt(velocity.x * velocity.x + velocity.y * velocity.y)
      if (speed > MAX_SPEED) {
        velocity.x = (velocity.x / speed) * MAX_SPEED
        velocity.y = (velocity.y / speed) * MAX_SPEED
      }
      velocity.x *= FRICTION
      velocity.y *= FRICTION

      // Update position with wrap-around
      const position = {
        x: (prev.position.x + velocity.x + GAME_WIDTH) % GAME_WIDTH,
        y: (prev.position.y + velocity.y + GAME_HEIGHT) % GAME_HEIGHT
      }

      return { position, velocity, rotation, thrusting }
    })

    // Update bullets
    setBullets(prev => prev
      .map(bullet => ({
        ...bullet,
        position: {
          x: (bullet.position.x + bullet.velocity.x + GAME_WIDTH) % GAME_WIDTH,
          y: (bullet.position.y + bullet.velocity.y + GAME_HEIGHT) % GAME_HEIGHT
        },
        life: bullet.life - 1
      }))
      .filter(bullet => bullet.life > 0)
    )

    // Update asteroids
    setAsteroids(prev => prev.map(asteroid => ({
      ...asteroid,
      position: {
        x: (asteroid.position.x + asteroid.velocity.x + GAME_WIDTH) % GAME_WIDTH,
        y: (asteroid.position.y + asteroid.velocity.y + GAME_HEIGHT) % GAME_HEIGHT
      }
    })))

    // Check collisions
    checkCollisions()

    // Continue game loop
    gameLoopId.current = requestAnimationFrame(gameLoop)
  }, [gameStarted, gameOver, checkCollisions, score, highScore, setHighScore])

  // Handle keyboard events
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === ' ' && !keysPressed.current.has(' ')) {
        // Shoot
        if (!gameStarted) {
          setGameStarted(true)
          return
        }
        if (!gameOver) {
          setBullets(prev => [...prev, {
            position: { ...ship.position },
            velocity: {
              x: Math.cos(ship.rotation * Math.PI / 180) * BULLET_SPEED,
              y: Math.sin(ship.rotation * Math.PI / 180) * BULLET_SPEED
            },
            life: BULLET_LIFE
          }])
        }
      }
      keysPressed.current.add(e.key)
    }

    const handleKeyUp = (e: KeyboardEvent) => {
      keysPressed.current.delete(e.key)
    }

    window.addEventListener('keydown', handleKeyDown)
    window.addEventListener('keyup', handleKeyUp)
    return () => {
      window.removeEventListener('keydown', handleKeyDown)
      window.removeEventListener('keyup', handleKeyUp)
    }
  }, [gameStarted, gameOver, ship])

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
  }, [gameOver, score, highScore])

  // Start new level when all asteroids are destroyed
  useEffect(() => {
    if (asteroids.length === 0 && gameStarted && !gameOver) {
      setAsteroids(initializeAsteroids())
    }
  }, [asteroids.length, gameStarted, gameOver, initializeAsteroids])

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-black p-4">
      <div 
        className="relative bg-black border-2 border-white rounded-lg overflow-hidden"
        style={{ width: GAME_WIDTH, height: GAME_HEIGHT }}
      >
        {/* Ship */}
        <svg 
          width={GAME_WIDTH} 
          height={GAME_HEIGHT} 
          className="absolute inset-0"
        >
          {/* Ship */}
          <path
            d={`M ${ship.position.x + Math.cos(ship.rotation * Math.PI / 180) * SHIP_SIZE} 
                ${ship.position.y + Math.sin(ship.rotation * Math.PI / 180) * SHIP_SIZE} 
                L ${ship.position.x + Math.cos((ship.rotation + 140) * Math.PI / 180) * SHIP_SIZE} 
                ${ship.position.y + Math.sin((ship.rotation + 140) * Math.PI / 180) * SHIP_SIZE} 
                L ${ship.position.x + Math.cos((ship.rotation + 220) * Math.PI / 180) * SHIP_SIZE} 
                ${ship.position.y + Math.sin((ship.rotation + 220) * Math.PI / 180) * SHIP_SIZE} Z`}
            fill="none"
            stroke="white"
            strokeWidth="2"
          />
          
          {/* Thrust flame */}
          {ship.thrusting && (
            <path
              d={`M ${ship.position.x + Math.cos((ship.rotation + 140) * Math.PI / 180) * SHIP_SIZE} 
                  ${ship.position.y + Math.sin((ship.rotation + 140) * Math.PI / 180) * SHIP_SIZE} 
                  L ${ship.position.x + Math.cos((ship.rotation + 180) * Math.PI / 180) * (SHIP_SIZE * 1.5)} 
                  ${ship.position.y + Math.sin((ship.rotation + 180) * Math.PI / 180) * (SHIP_SIZE * 1.5)} 
                  L ${ship.position.x + Math.cos((ship.rotation + 220) * Math.PI / 180) * SHIP_SIZE} 
                  ${ship.position.y + Math.sin((ship.rotation + 220) * Math.PI / 180) * SHIP_SIZE}`}
              fill="none"
              stroke="orange"
              strokeWidth="2"
            />
          )}

          {/* Bullets */}
          {bullets.map((bullet, i) => (
            <circle
              key={i}
              cx={bullet.position.x}
              cy={bullet.position.y}
              r="2"
              fill="white"
            />
          ))}

          {/* Asteroids */}
          {asteroids.map((asteroid, i) => (
            <path
              key={i}
              d={`M ${asteroid.vertices.map((v, i) => 
                `${i === 0 ? '' : 'L '}${v.x + asteroid.position.x} ${v.y + asteroid.position.y}`
              ).join(' ')} Z`}
              fill="none"
              stroke="white"
              strokeWidth="2"
            />
          ))}
        </svg>

        {/* Score and Lives */}
        <div className="absolute top-4 left-4 text-white text-xl">
          Score: {Math.floor(score)}
        </div>
        <div className="absolute top-4 right-4 text-white text-xl">
          Lives: {lives}
        </div>

        {/* Game over screen */}
        {gameOver && (
          <div className="absolute inset-0 bg-black/80 flex flex-col items-center justify-center">
            <div className="text-center text-white">
              <h2 className="text-4xl font-bold mb-4">Game Over!</h2>
              <p className="text-xl mb-2">Score: {Math.floor(score)}</p>
              <p className="text-xl mb-4">High Score: {Math.floor(highScore)}</p>
              <Button 
                onClick={() => {
                  resetGame()
                  setGameStarted(true)
                }}
                className="bg-white text-black hover:bg-gray-200"
              >
                Play Again
              </Button>
            </div>
          </div>
        )}

        {/* Start screen */}
        {!gameStarted && (
          <div className="absolute inset-0 bg-black/80 flex flex-col items-center justify-center">
            <div className="text-center text-white">
              <h1 className="text-4xl font-bold mb-4">Asteroids</h1>
              <div className="mb-6 text-left">
                <p className="mb-2">Controls:</p>
                <p>← → : Rotate ship</p>
                <p>↑ : Thrust</p>
                <p>SPACE : Shoot</p>
              </div>
              <Button 
                onClick={() => setGameStarted(true)}
                className="bg-white text-black hover:bg-gray-200"
              >
                Start Game
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
