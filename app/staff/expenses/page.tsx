"use client";

import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Sidebar } from "@/components/Sidebar";
import { Topbar } from "@/components/Topbar";
import { Modal } from "@/components/Modal";
import { ConfirmDeleteModal } from "@/components/ConfirmDeleteModal";
import { FormField, TextInput, AmountInput } from "@/components/FormField";
import { PlusIcon, EditIcon, TrashIcon } from "@/components/icons";
import { api } from "@/lib/api";
import { Expense, ExpenseInput } from "@/lib/types";

const today = () => new Date().toISOString().slice(0, 10);
const emptyForm: ExpenseInput = { date: today(), description: "", amount: "0" };

function formatDate(date: string) {
  return new Date(date + "T00:00:00").toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

export default function ExpensesPage() {
  const queryClient = useQueryClient();
  const [modal, setModal] = useState<null | { mode: "create" } | { mode: "edit"; expense: Expense }>(
    null
  );
  const [form, setForm] = useState<ExpenseInput>(emptyForm);
  const [deleteTarget, setDeleteTarget] = useState<Expense | null>(null);

  const { data: expenses, isLoading } = useQuery({
    queryKey: ["expenses"],
    queryFn: () => api.get<Expense[]>("/api/expenses"),
  });

  const grouped = useMemo(() => {
    const groups = new Map<string, Expense[]>();
    for (const e of expenses ?? []) {
      const list = groups.get(e.date) ?? [];
      list.push(e);
      groups.set(e.date, list);
    }
    return Array.from(groups.entries());
  }, [expenses]);

  const todaysTotal = useMemo(
    () =>
      (expenses ?? [])
        .filter((e) => e.date === today())
        .reduce((sum, e) => sum + Number(e.amount), 0),
    [expenses]
  );

  const invalidate = () => queryClient.invalidateQueries({ queryKey: ["expenses"] });

  const createMutation = useMutation({
    mutationFn: (input: ExpenseInput) => api.post<Expense>("/api/expenses", input),
    onSuccess: () => {
      invalidate();
      setModal(null);
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, input }: { id: number; input: ExpenseInput }) =>
      api.put<Expense>(`/api/expenses/${id}`, input),
    onSuccess: () => {
      invalidate();
      setModal(null);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: number) => api.delete(`/api/expenses/${id}`),
    onSuccess: () => {
      invalidate();
      setDeleteTarget(null);
    },
  });

  const openCreate = () => {
    setForm(emptyForm);
    setModal({ mode: "create" });
  };

  const openEdit = (expense: Expense) => {
    setForm({ date: expense.date, description: expense.description, amount: expense.amount });
    setModal({ mode: "edit", expense });
  };

  const handleSave = () => {
    if (modal?.mode === "edit") {
      updateMutation.mutate({ id: modal.expense.id, input: form });
    } else {
      createMutation.mutate(form);
    }
  };

  const saving = createMutation.isPending || updateMutation.isPending;

  return (
    <>
      <Sidebar active="Expenses" />

      <div className="flex-grow flex flex-col min-w-0">
        <Topbar
          title="Expenses"
          subtitle="Daily expense log"
          right={
            <div className="flex items-center gap-1.5 md:gap-3 bg-accent-soft rounded-full px-2.5 py-1.5 md:px-4 md:py-2">
              <span className="font-heading font-semibold text-xs text-accent hidden sm:inline">
                Today&apos;s total
              </span>
              <span className="font-heading font-extrabold text-xs md:text-sm text-accent whitespace-nowrap">
                &#8377;{todaysTotal.toLocaleString("en-IN")}
              </span>
            </div>
          }
        />

        <div className="px-4 md:px-8 pt-6 flex justify-end">
          <button
            onClick={openCreate}
            className="h-11 px-5 rounded-[10px] bg-accent text-accent-contrast font-heading font-bold text-sm flex items-center justify-center gap-2 w-full sm:w-auto"
            style={{ boxShadow: "0 1px 2px var(--shadow)" }}
          >
            <PlusIcon />
            Add Expense
          </button>
        </div>

        <div className="px-4 md:px-8 pb-8 pt-5 overflow-auto flex-grow">
          {isLoading && <div className="text-sm text-text-muted px-1 py-6">Loading…</div>}
          {!isLoading && grouped.length === 0 && (
            <div className="text-sm text-text-muted px-1 py-6">No expenses logged yet.</div>
          )}

          {grouped.map(([date, rows]) => (
            <div key={date}>
              <div className="font-heading font-bold text-xs tracking-wide uppercase text-text-muted px-1 pt-3.5 pb-2">
                {formatDate(date)}
              </div>
              <div className="bg-surface border border-border rounded-[14px] overflow-hidden mb-5">
                {rows.map((expense, i) => (
                  <div
                    key={expense.id}
                    className={`flex items-center justify-between gap-3 px-4 md:px-5 py-3.5 ${
                      i < rows.length - 1 ? "border-b border-border" : ""
                    }`}
                  >
                    <div className="font-semibold text-sm min-w-0 break-words">{expense.description}</div>
                    <div className="flex items-center gap-2 md:gap-4 flex-shrink-0">
                      <div className="font-heading font-bold text-sm">&#8377;{expense.amount}</div>
                      <div className="flex gap-1.5">
                        <button
                          onClick={() => openEdit(expense)}
                          className="w-[30px] h-[30px] rounded-lg border border-border bg-surface text-text-muted flex items-center justify-center"
                        >
                          <EditIcon />
                        </button>
                        <button
                          onClick={() => setDeleteTarget(expense)}
                          className="w-[30px] h-[30px] rounded-lg border border-danger-soft bg-danger-soft text-danger flex items-center justify-center"
                        >
                          <TrashIcon />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>

      {modal && (
        <Modal
          title={modal.mode === "edit" ? "Edit Expense" : "Add Expense"}
          subtitle="Logs to today's expense list"
          onClose={() => setModal(null)}
        >
          <div className="px-6.5 py-5.5 flex flex-col gap-4">
            <FormField label="Date">
              <TextInput
                type="date"
                value={form.date}
                onChange={(e) => setForm({ ...form, date: e.target.value })}
              />
            </FormField>
            <FormField label="Description">
              <TextInput
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
                placeholder="e.g. Shampoo & cleaning supplies"
              />
            </FormField>
            <FormField label="Amount">
              <AmountInput
                value={form.amount}
                onChange={(e) => setForm({ ...form, amount: e.target.value })}
              />
            </FormField>
          </div>

          <div className="flex gap-3 px-6.5 py-5 border-t border-border">
            <button
              onClick={() => setModal(null)}
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
              {saving ? "Saving…" : "Save Expense"}
            </button>
          </div>
        </Modal>
      )}

      {deleteTarget && (
        <ConfirmDeleteModal
          message={`Delete the expense "${deleteTarget.description}" (₹${deleteTarget.amount})? This can't be undone.`}
          onCancel={() => setDeleteTarget(null)}
          onConfirm={() => deleteMutation.mutate(deleteTarget.id)}
          loading={deleteMutation.isPending}
        />
      )}
    </>
  );
}
