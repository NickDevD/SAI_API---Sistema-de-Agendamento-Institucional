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
    Chip,
    Alert,
    Snackbar,
    InputAdornment,
    Divider,
    Modal
} from '@mui/material';

import type { SelectChangeEvent } from '@mui/material/Select';

import {
    Person,
    Badge,
    AccessTime,
    CalendarToday,
    AddCircle
} from '@mui/icons-material';

import axios from 'axios';

// ---------- API ----------
const api = axios.create({
    baseURL: 'http://localhost:8080/api/v1',
});

api.interceptors.request.use((config) => {
    const token = localStorage.getItem('auth_token');
    if (token && config.headers) {
        config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
});

// ---------- Types ----------
interface Agendamento {
    id: string;
    nomeSolicitante: string;
    cpf: string;
    rg: string;
    tipoServico: string;
    prioridade: string;
    dataHoraChegada: string | null;
    status: 'AGUARDANDO' | 'EM_ATENDIMENTO' | 'CONCLUIDO' | 'CANCELADO';
}

interface FormData {
    nomeSolicitante: string;
    cpf: string;
    rg: string;
    tipoServico: string;
    prioridade: string;
    dataHoraChegada: string;
}

// ---------- Constantes ----------
const TIPOS_SERVICO = [
    { value: 'EMISSAO_DOCUMENTOS', label: 'Emissão de Documentos' },
    { value: 'BENEFICIO_PREVIDENCIARIO', label: 'Benefício Previdenciário' },
    { value: 'CONSULTORIA_FINANCEIRA', label: 'Consultoria Financeira' },
    { value: 'SUPORTE_TECNICO', label: 'Suporte Técnico' },
    { value: 'OUTROS', label: 'Outros Serviços' },
];

const PRIORIDADES = [
    { value: 'NORMAL', label: 'Normal' },
    { value: 'IDOSO', label: 'Idoso' },
    { value: 'PREFERENCIAL', label: 'Preferencial' },
    { value: 'PCD', label: 'PCD' },
];

// ---------- Helpers ----------
const statusColorMap: Record<Agendamento['status'], string> = {
    AGUARDANDO: '#ed6c02',
    EM_ATENDIMENTO: '#0288d1',
    CONCLUIDO: '#2e7d32',
    CANCELADO: '#d32f2f',
};

const prioridadeShortLabel = (prioridade: string) => {
    if (prioridade === 'NORMAL') return null;
    return prioridade;
};

// ===============================
// COMPONENT
// ===============================
export default function AgendamentoPage() {

    const [agendamentos, setAgendamentos] = useState<Agendamento[]>([]);
    const [submitting, setSubmitting] = useState(false);
    const [updatingId, setUpdatingId] = useState<string | null>(null);
    const [modalOpen, setModalOpen] = useState(false);

    const [formData, setFormData] = useState<FormData>({
        nomeSolicitante: '',
        cpf: '',
        rg: '',
        tipoServico: '',
        prioridade: 'NORMAL',
        dataHoraChegada: '',
    });

    const [toast, setToast] = useState({
        open: false,
        message: '',
        severity: 'success' as 'success' | 'error',
    });

    // ---------- Fetch ----------
    const fetchAgendamentos = useCallback(async () => {
        const response = await api.get<Agendamento[]>('/agendamentos/consultar_agendamentos');
        setAgendamentos(response.data);
    }, []);

    useEffect(() => {
        fetchAgendamentos();
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
                message: 'Agendamento criado com sucesso!',
                severity: 'success',
            });

            setFormData({
                nomeSolicitante: '',
                cpf: '',
                rg: '',
                tipoServico: '',
                prioridade: 'NORMAL',
                dataHoraChegada: '',
            });

            setModalOpen(false);
            fetchAgendamentos();
        } catch {
            setToast({
                open: true,
                message: 'Erro ao criar agendamento.',
                severity: 'error',
            });
        } finally {
            setSubmitting(false);
        }
    };

    const atualizarStatus = async (id: string, status: Agendamento['status']) => {
        if (status === 'CANCELADO') {
            const confirm = window.confirm('Tem certeza que deseja cancelar este agendamento?');
            if (!confirm) return;
        }

        setUpdatingId(id);
        await api.post(`/agendamentos/${id}/status`, { status });
        fetchAgendamentos();
        setUpdatingId(null);
    };

    // ---------- Filtros ----------
    const aguardando = agendamentos.filter(a => a.status === 'AGUARDANDO');
    const emAtendimento = agendamentos.filter(a => a.status === 'EM_ATENDIMENTO');
    const concluidos = agendamentos.filter(a => a.status === 'CONCLUIDO');
    const cancelados = agendamentos.filter(a => a.status === 'CANCELADO');

    // ---------- Modal Style ----------
    const modalStyle = {
        position: 'absolute' as const,
        top: '50%',
        left: '50%',
        transform: 'translate(-50%, -50%)',
        width: '95%',
        maxWidth: 500,
        bgcolor: 'background.paper',
        borderRadius: 3,
        boxShadow: 24,
        p: 4,
    };

    return (
        <Container maxWidth={false} sx={{ px: 4 }}>

            {/* Header */}
            <Box mb={4}>
                <Typography variant="h4" fontWeight="bold" display="flex" alignItems="center">
                    <CalendarToday sx={{ mr: 2 }} />
                    Gerenciamento de Agendamentos
                </Typography>
            </Box>

            {/* Button */}
            <Box mb={3}>
                <Button
                    variant="contained"
                    color="secondary"
                    startIcon={<AddCircle />}
                    onClick={() => setModalOpen(true)}
                >
                    Novo Agendamento
                </Button>
            </Box>

            {/* MODAL */}
            <Modal open={modalOpen} onClose={() => setModalOpen(false)}>
                <Box sx={modalStyle}>
                    <Typography variant="h6" fontWeight="bold" mb={2}>
                        Novo Agendamento
                    </Typography>

                    <Box component="form" onSubmit={handleSubmit}>
                        <TextField
                            label="Nome do Solicitante"
                            fullWidth
                            margin="normal"
                            required
                            value={formData.nomeSolicitante}
                            onChange={(e) =>
                                setFormData({ ...formData, nomeSolicitante: e.target.value })
                            }
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
                            fullWidth
                            margin="normal"
                            required
                            value={formData.cpf}
                            onChange={(e) =>
                                setFormData({ ...formData, cpf: e.target.value })
                            }
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
                            fullWidth
                            margin="normal"
                            value={formData.rg}
                            onChange={(e) =>
                                setFormData({ ...formData, rg: e.target.value })
                            }
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
                                {TIPOS_SERVICO.map(t => (
                                    <MenuItem key={t.value} value={t.value}>
                                        {t.label}
                                    </MenuItem>
                                ))}
                            </Select>
                        </FormControl>

                        <FormControl fullWidth margin="normal" required>
                            <InputLabel>Prioridade</InputLabel>
                            <Select
                                value={formData.prioridade}
                                label="Prioridade"
                                onChange={(e: SelectChangeEvent) =>
                                    setFormData({ ...formData, prioridade: e.target.value })
                                }
                            >
                                {PRIORIDADES.map(p => (
                                    <MenuItem key={p.value} value={p.value}>
                                        {p.label}
                                    </MenuItem>
                                ))}
                            </Select>
                        </FormControl>

                        <TextField
                            label="Data / Hora"
                            type="datetime-local"
                            fullWidth
                            margin="normal"
                            required
                            value={formData.dataHoraChegada}
                            onChange={(e) =>
                                setFormData({ ...formData, dataHoraChegada: e.target.value })
                            }
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
                            sx={{ mt: 2 }}
                            disabled={submitting}
                        >
                            {submitting ? <CircularProgress size={24} /> : 'Confirmar'}
                        </Button>
                    </Box>
                </Box>
            </Modal>

            {/* KANBAN */}
            <Grid container spacing={3}>
                {[{ title: 'Aguardando', data: aguardando },
                    { title: 'Em Atendimento', data: emAtendimento },
                    { title: 'Concluídos', data: concluidos },
                    { title: 'Cancelados', data: cancelados }].map(col => (
                    <Grid item xs={12} sm={6} md={3} key={col.title}>
                        <Paper
                            sx={{
                                p: 2,
                                height: 'calc(100vh - 260px)',
                                display: 'flex',
                                flexDirection: 'column'
                            }}
                        >
                            <Typography variant="h6" fontWeight="bold">
                                {col.title}
                            </Typography>

                            <Divider sx={{ my: 1 }} />

                            <Box sx={{ flex: 1, overflowY: 'auto', pr: 1 }}>
                                {col.data.map(item => (
                                    <Paper
                                        key={item.id}
                                        variant="outlined"
                                        sx={{
                                            p: 2,
                                            mb: 2,
                                            borderLeft: `6px solid ${statusColorMap[item.status]}`
                                        }}
                                    >
                                        <Box display="flex" gap={1} mb={1} flexWrap="wrap">
                                            <Chip label={item.status} size="small" />
                                            {prioridadeShortLabel(item.prioridade) && (
                                                <Chip
                                                    label={prioridadeShortLabel(item.prioridade)}
                                                    color="error"
                                                    size="small"
                                                />
                                            )}
                                        </Box>

                                        <Typography fontWeight="bold">
                                            {item.nomeSolicitante}
                                        </Typography>

                                        <Typography variant="body2" mt={1}>
                                            <strong>Serviço:</strong>{' '}
                                            {TIPOS_SERVICO.find(t => t.value === item.tipoServico)?.label}
                                        </Typography>

                                        {item.dataHoraChegada && (
                                            <Typography variant="body2">
                                                <strong>Data:</strong>{' '}
                                                {new Date(item.dataHoraChegada).toLocaleDateString()} {' '}
                                                <strong>Hora:</strong>{' '}
                                                {new Date(item.dataHoraChegada).toLocaleTimeString([], {
                                                    hour: '2-digit',
                                                    minute: '2-digit'
                                                })}
                                            </Typography>
                                        )}

                                        <Box display="flex" gap={1} mt={1.5} flexWrap="wrap">
                                            {item.status === 'AGUARDANDO' && (
                                                <Button
                                                    size="small"
                                                    variant="contained"
                                                    onClick={() =>
                                                        atualizarStatus(item.id, 'EM_ATENDIMENTO')
                                                    }
                                                    disabled={updatingId === item.id}
                                                >
                                                    Iniciar
                                                </Button>
                                            )}

                                            {item.status === 'EM_ATENDIMENTO' && (
                                                <>
                                                    <Button
                                                        size="small"
                                                        variant="contained"
                                                        color="success"
                                                        onClick={() =>
                                                            atualizarStatus(item.id, 'CONCLUIDO')
                                                        }
                                                        disabled={updatingId === item.id}
                                                    >
                                                        Concluir
                                                    </Button>

                                                    <Button
                                                        size="small"
                                                        variant="outlined"
                                                        color="error"
                                                        onClick={() =>
                                                            atualizarStatus(item.id, 'CANCELADO')
                                                        }
                                                        disabled={updatingId === item.id}
                                                    >
                                                        Cancelar
                                                    </Button>
                                                </>
                                            )}
                                        </Box>
                                    </Paper>
                                ))}
                            </Box>
                        </Paper>
                    </Grid>
                ))}
            </Grid>

            {/* Toast */}
            <Snackbar
                open={toast.open}
                autoHideDuration={4000}
                onClose={() => setToast({ ...toast, open: false })}
            >
                <Alert severity={toast.severity}>
                    {toast.message}
                </Alert>
            </Snackbar>

        </Container>
    );
}
