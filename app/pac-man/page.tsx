'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import type { Direction, GameMode, Position, Player, Ghost } from './types'
import {
  CELL_SIZE,
  BOARD_WIDTH,
  BOARD_HEIGHT,
  GHOST_COUNT,
  MOVE_INTERVAL,
  DOT_VALUE,
  POWER_PELLET_VALUE,
  GHOST_VALUE,
  BOARD_LAYOUT
} from './types'

export default function PacMan(): JSX.Element {
  const [gameStarted, setGameStarted] = useState<boolean>(false)
  const [gameOver, setGameOver] = useState<boolean>(false)
  const [gameMode, setGameMode] = useState<GameMode>('single')
  const [board, setBoard] = useState<number[][]>(BOARD_LAYOUT.map(row => [...row]))
  const lastUpdate = useRef<number>(Date.now())
  const [player1, setPlayer1] = useState<Player>({
    position: { x: 9, y: 15 },
    direction: 'left',
    nextDirection: 'left',
    score: 0,
    lives: 3,
    powerPellet: 0
  })
  const [player2, setPlayer2] = useState<Player>({
    position: { x: 9, y: 15 },
    direction: 'right',
    nextDirection: 'right',
    score: 0,
    lives: 3,
    powerPellet: 0
  })
  const [ghosts, setGhosts] = useState<Ghost[]>([])

  // Initialize ghosts
  const initializeGhosts = useCallback(() => {
    const newGhosts: Ghost[] = []
    for (let i = 0; i < GHOST_COUNT; i++) {
      newGhosts.push({
        position: { x: 9, y: 8 },
        direction: ['up', 'down', 'left', 'right'][Math.floor(Math.random() * 4)] as Direction,
        scared: 0,
        respawning: false
      })
    }
    return newGhosts
  }, [])

  // Reset game
  const resetGame = useCallback(() => {
    setBoard(BOARD_LAYOUT.map(row => [...row]))
    setPlayer1({
      position: { x: 9, y: 15 },
      direction: 'left',
      nextDirection: 'left',
      score: 0,
      lives: 3,
      powerPellet: 0
    })
    setPlayer2({
      position: { x: 9, y: 15 },
      direction: 'right',
      nextDirection: 'right',
      score: 0,
      lives: 3,
      powerPellet: 0
    })
    setGhosts(initializeGhosts())
    setGameOver(false)
  }, [initializeGhosts, setBoard, setPlayer1, setPlayer2, setGhosts, setGameOver])

  // Check if move is valid
  const isValidMove = useCallback((x: number, y: number): boolean => {
    const wrappedX = ((x % BOARD_WIDTH) + BOARD_WIDTH) % BOARD_WIDTH
    const wrappedY = ((y % BOARD_HEIGHT) + BOARD_HEIGHT) % BOARD_HEIGHT
    return board[wrappedY][wrappedX] !== 1
  }, [board])

  // Get next position based on direction
  const getNextPosition = useCallback((position: Position, direction: Direction): Position => {
    let { x, y } = position
    switch (direction) {
      case 'up': y--; break
      case 'down': y++; break
      case 'left': x--; break
      case 'right': x++; break
    }
    // Wrap around
    x = (x + BOARD_WIDTH) % BOARD_WIDTH
    y = (y + BOARD_HEIGHT) % BOARD_HEIGHT
    return { x, y }
  }, [])

  // Update player position and handle collisions
  const updatePlayer = useCallback((player: Player, setPlayer: React.Dispatch<React.SetStateAction<Player>>) => {
    const nextPos = getNextPosition(player.position, player.nextDirection)
    if (isValidMove(nextPos.x, nextPos.y)) {
      setPlayer(prev => ({
        ...prev,
        direction: prev.nextDirection,
        position: nextPos
      }))
    } else {
      const currentPos = getNextPosition(player.position, player.direction)
      if (isValidMove(currentPos.x, currentPos.y)) {
        setPlayer(prev => ({
          ...prev,
          position: currentPos
        }))
      }
    }

    // Collect dots and power pellets
    const cell = board[player.position.y][player.position.x]
    if (cell === 2) {
      setBoard(prev => {
        const newBoard = [...prev]
        newBoard[player.position.y][player.position.x] = 0
        return newBoard
      })
      setPlayer(prev => ({ ...prev, score: prev.score + DOT_VALUE }))
    } else if (cell === 3) {
      setBoard(prev => {
        const newBoard = [...prev]
        newBoard[player.position.y][player.position.x] = 0
        return newBoard
      })
      setPlayer(prev => ({ ...prev, score: prev.score + POWER_PELLET_VALUE, powerPellet: 300 }))
      setGhosts(prev => prev.map(ghost => ({ ...ghost, scared: 300 })))
    }
  }, [board, getNextPosition, isValidMove, setBoard, setGhosts])

  // Update ghost positions
  const updateGhosts = useCallback(() => {
    setGhosts(prevGhosts => prevGhosts.map(ghost => {
      if (ghost.respawning) {
        return {
          ...ghost,
          position: { x: 9, y: 8 },
          respawning: false,
          scared: 0
        }
      }

      const possibleDirections: Direction[] = ['up', 'down', 'left', 'right']
      const validDirections = possibleDirections.filter(dir => {
        const nextPos = getNextPosition(ghost.position, dir)
        return isValidMove(nextPos.x, nextPos.y)
      })

      // Randomly change direction sometimes, or if current direction is invalid
      if (Math.random() < 0.1 || !validDirections.includes(ghost.direction)) {
        ghost.direction = validDirections[Math.floor(Math.random() * validDirections.length)]
      }

      const nextPos = getNextPosition(ghost.position, ghost.direction)
      if (isValidMove(nextPos.x, nextPos.y)) {
        ghost.position = nextPos
      }

      if (ghost.scared && ghost.scared > 0) {
        ghost.scared--
      }

      return ghost
    }))
  }, [getNextPosition, isValidMove])

  // Check collisions between players and ghosts
  const checkCollisions = useCallback(() => {
    ghosts.forEach(ghost => {
      // Check player 1
      if (ghost.position.x === player1.position.x && ghost.position.y === player1.position.y) {
        if (player1.powerPellet > 0) {
          setGhosts(prev => prev.map(g => 
            g === ghost ? { ...g, respawning: true } : g
          ))
          setPlayer1(prev => ({ ...prev, score: prev.score + GHOST_VALUE }))
        } else {
          setPlayer1(prev => {
            if (prev.lives <= 1) {
              setGameOver(true)
              return prev
            }
            return { ...prev, lives: prev.lives - 1, position: { x: 9, y: 15 } }
          })
        }
      }

      // Check player 2 in co-op mode
      if (gameMode === 'coop' && ghost.position.x === player2.position.x && ghost.position.y === player2.position.y) {
        if (player2.powerPellet > 0) {
          setGhosts(prev => prev.map(g => 
            g === ghost ? { ...g, respawning: true } : g
          ))
          setPlayer2(prev => ({ ...prev, score: prev.score + GHOST_VALUE }))
        } else {
          setPlayer2(prev => {
            if (prev.lives <= 1) {
              setGameOver(true)
              return prev
            }
            return { ...prev, lives: prev.lives - 1, position: { x: 9, y: 15 } }
          })
        }
      }
    })
  }, [ghosts, player1.position, player2.position, player1.powerPellet, player2.powerPellet, gameMode, setGhosts, setPlayer1, setPlayer2, setGameOver])

  // Game loop
  useEffect(() => {
    if (!gameStarted || gameOver) return

    const interval = setInterval(() => {
      const now = Date.now()
      if (now - lastUpdate.current >= MOVE_INTERVAL) {
        lastUpdate.current = now
        
        updatePlayer(player1, setPlayer1)
        if (gameMode === 'coop') {
          updatePlayer(player2, setPlayer2)
        }
        
        updateGhosts()
        checkCollisions()

        // Update power pellet timers
        setPlayer1(prev => ({
          ...prev,
          powerPellet: Math.max(0, prev.powerPellet - 1)
        }))
        if (gameMode === 'coop') {
          setPlayer2(prev => ({
            ...prev,
            powerPellet: Math.max(0, prev.powerPellet - 1)
          }))
        }

        // Check win condition
        const remainingDots = board.flat().filter((cell: number) => cell === 2 || cell === 3).length
        if (remainingDots === 0) {
          setGameOver(true)
        }
      }
    }, MOVE_INTERVAL / 2)

    return () => clearInterval(interval)
  }, [gameStarted, gameOver, gameMode, board, updatePlayer, updateGhosts, checkCollisions, player1, player2])

  // Handle keyboard input
  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      if (!gameStarted || gameOver) return

      // Player 1 controls (Arrow keys)
      switch (e.key) {
        case 'ArrowUp':
        case 'ArrowDown':
        case 'ArrowLeft':
        case 'ArrowRight': {
          e.preventDefault() // Prevent scrolling
          const direction = e.key.replace('Arrow', '').toLowerCase() as Direction
          setPlayer1(prev => ({
            ...prev,
            nextDirection: direction
          }))
          break
        }

        // Player 2 controls (WASD)
        case 'w':
        case 's':
        case 'a':
        case 'd': {
          if (gameMode === 'coop') {
            const directionMap: { [key: string]: Direction } = {
              w: 'up',
              s: 'down',
              a: 'left',
              d: 'right'
            }
            setPlayer2(prev => ({
              ...prev,
              nextDirection: directionMap[e.key]
            }))
          }
          break
        }
      }
    }

    window.addEventListener('keydown', handleKeyPress)
    return () => window.removeEventListener('keydown', handleKeyPress)
  }, [gameMode, gameStarted, gameOver])

  // Initialize ghosts when game starts
  useEffect(() => {
    if (gameStarted && ghosts.length === 0) {
      setGhosts(initializeGhosts())
    }
  }, [gameStarted, ghosts.length, initializeGhosts])

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-black p-4">
      <div className="mb-4 flex items-center gap-4">
        <Select value={gameMode} onValueChange={(value: GameMode) => setGameMode(value)}>
          <SelectTrigger className="w-[200px]">
            <SelectValue placeholder="Select game mode" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="single">Single Player</SelectItem>
            <SelectItem value="coop">Co-op (2 Players)</SelectItem>
          </SelectContent>
        </Select>
        
        <Button
          onClick={() => {
            resetGame()
            setGameStarted(true)
          }}
          className="bg-blue-500 hover:bg-blue-600"
        >
          {gameStarted ? 'Restart' : 'Start Game'}
        </Button>
      </div>

      <div className="flex gap-8 mb-4">
        <div className="text-white">
          <div>Player 1 Score: {player1.score}</div>
          <div>Lives: {'❤️'.repeat(player1.lives)}</div>
        </div>
        {gameMode === 'coop' && (
          <div className="text-white">
            <div>Player 2 Score: {player2.score}</div>
            <div>Lives: {'❤️'.repeat(player2.lives)}</div>
          </div>
        )}
      </div>

      <div className="relative bg-black"
           style={{
             width: BOARD_WIDTH * CELL_SIZE,
             height: BOARD_HEIGHT * CELL_SIZE
           }}>
        {/* Draw board */}
        {board.map((row, y) => (
          row.map((cell, x) => (
            <div
              key={`${x}-${y}`}
              className={`absolute ${cell === 1 ? 'bg-[#2121ff]' : ''}`}
              style={{
                left: x * CELL_SIZE,
                top: y * CELL_SIZE,
                width: cell === 1 ? CELL_SIZE : 
                       cell === 2 ? 4 : 
                       cell === 3 ? 8 : 0,
                height: cell === 1 ? CELL_SIZE : 
                        cell === 2 ? 4 : 
                        cell === 3 ? 8 : 0,
                backgroundColor: cell === 2 || cell === 3 ? '#ffb897' : undefined,
                borderRadius: cell === 2 || cell === 3 ? '50%' : undefined,
                transform: cell === 2 || cell === 3 ? 'translate(-50%, -50%)' : undefined,
                marginLeft: cell === 2 || cell === 3 ? CELL_SIZE / 2 : 0,
                marginTop: cell === 2 || cell === 3 ? CELL_SIZE / 2 : 0
              }}
            />
          ))
        ))}

        {/* Draw Pac-Man (Player 1) */}
        <div
          className="absolute bg-[#ffff00] rounded-full transition-transform duration-150"
          style={{
            left: player1.position.x * CELL_SIZE,
            top: player1.position.y * CELL_SIZE,
            width: CELL_SIZE,
            height: CELL_SIZE,
            clipPath: 'polygon(100% 0, 100% 100%, 50% 50%)',
            transform: `rotate(${
              player1.direction === 'right' ? 0 :
              player1.direction === 'down' ? 90 :
              player1.direction === 'left' ? 180 :
              270
            }deg)`
          }}
        />

        {/* Draw Pac-Man (Player 2) */}
        {gameMode === 'coop' && (
          <div
            className="absolute bg-[#00ffde] rounded-full transition-transform duration-150"
            style={{
              left: player2.position.x * CELL_SIZE,
              top: player2.position.y * CELL_SIZE,
              width: CELL_SIZE,
              height: CELL_SIZE,
              clipPath: 'polygon(100% 0, 100% 100%, 50% 50%)',
              transform: `rotate(${
                player2.direction === 'right' ? 0 :
                player2.direction === 'down' ? 90 :
                player2.direction === 'left' ? 180 :
                270
              }deg)`
            }}
          />
        )}

        {/* Draw ghosts */}
        {ghosts.map((ghost, index) => (
          <div
            key={index}
            className={`absolute rounded-t-full transition-all duration-150 ${
              ghost.scared ? 'bg-[#2121ff]' :
              index === 0 ? 'bg-[#ff0000]' :
              index === 1 ? 'bg-[#ffb8ff]' :
              index === 2 ? 'bg-[#00ffff]' :
              'bg-[#ffb851]'
            }`}
            style={{
              left: ghost.position.x * CELL_SIZE,
              top: ghost.position.y * CELL_SIZE,
              width: CELL_SIZE,
              height: CELL_SIZE
            }}
          />
        ))}

        {/* Game over screen */}
        {gameOver && (
          <div className="absolute inset-0 bg-black/80 flex items-center justify-center">
            <div className="text-white text-center">
              <h2 className="text-4xl font-bold mb-4">Game Over!</h2>
              <p className="text-xl mb-2">Player 1 Score: {player1.score}</p>
              {gameMode === 'coop' && (
                <p className="text-xl mb-4">Player 2 Score: {player2.score}</p>
              )}
              <Button
                onClick={() => {
                  resetGame()
                  setGameStarted(true)
                }}
                className="bg-blue-500 hover:bg-blue-600"
              >
                Play Again
              </Button>
            </div>
          </div>
        )}

        {/* Start screen */}
        {!gameStarted && (
          <div className="absolute inset-0 bg-black/80 flex items-center justify-center">
            <div className="text-white text-center">
              <h1 className="text-4xl font-bold mb-4">Pac-Man</h1>
              <div className="mb-4 text-left">
                <p className="font-bold mb-2">Controls:</p>
                <p>Player 1: Arrow keys</p>
                {gameMode === 'coop' && <p>Player 2: WASD</p>}
              </div>
              <Button
                onClick={() => setGameStarted(true)}
                className="bg-blue-500 hover:bg-blue-600"
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