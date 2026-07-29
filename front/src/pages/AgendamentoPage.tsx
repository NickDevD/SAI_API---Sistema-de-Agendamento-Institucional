import React, { useState, useEffect, useCallback } from 'react';
import Grid from '@mui/material/Grid';

import {
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
    Alert,
    Snackbar,
    InputAdornment,
    Divider,
    Modal,
    createTheme,
    ThemeProvider,
    Tooltip,
    IconButton,
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
    Logout,
} from '@mui/icons-material';

import { useNavigate } from 'react-router-dom';
import { api } from '../services/api';

// ─── MUI THEME ────────────────────────────────────────────────────────────────
const crasTema = createTheme({
    palette: {
        primary:    { main: '#1565C0', light: '#1976D2', dark: '#0D3B7A', contrastText: '#fff' },
        secondary:  { main: '#2E7D32', light: '#388E3C', dark: '#1B5E20', contrastText: '#fff' },
        error:      { main: '#C62828' },
        warning:    { main: '#F9A825' },
        background: { default: '#EDF1F8', paper: '#ffffff' },
    },
    typography: {
        fontFamily: "'Source Sans 3', 'Segoe UI', Arial, sans-serif",
        h4:        { fontWeight: 700 },
        h6:        { fontWeight: 700 },
        subtitle1: { fontWeight: 700 },
    },
    shape: { borderRadius: 8 },
    components: {
        MuiButton: {
            styleOverrides: {
                root: { textTransform: 'none', fontWeight: 600 },
                containedPrimary:   { background: '#1565C0', '&:hover': { background: '#0D47A1' } },
                containedSecondary: { background: '#2E7D32', '&:hover': { background: '#1B5E20' } },
            },
        },
        MuiPaper: { styleOverrides: { root: { backgroundImage: 'none' } } },
    },
});

// ─── TYPES ────────────────────────────────────────────────────────────────────
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

// ─── CONSTANTES ───────────────────────────────────────────────────────────────
const TIPOS_SERVICO = [
    { value: 'EMISSAO_DOCUMENTOS',       label: 'Emissão de Documentos' },
    { value: 'BENEFICIO_PREVIDENCIARIO', label: 'Benefício Previdenciário' },
    { value: 'CONSULTORIA_FINANCEIRA',   label: 'Consultoria Financeira' },
    { value: 'SUPORTE_TECNICO',          label: 'Suporte Técnico' },
    { value: 'OUTROS',                   label: 'Outros Serviços' },
];

const PRIORIDADES = [
    { value: 'NORMAL',       label: 'Normal' },
    { value: 'IDOSO',        label: 'Idoso (Lei 10.741/03)' },
    { value: 'PREFERENCIAL', label: 'Preferencial' },
    { value: 'PCD',          label: 'Pessoa com Deficiência (PCD)' },
];

// ─── HELPERS ──────────────────────────────────────────────────────────────────
const borderColorMap: Record<Agendamento['status'], string> = {
    AGUARDANDO:     '#F9A825',
    EM_ATENDIMENTO: '#1565C0',
    CONCLUIDO:      '#2E7D32',
    CANCELADO:      '#C62828',
};

const statusConfig: Record<
    Agendamento['status'],
    { label: string; color: string; bgColor: string; icon: React.ReactElement }
> = {
    AGUARDANDO:     { label: 'Aguardando',     color: '#E65100', bgColor: '#FFF3E0', icon: <HourglassTop      sx={{ fontSize: 12 }} /> },
    EM_ATENDIMENTO: { label: 'Em Atendimento', color: '#0D47A1', bgColor: '#E3F2FD', icon: <SupportAgent       sx={{ fontSize: 12 }} /> },
    CONCLUIDO:      { label: 'Concluído',      color: '#1B5E20', bgColor: '#E8F5E9', icon: <CheckCircleOutline sx={{ fontSize: 12 }} /> },
    CANCELADO:      { label: 'Cancelado',      color: '#B71C1C', bgColor: '#FFEBEE', icon: <Cancel             sx={{ fontSize: 12 }} /> },
};

const COLUNAS = [
    { key: 'AGUARDANDO'     as const, title: 'Aguardando',     chip: { bg: '#FFF3E0', text: '#E65100' } },
    { key: 'EM_ATENDIMENTO' as const, title: 'Em Atendimento', chip: { bg: '#E3F2FD', text: '#0D47A1' } },
    { key: 'CONCLUIDO'      as const, title: 'Concluídos',     chip: { bg: '#E8F5E9', text: '#1B5E20' } },
    { key: 'CANCELADO'      as const, title: 'Cancelados',     chip: { bg: '#FFEBEE', text: '#B71C1C' } },
];

const prioridadeLabel = (p: string | null | undefined): string | null => {
    if (!p || p === 'NORMAL') return null;
    return p.replace('_', ' ');
};

// ─── COMPONENT ────────────────────────────────────────────────────────────────
export default function AgendamentoPage() {
    const navigate = useNavigate();
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

    const fetchAgendamentos = useCallback(async () => {
        try {
            const response = await api.get<Agendamento[]>('/agendamentos/consultar_agendamentos');
            const dados = (response.data ?? []).map((a) => ({
                ...a,
                nomeSolicitante: a.nomeSolicitante ?? '—',
                cpf:             a.cpf             ?? '',
                rg:              a.rg              ?? '',
                tipoServico:     a.tipoServico     ?? '',
                prioridade:      a.prioridade      ?? 'NORMAL',
                status:          a.status          ?? 'AGUARDANDO',
            }));
            setAgendamentos(dados);
        } catch (err) {
            console.error('Erro ao buscar agendamentos:', err);
            setToast({ open: true, message: 'Erro ao carregar agendamentos.', severity: 'error' });
        }
    }, []);

    useEffect(() => { fetchAgendamentos(); }, [fetchAgendamentos]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setSubmitting(true);
        try {
            await api.post('/agendamentos/agendar', {
                nomeSolicitante: formData.nomeSolicitante,
                cpf: formData.cpf?.replace(/\D/g, '') ?? '',
                rg: formData.rg,
                tipoServico: formData.tipoServico,
                prioridade: formData.prioridade,
                dataHoraChegada: formData.dataHoraChegada || null,
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
        if (status === 'CANCELADO' && !window.confirm('Tem certeza que deseja cancelar este agendamento?')) return;
        setUpdatingId(id);
        try {
            await api.post(`/agendamentos/${id}/status`, { status });
            await fetchAgendamentos();
            setToast({ open: true, message: 'Status atualizado com sucesso!', severity: 'success' });
        } catch (err) {
            console.error('Erro ao atualizar status:', err);
            setToast({ open: true, message: 'Erro ao atualizar o status. Tente novamente.', severity: 'error' });
        } finally {
            setUpdatingId(null);
        }
    };

    const fecharExpediente = async () => {
        if (!window.confirm('Deseja fechar o expediente e gerar o relatório do dia?')) return;
        try {
            const response = await api.post('/agendamentos/fechar-expediente', {}, { responseType: 'blob' });
            const url  = window.URL.createObjectURL(new Blob([response.data], { type: 'application/pdf' }));
            const link = Object.assign(document.createElement('a'), {
                href: url,
                download: `relatorio-expediente-${new Date().toISOString().slice(0, 10)}.pdf`,
            });
            document.body.appendChild(link);
            link.click();
            link.remove();
            setToast({ open: true, message: 'Relatório gerado com sucesso.', severity: 'success' });
            fetchAgendamentos();
        } catch {
            setToast({ open: true, message: 'Erro ao gerar relatório. Verifique se você tem permissão de ADMIN.', severity: 'error' });
        }
    };

    const handleLogout = () => {
        localStorage.removeItem('auth_token');
        navigate('/');
    };

    const filtrados = Object.fromEntries(
        COLUNAS.map(col => [col.key, agendamentos.filter(a => a.status === col.key)])
    );

    // ─────────────────────────────────────────────────────────────────────────
    return (
        <ThemeProvider theme={crasTema}>
            <Box sx={{
                height: '100vh',
                display: 'flex',
                flexDirection: 'column',
                bgcolor: '#EDF1F8',
                overflow: 'hidden',
            }}>

                {/* ══ CABEÇALHO INSTITUCIONAL ══════════════════════════════ */}
                <Box component="header" sx={{
                    flexShrink: 0,
                    background: '#0D3B7A',
                    borderBottom: '4px solid #F9A825',
                }}>
                    {/* Faixa principal */}
                    <Box sx={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 2,
                        px: { xs: 2, md: 4 },
                        py: { xs: 1, md: 1.5 },
                        borderBottom: '1px solid rgba(255,255,255,0.12)',
                    }}>
                        <HomeWork sx={{ fontSize: { xs: 26, md: 34 }, color: 'rgba(255,255,255,0.85)', flexShrink: 0 }} />

                        <Box sx={{ flex: 1, minWidth: 0 }}>
                            <Typography sx={{
                                color: '#fff',
                                fontWeight: 700,
                                fontSize: { xs: '0.82rem', sm: '0.95rem', md: '1.05rem' },
                                lineHeight: 1.25,
                                whiteSpace: { sm: 'nowrap' },
                                overflow: 'hidden',
                                textOverflow: 'ellipsis',
                            }}>
                                CRAS — Centro de Referência de Assistência Social
                            </Typography>
                            <Typography variant="caption" sx={{
                                color: 'rgba(255,255,255,0.58)',
                                textTransform: 'uppercase',
                                letterSpacing: '0.07em',
                                fontSize: '0.62rem',
                                display: { xs: 'none', sm: 'block' },
                            }}>
                                Sistema de Gerenciamento de Atendimentos · SUAS
                            </Typography>
                        </Box>

                        <Box sx={{ flexShrink: 0, textAlign: 'right', display: { xs: 'none', md: 'block' } }}>
                            <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.62)', fontSize: '0.72rem' }}>
                                {new Date().toLocaleDateString('pt-BR', {
                                    weekday: 'long', day: '2-digit', month: 'long', year: 'numeric',
                                })}
                            </Typography>
                        </Box>

                        {/* Botão de Logout */}
                        <Tooltip title="Sair do sistema">
                            <IconButton
                                onClick={handleLogout}
                                size="small"
                                sx={{ color: 'rgba(255,255,255,0.75)', flexShrink: 0, '&:hover': { color: '#fff', background: 'rgba(255,255,255,0.1)' } }}
                            >
                                <Logout fontSize="small" />
                            </IconButton>
                        </Tooltip>
                    </Box>

                    {/* Sub‑barra de turno */}
                    <Box sx={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 1,
                        px: { xs: 2, md: 4 },
                        py: 0.75,
                        background: '#0F4898',
                    }}>
                        <Box sx={{ width: 6, height: 6, borderRadius: '50%', background: '#6EE7B7', flexShrink: 0 }} />
                        <CalendarToday sx={{ fontSize: 13, color: 'rgba(255,255,255,0.7)', flexShrink: 0 }} />
                        <Typography noWrap variant="caption" sx={{ color: 'rgba(255,255,255,0.72)', fontSize: '0.73rem' }}>
                            Expediente em andamento · Gerenciamento de Agendamentos do Dia
                        </Typography>
                    </Box>
                </Box>

                {/* ══ ÁREA DE CONTEÚDO ══════════════════════════════════════ */}
                <Box sx={{
                    flex: 1,
                    minHeight: 0,
                    display: 'flex',
                    flexDirection: 'column',
                    overflow: { xs: 'auto', md: 'hidden' },
                    p: { xs: 1.5, sm: 2, md: 2.5 },
                    gap: { xs: 1.5, md: 2 },
                }}>

                    {/* ── BARRA DE AÇÕES ── */}
                    <Box sx={{
                        flexShrink: 0,
                        display: 'flex',
                        gap: 1.5,
                        flexWrap: 'wrap',
                        alignItems: 'center',
                        background: '#fff',
                        border: '1px solid #D6DFF0',
                        borderRadius: 2,
                        px: { xs: 2, md: 3 },
                        py: 1.25,
                    }}>
                        <Button
                            variant="contained"
                            color="primary"
                            size="small"
                            startIcon={<AddCircle />}
                            onClick={() => setModalOpen(true)}
                        >
                            Novo Agendamento
                        </Button>

                        <Button
                            variant="outlined"
                            size="small"
                            startIcon={<Article />}
                            onClick={fecharExpediente}
                            sx={{
                                borderColor: '#EF9A9A',
                                color: '#C62828',
                                '&:hover': { borderColor: '#C62828', background: '#FFF5F5' },
                            }}
                        >
                            <Box component="span" sx={{ display: { xs: 'none', sm: 'inline' } }}>
                                Fechar Expediente e Gerar{' '}
                            </Box>
                            Relatório
                        </Button>
                    </Box>

                    {/* ── CARDS DE RESUMO ── */}
                    <Box sx={{
                        flexShrink: 0,
                        display: 'grid',
                        gridTemplateColumns: { xs: 'repeat(2, 1fr)', md: 'repeat(4, 1fr)' },
                        gap: { xs: 1, md: 1.5 },
                    }}>
                        {COLUNAS.map(col => (
                            <Paper key={`stat-${col.key}`} elevation={0} sx={{
                                p: { xs: 1.5, md: 2 },
                                border: '1px solid #D6DFF0',
                                borderLeftWidth: 5,
                                borderLeftStyle: 'solid',
                                borderLeftColor: borderColorMap[col.key],
                            }}>
                                <Typography variant="caption" sx={{
                                    display: 'block',
                                    textTransform: 'uppercase',
                                    letterSpacing: '0.06em',
                                    color: 'text.secondary',
                                    fontSize: '0.63rem',
                                    fontWeight: 600,
                                    mb: 0.5,
                                }}>
                                    {col.title}
                                </Typography>
                                <Typography sx={{
                                    fontWeight: 700,
                                    fontSize: { xs: '1.6rem', md: '1.85rem' },
                                    lineHeight: 1,
                                    color: borderColorMap[col.key],
                                }}>
                                    {filtrados[col.key]?.length ?? 0}
                                </Typography>
                            </Paper>
                        ))}
                    </Box>

                    {/* ── KANBAN ── */}
                    <Box sx={{
                        flex: 1,
                        minHeight: 0,
                        display: 'grid',
                        gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, 1fr)', md: 'repeat(4, 1fr)' },
                        gap: { xs: 1.5, md: 2 },
                        overflow: { xs: 'visible', md: 'hidden' },
                    }}>
                        {COLUNAS.map(col => {
                            const lista = filtrados[col.key] ?? [];
                            const cfg   = statusConfig[col.key];

                            return (
                                <Paper key={col.key} elevation={0} sx={{
                                    display: 'flex',
                                    flexDirection: 'column',
                                    border: '1px solid #D6DFF0',
                                    borderRadius: 2,
                                    overflow: 'hidden',
                                    height: { md: '100%' },
                                    minHeight: { xs: 260, sm: 300, md: 0 },
                                }}>

                                    {/* Cabeçalho da coluna */}
                                    <Box sx={{
                                        flexShrink: 0,
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'space-between',
                                        px: 2, py: 1.1,
                                        background: '#fff',
                                        borderBottom: `2.5px solid ${borderColorMap[col.key]}`,
                                    }}>
                                        <Typography variant="caption" sx={{
                                            fontWeight: 700,
                                            textTransform: 'uppercase',
                                            letterSpacing: '0.07em',
                                            fontSize: '0.7rem',
                                            color: 'text.secondary',
                                        }}>
                                            {col.title}
                                        </Typography>
                                        <Box sx={{
                                            background: col.chip.bg,
                                            color: col.chip.text,
                                            fontWeight: 700,
                                            fontSize: '0.7rem',
                                            px: 1.2, py: 0.15,
                                            borderRadius: '12px',
                                            minWidth: 22,
                                            textAlign: 'center',
                                        }}>
                                            {lista.length}
                                        </Box>
                                    </Box>

                                    {/* Lista de cartões — scroll interno */}
                                    <Box sx={{
                                        flex: 1,
                                        minHeight: 0,
                                        overflowY: 'auto',
                                        p: 1.25,
                                        background: '#F4F7FB',
                                        '&::-webkit-scrollbar':       { width: '4px' },
                                        '&::-webkit-scrollbar-thumb': { background: '#C5D0E0', borderRadius: '8px' },
                                    }}>
                                        {lista.length === 0 && (
                                            <Box sx={{
                                                border: '1px dashed #C5D0E0',
                                                borderRadius: 2,
                                                py: 3,
                                                textAlign: 'center',
                                                color: 'text.secondary',
                                                fontSize: '0.78rem',
                                            }}>
                                                Nenhum registro
                                            </Box>
                                        )}

                                        {lista.map(item => (
                                            <Paper key={item.id} elevation={0} sx={{
                                                p: 1.5,
                                                mb: 1.25,
                                                border: '1px solid #D6DFF0',
                                                borderLeftWidth: 5,
                                                borderLeftStyle: 'solid',
                                                borderLeftColor: borderColorMap[item.status],
                                                borderRadius: '8px',
                                                transition: 'box-shadow 0.2s',
                                                '&:hover': { boxShadow: '0 2px 10px rgba(0,0,0,0.08)' },
                                            }}>
                                                {/* Status + prioridade */}
                                                <Box display="flex" gap={0.5} mb={0.75} flexWrap="wrap">
                                                    <Box sx={{
                                                        display: 'inline-flex',
                                                        alignItems: 'center',
                                                        gap: 0.3,
                                                        background: cfg.bgColor,
                                                        color: cfg.color,
                                                        fontSize: '0.58rem',
                                                        fontWeight: 700,
                                                        px: 0.8, py: 0.25,
                                                        borderRadius: '10px',
                                                    }}>
                                                        {cfg.icon}
                                                        {cfg.label}
                                                    </Box>

                                                    {prioridadeLabel(item.prioridade) && (
                                                        <Box sx={{
                                                            background: '#FCE4EC',
                                                            color: '#880E4F',
                                                            fontSize: '0.58rem',
                                                            fontWeight: 700,
                                                            px: 0.8, py: 0.25,
                                                            borderRadius: '10px',
                                                        }}>
                                                            {prioridadeLabel(item.prioridade)}
                                                        </Box>
                                                    )}
                                                </Box>

                                                <Typography sx={{ fontWeight: 700, fontSize: '0.82rem', lineHeight: 1.3, mb: 0.3 }}>
                                                    {item.nomeSolicitante ?? '—'}
                                                </Typography>

                                                <Typography variant="caption" color="text.secondary" display="block" sx={{ fontSize: '0.73rem', mb: 0.5 }}>
                                                    {TIPOS_SERVICO.find(t => t.value === item.tipoServico)?.label ?? item.tipoServico ?? '—'}
                                                </Typography>

                                                {item.dataHoraChegada && (
                                                    <Typography variant="caption" display="block" color="text.secondary" sx={{ fontSize: '0.7rem', mb: 0.75 }}>
                                                        <AccessTime sx={{ fontSize: 10, verticalAlign: 'middle', mr: 0.3 }} />
                                                        {new Date(item.dataHoraChegada).toLocaleDateString('pt-BR')}
                                                        {' · '}
                                                        {new Date(item.dataHoraChegada).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                                                    </Typography>
                                                )}

                                                <Box display="flex" gap={0.75}>
                                                    {item.status === 'AGUARDANDO' && (
                                                        <Button
                                                            fullWidth size="small" variant="contained" color="primary"
                                                            onClick={() => atualizarStatus(item.id, 'EM_ATENDIMENTO')}
                                                            disabled={updatingId === item.id}
                                                            sx={{ fontSize: '0.7rem', py: 0.4 }}
                                                        >
                                                            {updatingId === item.id
                                                                ? <CircularProgress size={12} color="inherit" />
                                                                : 'Iniciar Atendimento'}
                                                        </Button>
                                                    )}

                                                    {item.status === 'EM_ATENDIMENTO' && (<>
                                                        <Button
                                                            size="small" variant="contained" color="secondary"
                                                            onClick={() => atualizarStatus(item.id, 'CONCLUIDO')}
                                                            disabled={updatingId === item.id}
                                                            sx={{ flex: 1, fontSize: '0.7rem', py: 0.4, minWidth: 0 }}
                                                        >
                                                            {updatingId === item.id
                                                                ? <CircularProgress size={12} color="inherit" />
                                                                : 'Concluir'}
                                                        </Button>
                                                        <Button
                                                            size="small" variant="outlined" color="error"
                                                            onClick={() => atualizarStatus(item.id, 'CANCELADO')}
                                                            disabled={updatingId === item.id}
                                                            sx={{ flex: 1, fontSize: '0.7rem', py: 0.4, minWidth: 0 }}
                                                        >
                                                            Cancelar
                                                        </Button>
                                                    </>)}
                                                </Box>
                                            </Paper>
                                        ))}
                                    </Box>
                                </Paper>
                            );
                        })}
                    </Box>
                </Box>

                {/* ══ MODAL NOVO AGENDAMENTO ═══════════════════════════════ */}
                <Modal open={modalOpen} onClose={() => setModalOpen(false)}>
                    <Box sx={{
                        position: 'absolute',
                        top: '50%', left: '50%',
                        transform: 'translate(-50%, -50%)',
                        width: { xs: '96%', sm: '80%', md: 500 },
                        maxHeight: '92vh',
                        display: 'flex',
                        flexDirection: 'column',
                        bgcolor: '#fff',
                        borderRadius: 3,
                        boxShadow: '0 8px 40px rgba(0,0,0,0.2)',
                        overflow: 'hidden',
                    }}>
                        <Box sx={{
                            flexShrink: 0,
                            background: '#0D3B7A',
                            px: 3, py: 2,
                            display: 'flex',
                            alignItems: 'center',
                            gap: 1.5,
                        }}>
                            <AddCircle sx={{ fontSize: 20, color: '#fff' }} />
                            <Typography sx={{ color: '#fff', fontWeight: 700, fontSize: '1rem' }}>
                                Novo Agendamento
                            </Typography>
                        </Box>

                        <Box sx={{ flex: 1, overflowY: 'auto', p: { xs: 2, md: 3 } }}>
                            <Box component="form" onSubmit={handleSubmit}>
                                <TextField
                                    label="Nome completo do solicitante"
                                    fullWidth margin="normal" required
                                    value={formData.nomeSolicitante ?? ''}
                                    onChange={(e) => setFormData({ ...formData, nomeSolicitante: e.target.value })}
                                    InputProps={{ startAdornment: <InputAdornment position="start"><Person fontSize="small" /></InputAdornment> }}
                                />

                                <Grid container spacing={2}>
                                    <Grid item xs={7}>
                                        <TextField
                                            label="CPF" fullWidth margin="normal" required
                                            placeholder="000.000.000-00"
                                            value={formData.cpf ?? ''}
                                            onChange={(e) => setFormData({ ...formData, cpf: e.target.value })}
                                            InputProps={{ startAdornment: <InputAdornment position="start"><Badge fontSize="small" /></InputAdornment> }}
                                        />
                                    </Grid>
                                    <Grid item xs={5}>
                                        <TextField
                                            label="RG" fullWidth margin="normal"
                                            value={formData.rg ?? ''}
                                            onChange={(e) => setFormData({ ...formData, rg: e.target.value })}
                                        />
                                    </Grid>
                                </Grid>

                                <FormControl fullWidth margin="normal" required>
                                    <InputLabel>Tipo de Serviço</InputLabel>
                                    <Select
                                        value={formData.tipoServico ?? ''} label="Tipo de Serviço"
                                        onChange={(e: SelectChangeEvent) => setFormData({ ...formData, tipoServico: e.target.value })}
                                    >
                                        {TIPOS_SERVICO.map(t => <MenuItem key={t.value} value={t.value}>{t.label}</MenuItem>)}
                                    </Select>
                                </FormControl>

                                <FormControl fullWidth margin="normal" required>
                                    <InputLabel>Prioridade de Atendimento</InputLabel>
                                    <Select
                                        value={formData.prioridade ?? 'NORMAL'} label="Prioridade de Atendimento"
                                        onChange={(e: SelectChangeEvent) => setFormData({ ...formData, prioridade: e.target.value })}
                                    >
                                        {PRIORIDADES.map(p => <MenuItem key={p.value} value={p.value}>{p.label}</MenuItem>)}
                                    </Select>
                                </FormControl>

                                <TextField
                                    label="Data e Hora do Agendamento"
                                    type="datetime-local" fullWidth margin="normal" required
                                    value={formData.dataHoraChegada ?? ''}
                                    onChange={(e) => setFormData({ ...formData, dataHoraChegada: e.target.value })}
                                    InputLabelProps={{ shrink: true }}
                                    InputProps={{ startAdornment: <InputAdornment position="start"><AccessTime fontSize="small" /></InputAdornment> }}
                                />

                                <Divider sx={{ my: 2 }} />

                                <Box display="flex" gap={1.5}>
                                    <Button
                                        fullWidth variant="outlined"
                                        onClick={() => setModalOpen(false)}
                                        sx={{ borderColor: '#C5D0E0', color: 'text.secondary' }}
                                    >
                                        Cancelar
                                    </Button>
                                    <Button type="submit" fullWidth variant="contained" color="primary" disabled={submitting}>
                                        {submitting ? <CircularProgress size={20} color="inherit" /> : 'Confirmar Agendamento'}
                                    </Button>
                                </Box>
                            </Box>
                        </Box>
                    </Box>
                </Modal>

                {/* ══ TOAST ════════════════════════════════════════════════ */}
                <Snackbar
                    open={toast.open}
                    autoHideDuration={5000}
                    onClose={() => setToast({ ...toast, open: false })}
                    anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
                >
                    <Alert severity={toast.severity} variant="filled" sx={{ fontWeight: 600, borderRadius: 2 }}>
                        {toast.message}
                    </Alert>
                </Snackbar>

                {/* ══ RODAPÉ ═══════════════════════════════════════════════ */}
                <Box component="footer" sx={{
                    flexShrink: 0,
                    background: '#0D3B7A',
                    py: 0.9,
                    px: { xs: 2, md: 4 },
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                }}>
                    <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.48)', fontSize: '0.67rem' }}>
                        Ministério do Desenvolvimento e Assistência Social · SUAS
                    </Typography>
                    <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.38)', fontSize: '0.67rem', display: { xs: 'none', sm: 'block' } }}>
                        Prefeitura Municipal
                    </Typography>
                </Box>

            </Box>
        </ThemeProvider>
    );
}
