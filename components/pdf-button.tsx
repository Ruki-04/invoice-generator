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
    doc.setFont("helvetica", "normal")
    doc.setFontSize(10)

    const margin = 20
    const pageWidth = doc.internal.pageSize.width
    const contentWidth = pageWidth - margin * 2

    const showPricePerUnit = !invoice.useSalaryCalculation
    const columnCount = showPricePerUnit ? 5 : 4
    const colWidth = contentWidth / columnCount

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

    const workerAddressLines = doc.splitTextToSize(invoice.worker.address, 80)
    workerAddressLines.forEach((line: string, index: number) => {
      doc.text(line, margin, workerY + 14 + index * 5)
    })

    // Table headers
    const tableY = workerY + 40

    doc.setFillColor(247, 248, 249)
    doc.rect(margin, tableY - 5, contentWidth, 10, "F")
    doc.setFont("helvetica", "bold")
    doc.setFontSize(10)

    const colClient = margin
    const colProject = margin + colWidth
    const colUnits = margin + colWidth * 2
    const colPrice = showPricePerUnit ? margin + colWidth * 3 : null
    const colTotal = margin + colWidth * (columnCount - 1)

    doc.text("Cliente", colClient + 2, tableY)
    doc.text("Proyecto", colProject + 2, tableY)
    doc.text("Unidades", colUnits + colWidth - 5, tableY, { align: "right" })
    if (colPrice !== null) {
      doc.text("Precio/h", colPrice + colWidth - 5, tableY, { align: "right" })
    }
    doc.text("Total", colTotal + colWidth - 5, tableY, { align: "right" })

    // Table content
    doc.setFont("helvetica", "normal")
    let y = tableY + 10
    invoice.items.forEach((item, index) => {
      const units = item.units > 0 ? (item.isHourly ? `${item.units}h` : item.units.toString()) : "-"
      const pricePerHour = item.pricePerUnit > 0 ? `${item.pricePerUnit.toFixed(2)}€` : "-"
      const itemTotal =
        item.total > 0
          ? `${item.total.toFixed(2)}€`
          : item.units > 0 && item.pricePerUnit > 0
            ? `${(item.units * item.pricePerUnit).toFixed(2)}€`
            : "-"

      if (index % 2 === 0) {
        doc.setFillColor(252, 252, 253)
        doc.rect(margin, y - 5, contentWidth, 10, "F")
      }

      doc.text(item.client || "-", colClient + 2, y)
      doc.text(item.description || "-", colProject + 2, y)
      doc.text(units, colUnits + colWidth - 5, y, { align: "right" })
      if (colPrice !== null) {
        doc.text(pricePerHour, colPrice + colWidth - 5, y, { align: "right" })
      }
      doc.text(itemTotal, colTotal + colWidth - 5, y, { align: "right" })

      y += 10
    })

    // Total
    doc.setFillColor(247, 248, 249)
    doc.rect(margin, y - 5, contentWidth, 10, "F")
    doc.setFont("helvetica", "bold")
    doc.text("TOTAL:", colClient + 2, y)
    doc.text(
      invoice.totalUnits && invoice.totalUnits > 0
        ? `${invoice.totalUnits}${invoice.items[0]?.isHourly ? "h" : ""}`
        : "-",
      colUnits + colWidth - 5,
      y,
      { align: "right" },
    )
    if (colPrice !== null) {
      doc.text(
        invoice.hourlyPayment && invoice.hourlyPayment > 0 ? `${invoice.hourlyPayment.toFixed(2)}€` : "-",
        colPrice + colWidth - 5,
        y,
        { align: "right" },
      )
    }
    doc.text(`${invoice.total.toFixed(2)}€`, colTotal + colWidth - 5, y, {
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

    if (invoice.additionalNote) {
      y += 10
      doc.setFont("helvetica", "normal")
      const noteLines = doc.splitTextToSize(invoice.additionalNote, contentWidth)
      noteLines.forEach((line: string, index: number) => {
        doc.text(line, margin, y + index * 5)
      })
    }

    doc.setFont("helvetica", "bold")
    doc.setFontSize(12)
    doc.text(`Total a pagar: ${invoice.total.toFixed(2)} €`, pageWidth - margin, 270, {
      align: "right",
    })

    const buildFileName = () => {
      const parts = (invoice.worker.name || "").trim().split(/\s+/).filter(Boolean)
      const firstName = (parts[0] ?? "").toUpperCase()
      const firstSurname = (parts[1] ?? "").toUpperCase()
      const date = invoice.date ? new Date(invoice.date) : new Date()
      const month = date
        .toLocaleDateString("es-ES", { month: "long" })
        .toUpperCase()
      const year = date.getFullYear()
      const segments = ["FACTURA", firstName, firstSurname, month, year]
        .filter(Boolean)
        .join(" ")
      return `${segments}.pdf`
    }

    doc.save(buildFileName())
  }

  return (
    <Button onClick={generatePDF} className="w-full bg-black hover:bg-gray-800 text-white">
      <Download className="w-4 h-4 mr-2" />
      Descargar PDF
    </Button>
  )
}
