'use client'

import { useState, useEffect, useCallback } from 'react'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

type Player = 'X' | 'O' | 'draw' | null
type Board = (Player | null)[]
type Scores = { X: number; O: number; draw: number }

const initialBoard: Board = Array(9).fill(null)

const winningCombinations = [
  [0, 1, 2], [3, 4, 5], [6, 7, 8], // Rows
  [0, 3, 6], [1, 4, 7], [2, 5, 8], // Columns
  [0, 4, 8], [2, 4, 6] // Diagonals
]

export default function TicTacToe() {
  const [board, setBoard] = useState<Board>(initialBoard)
  const [currentPlayer, setCurrentPlayer] = useState<'X' | 'O'>('X')
  const [winner, setWinner] = useState<Player>(null)
  const [gameMode, setGameMode] = useState<'pvp' | 'ai'>('pvp')
  const [aiDifficulty, setAiDifficulty] = useState<'easy' | 'hard'>('easy')
  const [scores, setScores] = useState<Scores>({ X: 0, O: 0, draw: 0 })

  const makeAiMove = useCallback(() => {
    const availableMoves = board.reduce((acc, cell, index) => {
      if (cell === null) acc.push(index)
      return acc
    }, [] as number[])

    let move: number
    if (aiDifficulty === 'easy') {
      move = availableMoves[Math.floor(Math.random() * availableMoves.length)]
    } else {
      move = getBestMove(board, 'O')
    }

    handleClick(move)
  }, [aiDifficulty, board])

  useEffect(() => {
    if (gameMode === 'ai' && currentPlayer === 'O' && !winner) {
      const timer = setTimeout(() => makeAiMove(), 500)
      return () => clearTimeout(timer)
    }
  }, [gameMode, currentPlayer, winner, makeAiMove])

  const checkWinner = (board: Board): Player => {
    for (const combo of winningCombinations) {
      if (board[combo[0]] && board[combo[0]] === board[combo[1]] && board[combo[0]] === board[combo[2]]) {
        return board[combo[0]] as 'X' | 'O'
      }
    }
    if (board.every(cell => cell !== null)) {
      return 'draw'
    }
    return null
  }

  const handleClick = (index: number) => {
    if (board[index] || winner) return

    const newBoard = [...board]
    newBoard[index] = currentPlayer
    setBoard(newBoard)

    const newWinner = checkWinner(newBoard)
    if (newWinner) {
      setWinner(newWinner)
      setScores(prev => ({ ...prev, [newWinner]: prev[newWinner] + 1 }))
    } else {
      setCurrentPlayer(currentPlayer === 'X' ? 'O' : 'X')
    }
  }



  const getBestMove = (board: Board, player: 'X' | 'O'): number => {
    const availableMoves = board.reduce((acc, cell, index) => {
      if (cell === null) acc.push(index)
      return acc
    }, [] as number[])

    if (checkWinner(board)) {
      return player === 'O' ? -1 : 1
    } else if (availableMoves.length === 0) {
      return 0
    }

    const moves = availableMoves.map(move => {
      const newBoard = [...board]
      newBoard[move] = player
      const score = -getBestMove(newBoard, player === 'X' ? 'O' : 'X')
      return { move, score }
    })

    const bestMove = moves.reduce((best, move) => 
      move.score > best.score ? move : best
    )

    return bestMove.move
  }

  const resetGame = () => {
    setBoard(initialBoard)
    setCurrentPlayer('X')
    setWinner(null)
  }

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-background text-foreground p-4">
      <h1 className="text-4xl font-bold mb-8">Tic-Tac-Toe</h1>
      <div className="mb-4 space-x-4">
        <Select value={gameMode} onValueChange={(value: 'pvp' | 'ai') => setGameMode(value)}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Select game mode" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="pvp">Player vs Player</SelectItem>
            <SelectItem value="ai">Player vs AI</SelectItem>
          </SelectContent>
        </Select>
        {gameMode === 'ai' && (
          <Select value={aiDifficulty} onValueChange={(value: 'easy' | 'hard') => setAiDifficulty(value)}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Select AI difficulty" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="easy">Easy</SelectItem>
              <SelectItem value="hard">Hard</SelectItem>
            </SelectContent>
          </Select>
        )}
      </div>
      <div className="grid grid-cols-3 gap-2 mb-4">
        {board.map((cell, index) => (
          <Button
            key={index}
            onClick={() => handleClick(index)}
            className="w-20 h-20 text-4xl"
            variant={cell ? 'default' : 'outline'}
            disabled={!!cell || !!winner || (gameMode === 'ai' && currentPlayer === 'O')}
          >
            {cell}
          </Button>
        ))}
      </div>
      {winner && (
        <div className="text-2xl font-bold mb-4">
          {winner === 'draw' ? "It's a draw!" : `Player ${winner} wins!`}
        </div>
      )}
      <div className="text-xl mb-4">
        Scores: X: {scores.X} - O: {scores.O} - Draws: {scores.draw}
      </div>
      <Button onClick={resetGame} className="mb-4">
        {winner ? 'Play Again' : 'Restart'}
      </Button>
      <div className="text-lg">
        {!winner && `Current player: ${currentPlayer}`}
      </div>
    </div>
  )
}