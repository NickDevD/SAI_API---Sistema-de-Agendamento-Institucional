# Copy para o LinkedIn

> ⚠️ **Não publique enquanto o backend estiver em 503.** O primeiro clique de quem ler o
> post é no link, e hoje o login falha. Suba a API, passe o checklist da seção 2.5 do
> [roteiro](ROTEIRO-PORTFOLIO.md) e só então poste.

Três versões abaixo. A **Versão 1** é a recomendada.

---

## Versão 1 — Começa pelo problema (recomendada)

> Abre pelo domínio, não pela stack. É o que diferencia projeto de portfólio de exercício
> de curso, e é o ângulo que rende comentário de quem trabalha com serviço público.

```
No CRAS, a fila de atendimento costuma ser controlada em papel e planilha.

Quem chegou primeiro, quem tem prioridade legal, quem já foi atendido, quantas
pessoas passaram no dia. Tudo na memória do atendente e num caderno.

Foi esse o problema que peguei pra resolver no SAI — Sistema de Agendamento
Institucional.

O sistema registra a chegada do cidadão, acompanha o atendimento num kanban
(Aguardando → Em Atendimento → Concluído) e gera o relatório do expediente em
PDF no fim do dia.

Um detalhe que mudou o desenho: prioridade no SUAS não é preferência, é lei.
Idoso (Lei 10.741/03) e pessoa com deficiência têm direito de atendimento
prioritário. Isso não podia ser um campo qualquer no formulário — precisava
estar visível na fila, o tempo todo, pra quem está na recepção.

Stack:
• Java 21 + Spring Boot 4, Spring Security com JWT
• PostgreSQL 16 com migrations versionadas em Flyway
• React 18 + TypeScript + Material UI
• Docker, CI no GitHub Actions
• Deploy em Google Cloud Run (API) e Firebase Hosting (front)

O problema mais interessante apareceu no Spring Boot 4: a aplicação quebrava no
boot com "missing table/column". A auto-configuração do Flyway deixou de garantir
que as migrations rodassem antes da validação de schema do Hibernate — o
Hibernate validava um banco que ainda estava vazio.

Resolvi com um BeanFactoryPostProcessor que força a ordem de inicialização,
desligando a auto-config do Flyway e assumindo o controle do ciclo.

Levei um tempo pra entender que o erro não estava no meu código, e sim numa
mudança de comportamento entre versões do framework. Ler o changelog do Spring
Boot 4 resolveu mais rápido do que qualquer busca no Stack Overflow.

🔗 Sistema: [LINK]
💻 Código: [LINK]
📖 API (Swagger): [LINK]

Acesso demo: usuario / senha

Feedback é muito bem-vindo — principalmente de quem já trabalhou com sistema
de atendimento público.

#Java #SpringBoot #React #TypeScript #GoogleCloud
```

---

## Versão 2 — Começa pela decisão técnica

> Para um público mais sênior. Escolhe a decisão de arquivar em vez de apagar.
> **Só use esta versão depois de implementar a mudança** (item 8 do roteiro) —
> hoje o código ainda faz `deleteAll`.

```
"Fechar o expediente" parecia a funcionalidade mais simples do projeto.

Fim do dia, gera o PDF com o resumo dos atendimentos, limpa a tela pro dia
seguinte. Foi assim que escrevi na primeira versão: gerar relatório, apagar
os registros do dia.

Funcionava. E estava errado.

O que eu tinha construído apagava o histórico de atendimento de um equipamento
público. Se o PDF se perdesse — e ele estava gravado no disco efêmero de um
container, então ia se perder mesmo — não havia como reconstruir quem foi
atendido naquele dia.

Num sistema do SUAS, esse dado é o que sustenta prestação de contas e
planejamento da rede.

Refiz: arquivamento em vez de exclusão. Os registros saem da fila mas continuam
no banco, e os relatórios vão para o Cloud Storage em vez do disco do container.

O SAI é um sistema de gestão de fila de atendimento para o CRAS: registro de
chegada, acompanhamento em kanban, prioridade legal para idoso e PCD, e
relatório de fechamento de expediente.

Construído com Java 21 + Spring Boot 4, PostgreSQL com Flyway, React +
TypeScript, rodando em Cloud Run e Firebase Hosting.

A lição que fica: "apagar" quase nunca é o que o negócio quer dizer quando
fala em "limpar".

🔗 Sistema: [LINK]
💻 Código: [LINK]

#Java #SpringBoot #React #Arquitetura #GoogleCloud
```

---

## Versão 3 — Curta

> Para quem prefere post enxuto, ou como segundo post lembrando o projeto.

```
Terminei o SAI — Sistema de Agendamento Institucional.

É um sistema de gestão de fila de atendimento para o CRAS: registra a chegada
do cidadão, acompanha o atendimento num kanban e gera o relatório do expediente
em PDF.

Com prioridade legal para idoso e PCD — que no SUAS não é preferência, é lei.

Java 21 + Spring Boot 4 · PostgreSQL + Flyway · React + TypeScript
Cloud Run + Firebase Hosting · CI no GitHub Actions

🔗 [LINK]  💻 [LINK]

Aceito feedback.

#Java #SpringBoot #React #GoogleCloud
```

---

## Notas de uso

**Preencha antes de postar:** os `[LINK]` e as credenciais demo. Post de portfólio sem
credencial de acesso não é portfólio — é screenshot.

**Mídia.** O LinkedIn entrega muito mais post com mídia. Um GIF de 15–20 s mostrando
login → criar agendamento → mover no kanban → baixar o PDF vale mais que qualquer
parágrafo acima. Se não der, um print do kanban preenchido.

**Link nos comentários.** O algoritmo do LinkedIn penaliza link externo no corpo do post.
Uma saída comum é deixar o texto limpo e colocar os links no primeiro comentário,
avisando no fim do post ("links no primeiro comentário").

**Hashtags.** Três a cinco bastam. Mais que isso parece spam e não ajuda no alcance.

**Horário.** Terça a quinta, entre 8h e 10h, costuma render mais em público techie no
Brasil.

**Sobre o tom.** As três versões evitam superlativo ("incrível", "poderoso", "robusto")
de propósito. Descrever o problema com precisão convence mais do que adjetivo, e quem
avalia tecnicamente desconfia de entusiasmo sem substância.

**Responda os comentários.** O alcance de um post do LinkedIn cresce muito nas primeiras
duas horas conforme você responde. Vale reservar esse tempo.
