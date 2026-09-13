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
import { PucEntry, PucEntryInput } from "@/lib/types";

const today = () => new Date().toISOString().slice(0, 10);
const emptyForm: PucEntryInput = { date: today(), collection_amount: "0", discount: "0" };

function formatDate(date: string) {
  return new Date(date + "T00:00:00").toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

export default function PucPage() {
  const queryClient = useQueryClient();
  const [modal, setModal] = useState<null | { mode: "create" } | { mode: "edit"; entry: PucEntry }>(
    null
  );
  const [form, setForm] = useState<PucEntryInput>(emptyForm);
  const [deleteTarget, setDeleteTarget] = useState<PucEntry | null>(null);

  const { data: entries, isLoading } = useQuery({
    queryKey: ["puc"],
    queryFn: () => api.get<PucEntry[]>("/api/puc"),
  });

  const weekTotal = useMemo(() => {
    const now = new Date();
    const weekAgo = new Date(now.getTime() - 6 * 24 * 60 * 60 * 1000);
    return (entries ?? [])
      .filter((e) => new Date(e.date + "T00:00:00") >= new Date(weekAgo.toDateString()))
      .reduce((sum, e) => sum + Number(e.collection_amount), 0);
  }, [entries]);

  const invalidate = () => queryClient.invalidateQueries({ queryKey: ["puc"] });

  const createMutation = useMutation({
    mutationFn: (input: PucEntryInput) => api.post<PucEntry>("/api/puc", input),
    onSuccess: () => {
      invalidate();
      setModal(null);
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, input }: { id: number; input: PucEntryInput }) =>
      api.put<PucEntry>(`/api/puc/${id}`, input),
    onSuccess: () => {
      invalidate();
      setModal(null);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: number) => api.delete(`/api/puc/${id}`),
    onSuccess: () => {
      invalidate();
      setDeleteTarget(null);
    },
  });

  const openCreate = () => {
    setForm(emptyForm);
    setModal({ mode: "create" });
  };

  const openEdit = (entry: PucEntry) => {
    setForm({ date: entry.date, collection_amount: entry.collection_amount, discount: entry.discount });
    setModal({ mode: "edit", entry });
  };

  const handleSave = () => {
    if (modal?.mode === "edit") {
      updateMutation.mutate({ id: modal.entry.id, input: form });
    } else {
      createMutation.mutate(form);
    }
  };

  const saving = createMutation.isPending || updateMutation.isPending;

  return (
    <>
      <Sidebar active="PUC" />

      <div className="flex-grow flex flex-col min-w-0">
        <Topbar
          title="PUC Collections"
          subtitle="Pollution check center collections"
          right={
            <div className="flex items-center gap-1.5 md:gap-3 bg-success-soft rounded-full px-2.5 py-1.5 md:px-4 md:py-2">
              <span className="font-heading font-semibold text-xs text-success hidden sm:inline">
                This week
              </span>
              <span className="font-heading font-extrabold text-xs md:text-sm text-success whitespace-nowrap">
                &#8377;{weekTotal.toLocaleString("en-IN")}
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
            Add Collection
          </button>
        </div>

        <div className="px-4 md:px-8 pb-8 pt-5 overflow-auto flex-grow">
          <div className="bg-surface border border-border rounded-[14px] overflow-x-auto">
            <div className="min-w-[640px]">
            <div className="grid grid-cols-[0.9fr_1fr_1fr_0.6fr] px-6 py-3 font-heading font-bold text-[11px] tracking-wide uppercase text-text-muted bg-surface-alt border-b border-border">
              <div>Date</div>
              <div>Collection Amount</div>
              <div>Discount</div>
              <div />
            </div>

            {isLoading && <div className="text-sm text-text-muted px-6 py-6">Loading…</div>}
            {!isLoading && (entries ?? []).length === 0 && (
              <div className="text-sm text-text-muted px-6 py-6">No PUC collections logged yet.</div>
            )}

            {(entries ?? []).map((entry, i, arr) => (
              <div
                key={entry.id}
                className={`grid grid-cols-[0.9fr_1fr_1fr_0.6fr] px-6 py-4 items-center text-sm ${
                  i < arr.length - 1 ? "border-b border-border" : ""
                }`}
              >
                <div className="font-semibold">{formatDate(entry.date)}</div>
                <div className="font-heading font-bold">&#8377;{entry.collection_amount}</div>
                <div className={Number(entry.discount) > 0 ? "font-heading font-bold text-warning" : "text-text-muted"}>
                  {Number(entry.discount) > 0 ? `₹${entry.discount}` : "—"}
                </div>
                <div className="flex gap-1.5 justify-end">
                  <button
                    onClick={() => openEdit(entry)}
                    className="w-[30px] h-[30px] rounded-lg border border-border bg-surface text-text-muted flex items-center justify-center"
                  >
                    <EditIcon />
                  </button>
                  <button
                    onClick={() => setDeleteTarget(entry)}
                    className="w-[30px] h-[30px] rounded-lg border border-danger-soft bg-danger-soft text-danger flex items-center justify-center"
                  >
                    <TrashIcon />
                  </button>
                </div>
              </div>
            ))}
            </div>
          </div>
        </div>
      </div>

      {modal && (
        <Modal
          title={modal.mode === "edit" ? "Edit PUC Collection" : "Add PUC Collection"}
          subtitle="Pollution check center"
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
            <FormField label="Collection Amount">
              <AmountInput
                value={form.collection_amount}
                onChange={(e) => setForm({ ...form, collection_amount: e.target.value })}
              />
            </FormField>
            <FormField label="Discount" optional>
              <AmountInput
                value={form.discount}
                onChange={(e) => setForm({ ...form, discount: e.target.value })}
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
              {saving ? "Saving…" : "Save Collection"}
            </button>
          </div>
        </Modal>
      )}

      {deleteTarget && (
        <ConfirmDeleteModal
          message={`Delete the PUC entry for ${formatDate(deleteTarget.date)} (₹${deleteTarget.collection_amount})? This can't be undone.`}
          onCancel={() => setDeleteTarget(null)}
          onConfirm={() => deleteMutation.mutate(deleteTarget.id)}
          loading={deleteMutation.isPending}
        />
      )}
    </>
  );
}
