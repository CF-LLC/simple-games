'use client'

import { useState } from 'react'
import { Search, Settings } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Switch } from '@/components/ui/switch'
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger
} from '@/components/ui/sheet'
import Link from 'next/link'

const gameCategories = ['All', 'Arcade', 'Puzzle', 'Strategy', 'Board Games']

const games = [
  { id: 1, title: 'Tic-Tac-Toe', category: 'Board Games', description: 'Classic game of X\'s and O\'s', thumbnail: '/placeholder.svg?height=100&width=100' },
  { id: 2, title: 'Memory Match', category: 'Puzzle', description: 'Test your memory by matching cards', thumbnail: '/placeholder.svg?height=100&width=100' },
  { id: 3, title: 'Snake', category: 'Arcade', description: 'Guide the snake to eat and grow', thumbnail: '/placeholder.svg?height=100&width=100' },
]

export default function Dashboard() {
  const [searchTerm, setSearchTerm] = useState('')
  const [activeCategory, setActiveCategory] = useState('All')
  const [darkMode, setDarkMode] = useState(false)
  const [sound, setSound] = useState(true)
  const [animations, setAnimations] = useState(true)

  const filteredGames = games.filter(game => 
    (activeCategory === 'All' || game.category === activeCategory) &&
    game.title.toLowerCase().includes(searchTerm.toLowerCase())
  )

  return (
    <div className={`min-h-screen ${darkMode ? 'dark' : ''}`}>
      <div className="container mx-auto p-4 space-y-4">
        <header className="flex justify-between items-center">
          <h1 className="text-2xl font-bold">Simple Games Dashboard</h1>
          <Sheet>
            <SheetTrigger asChild>
              <Button variant="outline" size="icon">
                <Settings className="h-4 w-4" />
              </Button>
            </SheetTrigger>
            <SheetContent>
              <SheetHeader>
                <SheetTitle>Settings</SheetTitle>
                <SheetDescription>Adjust your game preferences here.</SheetDescription>
              </SheetHeader>
              <div className="space-y-4 mt-4">
                <div className="flex items-center justify-between">
                  <span>Dark Mode</span>
                  <Switch checked={darkMode} onCheckedChange={setDarkMode} />
                </div>
                <div className="flex items-center justify-between">
                  <span>Sound</span>
                  <Switch checked={sound} onCheckedChange={setSound} />
                </div>
                <div className="flex items-center justify-between">
                  <span>Animations</span>
                  <Switch checked={animations} onCheckedChange={setAnimations} />
                </div>
              </div>
            </SheetContent>
          </Sheet>
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
                <img src={game.thumbnail} alt={game.title} className="w-full h-40 object-cover rounded-md" />
                <p className="mt-2">{game.description}</p>
              </CardContent>
              <CardFooter>
              <Button className="w-full" asChild>
                <Link href={`/${game.title.toLowerCase().replace(' ', '-')}`}>Play Now</Link>
              </Button>
              </CardFooter>
            </Card>
          ))}
        </div>
      </div>
    </div>
  )
}