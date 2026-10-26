import { z, ZodError } from "zod";

import { logInfo } from "./logging";

export class DomainError extends Error {
  constructor(
    public readonly code:
      | "not_found"
      | "forbidden"
      | "conflict"
      | "invalid"
      | "unauthorized"
      | "rate_limited",
    message: string,
  ) {
    super(message);
    this.name = "DomainError";
  }
}

export function errorResponse(error: unknown): Response {
  if (error instanceof ZodError)
    return Response.json(
      {
        error: "Please check the information you entered.",
        issues: z.treeifyError(error),
      },
      { status: 400 },
    );
  if (error instanceof DomainError) {
    const statuses = {
      not_found: 404,
      forbidden: 403,
      conflict: 409,
      invalid: 400,
      unauthorized: 401,
      rate_limited: 429,
    } as const;
    return Response.json(
      { error: error.message, code: error.code },
      { status: statuses[error.code] },
    );
  }
  logInfo(
    JSON.stringify({
      event: "request_failed",
      errorType: error instanceof Error ? error.name : "UnknownError",
    }),
  );
  return Response.json(
    { error: "We could not finish that. Please try again." },
    { status: 500 },
  );
}

export function throwHttpError(error: unknown): never {
  // React Router uses thrown HTTP responses to select its route error boundary.
  // eslint-disable-next-line @typescript-eslint/only-throw-error
  throw errorResponse(error);
}
