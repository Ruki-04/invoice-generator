"use client"

import { Button } from "@/components/ui/button"
import { Download } from "lucide-react"
import { jsPDF } from "jspdf"
import type { InvoiceDetails } from "../types/invoice"

interface PDFButtonProps {
  invoice: InvoiceDetails
}

export function PDFButton({ invoice }: PDFButtonProps) {
  const formatDate = (dateString: string): string => {
    if (!dateString) return ""
    const date = new Date(dateString)
    return date
      .toLocaleDateString("es-ES", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
      })
      .replace(/\//g, "-")
  }

  const generatePDF = () => {
    const doc = new jsPDF()
    // Configuración global de fuentes
    doc.setFont("helvetica", "normal")
    doc.setFontSize(10) // Tamaño de letra más pequeño por defecto

    // Márgenes y dimensiones
    const margin = 20
    const pageWidth = doc.internal.pageSize.width
    const contentWidth = pageWidth - margin * 2

    // Header section
    doc.setFontSize(12)
    doc.setFont("helvetica", "bold")
    doc.text(`Factura: ${invoice.invoiceNumber}`, pageWidth - margin, margin, {
      align: "right",
    })
    doc.setFontSize(10)
    doc.setFont("helvetica", "normal")
    doc.text(`Fecha: ${formatDate(invoice.date)}`, pageWidth - margin, margin + 7, { align: "right" })

    // Company details (right aligned)
    doc.setFontSize(11)
    doc.setFont("helvetica", "bold")
    doc.text(invoice.company.name, pageWidth - margin, margin + 20, {
      align: "right",
    })
    doc.setFontSize(10)
    doc.setFont("helvetica", "normal")
    doc.text(`NIF: ${invoice.company.taxId}`, pageWidth - margin, margin + 27, {
      align: "right",
    })

    // Handle multiline company address
    const companyAddressLines = doc.splitTextToSize(invoice.company.address, 80)
    companyAddressLines.forEach((line: string, index: number) => {
      doc.text(line, pageWidth - margin, margin + 34 + index * 5, {
        align: "right",
      })
    })

    // Worker details (left aligned)
    const workerY = margin + 60
    doc.setFontSize(11)
    doc.setFont("helvetica", "bold")
    doc.text(invoice.worker.name, margin, workerY)
    doc.setFontSize(10)
    doc.setFont("helvetica", "normal")
    doc.text(invoice.worker.id, margin, workerY + 7)

    // Handle multiline worker address
    const workerAddressLines = doc.splitTextToSize(invoice.worker.address, 80)
    workerAddressLines.forEach((line: string, index: number) => {
      doc.text(line, margin, workerY + 14 + index * 5)
    })

    // Table headers
    const tableY = workerY + 40
    const colWidth = contentWidth / 5 // 5 columnas de igual ancho

    // Encabezado de tabla
    doc.setFillColor(247, 248, 249)
    doc.rect(margin, tableY - 5, contentWidth, 10, "F")
    doc.setFont("helvetica", "bold")
    doc.setFontSize(10)

    // Posiciones de las columnas
    const col1 = margin
    const col2 = margin + colWidth
    const col3 = margin + colWidth * 2
    const col4 = margin + colWidth * 3
    const col5 = margin + colWidth * 4

    doc.text("Cliente", col1 + 2, tableY)
    doc.text("Proyecto", col2 + 2, tableY)
    doc.text("Unidades", col3 + colWidth - 5, tableY, { align: "right" })
    doc.text("Precio/h", col4 + colWidth - 5, tableY, { align: "right" })
    doc.text("Total", col5 + colWidth - 5, tableY, { align: "right" })

    // Table content
    doc.setFont("helvetica", "normal")
    let y = tableY + 10
    invoice.items.forEach((item, index) => {
      const units = item.units > 0 ? (item.isHourly ? `${item.units}h` : item.units.toString()) : "-"

      // Mostrar precio por hora solo si existe
      const pricePerHour = item.pricePerUnit > 0 ? `${item.pricePerUnit.toFixed(2)}€` : "-"

      // Calcular total solo si ambos valores existen
      const itemTotal =
        item.units > 0 && item.pricePerUnit > 0 ? `${(item.units * item.pricePerUnit).toFixed(2)}€` : "-"

      // Add zebra striping
      if (index % 2 === 0) {
        doc.setFillColor(252, 252, 253)
        doc.rect(margin, y - 5, contentWidth, 10, "F")
      }

      doc.text(item.client || "-", col1 + 2, y)
      doc.text(item.description || "-", col2 + 2, y)
      doc.text(units, col3 + colWidth - 5, y, { align: "right" })
      doc.text(pricePerHour, col4 + colWidth - 5, y, { align: "right" })
      doc.text(itemTotal, col5 + colWidth - 5, y, { align: "right" })

      y += 10
    })

    // Total
    doc.setFillColor(247, 248, 249)
    doc.rect(margin, y - 5, contentWidth, 10, "F")
    doc.setFont("helvetica", "bold")
    doc.text("TOTAL:", col1 + 2, y)
    doc.text(
      invoice.totalUnits && invoice.totalUnits > 0
        ? `${invoice.totalUnits}${invoice.items[0]?.isHourly ? "h" : ""}`
        : "-",
      col3 + colWidth - 5,
      y,
      { align: "right" },
    )
    doc.text(
      invoice.hourlyPayment && invoice.hourlyPayment > 0 ? `${invoice.hourlyPayment.toFixed(2)}€` : "-",
      col4 + colWidth - 5,
      y,
      { align: "right" },
    )
    doc.text(`${invoice.total.toFixed(2)}€`, col5 + colWidth - 5, y, {
      align: "right",
    })

    // Payment details
    y += 20
    doc.setFont("helvetica", "bold")
    doc.text("Forma de pago:", margin, y)
    doc.setFont("helvetica", "normal")
    doc.text(invoice.paymentMethod, margin + 35, y)

    if (invoice.paymentMethod === "Transferencia") {
      y += 7
      doc.setFont("helvetica", "bold")
      doc.text("Cuenta bancaria:", margin, y)
      doc.setFont("helvetica", "normal")
      doc.text(invoice.bankAccount, margin + 35, y)
      y += 7
    }

    // Additional note if present
    if (invoice.additionalNote) {
      y += 10
      doc.setFont("helvetica", "normal")
      const noteLines = doc.splitTextToSize(invoice.additionalNote, contentWidth)
      noteLines.forEach((line: string, index: number) => {
        doc.text(line, margin, y + index * 5)
      })
    }

    // Total at bottom
    doc.setFont("helvetica", "bold")
    doc.setFontSize(12)
    doc.text(`Total a pagar: ${invoice.total.toFixed(2)} €`, pageWidth - margin, 270, {
      align: "right",
    })

    doc.save(`factura-${invoice.invoiceNumber}.pdf`)
  }

  return (
    <Button onClick={generatePDF} className="w-full bg-black hover:bg-gray-800 text-white">
      <Download className="w-4 h-4 mr-2" />
      Descargar PDF
    </Button>
  )
}
