import { createRoute, z } from "@hono/zod-openapi";
import { addDays, compareIso, decimalString, expandOccurrences, nextDueDate, toIsoDate, wadToString } from "@tokeniq/core";
import { and, asc, desc, eq, schema } from "@tokeniq/db";
import { createHash } from "node:crypto";
import type { App, Deps } from "../context.js";
import { audit } from "../lib/audit.js";
import { assertCan } from "../lib/authz.js";
import { badRequest, notFound } from "../lib/errors.js";
import { Address, body, clientInfo, errors, Id, IsoDateString, json, orgParams, requireUser } from "../lib/route.js";
import { obligationFromRow, loadOrgState } from "../services/state.js";
import { occurrenceDto } from "../services/dto.js";
import { notifyRoles } from "../services/notify.js";

const tags = ["Obligations"];

export const CATEGORIES = ["payroll", "contractors", "vendors", "infrastructure", "marketing", "legal", "grants", "taxes", "debt", "operations", "other"] as const;

const RecurrenceSchema = z.discriminatedUnion("freq", [
  z.object({ freq: z.literal("once") }),
  z.object({
    freq: z.enum(["weekly", "monthly", "quarterly", "yearly"]),
    interval: z.number().int().min(1).max(12).default(1),
    until: IsoDateString.nullable().optional(),
    count: z.number().int().min(1).max(500).nullable().optional(),
  }),
]);

const ObligationInput = z
  .object({
    title: z.string().trim().min(2).max(120),
    category: z.enum(CATEGORIES),
    direction: z.enum(["outflow", "inflow"]).default("outflow"),
    amount: decimalString.refine((v) => Number(v) > 0, "Amount must be greater than zero"),
    currency: z.enum(["USD", "EUR"]).default("USD"),
    firstDueDate: IsoDateString,
    recurrence: RecurrenceSchema,
    certainty: z.enum(["estimate", "committed", "invoiced"]),
    priority: z.enum(["critical", "high", "normal", "low"]).default("normal"),
    counterparty: z.string().trim().max(120).nullable().optional(),
    recipientAddress: Address.nullable().optional(),
    recipientChainId: z.number().int().nullable().optional(),
    paymentAsset: z.string().max(16).nullable().optional(),
    invoiceNumber: z.string().trim().max(64).nullable().optional(),
    notes: z.string().trim().max(2000).nullable().optional(),
  })
  .openapi("ObligationInput");

const ObligationSchema = z
  .object({
    id: z.string(),
    title: z.string(),
    category: z.string(),
    direction: z.string(),
    amount: z.string(),
    currency: z.string(),
    firstDueDate: z.string(),
    recurrence: z.any(),
    certainty: z.string(),
    priority: z.string(),
    status: z.string(),
    counterparty: z.string().nullable(),
    recipientAddress: z.string().nullable(),
    /** When the payee address was last set or changed. Payments to it are held for the policy's newPayeeHoldHours. */
    recipientSetAt: z.string().nullable(),
    recipientChainId: z.number().nullable(),
    paymentAsset: z.string().nullable(),
    invoiceNumber: z.string().nullable(),
    notes: z.string().nullable(),
    nextDueDate: z.string().nullable(),
    documents: z.number(),
    createdAt: z.string(),
    updatedAt: z.string(),
  })
  .openapi("Obligation");

type Row = typeof schema.obligations.$inferSelect;

function toDto(r: Row, asOf: string, settled: Array<{ obligationId: string; dueDate: string }>, documents = 0) {
  return {
    id: r.id,
    title: r.title,
    category: r.category,
    direction: r.direction,
    amount: r.amount,
    currency: r.currency,
    firstDueDate: r.firstDueDate,
    recurrence: r.recurrence,
    certainty: r.certainty,
    priority: r.priority,
    status: r.status,
    counterparty: r.counterparty,
    recipientAddress: r.recipientAddress,
    recipientSetAt: r.recipientSetAt?.toISOString() ?? null,
    recipientChainId: r.recipientChainId,
    paymentAsset: r.paymentAsset,
    invoiceNumber: r.invoiceNumber,
    notes: r.notes,
    nextDueDate: r.status === "active" ? nextDueDate(obligationFromRow(r), asOf, settled) : null,
    documents,
    createdAt: r.createdAt.toISOString(),
    updatedAt: r.updatedAt.toISOString(),
  };
}

const ALLOWED_DOC_TYPES = new Set(["application/pdf", "image/png", "image/jpeg", "text/csv", "text/plain"]);
const MAX_DOC_BYTES = 5 * 1024 * 1024;

export function registerObligations(app: App, deps: Deps) {
  const { db } = deps;

  async function settledFor(orgId: string) {
    return db.select({ obligationId: schema.payments.obligationId, dueDate: schema.payments.dueDate }).from(schema.payments).where(eq(schema.payments.organizationId, orgId));
  }

  async function getRow(orgId: string, id: string) {
    const [row] = await db.select().from(schema.obligations).where(and(eq(schema.obligations.id, id), eq(schema.obligations.organizationId, orgId))).limit(1);
    if (!row) throw notFound("Obligation");
    return row;
  }

  app.openapi(
    createRoute({
      method: "get",
      path: "/api/v1/orgs/{orgId}/obligations",
      tags,
      summary: "List obligations",
      request: { params: orgParams, query: z.object({ status: z.enum(["active", "paused", "cancelled", "completed", "all"]).default("all") }) },
      responses: { 200: json(z.object({ obligations: z.array(ObligationSchema) })), ...errors },
    }),
    async (c) => {
      const m = c.get("member");
      const { status } = c.req.valid("query");
      const where = status === "all" ? eq(schema.obligations.organizationId, m.organizationId) : and(eq(schema.obligations.organizationId, m.organizationId), eq(schema.obligations.status, status));
      const [rows, settled, docs] = await Promise.all([
        db.select().from(schema.obligations).where(where).orderBy(asc(schema.obligations.firstDueDate)),
        settledFor(m.organizationId),
        db.select({ obligationId: schema.obligationDocuments.obligationId }).from(schema.obligationDocuments).where(eq(schema.obligationDocuments.organizationId, m.organizationId)),
      ]);
      const docCount = new Map<string, number>();
      for (const d of docs) docCount.set(d.obligationId, (docCount.get(d.obligationId) ?? 0) + 1);
      const asOf = toIsoDate(deps.now());
      return c.json({ obligations: rows.map((r) => toDto(r, asOf, settled, docCount.get(r.id) ?? 0)) }, 200);
    },
  );

  app.openapi(
    createRoute({
      method: "get",
      path: "/api/v1/orgs/{orgId}/obligations/schedule",
      tags,
      summary: "Upcoming and overdue occurrences with payment status",
      request: { params: orgParams, query: z.object({ days: z.coerce.number().int().min(7).max(366).default(90) }) },
      responses: { 200: json(z.object({ asOf: z.string(), through: z.string(), occurrences: z.array(z.any()), settled: z.array(z.any()) })), ...errors },
    }),
    async (c) => {
      const m = c.get("member");
      const { days } = c.req.valid("query");
      const state = await loadOrgState(db, m.organizationId, deps.now());
      const through = addDays(state.asOf, days);
      const occurrences = expandOccurrences(state.obligations, { asOf: state.asOf, through, settled: state.settled, fx: state.fx });
      const payments = await db
        .select()
        .from(schema.payments)
        .where(eq(schema.payments.organizationId, m.organizationId))
        .orderBy(desc(schema.payments.dueDate))
        .limit(200);
      const titles = new Map(state.obligationRows.map((o) => [o.id, o.title]));
      return c.json(
        {
          asOf: state.asOf,
          through,
          occurrences: occurrences.map(occurrenceDto),
          settled: payments
            .filter((p) => compareIso(p.dueDate, addDays(state.asOf, -120)) >= 0)
            .map((p) => ({ id: p.id, obligationId: p.obligationId, title: titles.get(p.obligationId) ?? "", dueDate: p.dueDate, status: p.status, txHash: p.txHash, chainId: p.chainId, verifiedAt: p.verifiedAt?.toISOString() ?? null, amount: p.amount })),
        },
        200,
      );
    },
  );

  app.openapi(
    createRoute({ method: "post", path: "/api/v1/orgs/{orgId}/obligations", tags, summary: "Record an obligation", request: { params: orgParams, ...body(ObligationInput) }, responses: { 201: json(ObligationSchema), ...errors } }),
    async (c) => {
      const m = c.get("member");
      const user = requireUser(c);
      assertCan(m.role, "obligations.write");
      const input = c.req.valid("json");
      if (input.recurrence.freq !== "once" && input.recurrence.until && compareIso(input.recurrence.until, input.firstDueDate) < 0) {
        throw badRequest("invalid_recurrence", "The end date must be on or after the first due date");
      }
      const today = toIsoDate(deps.now());
      const row = await db.transaction(async (tx) => {
        const [r] = await tx
          .insert(schema.obligations)
          .values({
            organizationId: m.organizationId,
            ...input,
            recipientAddress: input.recipientAddress?.toLowerCase() ?? null,
            recipientSetAt: input.recipientAddress ? deps.now() : null,
            recipientSetBy: input.recipientAddress ? user.id : null,
            // History before today is never treated as owed, unless the first due date is earlier (an overdue one-off).
            trackFrom: compareIso(input.firstDueDate, today) < 0 ? input.firstDueDate : today,
            status: "active",
            createdBy: user.id,
          })
          .returning();
        await audit(tx, { organizationId: m.organizationId, actorUserId: user.id, action: "obligation.created", targetType: "obligation", targetId: r!.id, data: { title: input.title, amount: input.amount, currency: input.currency, certainty: input.certainty }, ...clientInfo(c) });
        return r!;
      });
      return c.json(toDto(row, today, []), 201);
    },
  );

  app.openapi(
    createRoute({
      method: "get",
      path: "/api/v1/orgs/{orgId}/obligations/{id}",
      tags,
      summary: "Obligation with upcoming occurrences, payments and documents",
      request: { params: orgParams.extend({ id: Id }) },
      responses: { 200: json(z.object({ obligation: ObligationSchema, upcoming: z.array(z.any()), payments: z.array(z.any()), documents: z.array(z.any()) })), ...errors },
    }),
    async (c) => {
      const m = c.get("member");
      const { id } = c.req.valid("param");
      const row = await getRow(m.organizationId, id);
      const asOf = toIsoDate(deps.now());
      const [settled, payments, documents] = await Promise.all([
        settledFor(m.organizationId),
        db.select().from(schema.payments).where(eq(schema.payments.obligationId, id)).orderBy(desc(schema.payments.dueDate)),
        db
          .select({ id: schema.obligationDocuments.id, filename: schema.obligationDocuments.filename, contentType: schema.obligationDocuments.contentType, sizeBytes: schema.obligationDocuments.sizeBytes, sha256: schema.obligationDocuments.sha256, createdAt: schema.obligationDocuments.createdAt })
          .from(schema.obligationDocuments)
          .where(eq(schema.obligationDocuments.obligationId, id)),
      ]);
      const upcoming = expandOccurrences([obligationFromRow(row)], { asOf, through: addDays(asOf, 366), settled }).slice(0, 12);
      return c.json(
        {
          obligation: toDto(row, asOf, settled, documents.length),
          upcoming: upcoming.map((o) => ({ dueDate: o.dueDate, overdue: o.overdue, amount: wadToString(o.amount), currency: o.currency })),
          payments: payments.map((p) => ({ id: p.id, dueDate: p.dueDate, status: p.status, txHash: p.txHash, chainId: p.chainId, amount: p.amount, tokenAmountRaw: p.tokenAmountRaw, assetSymbol: p.assetSymbol, verifiedAt: p.verifiedAt?.toISOString() ?? null, verification: p.verification, note: p.note, createdAt: p.createdAt.toISOString() })),
          documents: documents.map((d) => ({ ...d, createdAt: d.createdAt.toISOString() })),
        },
        200,
      );
    },
  );

  app.openapi(
    createRoute({
      method: "patch",
      path: "/api/v1/orgs/{orgId}/obligations/{id}",
      tags,
      summary: "Update an obligation",
      request: { params: orgParams.extend({ id: Id }), ...body(ObligationInput.partial().extend({ status: z.enum(["active", "paused", "cancelled", "completed"]).optional() })) },
      responses: { 200: json(ObligationSchema), ...errors },
    }),
    async (c) => {
      const m = c.get("member");
      const user = requireUser(c);
      assertCan(m.role, "obligations.write");
      const { id } = c.req.valid("param");
      const input = c.req.valid("json");
      const before = await getRow(m.organizationId, id);
      const recipient = input.recipientAddress === undefined ? undefined : (input.recipientAddress?.toLowerCase() ?? null);
      // A new or changed payee address restarts the payment hold (approval policy newPayeeHoldHours).
      const payeeChanged = recipient !== undefined && recipient !== (before.recipientAddress?.toLowerCase() ?? null);
      const row = await db.transaction(async (tx) => {
        const [r] = await tx
          .update(schema.obligations)
          .set({ ...input, recipientAddress: recipient, ...(payeeChanged ? { recipientSetAt: recipient ? deps.now() : null, recipientSetBy: recipient ? user.id : null } : {}) })
          .where(and(eq(schema.obligations.id, id), eq(schema.obligations.organizationId, m.organizationId)))
          .returning();
        const changed = Object.fromEntries(Object.entries(input).map(([k, v]) => [k, { from: (before as Record<string, unknown>)[k] ?? null, to: v }]));
        await audit(tx, { organizationId: m.organizationId, actorUserId: user.id, action: input.status === "cancelled" ? "obligation.cancelled" : "obligation.updated", targetType: "obligation", targetId: id, data: { changed }, ...clientInfo(c) });
        if (payeeChanged) {
          await audit(tx, { organizationId: m.organizationId, actorUserId: user.id, action: "obligation.payee_changed", targetType: "obligation", targetId: id, data: { from: before.recipientAddress, to: recipient }, ...clientInfo(c) });
        }
        return r!;
      });
      if (payeeChanged && before.recipientAddress) {
        // Changed payment details are the classic invoice-fraud step: tell the people who can stop it.
        await notifyRoles(deps, m.organizationId, ["owner", "admin"], {
          kind: "obligation.payee_changed",
          title: `Payee address changed: ${before.title}`,
          body: `${before.recipientAddress} → ${recipient ?? "removed"}. Payments to the new address are held for the approval policy's waiting period. Confirm the change with the payee through a channel you already trust.`,
          link: `/app/obligations/${id}`,
          dedupeKey: `payee:${id}:${recipient ?? "none"}:${deps.now().getTime()}`,
        }).catch((err) => deps.logger.warn({ err }, "payee change notification failed"));
      }
      const settled = await settledFor(m.organizationId);
      return c.json(toDto(row, toIsoDate(deps.now()), settled), 200);
    },
  );

  // --- Documents ---------------------------------------------------------------
  // Files are stored, hashed and served back as attachments. They are never parsed
  // or shown to the copilot, which removes uploaded documents as a prompt-injection path.

  app.post("/api/v1/orgs/:orgId/obligations/:id/documents", async (c) => {
    const m = c.get("member");
    const user = requireUser(c);
    assertCan(m.role, "obligations.write");
    const id = c.req.param("id");
    await getRow(m.organizationId, id);
    const form = await c.req.formData().catch(() => null);
    const file = form?.get("file");
    if (!(file instanceof File)) throw badRequest("file_required", "Attach a file in the `file` field");
    if (!ALLOWED_DOC_TYPES.has(file.type)) throw badRequest("unsupported_type", "Upload a PDF, PNG, JPEG, CSV or plain-text file");
    if (file.size > MAX_DOC_BYTES) throw badRequest("file_too_large", "Files must be 5 MB or smaller");
    const bytes = Buffer.from(await file.arrayBuffer());
    // Basic signature check so a renamed executable is not accepted as a PDF.
    if (file.type === "application/pdf" && bytes.subarray(0, 5).toString() !== "%PDF-") throw badRequest("invalid_file", "That file is not a valid PDF");
    const sha256 = createHash("sha256").update(bytes).digest("hex");
    const filename = file.name.replace(/[^\w.\- ]+/g, "_").slice(0, 120) || "document";
    const [doc] = await db
      .insert(schema.obligationDocuments)
      .values({ organizationId: m.organizationId, obligationId: id, filename, contentType: file.type, sizeBytes: file.size, sha256, content: bytes, uploadedBy: user.id })
      .returning({ id: schema.obligationDocuments.id, createdAt: schema.obligationDocuments.createdAt });
    await audit(db, { organizationId: m.organizationId, actorUserId: user.id, action: "obligation.document_uploaded", targetType: "obligation", targetId: id, data: { filename, sha256, sizeBytes: file.size }, ...clientInfo(c) });
    return c.json({ id: doc!.id, filename, contentType: file.type, sizeBytes: file.size, sha256, createdAt: doc!.createdAt.toISOString() }, 201);
  });

  app.get("/api/v1/orgs/:orgId/obligations/:id/documents/:docId", async (c) => {
    const m = c.get("member");
    const [doc] = await db
      .select()
      .from(schema.obligationDocuments)
      .where(and(eq(schema.obligationDocuments.id, c.req.param("docId")), eq(schema.obligationDocuments.obligationId, c.req.param("id")), eq(schema.obligationDocuments.organizationId, m.organizationId)))
      .limit(1);
    if (!doc) throw notFound("Document");
    return new Response(new Uint8Array(doc.content), {
      headers: {
        "content-type": doc.contentType,
        "content-disposition": `attachment; filename="${doc.filename.replace(/"/g, "")}"`,
        "x-content-type-options": "nosniff",
        "content-security-policy": "default-src 'none'",
        "cache-control": "private, no-store",
      },
    });
  });
}
