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

import { useNavigate } from 'react-router-dom';
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

// ===============================
// COMPONENT
// ===============================
export default function AgendamentoPage() {
    useNavigate();

    const [agendamentos, setAgendamentos] = useState<Agendamento[]>([]);
    const [, setLoading] = useState(false);
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
        setLoading(true);
        try {
            const response = await api.get<Agendamento[]>('/agendamentos/consultar_agendamentos');
            setAgendamentos(response.data);
        } catch (err) {
            console.error(err);
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
                prioridade: 'NORMAL',
                dataHoraChegada: '',
            });

            setModalOpen(false);
            await fetchAgendamentos();
        } catch (err) {
            console.error(err);
            setToast({
                open: true,
                message: 'Erro ao realizar agendamento.',
                severity: 'error',
            });
        } finally {
            setSubmitting(false);
        }
    };
    const formatData = (iso: string | null) =>
        iso ? new Date(iso).toLocaleString('pt-BR') : '-';

    const atualizarStatus = async (id: string, status: Agendamento['status']) => {
        setUpdatingId(id);
        try {
            await api.post(`/agendamentos/${id}/status`, { status });
            setToast({ open: true, message: `Status alterado para ${status}`, severity: 'success' });
            await fetchAgendamentos();
        } catch (err) {
            console.error(err);
            setToast({ open: true, message: 'Erro ao atualizar status.', severity: 'error' });
        } finally {
            setUpdatingId(null);
        }
    };

    // ---------- NOVOS FILTROS PARA KANBAN ----------
    const aguardando = agendamentos.filter(a => a.status === 'AGUARDANDO');
    const emAtendimento = agendamentos.filter(a => a.status === 'EM_ATENDIMENTO');
    const concluidos = agendamentos.filter(a => a.status === 'CONCLUIDO');
    const cancelados = agendamentos.filter(a => a.status === 'CANCELADO');

    // ==============================
    // Modal Style
    // ==============================
    const modalStyle = {
        position: 'absolute' as 'absolute',
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

    // ==================================================
    // RENDER
    // ==================================================
    return (
        <Container maxWidth={false} sx={{ px: 4 }}>

            {/* Cabeçalho */}
            <Box mb={4}>
                <Typography variant="h4" fontWeight="bold" display="flex" alignItems="center">
                    <CalendarToday sx={{ mr: 2 }} />
                    Gerenciamento de Agendamentos
                </Typography>
                <Typography color="text.secondary">
                    Crie e visualize agendamentos do sistema.
                </Typography>
            </Box>

            {/* BOTÃO NOVO AGENDAMENTO */}
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

            {/* MODAL DO FORMULÁRIO */}
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
                            onChange={(e) => setFormData({ ...formData, cpf: e.target.value })}
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
                            onChange={(e) => setFormData({ ...formData, rg: e.target.value })}
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

                        <FormControl fullWidth margin="normal" required>
                            <InputLabel>Prioridade</InputLabel>
                            <Select
                                value={formData.prioridade}
                                label="Prioridade"
                                onChange={(e: SelectChangeEvent) =>
                                    setFormData({ ...formData, prioridade: e.target.value })
                                }
                            >
                                {PRIORIDADES.map((p) => (
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
                            color="secondary"
                            sx={{ mt: 2 }}
                            disabled={submitting}
                        >
                            {submitting ? <CircularProgress size={24} /> : 'Confirmar'}
                        </Button>
                    </Box>
                </Box>
            </Modal>

            {/* KANBAN DE AGENDAMENTOS */}
            <Grid container spacing={3} sx={{ mt: 2 }}>

                {/* --------------------- AGUARDANDO --------------------- */}
                <Grid item xs={12} sm={6} md={3}>
                    <Paper sx={{ p: 2, height: '75vh', display: 'flex', flexDirection: 'column' }}>
                        <Typography variant="h6" fontWeight="bold" color="warning.main">
                            Aguardando
                        </Typography>
                        <Divider sx={{ my: 1 }} />

                        <Box sx={{ overflowY: 'auto', pr: 1 }}>
                            {aguardando.length === 0 ? (
                                <Alert severity="info">Nenhum aguardando.</Alert>
                            ) : (
                                aguardando.map(item => (
                                    <Paper key={item.id} sx={{ p: 2, mb: 2 }} variant="outlined">
                                        <Box display="flex" justifyContent="space-between" alignItems="center">
                                            <Typography fontWeight="bold">{item.nomeSolicitante}</Typography>
                                            <Chip label={item.status} color="warning" size="small" />
                                        </Box>

                                        <Typography variant="body2" mt={1}>
                                            <strong>Serviço: </strong>
                                            {TIPOS_SERVICO.find(t => t.value === item.tipoServico)?.label}
                                        </Typography>

                                        <Typography variant="body2">
                                            <strong>CPF:</strong> {item.cpf}
                                        </Typography>

                                        <Button
                                            variant="contained"
                                            size="small"
                                            sx={{ mt: 1 }}
                                            onClick={() => atualizarStatus(item.id, 'EM_ATENDIMENTO')}
                                            disabled={updatingId === item.id}
                                        >
                                            Iniciar
                                        </Button>
                                    </Paper>
                                ))
                            )}
                        </Box>
                    </Paper>
                </Grid>

                {/* --------------------- EM ATENDIMENTO --------------------- */}
                <Grid item xs={12} sm={6} md={3}>
                    <Paper sx={{ p: 2, height: '75vh', display: 'flex', flexDirection: 'column' }}>
                        <Typography variant="h6" fontWeight="bold" color="info.main">
                            Em Atendimento
                        </Typography>
                        <Divider sx={{ my: 1 }} />

                        <Box sx={{ overflowY: 'auto', pr: 1 }}>
                            {emAtendimento.length === 0 ? (
                                <Alert severity="info">Nenhum em atendimento.</Alert>
                            ) : (
                                emAtendimento.map(item => (
                                    <Paper key={item.id} sx={{ p: 2, mb: 2 }} variant="outlined">
                                        <Box display="flex" justifyContent="space-between" alignItems="center">
                                            <Typography fontWeight="bold">{item.nomeSolicitante}</Typography>
                                            <Chip label={item.status} color="info" size="small" />
                                        </Box>

                                        <Typography variant="body2" mt={1}>
                                            <strong>Serviço: </strong>
                                            {TIPOS_SERVICO.find(t => t.value === item.tipoServico)?.label}
                                        </Typography>

                                        <Typography variant="body2">
                                            <strong>CPF:</strong> {item.cpf}
                                        </Typography>

                                        <Box display="flex" gap={1} mt={1}>
                                            <Button
                                                variant="contained"
                                                color="success"
                                                size="small"
                                                onClick={() => atualizarStatus(item.id, 'CONCLUIDO')}
                                                disabled={updatingId === item.id}
                                            >
                                                Concluir
                                            </Button>

                                            <Button
                                                variant="outlined"
                                                color="error"
                                                size="small"
                                                onClick={() => atualizarStatus(item.id, 'CANCELADO')}
                                                disabled={updatingId === item.id}
                                            >
                                                Cancelar
                                            </Button>
                                        </Box>
                                    </Paper>
                                ))
                            )}
                        </Box>
                    </Paper>
                </Grid>

                {/* --------------------- CONCLUÍDOS --------------------- */}
                <Grid item xs={12} sm={6} md={3}>
                    <Paper sx={{ p: 2, height: '75vh', display: 'flex', flexDirection: 'column' }}>
                        <Typography variant="h6" fontWeight="bold" color="success.main">
                            Concluídos
                        </Typography>
                        <Divider sx={{ my: 1 }} />

                        <Box sx={{ overflowY: 'auto', pr: 1 }}>
                            {concluidos.length === 0 ? (
                                <Alert severity="info">Nenhum concluído.</Alert>
                            ) : (
                                concluidos.map(item => (
                                    <Paper key={item.id} sx={{ p: 2, mb: 2 }} variant="outlined">
                                        <Box display="flex" justifyContent="space-between">
                                            <Typography fontWeight="bold">{item.nomeSolicitante}</Typography>
                                            <Chip label="CONCLUÍDO" color="success" size="small" />
                                        </Box>

                                        <Typography variant="body2" mt={1}>
                                            <strong>Serviço: </strong>
                                            {TIPOS_SERVICO.find(t => t.value === item.tipoServico)?.label}
                                        </Typography>

                                        <Typography variant="body2">
                                            <strong>Chegada:</strong> {formatData(item.dataHoraChegada)}
                                        </Typography>
                                    </Paper>
                                ))
                            )}
                        </Box>
                    </Paper>
                </Grid>

                {/* --------------------- CANCELADOS --------------------- */}
                <Grid item xs={12} sm={6} md={3}>
                    <Paper sx={{ p: 2, height: '75vh', display: 'flex', flexDirection: 'column' }}>
                        <Typography variant="h6" fontWeight="bold" color="error.main">
                            Cancelados
                        </Typography>
                        <Divider sx={{ my: 1 }} />

                        <Box sx={{ overflowY: 'auto', pr: 1 }}>
                            {cancelados.length === 0 ? (
                                <Alert severity="info">Nenhum cancelado.</Alert>
                            ) : (
                                cancelados.map(item => (
                                    <Paper key={item.id} sx={{ p: 2, mb: 2 }} variant="outlined">
                                        <Box display="flex" justifyContent="space-between">
                                            <Typography fontWeight="bold">{item.nomeSolicitante}</Typography>
                                            <Chip label="CANCELADO" color="error" size="small" />
                                        </Box>

                                        <Typography variant="body2" mt={1}>
                                            <strong>Serviço: </strong>
                                            {TIPOS_SERVICO.find(t => t.value === item.tipoServico)?.label}
                                        </Typography>

                                        <Typography variant="body2">
                                            <strong>Chegada:</strong> {formatData(item.dataHoraChegada)}
                                        </Typography>
                                    </Paper>
                                ))
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
