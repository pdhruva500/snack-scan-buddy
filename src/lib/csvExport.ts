const UTF8_BOM = "\uFEFF";

const MOJIBAKE_REPLACEMENTS: Array<[RegExp, string]> = [
  [/\u00e2\u20ac\u2122/g, "\u2019"],
  [/\u00e2\u20ac\u02dc/g, "\u2018"],
  [/\u00e2\u20ac\u0153/g, "\u201c"],
  [/\u00e2\u20ac\u009d/g, "\u201d"],
  [/\u00e2\u20ac\u00a6/g, "\u2026"],
  [/\u00e2\u20ac\u201c/g, "\u2013"],
  [/\u00e2\u20ac\u201d/g, "\u2014"],
  [/\u00c2\u00a0/g, " "],
  [/\u00c2/g, ""],
];

export const repairMojibake = (value: string): string =>
  MOJIBAKE_REPLACEMENTS.reduce((text, [pattern, replacement]) => text.replace(pattern, replacement), value);

export const formatLogsExportDate = (date: Date = new Date()): string =>
  date
    .toLocaleDateString("en-US", {
      weekday: "long",
      month: "long",
      day: "numeric",
    })
    .replace(",", "");

export const getLogsExportFilename = (date: Date = new Date()): string => `${formatLogsExportDate(date)} Logs.csv`;

const escapeCsvCell = (cell: unknown): string => {
  const cleaned = repairMojibake(String(cell ?? "")).replace(/\r?\n/g, " ");
  return `"${cleaned.replace(/"/g, '""')}"`;
};

export const buildCsv = (headers: string[], rows: unknown[][]): string =>
  [headers, ...rows].map((row) => row.map(escapeCsvCell).join(",")).join("\r\n");

export const padCsvHeaders = (headers: string[], minWidths: number[]): string[] =>
  headers.map((header, index) => header.padEnd(minWidths[index] ?? header.length, " "));

export const downloadCsv = (csvContent: string, filename: string = getLogsExportFilename()): void => {
  const blob = new Blob([UTF8_BOM, csvContent], { type: "text/csv;charset=utf-8" });
  const url = window.URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  window.URL.revokeObjectURL(url);
};
