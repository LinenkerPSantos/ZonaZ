import { Routes, Route } from 'react-router-dom'
import Navbar from './components/Navbar'
import Footer from './components/Footer'
import Pagina1Apresentacao from './pages/Pagina1Apresentacao'
import Pagina2Mecanicas from './pages/Pagina2Mecanicas'
import Pagina3Antecedentes from './pages/Pagina3Antecedentes'
import Pagina4Equipamentos from './pages/Pagina4Equipamentos'
import Pagina5GuiaMestre from './pages/Pagina5GuiaMestre'
import Pagina6Ameacas from './pages/Pagina6Ameacas'
import Pagina7Complementos from './pages/Pagina7Complementos'
import FichaPersonagem from './pages/FichaPersonagem'
import FichaEmJogo from './pages/FichaEmJogo'
import CriarPersonagem from './pages/CriarPersonagem'
import Login from './pages/Login'
import Cadastro from './pages/Cadastro'
import EsqueciSenha from './pages/EsqueciSenha'
import ResetarSenha from './pages/ResetarSenha'
import Admin from './pages/Admin'

function App() {
  return (
    <div className="app">
      <Navbar />
      <main className="main-content">
        <Routes>
          <Route path="/" element={<Pagina1Apresentacao />} />
          <Route path="/mecanicas" element={<Pagina2Mecanicas />} />
          <Route path="/antecedentes" element={<Pagina3Antecedentes />} />
          <Route path="/equipamentos" element={<Pagina4Equipamentos />} />
          <Route path="/guia-mestre" element={<Pagina5GuiaMestre />} />
          <Route path="/ameacas" element={<Pagina6Ameacas />} />
          <Route path="/complementos" element={<Pagina7Complementos />} />
          <Route path="/ficha" element={<FichaPersonagem />} />
          <Route path="/ficha/:id" element={<FichaPersonagem />} />
          <Route path="/ficha-em-jogo" element={<FichaEmJogo />} />
          <Route path="/criar-personagem" element={<CriarPersonagem />} />
          <Route path="/login" element={<Login />} />
          <Route path="/cadastro" element={<Cadastro />} />
          <Route path="/esqueci-senha" element={<EsqueciSenha />} />
          <Route path="/resetar-senha" element={<ResetarSenha />} />
          <Route path="/admin" element={<Admin />} />
        </Routes>
      </main>
      <Footer />
    </div>
  )
}

export default App
