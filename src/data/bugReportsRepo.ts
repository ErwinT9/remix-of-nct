import { supabase } from "@/integrations/supabase/client";
import type { Json } from "@/integrations/supabase/types";
import { collectDiagnostics, type Diagnostics } from "@/lib/diagnostics";
import { storage } from "@/lib/native/storage";
import { isOnline, subscribeNetwork } from "@/lib/offline/network";

export const BUG_BUCKET = "bug-attachments";
export const MAX_ATTACHMENT_BYTES = 25 * 1024 * 1024; // 25 MB per file (bucket limit)
export const MAX_ATTACHMENTS = 5;
/** Only reports whose attachments fit this budget keep their files offline. */
const OFFLINE_ATTACHMENT_BUDGET = 6 * 1024 * 1024;
const PENDING_KEY = "nc:bug-reports:pending";

export const BUG_CATEGORIES = [
  { value: "crash", label: "App crash" },
  { value: "ui", label: "UI/design issue" },
  { value: "feature", label: "Feature not working" },
  { value: "performance", label: "Performance issue" },
  { value: "media", label: "Audio/video issue" },
  { value: "account", label: "Login/account issue" },
  { value: "notification", label: "Notification issue" },
  { value: "other", label: "Other" },
] as const;

export const BUG_SEVERITIES = [
  { value: "low", label: "Low" },
  { value: "medium", label: "Medium" },
  { value: "high", label: "High" },
  { value: "critical", label: "Critical" },
] as const;

export const BUG_STATUS_LABELS: Record<string, string> = {
  submitted: "Submitted",
  under_review: "Under Review",
  in_progress: "In Progress",
  resolved: "Resolved",
  closed: "Closed",
};

export type BugAttachmentRef = {
  path: string;
  name: string;
  size: number;
  type: string;
};

export type BugReportDraft = {
  title: string;
  category: string;
  description: string;
  expected_behavior: string;
  reproduction_steps: string;
  severity: string;
};

export type BugReportRow = {
  id: string;
  client_ref: string;
  title: string;
  category: string;
  description: string;
  expected_behavior: string | null;
  reproduction_steps: string | null;
  severity: string;
  status: string;
  attachments: BugAttachmentRef[];
  created_at: string;
};

type StoredAttachment = { name: string; size: number; type: string; dataUrl: string | null };

export type PendingBugReport = {
  client_ref: string;
  created_at: string;
  draft: BugReportDraft;
  diagnostics: Diagnostics;
  attachments: StoredAttachment[];
};

export function newClientRef(): string {
  return `bug_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 10)}`;
}

export function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function fileToDataUrl(file: File): Promise<string | null> {
  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = () => resolve(null);
    reader.readAsDataURL(file);
  });
}

async function dataUrlToBlob(dataUrl: string): Promise<Blob> {
  return (await fetch(dataUrl)).blob();
}

function sanitizeName(name: string): string {
  return name.replace(/[^a-zA-Z0-9._-]/g, "_").slice(-80) || "attachment";
}

/* -------------------------------------------------------------- pending queue */

export async function pendingBugReports(): Promise<PendingBugReport[]> {
  return (await storage.get<PendingBugReport[]>(PENDING_KEY, [])) ?? [];
}

async function writePending(items: PendingBugReport[]): Promise<void> {
  await storage.set(PENDING_KEY, items);
}

async function queuePending(item: PendingBugReport): Promise<void> {
  const items = await pendingBugReports();
  if (items.some((row) => row.client_ref === item.client_ref)) return;
  await writePending([...items, item]);
}

async function dropPending(clientRef: string): Promise<void> {
  const items = await pendingBugReports();
  await writePending(items.filter((row) => row.client_ref !== clientRef));
}

/* ------------------------------------------------------------------- upload */

async function uploadAttachments(
  userId: string,
  clientRef: string,
  files: { name: string; size: number; type: string; body: Blob }[],
): Promise<BugAttachmentRef[]> {
  const refs: BugAttachmentRef[] = [];
  for (const [index, file] of files.entries()) {
    const path = `${userId}/${clientRef}/${index}-${sanitizeName(file.name)}`;
    const { error } = await supabase.storage
      .from(BUG_BUCKET)
      .upload(path, file.body, { upsert: true, contentType: file.type || "application/octet-stream" });
    if (error) throw error;
    refs.push({ path, name: file.name, size: file.size, type: file.type });
  }
  return refs;
}

async function insertReport(
  userId: string,
  pending: PendingBugReport,
  attachments: BugAttachmentRef[],
): Promise<void> {
  const { draft, diagnostics } = pending;
  const { error } = await supabase.from("bug_reports").insert({
    user_id: userId,
    client_ref: pending.client_ref,
    title: draft.title,
    category: draft.category,
    description: draft.description,
    expected_behavior: draft.expected_behavior || null,
    reproduction_steps: draft.reproduction_steps || null,
    severity: draft.severity,
    platform: diagnostics.platform,
    app_version: diagnostics.app_version,
    os_version: diagnostics.os_version,
    network_status: diagnostics.network_status,
    device_info: diagnostics.device_info as Json,
    attachments: attachments as unknown as Json,
    created_at: pending.created_at,
  });
  // A duplicate client_ref means the report already landed (retry/sync race).
  if (error && error.code !== "23505") throw error;
}

/* ------------------------------------------------------------------- submit */

export type SubmitResult = { status: "submitted" | "pending" };

export async function submitBugReport(
  userId: string,
  draft: BugReportDraft,
  files: File[],
  clientRef: string,
): Promise<SubmitResult> {
  const diagnostics = await collectDiagnostics();
  const created_at = new Date().toISOString();

  if (!isOnline()) {
    let budget = OFFLINE_ATTACHMENT_BUDGET;
    const stored: StoredAttachment[] = [];
    for (const file of files) {
      const fits = file.size <= budget;
      stored.push({
        name: file.name,
        size: file.size,
        type: file.type,
        dataUrl: fits ? await fileToDataUrl(file) : null,
      });
      if (fits) budget -= file.size;
    }
    await queuePending({ client_ref: clientRef, created_at, draft, diagnostics, attachments: stored });
    return { status: "pending" };
  }

  const refs = await uploadAttachments(
    userId,
    clientRef,
    files.map((file) => ({ name: file.name, size: file.size, type: file.type, body: file })),
  );
  await insertReport(userId, { client_ref: clientRef, created_at, draft, diagnostics, attachments: [] }, refs);
  await dropPending(clientRef);
  return { status: "submitted" };
}

/** Uploads every locally queued report. Safe to call repeatedly. */
export async function flushPendingBugReports(userId: string): Promise<number> {
  if (!userId || !isOnline()) return 0;
  const items = await pendingBugReports();
  let sent = 0;
  for (const item of items) {
    try {
      const uploadable: { name: string; size: number; type: string; body: Blob }[] = [];
      for (const attachment of item.attachments) {
        if (!attachment.dataUrl) continue;
        uploadable.push({
          name: attachment.name,
          size: attachment.size,
          type: attachment.type,
          body: await dataUrlToBlob(attachment.dataUrl),
        });
      }
      const refs = await uploadAttachments(userId, item.client_ref, uploadable);
      await insertReport(userId, item, refs);
      await dropPending(item.client_ref);
      sent += 1;
    } catch {
      // Keep it queued; the next reconnect retries it.
    }
  }
  return sent;
}

let watching = false;
/** Retries queued reports as soon as the device is back online. */
export function watchPendingBugReports(userId: string): () => void {
  void flushPendingBugReports(userId);
  if (watching) return () => {};
  watching = true;
  const off = subscribeNetwork((online) => {
    if (online) void flushPendingBugReports(userId);
  });
  return () => {
    watching = false;
    off();
  };
}

/* --------------------------------------------------------------------- list */

export async function listBugReports(userId: string): Promise<BugReportRow[]> {
  const { data, error } = await supabase
    .from("bug_reports")
    .select(
      "id, client_ref, title, category, description, expected_behavior, reproduction_steps, severity, status, attachments, created_at",
    )
    .eq("user_id", userId)
    .order("created_at", { ascending: false })
    .limit(50);
  if (error) throw error;
  return (data ?? []).map((row) => ({
    ...row,
    attachments: Array.isArray(row.attachments) ? (row.attachments as BugAttachmentRef[]) : [],
  })) as BugReportRow[];
}
