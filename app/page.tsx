'use client'

import { useState } from 'react'
import { Search } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import Link from 'next/link'

const gameCategories = ['All', 'Arcade', 'Puzzle', 'Board Games']

const TicTacToePreview = () => (
  <div className="grid grid-cols-3 gap-1 w-24 h-24 mx-auto bg-gray-100 rounded">
    <div className="flex items-center justify-center text-2xl font-bold text-red-500">X</div>
    <div className="flex items-center justify-center text-2xl font-bold text-blue-500">O</div>
    <div />
    <div />
    <div className="flex items-center justify-center text-2xl font-bold text-blue-500">O</div>
    <div />
    <div className="flex items-center justify-center text-2xl font-bold text-red-500">X</div>
    <div />
    <div />
  </div>
)
const MemoryMatchPreview = () => (
  <div className="grid grid-cols-2 gap-2 w-24 h-24 mx-auto">
    <div className="bg-green-200 rounded flex items-center justify-center font-bold">A</div>
    <div className="bg-pink-200 rounded flex items-center justify-center font-bold">B</div>
    <div className="bg-pink-200 rounded flex items-center justify-center font-bold">B</div>
    <div className="bg-green-200 rounded flex items-center justify-center font-bold">A</div>
  </div>
)
const SnakePreview = () => (
  <div className="relative w-24 h-24 mx-auto bg-green-50 rounded">
    <div className="absolute left-2 top-2 w-4 h-4 bg-green-600 rounded-full" />
    <div className="absolute left-6 top-2 w-4 h-4 bg-green-400 rounded-full" />
    <div className="absolute left-10 top-2 w-4 h-4 bg-green-300 rounded-full" />
    <div className="absolute left-14 top-2 w-4 h-4 bg-green-200 rounded-full" />
    <div className="absolute left-18 top-2 w-4 h-4 bg-green-100 rounded-full" />
  </div>
)
const ChessPreview = () => (
  <div className="grid grid-cols-8 w-24 h-24 mx-auto border border-gray-300 rounded overflow-hidden">
    {[...Array(64)].map((_, i) => (
      <div key={i} className={`flex items-center justify-center text-xs ${((Math.floor(i/8)+i)%2) ? 'bg-yellow-100' : 'bg-white'}`}>
        {i === 4 ? '♔' : i === 59 ? '♚' : ''}
      </div>
    ))}
  </div>
)
const SudokuPreview = () => (
  <div className="grid grid-cols-3 w-24 h-24 mx-auto border border-blue-300 rounded">
    <div className="flex items-center justify-center text-blue-600 font-bold">5</div>
    <div className="flex items-center justify-center text-blue-600 font-bold">3</div>
    <div />
    <div />
    <div className="flex items-center justify-center text-blue-600 font-bold">7</div>
    <div />
    <div />
    <div />
    <div className="flex items-center justify-center text-blue-600 font-bold">1</div>
  </div>
)
const MazePreview = () => (
  <div className="grid grid-cols-4 w-24 h-24 mx-auto bg-gray-50 rounded">
    {[...Array(16)].map((_, i) => (
      <div key={i} className="flex items-center justify-center text-lg">
        {i === 0 ? '🙂' : i === 15 ? '🏁' : ''}
      </div>
    ))}
  </div>
)
const PongPreview = () => (
  <div className="relative w-24 h-24 mx-auto bg-gray-100 rounded">
    <div className="absolute left-2 top-10 w-2 h-12 bg-black rounded" />
    <div className="absolute right-2 top-10 w-2 h-12 bg-black rounded" />
    <div className="absolute left-1/2 top-1/2 w-4 h-4 bg-blue-400 rounded-full" style={{ transform: 'translate(-50%, -50%)' }} />
  </div>
)
const CheckersPreview = () => (
  <div className="grid grid-cols-4 w-24 h-24 mx-auto border border-gray-300 rounded overflow-hidden">
    {[...Array(16)].map((_, i) => (
      <div key={i} className={`flex items-center justify-center text-xs ${((Math.floor(i/4)+i)%2) ? 'bg-red-200' : 'bg-white'}`}>
        {i < 4 ? '⚫' : i > 11 ? '⚪' : ''}
      </div>
    ))}
  </div>
)
const MinesweeperPreview = () => (
  <div className="grid grid-cols-4 w-24 h-24 mx-auto border border-gray-300 rounded">
    {[...Array(16)].map((_, i) => (
      <div key={i} className="flex items-center justify-center text-xs bg-gray-100">
        {i === 5 ? '💣' : i === 10 ? '1' : ''}
      </div>
    ))}
  </div>
)
const Game2048Preview = () => (
  <div className="grid grid-cols-4 gap-1 w-24 h-24 mx-auto bg-yellow-50 rounded p-1">
    <div className="flex items-center justify-center bg-yellow-200 text-yellow-900 font-bold rounded text-xs">2</div>
    <div className="flex items-center justify-center bg-yellow-300 text-yellow-900 font-bold rounded text-xs">4</div>
    <div className="flex items-center justify-center bg-yellow-400 text-yellow-900 font-bold rounded text-xs">8</div>
    <div className="flex items-center justify-center bg-yellow-500 text-yellow-900 font-bold rounded text-xs">16</div>
    <div className="flex items-center justify-center bg-yellow-200 text-yellow-900 font-bold rounded text-xs">32</div>
    <div className="flex items-center justify-center bg-yellow-300 text-yellow-900 font-bold rounded text-xs">64</div>
    <div className="flex items-center justify-center bg-yellow-400 text-yellow-900 font-bold rounded text-xs">128</div>
    <div className="flex items-center justify-center bg-yellow-500 text-yellow-900 font-bold rounded text-xs">256</div>
    <div className="flex items-center justify-center bg-yellow-200 text-yellow-900 font-bold rounded text-xs">512</div>
    <div className="flex items-center justify-center bg-yellow-300 text-yellow-900 font-bold rounded text-xs">1024</div>
    <div className="flex items-center justify-center bg-yellow-400 text-yellow-900 font-bold rounded text-xs">2048</div>
    <div className="flex items-center justify-center bg-yellow-100 text-yellow-900 font-bold rounded text-xs"></div>
    <div className="flex items-center justify-center bg-yellow-100 text-yellow-900 font-bold rounded text-xs"></div>
    <div className="flex items-center justify-center bg-yellow-100 text-yellow-900 font-bold rounded text-xs"></div>
    <div className="flex items-center justify-center bg-yellow-100 text-yellow-900 font-bold rounded text-xs"></div>
    <div className="flex items-center justify-center bg-yellow-100 text-yellow-900 font-bold rounded text-xs"></div>
  </div>
)

const FlappyBirdPreview = () => (
  <div className="relative w-24 h-24 mx-auto bg-sky-300 rounded overflow-hidden">
    <div className="absolute left-8 top-8 w-6 h-6 bg-yellow-400 rounded-full transform -rotate-12">
      <div className="absolute right-0 top-2 w-2 h-2 bg-white rounded-full"></div>
      <div className="absolute right-1 w-3 h-3 bg-orange-500 rounded transform rotate-45"></div>
    </div>
    {/* Pipes */}
    <div className="absolute right-4 top-0 w-4 h-8 bg-green-500"></div>
    <div className="absolute right-4 bottom-0 w-4 h-10 bg-green-500"></div>
  </div>
)

const AsteroidsPreview = () => (
  <div className="relative w-24 h-24 mx-auto bg-gray-900 rounded overflow-hidden">
    {/* Ship */}
    <div className="absolute left-1/2 top-1/2 w-0 h-0 transform -translate-x-1/2 -translate-y-1/2">
      <div className="w-4 h-4 border-2 border-white transform rotate-45"></div>
    </div>
    {/* Asteroids */}
    <div className="absolute left-2 top-2 w-3 h-3 bg-gray-400 rounded-full"></div>
    <div className="absolute right-4 top-6 w-5 h-5 bg-gray-500 rounded-full"></div>
    <div className="absolute left-6 bottom-4 w-4 h-4 bg-gray-600 rounded-full"></div>
  </div>
)

const OthelloPreview = () => (
  <div className="grid grid-cols-4 w-24 h-24 mx-auto bg-green-700 rounded p-1 gap-0.5">
    {[...Array(16)].map((_, i) => (
      <div key={i} className="flex items-center justify-center bg-green-600 rounded-sm">
        {[5, 6, 9, 10].includes(i) && (
          <div className={`w-4 h-4 rounded-full ${i === 5 || i === 10 ? 'bg-white' : 'bg-black'}`} />
        )}
      </div>
    ))}
  </div>
)

const PacManPreview = () => (
  <div className="relative w-24 h-24 mx-auto bg-black rounded overflow-hidden">
    {/* Pac-Man */}
    <div className="absolute left-4 top-8 w-8 h-8 bg-yellow-400 rounded-full">
      <div className="absolute right-0 top-0 w-4 h-4 bg-black transform rotate-45 origin-bottom-left"></div>
    </div>
    {/* Dots */}
    <div className="absolute right-4 top-11 w-2 h-2 bg-white rounded-full"></div>
    <div className="absolute right-8 top-11 w-2 h-2 bg-white rounded-full"></div>
    <div className="absolute right-12 top-11 w-2 h-2 bg-white rounded-full"></div>
  </div>
)

const DotsAndBoxesPreview = () => (
  <div className="relative w-24 h-24 mx-auto bg-white rounded border-2 border-gray-200 p-2">
    <div className="grid grid-cols-3 gap-4 h-full">
      {/* Dots */}
      {[...Array(9)].map((_, i) => (
        <div key={i} className="flex items-center justify-center">
          <div className="w-2 h-2 bg-gray-800 rounded-full"></div>
        </div>
      ))}
      {/* Sample completed box */}
      <div className="absolute left-4 top-4 w-8 h-8 border-2 border-blue-500 bg-blue-100"></div>
    </div>
  </div>
)
const games = [
  { id: 1, title: 'tic-tac-toe', category: 'Board Games', description: "Classic game of X's and O's", preview: <TicTacToePreview /> },
  { id: 2, title: 'memory-match', category: 'Puzzle', description: 'Test your memory by matching cards', preview: <MemoryMatchPreview /> },
  { id: 3, title: 'snake', category: 'Arcade', description: 'Guide the snake to eat and grow', preview: <SnakePreview /> },
  { id: 4, title: 'chess', category: 'Board Games', description: 'Play classic chess against a friend', preview: <ChessPreview /> },
  { id: 5, title: 'sudoku', category: 'Puzzle', description: 'Fill the grid with numbers 1-9', preview: <SudokuPreview /> },
  { id: 6, title: 'maze', category: 'Arcade', description: 'Navigate through the maze to find the exit', preview: <MazePreview /> },
  { id: 7, title: 'pong', category: 'Arcade', description: 'Classic table tennis game', preview: <PongPreview /> },
  { id: 8, title: 'checkers', category: 'Board Games', description: 'Jump and capture your opponent\'s pieces', preview: <CheckersPreview /> },
  { id: 9, title: 'minesweeper', category: 'Puzzle', description: 'Clear the board without hitting a mine', preview: <MinesweeperPreview /> },
  { id: 10, title: '2048', category: 'Puzzle', description: 'Combine tiles to reach 2048', preview: <Game2048Preview /> },
  { id: 11, title: 'flappy-bird', category: 'Arcade', description: 'Navigate the bird through the pipes', preview: <FlappyBirdPreview /> },
  { id: 12, title: 'asteroids', category: 'Arcade', description: 'Destroy asteroids while avoiding collisions', preview: <AsteroidsPreview /> },
  { id: 13, title: 'othello', category: 'Board Games', description: 'Flip your opponent\'s pieces to win', preview: <OthelloPreview /> },
  { id: 14, title: 'pac-man', category: 'Arcade', description: 'Navigate the maze and eat all the pellets', preview: <PacManPreview /> },
  { id: 15, title: 'dots-and-boxes', category: 'Board Games', description: 'Complete boxes by connecting dots', preview: <DotsAndBoxesPreview /> },

]

export default function Dashboard() {
  const [searchTerm, setSearchTerm] = useState('')
  const [activeCategory, setActiveCategory] = useState('All')

  const filteredGames = games.filter(game => 
    (activeCategory === 'All' || game.category === activeCategory) &&
    game.title.toLowerCase().includes(searchTerm.toLowerCase())
  )

  return (
    <div className="min-h-screen">
      <div className="container mx-auto p-4 space-y-4">
        <header className="flex justify-between items-center">
          <h1 className="text-2xl font-bold">Simple Games Dashboard</h1>
        </header>

        <div className="flex items-center space-x-2">
          <Input
            type="search"
            placeholder="Search games..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="flex-grow"
          />
          <Search className="h-4 w-4" />
        </div>

        <Tabs defaultValue="All" className="w-full">
          <TabsList>
            {gameCategories.map(category => (
              <TabsTrigger
                key={category}
                value={category}
                onClick={() => setActiveCategory(category)}
              >
                {category}
              </TabsTrigger>
            ))}
          </TabsList>
        </Tabs>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredGames.map(game => (
            <Card key={game.id}>
              <CardHeader>
                <CardTitle>{game.title}</CardTitle>
                <CardDescription>{game.category}</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex justify-center items-center w-full h-40">{game.preview}</div>
                <p className="mt-2">{game.description}</p>
              </CardContent>
              <CardFooter>
              <Button className="w-full" asChild>
                <Link href={`/${game.title.toLowerCase().replace(/\s+/g, '-')}`}>Play Now</Link>
              </Button>
              </CardFooter>
            </Card>
          ))}
        </div>
      </div>
    </div>
  )
}