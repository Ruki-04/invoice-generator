import { Card, CardContent, CardTitle } from "@/components/ui/card"
import type { InvoiceDetails } from "../types/invoice"

interface InvoicePreviewProps {
  invoice: InvoiceDetails
}

export function InvoicePreview({ invoice }: InvoicePreviewProps) {
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

  return (
    <div className="space-y-2">
      <CardTitle className="text-2xl font-semibold text-gray-700 mb-4">Previsualización</CardTitle>
      <Card className="bg-white print:shadow-none">
        <CardContent className="p-12">
          <div className="space-y-8">
            {/* Header Section */}
            <div className="text-right space-y-2">
              <div className="text-2xl font-light tracking-tight">Factura: {invoice.invoiceNumber}</div>
              <div className="text-lg text-gray-600">Fecha: {formatDate(invoice.date)}</div>
              <div className="mt-6">
                <div className="text-xl font-medium">{invoice.company.name}</div>
                <div className="text-gray-600">NIF: {invoice.company.taxId}</div>
                <div className="text-gray-600 whitespace-pre-line">{invoice.company.address}</div>
              </div>
            </div>

            {/* Worker Details */}
            <div className="mt-16">
              <div className="text-xl font-medium">{invoice.worker.name}</div>
              <div className="text-gray-600">{invoice.worker.id}</div>
              <div className="text-gray-600 whitespace-pre-line">{invoice.worker.address}</div>
            </div>

            {/* Items Table */}
            <div className="mt-12">
              <div className="border rounded-lg overflow-hidden">
                <table className="w-full">
                  <thead>
                    <tr className="bg-gray-50 border-b">
                      <th className="px-6 py-4 text-left text-base font-medium text-gray-900">Cliente</th>
                      <th className="px-6 py-4 text-left text-base font-medium text-gray-900">Proyecto</th>
                      <th className="px-6 py-4 text-right text-base font-medium text-gray-900">Unidades</th>
                      <th className="px-6 py-4 text-right text-base font-medium text-gray-900">Precio/h</th>
                      <th className="px-6 py-4 text-right text-base font-medium text-gray-900">Total</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {invoice.items.map((item, index) => {
                      // Mostrar precio por hora solo si existe
                      const pricePerHour = item.pricePerUnit > 0 ? `${item.pricePerUnit.toFixed(2)}€` : "-"

                      // Calcular total solo si ambos valores existen
                      const itemTotal =
                        item.units > 0 && item.pricePerUnit > 0
                          ? `${(item.units * item.pricePerUnit).toFixed(2)}€`
                          : "-"

                      return (
                        <tr key={index} className="hover:bg-gray-50 transition-colors">
                          <td className="px-6 py-4 text-base">{item.client || "-"}</td>
                          <td className="px-6 py-4 text-base">{item.description || "-"}</td>
                          <td className="px-6 py-4 text-base text-right">
                            {item.units > 0 ? `${item.units}${item.isHourly ? "h" : ""}` : "-"}
                          </td>
                          <td className="px-6 py-4 text-base text-right">{pricePerHour}</td>
                          <td className="px-6 py-4 text-base text-right">{itemTotal}</td>
                        </tr>
                      )
                    })}
                  </tbody>
                  <tfoot>
                    <tr className="bg-gray-50 border-t">
                      <td className="px-6 py-4 text-base font-medium text-left">TOTAL</td>
                      <td></td>
                      <td className="px-6 py-4 text-base font-medium text-right">
                        {invoice.totalUnits && invoice.totalUnits > 0
                          ? `${invoice.totalUnits}${invoice.items[0]?.isHourly ? "h" : ""}`
                          : "-"}
                      </td>
                      <td className="px-6 py-4 text-base font-medium text-right">{invoice.hourlyPayment} €</td>
                      <td className="px-6 py-4 text-base font-medium text-right">{invoice.total.toFixed(2)} €</td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            </div>

            {/* Payment Details */}
            <div className="mt-12 space-y-3 text-base">
              <div className="flex items-baseline gap-2">
                <span className="font-semibold">Forma de pago:</span>
                <span>{invoice.paymentMethod}</span>
              </div>
              {invoice.paymentMethod === "Transferencia" && (
                <div>
                  <span className="font-semibold">Cuenta bancaria:</span>
                  <div className="font-mono mt-1">{invoice.bankAccount}</div>
                </div>
              )}
              {invoice.additionalNote && (
                <div className="mt-4 text-gray-600 whitespace-pre-line">{invoice.additionalNote}</div>
              )}
            </div>

            {/* Total at Bottom */}
            <div className="mt-12 text-right">
              <div className="text-2xl font-medium">Total a pagar: {invoice.total.toFixed(2)} €</div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
