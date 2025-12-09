import { useState } from 'react'
import { supabase } from '../utils/supabase'
import { useNavigate } from 'react-router-dom'
import { useRedirect } from '../hooks/useRedirect'
import { Loader2 } from 'lucide-react'

export default function Login() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const navigate = useNavigate()
  const redirectPath = useRedirect('/dashboard')

  const handleLogin = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    })

    if (error) {
      setError(error.message)
      setLoading(false)
    } else {
      navigate(redirectPath)
    }
  }

  return (
    <div className="min-h-screen flex bg-gray-50 font-sans relative">
      {/* Left Side - Hero/Branding (Hidden on mobile) */}
      <div className="hidden lg:flex lg:w-1/2 relative bg-slate-900 items-center justify-center overflow-hidden">
        {/* Background Image Layer (z-0) */}
        <div className="absolute inset-0 z-0">
             <div 
               className="absolute top-0 left-0 w-full h-full bg-cover bg-center"
               style={{ backgroundImage: "url('/login-bg.jpg')" }}
             />
        </div>
        
        {/* Gradient Overlay Layer (z-10) - More transparency for better visibility, premium Amber/Gold tone */}
        <div className="absolute inset-0 bg-gradient-to-br from-amber-500/60 to-slate-900/80 z-10 mix-blend-multiply" />
        
        {/* Content Layer (z-20) */}
        <div className="relative z-20 p-12 text-white max-w-lg">
           <div className="bg-white/10 backdrop-blur-md p-4 rounded-3xl inline-block shadow-2xl mb-8 border border-white/20">
             <img 
              src="/scooterlink.png" 
              alt="ScooterLink Logo" 
              className="w-24 h-24 object-contain drop-shadow-md"
            />
           </div>
          <h1 className="text-5xl font-bold mb-6 tracking-tight text-white drop-shadow-lg">Manage your shop with ease.</h1>
          <p className="text-xl text-amber-50 leading-relaxed font-medium drop-shadow-md">
            The most comprehensive Point of Sale solution for modern scooter businesses. Track inventory, manage sales, and grow your business.
          </p>
        </div>
      </div>

      {/* Right Side - Login Form */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-6 lg:p-12">
        <div className="w-full max-w-md bg-white rounded-3xl p-8 lg:p-12 shadow-xl border border-gray-100">
            
            {/* Mobile Logo */}
            <div className="lg:hidden flex flex-col items-center mb-8">
                <div className="bg-yellow-50 p-3 rounded-2xl mb-4">
                  <img 
                    src="/scooterlink.png" 
                    alt="ScooterLink Logo" 
                    className="w-16 h-16 object-contain"
                  />
                </div>
                <h2 className="text-2xl font-bold text-gray-900 hidden">ScooterLink</h2>
            </div>

          <div className="text-center lg:text-left mb-10">
            <h2 className="text-3xl font-bold text-gray-900 mb-2 tracking-tight">Welcome Back</h2>
            <p className="text-gray-500">Please enter your details to sign in</p>
          </div>

          {error && (
            <div className="bg-red-50 text-red-600 p-4 rounded-xl mb-6 text-sm border border-red-100 flex items-center shadow-sm">
              <span className="mr-2">⚠️</span> {error}
            </div>
          )}

          <form onSubmit={handleLogin} className="space-y-6">
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-2">Email Address</label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-5 py-3.5 rounded-xl border border-gray-200 bg-gray-50 focus:bg-white focus:ring-2 focus:ring-yellow-400 focus:border-transparent outline-none transition-all duration-200"
                placeholder="admin@scooterlink.com"
              />
            </div>
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-2">Password</label>
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-5 py-3.5 rounded-xl border border-gray-200 bg-gray-50 focus:bg-white focus:ring-2 focus:ring-yellow-400 focus:border-transparent outline-none transition-all duration-200"
                placeholder="••••••••"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-yellow-400 hover:bg-yellow-500 text-white font-bold py-4 rounded-xl shadow-lg shadow-yellow-400/30 transition-all duration-200 transform hover:-translate-y-0.5 active:translate-y-0 disabled:opacity-50 disabled:cursor-not-allowed flex justify-center items-center text-base"
            >
              {loading ? <Loader2 className="animate-spin w-6 h-6" /> : 'Sign In to Dashboard'}
            </button>
          </form>

          <div className="mt-8 text-center">
            <p className="text-xs text-gray-400 font-medium">
              Protected by Supabase Auth
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
