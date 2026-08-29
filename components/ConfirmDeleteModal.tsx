"use client";

import { Modal } from "./Modal";

export function ConfirmDeleteModal({
  title = "Delete this entry?",
  message,
  onCancel,
  onConfirm,
  loading,
}: {
  title?: string;
  message: string;
  onCancel: () => void;
  onConfirm: () => void;
  loading?: boolean;
}) {
  return (
    <Modal title={title} onClose={onCancel} width={380}>
      <div className="px-6.5 py-5.5">
        <p className="text-sm text-text-muted">{message}</p>
      </div>
      <div className="flex gap-3 px-6.5 py-5 border-t border-border">
        <button
          onClick={onCancel}
          className="flex-1 h-[46px] rounded-[10px] border border-border bg-surface text-text font-heading font-bold text-sm"
        >
          Cancel
        </button>
        <button
          onClick={onConfirm}
          disabled={loading}
          className="flex-[1.4] h-[46px] rounded-[10px] bg-danger text-white font-heading font-bold text-sm disabled:opacity-60"
        >
          {loading ? "Deleting…" : "Delete"}
        </button>
      </div>
    </Modal>
  );
}
