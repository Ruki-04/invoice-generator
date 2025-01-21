export interface InvoiceDetails {
  invoiceNumber: string
  date: string
  company: {
    name: string
    taxId: string
    address: string
  }
  worker: {
    name: string
    id: string
    address: string
  }
  items: {
    description: string
    units: number
    pricePerUnit: number
    total: number
    isHourly: boolean
    manualTotal: boolean
  }[]
  paymentMethod: string
  bankAccount: string
  additionalNote: string
  total: number
}

