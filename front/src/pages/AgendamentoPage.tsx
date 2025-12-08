import React, { useState, useEffect, useCallback } from 'react';
import Grid from '@mui/material/Grid';

import {
    Container,
    Typography,
    Paper,
    TextField,
    Button,
    Select,
    MenuItem,
    FormControl,
    InputLabel,
    Box,
    CircularProgress,
    List,
    ListItem,
    ListItemText,
    ListItemAvatar,
    Avatar,
    Chip,
    Alert,
    Snackbar,
    InputAdornment
} from '@mui/material';

import type { SelectChangeEvent } from '@mui/material/Select';

import {
    EventNote,
    Person,
    Badge,
    AccessTime,
    Send,
    Refresh,
    CalendarToday
} from '@mui/icons-material';

import { useNavigate } from 'react-router-dom';
import axios from 'axios';

// --- Configuração API ---
const api = axios.create({
    baseURL: 'http://localhost:8080/api/v1',
});

api.interceptors.request.use(
    (config) => {
        const token = localStorage.getItem('auth_token');
        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
    },
    (error) => Promise.reject(error)
);

// --- Tipos ---
interface Agendamento {
    id: string;
    nomeSolicitante: string;
    cpf: string;
    tipoServico: string;
    dataHoraChegada: string;
    status: 'AGUARDANDO' | 'EM_ATENDIMENTO' | 'CONCLUIDO' | 'CANCELADO';
}

interface FormData {
    nomeSolicitante: string;
    cpf: string;
    rg: string;
    tipoServico: string;
    dataHoraChegada: string;
}

const TIPOS_SERVICO = [
    { value: 'EMISSAO_DOCUMENTOS', label: 'Emissão de Documentos' },
    { value: 'BENEFICIO_PREVIDENCIARIO', label: 'Benefício Previdenciário' },
    { value: 'CONSULTORIA_FINANCEIRA', label: 'Consultoria Financeira' },
    { value: 'SUPORTE_TECNICO', label: 'Suporte Técnico' },
    { value: 'OUTROS', label: 'Outros Serviços' },
];

// -------------------------------------------------------
// COMPONENTE PRINCIPAL
// -------------------------------------------------------
export default function AgendamentoPage() {

    const navigate = useNavigate();

    const [agendamentos, setAgendamentos] = useState<Agendamento[]>([]);
    const [loading, setLoading] = useState(false);
    const [submitting, setSubmitting] = useState(false);

    const [formData, setFormData] = useState<FormData>({
        nomeSolicitante: '',
        cpf: '',
        rg: '',
        tipoServico: '',
        dataHoraChegada: ''
    });

    const [toast, setToast] = useState({
        open: false,
        message: '',
        severity: 'success' as 'success' | 'error'
    });

    // Buscar agendamentos
    const fetchAgendamentos = useCallback(async () => {
        setLoading(true);
        try {
            const response = await api.get<Agendamento[]>('/agendamentos/consultar_agendamentos');
            setAgendamentos(response.data);
        } catch (error: any) {
            console.error(error);
            if (error.response?.status === 401 || error.response?.status === 403) {
                showToast('Sessão expirada. Faça login novamente.', 'error');
                setTimeout(() => navigate('/'), 2000);
            } else {
                showToast("Erro ao carregar agendamentos.", "error");
            }
        } finally {
            setLoading(false);
        }
    }, [navigate]);

    useEffect(() => {
        void fetchAgendamentos();
    }, [fetchAgendamentos]);

    // Enviar formulário
    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setSubmitting(true);

        try {
            const payload = {
                ...formData,
                cpf: formData.cpf.replace(/\D/g, '')
            };

            await api.post('/agendamentos/agendar', payload);

            showToast('Agendamento realizado com sucesso!', 'success');

            setFormData({
                nomeSolicitante: '',
                cpf: '',
                rg: '',
                tipoServico: '',
                dataHoraChegada: ''
            });

            await fetchAgendamentos();

        } catch (error: any) {
            console.error(error);

            let msg = "Erro ao realizar agendamento.";

            const status = error.response?.status;
            const data = error.response?.data;

            if (data?.mensagem) msg = data.mensagem;
            else if (status === 400) msg = "Dados inválidos. Verifique os campos.";
            else if (status === 409) msg = "Já existe um agendamento nesse horário.";
            else if (status === 500) msg = "Erro interno. Tente novamente mais tarde.";

            showToast(msg, "error");

        } finally {
            setSubmitting(false);
        }
    };

    // Handlers gerais
    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setFormData(prev => ({
            ...prev,
            [e.target.name]: e.target.value
        }));
    };

    const handleSelectChange = (e: SelectChangeEvent) => {
        setFormData(prev => ({
            ...prev,
            tipoServico: e.target.value
        }));
    };

    const showToast = (message: string, severity: 'success' | 'error') => {
        setToast({ open: true, message, severity });
    };

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'CONCLUIDO': return 'success';
            case 'CANCELADO': return 'error';
            case 'AGUARDANDO': return 'warning';
            case 'EM_ATENDIMENTO': return 'info';
            default: return 'default';
        }
    };

    const formatData = (iso: string) => {
        if (!iso) return '-';
        return new Date(iso).toLocaleString('pt-BR');
    };

    // -------------------------------------------------------
    // RENDER
    // -------------------------------------------------------
    return (
        <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>

            {/* Cabeçalho */}
            <Box mb={4}>
                <Typography variant="h4" fontWeight="bold" sx={{ display: 'flex', alignItems: 'center' }}>
                    <CalendarToday sx={{ mr: 2 }} />
                    Gerenciamento de Agendamentos
                </Typography>
                <Typography variant="subtitle1" color="text.secondary">
                    Crie e visualize agendamentos do sistema SAI.
                </Typography>
            </Box>

            {/* Grid principal */}
            <Grid container spacing={3}>

                {/* Formulário */}
                <Grid item xs={12} md={4}>
                    <Paper elevation={3} sx={{ p: 3, borderRadius: 2 }}>
                        <Typography variant="h6" color="secondary" sx={{ display: 'flex', alignItems: 'center' }}>
                            <Send sx={{ mr: 1 }} /> Novo Agendamento
                        </Typography>

                        <form onSubmit={handleSubmit}>

                            <TextField
                                label="Nome do Solicitante"
                                name="nomeSolicitante"
                                value={formData.nomeSolicitante}
                                onChange={handleInputChange}
                                fullWidth
                                margin="normal"
                                required
                                InputProps={{
                                    startAdornment: (
                                        <InputAdornment position="start">
                                            <Person />
                                        </InputAdornment>
                                    ),
                                }}
                            />

                            <TextField
                                label="CPF"
                                name="cpf"
                                value={formData.cpf}
                                onChange={handleInputChange}
                                fullWidth
                                margin="normal"
                                required
                                InputProps={{
                                    startAdornment: (
                                        <InputAdornment position="start">
                                            <Badge />
                                        </InputAdornment>
                                    ),
                                }}
                            />

                            <TextField
                                label="RG (Opcional)"
                                name="rg"
                                value={formData.rg}
                                onChange={handleInputChange}
                                fullWidth
                                margin="normal"
                            />

                            <FormControl fullWidth margin="normal" required>
                                <InputLabel>Tipo de Serviço</InputLabel>
                                <Select
                                    value={formData.tipoServico}
                                    label="Tipo de Serviço"
                                    onChange={handleSelectChange}
                                >
                                    {TIPOS_SERVICO.map((t) => (
                                        <MenuItem key={t.value} value={t.value}>
                                            {t.label}
                                        </MenuItem>
                                    ))}
                                </Select>
                            </FormControl>

                            <TextField
                                label="Data/Hora Prevista"
                                name="dataHoraChegada"
                                type="datetime-local"
                                value={formData.dataHoraChegada}
                                onChange={handleInputChange}
                                fullWidth
                                margin="normal"
                                required
                                InputLabelProps={{ shrink: true }}
                                InputProps={{
                                    startAdornment: (
                                        <InputAdornment position="start">
                                            <AccessTime />
                                        </InputAdornment>
                                    ),
                                }}
                            />

                            <Button
                                type="submit"
                                fullWidth
                                variant="contained"
                                color="secondary"
                                disabled={submitting}
                                sx={{ mt: 2 }}
                            >
                                {submitting ? <CircularProgress size={24} color="inherit" /> : "Confirmar Agendamento"}
                            </Button>

                        </form>
                    </Paper>
                </Grid>

                {/* Lista */}
                <Grid item xs={12} md={8}>
                    <Paper elevation={3} sx={{ p: 3, borderRadius: 2, minHeight: "500px" }}>
                        <Box display="flex" justifyContent="space-between" mb={2}>
                            <Typography variant="h6" color="primary" sx={{ display: 'flex', alignItems: 'center' }}>
                                <EventNote sx={{ mr: 1 }} /> Lista de Agendamentos
                            </Typography>

                            <Button
                                variant="outlined"
                                startIcon={<Refresh />}
                                onClick={fetchAgendamentos}
                                disabled={loading}
                            >
                                Atualizar
                            </Button>
                        </Box>

                        {loading ? (
                            <Box display="flex" justifyContent="center" mt={5}>
                                <CircularProgress />
                            </Box>
                        ) : agendamentos.length === 0 ? (
                            <Alert severity="info">Nenhum agendamento encontrado.</Alert>
                        ) : (
                            <List>
                                {agendamentos.map((item) => (
                                    <ListItem
                                        key={item.id}
                                        divider
                                        sx={{ flexWrap: 'wrap' }}
                                        secondaryAction={
                                            <Chip
                                                label={item.status}
                                                color={getStatusColor(item.status) as any}
                                                size="small"
                                            />
                                        }
                                    >
                                        <ListItemAvatar>
                                            <Avatar sx={{ bgcolor: 'secondary.main' }}>
                                                <Person />
                                            </Avatar>
                                        </ListItemAvatar>

                                        <ListItemText
                                            primary={
                                                <Typography fontWeight="bold">
                                                    {item.nomeSolicitante}
                                                </Typography>
                                            }
                                            secondary={
                                                <Box sx={{ display: 'flex', flexDirection: 'column' }}>
                                                    <Typography variant="body2">
                                                        <strong>Serviço:</strong>{' '}
                                                        {TIPOS_SERVICO.find(s => s.value === item.tipoServico)?.label}
                                                    </Typography>
                                                    <Typography variant="body2">
                                                        <strong>CPF:</strong> {item.cpf} —{' '}
                                                        <strong>Chegada:</strong> {formatData(item.dataHoraChegada)}
                                                    </Typography>
                                                </Box>
                                            }
                                        />
                                    </ListItem>
                                ))}
                            </List>
                        )}
                    </Paper>
                </Grid>

            </Grid>

            <Snackbar
                open={toast.open}
                autoHideDuration={5000}
                onClose={() => setToast(prev => ({ ...prev, open: false }))}
                anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
            >
                <Alert
                    severity={toast.severity}
                    onClose={() => setToast(prev => ({ ...prev, open: false }))}
                    variant="filled"
                >
                    {toast.message}
                </Alert>
            </Snackbar>

        </Container>
    );
}
