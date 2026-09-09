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

  try {
    criarEventoSemMeetAutomatico(nome, email, whatsapp, inicio, fim);
  } catch (err) {
    Logger.log("Erro ao criar evento na agenda: " + err);
  }

  var planilhaOk = false;
  try {
    registrarLeadNaPlanilha(nome, email, whatsapp, dataFormatada);
    planilhaOk = true;
  } catch (err) {
    Logger.log("Erro ao registrar lead na planilha: " + err);
  }

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
    MailApp.sendEmail({
      to: EMAIL_AMANDA,
      subject: "Nova aula experimental agendada - " + nome,
      body:
        "Nova inscrição na aula experimental:\n\n" +
        "Nome: " + nome + "\n" +
        "E-mail: " + email + "\n" +
        "WhatsApp: " + whatsapp + "\n" +
        "Data/horário: " + dataFormatada + "\n\n" +
        "O evento já foi criado na sua agenda do Google.\n" +
        (planilhaOk ? "O lead já está na planilha." : "ATENÇÃO: não consegui registrar esse lead na planilha automaticamente — veja o log de Execuções no Apps Script.")
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
 */
function criarEventoSemMeetAutomatico(nome, email, whatsapp, inicio, fim) {
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
  var evento = JSON.parse(criar.getContentText());
  if (!evento.id) {
    Logger.log("Falha ao criar evento: " + criar.getContentText());
    return;
  }

  UrlFetchApp.fetch(baseUrl + "/" + evento.id + "?conferenceDataVersion=1&sendUpdates=none", {
    method: "patch",
    contentType: "application/json",
    headers: headers,
    payload: JSON.stringify({ conferenceData: null }),
    muteHttpExceptions: true
  });

  UrlFetchApp.fetch(baseUrl + "/" + evento.id + "?sendUpdates=all", {
    method: "patch",
    contentType: "application/json",
    headers: headers,
    payload: JSON.stringify({ description: descricao }),
    muteHttpExceptions: true
  });
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
