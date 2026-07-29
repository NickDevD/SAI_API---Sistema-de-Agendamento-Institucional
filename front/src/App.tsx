import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { ThemeProvider, CssBaseline } from '@mui/material';
import { ToastContainer } from 'react-toastify';

import theme from './theme/theme';
import LoginPage from './pages/LoginPage';
import AgendamentoPage from './pages/AgendamentoPage';
import ProtectedRoute from './components/ProtectedRoute';

function App() {
    return (
        <ThemeProvider theme={theme}>
            <CssBaseline />
            <ToastContainer position="top-center" autoClose={3000} />
            <BrowserRouter>
                <Routes>
                    <Route path="/" element={<LoginPage />} />
                    <Route
                        path="/agendamentos"
                        element={
                            <ProtectedRoute>
                                <AgendamentoPage />
                            </ProtectedRoute>
                        }
                    />
                </Routes>
            </BrowserRouter>
        </ThemeProvider>
    );
}

export default App;
