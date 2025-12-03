import { createTheme } from '@mui/material/styles';
import { ptBR } from '@mui/material/locale';

const theme = createTheme(
    {
        palette: {
            primary: {
                main: '#1565c0',
                light: '#5e92f3',
                dark: '#003c8f',
                contrastText: '#ffffff',
            },
            secondary: {
                main: '#ef6c00',
                contrastText: '#ffffff',
            },
            background: {
                default: '#f4f6f8',
                paper: '#ffffff',
            },
            text: {
                primary: '#1c2025',
            },
        },
        typography: {
            fontFamily: '"Roboto", "Helvetica", "Arial", sans-serif',
            h4: { fontWeight: 600 },
        },
        components: {
            MuiButton: {
                styleOverrides: {
                    root: {
                        textTransform: 'none',
                        borderRadius: 8,
                    },
                },
            },
            MuiTextField: {
                defaultProps: {
                    variant: 'outlined',
                    size: 'small',
                },
            },
        },
    },
    ptBR,
);

export default theme;