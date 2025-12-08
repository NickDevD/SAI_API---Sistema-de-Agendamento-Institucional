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
    InputAdornment,
} from '@mui/material';

import type { SelectChangeEvent } from '@mui/material/Select';

import {
    EventNote,
    Person,
    Badge,
    AccessTime,
    Send,
    Refresh,
    CalendarToday,
} from '@mui/icons-material';

import { useNavigate } from 'react-router-dom';
import axios from 'axios';

// ---------- API ----------
const api = axios.create({
    baseURL: 'http://localhost:8080/api/v1',
});

api.interceptors.request.use((config) => {
    const token = localStorage.getItem('auth_token');
    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
});

// ---------- Types ----------
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

// ==================================================
// COMPONENT
// ==================================================
export default function AgendamentoPage() {
    useNavigate();
    const [agendamentos, setAgendamentos] = useState<Agendamento[]>([]);
    const [loading, setLoading] = useState(false);
    const [submitting, setSubmitting] = useState(false);

    const [formData, setFormData] = useState<FormData>({
        nomeSolicitante: '',
        cpf: '',
        rg: '',
        tipoServico: '',
        dataHoraChegada: '',
    });

    const [toast, setToast] = useState({
        open: false,
        message: '',
        severity: 'success' as 'success' | 'error',
    });

    // ---------- Fetch ----------
    const fetchAgendamentos = useCallback(async () => {
        setLoading(true);
        try {
            const response = await api.get<Agendamento[]>(
                '/agendamentos/consultar_agendamentos'
            );
            setAgendamentos(response.data);
        } catch {
            setToast({
                open: true,
                message: 'Erro ao carregar agendamentos.',
                severity: 'error',
            });
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        void fetchAgendamentos();
    }, [fetchAgendamentos]);

    // ---------- Submit ----------
    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setSubmitting(true);

        try {
            await api.post('/agendamentos/agendar', {
                ...formData,
                cpf: formData.cpf.replace(/\D/g, ''),
            });

            setToast({
                open: true,
                message: 'Agendamento realizado com sucesso!',
                severity: 'success',
            });

            setFormData({
                nomeSolicitante: '',
                cpf: '',
                rg: '',
                tipoServico: '',
                dataHoraChegada: '',
            });

            await fetchAgendamentos();
        } catch {
            setToast({
                open: true,
                message: 'Erro ao realizar agendamento.',
                severity: 'error',
            });
        } finally {
            setSubmitting(false);
        }
    };

    const getStatusColor = (status: Agendamento['status']) => {
        switch (status) {
            case 'CONCLUIDO':
                return 'success';
            case 'CANCELADO':
                return 'error';
            case 'AGUARDANDO':
                return 'warning';
            case 'EM_ATENDIMENTO':
                return 'info';
            default:
                return 'default';
        }
    };

    const formatData = (iso: string) =>
        iso ? new Date(iso).toLocaleString('pt-BR') : '-';

    // ==================================================
    // RENDER
    // ==================================================
    return (
        <Container maxWidth={false} sx={{ px: 4 }}>
        {/* Header */}
            <Box mb={4}>
                <Typography variant="h4" fontWeight="bold" display="flex" alignItems="center">
                    <CalendarToday sx={{ mr: 2 }} />
                    Gerenciamento de Agendamentos
                </Typography>
                <Typography color="text.secondary">
                    Crie e visualize agendamentos do sistema.
                </Typography>
            </Box>

            {/* MAIN GRID */}
            <Grid
                container
                spacing={3}
                alignItems="stretch"
                sx={{
                    minHeight: 'calc(100vh - 200px)',
                }}
            >
                {/* FORM */}
                <Grid item xs={12} md={4}>
                    <Paper
                        sx={{
                            p: 3,
                            borderRadius: 3,
                            height: '100%',
                            display: 'flex',
                            flexDirection: 'column',
                        }}
                    >
                        <Typography
                            variant="h6"
                            color="secondary"
                            display="flex"
                            alignItems="center"
                            mb={2}
                        >
                            <Send sx={{ mr: 1 }} /> Novo Agendamento
                        </Typography>

                        <Box component="form" onSubmit={handleSubmit} sx={{ flex: 1 }}>
                            <TextField
                                label="Nome do Solicitante"
                                name="nomeSolicitante"
                                value={formData.nomeSolicitante}
                                onChange={(e) =>
                                    setFormData({ ...formData, nomeSolicitante: e.target.value })
                                }
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
                                onChange={(e) =>
                                    setFormData({ ...formData, cpf: e.target.value })
                                }
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
                                label="RG"
                                name="rg"
                                value={formData.rg}
                                onChange={(e) =>
                                    setFormData({ ...formData, rg: e.target.value })
                                }
                                fullWidth
                                margin="normal"
                            />

                            <FormControl fullWidth margin="normal" required>
                                <InputLabel>Tipo de Serviço</InputLabel>
                                <Select
                                    value={formData.tipoServico}
                                    label="Tipo de Serviço"
                                    onChange={(e: SelectChangeEvent) =>
                                        setFormData({ ...formData, tipoServico: e.target.value })
                                    }
                                >
                                    {TIPOS_SERVICO.map((t) => (
                                        <MenuItem key={t.value} value={t.value}>
                                            {t.label}
                                        </MenuItem>
                                    ))}
                                </Select>
                            </FormControl>

                            <TextField
                                label="Data / Hora"
                                name="dataHoraChegada"
                                type="datetime-local"
                                value={formData.dataHoraChegada}
                                onChange={(e) =>
                                    setFormData({ ...formData, dataHoraChegada: e.target.value })
                                }
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
                                sx={{ mt: 2 }}
                                disabled={submitting}
                            >
                                {submitting ? <CircularProgress size={24} /> : 'Confirmar'}
                            </Button>
                        </Box>
                    </Paper>
                </Grid>

                {/* LIST */}
                <Grid item xs={12} md={10}>
                    <Paper
                        sx={{
                            p: 3,
                            borderRadius: 3,
                            height: '100%',
                            display: 'flex',
                            flexDirection: 'column',
                        }}
                    >
                        <Box display="flex" justifyContent="space-between" mb={2}>
                            <Typography variant="h6" display="flex" alignItems="center">
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

                        <Box sx={{ flex: 1, overflowY: 'auto' }}>
                            {loading ? (
                                <Box display="flex" justifyContent="center" mt={4}>
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
                                            // Removemos 'secondaryAction' daqui!
                                            sx={{
                                                flexWrap: 'wrap',
                                                '&:hover': { backgroundColor: '#f5f5f5' }
                                            }}
                                            // REMOVER: secondaryAction={...}
                                        >
                                            <ListItemAvatar>
                                                <Avatar sx={{ bgcolor: 'secondary.main' }}>
                                                    <Person />
                                                </Avatar>
                                            </ListItemAvatar>

                                            <ListItemText
                                                sx={{ ml: 2 }} // Adiciona um pequeno espaçamento da Avatar
                                                primary={
                                                    <Box
                                                        display="flex"
                                                        justifyContent="space-between"
                                                        alignItems="center"
                                                        // O 'mr: 1' ou similar é crucial se o Chip for muito largo
                                                    >
                                                        <Typography variant="subtitle1" fontWeight="bold">
                                                            {item.nomeSolicitante}
                                                        </Typography>

                                                        {/* O CHIP é movido para dentro do primary do ListItemText */}
                                                        <Chip
                                                            label={item.status}
                                                            color={getStatusColor(item.status)}
                                                            size="small"
                                                            sx={{ minWidth: 100 }} // Ajuste o tamanho mínimo se necessário
                                                        />
                                                    </Box>
                                                }
                                                secondary={
                                                    <Box sx={{ display: 'flex', flexDirection: 'column', mt: 0.5 }}>
                                                        <Typography variant="body2">
                                                            <strong>Serviço:</strong>{' '}
                                                            {TIPOS_SERVICO.find(t => t.value === item.tipoServico)?.label ||
                                                                item.tipoServico}
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
                        </Box>
                    </Paper>
                </Grid>
            </Grid>

            {/* TOAST */}
            <Snackbar
                open={toast.open}
                autoHideDuration={5000}
                onClose={() => setToast({ ...toast, open: false })}
            >
                <Alert severity={toast.severity}>{toast.message}</Alert>
            </Snackbar>
        </Container>
    );
}
