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

  var eventId = null;
  try {
    var calendario = CalendarApp.getDefaultCalendar();
    var evento = calendario.createEvent("Aula Experimental de Yoga - " + nome, inicio, fim, {
      description:
        "Aula experimental gratuita de yoga.\n" +
        "Aluna: " + nome + "\n" +
        "WhatsApp: " + whatsapp + "\n" +
        "Link da aula (Google Meet): " + MEET_LINK,
      guests: email,
      sendInvites: true
    });
    eventId = evento.getId().split("@")[0];
  } catch (err) {
    Logger.log("Erro ao criar evento na agenda: " + err);
  }

  if (eventId) {
    try {
      removerMeetAutomatico(eventId);
    } catch (err) {
      Logger.log("Erro ao remover Meet automático do evento: " + err);
    }
  }

  try {
    registrarLeadNaPlanilha(nome, email, whatsapp, dataFormatada);
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
        "Nos vemos lá!\nQuerida Gratidão"
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
        "O evento já foi criado na sua agenda do Google e o lead já está na planilha."
    });
  } catch (err) {
    Logger.log("Erro ao enviar e-mail de notificação para Amanda: " + err);
  }

  return ContentService
    .createTextOutput(JSON.stringify({ status: "ok" }))
    .setMimeType(ContentService.MimeType.JSON);
}

/**
 * Remove o Meet automático apenas deste evento (a configuração geral
 * da agenda de adicionar Meet automaticamente continua valendo para
 * os outros eventos/reuniões).
 */
function removerMeetAutomatico(eventId) {
  var url = "https://www.googleapis.com/calendar/v3/calendars/primary/events/" +
    eventId + "?conferenceDataVersion=1&sendUpdates=none";
  var options = {
    method: "patch",
    contentType: "application/json",
    headers: { Authorization: "Bearer " + ScriptApp.getOAuthToken() },
    payload: JSON.stringify({ conferenceData: null }),
    muteHttpExceptions: true
  };
  UrlFetchApp.fetch(url, options);
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
