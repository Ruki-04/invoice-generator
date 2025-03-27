export interface InvoiceDetails {
  invoiceNumber: string;
  date: string;
  company: {
    name: string;
    taxId: string;
    address: string;
  };
  worker: {
    name: string;
    id: string;
    address: string;
  };
  items: {
    client: string;
    description: string;
    units: number;
    pricePerUnit: number;
    total: number;
    isHourly: boolean;
    manualTotal: boolean;
  }[];
  paymentMethod: string;
  bankAccount: string;
  additionalNote: string;
  total: number;
  totalUnits?: number;
  workingDays?: number;
  attendedDays?: number;
  dailyHours?: number;
  monthlyPayment?: number;
  hourlyPayment?: number;
  finalPayment?: number;
  useSalaryCalculation?: boolean;
}
