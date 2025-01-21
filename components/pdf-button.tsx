"use client";

import { Button } from "@/components/ui/button";
import { Download } from "lucide-react";
import { jsPDF } from "jspdf";
import type { InvoiceDetails } from "../types/invoice";

interface PDFButtonProps {
  invoice: InvoiceDetails;
}

export function PDFButton({ invoice }: PDFButtonProps) {
  const generatePDF = () => {
    const doc = new jsPDF();

    // Set font styles
    doc.setFont("helvetica", "normal");

    // Header section
    doc.setFontSize(14);
    doc.text(`Factura: ${invoice.invoiceNumber}`, 190, 20, { align: "right" });
    doc.setFontSize(12);
    doc.text(`Fecha: ${invoice.date}`, 190, 30, { align: "right" });

    // Company details (right aligned)
    doc.setFontSize(13);
    doc.setFont("helvetica", "bold");
    doc.text(invoice.company.name, 190, 45, { align: "right" });
    doc.setFontSize(12);
    doc.setFont("helvetica", "normal");
    doc.text(`NIF: ${invoice.company.taxId}`, 190, 52, { align: "right" });

    // Handle multiline company address
    const companyAddressLines = doc.splitTextToSize(
      invoice.company.address,
      80
    );
    companyAddressLines.forEach((line: string, index: number) => {
      doc.text(line, 190, 59 + index * 7, { align: "right" });
    });

    // Worker details (left aligned)
    const workerY = 95;
    doc.setFontSize(13);
    doc.setFont("helvetica", "bold");
    doc.text(invoice.worker.name, 20, workerY);
    doc.setFontSize(12);
    doc.setFont("helvetica", "normal");
    doc.text(invoice.worker.id, 20, workerY + 7);

    // Handle multiline worker address
    const workerAddressLines = doc.splitTextToSize(invoice.worker.address, 80);
    workerAddressLines.forEach((line: string, index: number) => {
      doc.text(line, 20, workerY + 14 + index * 7);
    });

    // Table headers
    const tableY = workerY + 45;
    doc.setFillColor(247, 248, 249);
    doc.rect(20, tableY - 6, 170, 12, "F");
    doc.setFont("helvetica", "bold");
    doc.setFontSize(12);
    doc.text("Descripción", 22, tableY);
    doc.text("Unidades", 120, tableY, { align: "right" });
    doc.text("Precio/u", 150, tableY, { align: "right" });
    doc.text("Total", 188, tableY, { align: "right" });

    // Table content
    doc.setFont("helvetica", "normal");
    let y = tableY + 12;
    invoice.items.forEach((item, index) => {
      const units = item.isHourly ? `${item.units}h` : item.units.toString();

      // Add zebra striping
      if (index % 2 === 0) {
        doc.setFillColor(252, 252, 253);
        doc.rect(20, y - 6, 170, 12, "F");
      }

      doc.text(item.description, 22, y);
      doc.text(units, 120, y, { align: "right" });
      doc.text(
        item.pricePerUnit != 0 ? `${item.pricePerUnit.toFixed(2)}€` : "",
        150,
        y,
        { align: "right" }
      );
      doc.text(`${item.total.toFixed(2)} €`, 188, y, { align: "right" });
      y += 12;
    });

    // Total
    doc.setFillColor(247, 248, 249);
    doc.rect(20, y - 6, 170, 12, "F");
    doc.setFont("helvetica", "bold");
    doc.text("TOTAL:", 150, y);
    doc.text(`${invoice.total.toFixed(2)} €`, 188, y, { align: "right" });

    // Payment details
    y += 20; // Adjust spacing before payment details
    doc.setFont("helvetica", "bold");
    doc.text("Forma de pago:", 20, y);
    doc.setFont("helvetica", "normal");
    doc.text(invoice.paymentMethod, 70, y);

    if (invoice.paymentMethod === "Transferencia") {
      y += 8; // Reduce space between lines
      doc.setFont("helvetica", "bold");
      doc.text("Cuenta bancaria:", 20, y);
      doc.setFont("courier", "normal");
      doc.text(invoice.bankAccount, 70, y);
      y += 8; // Reduce space after this line
    }

    // Additional note if present
    if (invoice.additionalNote) {
      y += 10; // Adjust spacing here too
      doc.setFont("helvetica", "normal");
      const noteLines = doc.splitTextToSize(invoice.additionalNote, 150);
      noteLines.forEach((line: string, index: number) => {
        doc.text(line, 20, y + index * 6); // Use smaller line spacing
      });
    }

    // Total at bottom
    doc.setFont("helvetica", "bold");
    doc.setFontSize(14);
    doc.text(`Total a pagar: ${invoice.total.toFixed(2)} €`, 190, 280, {
      align: "right",
    });

    doc.save(`factura-${invoice.invoiceNumber}.pdf`);
  };

  return (
    <Button
      onClick={generatePDF}
      className="w-full bg-black hover:bg-gray-800 text-white"
    >
      <Download className="w-4 h-4 mr-2" />
      Descargar PDF
    </Button>
  );
}
