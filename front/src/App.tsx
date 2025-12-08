import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { ThemeProvider, CssBaseline } from '@mui/material';
import { ToastContainer } from 'react-toastify';

// Importa os arquivos que acabamos de criar/configurar
import theme from './theme/theme';
import LoginPage from './pages/LoginPage';
import AgendamentoPage from './pages/AgendamentoPage';

function App() {
    return (
        // 1. Aplica o Tema e reseta o CSS
        <ThemeProvider theme={theme}>
            <CssBaseline />
            <ToastContainer position="top-center" autoClose={3000} />

            {/* 2. Gerencia a navegação */}
            <BrowserRouter>
                <Routes>
                    {/* Rota Inicial: O Login */}
                    <Route path="/" element={<LoginPage />} />

                    {/* Rota de destino (depois do login) */}
                    <Route path="/agendamentos" element={<AgendamentoPage />} />
                </Routes>
            </BrowserRouter>
        </ThemeProvider>
    );
}

export default App;