"use client";

import { use, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { api, ApiError } from "@/lib/api";
import { getToken } from "@/lib/auth";
import { Invoice } from "@/lib/types";

export default function PrintInvoicePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const [invoice, setInvoice] = useState<Invoice | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!getToken()) {
      router.replace("/login");
      return;
    }
    api
      .get<Invoice>(`/api/invoices/${id}`)
      .then((data) => {
        setInvoice(data);
        setTimeout(() => window.print(), 300);
      })
      .catch((err) => setError(err instanceof ApiError ? err.message : "Failed to load invoice"));
  }, [id, router]);

  if (error) return <div className="p-10 text-sm text-red-600">{error}</div>;
  if (!invoice) return <div className="p-10 text-sm text-gray-500">Loading invoice…</div>;

  const dateLabel = new Date(invoice.date + "T00:00:00").toLocaleDateString("en-IN", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });

  return (
    <div className="max-w-2xl mx-auto p-12 text-gray-900 bg-white">
      <div className="flex items-center justify-between border-b border-gray-300 pb-6 mb-8">
        <div>
          <div className="text-xl font-bold">Bavas Group</div>
          <div className="text-sm text-gray-500">Car Wash &amp; PUC Management</div>
        </div>
        <div className="text-right">
          <div className="text-lg font-bold uppercase tracking-wide">Invoice</div>
          <div className="text-sm text-gray-500">#{invoice.id.toString().padStart(5, "0")}</div>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-6 mb-10 text-sm">
        <div>
          <div className="text-gray-500 mb-1">Date</div>
          <div className="font-medium">{dateLabel}</div>
        </div>
        <div>
          <div className="text-gray-500 mb-1">Customer</div>
          <div className="font-medium">{invoice.customer_name}</div>
        </div>
      </div>

      <table className="w-full text-sm border-t border-b border-gray-300">
        <thead>
          <tr className="text-left text-gray-500">
            <th className="py-3 font-medium">Description</th>
            <th className="py-3 font-medium text-right">Amount</th>
          </tr>
        </thead>
        <tbody>
          {invoice.items.map((item) => (
            <tr key={item.id} className="border-t border-gray-200">
              <td className="py-3">{item.description}</td>
              <td className="py-3 text-right font-medium">&#8377;{item.amount}</td>
            </tr>
          ))}
        </tbody>
      </table>

      <div className="flex justify-end mt-6">
        <div className="text-right">
          <div className="text-gray-500 text-sm">Total</div>
          <div className="text-2xl font-bold">&#8377;{invoice.total}</div>
        </div>
      </div>

      <div className="mt-16 text-xs text-gray-400 text-center">Thank you for your business.</div>
    </div>
  );
}
