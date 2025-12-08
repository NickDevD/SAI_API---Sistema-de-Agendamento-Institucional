import { createTheme } from "@mui/material/styles";

const theme = createTheme({
    palette: {
        primary: {
            main: "#5A4BFF",
        },
        secondary: {
            main: "#6C63FF",
        },
        background: {
            default: "#F6F7FB",
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
