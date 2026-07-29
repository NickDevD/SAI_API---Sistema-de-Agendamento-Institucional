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
import { AccountCircle, Lock, HomeWork } from '@mui/icons-material';
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
                overflow: 'hidden',
            }}
        >
            {/* ══ PAINEL INSTITUCIONAL (oculto em telas pequenas) ══════════ */}
            <Box
                sx={{
                    display: { xs: 'none', md: 'flex' },
                    flexDirection: 'column',
                    justifyContent: 'space-between',
                    width: '42%',
                    minWidth: 380,
                    position: 'relative',
                    overflow: 'hidden',
                    color: '#fff',
                    background: 'linear-gradient(160deg, #0D3B7A 0%, #1565C0 55%, #0F4898 100%)',
                    borderRight: '4px solid #F9A825',
                    px: 6,
                    py: 7,
                }}
            >
                {/* Formas decorativas em segundo plano */}
                <Box sx={{
                    position: 'absolute', top: -80, right: -100, width: 320, height: 320,
                    borderRadius: '50%', background: 'rgba(249,168,37,0.12)',
                }} />
                <Box sx={{
                    position: 'absolute', bottom: -120, left: -80, width: 280, height: 280,
                    borderRadius: '50%', background: 'rgba(255,255,255,0.06)',
                }} />

                <Box sx={{ position: 'relative', zIndex: 1 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 5 }}>
                        <HomeWork sx={{ fontSize: 34, color: 'rgba(255,255,255,0.9)' }} />
                        <Typography sx={{ fontWeight: 700, fontSize: '1.15rem', lineHeight: 1.2 }}>
                            CRAS<br />
                            <Box component="span" sx={{ fontWeight: 400, fontSize: '0.72rem', color: 'rgba(255,255,255,0.65)', textTransform: 'uppercase', letterSpacing: '0.07em' }}>
                                Centro de Referência de Assistência Social
                            </Box>
                        </Typography>
                    </Box>

                    <Typography variant="h3" sx={{ fontWeight: 800, mb: 1 }}>SAI</Typography>
                    <Box sx={{ width: 56, height: 4, background: '#F9A825', borderRadius: 2, mb: 2.5 }} />
                    <Typography sx={{ fontSize: '1.05rem', color: 'rgba(255,255,255,0.85)', maxWidth: 320, lineHeight: 1.5 }}>
                        Sistema de Agendamento Institucional para gerenciamento dos atendimentos do SUAS.
                    </Typography>
                </Box>

                <Typography variant="caption" sx={{ position: 'relative', zIndex: 1, color: 'rgba(255,255,255,0.45)', fontSize: '0.7rem' }}>
                    Ministério do Desenvolvimento e Assistência Social · SUAS
                    <br />
                    Prefeitura Municipal
                </Typography>
            </Box>

            {/* ══ FORMULÁRIO DE LOGIN ══════════════════════════════════════ */}
            <Box
                sx={{
                    flex: 1,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    bgcolor: 'background.default',
                    px: 2,
                }}
            >
                <Paper elevation={0} sx={{ p: 4, width: '100%', maxWidth: 400, border: '1px solid #D6DFF0', textAlign: 'center' }}>
                    {/* Visual - Cabeçalho (visível também em mobile, sem o painel lateral) */}
                    <HomeWork sx={{ display: { xs: 'inline-flex', md: 'none' }, fontSize: 30, color: 'primary.main', mb: 1 }} />
                    <Typography variant="h4" color="primary" fontWeight="bold" gutterBottom>SAI</Typography>
                    <Box sx={{ width: 40, height: 3, background: '#F9A825', borderRadius: 2, mx: 'auto', mb: 1.5 }} />
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
        </Box>
    );
}