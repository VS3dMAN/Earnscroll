/**
 * Kenri Waitlist — Google Apps Script web app
 * Bound to the "EarnScroll Waitlist" Google Sheet (sheet name unchanged — renaming
 * it would break the binding; the sheet ID below is the authoritative reference).
 * Receives name + email from the website's Coming Soon modal and appends a row.
 *
 * SETUP (one time):
 *   1. Open the sheet:
 *      https://docs.google.com/spreadsheets/d/1aU4VZ9DIknbgmzn3t87soN1UC-9u1zaD9I2CE2Sv8Uk/edit
 *   2. Extensions → Apps Script.
 *   3. Delete any starter code, paste ALL of this file, click Save (disk icon).
 *   4. Deploy → New deployment → gear icon → Web app.
 *        - Description: Kenri waitlist
 *        - Execute as: Me (your account)
 *        - Who has access: Anyone
 *      Click Deploy, then Authorize access and allow the permissions.
 *   5. Copy the "Web app" URL (it ends in /exec) and send it back — it gets
 *      pasted into website/js/main.js as WAITLIST_ENDPOINT.
 *
 * To test quickly: run the `test` function once (Run menu), then check the sheet.
 */

function doPost(e) {
  var lock = LockService.getScriptLock();
  lock.waitLock(30000);
  try {
    var sheet = SpreadsheetApp.getActiveSpreadsheet().getSheets()[0];
    if (sheet.getLastRow() === 0) {
      sheet.appendRow(['Timestamp', 'Name', 'Email', 'Source']);
    }
    var p = (e && e.parameter) ? e.parameter : {};
    sheet.appendRow([new Date(), p.name || '', p.email || '', p.source || '']);
    return ContentService
      .createTextOutput(JSON.stringify({ ok: true }))
      .setMimeType(ContentService.MimeType.JSON);
  } catch (err) {
    return ContentService
      .createTextOutput(JSON.stringify({ ok: false, error: String(err) }))
      .setMimeType(ContentService.MimeType.JSON);
  } finally {
    lock.releaseLock();
  }
}

// Optional: lets you open the /exec URL in a browser to confirm it's live.
function doGet() {
  return ContentService
    .createTextOutput('Kenri waitlist endpoint is running.')
    .setMimeType(ContentService.MimeType.TEXT);
}

// Optional: run this once from the editor to confirm rows are written.
function test() {
  doPost({ parameter: { name: 'Test Person', email: 'test@example.com', source: 'manual-test' } });
}
