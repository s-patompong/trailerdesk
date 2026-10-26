import { generateText } from "ai";
import { z } from "zod";

import { languageModel } from "../../platform/ai";
import { withStaff } from "../../platform/context";
import { DomainError } from "../../platform/errors";
import { requirePermission } from "../../platform/permissions";

import { trailerInput } from "./inventory.schemas";

const vinSchema = z
  .string()
  .trim()
  .toUpperCase()
  .regex(
    /^[A-HJ-NPR-Z0-9*]{5,17}$/,
    "Enter a VIN with 5 to 17 letters and numbers.",
  );
const decodeSchema = z.object({
  Results: z
    .array(
      z.object({
        Make: z.string().nullish(),
        Model: z.string().nullish(),
        ModelYear: z.string().nullish(),
        GVWR: z.string().nullish(),
        Axles: z.string().nullish(),
        TrailerBodyType: z.string().nullish(),
        ErrorCode: z.string().nullish(),
        ErrorText: z.string().nullish(),
      }),
    )
    .min(1),
});
export function lookupVin(request: Request, env: Env, value: unknown) {
  return withStaff(request, env, async (context) => {
    requirePermission(context.role, "inventory.write");
    const vin = vinSchema.parse(value);
    const key = `vpic:v1:${vin}`;
    let raw: unknown = await env.CACHE.get(key, "json");
    if (!raw) {
      const response = await fetch(
        `https://vpic.nhtsa.dot.gov/api/vehicles/DecodeVinValues/${encodeURIComponent(vin)}?format=json`,
        { signal: AbortSignal.timeout(15000) },
      );
      if (!response.ok)
        throw new DomainError(
          "conflict",
          "VIN lookup is busy. Try again or enter the details yourself.",
        );
      raw = await response.json();
    }
    const decoded = decodeSchema.parse(raw);
    const result = decoded.Results[0];
    if (!result)
      throw new DomainError("invalid", "No details were found for that VIN.");
    if (vin.length === 17 && result.Make && result.ErrorCode === "0")
      await env.CACHE.put(key, JSON.stringify(decoded));
    return {
      vin,
      make: result.Make ?? "",
      model: result.Model ?? "",
      year: result.ModelYear ?? "",
      axles: result.Axles ?? "",
      gvwr: result.GVWR ?? "",
      warning:
        result.ErrorCode !== "0"
          ? "Some details could not be decoded. Check the trailer plate before saving."
          : null,
    };
  });
}
export function draftDescription(request: Request, env: Env, input: unknown) {
  return withStaff(request, env, async (context) => {
    requirePermission(context.role, "inventory.write");
    const trailer = trailerInput
      .omit({ vin: true, stockNumber: true, dealerCostCents: true })
      .parse(input);
    const result = await generateText({
      model: languageModel(env),
      instructions:
        "Write a concise, accurate trailer listing for US shoppers using only the supplied specifications. Do not invent towing capacity, warranty, financing, availability or accessories. Do not include internal costs. Return plain text. Staff will review before saving.",
      prompt: JSON.stringify(trailer),
      maxOutputTokens: 400,
    });
    return { description: result.text };
  });
}
