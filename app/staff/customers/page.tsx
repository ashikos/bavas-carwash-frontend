"use client";

import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Sidebar } from "@/components/Sidebar";
import { Topbar } from "@/components/Topbar";
import { Modal } from "@/components/Modal";
import { ConfirmDeleteModal } from "@/components/ConfirmDeleteModal";
import { FormField, TextInput } from "@/components/FormField";
import { SearchIcon, PlusIcon, EditIcon, TrashIcon } from "@/components/icons";
import { api } from "@/lib/api";
import { Customer, CustomerInput } from "@/lib/types";

const emptyForm: CustomerInput = { name: "", phone: "" };

export default function CustomersPage() {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");
  const [modal, setModal] = useState<null | { mode: "create" } | { mode: "edit"; customer: Customer }>(
    null
  );
  const [form, setForm] = useState<CustomerInput>(emptyForm);
  const [deleteTarget, setDeleteTarget] = useState<Customer | null>(null);

  const { data: customers, isLoading } = useQuery({
    queryKey: ["customers", search],
    queryFn: () =>
      api.get<Customer[]>(`/api/customers${search ? `?q=${encodeURIComponent(search)}` : ""}`),
  });

  const invalidate = () => queryClient.invalidateQueries({ queryKey: ["customers"] });

  const createMutation = useMutation({
    mutationFn: (input: CustomerInput) => api.post<Customer>("/api/customers", input),
    onSuccess: () => {
      invalidate();
      setModal(null);
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, input }: { id: number; input: CustomerInput }) =>
      api.put<Customer>(`/api/customers/${id}`, input),
    onSuccess: () => {
      invalidate();
      setModal(null);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: number) => api.delete(`/api/customers/${id}`),
    onSuccess: () => {
      invalidate();
      setDeleteTarget(null);
    },
  });

  const openCreate = () => {
    setForm(emptyForm);
    setModal({ mode: "create" });
  };

  const openEdit = (customer: Customer) => {
    setForm({ name: customer.name, phone: customer.phone });
    setModal({ mode: "edit", customer });
  };

  const handleSave = () => {
    if (modal?.mode === "edit") {
      updateMutation.mutate({ id: modal.customer.id, input: form });
    } else {
      createMutation.mutate(form);
    }
  };

  const saving = createMutation.isPending || updateMutation.isPending;

  return (
    <>
      <Sidebar active="Customers" />

      <div className="flex-grow flex flex-col min-w-0">
        <Topbar title="Customers" subtitle="Customer directory" />

        <div className="px-8 pt-6 flex gap-3.5 items-center">
          <div className="flex-grow relative">
            <div className="absolute left-3.5 top-1/2 -translate-y-1/2 text-text-muted">
              <SearchIcon />
            </div>
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full h-11 rounded-[10px] border border-border bg-surface pl-[42px] pr-4 text-sm text-text"
              placeholder="Search by name or phone"
            />
          </div>
          <button
            onClick={openCreate}
            className="h-11 px-5 rounded-[10px] bg-accent text-accent-contrast font-heading font-bold text-sm flex items-center gap-2 flex-shrink-0"
            style={{ boxShadow: "0 1px 2px var(--shadow)" }}
          >
            <PlusIcon />
            Add Customer
          </button>
        </div>

        <div className="px-8 pb-8 pt-5 overflow-auto flex-grow">
          <div className="bg-surface border border-border rounded-[14px] overflow-x-auto">
            <div className="min-w-[560px]">
              <div className="grid grid-cols-[1.4fr_1fr_0.6fr] px-6 py-3 font-heading font-bold text-[11px] tracking-wide uppercase text-text-muted bg-surface-alt border-b border-border">
                <div>Name</div>
                <div>Phone</div>
                <div />
              </div>

              {isLoading && <div className="text-sm text-text-muted px-6 py-6">Loading…</div>}
              {!isLoading && (customers ?? []).length === 0 && (
                <div className="text-sm text-text-muted px-6 py-6">No customers yet.</div>
              )}

              {(customers ?? []).map((customer, i, arr) => (
                <div
                  key={customer.id}
                  className={`grid grid-cols-[1.4fr_1fr_0.6fr] px-6 py-4 items-center text-sm ${
                    i < arr.length - 1 ? "border-b border-border" : ""
                  }`}
                >
                  <div className="font-semibold">{customer.name}</div>
                  <div className="text-text-muted">{customer.phone}</div>
                  <div className="flex gap-1.5 justify-end">
                    <button
                      onClick={() => openEdit(customer)}
                      className="w-[30px] h-[30px] rounded-lg border border-border bg-surface text-text-muted flex items-center justify-center"
                    >
                      <EditIcon />
                    </button>
                    <button
                      onClick={() => setDeleteTarget(customer)}
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
          title={modal.mode === "edit" ? "Edit Customer" : "Add Customer"}
          subtitle="Customer directory"
          onClose={() => setModal(null)}
        >
          <div className="px-6.5 py-5.5 flex flex-col gap-4">
            <FormField label="Name">
              <TextInput
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                placeholder="e.g. Ramesh Kumar"
              />
            </FormField>
            <FormField label="Phone">
              <TextInput
                value={form.phone}
                onChange={(e) => setForm({ ...form, phone: e.target.value })}
                placeholder="98450 11223"
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
              {saving ? "Saving…" : "Save Customer"}
            </button>
          </div>
        </Modal>
      )}

      {deleteTarget && (
        <ConfirmDeleteModal
          message={`Delete ${deleteTarget.name} (${deleteTarget.phone}) from the customer directory? This can't be undone.`}
          onCancel={() => setDeleteTarget(null)}
          onConfirm={() => deleteMutation.mutate(deleteTarget.id)}
          loading={deleteMutation.isPending}
        />
      )}
    </>
  );
}
