"use client";

import { useMemo, useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Sidebar } from "@/components/Sidebar";
import { Topbar } from "@/components/Topbar";
import { Modal } from "@/components/Modal";
import { ConfirmDeleteModal } from "@/components/ConfirmDeleteModal";
import { FormField, TextInput, AmountInput } from "@/components/FormField";
import { DateField } from "@/components/DateField";
import { PlusIcon, EditIcon, TrashIcon, PrinterIcon } from "@/components/icons";
import { api } from "@/lib/api";
import { usePagedList } from "@/lib/paged-list";
import { Invoice, InvoiceInput, InvoiceItemInput } from "@/lib/types";
import { money, quantity } from "@/lib/forms";
import { ListCount, ListFooter } from "@/components/ListFooter";

const emptyItem = (): InvoiceItemInput => ({ description: "", quantity: 1, amount: "0" });

const emptyForm = (): InvoiceInput => ({
  date: new Date().toISOString().slice(0, 10),
  customer_name: "",
  amount_received: "0",
  items: [emptyItem()],
});

function formatDate(date: string) {
  return new Date(date + "T00:00:00").toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

export default function InvoicesPage() {
  const queryClient = useQueryClient();
  const [drawer, setDrawer] = useState<null | { mode: "create" } | { mode: "edit"; invoice: Invoice }>(
    null
  );
  const [form, setForm] = useState<InvoiceInput>(emptyForm());
  const [deleteTarget, setDeleteTarget] = useState<Invoice | null>(null);

  const { listRef, items: invoices, total, isLoading, hasNextPage, isFetchingNextPage } =
    usePagedList<Invoice>(["invoices"], "/api/invoices");

  const formTotal = useMemo(
    () => form.items.reduce((sum, item) => sum + (Number(item.amount) || 0), 0),
    [form.items]
  );

  const formBalance = formTotal - (Number(form.amount_received) || 0);

  const invalidate = () => queryClient.invalidateQueries({ queryKey: ["invoices"] });

  const createMutation = useMutation({
    mutationFn: (input: InvoiceInput) => api.post<Invoice>("/api/invoices", input),
    onSuccess: () => {
      invalidate();
      setDrawer(null);
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, input }: { id: number; input: InvoiceInput }) =>
      api.put<Invoice>(`/api/invoices/${id}`, input),
    onSuccess: () => {
      invalidate();
      setDrawer(null);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: number) => api.delete(`/api/invoices/${id}`),
    onSuccess: () => {
      invalidate();
      setDeleteTarget(null);
    },
  });

  const openCreate = () => {
    setForm(emptyForm());
    setDrawer({ mode: "create" });
  };

  const openEdit = (invoice: Invoice) => {
    setForm({
      date: invoice.date,
      customer_name: invoice.customer_name,
      amount_received: invoice.amount_received,
      items: invoice.items.map((item) => ({
        description: item.description,
        quantity: item.quantity,
        amount: item.amount,
      })),
    });
    setDrawer({ mode: "edit", invoice });
  };

  const updateItem = (index: number, patch: Partial<InvoiceItemInput>) => {
    setForm({
      ...form,
      items: form.items.map((item, i) => (i === index ? { ...item, ...patch } : item)),
    });
  };

  const addItem = () => setForm({ ...form, items: [...form.items, emptyItem()] });

  const removeItem = (index: number) =>
    setForm({ ...form, items: form.items.filter((_, i) => i !== index) });

  const handleSave = () => {
    const payload: InvoiceInput = {
      ...form,
      amount_received: money(form.amount_received),
      items: form.items
        .filter((item) => item.description.trim() !== "")
        .map((item) => ({
          ...item,
          quantity: quantity(item.quantity),
          amount: money(item.amount),
        })),
    };
    if (payload.items.length === 0) return;
    if (drawer?.mode === "edit") {
      updateMutation.mutate({ id: drawer.invoice.id, input: payload });
    } else {
      createMutation.mutate(payload);
    }
  };

  const saving = createMutation.isPending || updateMutation.isPending;

  return (
    <>
      <Sidebar active="Invoices" />

      <div className="flex-grow flex flex-col min-w-0">
        <Topbar title="Invoices" subtitle="Independent billing records" />

        <div className="px-4 md:px-8 pt-6 flex justify-end">
          <button
            onClick={openCreate}
            className="h-11 px-5 rounded-[10px] bg-accent text-accent-contrast font-heading font-bold text-sm flex items-center justify-center gap-2 w-full sm:w-auto"
            style={{ boxShadow: "0 1px 2px var(--shadow)" }}
          >
            <PlusIcon />
            Create Invoice
          </button>
        </div>

        <div ref={listRef} className="px-4 md:px-8 pb-8 pt-5 flex-grow overflow-auto">
          <div className="bg-surface border border-border rounded-[14px] overflow-x-auto">
            <div className="min-w-[720px]">
            <div className="grid grid-cols-[1fr_1.6fr_1fr_0.9fr] px-6 py-3 font-heading font-bold text-[11px] tracking-wide uppercase text-text-muted bg-surface-alt border-b border-border">
              <div>Date</div>
              <div>Customer Name</div>
              <div>Total</div>
              <div />
            </div>

            {isLoading && <div className="text-sm text-text-muted px-6 py-6">Loading…</div>}
            {!isLoading && invoices.length === 0 && (
              <div className="text-sm text-text-muted px-6 py-6">No invoices yet.</div>
            )}

            {invoices.map((invoice, i, arr) => (
              <div
                key={invoice.id}
                className={`grid grid-cols-[1fr_1.6fr_1fr_0.9fr] px-6 py-4 items-center text-sm ${
                  i < arr.length - 1 ? "border-b border-border" : ""
                }`}
              >
                <div className="text-text-muted">{formatDate(invoice.date)}</div>
                <div className="font-semibold">{invoice.customer_name}</div>
                <div className="font-heading font-bold">&#8377;{invoice.total}</div>
                <div className="flex gap-1.5 justify-end">
                  <button
                    onClick={() => openEdit(invoice)}
                    className="w-[30px] h-[30px] rounded-lg border border-border bg-surface text-text-muted flex items-center justify-center"
                  >
                    <EditIcon />
                  </button>
                  <button
                    onClick={() => setDeleteTarget(invoice)}
                    className="w-[30px] h-[30px] rounded-lg border border-border bg-surface text-text-muted flex items-center justify-center"
                  >
                    <TrashIcon />
                  </button>
                  <button
                    onClick={() => window.open(`/print/invoices/${invoice.id}`, "_blank")}
                    title="Print invoice in a new tab"
                    className="w-[30px] h-[30px] rounded-lg border border-border bg-surface text-text-muted flex items-center justify-center"
                  >
                    <PrinterIcon />
                  </button>
                </div>
              </div>
            ))}
            </div>
          </div>
          <ListFooter
            loaded={invoices.length}
            total={total}
            noun="invoice"
            nounPlural="invoices"
            isLoading={isLoading}
            hasNextPage={hasNextPage}
            isFetchingNextPage={isFetchingNextPage}
          />

        </div>
      </div>

      {drawer && (
        <Modal
          title={drawer.mode === "edit" ? "Edit Invoice" : "New Invoice"}
          subtitle="Independent billing record"
          onClose={() => setDrawer(null)}
          width={600}
        >
          <div className="px-7 py-6 flex flex-col gap-4">
            <div className="flex flex-col sm:flex-row gap-3.5">
              <div className="flex-1">
                <FormField label="Date">
                  <DateField
                    value={form.date}
                    onChange={(date) => setForm({ ...form, date })}
                  />
                </FormField>
              </div>
              <div className="flex-1">
                <FormField label="Customer Name">
                  <TextInput
                    value={form.customer_name}
                    onChange={(e) => setForm({ ...form, customer_name: e.target.value })}
                    placeholder="e.g. Ramesh Kumar"
                  />
                </FormField>
              </div>
            </div>

            <div>
              <div className="flex gap-2 mb-1.5">
                <label className="flex-grow font-heading font-semibold text-[12.5px] text-text">
                  Services
                </label>
                <span className="w-[64px] flex-shrink-0 font-heading font-semibold text-[12.5px] text-text">
                  Qty
                </span>
                <span className="w-[110px] flex-shrink-0 font-heading font-semibold text-[12.5px] text-text">
                  Price
                </span>
                <span className="w-11 flex-shrink-0" />
              </div>
              <div className="flex flex-col gap-2.5">
                {form.items.map((item, index) => (
                  <div key={index} className="flex gap-2 items-start">
                    <div className="flex-grow">
                      <TextInput
                        value={item.description}
                        onChange={(e) => updateItem(index, { description: e.target.value })}
                        placeholder="e.g. Wash"
                      />
                    </div>
                    <div className="w-[64px] flex-shrink-0">
                      <TextInput
                        type="number"
                        min={1}
                        value={String(item.quantity)}
                        onChange={(e) =>
                          updateItem(index, { quantity: Math.max(1, Number(e.target.value) || 1) })
                        }
                        aria-label="Quantity"
                      />
                    </div>
                    <div className="w-[110px] flex-shrink-0">
                      <AmountInput
                        value={item.amount}
                        onChange={(e) => updateItem(index, { amount: e.target.value })}
                      />
                    </div>
                    <button
                      onClick={() => removeItem(index)}
                      disabled={form.items.length === 1}
                      className="w-11 h-11 rounded-[10px] border border-border bg-surface text-text-muted flex items-center justify-center flex-shrink-0 disabled:opacity-40"
                    >
                      <TrashIcon />
                    </button>
                  </div>
                ))}
              </div>
              <button
                onClick={addItem}
                className="mt-2.5 flex items-center gap-1.5 text-accent font-heading font-semibold text-sm"
              >
                <PlusIcon size={16} />
                Add service
              </button>
            </div>

            <FormField label="Amount Received" optional>
              <AmountInput
                value={form.amount_received}
                onChange={(e) => setForm({ ...form, amount_received: e.target.value })}
              />
            </FormField>

            <div className="bg-surface-alt rounded-[10px] px-4 py-3 mt-1 flex flex-col gap-2">
              <div className="flex items-center justify-between">
                <span className="font-heading font-semibold text-sm text-text-muted">Total</span>
                <span className="font-heading font-extrabold text-lg text-text">
                  &#8377;{formTotal.toLocaleString("en-IN")}
                </span>
              </div>
              <div className="flex items-center justify-between border-t border-border pt-2">
                <span className="font-heading font-semibold text-sm text-text-muted">Balance</span>
                <span
                  className={`font-heading font-bold text-sm ${
                    formBalance > 0 ? "text-warning" : "text-success"
                  }`}
                >
                  &#8377;{formBalance.toLocaleString("en-IN")}
                </span>
              </div>
            </div>
          </div>

          <div className="flex gap-3 px-7 py-5 border-t border-border flex-shrink-0">
            <button
              onClick={() => setDrawer(null)}
              className="flex-1 h-[46px] rounded-[10px] border border-border bg-surface text-text font-heading font-bold text-sm"
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              disabled={saving}
              className="flex-[1.4] h-[46px] rounded-[10px] bg-accent text-accent-contrast font-heading font-bold text-sm disabled:opacity-60"
              style={{ boxShadow: "0 1px 2px var(--shadow)" }}
            >
              {saving ? "Saving…" : "Save Invoice"}
            </button>
          </div>
        </Modal>
      )}

      {deleteTarget && (
        <ConfirmDeleteModal
          message={`Delete the invoice for ${deleteTarget.customer_name} (₹${deleteTarget.total})? This can't be undone.`}
          onCancel={() => setDeleteTarget(null)}
          onConfirm={() => deleteMutation.mutate(deleteTarget.id)}
          loading={deleteMutation.isPending}
        />
      )}
    </>
  );
}
