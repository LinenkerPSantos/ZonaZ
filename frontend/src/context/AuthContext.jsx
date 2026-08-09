import { createContext, useCallback, useContext, useEffect, useState } from 'react'
import { apiFetch } from '../services/api'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [usuario, setUsuario] = useState(null)
  const [carregando, setCarregando] = useState(true)

  useEffect(() => {
    apiFetch('/api/auth/me')
      .then(({ usuario }) => setUsuario(usuario))
      .catch(() => setUsuario(null))
      .finally(() => setCarregando(false))
  }, [])

  const registrar = useCallback(async (email, senha) => {
    const { usuario } = await apiFetch('/api/auth/registrar', {
      method: 'POST',
      body: JSON.stringify({ email, senha }),
    })
    setUsuario(usuario)
    return usuario
  }, [])

  const login = useCallback(async (identificador, senha) => {
    const { usuario } = await apiFetch('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify({ identificador, senha }),
    })
    setUsuario(usuario)
    return usuario
  }, [])

  const logout = useCallback(async () => {
    await apiFetch('/api/auth/logout', { method: 'POST' })
    setUsuario(null)
  }, [])

  const esqueciSenha = useCallback(async (email) => {
    return apiFetch('/api/auth/esqueci-senha', {
      method: 'POST',
      body: JSON.stringify({ email }),
    })
  }, [])

  const resetarSenha = useCallback(async (token, novaSenha) => {
    return apiFetch('/api/auth/resetar-senha', {
      method: 'POST',
      body: JSON.stringify({ token, nova_senha: novaSenha }),
    })
  }, [])

  return (
    <AuthContext.Provider value={{ usuario, carregando, registrar, login, logout, esqueciSenha, resetarSenha }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  return useContext(AuthContext)
}
