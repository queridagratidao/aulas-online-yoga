var MEET_LINK = "http://meet.google.com/rcf-dbkf-bqz";
var EMAIL_AMANDA = "queridagratidao@gmail.com";
var PLANILHA_ID = "1wrPHjjffqze39XmZ2x2HDfGhRRn_q_jvxThu7DmwEAE";

function doPost(e) {
  var params = e.parameter;
  var nome = params.nome;
  var email = params.email;
  var whatsapp = params.whatsapp;
  var dataAula = params.dataAula; // ISO string, ex: 2026-09-15T21:00:00.000Z

  var inicio = new Date(dataAula);
  var fim = new Date(inicio.getTime() + 60 * 60 * 1000);
  var dataFormatada = Utilities.formatDate(inicio, "GMT-03:00", "dd/MM/yyyy 'às' HH'h'mm");

  var erroAgenda = "";
  try {
    erroAgenda = criarEventoSemMeetAutomatico(nome, email, whatsapp, inicio, fim);
  } catch (err) {
    erroAgenda = String(err);
  }
  if (erroAgenda) Logger.log("Erro ao criar evento na agenda: " + erroAgenda);

  var erroPlanilha = "";
  try {
    registrarLeadNaPlanilha(nome, email, whatsapp, dataFormatada);
  } catch (err) {
    erroPlanilha = String(err);
  }
  if (erroPlanilha) Logger.log("Erro ao registrar lead na planilha: " + erroPlanilha);

  try {
    MailApp.sendEmail({
      to: email,
      subject: "Sua aula experimental de yoga está confirmada! 🌿",
      body:
        "Olá, " + nome + "!\n\n" +
        "Sua aula experimental gratuita de yoga com a Amanda Moraes está agendada para " + dataFormatada + ".\n\n" +
        "Link da aula (Google Meet): " + MEET_LINK + "\n\n" +
        "Você também recebeu um convite na sua agenda do Google, para não esquecer.\n\n" +
        "Nos vemos lá!\nAmanda - Querida Gratidão"
    });
  } catch (err) {
    Logger.log("Erro ao enviar e-mail para a aluna: " + err);
  }

  try {
    var linhasStatus = [];
    linhasStatus.push(erroAgenda ? "ATENÇÃO: não consegui criar o evento na agenda. Erro: " + erroAgenda : "O evento já foi criado na sua agenda do Google.");
    linhasStatus.push(erroPlanilha ? "ATENÇÃO: não consegui registrar esse lead na planilha. Erro: " + erroPlanilha : "O lead já está na planilha.");

    MailApp.sendEmail({
      to: EMAIL_AMANDA,
      subject: "Nova aula experimental agendada - " + nome,
      body:
        "Nova inscrição na aula experimental:\n\n" +
        "Nome: " + nome + "\n" +
        "E-mail: " + email + "\n" +
        "WhatsApp: " + whatsapp + "\n" +
        "Data/horário: " + dataFormatada + "\n\n" +
        linhasStatus.join("\n")
    });
  } catch (err) {
    Logger.log("Erro ao enviar e-mail de notificação para Amanda: " + err);
  }

  return ContentService
    .createTextOutput(JSON.stringify({ status: "ok" }))
    .setMimeType(ContentService.MimeType.JSON);
}

/**
 * Cria o evento em 3 etapas para evitar que o convite enviado à aluna
 * já saia com o link de Meet gerado automaticamente pela conta do Google:
 * 1) cria o evento SEM mandar convite ainda;
 * 2) remove o link de Meet automático desse evento específico
 *    (a configuração geral da agenda continua igual para outros eventos);
 * 3) só então envia o convite à convidada, já sem o link duplicado.
 * Retorna uma string vazia se tudo deu certo, ou a mensagem de erro.
 */
function criarEventoSemMeetAutomatico(nome, email, whatsapp, inicio, fim) {
  // Garante que o Apps Script solicite a permissão de Agenda (CalendarApp)
  // além da permissão usada para as chamadas diretas de API abaixo.
  CalendarApp.getDefaultCalendar();

  var headers = { Authorization: "Bearer " + ScriptApp.getOAuthToken() };
  var baseUrl = "https://www.googleapis.com/calendar/v3/calendars/primary/events";
  var descricao =
    "Aula experimental gratuita de yoga.\n" +
    "Aluna: " + nome + "\n" +
    "WhatsApp: " + whatsapp + "\n" +
    "Link da aula (Google Meet): " + MEET_LINK;

  var payloadCriacao = {
    summary: "Aula Experimental de Yoga - " + nome,
    description: descricao,
    start: { dateTime: inicio.toISOString(), timeZone: "America/Sao_Paulo" },
    end: { dateTime: fim.toISOString(), timeZone: "America/Sao_Paulo" },
    attendees: [{ email: email }],
    conferenceData: null
  };

  var criar = UrlFetchApp.fetch(baseUrl + "?conferenceDataVersion=1&sendUpdates=none", {
    method: "post",
    contentType: "application/json",
    headers: headers,
    payload: JSON.stringify(payloadCriacao),
    muteHttpExceptions: true
  });
  var codigoCriar = criar.getResponseCode();
  var evento = JSON.parse(criar.getContentText());
  if (codigoCriar < 200 || codigoCriar >= 300 || !evento.id) {
    return "criação (HTTP " + codigoCriar + "): " + criar.getContentText();
  }

  var patch1 = UrlFetchApp.fetch(baseUrl + "/" + evento.id + "?conferenceDataVersion=1&sendUpdates=none", {
    method: "patch",
    contentType: "application/json",
    headers: headers,
    payload: JSON.stringify({ conferenceData: null }),
    muteHttpExceptions: true
  });
  if (patch1.getResponseCode() >= 300) {
    Logger.log("Aviso: não consegui remover o Meet automático (HTTP " + patch1.getResponseCode() + "): " + patch1.getContentText());
  }

  var patch2 = UrlFetchApp.fetch(baseUrl + "/" + evento.id + "?sendUpdates=all", {
    method: "patch",
    contentType: "application/json",
    headers: headers,
    payload: JSON.stringify({ description: descricao }),
    muteHttpExceptions: true
  });
  if (patch2.getResponseCode() >= 300) {
    return "envio do convite (HTTP " + patch2.getResponseCode() + "): " + patch2.getContentText();
  }

  return "";
}

function registrarLeadNaPlanilha(nome, email, whatsapp, dataFormatada) {
  var planilha = SpreadsheetApp.openById(PLANILHA_ID);
  var aba = planilha.getSheets()[0];

  if (aba.getLastRow() === 0) {
    aba.appendRow(["Data do preenchimento", "Nome", "E-mail", "WhatsApp", "Aula agendada para"]);
  }

  aba.appendRow([
    Utilities.formatDate(new Date(), "GMT-03:00", "dd/MM/yyyy HH:mm"),
    nome,
    email,
    whatsapp,
    dataFormatada
  ]);
}
