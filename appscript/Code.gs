function doGet(e) {
  return handleRequest(e, 'GET');
}

function doPost(e) {
  return handleRequest(e, 'POST');
}

function handleRequest(e, method) {
  try {
    let payload = {};
    if (method === 'POST' && e.postData && e.postData.contents) {
      payload = JSON.parse(e.postData.contents);
    } else if (method === 'GET' && e.parameter) {
      payload = e.parameter;
    }

    const action = payload.action;

    if (!action) {
      return createJsonResponse({ error: 'No action specified' }, 400);
    }

    let result;
    switch (action) {
      case 'setup':
        result = handleSetup(payload);
        break;
      case 'load':
        result = handleLoad();
        break;
      case 'save':
        result = handleSave(payload);
        break;
      case 'emergencyAccess':
        result = handleEmergencyAccess(payload);
        break;
      default:
        return createJsonResponse({ error: 'Unknown action: ' + action }, 400);
    }

    return createJsonResponse(result, 200);

  } catch (error) {
    return createJsonResponse({ error: error.toString() }, 500);
  }
}

function createJsonResponse(data, statusCode) {
  const output = ContentService.createTextOutput(JSON.stringify(data));
  output.setMimeType(ContentService.MimeType.JSON);
  return output;
}

// Action Handlers

const HEADERS = ['contactHash', 'adminHash', 'vaultHash', 'testamentHash', 'email', 'contacts', 'vault', 'testament'];

function getSheet() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  let sheet = ss.getSheetByName('Data');
  if (!sheet) {
    sheet = ss.insertSheet('Data');
  }
  return sheet;
}

function handleSetup(payload) {
  const sheet = getSheet();

  // Clear any existing data
  sheet.clear();

  // Write headers
  sheet.getRange(1, 1, 1, HEADERS.length).setValues([HEADERS]);

  // Prepare row 2 values
  const rowData = HEADERS.map(header => payload[header] || '');

  // Write row 2
  sheet.getRange(2, 1, 1, HEADERS.length).setValues([rowData]);

  return { success: true, message: 'Setup completed successfully' };
}

function handleLoad() {
  const sheet = getSheet();

  // Get headers and data
  const headersRange = sheet.getRange(1, 1, 1, HEADERS.length).getValues()[0];
  const dataRange = sheet.getRange(2, 1, 1, HEADERS.length).getValues()[0];

  const result = {};
  for (let i = 0; i < HEADERS.length; i++) {
    result[HEADERS[i]] = dataRange[i] || null;
  }

  return result;
}

function handleSave(payload) {
  const sheet = getSheet();
  const dataToSave = payload.data;

  if (!dataToSave) {
    throw new Error('No data provided in payload.data');
  }

  // Get existing data to only update provided fields
  const currentData = handleLoad();

  const rowData = HEADERS.map((header, index) => {
    // If the data payload contains this field, update it; otherwise, keep existing
    if (dataToSave.hasOwnProperty(header)) {
      return dataToSave[header];
    }
    return currentData[header] || '';
  });

  sheet.getRange(2, 1, 1, HEADERS.length).setValues([rowData]);

  return { success: true, message: 'Data saved successfully' };
}

function handleEmergencyAccess(payload) {
  const { name, section, timestamp } = payload;

  if (!name || !section || !timestamp) {
    throw new Error('Missing name, section, or timestamp for emergency access');
  }

  // Read email from sheet
  const currentData = handleLoad();
  const email = currentData.email;

  if (!email) {
    throw new Error('No emergency email configured');
  }

  const subject = `[URGENCE] Acces a votre ${section}`;
  const body = `Bonjour,

Ceci est une alerte automatique.

La personne nommee "${name}" a accede a votre section "${section}" a la date et heure suivante : ${new Date(timestamp).toLocaleString('fr-FR')}.

Si vous n'etes pas a l'origine de cette action ou si vous ne connaissez pas cette personne, veuillez verifier la securite de votre application.

Cordialement,
L'application Contacts d'Urgence Chiffres`;

  try {
    MailApp.sendEmail({
      to: email,
      subject: subject,
      body: body
    });
  } catch (error) {
    // Log error but don't fail, maybe email quota exceeded
    console.error('Failed to send email:', error);
    throw new Error('Failed to send email alert: ' + error.toString());
  }

  return { success: true, message: 'Emergency access logged and email sent' };
}
