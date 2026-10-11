"use client";

import { useQueryClient } from "@tanstack/react-query";
import { Check, Copy, Download, FileText, Upload } from "lucide-react";
import { useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Callout } from "@/components/ui/status";
import { useToast } from "@/components/ui/toast";
import { ApiError, orgPath } from "@/lib/api";
import { dateTimeLabel } from "@/lib/format";
import { useOrg } from "@/lib/org";
import type { ObligationDocumentDto } from "@/lib/types";

const ACCEPT = ["application/pdf", "image/png", "image/jpeg", "text/csv", "text/plain"];
const MAX_BYTES = 5 * 1024 * 1024;

export function fileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
}

/** Multipart upload with progress events (fetch has no upload progress). Same-origin, so the session cookie is sent. */
function uploadWithProgress(url: string, file: File, onProgress: (pct: number) => void): Promise<ObligationDocumentDto> {
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.open("POST", url);
    xhr.setRequestHeader("accept", "application/json");
    xhr.upload.onprogress = (e) => {
      if (e.lengthComputable) onProgress(Math.round((e.loaded / e.total) * 100));
    };
    xhr.onerror = () => reject(new ApiError(0, "network_error", "Can't reach TokenIQ. Check your connection and try again."));
    xhr.onload = () => {
      let data: unknown = null;
      try {
        data = xhr.responseText ? JSON.parse(xhr.responseText) : null;
      } catch {
        data = null;
      }
      if (xhr.status >= 200 && xhr.status < 300) return resolve(data as ObligationDocumentDto);
      const e = (data as { error?: { code?: string; message?: string; details?: unknown } } | null)?.error;
      reject(new ApiError(xhr.status, e?.code ?? `http_${xhr.status}`, e?.message ?? (xhr.status === 413 ? "Files must be 5 MB or smaller." : "The upload failed. Nothing was saved."), e?.details));
    };
    const form = new FormData();
    form.append("file", file);
    xhr.send(form);
  });
}

function Sha({ sha }: { sha: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <span className="inline-flex items-center gap-1">
      <span className="font-mono text-xs text-text-3" title={`SHA-256 ${sha}`}>
        sha256 {sha.slice(0, 10)}…{sha.slice(-4)}
      </span>
      <button
        type="button"
        className="-my-1 inline-flex size-6 items-center justify-center rounded text-text-3 hover:text-text"
        aria-label={copied ? "Copied" : "Copy full SHA-256 fingerprint"}
        onClick={async () => {
          await navigator.clipboard.writeText(sha);
          setCopied(true);
          setTimeout(() => setCopied(false), 1500);
        }}
      >
        {copied ? <Check className="size-3.5 text-success" aria-hidden="true" /> : <Copy className="size-3.5" aria-hidden="true" />}
      </button>
    </span>
  );
}

export function ObligationDocuments({ obligationId, documents, canUpload }: { obligationId: string; documents: ObligationDocumentDto[]; canUpload: boolean }) {
  const { orgId } = useOrg();
  const qc = useQueryClient();
  const { toast } = useToast();
  const input = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState<{ name: string; pct: number } | null>(null);
  const [error, setError] = useState<string | null>(null);

  const onFile = async (file: File) => {
    setError(null);
    if (!ACCEPT.includes(file.type)) return setError(`${file.name} is not a PDF, PNG, JPEG, CSV or plain-text file.`);
    if (file.size > MAX_BYTES) return setError(`${file.name} is ${fileSize(file.size)}. Files must be 5 MB or smaller.`);
    setUploading({ name: file.name, pct: 0 });
    try {
      const doc = await uploadWithProgress(orgPath(orgId, `/obligations/${encodeURIComponent(obligationId)}/documents`), file, (pct) => setUploading({ name: file.name, pct }));
      toast({ id: `doc-${doc.id}`, tone: "success", title: "Document attached", description: `${doc.filename} · fingerprint ${doc.sha256.slice(0, 10)}…` });
      qc.invalidateQueries({ queryKey: ["org", orgId, `/obligations/${obligationId}`] });
      qc.invalidateQueries({ queryKey: ["org", orgId, "/obligations?status=all"] });
    } catch (err) {
      setError(err instanceof ApiError && err.status === 403 ? "Your role can't attach documents." : (err as Error).message);
    } finally {
      setUploading(null);
      if (input.current) input.current.value = "";
    }
  };

  return (
    <div>
      {documents.length === 0 && !uploading ? (
        <p className="text-[13px] text-text-2">No documents yet. Attach the invoice, contract or quote so reviewers can check the amount.</p>
      ) : (
        <ul className="divide-y divide-hairline">
          {documents.map((d) => (
            <li key={d.id} className="flex items-center gap-3 py-2.5">
              <FileText className="size-4 shrink-0 text-text-3" aria-hidden="true" />
              <div className="min-w-0 flex-1">
                <div className="truncate text-[13px] font-medium text-text">{d.filename}</div>
                <div className="flex flex-wrap items-center gap-x-2 text-xs text-text-3">
                  <span>{fileSize(d.sizeBytes)}</span>
                  <span>·</span>
                  <span>{dateTimeLabel(d.createdAt)}</span>
                  <span>·</span>
                  <Sha sha={d.sha256} />
                </div>
              </div>
              <Button variant="ghost" size="sm" asChild>
                <a href={orgPath(orgId, `/obligations/${encodeURIComponent(obligationId)}/documents/${encodeURIComponent(d.id)}`)} download={d.filename} aria-label={`Download ${d.filename}`}>
                  <Download className="size-4" aria-hidden="true" />
                  <span className="hidden sm:inline">Download</span>
                </a>
              </Button>
            </li>
          ))}
          {uploading && (
            <li className="py-2.5" role="status" aria-live="polite">
              <div className="flex items-center justify-between text-[13px]">
                <span className="truncate font-medium text-text">{uploading.name}</span>
                <span className="num text-xs text-text-2">{uploading.pct < 100 ? `Uploading ${uploading.pct}%` : "Checking and fingerprinting…"}</span>
              </div>
              <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-sunken" role="progressbar" aria-valuemin={0} aria-valuemax={100} aria-valuenow={uploading.pct} aria-label={`Uploading ${uploading.name}`}>
                <div className="h-full rounded-full bg-accent transition-[width] duration-[var(--dur-fast)]" style={{ width: `${uploading.pct}%` }} />
              </div>
            </li>
          )}
        </ul>
      )}
      {error && (
        <Callout tone="danger" className="mt-3" title="Not uploaded">
          {error}
        </Callout>
      )}
      {canUpload && (
        <div className="mt-3 flex flex-wrap items-center gap-3">
          <input ref={input} type="file" accept={ACCEPT.join(",")} className="sr-only" id={`doc-${obligationId}`} aria-label="Attach document" aria-hidden="true" onChange={(e) => e.target.files?.[0] && onFile(e.target.files[0])} disabled={!!uploading} tabIndex={-1} />
          <Button variant="secondary" size="sm" onClick={() => input.current?.click()} loading={!!uploading} loadingLabel="Uploading">
            {!uploading && <Upload className="size-4" aria-hidden="true" />}
            Attach document
          </Button>
          <span className="text-xs text-text-3">PDF, PNG, JPEG, CSV or text, up to 5 MB. Stored with a SHA-256 fingerprint; never read by the copilot.</span>
        </div>
      )}
    </div>
  );
}
