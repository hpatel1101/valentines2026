function doOptions() {
  return ContentService
    .createTextOutput(JSON.stringify({ ok: true }))
    .setMimeType(ContentService.MimeType.JSON);
}

function doGet() {
  return ContentService
    .createTextOutput(JSON.stringify({ ok: true, service: 'engagement-rsvp' }))
    .setMimeType(ContentService.MimeType.JSON);
}

function doPost(e) {
  try {
    var spreadsheetId = 'PASTE_YOUR_GOOGLE_SHEET_ID_HERE';
    var sheetName = 'RSVP Responses';

    var payload = JSON.parse(e.postData.contents || '{}');
    var sheet = SpreadsheetApp.openById(spreadsheetId).getSheetByName(sheetName);

    if (!sheet) {
      throw new Error('Sheet not found: ' + sheetName);
    }

    sheet.appendRow([
      new Date(),
      payload.inviteCode || '',
      payload.partyName || '',
      (payload.guestNames || []).join(', '),
      payload.attendance || '',
      payload.guestCount || '',
      payload.mealChoice || '',
      payload.email || '',
      payload.phone || '',
      payload.songRequest || '',
      payload.notes || '',
      payload.submittedAt || ''
    ]);

    return ContentService
      .createTextOutput(JSON.stringify({ ok: true }))
      .setMimeType(ContentService.MimeType.JSON);
  } catch (error) {
    return ContentService
      .createTextOutput(JSON.stringify({ ok: false, error: error.message }))
      .setMimeType(ContentService.MimeType.JSON);
  }
}
