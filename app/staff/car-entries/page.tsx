"use client";

import { useMemo, useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Sidebar } from "@/components/Sidebar";
import { Topbar } from "@/components/Topbar";
import { Drawer } from "@/components/Drawer";
import { ConfirmDeleteModal } from "@/components/ConfirmDeleteModal";
import { FormField, TextInput, AmountInput } from "@/components/FormField";
import { DateField } from "@/components/DateField";
import { SearchIcon, PlusIcon, EditIcon, TrashIcon, FilterIcon } from "@/components/icons";
import { api } from "@/lib/api";
import { CarEntry, CarEntryInput } from "@/lib/types";
import { usePagedList } from "@/lib/paged-list";
import { money } from "@/lib/forms";
import { ListCount, ListFooter } from "@/components/ListFooter";

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
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [drawer, setDrawer] = useState<null | { mode: "create" } | { mode: "edit"; entry: CarEntry }>(
    null
  );
  const [form, setForm] = useState<CarEntryInput>(emptyForm);
  const [deleteTarget, setDeleteTarget] = useState<CarEntry | null>(null);
  const [selected, setSelected] = useState<Set<number>>(new Set());
  const [actionsOpen, setActionsOpen] = useState(false);
  const [confirmBulk, setConfirmBulk] = useState(false);

  const hasDateFilter = Boolean(from || to);

  const { listRef, items: entries, total, isLoading, hasNextPage, isFetchingNextPage } =
    usePagedList<CarEntry>(["car-entries", search, from, to], "/api/car-entries", {
      q: search,
      start: from,
      end: to,
    });

  const grouped = useMemo(() => groupByDate(entries), [entries]);

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

  const bulkDeleteMutation = useMutation({
    mutationFn: (ids: number[]) =>
      api.post<{ deleted: number }>("/api/car-entries/bulk-delete", { ids }),
    onSuccess: () => {
      invalidate();
      setSelected(new Set());
      setConfirmBulk(false);
    },
  });

  const toggleRow = (id: number) =>
    setSelected((current) => {
      const next = new Set(current);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });

  // "Select all" covers the rows actually loaded, not the whole filtered set —
  // claiming to select 1,937 rows while holding 50 would be a lie.
  const allLoadedSelected = entries.length > 0 && selected.size === entries.length;
  const toggleAll = () =>
    setSelected(allLoadedSelected ? new Set() : new Set(entries.map((e) => e.id)));

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
    const input = {
      ...form,
      amount_paid: money(form.amount_paid),
      amount_pending: money(form.amount_pending),
    };
    if (drawer?.mode === "edit") {
      updateMutation.mutate({ id: drawer.entry.id, input });
    } else {
      createMutation.mutate(input);
    }
  };

  const saving = createMutation.isPending || updateMutation.isPending;

  return (
    <>
      <Sidebar active="Wash Entries" />

      <div className="flex-grow flex flex-col min-w-0">
        <Topbar title="Wash Entries" subtitle="Every vehicle through the washing unit, newest first" />

        {/* Controls.
            On a phone these used to stack into four full-width rows — search,
            Create, From, To — and ate half the screen before a single entry
            showed. Now search and a filter toggle share one row, the dates are
            revealed only when wanted, and Create becomes a floating button. */}
        <div className="px-4 md:px-8 pt-6 flex flex-col sm:flex-row gap-3 sm:items-center">
          <div className="flex gap-2 flex-grow">
            <div className="flex-grow relative">
              <div className="absolute left-3.5 top-1/2 -translate-y-1/2 text-text-muted">
                <SearchIcon />
              </div>
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full h-11 rounded-[10px] border border-border bg-surface pl-[42px] pr-4 text-sm text-text"
                placeholder="Search vehicle, reg no, phone"
              />
            </div>

            <button
              onClick={() => setFiltersOpen((o) => !o)}
              aria-expanded={filtersOpen}
              aria-controls="date-filters"
              className={`sm:hidden relative h-11 w-11 flex-shrink-0 rounded-[10px] border flex items-center justify-center ${
                hasDateFilter
                  ? "border-transparent bg-accent-soft text-accent"
                  : "border-border bg-surface text-text-muted"
              }`}
            >
              <FilterIcon />
              {hasDateFilter && (
                <span className="absolute top-1.5 right-1.5 w-1.5 h-1.5 rounded-full bg-accent" />
              )}
              <span className="sr-only">Filter by date</span>
            </button>
          </div>

          <button
            onClick={openCreate}
            className="hidden sm:flex h-11 px-5 rounded-[10px] bg-accent text-accent-contrast font-heading font-bold text-sm items-center justify-center gap-2 flex-shrink-0"
            style={{ boxShadow: "0 1px 2px var(--shadow)" }}
          >
            <PlusIcon />
            Create Entry
          </button>
        </div>

        <div
          id="date-filters"
          className={`px-4 md:px-8 pt-3 gap-2 sm:gap-3 sm:flex sm:flex-row sm:items-center ${
            filtersOpen ? "flex flex-col" : "hidden"
          }`}
        >
          <div className="flex items-center gap-2 flex-1 sm:flex-none">
            <label htmlFor="from" className="font-heading font-semibold text-[12.5px] text-text-muted w-9 sm:w-auto">
              From
            </label>
            <div className="flex-1 sm:w-[168px]">
              <DateField
                id="from"
                value={from}
                max={to || undefined}
                onChange={setFrom}
                placeholder="Any date"
                clearable
              />
            </div>
          </div>
          <div className="flex items-center gap-2 flex-1 sm:flex-none">
            <label htmlFor="to" className="font-heading font-semibold text-[12.5px] text-text-muted w-9 sm:w-auto">
              To
            </label>
            <div className="flex-1 sm:w-[168px]">
              <DateField
                id="to"
                value={to}
                min={from || undefined}
                onChange={setTo}
                placeholder="Any date"
                clearable
              />
            </div>
          </div>

          {hasDateFilter && (
            <button
              onClick={() => {
                setFrom("");
                setTo("");
              }}
              className="h-11 px-4 rounded-[10px] border border-border bg-surface text-text-muted font-heading font-semibold text-[13px]"
            >
              Clear dates
            </button>
          )}
        </div>

        {!isLoading && (
          <div className="px-4 md:px-8 pt-2.5 flex items-center gap-2">
            {hasDateFilter && !filtersOpen && (
              <span className="sm:hidden font-heading font-semibold text-[12px] text-accent bg-accent-soft rounded-full px-2.5 py-1">
                {from && to ? `${from} to ${to}` : from ? `From ${from}` : `Until ${to}`}
              </span>
            )}
            <ListCount loaded={entries.length} total={total} noun="entry" nounPlural="entries" />
          </div>
        )}

        {selected.size > 0 && (
          <div className="px-4 md:px-8 pt-3">
            <div className="flex items-center gap-3 rounded-[10px] border border-accent bg-accent-soft px-3.5 py-2.5">
              <span className="font-heading font-bold text-[13px] text-accent tabular-nums">
                {selected.size} selected
              </span>
              <button
                onClick={() => setSelected(new Set())}
                className="font-heading font-semibold text-[12.5px] text-text-muted"
              >
                Clear
              </button>

              <div className="relative ml-auto">
                <button
                  onClick={() => setActionsOpen((o) => !o)}
                  aria-expanded={actionsOpen}
                  className="h-9 px-3.5 rounded-[9px] border border-border bg-surface font-heading font-semibold text-[13px] text-text flex items-center gap-1.5"
                >
                  Actions
                  <span aria-hidden="true" className="text-[10px]">&#9662;</span>
                </button>

                {actionsOpen && (
                  <>
                    <div className="fixed inset-0 z-10" onClick={() => setActionsOpen(false)} />
                    <div
                      className="absolute right-0 top-11 z-20 w-44 rounded-[10px] border border-border bg-surface py-1"
                      style={{ boxShadow: "0 10px 30px var(--shadow)" }}
                    >
                      <button
                        onClick={() => {
                          setActionsOpen(false);
                          setConfirmBulk(true);
                        }}
                        className="w-full px-3.5 py-2 text-left font-heading font-semibold text-[13px] text-danger flex items-center gap-2"
                      >
                        <TrashIcon size={15} />
                        Delete selected
                      </button>
                    </div>
                  </>
                )}
              </div>
            </div>
          </div>
        )}

        <div ref={listRef} className="px-4 md:px-8 pb-24 sm:pb-8 pt-5 overflow-auto flex-grow">
          {isLoading && <div className="text-sm text-text-muted px-1 py-6">Loading…</div>}
          {!isLoading && grouped.length === 0 && (
            <div className="text-sm text-text-muted px-1 py-6">No wash entries yet.</div>
          )}

          {grouped.map(([date, rows]) => (
            <div key={date}>
              <div className="font-heading font-bold text-xs tracking-wide uppercase text-text-muted px-1 pt-3.5 pb-2">
                {formatDate(date)}
              </div>
              <div className="bg-surface border border-border rounded-[14px] overflow-x-auto mb-5">
                <div className="min-w-[914px]">
                <div className="grid grid-cols-[34px_1.6fr_1.1fr_1.2fr_1.6fr_0.9fr_0.9fr_0.7fr] px-5 py-2.5 font-heading font-bold text-[11px] tracking-wide uppercase text-text-muted bg-surface-alt border-b border-border">
                  <div className="flex items-center">
                    <input
                      type="checkbox"
                      checked={allLoadedSelected}
                      onChange={toggleAll}
                      aria-label="Select all loaded entries"
                      className="w-4 h-4 accent-[var(--accent)] cursor-pointer"
                    />
                  </div>
                  <div>Vehicle</div>
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
                      className={`grid grid-cols-[34px_1.6fr_1.1fr_1.2fr_1.6fr_0.9fr_0.9fr_0.7fr] px-5 py-3.5 items-center text-[13.5px] ${
                        i < rows.length - 1 ? "border-b border-border" : ""
                      } ${selected.has(entry.id) ? "bg-accent-soft" : ""}`}
                    >
                      <div className="flex items-center">
                        <input
                          type="checkbox"
                          checked={selected.has(entry.id)}
                          onChange={() => toggleRow(entry.id)}
                          aria-label={`Select ${entry.car_model} ${entry.reg_no}`}
                          className="w-4 h-4 accent-[var(--accent)] cursor-pointer"
                        />
                      </div>
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

          <ListFooter
            loaded={entries.length}
            total={total}
            noun="entry"
            nounPlural="entries"
            isLoading={isLoading}
            hasNextPage={hasNextPage}
            isFetchingNextPage={isFetchingNextPage}
          />
        </div>
      </div>

      {/* Create is a floating button on a phone, where a full-width bar would
          cost a whole row of the list. */}
      <button
        onClick={openCreate}
        aria-label="Create entry"
        className="sm:hidden fixed bottom-5 right-5 z-30 w-14 h-14 rounded-full bg-accent text-accent-contrast flex items-center justify-center"
        style={{ boxShadow: "0 8px 24px var(--shadow)" }}
      >
        <PlusIcon size={26} />
      </button>

      {drawer && (
        <Drawer
          title={drawer.mode === "edit" ? "Edit Wash Entry" : "New Wash Entry"}
          subtitle="Washing unit · daily log"
          onClose={() => setDrawer(null)}
        >
          <div className="flex-grow overflow-auto px-7 py-6 flex flex-col gap-4.5">
            <FormField label="Date">
              <DateField
                value={form.date}
                onChange={(date) => setForm({ ...form, date })}
              />
            </FormField>

            <FormField label="Vehicle">
              <TextInput
                value={form.car_model}
                onChange={(e) => setForm({ ...form, car_model: e.target.value })}
                placeholder="e.g. Swift, Activa, Bullet, Auto"
              />
            </FormField>

            <div className="flex flex-col sm:flex-row gap-3.5">
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

            <div className="flex flex-col sm:flex-row gap-3.5">
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

      {confirmBulk && (
        <ConfirmDeleteModal
          message={`Delete ${selected.size} selected ${
            selected.size === 1 ? "entry" : "entries"
          }? This can't be undone.`}
          onCancel={() => setConfirmBulk(false)}
          onConfirm={() => bulkDeleteMutation.mutate([...selected])}
          loading={bulkDeleteMutation.isPending}
        />
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
