import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { Bug, CheckCircle2, CloudOff, Paperclip, X } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import { toast } from "sonner";

import { SubScreen } from "@/components/SubScreen";
import { SoftCard } from "@/components/SoftCard";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import {
  BUG_CATEGORIES,
  BUG_SEVERITIES,
  BUG_STATUS_LABELS,
  MAX_ATTACHMENTS,
  MAX_ATTACHMENT_BYTES,
  formatBytes,
  listBugReports,
  newClientRef,
  pendingBugReports,
  submitBugReport,
  watchPendingBugReports,
  type BugReportDraft,
} from "@/data/bugReportsRepo";
import { useAuth } from "@/hooks/useAuth";
import { humanizeError } from "@/lib/analytics";
import { haptic } from "@/lib/native/haptics";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_authenticated/submit-bug")({
  head: () => ({
    meta: [
      { title: "Submit a Bug | No Contact Tracker" },
      {
        name: "description",
        content: "Report a problem with the app and help us make your reset smoother.",
      },
      { property: "og:title", content: "Submit a Bug | No Contact Tracker" },
      { property: "og:description", content: "Send us a bug report with screenshots and details." },
    ],
  }),
  component: SubmitBug,
});

const emptyDraft: BugReportDraft = {
  title: "",
  category: "other",
  description: "",
  expected_behavior: "",
  reproduction_steps: "",
  severity: "medium",
};

function SubmitBug() {
  const { user } = useAuth();
  const userId = user?.id ?? "";
  const queryClient = useQueryClient();
  const fileInput = useRef<HTMLInputElement>(null);

  const [draft, setDraft] = useState<BugReportDraft>(emptyDraft);
  const [files, setFiles] = useState<File[]>([]);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [done, setDone] = useState<"submitted" | "pending" | null>(null);
  const [showReports, setShowReports] = useState(false);
  // One ref per attempt: retries reuse it so a report can never be stored twice.
  const clientRef = useRef(newClientRef());

  useEffect(() => {
    if (!userId) return;
    return watchPendingBugReports(userId);
  }, [userId]);

  const reports = useQuery({
    queryKey: ["bug-reports", userId],
    queryFn: () => listBugReports(userId),
    enabled: Boolean(userId) && showReports,
  });

  const pending = useQuery({
    queryKey: ["bug-reports-pending", userId, done],
    queryFn: () => pendingBugReports(),
    enabled: Boolean(userId),
  });

  const patch = (next: Partial<BugReportDraft>) => setDraft((current) => ({ ...current, ...next }));

  const validate = () => {
    const next: Record<string, string> = {};
    if (draft.title.trim().length < 5) next['title'] = "Give your report a short title (5+ characters).";
    if (draft.title.trim().length > 120) next['title'] = "Keep the title under 120 characters.";
    if (draft.description.trim().length < 15)
      next['description'] = "Tell us what happened in a little more detail (15+ characters).";
    if (draft.description.trim().length > 4000)
      next['description'] = "Please keep the description under 4000 characters.";
    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const submit = useMutation({
    mutationFn: () =>
      submitBugReport(
        userId,
        {
          title: draft.title.trim(),
          category: draft.category,
          description: draft.description.trim(),
          expected_behavior: draft.expected_behavior.trim(),
          reproduction_steps: draft.reproduction_steps.trim(),
          severity: draft.severity,
        },
        files,
        clientRef.current,
      ),
    onSuccess: (result) => {
      haptic.success();
      setDone(result.status);
      if (result.status === "submitted") {
        setDraft(emptyDraft);
        setFiles([]);
        clientRef.current = newClientRef();
        void queryClient.invalidateQueries({ queryKey: ["bug-reports", userId] });
      }
      void queryClient.invalidateQueries({ queryKey: ["bug-reports-pending", userId] });
    },
    onError: (error) => toast.error(humanizeError(error)),
  });

  const addFiles = (picked: FileList | null) => {
    if (!picked) return;
    const accepted: File[] = [];
    for (const file of Array.from(picked)) {
      if (files.length + accepted.length >= MAX_ATTACHMENTS) {
        toast.error(`You can attach up to ${MAX_ATTACHMENTS} files.`);
        break;
      }
      if (file.size > MAX_ATTACHMENT_BYTES) {
        toast.error(`${file.name} is larger than ${formatBytes(MAX_ATTACHMENT_BYTES)}.`);
        continue;
      }
      accepted.push(file);
    }
    if (accepted.length) setFiles((current) => [...current, ...accepted]);
  };

  const totalSize = useMemo(() => files.reduce((sum, file) => sum + file.size, 0), [files]);

  if (done) {
    return (
      <SubScreen title="Thank you" description="Your report is on its way to us.">
        <SoftCard className="space-y-4 text-center">
          {done === "submitted" ? (
            <CheckCircle2 className="mx-auto size-12 text-primary" aria-hidden />
          ) : (
            <CloudOff className="mx-auto size-12 text-muted-foreground" aria-hidden />
          )}
          <p className="text-base font-medium">
            {done === "submitted"
              ? "Bug submitted successfully. Thank you for helping us improve the app."
              : "You're offline — your report is saved and will be sent automatically once you reconnect."}
          </p>
          <Button
            className="press h-12 w-full rounded-2xl"
            onClick={() => {
              setDone(null);
              setShowReports(true);
            }}
          >
            View my bug reports
          </Button>
          <Button
            variant="secondary"
            className="press h-11 w-full rounded-2xl"
            onClick={() => setDone(null)}
          >
            Report another bug
          </Button>
        </SoftCard>
      </SubScreen>
    );
  }

  const pendingCount = pending.data?.length ?? 0;

  return (
    <SubScreen
      title="Submit a Bug"
      description="Something not working? Tell us what happened and we'll look into it."
    >
      <div className="space-y-4">
        <SoftCard className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="bug-title">Bug title</Label>
            <Input
              id="bug-title"
              value={draft.title}
              maxLength={120}
              placeholder="Short summary of the problem"
              onChange={(event) => patch({ title: event.target.value })}
              className="h-12 rounded-2xl"
            />
            {errors['title'] ? <p className="text-xs text-destructive">{errors['title']}</p> : null}
          </div>

          <div className="space-y-1.5">
            <Label>Category</Label>
            <Select value={draft.category} onValueChange={(value) => patch({ category: value })}>
              <SelectTrigger className="h-12 rounded-2xl">
                <SelectValue placeholder="Pick a category" />
              </SelectTrigger>
              <SelectContent>
                {BUG_CATEGORIES.map((item) => (
                  <SelectItem key={item.value} value={item.value}>
                    {item.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="bug-description">What happened?</Label>
            <Textarea
              id="bug-description"
              value={draft.description}
              maxLength={4000}
              rows={4}
              placeholder="Describe the issue you ran into"
              onChange={(event) => patch({ description: event.target.value })}
              className="rounded-2xl"
            />
            {errors['description'] ? (
              <p className="text-xs text-destructive">{errors['description']}</p>
            ) : null}
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="bug-expected">What did you expect to happen? (optional)</Label>
            <Textarea
              id="bug-expected"
              value={draft.expected_behavior}
              maxLength={2000}
              rows={3}
              onChange={(event) => patch({ expected_behavior: event.target.value })}
              className="rounded-2xl"
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="bug-steps">Steps to reproduce (optional)</Label>
            <Textarea
              id="bug-steps"
              value={draft.reproduction_steps}
              maxLength={2000}
              rows={3}
              placeholder="1. Open… 2. Tap… 3. See…"
              onChange={(event) => patch({ reproduction_steps: event.target.value })}
              className="rounded-2xl"
            />
          </div>

          <div className="space-y-2">
            <Label>Severity</Label>
            <div className="flex flex-wrap gap-2">
              {BUG_SEVERITIES.map((item) => (
                <button
                  key={item.value}
                  type="button"
                  onClick={() => patch({ severity: item.value })}
                  className={cn(
                    "press rounded-full border px-4 py-2 text-sm",
                    draft.severity === item.value
                      ? "border-transparent bg-mint text-on-tint"
                      : "border-border text-muted-foreground",
                  )}
                >
                  {item.label}
                </button>
              ))}
            </div>
          </div>
        </SoftCard>

        <SoftCard className="space-y-3">
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="text-sm font-medium">Attachments</p>
              <p className="text-xs text-muted-foreground">
                Up to {MAX_ATTACHMENTS} files · {formatBytes(MAX_ATTACHMENT_BYTES)} each
              </p>
            </div>
            <Button
              type="button"
              variant="secondary"
              className="press h-10 rounded-2xl"
              onClick={() => {
                haptic.light();
                fileInput.current?.click();
              }}
            >
              <Paperclip className="mr-1 size-4" aria-hidden /> Add
            </Button>
          </div>
          <input
            ref={fileInput}
            type="file"
            multiple
            accept="image/*,video/*,text/plain,application/pdf,.log,.txt,.json"
            className="hidden"
            onChange={(event) => {
              addFiles(event.target.files);
              event.target.value = "";
            }}
          />
          {files.length === 0 ? (
            <p className="text-xs text-muted-foreground">
              Screenshots, screen recordings or log files help us a lot.
            </p>
          ) : (
            <ul className="space-y-2">
              {files.map((file, index) => (
                <li
                  key={`${file.name}-${index}`}
                  className="flex items-center gap-3 rounded-2xl border border-border px-3 py-2"
                >
                  {file.type.startsWith("image/") ? (
                    <img
                      src={URL.createObjectURL(file)}
                      alt={file.name}
                      className="size-10 rounded-xl object-cover"
                    />
                  ) : (
                    <span className="flex size-10 items-center justify-center rounded-xl bg-muted">
                      <Paperclip className="size-4 text-muted-foreground" aria-hidden />
                    </span>
                  )}
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-sm">{file.name}</span>
                    <span className="block text-xs text-muted-foreground">
                      {formatBytes(file.size)}
                    </span>
                  </span>
                  <button
                    type="button"
                    aria-label={`Remove ${file.name}`}
                    onClick={() => setFiles((current) => current.filter((_, i) => i !== index))}
                    className="press flex size-8 items-center justify-center rounded-full bg-muted"
                  >
                    <X className="size-4" aria-hidden />
                  </button>
                </li>
              ))}
            </ul>
          )}
          {files.length > 0 ? (
            <p className="text-xs text-muted-foreground">Total {formatBytes(totalSize)}</p>
          ) : null}
        </SoftCard>

        <p className="px-1 text-xs text-muted-foreground">
          We automatically include your app version, device model, Android/OS version, language,
          network status and the time of the report. No passwords or account tokens are ever sent.
        </p>

        {submit.isError ? (
          <SoftCard className="space-y-3 border border-destructive/30">
            <p className="text-sm">
              We couldn&apos;t send your report. Your text and attachments are still here.
            </p>
            <Button
              className="press h-11 w-full rounded-2xl"
              disabled={submit.isPending}
              onClick={() => submit.mutate()}
            >
              Retry
            </Button>
          </SoftCard>
        ) : null}

        <Button
          className="press h-12 w-full rounded-2xl"
          disabled={submit.isPending || !userId}
          onClick={() => {
            haptic.light();
            if (validate()) submit.mutate();
          }}
        >
          <Bug className="mr-2 size-4" aria-hidden />
          {submit.isPending ? "Submitting…" : "Submit Bug"}
        </Button>

        <Button
          variant="secondary"
          className="press h-11 w-full rounded-2xl"
          onClick={() => setShowReports((value) => !value)}
        >
          {showReports ? "Hide my bug reports" : "My Bug Reports"}
          {pendingCount > 0 ? ` (${pendingCount} pending)` : ""}
        </Button>

        {showReports ? (
          <div className="space-y-3">
            {pending.data?.map((item) => (
              <SoftCard key={item.client_ref} className="space-y-1">
                <div className="flex items-center justify-between gap-3">
                  <p className="min-w-0 flex-1 truncate text-sm font-medium">{item.draft.title}</p>
                  <span className="rounded-full bg-muted px-3 py-1 text-xs">Pending</span>
                </div>
                <p className="text-xs text-muted-foreground">
                  Saved offline · will sync automatically
                </p>
              </SoftCard>
            ))}
            {reports.isLoading ? (
              <p className="text-sm text-muted-foreground">Loading your reports…</p>
            ) : null}
            {(reports.data ?? []).map((report) => (
              <SoftCard key={report.id} className="space-y-1">
                <div className="flex items-center justify-between gap-3">
                  <p className="min-w-0 flex-1 truncate text-sm font-medium">{report.title}</p>
                  <span className="rounded-full bg-mint px-3 py-1 text-xs text-on-tint">
                    {BUG_STATUS_LABELS[report.status] ?? report.status}
                  </span>
                </div>
                <p className="text-xs text-muted-foreground">
                  {new Date(report.created_at).toLocaleString()} ·{" "}
                  {BUG_CATEGORIES.find((item) => item.value === report.category)?.label ??
                    report.category}
                  {report.attachments.length
                    ? ` · ${report.attachments.length} attachment${report.attachments.length > 1 ? "s" : ""}`
                    : ""}
                </p>
              </SoftCard>
            ))}
            {!reports.isLoading && (reports.data ?? []).length === 0 && pendingCount === 0 ? (
              <p className="text-sm text-muted-foreground">You haven&apos;t reported a bug yet.</p>
            ) : null}
          </div>
        ) : null}
      </div>
    </SubScreen>
  );
}
