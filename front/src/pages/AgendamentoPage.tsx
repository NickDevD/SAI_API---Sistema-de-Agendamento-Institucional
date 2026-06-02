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
    Modal,
    createTheme,
    ThemeProvider,
} from '@mui/material';

import type { SelectChangeEvent } from '@mui/material/Select';

import {
    Person,
    Badge,
    AccessTime,
    CalendarToday,
    AddCircle,
    HomeWork,
    Article,
    CheckCircleOutline,
    HourglassTop,
    SupportAgent,
    Cancel,
} from '@mui/icons-material';

import axios from 'axios';

// ---------- API ----------
const api = axios.create({
    baseURL: import.meta.env.VITE_API_URL || 'http://localhost:8080/api/v1',
});

api.interceptors.request.use((config) => {
    const token = localStorage.getItem('auth_token');
    if (token && config.headers) {
        config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
});

// ---------- Theme CRAS / SUAS ----------
const crasTema = createTheme({
    palette: {
        primary:   { main: '#1565C0', light: '#1976D2', dark: '#0D3B7A', contrastText: '#fff' },
        secondary: { main: '#2E7D32', light: '#388E3C', dark: '#1B5E20', contrastText: '#fff' },
        error:     { main: '#C62828' },
        warning:   { main: '#F9A825' },
        info:      { main: '#1565C0' },
        success:   { main: '#2E7D32' },
        background: { default: '#EDF1F8', paper: '#ffffff' },
    },
    typography: {
        fontFamily: "'Source Sans 3', 'Segoe UI', 'Roboto', sans-serif",
        h4: { fontWeight: 700, letterSpacing: '-0.01em' },
        h6: { fontWeight: 700 },
        subtitle1: { fontWeight: 700, letterSpacing: '0.02em' },
        caption:   { letterSpacing: '0.01em' },
    },
    shape: { borderRadius: 8 },
    components: {
        MuiButton: {
            styleOverrides: {
                root: { textTransform: 'none', fontWeight: 600, letterSpacing: '0.01em' },
                containedPrimary: {
                    background: '#1565C0',
                    '&:hover': { background: '#0D47A1' },
                },
                containedSecondary: {
                    background: '#2E7D32',
                    '&:hover': { background: '#1B5E20' },
                },
            },
        },
        MuiChip: {
            styleOverrides: {
                root: { fontWeight: 600, fontSize: '0.65rem' },
            },
        },
        MuiInputLabel: {
            styleOverrides: { root: { fontWeight: 500 } },
        },
        MuiPaper: {
            styleOverrides: {
                root: { backgroundImage: 'none' },
            },
        },
    },
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
    { value: 'EMISSAO_DOCUMENTOS',    label: 'Emissão de Documentos' },
    { value: 'BENEFICIO_PREVIDENCIARIO', label: 'Benefício Previdenciário' },
    { value: 'CONSULTORIA_FINANCEIRA',  label: 'Consultoria Financeira' },
    { value: 'SUPORTE_TECNICO',         label: 'Suporte Técnico' },
    { value: 'OUTROS',                  label: 'Outros Serviços' },
];

const PRIORIDADES = [
    { value: 'NORMAL',       label: 'Normal' },
    { value: 'IDOSO',        label: 'Idoso (Lei 10.741/03)' },
    { value: 'PREFERENCIAL', label: 'Preferencial' },
    { value: 'PCD',          label: 'Pessoa com Deficiência' },
];

// ---------- Helpers ----------
const statusConfig: Record<
    Agendamento['status'],
    { color: string; bgColor: string; icon: React.ReactElement }
> = {
    AGUARDANDO:     { color: '#E65100', bgColor: '#FFF3E0', icon: <HourglassTop sx={{ fontSize: 14 }} /> },
    EM_ATENDIMENTO: { color: '#0D47A1', bgColor: '#E3F2FD', icon: <SupportAgent   sx={{ fontSize: 14 }} /> },
    CONCLUIDO:      { color: '#1B5E20', bgColor: '#E8F5E9', icon: <CheckCircleOutline sx={{ fontSize: 14 }} /> },
    CANCELADO:      { color: '#B71C1C', bgColor: '#FFEBEE', icon: <Cancel         sx={{ fontSize: 14 }} /> },
};

const borderColorMap: Record<Agendamento['status'], string> = {
    AGUARDANDO:     '#F9A825',
    EM_ATENDIMENTO: '#1565C0',
    CONCLUIDO:      '#2E7D32',
    CANCELADO:      '#C62828',
};

const prioridadeShortLabel = (p: string) => (p === 'NORMAL' ? null : p);

// Estatísticas do cabeçalho das colunas
const COLUNAS = [
    { key: 'AGUARDANDO',     title: 'Aguardando',      chipColor: { bg: '#FFF3E0', text: '#E65100' } },
    { key: 'EM_ATENDIMENTO', title: 'Em Atendimento',  chipColor: { bg: '#E3F2FD', text: '#0D47A1' } },
    { key: 'CONCLUIDO',      title: 'Concluídos',      chipColor: { bg: '#E8F5E9', text: '#1B5E20' } },
    { key: 'CANCELADO',      title: 'Cancelados',       chipColor: { bg: '#FFEBEE', text: '#B71C1C' } },
] as const;

// ===============================
// COMPONENT
// ===============================
export default function AgendamentoPage() {
    const [agendamentos, setAgendamentos] = useState<Agendamento[]>([]);
    const [submitting, setSubmitting]     = useState(false);
    const [updatingId, setUpdatingId]     = useState<string | null>(null);
    const [modalOpen, setModalOpen]       = useState(false);

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

    useEffect(() => { fetchAgendamentos(); }, [fetchAgendamentos]);

    // ---------- Submit ----------
    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setSubmitting(true);
        try {
            await api.post('/agendamentos/agendar', {
                ...formData,
                cpf: formData.cpf.replace(/\D/g, ''),
            });
            setToast({ open: true, message: 'Agendamento criado com sucesso!', severity: 'success' });
            setFormData({ nomeSolicitante: '', cpf: '', rg: '', tipoServico: '', prioridade: 'NORMAL', dataHoraChegada: '' });
            setModalOpen(false);
            fetchAgendamentos();
        } catch {
            setToast({ open: true, message: 'Erro ao criar agendamento. Verifique os dados e tente novamente.', severity: 'error' });
        } finally {
            setSubmitting(false);
        }
    };

    const atualizarStatus = async (id: string, status: Agendamento['status']) => {
        if (status === 'CANCELADO') {
            const ok = window.confirm('Tem certeza que deseja cancelar este agendamento?');
            if (!ok) return;
        }
        setUpdatingId(id);
        await api.post(`/agendamentos/${id}/status`, { status });
        fetchAgendamentos();
        setUpdatingId(null);
    };

    const fecharExpediente = async () => {
        const ok = window.confirm('Deseja fechar o expediente e gerar o relatório do dia?');
        if (!ok) return;
        try {
            const response = await api.post('/agendamentos/fechar-expediente', {}, { responseType: 'blob' });
            const blob = new Blob([response.data], { type: 'application/pdf' });
            const url  = window.URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href  = url;
            link.setAttribute('download', `relatorio-expediente-${new Date().toISOString().slice(0, 10)}.pdf`);
            document.body.appendChild(link);
            link.click();
            link.remove();
            setToast({ open: true, message: 'Relatório do expediente gerado com sucesso.', severity: 'success' });
        } catch {
            setToast({ open: true, message: 'Erro ao gerar relatório do expediente.', severity: 'error' });
        }
    };

    // ---------- Filtros ----------
    const filtrados: Record<string, Agendamento[]> = {
        AGUARDANDO:     agendamentos.filter(a => a.status === 'AGUARDANDO'),
        EM_ATENDIMENTO: agendamentos.filter(a => a.status === 'EM_ATENDIMENTO'),
        CONCLUIDO:      agendamentos.filter(a => a.status === 'CONCLUIDO'),
        CANCELADO:      agendamentos.filter(a => a.status === 'CANCELADO'),
    };

    // ---------- Render ----------
    return (
        <ThemeProvider theme={crasTema}>
            <Box sx={{ backgroundColor: '#EDF1F8', minHeight: '100vh', pb: 4 }}>

                {/* ── CABEÇALHO INSTITUCIONAL ── */}
                <Box
                    sx={{
                        background: '#0D3B7A',
                        color: '#fff',
                        borderBottom: '4px solid #F9A825',
                    }}
                >
                    {/* Faixa superior */}
                    <Box
                        display="flex"
                        alignItems="center"
                        gap={2}
                        sx={{ px: 4, py: 1.5, borderBottom: '1px solid rgba(255,255,255,0.12)' }}
                    >
                        <HomeWork sx={{ fontSize: 36, color: 'rgba(255,255,255,0.85)' }} />

                        <Box flex={1}>
                            <Typography
                                variant="h6"
                                sx={{ color: '#fff', fontWeight: 700, lineHeight: 1.2, fontSize: '1.05rem' }}
                            >
                                CRAS — Centro de Referência de Assistência Social
                            </Typography>
                            <Typography
                                variant="caption"
                                sx={{ color: 'rgba(255,255,255,0.6)', textTransform: 'uppercase', letterSpacing: '0.08em', fontSize: '0.68rem' }}
                            >
                                Sistema de Gerenciamento de Atendimentos · SUAS
                            </Typography>
                        </Box>

                        <Box textAlign="right">
                            <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.65)', display: 'block', fontSize: '0.72rem' }}>
                                {new Date().toLocaleDateString('pt-BR', { weekday: 'long', day: '2-digit', month: 'long', year: 'numeric' })}
                            </Typography>
                        </Box>
                    </Box>

                    {/* Submenu / turno */}
                    <Box
                        display="flex"
                        alignItems="center"
                        gap={1}
                        sx={{ px: 4, py: 0.8, background: '#0F4898' }}
                    >
                        <Box
                            sx={{
                                width: 7, height: 7, borderRadius: '50%',
                                background: '#6EE7B7', flexShrink: 0,
                            }}
                        />
                        <CalendarToday sx={{ fontSize: 14, color: 'rgba(255,255,255,0.7)' }} />
                        <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.75)', fontSize: '0.78rem' }}>
                            Expediente em andamento · Gerenciamento de Agendamentos do Dia
                        </Typography>
                    </Box>
                </Box>

                <Container maxWidth={false} sx={{ px: 4 }}>

                    {/* ── AÇÕES ── */}
                    <Box
                        display="flex"
                        gap={2}
                        alignItems="center"
                        sx={{
                            mt: 3, mb: 2,
                            background: '#fff',
                            borderRadius: 2,
                            px: 3, py: 1.5,
                            border: '1px solid #D6DFF0',
                        }}
                    >
                        <Button
                            variant="contained"
                            color="primary"
                            startIcon={<AddCircle />}
                            onClick={() => setModalOpen(true)}
                        >
                            Novo Agendamento
                        </Button>

                        <Button
                            variant="outlined"
                            color="error"
                            startIcon={<Article />}
                            onClick={fecharExpediente}
                            sx={{ borderColor: '#EF9A9A', color: '#C62828', '&:hover': { borderColor: '#C62828', background: '#FFF5F5' } }}
                        >
                            Fechar Expediente e Gerar Relatório
                        </Button>
                    </Box>

                    {/* ── CARDS DE RESUMO ── */}
                    <Grid container spacing={2} sx={{ mb: 3 }}>
                        {COLUNAS.map(col => (
                            <Grid item xs={6} sm={3} key={col.key}>
                                <Paper
                                    elevation={0}
                                    sx={{
                                        p: 2,
                                        borderLeft: `5px solid ${borderColorMap[col.key as Agendamento['status']]}`,
                                        border: '1px solid #D6DFF0',
                                        borderLeftWidth: 5,
                                        background: '#fff',
                                    }}
                                >
                                    <Typography
                                        variant="caption"
                                        sx={{
                                            textTransform: 'uppercase',
                                            letterSpacing: '0.06em',
                                            color: 'text.secondary',
                                            fontSize: '0.68rem',
                                            fontWeight: 600,
                                        }}
                                    >
                                        {col.title}
                                    </Typography>
                                    <Typography
                                        variant="h4"
                                        sx={{ mt: 0.5, color: borderColorMap[col.key as Agendamento['status']], lineHeight: 1 }}
                                    >
                                        {filtrados[col.key].length}
                                    </Typography>
                                </Paper>
                            </Grid>
                        ))}
                    </Grid>

                    {/* ── KANBAN ── */}
                    <Grid container spacing={2.5} sx={{ width: '100%', m: 0 }}>
                        {COLUNAS.map(col => {
                            const lista = filtrados[col.key];
                            const cfg   = statusConfig[col.key as Agendamento['status']];

                            return (
                                <Grid item xs={12} sm={6} md={3} key={col.key}>
                                    <Paper
                                        elevation={0}
                                        sx={{
                                            p: 0,
                                            height: 'calc(100vh - 330px)',
                                            display: 'flex',
                                            flexDirection: 'column',
                                            border: '1px solid #D6DFF0',
                                            borderRadius: 2,
                                            overflow: 'hidden',
                                        }}
                                    >
                                        {/* Cabeçalho da coluna */}
                                        <Box
                                            display="flex"
                                            alignItems="center"
                                            justifyContent="space-between"
                                            sx={{
                                                px: 2, py: 1.2,
                                                background: '#fff',
                                                borderBottom: `2px solid ${borderColorMap[col.key as Agendamento['status']]}`,
                                            }}
                                        >
                                            <Typography
                                                variant="caption"
                                                sx={{
                                                    fontWeight: 700,
                                                    textTransform: 'uppercase',
                                                    letterSpacing: '0.07em',
                                                    fontSize: '0.72rem',
                                                    color: 'text.secondary',
                                                }}
                                            >
                                                {col.title}
                                            </Typography>
                                            <Box
                                                sx={{
                                                    background: col.chipColor.bg,
                                                    color: col.chipColor.text,
                                                    fontWeight: 700,
                                                    fontSize: '0.72rem',
                                                    px: 1.2, py: 0.2,
                                                    borderRadius: '12px',
                                                    minWidth: 24,
                                                    textAlign: 'center',
                                                }}
                                            >
                                                {lista.length}
                                            </Box>
                                        </Box>

                                        {/* Cartões */}
                                        <Box
                                            sx={{
                                                flex: 1,
                                                overflowY: 'auto',
                                                p: 1.5,
                                                background: '#F4F7FB',
                                                '&::-webkit-scrollbar': { width: '4px' },
                                                '&::-webkit-scrollbar-thumb': { background: '#C5D0E0', borderRadius: '8px' },
                                            }}
                                        >
                                            {lista.length === 0 && (
                                                <Box
                                                    sx={{
                                                        border: '1px dashed #C5D0E0',
                                                        borderRadius: 2,
                                                        py: 3,
                                                        textAlign: 'center',
                                                        color: 'text.secondary',
                                                        fontSize: '0.8rem',
                                                    }}
                                                >
                                                    Nenhum registro
                                                </Box>
                                            )}

                                            {lista.map(item => (
                                                <Paper
                                                    key={item.id}
                                                    elevation={0}
                                                    sx={{
                                                        p: 1.5,
                                                        mb: 1.5,
                                                        borderLeft: `5px solid ${borderColorMap[item.status]}`,
                                                        borderRadius: '8px',
                                                        border: '1px solid #D6DFF0',
                                                        borderLeftWidth: 5,
                                                        transition: 'box-shadow 0.2s',
                                                        '&:hover': { boxShadow: '0 2px 12px rgba(0,0,0,0.09)' },
                                                    }}
                                                >
                                                    {/* Chips de status / prioridade */}
                                                    <Box display="flex" gap={0.5} mb={0.8} flexWrap="wrap">
                                                        <Box
                                                            sx={{
                                                                display: 'flex',
                                                                alignItems: 'center',
                                                                gap: 0.3,
                                                                background: cfg.bgColor,
                                                                color: cfg.color,
                                                                fontSize: '0.6rem',
                                                                fontWeight: 700,
                                                                px: 0.8, py: 0.2,
                                                                borderRadius: '10px',
                                                            }}
                                                        >
                                                            {cfg.icon}
                                                            {item.status.replace('_', ' ')}
                                                        </Box>

                                                        {prioridadeShortLabel(item.prioridade) && (
                                                            <Chip
                                                                label={prioridadeShortLabel(item.prioridade)}
                                                                size="small"
                                                                sx={{
                                                                    height: 18,
                                                                    fontSize: '0.6rem',
                                                                    background: '#FCE4EC',
                                                                    color: '#880E4F',
                                                                    fontWeight: 700,
                                                                }}
                                                            />
                                                        )}
                                                    </Box>

                                                    {/* Nome */}
                                                    <Typography variant="body2" fontWeight={700} sx={{ lineHeight: 1.2, mb: 0.3 }}>
                                                        {item.nomeSolicitante}
                                                    </Typography>

                                                    {/* Serviço */}
                                                    <Typography variant="caption" color="text.secondary" display="block" sx={{ mb: 0.5 }}>
                                                        {TIPOS_SERVICO.find(t => t.value === item.tipoServico)?.label || item.tipoServico}
                                                    </Typography>

                                                    {/* Data e hora */}
                                                    {item.dataHoraChegada && (
                                                        <Typography variant="caption" display="block" color="text.secondary" sx={{ mb: 1 }}>
                                                            <AccessTime sx={{ fontSize: 11, verticalAlign: 'middle', mr: 0.3 }} />
                                                            {new Date(item.dataHoraChegada).toLocaleDateString('pt-BR')}
                                                            {' · '}
                                                            {new Date(item.dataHoraChegada).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                                                        </Typography>
                                                    )}

                                                    {/* Ações */}
                                                    <Box display="flex" gap={0.8} flexWrap="wrap">
                                                        {item.status === 'AGUARDANDO' && (
                                                            <Button
                                                                fullWidth
                                                                size="small"
                                                                variant="contained"
                                                                color="primary"
                                                                onClick={() => atualizarStatus(item.id, 'EM_ATENDIMENTO')}
                                                                disabled={updatingId === item.id}
                                                                sx={{ fontSize: '0.72rem', py: 0.5 }}
                                                            >
                                                                {updatingId === item.id ? <CircularProgress size={14} /> : 'Iniciar Atendimento'}
                                                            </Button>
                                                        )}

                                                        {item.status === 'EM_ATENDIMENTO' && (
                                                            <>
                                                                <Button
                                                                    size="small"
                                                                    variant="contained"
                                                                    color="secondary"
                                                                    onClick={() => atualizarStatus(item.id, 'CONCLUIDO')}
                                                                    disabled={updatingId === item.id}
                                                                    sx={{ flex: 1, fontSize: '0.72rem', py: 0.5, minWidth: '70px' }}
                                                                >
                                                                    Concluir
                                                                </Button>
                                                                <Button
                                                                    size="small"
                                                                    variant="outlined"
                                                                    color="error"
                                                                    onClick={() => atualizarStatus(item.id, 'CANCELADO')}
                                                                    disabled={updatingId === item.id}
                                                                    sx={{ flex: 1, fontSize: '0.72rem', py: 0.5, minWidth: '70px' }}
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
                            );
                        })}
                    </Grid>
                </Container>

                {/* ── MODAL NOVO AGENDAMENTO ── */}
                <Modal open={modalOpen} onClose={() => setModalOpen(false)}>
                    <Box
                        sx={{
                            position: 'absolute',
                            top: '50%', left: '50%',
                            transform: 'translate(-50%, -50%)',
                            width: '95%', maxWidth: 520,
                            bgcolor: '#fff',
                            borderRadius: 3,
                            boxShadow: '0 8px 40px rgba(0,0,0,0.18)',
                            overflow: 'hidden',
                        }}
                    >
                        {/* Cabeçalho do modal */}
                        <Box
                            sx={{
                                background: '#0D3B7A',
                                color: '#fff',
                                px: 3, py: 2,
                                display: 'flex',
                                alignItems: 'center',
                                gap: 1.5,
                            }}
                        >
                            <AddCircle sx={{ fontSize: 22 }} />
                            <Typography variant="h6" sx={{ color: '#fff', fontSize: '1rem' }}>
                                Novo Agendamento
                            </Typography>
                        </Box>

                        <Box sx={{ p: 3 }}>
                            <Box component="form" onSubmit={handleSubmit}>
                                <TextField
                                    label="Nome completo do solicitante"
                                    fullWidth
                                    margin="normal"
                                    required
                                    value={formData.nomeSolicitante}
                                    onChange={(e) => setFormData({ ...formData, nomeSolicitante: e.target.value })}
                                    InputProps={{
                                        startAdornment: (
                                            <InputAdornment position="start"><Person fontSize="small" /></InputAdornment>
                                        ),
                                    }}
                                />

                                <Grid container spacing={2}>
                                    <Grid item xs={7}>
                                        <TextField
                                            label="CPF"
                                            fullWidth
                                            margin="normal"
                                            required
                                            placeholder="000.000.000-00"
                                            value={formData.cpf}
                                            onChange={(e) => setFormData({ ...formData, cpf: e.target.value })}
                                            InputProps={{
                                                startAdornment: (
                                                    <InputAdornment position="start"><Badge fontSize="small" /></InputAdornment>
                                                ),
                                            }}
                                        />
                                    </Grid>
                                    <Grid item xs={5}>
                                        <TextField
                                            label="RG"
                                            fullWidth
                                            margin="normal"
                                            value={formData.rg}
                                            onChange={(e) => setFormData({ ...formData, rg: e.target.value })}
                                        />
                                    </Grid>
                                </Grid>

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
                                            <MenuItem key={t.value} value={t.value}>{t.label}</MenuItem>
                                        ))}
                                    </Select>
                                </FormControl>

                                <FormControl fullWidth margin="normal" required>
                                    <InputLabel>Prioridade de Atendimento</InputLabel>
                                    <Select
                                        value={formData.prioridade}
                                        label="Prioridade de Atendimento"
                                        onChange={(e: SelectChangeEvent) =>
                                            setFormData({ ...formData, prioridade: e.target.value })
                                        }
                                    >
                                        {PRIORIDADES.map(p => (
                                            <MenuItem key={p.value} value={p.value}>{p.label}</MenuItem>
                                        ))}
                                    </Select>
                                </FormControl>

                                <TextField
                                    label="Data e Hora do Agendamento"
                                    type="datetime-local"
                                    fullWidth
                                    margin="normal"
                                    required
                                    value={formData.dataHoraChegada}
                                    onChange={(e) => setFormData({ ...formData, dataHoraChegada: e.target.value })}
                                    InputLabelProps={{ shrink: true }}
                                    InputProps={{
                                        startAdornment: (
                                            <InputAdornment position="start"><AccessTime fontSize="small" /></InputAdornment>
                                        ),
                                    }}
                                />

                                <Divider sx={{ my: 2 }} />

                                <Box display="flex" gap={1.5}>
                                    <Button
                                        fullWidth
                                        variant="outlined"
                                        onClick={() => setModalOpen(false)}
                                        sx={{ borderColor: '#C5D0E0', color: 'text.secondary' }}
                                    >
                                        Cancelar
                                    </Button>
                                    <Button
                                        type="submit"
                                        fullWidth
                                        variant="contained"
                                        color="primary"
                                        disabled={submitting}
                                    >
                                        {submitting ? <CircularProgress size={22} color="inherit" /> : 'Confirmar Agendamento'}
                                    </Button>
                                </Box>
                            </Box>
                        </Box>
                    </Box>
                </Modal>

                {/* ── TOAST ── */}
                <Snackbar
                    open={toast.open}
                    autoHideDuration={5000}
                    onClose={() => setToast({ ...toast, open: false })}
                    anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
                >
                    <Alert
                        severity={toast.severity}
                        variant="filled"
                        sx={{ fontWeight: 600, borderRadius: 2 }}
                    >
                        {toast.message}
                    </Alert>
                </Snackbar>

                {/* ── RODAPÉ ── */}
                <Box
                    sx={{
                        mt: 4,
                        background: '#0D3B7A',
                        py: 1.2, px: 4,
                        display: 'flex',
                        justifyContent: 'space-between',
                    }}
                >
                    <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.5)', fontSize: '0.7rem' }}>
                        Ministério do Desenvolvimento e Assistência Social · Sistema Único de Assistência Social — SUAS
                    </Typography>
                    <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.4)', fontSize: '0.7rem' }}>
                        Prefeitura Municipal
                    </Typography>
                </Box>

            </Box>
        </ThemeProvider>
    );
}