import { createTheme } from "@mui/material/styles";

// Paleta institucional do CRAS/SUAS — mesmas cores usadas no dashboard
// (AgendamentoPage.tsx), para que login e dashboard se comuniquem visualmente.
const theme = createTheme({
    palette: {
        primary: {
            main: "#1565C0",
            light: "#1976D2",
            dark: "#0D3B7A",
            contrastText: "#fff",
        },
        secondary: {
            main: "#2E7D32",
            light: "#388E3C",
            dark: "#1B5E20",
            contrastText: "#fff",
        },
        warning: {
            main: "#F9A825",
        },
        background: {
            default: "#EDF1F8",
        },
    },
    shape: {
        borderRadius: 14,
    },
    components: {
        MuiPaper: {
            styleOverrides: {
                root: {
                    borderRadius: 20,
                }
            }
        },
        MuiButton: {
            styleOverrides: {
                root: {
                    borderRadius: 10,
                    textTransform: "none",
                    fontWeight: 600,
                },
            },
        },
        MuiTextField: {
            styleOverrides: {
                root: {
                    backgroundColor: "white",
                    borderRadius: 12,
                },
            },
        },
        MuiSelect: {
            styleOverrides: {
                root: {
                    backgroundColor: "white",
                    borderRadius: 12,
                },
            },
        }
    }
});

export default theme;
