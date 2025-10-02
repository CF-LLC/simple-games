'use client'

import { useState, useEffect, useCallback } from 'react'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'

type Card = {
  id: number
  emoji: string
  isFlipped: boolean
  isMatched: boolean
}

const emojis = ['🐶', '🐱', '🐭', '🐹', '🐰', '🦊', '🐻', '🐼', '🐨', '🐯', '🦁', '🐮', '🐷', '🐸', '🐵', '🐔']

const difficulties = {
  easy: 4,
  medium: 8,
  hard: 16
}

export default function MemoryMatch() {
  const [cards, setCards] = useState<Card[]>([])
  const [flippedCards, setFlippedCards] = useState<number[]>([])
  const [moves, setMoves] = useState(0)
  const [gameOver, setGameOver] = useState(false)
  const [timer, setTimer] = useState(0)
  const [difficulty, setDifficulty] = useState<'easy' | 'medium' | 'hard'>('easy')

  const resetGame = useCallback(() => {
    const pairsCount = difficulties[difficulty]
    const shuffledEmojis = [...emojis.slice(0, pairsCount), ...emojis.slice(0, pairsCount)]
      .sort(() => Math.random() - 0.5)
    
    setCards(shuffledEmojis.map((emoji, index) => ({
      id: index,
      emoji,
      isFlipped: false,
      isMatched: false
    })))
    setFlippedCards([])
    setMoves(0)
    setGameOver(false)
    setTimer(0)
  }, [difficulty])

  const handleCardClick = useCallback((id: number) => {
    if (flippedCards.length === 2) return
    
    setCards(prevCards => 
      prevCards.map(card => 
        card.id === id ? { ...card, isFlipped: true } : card
      )
    )
    
    setFlippedCards(prev => [...prev, id])
    
    if (flippedCards.length === 1) {
      setMoves(prevMoves => prevMoves + 1)
      const [firstCardId] = flippedCards
      const firstCard = cards.find(card => card.id === firstCardId)
      const secondCard = cards.find(card => card.id === id)
      
      if (firstCard?.emoji === secondCard?.emoji) {
        setCards(prevCards => 
          prevCards.map(card => 
            card.id === firstCardId || card.id === id
              ? { ...card, isMatched: true }
              : card
          )
        )
        setFlippedCards([])
      } else {
        setTimeout(() => {
          setCards(prevCards => 
            prevCards.map(card => 
              card.id === firstCardId || card.id === id
                ? { ...card, isFlipped: false }
                : card
            )
          )
          setFlippedCards([])
        }, 1000)
      }
    }
  }, [cards, flippedCards])

  useEffect(() => {
    if (cards.every(card => card.isMatched)) {
      setGameOver(true)
    }
  }, [cards])

  useEffect(() => {
    let interval: NodeJS.Timeout
    if (!gameOver) {
      interval = setInterval(() => {
        setTimer(prevTimer => prevTimer + 1)
      }, 1000)
    }
    return () => clearInterval(interval)
  }, [gameOver])

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-background text-foreground p-4">
      <h1 className="text-4xl font-bold mb-8">Memory Match</h1>
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
      <div className="mb-4">
        <span className="mr-4">Moves: {moves}</span>
        <span>Time: {timer}s</span>
      </div>
      <div className={`grid gap-4 ${difficulty === 'easy' ? 'grid-cols-4' : difficulty === 'medium' ? 'grid-cols-4' : 'grid-cols-4 md:grid-cols-8'}`}>
        {cards.map(card => (
          <Button
            key={card.id}
            onClick={() => !card.isFlipped && !card.isMatched && handleCardClick(card.id)}
            className={`w-16 h-16 text-2xl ${card.isFlipped || card.isMatched ? '' : 'bg-primary text-primary-foreground'}`}
            disabled={card.isFlipped || card.isMatched}
          >
            {card.isFlipped || card.isMatched ? card.emoji : ''}
          </Button>
        ))}
      </div>
      {gameOver && (
        <div className="mt-8 text-center">
          <h2 className="text-2xl font-bold mb-4">Congratulations!</h2>
          <p>You completed the game in {moves} moves and {timer} seconds.</p>
          <Button onClick={resetGame} className="mt-4">Play Again</Button>
        </div>
      )}
    </div>
  )
}