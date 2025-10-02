'use client'

import { useState, useEffect } from 'react'
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
type PieceType = 'red' | 'black' | null
type KingStatus = boolean

interface Piece {
  type: PieceType
  isKing: KingStatus
}

interface GameData {
  board: (Piece | null)[][]
  selectedPiece: { row: number; col: number } | null
  validMoves: { row: number; col: number }[]
  currentPlayer: 'red' | 'black'
  redScore: number
  blackScore: number
}

const BOARD_SIZE = 8

const createInitialBoard = (): (Piece | null)[][] => {
  const board = Array(BOARD_SIZE).fill(null).map(() => Array(BOARD_SIZE).fill(null))

  // Place black pieces (top)
  for (let row = 0; row < 3; row++) {
    for (let col = 0; col < BOARD_SIZE; col++) {
      if ((row + col) % 2 === 1) {
        board[row][col] = { type: 'black', isKing: false }
      }
    }
  }

  // Place red pieces (bottom)
  for (let row = 5; row < BOARD_SIZE; row++) {
    for (let col = 0; col < BOARD_SIZE; col++) {
      if ((row + col) % 2 === 1) {
        board[row][col] = { type: 'red', isKing: false }
      }
    }
  }

  return board
}

export default function CheckersGame() {
  console.log('Component initialized')
  const [gameMode, setGameMode] = useState<GameMode>('pvp')
  const [gameState, setGameState] = useState<GameState>('start')
  const [gameData, setGameData] = useState<GameData>({
    board: createInitialBoard(),
    selectedPiece: null,
    validMoves: [],
    currentPlayer: 'red',
    redScore: 0,
    blackScore: 0
  })





  const getSquareColor = (row: number, col: number) => {
    const isSquareDark = (row + col) % 2 === 1
    const isValidMove = gameData.validMoves.some(move => move.row === row && move.col === col)
    const isSelected = gameData.selectedPiece?.row === row && gameData.selectedPiece?.col === col

    if (isSelected) return 'bg-blue-500'
    if (isValidMove) return 'bg-blue-300'
    return isSquareDark ? 'bg-gray-700' : 'bg-gray-300'
  }

  const renderPiece = (piece: Piece | null) => {
    if (!piece) return null

    return (
      <div
        className={`w-[50px] h-[50px] rounded-full ${
          piece.type === 'red' ? 'bg-red-500' : 'bg-black'
        } border-4 border-white flex items-center justify-center`}
      >
        {piece.isKing && (
          <span className="text-white text-2xl font-bold">K</span>
        )}
      </div>
    )
  }

  const getValidMoves = (row: number, col: number) => {
    const piece = gameData.board[row][col]
    if (!piece) return []

    const moves: { row: number; col: number }[] = []
    const direction = piece.type === 'red' ? -1 : 1
    const directions = piece.isKing ? [direction, -direction] : [direction]

    // Check regular diagonal moves and jumps
    directions.forEach(dir => {
      [-1, 1].forEach(diagCol => {
        // Regular move
        const newRow = row + dir
        const newCol = col + diagCol
        if (
          newRow >= 0 && newRow < BOARD_SIZE &&
          newCol >= 0 && newCol < BOARD_SIZE
        ) {
          if (!gameData.board[newRow][newCol]) {
            moves.push({ row: newRow, col: newCol })
          } else if (
            gameData.board[newRow][newCol]?.type !== piece.type &&
            newRow + dir >= 0 && newRow + dir < BOARD_SIZE &&
            newCol + diagCol >= 0 && newCol + diagCol < BOARD_SIZE &&
            !gameData.board[newRow + dir][newCol + diagCol]
          ) {
            // Jump move available
            moves.push({ row: newRow + dir, col: newCol + diagCol })
          }
        }
      })
    })

    return moves
  }

  const getAllValidMoves = (player: 'red' | 'black') => {
    const moves: { from: { row: number; col: number }; to: { row: number; col: number } }[] = []
    
    for (let row = 0; row < BOARD_SIZE; row++) {
      for (let col = 0; col < BOARD_SIZE; col++) {
        const piece = gameData.board[row][col]
        if (piece && piece.type === player) {
          const validMoves = getValidMoves(row, col)
          validMoves.forEach(move => {
            moves.push({
              from: { row, col },
              to: move
            })
          })
        }
      }
    }

    return moves
  }





  useEffect(() => {
    console.log('Game State:', gameState)
    console.log('Game Mode:', gameMode)
    console.log('Current Player:', gameData.currentPlayer)
    
    if (gameState === 'playing' && gameMode === 'computer' && gameData.currentPlayer === 'black') {
      console.log('AI turn triggered')
      const moves = getAllValidMoves('black')
      console.log('Available moves:', moves)
      
      if (moves.length > 0) {
        const jumpMoves = moves.filter(move => 
          Math.abs(move.to.row - move.from.row) === 2
        )
        const movesToUse = jumpMoves.length > 0 ? jumpMoves : moves
        const selectedMove = movesToUse[Math.floor(Math.random() * movesToUse.length)]
        
        console.log('AI selected move:', selectedMove)
        
        const timer = setTimeout(() => {
          // Create new board state with the move applied
          const newBoard = JSON.parse(JSON.stringify(gameData.board))
          const piece = newBoard[selectedMove.from.row][selectedMove.from.col]
          
          // Move the piece
          newBoard[selectedMove.from.row][selectedMove.from.col] = null
          newBoard[selectedMove.to.row][selectedMove.to.col] = piece
          
          // Handle capture if it's a jump move
          if (Math.abs(selectedMove.to.row - selectedMove.from.row) === 2) {
            const jumpedRow = selectedMove.from.row + (selectedMove.to.row - selectedMove.from.row) / 2
            const jumpedCol = selectedMove.from.col + (selectedMove.to.col - selectedMove.from.col) / 2
            newBoard[jumpedRow][jumpedCol] = null
            
            // Update score for capture
            const newScore = gameData.blackScore + 1
            
            // Update game state with capture
            setGameData(prev => ({
              ...prev,
              board: newBoard,
              blackScore: newScore,
              currentPlayer: 'red',
              selectedPiece: null,
              validMoves: []
            }))
          } else {
            // Update game state without capture
            setGameData(prev => ({
              ...prev,
              board: newBoard,
              currentPlayer: 'red',
              selectedPiece: null,
              validMoves: []
            }))
          }
          
          console.log('AI move completed')
        }, 1000)
        
        return () => clearTimeout(timer)
      }
    }
  }, [gameState, gameMode, gameData.currentPlayer, gameData.board, gameData.blackScore, setGameData, getValidMoves, getAllValidMoves])

  const handleSquareClick = (row: number, col: number, isAIMove: boolean = false) => {
    console.log('Square clicked:', row, col, isAIMove ? '(AI Move)' : '(Human Move)')
    console.log('Game state:', gameState)
    console.log('Game mode:', gameMode)
    console.log('Current player:', gameData.currentPlayer)
    
    if (gameState !== 'playing') {
      console.log('Game not in playing state')
      return
    }
    if (gameMode === 'computer' && gameData.currentPlayer === 'black' && !isAIMove) {
      console.log('Blocked human move during AI turn')
      return
    }

    const piece = gameData.board[row][col]
    
    // If no piece is selected
    if (!gameData.selectedPiece) {
      if (piece && piece.type === gameData.currentPlayer) {
        const validMoves = getValidMoves(row, col)
        setGameData(prev => ({
          ...prev,
          selectedPiece: { row, col },
          validMoves
        }))
      }
      return
    }

    // If clicking on a valid move location
    if (gameData.validMoves.some(move => move.row === row && move.col === col)) {
      const newBoard = JSON.parse(JSON.stringify(gameData.board))
      const { row: fromRow, col: fromCol } = gameData.selectedPiece
      const piece = newBoard[fromRow][fromCol]

      // Move the piece
      newBoard[fromRow][fromCol] = null
      newBoard[row][col] = piece

      // Check if this was a jump move
      if (Math.abs(row - fromRow) === 2) {
        const jumpedRow = fromRow + (row - fromRow) / 2
        const jumpedCol = fromCol + (col - fromCol) / 2
        newBoard[jumpedRow][jumpedCol] = null

        // Update score
        const scoreUpdate = piece.type === 'red' ? { redScore: gameData.redScore + 1 } : { blackScore: gameData.blackScore + 1 }
        
        // Check for king promotion
        if (
          (piece.type === 'red' && row === 0) ||
          (piece.type === 'black' && row === BOARD_SIZE - 1)
        ) {
          piece.isKing = true
        }

        // Check for additional jumps
        const additionalJumps = getValidMoves(row, col).filter(move =>
          Math.abs(move.row - row) === 2
        )

        setGameData(prev => ({
          ...prev,
          board: newBoard,
          selectedPiece: additionalJumps.length > 0 ? { row, col } : null,
          validMoves: additionalJumps,
          currentPlayer: additionalJumps.length > 0 ? prev.currentPlayer : (prev.currentPlayer === 'red' ? 'black' : 'red'),
          ...scoreUpdate
        }))
      } else {
        // Check for king promotion
        if (
          (piece.type === 'red' && row === 0) ||
          (piece.type === 'black' && row === BOARD_SIZE - 1)
        ) {
          piece.isKing = true
        }

        setGameData(prev => ({
          ...prev,
          board: newBoard,
          selectedPiece: null,
          validMoves: [],
          currentPlayer: prev.currentPlayer === 'red' ? 'black' : 'red'
        }))
      }
    } else if (piece && piece.type === gameData.currentPlayer) {
      // If clicking on another own piece, select it instead
      const validMoves = getValidMoves(row, col)
      setGameData(prev => ({
        ...prev,
        selectedPiece: { row, col },
        validMoves
      }))
    } else {
      // Clicking on an invalid location, deselect the piece
      setGameData(prev => ({
        ...prev,
        selectedPiece: null,
        validMoves: []
      }))
    }
  }

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-background text-foreground p-4">
      <h1 className="text-4xl font-bold mb-4">Checkers</h1>
      
      <div className="mb-6 w-[200px]">
        <Select 
          defaultValue={gameMode} 
          onValueChange={(value) => {
            console.log('Mode selected:', value)
            setGameMode(value as GameMode)
            setGameState('start')
            setGameData({
              board: createInitialBoard(),
              selectedPiece: null,
              validMoves: [],
              currentPlayer: 'red',
              redScore: 0,
              blackScore: 0
            })
          }}
        >
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
        <div className="grid grid-cols-8 gap-0 border-2 border-gray-600">
          {gameData.board.map((row, rowIndex) => (
            row.map((piece, colIndex) => (
              <div
                key={`${rowIndex}-${colIndex}`}
                className={`w-[70px] h-[70px] ${getSquareColor(
                  rowIndex,
                  colIndex
                )} flex items-center justify-center cursor-pointer`}
                onClick={() => handleSquareClick(rowIndex, colIndex)}
              >
                {renderPiece(piece)}
              </div>
            ))
          ))}
        </div>

        {(gameState === 'start' || gameState === 'paused') && (
          <div className="absolute top-0 left-0 w-full h-full bg-black bg-opacity-75 flex flex-col items-center justify-center text-white">
            <div className="mb-8 text-center">
              <h2 className="text-2xl font-bold mb-4">
                {gameState === 'start' ? 'How to Play' : 'Game Paused'}
              </h2>
              <div className="space-y-2">
                <p>Click to select and move pieces</p>
                <p>Capture opponent pieces by jumping over them</p>
                <p>Get a king by reaching the opposite end</p>
              </div>
            </div>
            <Button onClick={() => {
              console.log('Starting game with mode:', gameMode)
              setGameState('playing')
              setGameData(prev => ({
                ...prev,
                currentPlayer: 'red',
                selectedPiece: null,
                validMoves: []
              }))
            }}>
              {gameState === 'start' ? 'Start Game' : 'Resume Game'}
            </Button>
          </div>
        )}
      </div>

      <div className="mt-4 text-center">
        <p className="text-xl">
          Current Player: <span className={`font-bold ${gameData.currentPlayer === 'red' ? 'text-red-500' : 'text-black'}`}>
            {gameData.currentPlayer.toUpperCase()}
          </span>
        </p>
        <p className="mt-2">
          Score - Red: {gameData.redScore} | Black: {gameData.blackScore}
        </p>
      </div>
    </div>
  )
}
