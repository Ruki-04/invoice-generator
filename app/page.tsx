import { redirect } from "next/navigation";
import { InvoiceForm } from "@/components/invoice-form";
import { LogoutButton } from "@/components/logout-button";
import { getCurrentUser } from "@/lib/auth";

export default async function Page() {
  const user = await getCurrentUser();
  if (!user) {
    redirect("/login");
  }

  return (
    <main className="min-h-screen bg-gray-100 p-4">
      <div className="container mx-auto pt-4 flex justify-end items-center gap-3 text-sm text-gray-600">
        <span>
          Sesión: <strong>{user}</strong>
        </span>
        <LogoutButton />
      </div>
      <InvoiceForm />
    </main>
  );
}
