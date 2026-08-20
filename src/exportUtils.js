// Export data to CSV file
export function exportToCSV(data, filename) {
  if (!data || data.length === 0) {
    alert("No data to export");
    return;
  }

  // Get all keys from the first object
  const keys = Object.keys(data[0]);

  // Create CSV header
  const csvHeader = keys.map(key => `"${key}"`).join(",");

  // Create CSV rows
  const csvRows = data.map(row => {
    return keys.map(key => {
      const value = row[key];
      // Handle null/undefined
      if (value === null || value === undefined) {
        return '""';
      }
      // Handle objects (like nested user object)
      if (typeof value === "object") {
        return `"${JSON.stringify(value)}"`;
      }
      // Escape quotes and wrap in quotes
      return `"${String(value).replace(/"/g, '""')}"`;
    }).join(",");
  });

  // Combine header and rows
  const csv = [csvHeader, ...csvRows].join("\n");

  // Create blob and download
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const link = document.createElement("a");
  const url = URL.createObjectURL(blob);

  link.setAttribute("href", url);
  link.setAttribute("download", `${filename}_${new Date().toISOString().split('T')[0]}.csv`);
  link.style.visibility = "hidden";

  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}
