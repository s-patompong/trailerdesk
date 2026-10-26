import { z } from "zod";

const failure = z.object({ error: z.string() });
export async function requestJson<T>(
  path: string,
  schema: z.ZodType<T>,
  init?: RequestInit,
): Promise<T> {
  const response = await fetch(path, init);
  const body: unknown = await response.json();
  if (!response.ok) {
    const parsed = failure.safeParse(body);
    throw new Error(
      parsed.success
        ? parsed.data.error
        : "That could not be saved. Please try again.",
    );
  }
  return schema.parse(body);
}
export function jsonBody(input: unknown): RequestInit {
  return {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input),
  };
}
