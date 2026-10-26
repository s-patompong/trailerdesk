import { env } from "cloudflare:workers";
import { data } from "react-router";

import { embedInquiryInput } from "../../server/features/public-site/public-site.schemas";
import {
  readEmbedForm,
  submitEmbedInquiry,
} from "../../server/features/public-site/public-site.service";
import { configuration } from "../../server/platform/config";
import { DomainError, throwHttpError } from "../../server/platform/errors";
import { EmbedInquiryForm } from "../components/public-site/embed-inquiry-form";

import type { Route } from "./+types/embed-form";

function responseHeaders(frameAncestors: string) {
  return {
    "Cache-Control": "private, no-store",
    "Content-Security-Policy": `frame-ancestors ${frameAncestors}`,
    "Referrer-Policy": "strict-origin-when-cross-origin",
  };
}

export function headers({ actionHeaders, loaderHeaders }: Route.HeadersArgs) {
  return actionHeaders.has("Content-Security-Policy")
    ? actionHeaders
    : loaderHeaders;
}

export async function loader({ params }: Route.LoaderArgs) {
  try {
    const form = await readEmbedForm(env, params.key);
    return data(
      {
        config: form.config,
        siteKey: configuration(env).turnstile.siteKey,
      },
      { headers: responseHeaders(form.frameAncestors) },
    );
  } catch (error) {
    return throwHttpError(error);
  }
}

export async function action({ params, request }: Route.ActionArgs) {
  const form = await readEmbedForm(env, params.key);
  const headers = responseHeaders(form.frameAncestors);
  const parsed = embedInquiryInput.safeParse(
    Object.fromEntries(await request.formData()),
  );
  if (!parsed.success)
    return data(
      {
        accepted: false,
        error:
          "Please check your contact details and complete the verification.",
        attemptId: crypto.randomUUID(),
      },
      { status: 400, headers },
    );
  try {
    await submitEmbedInquiry(request, env, params.key, parsed.data);
    return data(
      { accepted: true, error: undefined, attemptId: undefined },
      { headers },
    );
  } catch (error) {
    return data(
      {
        accepted: false,
        error:
          error instanceof DomainError
            ? error.message
            : "Your inquiry could not be sent. Please try again or call the dealership.",
        attemptId: crypto.randomUUID(),
      },
      {
        status:
          error instanceof DomainError && error.code === "rate_limited"
            ? 429
            : 400,
        headers,
      },
    );
  }
}

export default function EmbedForm({
  loaderData,
  actionData,
}: Route.ComponentProps) {
  return (
    <EmbedInquiryForm
      copy={loaderData.config}
      siteKey={loaderData.siteKey}
      error={actionData?.error}
      accepted={actionData?.accepted ?? false}
      attemptId={actionData?.attemptId}
    />
  );
}
