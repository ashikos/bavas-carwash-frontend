"use client";

import { use, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { api, ApiError } from "@/lib/api";
import { getToken } from "@/lib/auth";
import { BUSINESS } from "@/lib/business";
import { Invoice } from "@/lib/types";

function money(value: string | number) {
  return Number(value).toLocaleString("en-IN", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

/** "13 September 2026" — spelled out, so the month can't be misread. */
function invoiceDate(iso: string) {
  return new Date(iso + "T00:00:00").toLocaleDateString("en-IN", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

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

  return (
    <div
      className="mx-auto max-w-[820px] bg-white px-6 py-8 text-gray-900 sm:px-10"
      // Browsers drop background colours when printing unless told otherwise,
      // which would wipe out the blue table header and the tinted panels.
      // The property is inherited, so setting it here covers the whole invoice.
      style={{ printColorAdjust: "exact", WebkitPrintColorAdjust: "exact" }}
    >
      <style>{`@page { margin: 12mm; }`}</style>
      <header className="text-center">
        <h1 className="text-[26px] font-bold leading-tight tracking-tight sm:text-[30px]">
          {BUSINESS.name}
        </h1>
        <p className="mt-1.5 text-[15px] text-gray-700">{BUSINESS.address}</p>
        <p className="mt-6 inline-block border-b border-gray-900 pb-0.5 text-[17px] font-medium">
          TAX INVOICE
        </p>
      </header>

      <section className="mt-7 rounded-lg border border-gray-300 bg-gray-50 px-5 py-4 text-[14px] leading-7">
        <div>
          <span className="font-bold">Bill to: </span>
          <span className="font-bold">{invoice.customer_name || "--"}</span>
        </div>
        <div>
          <span className="font-bold">Invoice No: </span>
          {String(invoice.id).padStart(4, "0")}
        </div>
        <div>
          <span className="font-bold">Date: </span>
          {invoiceDate(invoice.date)}
        </div>
      </section>

      <table className="mt-7 w-full border-collapse text-[14px]">
        <thead>
          <tr className="bg-[#5b8ad9] text-white">
            <th className="w-[8%] px-3 py-2.5 text-left font-semibold">#</th>
            <th className="px-3 py-2.5 text-center font-semibold">Item</th>
            <th className="w-[18%] px-3 py-2.5 text-center font-semibold">Qty</th>
            <th className="w-[20%] px-3 py-2.5 text-right font-semibold">Price</th>
          </tr>
        </thead>
        <tbody>
          {invoice.items.map((item, i) => (
            <tr key={item.id} className="border-b border-gray-200">
              <td className="px-3 py-2.5">{i + 1}</td>
              <td className="px-3 py-2.5 text-center">{item.description}</td>
              <td className="px-3 py-2.5 text-center">{item.quantity}</td>
              <td className="px-3 py-2.5 text-right">{money(item.amount)}</td>
            </tr>
          ))}
        </tbody>
      </table>

      <section className="mt-7 grid grid-cols-1 gap-5 sm:grid-cols-2">
        <div className="rounded bg-gray-100 px-5 py-4 text-[14px] leading-7">
          <div className="font-bold">Bank Details</div>
          <div>Bank: {BUSINESS.bank.name}</div>
          <div>Account No: {BUSINESS.bank.accountNo}</div>
          <div>IFSC Code: {BUSINESS.bank.ifsc}</div>
          <div>Holder: {BUSINESS.bank.holder}</div>
        </div>

        <div className="rounded bg-blue-50 px-5 py-4 text-[14px] leading-7">
          <div>Total: {money(invoice.total)}</div>
          <div>Payment: {invoice.payment_status}</div>
          <div>Balance: {money(invoice.balance)}</div>
        </div>
      </section>
    </div>
  );
}
