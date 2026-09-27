"use client";

import { useRef, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Sidebar } from "@/components/Sidebar";
import { Topbar } from "@/components/Topbar";
import { Modal } from "@/components/Modal";
import { FormField } from "@/components/FormField";
import { UploadIcon } from "@/components/icons";
import { api, ApiError } from "@/lib/api";
import { ImportBatch, ImportResult } from "@/lib/types";

const MONTHS = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];

const now = new Date();
const YEARS = Array.from({ length: 6 }, (_, i) => now.getFullYear() - 4 + i);

const selectClass =
  "w-full h-11 rounded-[10px] border border-border bg-surface px-3.5 text-sm text-text";

function formatDateTime(value: string) {
  return new Date(value).toLocaleString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

export default function ImportPage() {
  const queryClient = useQueryClient();
  const fileInput = useRef<HTMLInputElement>(null);

  const [modalOpen, setModalOpen] = useState(false);
  const [year, setYear] = useState(now.getFullYear());
  const [month, setMonth] = useState(now.getMonth() + 1);
  const [file, setFile] = useState<File | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<ImportResult | null>(null);

  const { data: history, isLoading } = useQuery({
    queryKey: ["imports"],
    queryFn: () => api.get<ImportBatch[]>("/api/imports"),
  });

  const uploadMutation = useMutation({
    mutationFn: (form: FormData) => api.upload<ImportResult>("/api/imports", form),
    onSuccess: (data) => {
      setResult(data);
      closeModal();
      // Everything the import touches needs refetching.
      for (const key of ["imports", "car-entries", "expenses", "puc", "day-closings"]) {
        queryClient.invalidateQueries({ queryKey: [key] });
      }
    },
    onError: (err) => {
      setError(err instanceof ApiError ? err.message : "Upload failed. Please try again.");
    },
  });

  const openModal = () => {
    setFile(null);
    setError(null);
    setResult(null);
    setModalOpen(true);
  };

  const closeModal = () => {
    setModalOpen(false);
    setFile(null);
    setError(null);
  };

  const handleUpload = () => {
    if (!file) {
      setError("Please choose a file first.");
      return;
    }
    setError(null);
    const form = new FormData();
    form.append("file", file);
    form.append("year", String(year));
    form.append("month", String(month));
    uploadMutation.mutate(form);
  };

  const uploading = uploadMutation.isPending;

  return (
    <>
      <Sidebar active="Import Excel" />

      <div className="flex-grow flex flex-col min-w-0">
        <Topbar title="Import Excel" subtitle="Load a monthly sheet into the app" />

        <div className="px-4 md:px-8 pt-6 flex justify-end">
          <button
            onClick={openModal}
            className="h-11 px-5 rounded-[10px] bg-accent text-accent-contrast font-heading font-bold text-sm flex items-center justify-center gap-2 w-full sm:w-auto"
            style={{ boxShadow: "0 1px 2px var(--shadow)" }}
          >
            <UploadIcon size={18} />
            Upload Excel
          </button>
        </div>

        <div className="px-4 md:px-8 pb-8 pt-5 flex-grow overflow-auto flex flex-col gap-5">
          {result && <ImportSummary result={result} onDismiss={() => setResult(null)} />}

          <div className="bg-surface-alt border border-border rounded-[14px] px-5 py-4 text-[13px] text-text-muted leading-relaxed">
            <div className="font-heading font-bold text-text text-sm mb-1.5">
              You can upload the same month as often as you like
            </div>
            Each day in the sheet is checked separately. Days that have not changed are left
            alone, days you have edited are refreshed, and newly filled-in days are added. Nothing
            is ever recorded twice, and anything you typed directly into the app is never
            overwritten.
          </div>

          <div>
            <div className="font-heading font-bold text-xs tracking-wide uppercase text-text-muted px-1 pb-2">
              Upload history
            </div>
            <div className="bg-surface border border-border rounded-[14px] overflow-x-auto">
              <div className="min-w-[680px]">
                <div className="grid grid-cols-[1.2fr_1.6fr_0.8fr_0.8fr_1fr] px-6 py-3 font-heading font-bold text-[11px] tracking-wide uppercase text-text-muted bg-surface-alt border-b border-border">
                  <div>Month</div>
                  <div>File</div>
                  <div>Added</div>
                  <div>Updated</div>
                  <div>Uploaded</div>
                </div>

                {isLoading && <div className="text-sm text-text-muted px-6 py-6">Loading…</div>}
                {!isLoading && (history ?? []).length === 0 && (
                  <div className="text-sm text-text-muted px-6 py-6">
                    Nothing imported yet.
                  </div>
                )}

                {(history ?? []).map((batch, i, arr) => (
                  <div
                    key={batch.id}
                    className={`grid grid-cols-[1.2fr_1.6fr_0.8fr_0.8fr_1fr] px-6 py-3.5 items-center text-[13.5px] ${
                      i < arr.length - 1 ? "border-b border-border" : ""
                    }`}
                  >
                    <div className="font-semibold">
                      {MONTHS[batch.month - 1]} {batch.year}
                    </div>
                    <div className="text-text-muted truncate" title={batch.filename}>
                      {batch.filename}
                    </div>
                    <div className="font-heading font-bold">{batch.days_created}</div>
                    <div className="font-heading font-bold">{batch.days_updated}</div>
                    <div className="text-text-muted">{formatDateTime(batch.created_at)}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      {modalOpen && (
        <Modal
          title="Upload Excel Sheet"
          subtitle="Choose the month, then pick the file"
          onClose={uploading ? () => {} : closeModal}
          width={480}
        >
          <div className="px-6.5 py-5.5 flex flex-col gap-4">
            <div className="flex flex-col sm:flex-row gap-3.5">
              <div className="flex-1">
                <FormField label="Year">
                  <select
                    value={year}
                    onChange={(e) => setYear(Number(e.target.value))}
                    className={selectClass}
                  >
                    {YEARS.map((y) => (
                      <option key={y} value={y}>
                        {y}
                      </option>
                    ))}
                  </select>
                </FormField>
              </div>
              <div className="flex-1">
                <FormField label="Month">
                  <select
                    value={month}
                    onChange={(e) => setMonth(Number(e.target.value))}
                    className={selectClass}
                  >
                    {MONTHS.map((name, i) => (
                      <option key={name} value={i + 1}>
                        {name}
                      </option>
                    ))}
                  </select>
                </FormField>
              </div>
            </div>

            <FormField label="Excel File">
              <input
                ref={fileInput}
                type="file"
                accept=".xlsx,.xlsm"
                onChange={(e) => {
                  setFile(e.target.files?.[0] ?? null);
                  setError(null);
                }}
                className="hidden"
              />
              <button
                onClick={() => fileInput.current?.click()}
                className="w-full min-h-[46px] rounded-[10px] border border-dashed border-border bg-surface-alt px-3.5 py-3 text-sm text-left"
              >
                {file ? (
                  <span className="text-text break-all">{file.name}</span>
                ) : (
                  <span className="text-text-muted">Choose a .xlsx file…</span>
                )}
              </button>
            </FormField>

            <div className="text-[12.5px] text-text-muted leading-relaxed">
              The sheets inside the file are named 1 to 31, so the app needs you to say which
              month they belong to.
            </div>

            {error && <div className="text-sm text-danger">{error}</div>}
          </div>

          <div className="flex gap-3 px-6.5 py-5 border-t border-border">
            <button
              onClick={closeModal}
              disabled={uploading}
              className="flex-1 h-[46px] rounded-[10px] border border-border bg-surface text-text font-heading font-bold text-sm disabled:opacity-60"
            >
              Cancel
            </button>
            <button
              onClick={handleUpload}
              disabled={uploading || !file}
              className="flex-[1.4] h-[46px] rounded-[10px] bg-accent text-accent-contrast font-heading font-bold text-sm disabled:opacity-60"
              style={{ boxShadow: "0 1px 2px var(--shadow)" }}
            >
              {uploading ? "Importing…" : "Upload"}
            </button>
          </div>
        </Modal>
      )}
    </>
  );
}

function ImportSummary({ result, onDismiss }: { result: ImportResult; onDismiss: () => void }) {
  const stats = [
    { label: "Days added", value: result.days_created },
    { label: "Days updated", value: result.days_updated },
    { label: "Days unchanged", value: result.days_unchanged },
    { label: "Wash entries", value: result.car_entries_written },
    { label: "Expenses", value: result.expenses_written },
    { label: "PUC entries", value: result.puc_entries_written },
    { label: "Day closings", value: result.day_closings_written },
  ];

  return (
    <div className="bg-success-soft border border-success/30 rounded-[14px] px-5 py-4">
      <div className="flex items-start justify-between gap-4">
        <div>
          <div className="font-heading font-bold text-success text-sm">
            Imported {MONTHS[result.month - 1]} {result.year}
          </div>
          <div className="text-[12.5px] text-text-muted mt-0.5 break-all">{result.filename}</div>
        </div>
        <button
          onClick={onDismiss}
          className="font-heading font-semibold text-[12.5px] text-text-muted flex-shrink-0"
        >
          Dismiss
        </button>
      </div>

      <div className="flex flex-wrap gap-x-7 gap-y-3 mt-4">
        {stats.map(({ label, value }) => (
          <div key={label}>
            <div className="font-heading font-extrabold text-lg text-text leading-none">
              {value}
            </div>
            <div className="text-[11px] tracking-wide uppercase text-text-muted mt-1">{label}</div>
          </div>
        ))}
      </div>

      {result.notes.length > 0 && (
        <ul className="mt-4 pt-3 border-t border-success/20 flex flex-col gap-1.5">
          {result.notes.map((note, i) => (
            <li key={i} className="text-[12.5px] text-text-muted">
              · {note}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
