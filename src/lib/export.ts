import { LedgerEntry } from "@/types/entry";

export function exportToCSV(entries: LedgerEntry[], filename = "ledger") {
  const headers = ["#", "Name", "Amount", "Status", "Notes"];
  const rows = entries.map((e, i) => [
    i + 1,
    `"${e.name}"`,
    e.amount,
    e.status,
    `"${(e.notes || "").replace(/"/g, '""')}"`,
  ]);
  const csv = [headers.join(","), ...rows.map((r) => r.join(","))].join("\n");
  download(csv, `${filename}.csv`, "text/csv");
}

export function exportToExcel(entries: LedgerEntry[], filename = "ledger") {
  const xml = `<?xml version="1.0"?>
<?mso-application progid="Excel.Sheet"?>
<Workbook xmlns="urn:schemas-microsoft-com:office:spreadsheet" xmlns:ss="urn:schemas-microsoft-com:office:spreadsheet">
<Worksheet ss:Name="Ledger"><Table>
<Row>
<Cell><Data ss:Type="String">#</Data></Cell>
<Cell><Data ss:Type="String">Name</Data></Cell>
<Cell><Data ss:Type="Number">Amount</Data></Cell>
<Cell><Data ss:Type="String">Status</Data></Cell>
<Cell><Data ss:Type="String">Notes</Data></Cell>
</Row>
${entries
  .map(
    (e, i) => `<Row>
<Cell><Data ss:Type="Number">${i + 1}</Data></Cell>
<Cell><Data ss:Type="String">${e.name}</Data></Cell>
<Cell><Data ss:Type="Number">${e.amount}</Data></Cell>
<Cell><Data ss:Type="String">${e.status}</Data></Cell>
<Cell><Data ss:Type="String">${e.notes || ""}</Data></Cell>
</Row>`
  )
  .join("\n")}
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
