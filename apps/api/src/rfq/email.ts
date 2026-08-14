import type { Product } from "@se/content";
import { sanitizeHeader, type MailMessage } from "./mailer.ts";
import type { RfqPayload } from "./schema.ts";

export interface ResolvedItem {
  slug: string;
  name: string;
  aws: string;
  quantity: number;
}

export function resolveItems(
  payload: RfqPayload,
  loadProduct: (slug: string) => Product | undefined,
): { resolved: ResolvedItem[]; missing: string[] } {
  const resolved: ResolvedItem[] = [];
  const missing: string[] = [];
  for (const item of payload.items) {
    const product = loadProduct(item.slug);
    if (!product) {
      missing.push(item.slug);
      continue;
    }
    resolved.push({
      slug: product.slug,
      name: product.name,
      aws: product.classification.aws,
      quantity: item.quantity,
    });
  }
  return { resolved, missing };
}

export function buildRfqMessage(options: {
  payload: RfqPayload;
  resolved: ResolvedItem[];
  from: string;
  to: string;
  appUrl: string;
}): MailMessage {
  const { payload, resolved, from, to, appUrl } = options;
  const names = resolved.map((item) => item.name).join(", ");
  const lines = [
    "New RFQ from the Sunline Endeavour website.",
    "",
    `Name: ${payload.name}`,
    `Company: ${payload.company ?? "—"}`,
    `Email: ${payload.email}`,
    `Phone: ${payload.phone ?? "—"}`,
    "",
    "Requested items:",
    ...resolved.map(
      (item) => `  - ${item.name} (${item.aws}, SKU ${item.slug}) × ${item.quantity}`,
    ),
  ];
  if (payload.message) {
    lines.push("", "Message:", payload.message);
  }
  lines.push("", `Source: ${payload.source}`, "", `Site: ${appUrl}`);
  return {
    from,
    to,
    replyTo: payload.email,
    subject: `RFQ from ${sanitizeHeader(payload.name)} — ${sanitizeHeader(names)}`,
    text: lines.join("\n"),
  };
}
