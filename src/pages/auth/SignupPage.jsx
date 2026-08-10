import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Sparkles } from 'lucide-react'
import { Button, Input, Card } from '@/components/ui'
import { supabase } from '@/lib/supabase'
import toast from 'react-hot-toast'
import AuroraField from '@/components/layout/AuroraField'

export default function SignupPage() {
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const navigate = useNavigate()

  const submit = async (e) => {
    e.preventDefault()
    setLoading(true)
    try {
      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: { data: { display_name: name } },
      })
      if (error) throw error
      toast.success('Cek email kamu untuk konfirmasi akun (kalau email confirmation aktif di project Supabase-mu).')
      navigate('/')
    } catch (err) {
      toast.error(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4 relative">
      <AuroraField />
      <Card className="w-full max-w-sm relative z-[1]" glass={false}>
        <div className="flex flex-col items-center mb-6">
          <div className="h-11 w-11 rounded-2xl bg-primary-500 flex items-center justify-center text-white mb-3">
            <Sparkles size={20} />
          </div>
          <h1 className="font-display font-semibold text-xl">Create your account</h1>
          <p className="text-sm text-muted-light dark:text-muted-dark">Start organizing your life with AIR</p>
        </div>
        <form onSubmit={submit} className="space-y-3">
          <Input placeholder="Full name" value={name} onChange={(e) => setName(e.target.value)} />
          <Input type="email" placeholder="Email" value={email} onChange={(e) => setEmail(e.target.value)} required />
          <Input type="password" placeholder="Password" value={password} onChange={(e) => setPassword(e.target.value)} required minLength={6} />
          <Button type="submit" className="w-full justify-center" loading={loading}>Create account</Button>
        </form>
        <p className="text-sm text-center mt-5 text-muted-light dark:text-muted-dark">
          Already have an account? <Link to="/login" className="text-primary-500 font-medium">Sign in</Link>
        </p>
      </Card>
    </div>
  )
}
