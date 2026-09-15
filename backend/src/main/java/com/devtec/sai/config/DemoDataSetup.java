package com.devtec.sai.config;

import com.devtec.sai.model.Agendamento;
import com.devtec.sai.model.StatusAgendamento;
import com.devtec.sai.model.UserRole;
import com.devtec.sai.model.Usuario;
import com.devtec.sai.repository.AgendamentosRepository;
import com.devtec.sai.repository.UsuarioRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.CommandLineRunner;
import org.springframework.scheduling.annotation.EnableScheduling;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;
import org.springframework.util.StringUtils;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;

/**
 * Popula o ambiente de demonstração com dados fictícios e cria o usuário "demo".
 *
 * <p>Só roda quando {@code DEMO_SEED_ENABLED=true}. Mantenha desligado em qualquer
 * instalação real — o ambiente de produção do CRAS não deve receber dados sintéticos.
 *
 * <p>O usuário demo é criado com role {@link UserRole#USER} de propósito: o endpoint
 * {@code /agendamentos/fechar-expediente} exige ADMIN e apaga os registros do dia, então
 * um visitante não consegue esvaziar a demonstração.
 *
 * <p>Os horários são calculados a partir de {@link LocalDate#now()} para que a fila
 * apareça sempre como "hoje" — o kanban e o fechamento de expediente filtram pelo dia atual.
 *
 * <p>Além do boot, um agendamento periódico repõe os dados quando a base fica vazia. Sem
 * isso a demonstração morre no primeiro "Fechar Expediente" — a operação apaga os registros
 * do dia e os dados só voltariam num restart do container.
 */
@Component
@EnableScheduling
public class DemoDataSetup implements CommandLineRunner {

    private static final Logger logger = LoggerFactory.getLogger(DemoDataSetup.class);

    private final AgendamentosRepository agendamentosRepository;
    private final UsuarioRepository usuarioRepository;
    private final PasswordEncoder encoder;

    @Value("${DEMO_SEED_ENABLED:false}")
    private boolean demoSeedEnabled;

    @Value("${DEMO_LOGIN:demo}")
    private String demoLogin;

    @Value("${DEMO_PASSWORD:}")
    private String demoPassword;

    public DemoDataSetup(AgendamentosRepository agendamentosRepository,
                         UsuarioRepository usuarioRepository,
                         PasswordEncoder encoder) {
        this.agendamentosRepository = agendamentosRepository;
        this.usuarioRepository = usuarioRepository;
        this.encoder = encoder;
    }

    @Override
    public void run(String... args) {
        if (!demoSeedEnabled) {
            return;
        }

        criarUsuarioDemo();
        popularAgendamentos();
    }

    /**
     * Repõe os dados de demonstração quando a base fica vazia.
     *
     * <p>O gatilho mais comum é o "Fechar Expediente", que apaga os agendamentos do dia.
     * Como só age com a tabela vazia, não interfere em quem estiver testando: enquanto
     * houver qualquer registro, este método não faz nada.
     */
    @Scheduled(
            initialDelayString = "${DEMO_RESEED_INTERVAL_MS:120000}",
            fixedDelayString = "${DEMO_RESEED_INTERVAL_MS:120000}"
    )
    public void reporDadosSeVazio() {
        if (!demoSeedEnabled) {
            return;
        }
        popularAgendamentos();
    }

    private void criarUsuarioDemo() {
        if (!StringUtils.hasText(demoPassword)) {
            logger.warn("DEMO_SEED_ENABLED=true mas DEMO_PASSWORD nao foi definida - usuario demo nao sera criado");
            return;
        }

        if (usuarioRepository.findByLogin(demoLogin) != null) {
            logger.info("Usuario demo ja existe. login={}", demoLogin);
            return;
        }

        usuarioRepository.save(new Usuario(demoLogin, encoder.encode(demoPassword), UserRole.USER));
        logger.info("Usuario demo criado com role USER. login={}", demoLogin);
    }

    private void popularAgendamentos() {
        if (agendamentosRepository.count() > 0) {
            logger.debug("Base ja contem agendamentos - seed de demonstracao ignorado");
            return;
        }

        LocalDate hoje = LocalDate.now();

        // CPFs de exemplo amplamente publicados em documentacao de validacao brasileira.
        // Sao apenas numeros com digito verificador valido, exigidos pela anotacao @CPF —
        // nao identificam ninguem, e o frontend exibe o valor mascarado.
        List<Agendamento> demo = List.of(
                novo("Maria Aparecida de Souza", "52998224725", "1234567", "BENEFICIO_PREVIDENCIARIO",
                        "IDOSO", hora(hoje, 8, 10), StatusAgendamento.AGUARDANDO),
                novo("Jose Carlos Ferreira", "11144477735", "2233445", "EMISSAO_DOCUMENTOS",
                        "PCD", hora(hoje, 8, 25), StatusAgendamento.EM_ATENDIMENTO),
                novo("Sebastiao Alves Lima", "12345678909", "7788990", "BENEFICIO_PREVIDENCIARIO",
                        "IDOSO", hora(hoje, 8, 40), StatusAgendamento.AGUARDANDO),
                novo("Patricia Gomes Nunes", "15350946056", "9900112", "SUPORTE_TECNICO",
                        "PREFERENCIAL", hora(hoje, 9, 5), StatusAgendamento.EM_ATENDIMENTO),
                novo("Ana Lucia Rodrigues", "98765432100", "4455667", "CONSULTORIA_FINANCEIRA",
                        "NORMAL", hora(hoje, 9, 20), StatusAgendamento.CONCLUIDO),
                novo("Roberto Dias Carvalho", "40364176814", "5566778", "OUTROS",
                        "NORMAL", hora(hoje, 9, 45), StatusAgendamento.AGUARDANDO)
        );

        agendamentosRepository.saveAll(demo);
        logger.info("Seed de demonstracao aplicado: {} agendamentos criados para {}", demo.size(), hoje);
    }

    private LocalDateTime hora(LocalDate dia, int h, int min) {
        return dia.atTime(h, min);
    }

    private Agendamento novo(String nome, String cpf, String rg, String tipoServico,
                             String prioridade, LocalDateTime chegada, StatusAgendamento status) {
        Agendamento a = new Agendamento();
        a.setNomeSolicitante(nome);
        a.setCpf(cpf);
        a.setRg(rg);
        a.setTipoServico(tipoServico);
        a.setPrioridade(prioridade);
        a.setDataHoraChegada(chegada);
        a.setStatus(status);
        return a;
    }
}
