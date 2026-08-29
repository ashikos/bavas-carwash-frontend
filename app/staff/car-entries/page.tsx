"use client";

import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Sidebar } from "@/components/Sidebar";
import { Topbar } from "@/components/Topbar";
import { Drawer } from "@/components/Drawer";
import { ConfirmDeleteModal } from "@/components/ConfirmDeleteModal";
import { FormField, TextInput, AmountInput } from "@/components/FormField";
import { SearchIcon, PlusIcon, EditIcon, TrashIcon, CalendarIcon } from "@/components/icons";
import { api } from "@/lib/api";
import { CarEntry, CarEntryInput } from "@/lib/types";

const emptyForm: CarEntryInput = {
  date: new Date().toISOString().slice(0, 10),
  car_model: "",
  reg_no: "",
  phone: "",
  service_type: "",
  amount_paid: "0",
  amount_pending: "0",
};

function groupByDate(entries: CarEntry[]) {
  const groups = new Map<string, CarEntry[]>();
  for (const entry of entries) {
    const list = groups.get(entry.date) ?? [];
    list.push(entry);
    groups.set(entry.date, list);
  }
  return Array.from(groups.entries());
}

function formatDate(date: string) {
  return new Date(date + "T00:00:00").toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

export default function CarEntriesPage() {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");
  const [drawer, setDrawer] = useState<null | { mode: "create" } | { mode: "edit"; entry: CarEntry }>(
    null
  );
  const [form, setForm] = useState<CarEntryInput>(emptyForm);
  const [deleteTarget, setDeleteTarget] = useState<CarEntry | null>(null);

  const { data: entries, isLoading } = useQuery({
    queryKey: ["car-entries", search],
    queryFn: () =>
      api.get<CarEntry[]>(`/api/car-entries${search ? `?q=${encodeURIComponent(search)}` : ""}`),
  });

  const grouped = useMemo(() => groupByDate(entries ?? []), [entries]);

  const invalidate = () => queryClient.invalidateQueries({ queryKey: ["car-entries"] });

  const createMutation = useMutation({
    mutationFn: (input: CarEntryInput) => api.post<CarEntry>("/api/car-entries", input),
    onSuccess: () => {
      invalidate();
      setDrawer(null);
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, input }: { id: number; input: CarEntryInput }) =>
      api.put<CarEntry>(`/api/car-entries/${id}`, input),
    onSuccess: () => {
      invalidate();
      setDrawer(null);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: number) => api.delete(`/api/car-entries/${id}`),
    onSuccess: () => {
      invalidate();
      setDeleteTarget(null);
    },
  });

  const openCreate = () => {
    setForm(emptyForm);
    setDrawer({ mode: "create" });
  };

  const openEdit = (entry: CarEntry) => {
    setForm({
      date: entry.date,
      car_model: entry.car_model,
      reg_no: entry.reg_no,
      phone: entry.phone,
      service_type: entry.service_type,
      amount_paid: entry.amount_paid,
      amount_pending: entry.amount_pending,
    });
    setDrawer({ mode: "edit", entry });
  };

  const handleSave = () => {
    if (drawer?.mode === "edit") {
      updateMutation.mutate({ id: drawer.entry.id, input: form });
    } else {
      createMutation.mutate(form);
    }
  };

  const saving = createMutation.isPending || updateMutation.isPending;

  return (
    <>
      <Sidebar active="Car Entries" />

      <div className="flex-grow flex flex-col min-w-0">
        <Topbar title="Car Entries" subtitle="All washing unit entries, newest first" />

        <div className="px-8 pt-6 flex gap-3.5 items-center">
          <div className="flex-grow relative">
            <div className="absolute left-3.5 top-1/2 -translate-y-1/2 text-text-muted">
              <SearchIcon />
            </div>
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full h-11 rounded-[10px] border border-border bg-surface pl-[42px] pr-4 text-sm text-text"
              placeholder="Search by car, reg no, or phone"
            />
          </div>
          <button
            onClick={openCreate}
            className="h-11 px-5 rounded-[10px] bg-accent text-accent-contrast font-heading font-bold text-sm flex items-center gap-2 flex-shrink-0"
            style={{ boxShadow: "0 1px 2px var(--shadow)" }}
          >
            <PlusIcon />
            Create Entry
          </button>
        </div>

        <div className="px-8 pb-8 pt-5 overflow-auto flex-grow">
          {isLoading && <div className="text-sm text-text-muted px-1 py-6">Loading…</div>}
          {!isLoading && grouped.length === 0 && (
            <div className="text-sm text-text-muted px-1 py-6">No car entries yet.</div>
          )}

          {grouped.map(([date, rows]) => (
            <div key={date}>
              <div className="font-heading font-bold text-xs tracking-wide uppercase text-text-muted px-1 pt-3.5 pb-2">
                {formatDate(date)}
              </div>
              <div className="bg-surface border border-border rounded-[14px] overflow-x-auto mb-5">
                <div className="min-w-[880px]">
                <div className="grid grid-cols-[1.6fr_1.1fr_1.2fr_1.6fr_0.9fr_0.9fr_0.7fr] px-5 py-2.5 font-heading font-bold text-[11px] tracking-wide uppercase text-text-muted bg-surface-alt border-b border-border">
                  <div>Car Model</div>
                  <div>Reg No</div>
                  <div>Phone</div>
                  <div>Service</div>
                  <div>Paid</div>
                  <div>Pending</div>
                  <div />
                </div>
                {rows.map((entry, i) => {
                  const pending = Number(entry.amount_pending);
                  return (
                    <div
                      key={entry.id}
                      className={`grid grid-cols-[1.6fr_1.1fr_1.2fr_1.6fr_0.9fr_0.9fr_0.7fr] px-5 py-3.5 items-center text-[13.5px] ${
                        i < rows.length - 1 ? "border-b border-border" : ""
                      }`}
                    >
                      <div className="font-semibold">{entry.car_model}</div>
                      <div className="text-text-muted">{entry.reg_no}</div>
                      <div className="text-text-muted">{entry.phone}</div>
                      <div className="text-text-muted">{entry.service_type}</div>
                      <div className="font-heading font-bold">&#8377;{entry.amount_paid}</div>
                      <div>
                        {pending > 0 ? (
                          <span className="bg-warning-soft text-warning font-heading font-bold text-[11px] px-2.5 py-1 rounded-full">
                            &#8377;{entry.amount_pending} due
                          </span>
                        ) : (
                          <span className="bg-success-soft text-success font-heading font-bold text-[11px] px-2.5 py-1 rounded-full">
                            Paid
                          </span>
                        )}
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
                          className="w-[30px] h-[30px] rounded-lg border border-border bg-surface text-text-muted flex items-center justify-center"
                        >
                          <TrashIcon />
                        </button>
                      </div>
                    </div>
                  );
                })}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {drawer && (
        <Drawer
          title={drawer.mode === "edit" ? "Edit Car Entry" : "New Car Entry"}
          subtitle="Washing unit · daily log"
          onClose={() => setDrawer(null)}
        >
          <div className="flex-grow overflow-auto px-7 py-6 flex flex-col gap-4.5">
            <FormField label="Date">
              <div className="relative">
                <TextInput
                  type="date"
                  value={form.date}
                  onChange={(e) => setForm({ ...form, date: e.target.value })}
                />
                <div className="absolute right-3.5 top-1/2 -translate-y-1/2 text-text-muted pointer-events-none">
                  <CalendarIcon />
                </div>
              </div>
            </FormField>

            <FormField label="Car Model">
              <TextInput
                value={form.car_model}
                onChange={(e) => setForm({ ...form, car_model: e.target.value })}
                placeholder="e.g. Maruti Swift"
              />
            </FormField>

            <div className="flex gap-3.5">
              <div className="flex-1">
                <FormField label="Reg No">
                  <TextInput
                    value={form.reg_no}
                    onChange={(e) => setForm({ ...form, reg_no: e.target.value })}
                    placeholder="KA01AB1234"
                  />
                </FormField>
              </div>
              <div className="flex-1">
                <FormField label="Phone">
                  <TextInput
                    value={form.phone}
                    onChange={(e) => setForm({ ...form, phone: e.target.value })}
                    placeholder="98450 11223"
                  />
                </FormField>
              </div>
            </div>

            <FormField label="Type of Service">
              <TextInput
                value={form.service_type}
                onChange={(e) => setForm({ ...form, service_type: e.target.value })}
                placeholder="e.g. Full Wash + Interior"
              />
            </FormField>

            <div className="flex gap-3.5">
              <div className="flex-1">
                <FormField label="Amount Paid">
                  <AmountInput
                    value={form.amount_paid}
                    onChange={(e) => setForm({ ...form, amount_paid: e.target.value })}
                  />
                </FormField>
              </div>
              <div className="flex-1">
                <FormField label="Amount Pending">
                  <AmountInput
                    value={form.amount_pending}
                    onChange={(e) => setForm({ ...form, amount_pending: e.target.value })}
                  />
                </FormField>
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
              {saving ? "Saving…" : "Save Entry"}
            </button>
          </div>
        </Drawer>
      )}

      {deleteTarget && (
        <ConfirmDeleteModal
          message={`Delete the entry for ${deleteTarget.car_model} (${deleteTarget.reg_no})? This can't be undone.`}
          onCancel={() => setDeleteTarget(null)}
          onConfirm={() => deleteMutation.mutate(deleteTarget.id)}
          loading={deleteMutation.isPending}
        />
      )}
    </>
  );
}
