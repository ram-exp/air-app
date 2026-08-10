import { Link } from 'react-router-dom'
import { Button } from '@/components/ui'

export default function NotFound() {
  return (
    <div className="flex flex-col items-center justify-center py-24 text-center">
      <h1 className="font-display text-4xl font-bold mb-2">404</h1>
      <p className="text-muted-light dark:text-muted-dark mb-6">This page drifted off somewhere.</p>
      <Link to="/"><Button size="sm">Back to dashboard</Button></Link>
    </div>
  )
}
