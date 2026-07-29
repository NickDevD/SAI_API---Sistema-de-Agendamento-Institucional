package com.devtec.sai.service;

import com.devtec.sai.model.Agendamento;
import com.itextpdf.kernel.colors.ColorConstants;
import com.itextpdf.kernel.pdf.PdfDocument;
import com.itextpdf.kernel.pdf.PdfWriter;
import com.itextpdf.layout.Document;
import com.itextpdf.layout.element.*;
import com.itextpdf.layout.properties.TextAlignment;
import com.itextpdf.layout.properties.UnitValue;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import java.io.File;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;

@Service
public class RelatorioService {

    @Value("${relatorio.path:/app/relatorios}")
    private String relatorioPath;

    public File gerarRelatorio(List<Agendamento> agendamentos) {
        try {
            File pasta = new File(relatorioPath);
            if (!pasta.exists()) {
                pasta.mkdirs();
            }

            String nomeArquivo = "relatorio_" + LocalDate.now() + ".pdf";
            File file = new File(pasta, nomeArquivo);

            PdfWriter writer = new PdfWriter(file.getAbsolutePath());
            PdfDocument pdf = new PdfDocument(writer);
            Document document = new Document(pdf);

            // ── TÍTULO ──────────────────────────────────────────────
            document.add(new Paragraph("RELATÓRIO DE ATENDIMENTOS")
                    .setBold().setFontSize(18)
                    .setTextAlignment(TextAlignment.CENTER));

            document.add(new Paragraph("Sistema de Agendamento Institucional — SAI")
                    .setTextAlignment(TextAlignment.CENTER));

            document.add(new Paragraph("Data do relatório: " + LocalDate.now())
                    .setTextAlignment(TextAlignment.CENTER));

            document.add(new Paragraph("Gerado em: " + LocalDateTime.now())
                    .setTextAlignment(TextAlignment.CENTER));

            document.add(new Paragraph("\n"));

            // ── RESUMO ───────────────────────────────────────────────
            long concluidos = agendamentos.stream()
                    .filter(a -> "CONCLUIDO".equals(a.getStatus().name())).count();
            long cancelados = agendamentos.stream()
                    .filter(a -> "CANCELADO".equals(a.getStatus().name())).count();
            long aguardando = agendamentos.stream()
                    .filter(a -> "AGUARDANDO".equals(a.getStatus().name())).count();
            long emAtendimento = agendamentos.stream()
                    .filter(a -> "EM_ATENDIMENTO".equals(a.getStatus().name())).count();

            document.add(new Paragraph("Resumo do expediente").setBold());
            document.add(new Paragraph("Total de atendimentos: " + agendamentos.size()));
            document.add(new Paragraph("Concluídos: " + concluidos));
            document.add(new Paragraph("Em Atendimento: " + emAtendimento));
            document.add(new Paragraph("Aguardando: " + aguardando));
            document.add(new Paragraph("Cancelados: " + cancelados));
            document.add(new Paragraph("\n"));

            // ── TABELA (6 colunas) ───────────────────────────────────
            Table table = new Table(UnitValue.createPercentArray(6)).useAllAvailableWidth();

            table.addHeaderCell(header("Nome"));
            table.addHeaderCell(header("CPF"));
            table.addHeaderCell(header("Serviço"));
            table.addHeaderCell(header("Prioridade"));
            table.addHeaderCell(header("Status"));
            table.addHeaderCell(header("Hora"));

            for (Agendamento a : agendamentos) {
                table.addCell(cell(a.getNomeSolicitante()));
                table.addCell(cell(a.getCpf()));
                table.addCell(cell(a.getTipoServico()));
                table.addCell(cell(a.getPrioridade() != null ? a.getPrioridade() : "NORMAL"));
                table.addCell(cell(a.getStatus().toString()));
                table.addCell(cell(a.getDataHoraChegada() != null
                        ? a.getDataHoraChegada().toLocalTime().toString()
                        : "-"));
            }

            document.add(table);
            document.add(new Paragraph("\n"));

            // ── RODAPÉ ───────────────────────────────────────────────
            document.add(new Paragraph("Relatório gerado automaticamente pelo Sistema SAI")
                    .setFontSize(10).setTextAlignment(TextAlignment.CENTER));

            document.close();
            return file;

        } catch (Exception e) {
            throw new RuntimeException("Erro ao gerar relatório", e);
        }
    }

    private Cell header(String texto) {
        return new Cell()
                .add(new Paragraph(texto).setBold())
                .setBackgroundColor(ColorConstants.LIGHT_GRAY)
                .setTextAlignment(TextAlignment.CENTER);
    }

    private Cell cell(String texto) {
        return new Cell()
                .add(new Paragraph(texto))
                .setTextAlignment(TextAlignment.CENTER);
    }
}
