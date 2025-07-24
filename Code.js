const SHEET_ID = "1fVq4tRVSyk6Dd-NgucS5fbwmwD2RihJon0WKmYhk678";
const SHEET_NAME = "database";
const ROOT_FOLDER_ID = "1jQMdBRA3QSLEqH458CU9mXF0_uR8Msjf"; // Родительская папка на Google Диске

function doGet() {
  return HtmlService.createHtmlOutputFromFile("index").addMetaTag(
    "viewport",
    "width=device-width, initial-scale=1"
  );
}

function submitForm(data) {
  const sheet = SpreadsheetApp.openById(SHEET_ID).getSheetByName(SHEET_NAME);

  const headers = [
    "Full Name",
    "Nationality",
    "Date of Birth",
    "Place of Birth",
    "Has E-residency",
    "Passport Number",
    "Passport Issue",
    "Passport Expiry",
    "E-residency ID",
    "Residential Address",
    "Email",
    "Phone",
    "Occupation",
    "Company Name",
    "Background",
    "Proposed Company Names",
    "Company Email",
    "Business Activities",
    "Client Countries",
    "Has EU Clients",
    "Expected Annual Turnover",
    "Monthly Invoices",
    "Sole Owner?",
    "Other Shareholders",
    "Source of Funds",
    "Purpose in Estonia",
    "PEP Status",
    "Sanctions Status",
    "Timestamp",
  ];

  if (sheet.getLastRow() === 0) {
    sheet.appendRow(headers);
  }

  const row = [
    data.fullName || "",
    data.nationality || "",
    data.dob || "",
    data.birthPlace || "",
    data.hasEResidency || "",
    data.passportNumber || "",
    data.passportIssue || "",
    data.passportExpiry || "",
    data.eresidencyID || "",
    data.residentialAddress || "",
    data.email || "",
    data.phone || "",
    data.occupation || "",
    data.companyName || "",
    data.background || "",
    data.companyNames || "",
    data.companyEmail || "",
    data.businessActivities || "",
    data.customerCountries || "",
    data.hasEUClients || "",
    data.annualTurnover || "",
    data.monthlyInvoices || "",
    data.soleOwner || "",
    data.otherShareholders || "",
    data.sourceOfFunds || "",
    data.purpose || "",
    data.isPEP || "",
    data.sanctions || "",
    new Date(),
  ];

  sheet.appendRow(row);

  // 🗂 Создаём папку
  const rootFolder = DriveApp.getFolderById(ROOT_FOLDER_ID);
  const timestamp = new Date().toISOString().split("T")[0];
  const folderName = `${data.fullName}_${timestamp}`;
  const newFolder = rootFolder.createFolder(folderName);

  // 📝 Создаём PDF
  const html = HtmlService.createTemplateFromFile("pdf-template");
  html.data = data;

  const htmlOutput = html.evaluate().getContent();
  const blob = Utilities.newBlob(htmlOutput, "text/html", "form.html");
  const pdf = blob.getAs("application/pdf").setName("Questionnaire.pdf");
  newFolder.createFile(pdf);

  // 📩 Составляем текст письма
  const messageText = Object.keys(data)
    .map((key) => `${key.replace(/([A-Z])/g, " $1")}: ${data[key]}`)
    .join("\n");

  // 📧 Email админу
  MailApp.sendEmail({
    to: "natalyabogdanovanatalya@gmail.com",
    subject: `📝 New Questionnaire: ${data.fullName}`,
    body: `A new client has submitted the questionnaire:\n\n${messageText}`,
  });

  return newFolder.getId(); // Возвращаем ID для загрузки файлов
}

function uploadFiles(folderId, base64Files) {
  if (!folderId) {
    throw new Error("❌ Folder ID not provided");
  }

  if (!base64Files || base64Files.length === 0) {
    throw new Error("❌ No files provided");
  }

  const folder = DriveApp.getFolderById(folderId);
  const urls = [];

  base64Files.forEach((file, index) => {
    try {
      if (!file || !file.content || !file.mimeType || !file.filename) {
        throw new Error(`Invalid file data at index ${index}`);
      }

      const blob = Utilities.newBlob(
        Utilities.base64Decode(file.content),
        file.mimeType,
        file.filename
      );

      const createdFile = folder.createFile(blob);
      createdFile.setSharing(
        DriveApp.Access.ANYONE_WITH_LINK,
        DriveApp.Permission.VIEW
      );

      urls.push(createdFile.getUrl());
    } catch (e) {
      throw new Error(
        `❌ Failed to upload file "${file?.filename || "unknown"}": ${
          e.message
        }`
      );
    }
  });

  return urls;
}
