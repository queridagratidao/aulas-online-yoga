# Como ativar o agendamento automático da aula experimental

Não precisa instalar nenhum aplicativo — tudo é feito pelo navegador, direto na sua conta do Gmail/Google.

## Passo a passo

1. Acesse **script.google.com** (logada com o Gmail da Querida Gratidão).
2. Clique em **"Novo projeto"**.
3. Apague o conteúdo padrão e cole o conteúdo do arquivo `agendamento-aula-experimental.gs` (está neste repositório).
4. No topo do código, confira a linha `var EMAIL_AMANDA = "..."` e troque pelo seu e-mail correto, se necessário.
5. Clique em **"Implantar" → "Nova implantação"**.
   - Tipo: **App da Web**.
   - Executar como: **Eu (sua conta)**.
   - Quem pode acessar: **Qualquer pessoa**.
6. Clique em **Implantar**. O Google vai pedir autorização — autorize com a sua conta.
7. Copie a **URL do app da Web** gerada (algo como `https://script.google.com/macros/s/.../exec`).
8. Abra o arquivo `index.html` do site, procure por:
   ```
   var EXP_GAS_URL = "COLE_AQUI_A_URL_DO_SEU_APPS_SCRIPT";
   ```
   e substitua pelo link que você copiou.
9. Salve e publique o site (commit + push no GitHub Pages).

## O que acontece quando alguém preenche o formulário

- É criado um evento na **sua agenda do Google** com o link da aula, no dia/horário certo (terça ou quinta, 21h).
- A pessoa é convidada para esse evento (recebe convite do Google Calendar no e-mail dela).
- A pessoa recebe um **e-mail de confirmação** com o link da aula.
- Você recebe um **e-mail de notificação** com nome, e-mail e WhatsApp da pessoa.

Assim você já fica sabendo, já tem na agenda pra lembrar de entrar em contato, e a pessoa já tem o link garantido mesmo que esqueça.

## Observação sobre o site (o próximo horário mostrado)

O formulário sempre sugere automaticamente a próxima terça ou quinta às 21h, calculada com base na data em que a pessoa está acessando o site (não precisa escolher horário — é sempre terça e quinta às 21h).

## Planilha de leads

Cada envio do formulário também é registrado como uma linha nesta planilha:
https://docs.google.com/spreadsheets/d/1wrPHjjffqze39XmZ2x2HDfGhRRn_q_jvxThu7DmwEAE/edit

Colunas: Data do preenchimento, Nome, E-mail, WhatsApp, Aula agendada para.

## Status atual

- URL do Apps Script já configurada no site (variável `EXP_GAS_URL` em `index.html`).
- Se o link do app da Web mudar no futuro (por exemplo, se for feita uma implantação nova em vez de atualizar a existente), é preciso atualizar essa variável de novo.
