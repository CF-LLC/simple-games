'use client'

import React, { useState, useCallback, useEffect } from 'react'

type Player = 'black' | 'white'
type Cell = Player | null

const BOARD_SIZE = 8

export default function Othello() {
  const [board, setBoard] = useState<Cell[][]>(initializeBoard())
  const [currentPlayer, setCurrentPlayer] = useState<Player>('black')
  const [gameOver, setGameOver] = useState(false)
  const [winner, setWinner] = useState<Player | 'Draw' | null>(null)
  const [botEnabled, setBotEnabled] = useState(false)

  function initializeBoard(): Cell[][] {
    const board = Array(BOARD_SIZE).fill(null).map(() => Array(BOARD_SIZE).fill(null))
    const mid = BOARD_SIZE / 2 - 1
    board[mid][mid] = 'white'
    board[mid][mid + 1] = 'black'
    board[mid + 1][mid] = 'black'
    board[mid + 1][mid + 1] = 'white'
    return board
  }

  const getOpponent = useCallback((player: Player): Player => player === 'black' ? 'white' : 'black', [])

  const isValidMove = useCallback((row: number, col: number, player: Player, checkBoard: Cell[][]): boolean => {
    if (checkBoard[row][col] !== null) return false

    const directions = [
      [-1, -1], [-1, 0], [-1, 1],
      [0, -1],           [0, 1],
      [1, -1],  [1, 0],  [1, 1]
    ]

    return directions.some(([dx, dy]) => {
      let x = row + dx
      let y = col + dy
      if (x < 0 || x >= BOARD_SIZE || y < 0 || y >= BOARD_SIZE || checkBoard[x][y] !== getOpponent(player)) {
        return false
      }
      while (x >= 0 && x < BOARD_SIZE && y >= 0 && y < BOARD_SIZE) {
        if (checkBoard[x][y] === null) return false
        if (checkBoard[x][y] === player) return true
        x += dx
        y += dy
      }
      return false
    })
  }, [getOpponent])

  const flipPieces = useCallback((row: number, col: number, player: Player, checkBoard: Cell[][]) => {
    const directions = [
      [-1, -1], [-1, 0], [-1, 1],
      [0, -1],           [0, 1],
      [1, -1],  [1, 0],  [1, 1]
    ]

    const newBoard = checkBoard.map(row => [...row])
    newBoard[row][col] = player

    directions.forEach(([dx, dy]) => {
      let x = row + dx
      let y = col + dy
      const piecesToFlip: [number, number][] = []

      while (x >= 0 && x < BOARD_SIZE && y >= 0 && y < BOARD_SIZE && checkBoard[x][y] === getOpponent(player)) {
        piecesToFlip.push([x, y])
        x += dx
        y += dy
      }

      if (x >= 0 && x < BOARD_SIZE && y >= 0 && y < BOARD_SIZE && checkBoard[x][y] === player) {
        piecesToFlip.forEach(([fx, fy]) => {
          newBoard[fx][fy] = player
        })
      }
    })

    return newBoard
  }, [getOpponent])

  const hasValidMove = useCallback((player: Player, checkBoard: Cell[][]): boolean => {
    for (let i = 0; i < BOARD_SIZE; i++) {
      for (let j = 0; j < BOARD_SIZE; j++) {
        if (isValidMove(i, j, player, checkBoard)) return true
      }
    }
    return false
  }, [isValidMove])

  const countPieces = useCallback(() => {
    let black = 0
    let white = 0
    board.forEach(row => {
      row.forEach(cell => {
        if (cell === 'black') black++
        if (cell === 'white') white++
      })
    })
    return { black, white }
  }, [board])

  const isBoardFull = useCallback(() => {
    return board.every(row => row.every(cell => cell !== null))
  }, [board])

  const checkGameOver = useCallback((checkBoard: Cell[][]) => {
    if (isBoardFull()) return true
    return !hasValidMove('black', checkBoard) && !hasValidMove('white', checkBoard)
  }, [isBoardFull, hasValidMove])

  const nextTurn = useCallback((checkBoard: Cell[][]) => {
    const nextPlayer = getOpponent(currentPlayer)
    if (hasValidMove(nextPlayer, checkBoard)) {
      setCurrentPlayer(nextPlayer)
    } else if (hasValidMove(currentPlayer, checkBoard)) {
      console.log(`${nextPlayer} has no valid moves. ${currentPlayer} goes again.`)
    } else {
      setGameOver(true)
    }
  }, [currentPlayer, getOpponent, hasValidMove, setCurrentPlayer, setGameOver])

  const handleCellClick = useCallback((row: number, col: number) => {
    if (gameOver || !isValidMove(row, col, currentPlayer, board)) return

    const newBoard = flipPieces(row, col, currentPlayer, board)
    setBoard(newBoard)
    nextTurn(newBoard)
  }, [gameOver, isValidMove, flipPieces, currentPlayer, board, nextTurn])

  const evaluateBoard = (checkBoard: Cell[][], player: Player) => {
    let score = 0
    for (let i = 0; i < BOARD_SIZE; i++) {
      for (let j = 0; j < BOARD_SIZE; j++) {
        if (checkBoard[i][j] === player) {
          if ((i === 0 || i === BOARD_SIZE - 1) && (j === 0 || j === BOARD_SIZE - 1)) {
            score += 4 // Corners are highly valuable
          } else if (i === 0 || i === BOARD_SIZE - 1 || j === 0 || j === BOARD_SIZE - 1) {
            score += 2 // Edges are somewhat valuable
          } else {
            score += 1
          }
        }
      }
    }
    return score
  }

  const botMove = useCallback(() => {
    let bestScore = -Infinity
    let bestMove: [number, number] | null = null

    for (let i = 0; i < BOARD_SIZE; i++) {
      for (let j = 0; j < BOARD_SIZE; j++) {
        if (isValidMove(i, j, currentPlayer, board)) {
          const newBoard = flipPieces(i, j, currentPlayer, board)
          const score = evaluateBoard(newBoard, currentPlayer)
          if (score > bestScore) {
            bestScore = score
            bestMove = [i, j]
          }
        }
      }
    }

    if (bestMove) {
      const [row, col] = bestMove
      const newBoard = flipPieces(row, col, currentPlayer, board)
      setBoard(newBoard)
      nextTurn(newBoard)
    } else {
      nextTurn(board)
    }
  }, [currentPlayer, board, isValidMove, flipPieces, nextTurn])

  const resetGame = useCallback(() => {
    setBoard(initializeBoard())
    setCurrentPlayer('black')
    setGameOver(false)
    setWinner(null)
  }, [])

  useEffect(() => {
    if (checkGameOver(board)) {
      setGameOver(true)
      const { black, white } = countPieces()
      if (black > white) setWinner('black')
      else if (white > black) setWinner('white')
      else setWinner('Draw')
    } else if (botEnabled && currentPlayer === 'white') {
      const timer = setTimeout(botMove, 500)
      return () => clearTimeout(timer)
    }
  }, [board, checkGameOver, botEnabled, currentPlayer, botMove, countPieces, setGameOver, setWinner])

  const { black, white } = countPieces()

  return (
    <div className="flex flex-col items-center justify-center min-h-screen p-4 bg-green-50">
      <div className="grid grid-cols-8 gap-1 p-4 bg-green-700 rounded-lg shadow-lg">
        {board.map((row, rowIndex) => (
          row.map((cell, colIndex) => (
            <button
              key={`${rowIndex}-${colIndex}`}
              className={`w-12 h-12 flex items-center justify-center bg-green-600 rounded-sm transition-colors
                ${cell === 'black' ? 'hover:bg-green-700' : cell === 'white' ? 'hover:bg-green-700' : ''}
                ${isValidMove(rowIndex, colIndex, currentPlayer, board) ? 'hover:bg-green-500' : ''}`}
              onClick={() => handleCellClick(rowIndex, colIndex)}
              disabled={gameOver || (botEnabled && currentPlayer === 'white') || !isValidMove(rowIndex, colIndex, currentPlayer, board)}
            >
              {cell && <div className={`w-8 h-8 rounded-full transition-transform transform hover:scale-105
                ${cell === 'black' ? 'bg-black' : 'bg-white'} shadow-md`} />}
            </button>
          ))
        ))}
      </div>
      {gameOver ? (
        <div className={`mt-4 p-4 rounded-lg text-center bg-black shadow-lg 
          ${winner === 'black' ? 'bg-black text-white' : winner === 'white' ? 'bg-white text-black' : 'bg-gray-100'}`}>
          <div className="text-xl font-bold mb-4">
            {winner === 'Draw' ? "It's a draw!" : `${winner} wins!`}
          </div>
          <button 
            onClick={resetGame} 
            className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors"
          >
            Reset
          </button>
        </div>
      ) : (
        <>
          <div className="flex justify-center gap-8 mt-4 text-lg font-semibold">
            <div className={`p-2 rounded ${currentPlayer === 'black' ? 'bg-black text-white' : ''}`}>
              Black: {black}
            </div>
            <div className={`p-2 rounded ${currentPlayer === 'white' ? 'bg-white text-black border' : ''}`}>
              White: {white}
            </div>
          </div>
          <div className="mt-4">
            <button 
              onClick={() => setBotEnabled(!botEnabled)} 
              className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors"
            >
              {botEnabled ? 'Disable Bot' : 'Enable Bot'}
            </button>
          </div>
        </>
      )}
    </div>
  )
}