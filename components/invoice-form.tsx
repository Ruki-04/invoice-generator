"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import type { InvoiceDetails } from "../types/invoice";
import { InvoicePreview } from "./invoice-preview";
import { PDFButton } from "./pdf-button";

export function InvoiceForm() {
  const [invoice, setInvoice] = useState<InvoiceDetails>({
    invoiceNumber: "",
    date: new Date().toISOString().split("T")[0],
    company: {
      name: "",
      taxId: "",
      address: "",
    },
    worker: {
      name: "",
      id: "",
      address: "",
    },
    items: [
      {
        client: "",
        description: "",
        units: 0,
        pricePerUnit: 0,
        total: 0,
        isHourly: true,
        manualTotal: false,
      },
    ],
    paymentMethod: "Transferencia",
    bankAccount: "",
    additionalNote: "",
    total: 0,
    totalUnits: 0,
    workingDays: 0,
    attendedDays: 0,
    dailyHours: 0,
    monthlyPayment: 0,
    hourlyPayment: 0,
    finalPayment: 0,
    useSalaryCalculation: false,
  });

  const updateItem = (
    index: number,
    field: keyof (typeof invoice.items)[0],
    value: string | number | boolean
  ) => {
    const newItems = [...invoice.items];
    newItems[index] = {
      ...newItems[index],
      [field]: value,
    };

    if (!newItems[index].manualTotal) {
      newItems[index].total =
        Number(newItems[index].units) * Number(newItems[index].pricePerUnit);
    }

    const totalAmount = newItems.reduce((sum, item) => sum + item.total, 0);
    const totalUnits = newItems.reduce(
      (sum, item) => sum + Number(item.units),
      0
    );

    // Solo actualizar el total y totalUnits si no estamos usando el cálculo de salario
    if (!invoice.useSalaryCalculation) {
      setInvoice({
        ...invoice,
        items: newItems,
        total: totalAmount,
        totalUnits: totalUnits,
      });
    } else {
      // Si estamos usando cálculo de salario, solo actualizamos los items
      setInvoice({
        ...invoice,
        items: newItems,
      });
    }
  };

  const addItem = () => {
    setInvoice({
      ...invoice,
      items: [
        ...invoice.items,
        {
          client: "",
          description: "",
          units: 0,
          pricePerUnit: 0,
          total: 0,
          isHourly: true,
          manualTotal: false,
        },
      ],
    });
  };

  const calculatePayments = (field: string, value: number) => {
    const newInvoice = { ...invoice };

    if (field === "workingDays") {
      newInvoice.workingDays = value;
    } else if (field === "attendedDays") {
      newInvoice.attendedDays = value;
    } else if (field === "dailyHours") {
      newInvoice.dailyHours = value;
    } else if (field === "monthlyPayment") {
      newInvoice.monthlyPayment = value;
      // Calculate hourly payment if we have working days and daily hours
      if (
        newInvoice.workingDays &&
        newInvoice.workingDays > 0 &&
        newInvoice.dailyHours &&
        newInvoice.dailyHours > 0
      ) {
        newInvoice.hourlyPayment =
          value / (newInvoice.workingDays * newInvoice.dailyHours);
      }
    } else if (field === "hourlyPayment") {
      newInvoice.hourlyPayment = value;
      // Calculate monthly payment if we have working days and daily hours
      if (
        newInvoice.workingDays &&
        newInvoice.workingDays > 0 &&
        newInvoice.dailyHours &&
        newInvoice.dailyHours > 0
      ) {
        newInvoice.monthlyPayment =
          value * newInvoice.workingDays * newInvoice.dailyHours;
      }
    }

    // Calculate final payment (deducting unattended days)
    if (
      newInvoice.workingDays &&
      newInvoice.workingDays > 0 &&
      newInvoice.hourlyPayment &&
      newInvoice.hourlyPayment > 0 &&
      newInvoice.dailyHours &&
      newInvoice.dailyHours > 0 &&
      newInvoice.attendedDays !== undefined
    ) {
      newInvoice.finalPayment =
        newInvoice.hourlyPayment *
        newInvoice.attendedDays *
        newInvoice.dailyHours;

      // Update total units based on attended days and daily hours
      newInvoice.totalUnits = newInvoice.attendedDays * newInvoice.dailyHours;

      // Si estamos usando el cálculo de salario, actualizar el total
      if (newInvoice.useSalaryCalculation) {
        newInvoice.total = newInvoice.finalPayment;
      }
    }

    setInvoice(newInvoice);
  };

  const toggleSalaryCalculation = (checked: boolean) => {
    const newInvoice = { ...invoice, useSalaryCalculation: checked };

    if (checked) {
      // Si activamos el cálculo de salario, actualizar el total con el finalPayment
      // y las unidades totales con días asistidos × horas diarias
      if (newInvoice.finalPayment) {
        newInvoice.total = newInvoice.finalPayment;

        if (newInvoice.attendedDays && newInvoice.dailyHours) {
          newInvoice.totalUnits =
            newInvoice.attendedDays * newInvoice.dailyHours;
        }
      }
    } else {
      // Si desactivamos, calcular el total y unidades a partir de los items
      const totalAmount = newInvoice.items.reduce(
        (sum, item) => sum + item.total,
        0
      );
      const totalUnits = newInvoice.items.reduce(
        (sum, item) => sum + Number(item.units),
        0
      );

      newInvoice.total = totalAmount;
      newInvoice.totalUnits = totalUnits;
    }

    setInvoice(newInvoice);
  };

  // Verificar si hay discrepancia entre el total calculado por salario y el total de los items
  const itemsTotal = invoice.items.reduce((sum, item) => sum + item.total, 0);
  const hasTotalDiscrepancy =
    invoice.useSalaryCalculation &&
    invoice.finalPayment !== undefined &&
    Math.abs(itemsTotal - invoice.finalPayment) > 0.01;

  const removeItem = (index: number) => {
    const newItems = [...invoice.items];
    newItems.splice(index, 1);

    // Si no quedan items, añadir uno vacío
    if (newItems.length === 0) {
      newItems.push({
        client: "",
        description: "",
        units: 0,
        pricePerUnit: 0,
        total: 0,
        isHourly: true,
        manualTotal: false,
      });
    }

    // Calcular totales basados en items
    const totalAmount = newItems.reduce((sum, item) => sum + item.total, 0);
    const totalUnits = newItems.reduce(
      (sum, item) => sum + Number(item.units),
      0
    );

    // Actualizar estado respetando el modo de cálculo
    if (invoice.useSalaryCalculation) {
      setInvoice({
        ...invoice,
        items: newItems,
      });
    } else {
      setInvoice({
        ...invoice,
        items: newItems,
        total: totalAmount,
        totalUnits: totalUnits,
      });
    }
  };

  return (
    <div className="container mx-auto py-8 space-y-8">
      <Card className="bg-gradient-to-b from-gray-50 to-white">
        <CardHeader>
          <CardTitle className="text-2xl font-bold">
            Generador de Facturas
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <Tabs defaultValue="basic" className="w-full">
            <TabsList className="grid w-full grid-cols-3 mb-4 bg-gray-100">
              <TabsTrigger
                value="basic"
                className="data-[state=active]:bg-blue-500 data-[state=active]:text-white transition-colors"
              >
                Información Básica
              </TabsTrigger>
              <TabsTrigger
                value="company"
                className="data-[state=active]:bg-blue-500 data-[state=active]:text-white transition-colors"
              >
                Datos de Empresa
              </TabsTrigger>
              <TabsTrigger
                value="worker"
                className="data-[state=active]:bg-blue-500 data-[state=active]:text-white transition-colors"
              >
                Datos del Trabajador
              </TabsTrigger>
            </TabsList>

            <TabsContent value="basic" className="space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label
                    htmlFor="invoiceNumber"
                    className="text-sm font-medium text-gray-700"
                  >
                    Número de Factura
                  </Label>
                  <Input
                    id="invoiceNumber"
                    value={invoice.invoiceNumber}
                    onChange={(e) =>
                      setInvoice({ ...invoice, invoiceNumber: e.target.value })
                    }
                    placeholder="Ej: 1/2025"
                  />
                </div>
                <div className="space-y-2">
                  <Label
                    htmlFor="date"
                    className="text-sm font-medium text-gray-700"
                  >
                    Fecha
                  </Label>
                  <Input
                    id="date"
                    type="date"
                    value={invoice.date}
                    onChange={(e) =>
                      setInvoice({ ...invoice, date: e.target.value })
                    }
                  />
                </div>
              </div>

              <div className="flex items-center space-x-2">
                <Switch
                  id="useSalaryCalculation"
                  checked={invoice.useSalaryCalculation}
                  onCheckedChange={toggleSalaryCalculation}
                />
                <Label
                  htmlFor="useSalaryCalculation"
                  className="text-sm font-medium text-gray-700"
                >
                  Salario a partir del total
                </Label>
              </div>

              {hasTotalDiscrepancy && (
                <div className="bg-yellow-50 border border-yellow-200 text-yellow-800 px-4 py-3 rounded relative">
                  <strong className="font-bold">Advertencia:</strong>
                  <span className="block sm:inline">
                    {" "}
                    El total calculado por salario (
                    {invoice.finalPayment?.toFixed(2)} €) no coincide con el
                    total de los conceptos ({itemsTotal.toFixed(2)} €).
                  </span>
                </div>
              )}

              {invoice.useSalaryCalculation && (
                <>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label
                        htmlFor="workingDays"
                        className="text-sm font-medium text-gray-700"
                      >
                        Total de días hábiles
                      </Label>
                      <Input
                        id="workingDays"
                        type="number"
                        value={invoice.workingDays}
                        onChange={(e) =>
                          calculatePayments(
                            "workingDays",
                            Number(e.target.value)
                          )
                        }
                      />
                    </div>
                    <div className="space-y-2">
                      <Label
                        htmlFor="attendedDays"
                        className="text-sm font-medium text-gray-700"
                      >
                        Total de días asistidos
                      </Label>
                      <Input
                        id="attendedDays"
                        type="number"
                        value={invoice.attendedDays}
                        onChange={(e) =>
                          calculatePayments(
                            "attendedDays",
                            Number(e.target.value)
                          )
                        }
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-4">
                    <div className="space-y-2">
                      <Label
                        htmlFor="dailyHours"
                        className="text-sm font-medium text-gray-700"
                      >
                        Total de horas diarias
                      </Label>
                      <Input
                        id="dailyHours"
                        type="number"
                        value={invoice.dailyHours}
                        onChange={(e) =>
                          calculatePayments(
                            "dailyHours",
                            Number(e.target.value)
                          )
                        }
                      />
                    </div>
                    <div className="space-y-2">
                      <Label
                        htmlFor="monthlyPayment"
                        className="text-sm font-medium text-gray-700"
                      >
                        Pago mensual
                      </Label>
                      <Input
                        id="monthlyPayment"
                        type="number"
                        value={invoice.monthlyPayment}
                        onChange={(e) =>
                          calculatePayments(
                            "monthlyPayment",
                            Number(e.target.value)
                          )
                        }
                      />
                    </div>
                    <div className="space-y-2">
                      <Label
                        htmlFor="hourlyPayment"
                        className="text-sm font-medium text-gray-700"
                      >
                        Pago por hora
                      </Label>
                      <Input
                        id="hourlyPayment"
                        type="number"
                        value={invoice.hourlyPayment}
                        onChange={(e) =>
                          calculatePayments(
                            "hourlyPayment",
                            Number(e.target.value)
                          )
                        }
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label
                      htmlFor="finalPayment"
                      className="text-sm font-medium text-gray-700"
                    >
                      Resultado (pago final)
                    </Label>
                    <Input
                      id="finalPayment"
                      type="number"
                      value={invoice.finalPayment}
                      readOnly
                      className="bg-gray-50"
                    />
                  </div>
                </>
              )}
            </TabsContent>

            <TabsContent value="company" className="space-y-4">
              <div className="grid gap-4">
                <div className="space-y-2">
                  <Label
                    htmlFor="companyName"
                    className="text-sm font-medium text-gray-700"
                  >
                    Nombre de la Empresa
                  </Label>
                  <Input
                    id="companyName"
                    value={invoice.company.name}
                    onChange={(e) =>
                      setInvoice({
                        ...invoice,
                        company: { ...invoice.company, name: e.target.value },
                      })
                    }
                    placeholder="Nombre de la Empresa"
                  />
                </div>
                <div className="space-y-2">
                  <Label
                    htmlFor="companyId"
                    className="text-sm font-medium text-gray-700"
                  >
                    NIF
                  </Label>
                  <Input
                    id="companyId"
                    value={invoice.company.taxId}
                    onChange={(e) =>
                      setInvoice({
                        ...invoice,
                        company: { ...invoice.company, taxId: e.target.value },
                      })
                    }
                    placeholder="Ej: B12345678"
                  />
                </div>
                <div className="space-y-2">
                  <Label
                    htmlFor="companyAddress"
                    className="text-sm font-medium text-gray-700"
                  >
                    Dirección
                  </Label>
                  <Textarea
                    id="companyAddress"
                    value={invoice.company.address}
                    onChange={(e) =>
                      setInvoice({
                        ...invoice,
                        company: {
                          ...invoice.company,
                          address: e.target.value,
                        },
                      })
                    }
                    placeholder="Dirección completa de la empresa"
                  />
                </div>
              </div>
            </TabsContent>

            <TabsContent value="worker" className="space-y-4">
              <div className="grid gap-4">
                <div className="space-y-2">
                  <Label
                    htmlFor="workerName"
                    className="text-sm font-medium text-gray-700"
                  >
                    Nombre
                  </Label>
                  <Input
                    id="workerName"
                    value={invoice.worker.name}
                    onChange={(e) =>
                      setInvoice({
                        ...invoice,
                        worker: { ...invoice.worker, name: e.target.value },
                      })
                    }
                    placeholder="Nombre completo del trabajador"
                  />
                </div>
                <div className="space-y-2">
                  <Label
                    htmlFor="workerId"
                    className="text-sm font-medium text-gray-700"
                  >
                    ID/NIF
                  </Label>
                  <Input
                    id="workerId"
                    value={invoice.worker.id}
                    onChange={(e) =>
                      setInvoice({
                        ...invoice,
                        worker: { ...invoice.worker, id: e.target.value },
                      })
                    }
                    placeholder="Documento de identidad"
                  />
                </div>
                <div className="space-y-2">
                  <Label
                    htmlFor="workerAddress"
                    className="text-sm font-medium text-gray-700"
                  >
                    Dirección
                  </Label>
                  <Textarea
                    id="workerAddress"
                    value={invoice.worker.address}
                    onChange={(e) =>
                      setInvoice({
                        ...invoice,
                        worker: { ...invoice.worker, address: e.target.value },
                      })
                    }
                    placeholder="Dirección completa del trabajador"
                  />
                </div>
              </div>
            </TabsContent>
          </Tabs>

          <Separator className="my-8" />

          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Conceptos</h3>
            {invoice.items.map((item, index) => (
              <Card key={index} className="p-4">
                <div className="grid grid-cols-7 gap-4">
                  <div className="space-y-2 col-span-2">
                    <Label
                      htmlFor={`client-${index}`}
                      className="text-sm font-medium text-gray-700"
                    >
                      Cliente
                    </Label>
                    <Input
                      id={`client-${index}`}
                      value={item.client}
                      onChange={(e) =>
                        updateItem(index, "client", e.target.value)
                      }
                      placeholder="Nombre del cliente"
                    />
                  </div>
                  <div className="space-y-2 col-span-2">
                    <Label
                      htmlFor={`description-${index}`}
                      className="text-sm font-medium text-gray-700"
                    >
                      Proyecto
                    </Label>
                    <Input
                      id={`description-${index}`}
                      value={item.description}
                      onChange={(e) =>
                        updateItem(index, "description", e.target.value)
                      }
                      placeholder="Descripción del proyecto"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label
                      htmlFor={`units-${index}`}
                      className="text-sm font-medium text-gray-700"
                    >
                      {item.isHourly ? "Horas" : "Unidades"}
                    </Label>
                    <div className="flex gap-2">
                      <Input
                        id={`units-${index}`}
                        type="number"
                        value={item.units}
                        onChange={(e) =>
                          updateItem(index, "units", Number(e.target.value))
                        }
                      />
                      <Button
                        type="button"
                        variant="outline"
                        size="icon"
                        onClick={() =>
                          updateItem(index, "isHourly", !item.isHourly)
                        }
                      >
                        {item.isHourly ? "h" : "#"}
                      </Button>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label
                      htmlFor={`price-${index}`}
                      className="text-sm font-medium text-gray-700"
                    >
                      Precio/u
                    </Label>
                    <Input
                      id={`price-${index}`}
                      type="number"
                      value={item.pricePerUnit}
                      onChange={(e) =>
                        updateItem(
                          index,
                          "pricePerUnit",
                          Number(e.target.value)
                        )
                      }
                    />
                  </div>
                  <div className="space-y-2 flex items-end justify-between">
                    <div className="flex items-center space-x-2">
                      <Switch
                        id={`manualTotal-${index}`}
                        checked={item.manualTotal}
                        onCheckedChange={(checked) =>
                          updateItem(index, "manualTotal", checked)
                        }
                      />
                      <Label
                        htmlFor={`manualTotal-${index}`}
                        className="text-sm font-medium text-gray-700"
                      >
                        Manual
                      </Label>
                    </div>
                    {invoice.items.length > 1 && (
                      <Button
                        type="button"
                        variant="outline"
                        size="icon"
                        onClick={() => removeItem(index)}
                        className="text-red-500 hover:text-red-700"
                      >
                        ×
                      </Button>
                    )}
                  </div>
                </div>
              </Card>
            ))}
            <Button type="button" variant="outline" onClick={addItem}>
              Añadir Concepto
            </Button>
          </div>

          <Separator className="my-8" />

          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Detalles de Pago</h3>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label
                  htmlFor="paymentMethod"
                  className="text-sm font-medium text-gray-700"
                >
                  Forma de Pago
                </Label>
                <Select
                  value={invoice.paymentMethod}
                  onValueChange={(value) =>
                    setInvoice({ ...invoice, paymentMethod: value })
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecciona forma de pago" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Transferencia">Transferencia</SelectItem>
                    <SelectItem value="Efectivo">Efectivo</SelectItem>
                    <SelectItem value="Cheque">Cheque</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              {invoice.paymentMethod === "Transferencia" && (
                <div className="space-y-2">
                  <Label
                    htmlFor="bankAccount"
                    className="text-sm font-medium text-gray-700"
                  >
                    Cuenta Bancaria
                  </Label>
                  <Input
                    id="bankAccount"
                    value={invoice.bankAccount}
                    onChange={(e) =>
                      setInvoice({ ...invoice, bankAccount: e.target.value })
                    }
                    placeholder="IBAN"
                  />
                </div>
              )}
            </div>
            <div className="space-y-2">
              <Label
                htmlFor="additionalNote"
                className="text-sm font-medium text-gray-700"
              >
                Nota Adicional
              </Label>
              <Textarea
                id="additionalNote"
                value={invoice.additionalNote}
                onChange={(e) =>
                  setInvoice({ ...invoice, additionalNote: e.target.value })
                }
                placeholder="Información adicional para la factura"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      <InvoicePreview invoice={invoice} />
      <PDFButton invoice={invoice} />
    </div>
  );
}
