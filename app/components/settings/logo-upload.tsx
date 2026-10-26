import { useState } from "react";
import { useRevalidator } from "react-router";
import { z } from "zod";

import { requestJson } from "../../lib/request-json";
import { Alert, AlertDescription } from "../ui/alert";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { Label } from "../ui/label";

const logoFile = z
  .file()
  .min(1, "Choose a logo image.")
  .max(2 * 1024 * 1024, "Choose an image under 2 MB.")
  .mime(
    ["image/jpeg", "image/png", "image/webp"],
    "Choose a JPG, PNG or WebP image.",
  );
export function LogoUpload() {
  const [message, setMessage] = useState("");
  const [pending, setPending] = useState(false);
  const refresh = useRevalidator();
  async function submit(element: HTMLFormElement) {
    const body = new FormData(element);
    const parsed = logoFile.safeParse(body.get("file"));
    if (!parsed.success) {
      setMessage(parsed.error.issues[0]?.message ?? "Choose a logo image.");
      return;
    }
    setPending(true);
    try {
      await requestJson(
        "/api/settings/logo",
        z.object({ saved: z.boolean() }),
        { method: "POST", body },
      );
      element.reset();
      setMessage("Your dealership logo has been saved.");
      await refresh.revalidate();
    } catch (error) {
      setMessage(
        error instanceof Error
          ? error.message
          : "The logo could not be uploaded.",
      );
    } finally {
      setPending(false);
    }
  }
  return (
    <form
      className="mt-6 space-y-3 border-t pt-6"
      noValidate
      onSubmit={(e) => {
        e.preventDefault();
        void submit(e.currentTarget);
      }}
    >
      <Label htmlFor="settings-logo">
        Dealership logo (JPG, PNG or WebP, up to 2 MB)
      </Label>
      <Input
        id="settings-logo"
        type="file"
        name="file"
        accept="image/png,image/jpeg,image/webp"
      />
      {message && (
        <Alert>
          <AlertDescription>{message}</AlertDescription>
        </Alert>
      )}
      <Button variant="outline" disabled={pending}>
        {pending ? "Uploading…" : "Upload logo"}
      </Button>
    </form>
  );
}
