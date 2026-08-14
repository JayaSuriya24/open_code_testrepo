import { useState } from "preact/hooks";
import type { Product } from "@se/content/raw";
import {
  DEPOSITION_EFFICIENCY,
  JOINT_TYPES,
  densityGPerCm3ForFamily,
  estimateConsumption,
  type JointInput,
  type JointType,
} from "@se/content/consumption";

interface Props {
  products: Product[];
}

const JOINT_LABELS: Record<JointType, string> = {
  fillet: "Fillet",
  v: "Single V",
  x: "Double V (X)",
  k: "K (double bevel)",
  u: "U",
};

const PROCESS_OPTIONS = ["SMAW", "GMAW", "FCAW", "SAW"] as const;

function parseNumber(value: string | undefined): number | undefined {
  const parsed = Number(value);
  return value === undefined || value.trim() === "" || !Number.isFinite(parsed) ? undefined : parsed;
}

interface BuildResult {
  joint?: JointInput;
  error?: string;
}

function buildJoint(type: JointType, fields: Record<string, string>): BuildResult {
  const lengthM = parseNumber(fields.lengthM);
  const density = parseNumber(fields.density);
  if (lengthM === undefined || density === undefined) {
    return { error: "Enter a weld length and density." };
  }
  if (lengthM <= 0 || density <= 0) {
    return { error: "Length and density must be positive." };
  }

  if (type === "fillet") {
    const leg = parseNumber(fields.filletLeg);
    if (leg === undefined || leg <= 0) {
      return { error: "Enter a positive fillet leg size in mm." };
    }
    return { joint: { type: "fillet", filletLegMm: leg } };
  }

  const thickness = parseNumber(fields.thickness);
  const gap = parseNumber(fields.rootGap);
  const face = parseNumber(fields.rootFace);
  if (thickness === undefined || gap === undefined || face === undefined) {
    return { error: "Enter plate thickness, root gap and root face." };
  }
  if (thickness <= 0 || face < 0 || face >= thickness) {
    return { error: "Root face must be 0 or more and less than plate thickness." };
  }

  if (type === "u") {
    const radius = parseNumber(fields.rootRadius);
    if (radius === undefined || radius <= 0 || radius >= thickness - face) {
      return { error: "Root radius must be positive and less than the groove depth." };
    }
    return { joint: { type: "u", thicknessMm: thickness, rootGapMm: gap, rootFaceMm: face, rootRadiusMm: radius } };
  }

  const angle = parseNumber(fields.grooveAngle);
  if (angle === undefined || angle <= 0 || angle > 120) {
    return { error: "Groove angle must be between 0° and 120°." };
  }
  return {
    joint: { type, thicknessMm: thickness, grooveAngleDeg: angle, rootGapMm: gap, rootFaceMm: face },
  };
}

function jointFields(type: JointType): { key: string; label: string }[] {
  const common =
    type === "fillet"
      ? [{ key: "filletLeg", label: "Fillet leg size (mm)" }]
      : [
          { key: "thickness", label: "Plate thickness (mm)" },
          { key: "rootGap", label: "Root gap (mm)" },
          { key: "rootFace", label: "Root face (mm)" },
        ];
  if (type === "v" || type === "x" || type === "k") {
    return [common[0]!, { key: "grooveAngle", label: "Groove angle (°)" }, common[1]!, common[2]!];
  }
  if (type === "u") {
    return [...common, { key: "rootRadius", label: "Root radius (mm)" }];
  }
  return common;
}

export default function ConsumptionCalculator({ products }: Props) {
  const [slug, setSlug] = useState(products[0]?.slug ?? "");
  const [jointType, setJointType] = useState<JointType>("fillet");
  const [process, setProcess] = useState<(typeof PROCESS_OPTIONS)[number]>("SMAW");
  const [fields, setFields] = useState<Record<string, string>>({ lengthM: "1" });
  const [ratePerKg, setRatePerKg] = useState("");

  const product = products.find((entry) => entry.slug === slug) ?? products[0];

  const result = buildJoint(jointType, fields);
  const estimate =
    result.joint && product
      ? estimateConsumption({ joint: result.joint, lengthM: Number(fields.lengthM), process, densityGPerCm3: Number(fields.density) })
      : undefined;

  const densityDefault = product ? densityGPerCm3ForFamily(product.family) : undefined;
  const currentDensity = parseNumber(fields.density);

  function setField(key: string, value: string) {
    setFields((current) => ({ ...current, [key]: value }));
  }

  function selectProduct(nextSlug: string) {
    setSlug(nextSlug);
    const family = products.find((entry) => entry.slug === nextSlug)?.family;
    if (family) {
      const defaultDensity = densityGPerCm3ForFamily(family);
      if (defaultDensity !== undefined) {
        setFields((current) => ({ ...current, density: String(defaultDensity) }));
      }
    }
  }

  const quantity = estimate ? Math.ceil(estimate.electrodeKg) : 0;
  const quoteUrl =
    estimate && product && quantity >= 1
      ? `/rfq?slugs=${encodeURIComponent(product.slug)}&qty=${quantity}&note=${encodeURIComponent(
          `Consumption calculator: ${JOINT_LABELS[jointType]} joint, ${fields.lengthM} m weld → ≈ ${estimate.electrodeKg.toFixed(1)} kg ${product.name} electrode (${process}, ${currentDensity} g/cm³). Please quote this quantity.`,
        )}`
      : "";

  const cost = estimate && ratePerKg.trim() !== "" ? estimate.electrodeKg * Number(ratePerKg) : undefined;

  return (
    <section class="calc" aria-label="Electrode consumption calculator">
      <form class="calc__form" onSubmit={(event) => event.preventDefault()}>
        <div class="calc__grid">
          <label class="calc__field">
            <span class="calc__label">Electrode</span>
            <select value={product?.slug ?? ""} onChange={(event) => selectProduct(event.currentTarget.value)}>
              {products.map((entry) => (
                <option value={entry.slug} key={entry.slug}>
                  {entry.name} ({entry.classification.aws})
                </option>
              ))}
            </select>
          </label>

          <label class="calc__field">
            <span class="calc__label">Joint type</span>
            <select
              value={jointType}
              onChange={(event) => setJointType(event.currentTarget.value as JointType)}
            >
              {JOINT_TYPES.map((type) => (
                <option value={type} key={type}>
                  {JOINT_LABELS[type]}
                </option>
              ))}
            </select>
          </label>

          <label class="calc__field">
            <span class="calc__label">Process (deposition efficiency)</span>
            <select
              value={process}
              onChange={(event) => setProcess(event.currentTarget.value as (typeof PROCESS_OPTIONS)[number])}
            >
              {PROCESS_OPTIONS.map((option) => (
                <option value={option} key={option}>
                  {option} — {DEPOSITION_EFFICIENCY[option].toFixed(2)}
                </option>
              ))}
            </select>
          </label>

          {jointFields(jointType).map((field) => (
            <label class="calc__field" key={field.key}>
              <span class="calc__label">{field.label}</span>
              <input
                type="number"
                min="0"
                step="0.5"
                inputMode="decimal"
                value={fields[field.key] ?? ""}
                onInput={(event) => setField(field.key, event.currentTarget.value)}
              />
            </label>
          ))}

          <label class="calc__field">
            <span class="calc__label">Weld length (m)</span>
            <input
              type="number"
              min="0"
              step="0.1"
              inputMode="decimal"
              value={fields.lengthM ?? ""}
              onInput={(event) => setField("lengthM", event.currentTarget.value)}
            />
          </label>

          <label class="calc__field">
            <span class="calc__label">Weld-metal density (g/cm³)</span>
            <input
              type="number"
              min="0"
              step="0.1"
              inputMode="decimal"
              value={fields.density ?? ""}
              onInput={(event) => setField("density", event.currentTarget.value)}
            />
            {product && (
              <span class="calc__hint">
                {densityDefault !== undefined
                  ? `${product.name} family default: ${densityDefault}`
                  : `No published density for the ${product.family} family — enter the deposit density.`}
              </span>
            )}
          </label>

          <label class="calc__field">
            <span class="calc__label">Your rate (₹/kg, optional)</span>
            <input
              type="number"
              min="0"
              step="1"
              inputMode="decimal"
              value={ratePerKg}
              onInput={(event) => setRatePerKg(event.currentTarget.value)}
            />
          </label>
        </div>
      </form>

      {estimate && product ? (
        <div class="calc__result" aria-live="polite">
          <dl class="calc__figures">
            <div class="calc__figure">
              <dt class="calc__figure-label">Weld cross-section</dt>
              <dd class="calc__figure-value tabular">{estimate.weldAreaMm2.toFixed(1)} mm²</dd>
            </div>
            <div class="calc__figure">
              <dt class="calc__figure-label">Weld metal</dt>
              <dd class="calc__figure-value tabular">{estimate.weldMetalKg.toFixed(2)} kg</dd>
            </div>
            <div class="calc__figure calc__figure--primary">
              <dt class="calc__figure-label">Electrode consumption</dt>
              <dd class="calc__figure-value tabular">{estimate.electrodeKg.toFixed(2)} kg</dd>
            </div>
            {cost !== undefined && (
              <div class="calc__figure">
                <dt class="calc__figure-label">Estimated cost at your rate</dt>
                <dd class="calc__figure-value tabular">₹{Math.round(cost).toLocaleString("en-IN")}</dd>
              </div>
            )}
          </dl>

          <p>
            <a class="calc__cta" href={quoteUrl}>
              Request a quote for ≈{quantity} kg of {product.name}
            </a>
          </p>
          <p class="calc__footnote">
            Electrode kg = weld-metal kg ÷ deposition efficiency. Rod count and cartons will appear when
            per-diameter packing weights are published.
          </p>
        </div>
      ) : (
        <p class="calc__note" role="status">
          {result.error}
        </p>
      )}
    </section>
  );
}
