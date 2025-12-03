import { useState } from 'react';
import {
    Button,
    TextField,
    Box,
    Typography,
    Paper,
    InputAdornment,
    CircularProgress
} from '@mui/material';
import { AccountCircle, Lock } from '@mui/icons-material';
import { api } from '../services/api';
import { toast } from 'react-toastify';
import { useNavigate } from 'react-router-dom';

interface LoginData {
    login: string;
    senha: string;
}

export default function LoginPage() {
    const navigate = useNavigate();
    const [loading, setLoading] = useState(false);
    const [formData, setFormData] = useState<LoginData>({ login: '', senha: '' });

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        try {
            const response = await api.post('/auth/login', formData);
            const token = response.data.token;

            localStorage.setItem('auth_token', token);

            toast.success("Bem-vindo(a) ao SAI!");
            navigate('/agendamentos');

        } catch (error) {
            toast.error("Credenciais inválidas. Verifique usuário e senha.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <Box
            sx={{
                width: '100vw',
                height: '100vh',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                backgroundColor: 'background.default',
                backgroundImage: 'linear-gradient(to bottom right, #e3f2fd 0%, #ffffff 100%)',
            }}
        >
            <Paper elevation={4} sx={{ p: 4, width: '100%', maxWidth: 400, borderRadius: 2, textAlign: 'center' }}>
                {/* Visual - Cabeçalho Institucional */}
                <Typography variant="h4" color="primary" fontWeight="bold" gutterBottom>SAI</Typography>
                <Typography variant="subtitle1" color="text.secondary" sx={{ mb: 3 }}>Acesso ao Sistema CRAS</Typography>

                {/* Formulário - Ligando os inputs à lógica */}
                <Box component="form" onSubmit={handleLogin}>
                    <TextField
                        label="Usuário" name="login" value={formData.login} onChange={handleChange} fullWidth margin="normal" required
                        InputProps={{ startAdornment: (<InputAdornment position="start"><AccountCircle color="action" /></InputAdornment>), }}
                    />
                    <TextField
                        label="Senha" name="senha" type="password" value={formData.senha} onChange={handleChange} fullWidth margin="normal" required
                        InputProps={{ startAdornment: (<InputAdornment position="start"><Lock color="action" /></InputAdornment>), }}
                    />

                    <Button
                        type="submit" variant="contained" fullWidth size="large" disabled={loading}
                        sx={{ mt: 3, mb: 2, height: 48, fontWeight: 'bold' }}
                    >
                        {loading ? <CircularProgress size={24} color="inherit"/> : 'ENTRAR'}
                    </Button>
                </Box>

                <Typography variant="caption" color="text.disabled">Suporte Técnico</Typography>
            </Paper>
        </Box>
    );
}