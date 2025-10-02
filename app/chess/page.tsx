'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'

type PieceType = 'k' | 'q' | 'r' | 'b' | 'n' | 'p'
type Piece = { type: PieceType; color: 'w' | 'b' } | null
type Position = { row: number; col: number }

const initialBoard: Piece[][] = [
  [
    { type: 'r', color: 'b' },
    { type: 'n', color: 'b' },
    { type: 'b', color: 'b' },
    { type: 'q', color: 'b' },
    { type: 'k', color: 'b' },
    { type: 'b', color: 'b' },
    { type: 'n', color: 'b' },
    { type: 'r', color: 'b' }
  ],
  Array(8).fill({ type: 'p', color: 'b' }),
  ...Array(4).fill(Array(8).fill(null)),
  Array(8).fill({ type: 'p', color: 'w' }),
  [
    { type: 'r', color: 'w' },
    { type: 'n', color: 'w' },
    { type: 'b', color: 'w' },
    { type: 'q', color: 'w' },
    { type: 'k', color: 'w' },
    { type: 'b', color: 'w' },
    { type: 'n', color: 'w' },
    { type: 'r', color: 'w' }
  ]
]

const pieceUnicode: Record<PieceType, Record<'w' | 'b', string>> = {
  k: { w: '♔', b: '♚' },
  q: { w: '♕', b: '♛' },
  r: { w: '♖', b: '♜' },
  b: { w: '♗', b: '♝' },
  n: { w: '♘', b: '♞' },
  p: { w: '♙', b: '♟' }
}

// Utility to clone the board
function cloneBoard(board: Piece[][]): Piece[][] {
  return board.map(row => row.map(cell => cell ? { ...cell } : null))
}

// Check if a position is on the board
function isOnBoard(row: number, col: number) {
  return row >= 0 && row < 8 && col >= 0 && col < 8
}

// Get all possible moves for a piece at a position
function getLegalMoves(board: Piece[][], pos: Position, turn: 'w' | 'b'): Position[] {
  const piece = board[pos.row][pos.col]
  if (!piece || piece.color !== turn) return []

  const moves: Position[] = []
  const directions = {
    n: [
      [2, 1], [1, 2], [-1, 2], [-2, 1],
      [-2, -1], [-1, -2], [1, -2], [2, -1]
    ],
    b: [
      [1, 1], [1, -1], [-1, 1], [-1, -1]
    ],
    r: [
      [1, 0], [-1, 0], [0, 1], [0, -1]
    ],
    q: [
      [1, 1], [1, -1], [-1, 1], [-1, -1],
      [1, 0], [-1, 0], [0, 1], [0, -1]
    ],
    k: [
      [1, 1], [1, -1], [-1, 1], [-1, -1],
      [1, 0], [-1, 0], [0, 1], [0, -1]
    ]
  }

  switch (piece.type) {
    case 'p': {
      const dir = piece.color === 'w' ? -1 : 1
      // Forward move
      const nextRow = pos.row + dir
      if (isOnBoard(nextRow, pos.col) && !board[nextRow][pos.col]) {
        moves.push({ row: nextRow, col: pos.col })
        // Double move from starting position
        if (
          (piece.color === 'w' && pos.row === 6) ||
          (piece.color === 'b' && pos.row === 1)
        ) {
          const doubleRow = pos.row + dir * 2
          if (isOnBoard(doubleRow, pos.col) && !board[doubleRow][pos.col]) {
            moves.push({ row: doubleRow, col: pos.col })
          }
        }
      }
      // Captures
      for (const dc of [-1, 1]) {
        const captureRow = pos.row + dir
        const captureCol = pos.col + dc
        if (
          isOnBoard(captureRow, captureCol) &&
          board[captureRow][captureCol] &&
          board[captureRow][captureCol]?.color !== piece.color
        ) {
          moves.push({ row: captureRow, col: captureCol })
        }
      }
      break
    }
    case 'n': {
      for (const [dr, dc] of directions.n) {
        const nr = pos.row + dr
        const nc = pos.col + dc
        if (
          isOnBoard(nr, nc) &&
          (!board[nr][nc] || board[nr][nc]?.color !== piece.color)
        ) {
          moves.push({ row: nr, col: nc })
        }
      }
      break
    }
    case 'b':
    case 'r':
    case 'q': {
      const dirs = directions[piece.type]
      for (const [dr, dc] of dirs) {
        for (let i = 1; i < 8; i++) {
          const nr = pos.row + dr * i
          const nc = pos.col + dc * i
          if (!isOnBoard(nr, nc)) break
          if (!board[nr][nc]) {
            moves.push({ row: nr, col: nc })
          } else {
            if (board[nr][nc]?.color !== piece.color) {
              moves.push({ row: nr, col: nc })
            }
            break
          }
        }
      }
      break
    }
    case 'k': {
      for (const [dr, dc] of directions.k) {
        const nr = pos.row + dr
        const nc = pos.col + dc
        if (
          isOnBoard(nr, nc) &&
          (!board[nr][nc] || board[nr][nc]?.color !== piece.color)
        ) {
          moves.push({ row: nr, col: nc })
        }
      }
      break
    }
  }

  // Filter out moves that would leave king in check
  return moves.filter(move => !wouldLeaveKingInCheck(board, pos, move, turn))
}

// Simulate move and check if king is attacked
function wouldLeaveKingInCheck(board: Piece[][], from: Position, to: Position, turn: 'w' | 'b'): boolean {
  const newBoard = cloneBoard(board)
  newBoard[to.row][to.col] = newBoard[from.row][from.col]
  newBoard[from.row][from.col] = null
  return isKingInCheck(newBoard, turn)
}

// Find king and check if attacked
function isKingInCheck(board: Piece[][], color: 'w' | 'b'): boolean {
  let kingPos: Position | null = null
  for (let r = 0; r < 8; r++) {
    for (let c = 0; c < 8; c++) {
      const piece = board[r][c]
      if (piece && piece.type === 'k' && piece.color === color) {
        kingPos = { row: r, col: c }
        break
      }
    }
    if (kingPos) break
  }
  if (!kingPos) return false
  // Check if any opponent piece can attack king
  for (let r = 0; r < 8; r++) {
    for (let c = 0; c < 8; c++) {
      const piece = board[r][c]
      if (piece && piece.color !== color) {
        const moves = getLegalMovesNoCheck(board, { row: r, col: c }, piece.color)
        if (moves.some(m => m.row === kingPos!.row && m.col === kingPos!.col)) {
          return true
        }
      }
    }
  }
  return false
}

// Get moves for a piece without king check filtering (for check detection)
function getLegalMovesNoCheck(board: Piece[][], pos: Position, turn: 'w' | 'b'): Position[] {
  const piece = board[pos.row][pos.col]
  if (!piece || piece.color !== turn) return []

  const moves: Position[] = []
  const directions = {
    n: [
      [2, 1], [1, 2], [-1, 2], [-2, 1],
      [-2, -1], [-1, -2], [1, -2], [2, -1]
    ],
    b: [
      [1, 1], [1, -1], [-1, 1], [-1, -1]
    ],
    r: [
      [1, 0], [-1, 0], [0, 1], [0, -1]
    ],
    q: [
      [1, 1], [1, -1], [-1, 1], [-1, -1],
      [1, 0], [-1, 0], [0, 1], [0, -1]
    ],
    k: [
      [1, 1], [1, -1], [-1, 1], [-1, -1],
      [1, 0], [-1, 0], [0, 1], [0, -1]
    ]
  }

  switch (piece.type) {
    case 'p': {
      const dir = piece.color === 'w' ? -1 : 1
      // Forward move
      const nextRow = pos.row + dir
      if (isOnBoard(nextRow, pos.col) && !board[nextRow][pos.col]) {
        moves.push({ row: nextRow, col: pos.col })
        // Double move from starting position
        if (
          (piece.color === 'w' && pos.row === 6) ||
          (piece.color === 'b' && pos.row === 1)
        ) {
          const doubleRow = pos.row + dir * 2
          if (isOnBoard(doubleRow, pos.col) && !board[doubleRow][pos.col]) {
            moves.push({ row: doubleRow, col: pos.col })
          }
        }
      }
      // Captures
      for (const dc of [-1, 1]) {
        const captureRow = pos.row + dir
        const captureCol = pos.col + dc
        if (
          isOnBoard(captureRow, captureCol) &&
          board[captureRow][captureCol] &&
          board[captureRow][captureCol]?.color !== piece.color
        ) {
          moves.push({ row: captureRow, col: captureCol })
        }
      }
      break
    }
    case 'n': {
      for (const [dr, dc] of directions.n) {
        const nr = pos.row + dr
        const nc = pos.col + dc
        if (
          isOnBoard(nr, nc) &&
          (!board[nr][nc] || board[nr][nc]?.color !== piece.color)
        ) {
          moves.push({ row: nr, col: nc })
        }
      }
      break
    }
    case 'b':
    case 'r':
    case 'q': {
      const dirs = directions[piece.type]
      for (const [dr, dc] of dirs) {
        for (let i = 1; i < 8; i++) {
          const nr = pos.row + dr * i
          const nc = pos.col + dc * i
          if (!isOnBoard(nr, nc)) break
          if (!board[nr][nc]) {
            moves.push({ row: nr, col: nc })
          } else {
            if (board[nr][nc]?.color !== piece.color) {
              moves.push({ row: nr, col: nc })
            }
            break
          }
        }
      }
      break
    }
    case 'k': {
      for (const [dr, dc] of directions.k) {
        const nr = pos.row + dr
        const nc = pos.col + dc
        if (
          isOnBoard(nr, nc) &&
          (!board[nr][nc] || board[nr][nc]?.color !== piece.color)
        ) {
          moves.push({ row: nr, col: nc })
        }
      }
      break
    }
  }
  return moves
}

export default function ChessGame() {
  const [board, setBoard] = useState<Piece[][]>(initialBoard)
  const [selected, setSelected] = useState<Position | null>(null)
  const [turn, setTurn] = useState<'w' | 'b'>('w')
  const [message, setMessage] = useState('')

  const legalMoves = selected ? getLegalMoves(board, selected, turn) : []

  const handleSquareClick = (row: number, col: number) => {
    const piece = board[row][col]
    if (selected) {
      // Is this a legal move?
      if (legalMoves.some(m => m.row === row && m.col === col)) {
        const newBoard = cloneBoard(board)
        newBoard[row][col] = newBoard[selected.row][selected.col]
        newBoard[selected.row][selected.col] = null
        setBoard(newBoard)
        setSelected(null)
        setTurn(turn === 'w' ? 'b' : 'w')
        setMessage('')
        // Check for check
        if (isKingInCheck(newBoard, turn === 'w' ? 'b' : 'w')) {
          setMessage(`${turn === 'w' ? 'Black' : 'White'} is in check!`)
        }
        return
      }
      setSelected(null)
    } else {
      if (piece && piece.color === turn) {
        setSelected({ row, col })
      }
    }
  }

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-background text-foreground p-4">
      <h1 className="text-4xl font-bold mb-8">Chess</h1>
      <div className="mb-4">Turn: {turn === 'w' ? 'White' : 'Black'}</div>
      <div className="mb-2 text-red-600">{message}</div>
      <div
        className="grid"
        style={{
          gridTemplateRows: 'repeat(8, 48px)',
          gridTemplateColumns: 'repeat(8, 48px)',
          border: '2px solid #333'
        }}
      >
        {board.map((rowArr, row) =>
          rowArr.map((piece, col) => {
            const isSelected = selected?.row === row && selected?.col === col
            const isLegal = legalMoves.some(m => m.row === row && m.col === col)
            const isDark = (row + col) % 2 === 1
            return (
              <button
                key={`${row}-${col}`}
                onClick={() => handleSquareClick(row, col)}
                className={`flex items-center justify-center text-2xl font-bold border border-gray-400 focus:outline-none ${
                  isSelected ? 'ring-2 ring-blue-500' : isLegal ? 'ring-2 ring-green-500' : ''
                }`}
                style={{
                  width: 48,
                  height: 48,
                  background: isDark ? '#b58863' : '#f0d9b5'
                }}
              >
                {piece ? pieceUnicode[piece.type][piece.color] : ''}
              </button>
            )
          })
        )}
      </div>
      <Button onClick={() => { setBoard(initialBoard); setTurn('w'); setSelected(null); setMessage('') }} className="mt-6">
        Restart
      </Button>
    </div>
  )
}