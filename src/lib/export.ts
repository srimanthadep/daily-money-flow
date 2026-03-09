import { FinancialEntry } from "@/types/entry";

export function exportToCSV(entries: FinancialEntry[], filename = "rotation-data") {
  const headers = ["Name", "Amount", "Category", "Date", "Notes"];
  const rows = entries.map(e => [e.name, e.amount.toString(), e.category, e.date, `"${e.notes.replace(/"/g, '""')}"`]);
  const csv = [headers.join(","), ...rows.map(r => r.join(","))].join("\n");
  download(csv, `${filename}.csv`, "text/csv");
}

export function exportToExcel(entries: FinancialEntry[], filename = "rotation-data") {
  // Simple XML spreadsheet format
  const xml = `<?xml version="1.0"?>
<?mso-application progid="Excel.Sheet"?>
<Workbook xmlns="urn:schemas-microsoft-com:office:spreadsheet" xmlns:ss="urn:schemas-microsoft-com:office:spreadsheet">
<Worksheet ss:Name="Entries"><Table>
<Row><Cell><Data ss:Type="String">Name</Data></Cell><Cell><Data ss:Type="String">Amount</Data></Cell><Cell><Data ss:Type="String">Category</Data></Cell><Cell><Data ss:Type="String">Date</Data></Cell><Cell><Data ss:Type="String">Notes</Data></Cell></Row>
${entries.map(e => `<Row><Cell><Data ss:Type="String">${e.name}</Data></Cell><Cell><Data ss:Type="Number">${e.amount}</Data></Cell><Cell><Data ss:Type="String">${e.category}</Data></Cell><Cell><Data ss:Type="String">${e.date}</Data></Cell><Cell><Data ss:Type="String">${e.notes}</Data></Cell></Row>`).join("\n")}
</Table></Worksheet></Workbook>`;
  download(xml, `${filename}.xls`, "application/vnd.ms-excel");
}

function download(content: string, filename: string, type: string) {
  const blob = new Blob([content], { type });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}
