import { useState } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import './Auth.css'

function ResetarSenha() {
  const { resetarSenha } = useAuth()
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const token = searchParams.get('token') || ''

  const [novaSenha, setNovaSenha] = useState('')
  const [confirmarSenha, setConfirmarSenha] = useState('')
  const [erro, setErro] = useState('')
  const [enviando, setEnviando] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    setErro('')
    if (novaSenha !== confirmarSenha) {
      setErro('As senhas não coincidem.')
      return
    }
    setEnviando(true)
    try {
      await resetarSenha(token, novaSenha)
      navigate('/login')
    } catch (err) {
      setErro(err.message)
    } finally {
      setEnviando(false)
    }
  }

  if (!token) {
    return (
      <div className="auth-page">
        <div className="auth-card">
          <h1 className="auth-title">Link inválido</h1>
          <div className="auth-error">
            Este link de redefinição de senha está incompleto. Solicite um novo.
          </div>
          <div className="auth-links">
            <Link to="/esqueci-senha">Solicitar novo link</Link>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="auth-page">
      <div className="auth-card">
        <h1 className="auth-title">Definir nova senha</h1>

        {erro && <div className="auth-error">{erro}</div>}

        <form onSubmit={handleSubmit}>
          <div className="auth-field">
            <label htmlFor="novaSenha">Nova senha</label>
            <input
              id="novaSenha"
              type="password"
              autoComplete="new-password"
              minLength={6}
              value={novaSenha}
              onChange={(e) => setNovaSenha(e.target.value)}
              required
            />
          </div>
          <div className="auth-field">
            <label htmlFor="confirmarSenha">Confirmar nova senha</label>
            <input
              id="confirmarSenha"
              type="password"
              autoComplete="new-password"
              minLength={6}
              value={confirmarSenha}
              onChange={(e) => setConfirmarSenha(e.target.value)}
              required
            />
          </div>
          <button type="submit" className="auth-submit" disabled={enviando}>
            {enviando ? 'Salvando...' : 'Salvar nova senha'}
          </button>
        </form>
      </div>
    </div>
  )
}

export default ResetarSenha
