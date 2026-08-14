import { useState } from "preact/hooks";
import type { Product } from "@se/content/raw";
import {
  BASE_MATERIALS,
  CARBON_JOBS,
  recommend,
  type BaseMaterial,
  type CarbonJob,
} from "@se/content/selector";

interface Props {
  products: Product[];
}

type Step = 1 | 2 | 3;

const BASE_MATERIAL_LABELS: Record<BaseMaterial, string> = {
  "carbon-steel": "Carbon / mild steel",
  "low-alloy-steel": "Low-alloy steel",
  "stainless-austenitic": "Stainless steel (austenitic)",
  "stainless-dissimilar": "Dissimilar — stainless to carbon steel",
  "hard-facing": "Hard-facing / wear overlay",
};

const CARBON_JOB_LABELS: Record<CarbonJob, string> = {
  general: "General fabrication — all positions",
  "structural-critical": "Critical structural — needs a low-hydrogen deposit",
  "high-deposition": "Flat and horizontal heavy plate — high deposition rate",
};

const STEP_TITLES = ["Material", "Application", "Result"] as const;

export default function ElectrodeSelector({ products }: Props) {
  const [step, setStep] = useState<Step>(1);
  const [baseMaterial, setBaseMaterial] = useState<BaseMaterial>();
  const [carbonJob, setCarbonJob] = useState<CarbonJob>();

  function pickMaterial(material: BaseMaterial) {
    setBaseMaterial(material);
    setCarbonJob(undefined);
    setStep(material === "carbon-steel" ? 2 : 3);
  }

  function pickJob(job: CarbonJob) {
    setCarbonJob(job);
    setStep(3);
  }

  function restart() {
    setStep(1);
    setBaseMaterial(undefined);
    setCarbonJob(undefined);
  }

  const outcome = baseMaterial
    ? recommend(carbonJob ? { baseMaterial, carbonJob } : { baseMaterial })
    : null;
  const product = outcome?.kind === "match" ? products.find((entry) => entry.slug === outcome.slug) : undefined;
  const diameters =
    product && product.sizes.length > 0 ? product.sizes.map((size) => size.diameter_mm).join(", ") : null;

  const quoteHref =
    product && outcome?.kind === "match" && baseMaterial
      ? `/rfq?slugs=${encodeURIComponent(product.slug)}&qty=1&note=${encodeURIComponent(
          `Electrode selector: ${BASE_MATERIAL_LABELS[baseMaterial]}${carbonJob ? ` · ${CARBON_JOB_LABELS[carbonJob]}` : ""} → ${product.name}. Please quote.`,
        )}`
      : "/rfq";

  return (
    <section class="selector" aria-label="Electrode selector">
      <ol class="selector-steps">
        {STEP_TITLES.map((title, index) => {
          const number = (index + 1) as Step;
          const state = step === number ? "current" : step > number ? "done" : "todo";
          return (
            <li class={`selector-steps__item selector-steps__item--${state}`} key={title}>
              <span class="selector-steps__number tabular">{number}</span>
              <span>{title}</span>
            </li>
          );
        })}
      </ol>

      {step === 1 && (
        <fieldset class="selector-q">
          <legend class="selector-q__title">What is the base material?</legend>
          <div class="selector-q__options">
            {BASE_MATERIALS.map((material) => (
              <label class="selector-option" key={material}>
                <input
                  type="radio"
                  name="base-material"
                  value={material}
                  checked={baseMaterial === material}
                  onChange={() => pickMaterial(material)}
                />
                <span>{BASE_MATERIAL_LABELS[material]}</span>
              </label>
            ))}
          </div>
        </fieldset>
      )}

      {step === 2 && (
        <fieldset class="selector-q">
          <legend class="selector-q__title">How will the joint be used?</legend>
          <div class="selector-q__options">
            {CARBON_JOBS.map((job) => (
              <label class="selector-option" key={job}>
                <input
                  type="radio"
                  name="carbon-job"
                  value={job}
                  checked={carbonJob === job}
                  onChange={() => pickJob(job)}
                />
                <span>{CARBON_JOB_LABELS[job]}</span>
              </label>
            ))}
          </div>
          <button class="selector-back" type="button" onClick={restart}>
            ← Back
          </button>
        </fieldset>
      )}

      {step === 3 && outcome && product && outcome.kind === "match" ? (
        <article class="selector-result">
          <p class="selector-result__kicker">Recommended</p>
          <h3 class="selector-result__name">{product.name}</h3>
          <code class="selector-result__class tabular">{product.classification.aws}</code>
          {product.coating.type && <p class="selector-result__meta">{product.coating.type}</p>}
          <p class="selector-result__note">{outcome.note}</p>
          {diameters && (
            <p class="selector-result__meta">Available diameters: {diameters} mm</p>
          )}
          <div class="selector-result__actions">
            <a class="selector-result__cta" href={quoteHref}>
              Request a quote for {product.name}
            </a>
            <a class="selector-result__link" href={`/products/${product.slug}`}>
              View {product.name} →
            </a>
          </div>
        </article>
      ) : step === 3 ? (
        <div class="selector-result selector-result--empty" role="status">
          <p class="selector-result__kicker">No direct match</p>
          <h3 class="selector-result__name">Ask our technical team</h3>
          <p class="selector-result__note">
            {outcome?.kind === "no-match" ? outcome.reason : "We need a little more detail to recommend a grade."}
          </p>
          <p>
            <a class="selector-result__cta" href={quoteHref}>
              Request a quote — we will recommend the right grade
            </a>
          </p>
        </div>
      ) : null}

      {step > 1 && (
        <p class="selector-fallback">
          Not sure about the application?{" "}
          <a href="/rfq">Request a quote directly and we will help.</a>
        </p>
      )}

      {step === 3 && (
        <p class="selector-fallback">
          <button class="selector-restart" type="button" onClick={restart}>
            Start over
          </button>
        </p>
      )}
    </section>
  );
}
