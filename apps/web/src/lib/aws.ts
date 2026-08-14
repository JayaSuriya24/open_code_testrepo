export interface AwsSegment {
  code: string;
  label: string;
  meaning: string;
}

const POSITIONS: Record<string, string> = {
  "1": "All positions",
  "2": "Flat and horizontal fillet",
  "3": "Flat",
};

const MILD_STEEL_COATINGS: Record<string, string> = {
  "0": "High cellulosic sodium coating; DC+",
  "1": "High cellulosic potassium coating; AC or DC+",
  "2": "High titania sodium coating; AC or DC-",
  "3": "High titania potassium coating; AC or DC+",
  "4": "Iron powder, titania coating; AC or DC either polarity",
  "5": "Low hydrogen sodium coating; DC+",
  "6": "Low hydrogen potassium coating; AC or DC+",
  "7": "Iron powder, iron oxide coating; AC or DC either polarity",
  "8": "Low hydrogen, iron powder coating; AC or DC+",
};

const STAINLESS_COATINGS: Record<string, string> = {
  "5": "Low hydrogen sodium coating; DC+",
  "6": "Low hydrogen potassium coating; AC or DC+",
};

const ALLOY_VARIANTS: Record<string, string> = {
  L: "Low carbon variant",
  H: "High carbon variant",
};

function tensileMeaning(ksi: number): string {
  return `Minimum weld-metal tensile strength ${ksi} ksi (${Math.round(ksi * 6.894757)} MPa)`;
}

export function decodeAws(aws: string): AwsSegment[] | null {
  const trimmed = aws.trim().toUpperCase();

  const mild = /^E(\d{2})([1-3])([0-8])$/.exec(trimmed);
  if (mild) {
    const [, tensile, position, coating] = mild;
    if (!tensile || !position || !coating) return null;
    return [
      { code: "E", label: "Electrode", meaning: "SMAW covered stick electrode" },
      { code: tensile, label: "Tensile strength", meaning: tensileMeaning(Number(tensile)) },
      { code: position, label: "Position", meaning: POSITIONS[position] ?? position },
      { code: coating, label: "Coating & current", meaning: MILD_STEEL_COATINGS[coating] ?? coating },
    ];
  }

  const stainless = /^E(\d{3})([A-Z]?)-([1-2])([5-8])$/.exec(trimmed);
  if (stainless) {
    const [, alloy, letter, position, coating] = stainless;
    if (!alloy || !position || !coating) return null;
    const variant = letter && ALLOY_VARIANTS[letter];
    return [
      { code: "E", label: "Electrode", meaning: "SMAW covered stick electrode" },
      { code: alloy, label: "Alloy series", meaning: `Stainless steel alloy series ${alloy}` },
      ...(letter && variant ? [{ code: letter, label: "Alloy variant", meaning: variant }] : []),
      { code: position, label: "Position", meaning: POSITIONS[position] ?? position },
      { code: coating, label: "Coating & current", meaning: STAINLESS_COATINGS[coating] ?? coating },
    ];
  }

  return null;
}
