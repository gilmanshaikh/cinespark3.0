import { createContext, useContext, useState, useEffect, useCallback } from 'react'
import { getMe } from '../services/api'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [team, setTeam]       = useState(null)
  const [token, setToken]     = useState(() => localStorage.getItem('cinespark_token'))
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function verifyToken() {
      if (!token) { setLoading(false); return }
      try {
        const res = await getMe()
        setTeam(res.data.data)
      } catch {
        localStorage.removeItem('cinespark_token')
        setToken(null)
        setTeam(null)
      } finally {
        setLoading(false)
      }
    }
    verifyToken()
  }, [token])

  const login = useCallback((tokenValue, teamData) => {
    localStorage.setItem('cinespark_token', tokenValue)
    setToken(tokenValue)
    setTeam(teamData)
  }, [])

  const logout = useCallback(() => {
    localStorage.removeItem('cinespark_token')
    setToken(null)
    setTeam(null)
  }, [])

  const updateTeam = useCallback((patch) => {
    setTeam((prev) => prev ? { ...prev, ...patch } : prev)
  }, [])

  return (
    <AuthContext.Provider value={{ team, token, login, logout, loading, updateTeam }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used inside AuthProvider')
  return ctx
}
