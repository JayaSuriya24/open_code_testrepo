import { useState } from "preact/hooks";
import type { Product } from "@se/content/raw";
import { readQueryPrefill } from "../../lib/rfq-prefill";

interface Props {
  products: Product[];
  initialSlugs?: string[];
  source?: "product" | "page";
  initialMessage?: string;
  hydrateFromQuery?: boolean;
}

interface Row {
  slug: string;
  quantity: string;
}

const API_URL = (import.meta.env.PUBLIC_API_URL as string | undefined) ?? "http://localhost:8787";

type Status = "idle" | "submitting" | "success" | "error";

export default function RfqForm({
  products,
  initialSlugs = [],
  source = "page",
  initialMessage = "",
  hydrateFromQuery = false,
}: Props) {
  const single = products.length === 1;
  const firstSlug = products[0]?.slug ?? "";
  const query =
    hydrateFromQuery && typeof window !== "undefined"
      ? readQueryPrefill(products, window.location.search)
      : null;
  const defaultRows: Row[] = query
    ? query.slugs.map((slug) => ({ slug, quantity: String(query.qty) }))
    : initialSlugs.length > 0
      ? initialSlugs.map((slug) => ({ slug, quantity: "1" }))
      : [{ slug: firstSlug, quantity: "1" }];
  const [rows, setRows] = useState<Row[]>(defaultRows);
  const [name, setName] = useState("");
  const [company, setCompany] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [message, setMessage] = useState(query?.note ?? initialMessage);
  const [status, setStatus] = useState<Status>("idle");
  const [error, setError] = useState("");

  function setRow(index: number, patch: Partial<Row>) {
    setRows((current) => current.map((row, i) => (i === index ? { ...row, ...patch } : row)));
  }

  function addRow() {
    setRows((current) => [...current, { slug: firstSlug, quantity: "1" }]);
  }

  function removeRow(index: number) {
    setRows((current) => current.filter((_, i) => i !== index));
  }

  function resetForm() {
    setName("");
    setCompany("");
    setEmail("");
    setPhone("");
    setMessage("");
    setRows([{ slug: firstSlug, quantity: "1" }]);
  }

  async function submit(event: Event) {
    event.preventDefault();
    setStatus("submitting");
    setError("");

    const validRows = rows.filter((row) => row.slug && Number(row.quantity) >= 1);
    if (validRows.length === 0) {
      setError("Add at least one product with a quantity of 1 or more.");
      setStatus("error");
      return;
    }

    try {
      const response = await fetch(`${API_URL}/api/rfq`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          name,
          company: company.trim() || undefined,
          email,
          phone: phone.trim() || undefined,
          message: message.trim() || undefined,
          items: validRows.map((row) => ({ slug: row.slug, quantity: Number(row.quantity) })),
          source,
        }),
      });

      if (!response.ok) {
        const body = (await response.json().catch(() => null)) as { error?: string } | null;
        setError(body?.error ?? `The request failed with status ${response.status}.`);
        setStatus("error");
        return;
      }

      setStatus("success");
      resetForm();
    } catch {
      setError("Network error — please check your connection and try again.");
      setStatus("error");
    }
  }

  const disabled = status === "submitting";

  return (
    <form class="rfq-form" onSubmit={submit} aria-label="Request a quote">
      <fieldset class="rfq-form__fieldset" disabled={disabled}>
        <legend class="rfq-form__legend">
          {single ? "Request a quote" : "Your request"}
        </legend>

        {rows.map((row, index) => {
          const product = products.find((entry) => entry.slug === row.slug);
          return (
            <div class="rfq-form__row" key={`${row.slug}-${index}`}>
              {single && product ? (
                <p class="rfq-form__product">
                  <span class="rfq-form__product-name">{product.name}</span>
                  <code class="tabular">{product.classification.aws}</code>
                </p>
              ) : (
                <label class="rfq-form__label">
                  <span class="rfq-form__label-text">Product</span>
                  <select
                    value={row.slug}
                    onChange={(event) => setRow(index, { slug: event.currentTarget.value })}
                  >
                    {products.map((product) => (
                      <option key={product.slug} value={product.slug}>
                        {product.name} ({product.classification.aws})
                      </option>
                    ))}
                  </select>
                </label>
              )}
              <label class="rfq-form__label">
                <span class="rfq-form__label-text">Quantity</span>
                <input
                  type="number"
                  min="1"
                  step="1"
                  required
                  value={row.quantity}
                  onInput={(event) => setRow(index, { quantity: event.currentTarget.value })}
                />
              </label>
              {rows.length > 1 && (
                <button class="rfq-form__remove" type="button" onClick={() => removeRow(index)}>
                  Remove
                </button>
              )}
            </div>
          );
        })}

        {!single && (
          <button class="rfq-form__add" type="button" onClick={addRow}>
            Add another product
          </button>
        )}
      </fieldset>

      <fieldset class="rfq-form__fieldset" disabled={disabled}>
        <legend class="rfq-form__legend">Your details</legend>
        <div class="rfq-form__grid">
          <label class="rfq-form__label">
            <span class="rfq-form__label-text">Name</span>
            <input
              type="text"
              required
              maxLength={120}
              value={name}
              onInput={(event) => setName(event.currentTarget.value)}
            />
          </label>
          <label class="rfq-form__label">
            <span class="rfq-form__label-text">Company (optional)</span>
            <input
              type="text"
              maxLength={120}
              value={company}
              onInput={(event) => setCompany(event.currentTarget.value)}
            />
          </label>
          <label class="rfq-form__label">
            <span class="rfq-form__label-text">Work email</span>
            <input
              type="email"
              required
              maxLength={254}
              value={email}
              onInput={(event) => setEmail(event.currentTarget.value)}
            />
          </label>
          <label class="rfq-form__label">
            <span class="rfq-form__label-text">Phone (optional)</span>
            <input
              type="tel"
              maxLength={30}
              value={phone}
              onInput={(event) => setPhone(event.currentTarget.value)}
            />
          </label>
        </div>
        <label class="rfq-form__label">
          <span class="rfq-form__label-text">What do you need? (optional)</span>
          <textarea
            rows={4}
            maxLength={2000}
            value={message}
            onInput={(event) => setMessage(event.currentTarget.value)}
          />
        </label>
      </fieldset>

      <button class="rfq-form__submit" type="submit" disabled={disabled}>
        {status === "submitting" ? "Sending…" : "Send quote request"}
      </button>

      {status === "success" && (
        <p class="rfq-form__status rfq-form__status--ok" role="status" aria-live="polite">
          Request sent — our sales team will reply within one business day.
        </p>
      )}
      {status === "error" && (
        <p class="rfq-form__status rfq-form__status--error" role="alert">
          {error}
        </p>
      )}
    </form>
  );
}
