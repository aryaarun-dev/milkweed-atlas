const SOURCE_TAB = 'Form Responses 1';
const SOURCE_GID = 242823859;
const HEADERS = [
  'Timestamp', 'Where is the garden?', 'Date ?', 'Time ?',
  'Is the plant getting enough sunlight?',
  'Do you see any chrysalis, caterpillars, or butterflies?',
  'How many chrysalis/caterpillars, or butterflies do you see ? Put N/A if you answered no to previous question',
  'How does the soil feel?', 'How does the plants look?', 'Does the garden need care?',
  'Are there any problem in the garden?', 'How urgent is the problem?'
];
const GARDENS = [
  { id: 'MG-001', name: 'TMSA Apex', lat: 35.7327, lng: -78.8503, approximate: true },
  { id: 'MG-002', name: 'TMSA Triangle High School' },
  { id: 'MG-003', name: 'TMSA Triangle Cary' },
  { id: 'MG-004', name: 'TMSA Triangle Durham' },
  { id: 'MG-005', name: 'TMSA Triad Greensboro Elementary', aliases: ['TMSA Triad Greensboro Elemntary'] },
  { id: 'MG-006', name: 'TMSA Triad Greensboro Secondary' },
  { id: 'MG-007', name: 'TMSA Triad McLeansville' },
  { id: 'MG-008', name: 'TMSA Charlotte Elementary' },
  { id: 'MG-009', name: 'TMSA Charlotte Secondary' },
  { id: 'MG-010', name: 'TMSA Concord Elementary' }
];
const CHOICES = {
  sunlight: { yes: 'Enough sunlight', no: 'Insufficient sunlight', 'not sure': 'Unsure' },
  sighting: { butterflies: 'Butterflies', caterpillars: 'Caterpillars', chrysalis: 'Chrysalis', "i can't see": 'Unsure', no: 'None seen' },
  soil: { dry: 'Dry', moist: 'Moist', wet: 'Wet', "don't know": 'Unsure' },
  plants: { healthy: 'Healthy', 'needs attention': 'Needs attention', 'not tested': 'Not tested' },
  care: {
    no: 'No care needed', 'yes, needs water': 'Needs water',
    'yes, needs the weeds to be remove': 'Needs weeding',
    'yes to many animals are getting in.': 'Animal activity'
  },
  urgency: {
    'not an immediate problem': 'Low urgency', 'needs attention': 'Needs attention',
    'very urgent': 'Very urgent', 'there was no problem': 'No problem'
  }
};

// Run once from Extensions → Apps Script in the linked spreadsheet.
function setupAtlas() {
  const book = SpreadsheetApp.getActiveSpreadsheet();
  responseSheet_(book);
  PropertiesService.getScriptProperties().setProperty('ATLAS_SPREADSHEET_ID', book.getId());
}

function responseSheet_(book) {
  const sheet = book.getSheetByName(SOURCE_TAB);
  if (!sheet || sheet.getSheetId() !== SOURCE_GID) throw new Error('Response tab mismatch.');
  const headers = sheet.getRange(1, 1, 1, HEADERS.length).getDisplayValues()[0];
  if (!HEADERS.every((header, i) => header === headers[i].trim())) {
    throw new Error('Form headers changed. Update HEADERS and the response mapping before publishing.');
  }
  return sheet;
}

function normalize_(value) {
  return String(value ?? '').trim().toLowerCase().replace(/\s+/g, ' ').replace(/’/g, "'");
}

function project_(row, timezone) {
  const location = normalize_(row[1]);
  const garden = GARDENS.find(item => [item.name, ...(item.aliases || [])]
    .some(name => normalize_(name) === location));
  if (!garden || !(row[0] instanceof Date) || !(row[2] instanceof Date) ||
      !Number.isFinite(+row[0]) || !Number.isFinite(+row[2])) return null;

  const report = { gardenId: garden.id, date: Utilities.formatDate(row[2], timezone, 'yyyy-MM-dd') };
  const columns = { sunlight: 4, sighting: 5, soil: 7, plants: 8, care: 9, urgency: 11 };
  for (const [field, index] of Object.entries(columns)) {
    const value = normalize_(row[index]);
    if (Object.prototype.hasOwnProperty.call(CHOICES[field], value)) report[field] = CHOICES[field][value];
  }
  const count = String(row[6]).trim();
  if (['Butterflies', 'Caterpillars', 'Chrysalis'].includes(report.sighting) && /^\d{1,3}$/.test(count)) {
    report.count = Number(count);
  }
  return report;
}

function doGet(event) {
  let payload;
  try {
    const book = SpreadsheetApp.openById(PropertiesService.getScriptProperties().getProperty('ATLAS_SPREADSHEET_ID'));
    const source = responseSheet_(book);
    const count = source.getLastRow() - 1;
    const timezone = book.getSpreadsheetTimeZone();
    const reports = [];
    if (count) {
      for (const row of source.getRange(2, 1, count, HEADERS.length).getValues()) {
        const report = project_(row, timezone);
        if (report) reports.push(report);
      }
    }
    reports.sort((a, b) => b.date.localeCompare(a.date));
    const gardens = GARDENS.map(({ id, name, lat, lng, approximate }) => ({ id, name, lat, lng, approximate }));
    payload = { ok: true, gardens, reports };
  } catch (error) {
    payload = { ok: false, error: 'The observation feed is temporarily unavailable.' };
  }
  const json = JSON.stringify(payload);
  const params = event && event.parameter;
  if (params && params.format === 'jsonp' && /^\d{13}$/.test(params.request)) {
    return ContentService.createTextOutput(
      'window.milkweedAtlasFeed?.(' + JSON.stringify(params.request) + ',' + json + ');'
    )
      .setMimeType(ContentService.MimeType.JAVASCRIPT);
  }
  return ContentService.createTextOutput(json).setMimeType(ContentService.MimeType.JSON);
}
