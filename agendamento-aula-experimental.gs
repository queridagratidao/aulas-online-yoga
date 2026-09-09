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

  var calendario = CalendarApp.getDefaultCalendar();
  calendario.createEvent("Aula Experimental de Yoga - " + nome, inicio, fim, {
    description:
      "Aula experimental gratuita de yoga.\n" +
      "Aluna: " + nome + "\n" +
      "WhatsApp: " + whatsapp + "\n" +
      "Link da aula (Google Meet): " + MEET_LINK,
    guests: email,
    sendInvites: true
  });

  var dataFormatada = Utilities.formatDate(inicio, "GMT-03:00", "dd/MM/yyyy 'às' HH'h'mm");

  registrarLeadNaPlanilha(nome, email, whatsapp, dataFormatada);

  MailApp.sendEmail({
    to: email,
    subject: "Sua aula experimental de yoga está confirmada! 🌿",
    body:
      "Olá, " + nome + "!\n\n" +
      "Sua aula experimental gratuita de yoga com a Amanda Moraes está agendada para " + dataFormatada + ".\n\n" +
      "Link da aula (Google Meet): " + MEET_LINK + "\n\n" +
      "Você também recebeu um convite na sua agenda do Google com esse link, para não esquecer.\n\n" +
      "Nos vemos lá!\nQuerida Gratidão"
  });

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

  return ContentService
    .createTextOutput(JSON.stringify({ status: "ok" }))
    .setMimeType(ContentService.MimeType.JSON);
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
