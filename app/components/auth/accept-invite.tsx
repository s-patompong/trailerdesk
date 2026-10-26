import { useState } from "react";

import { authClient } from "../../lib/auth-client";
import { Alert, AlertDescription } from "../ui/alert";
import { Button } from "../ui/button";

export function AcceptInvite({
  id,
  organizationId,
}: {
  id: string;
  organizationId: string;
}) {
  const [pending, setPending] = useState(false);
  const [error, setError] = useState("");
  async function accept() {
    setPending(true);
    try {
      const accepted = await authClient.organization.acceptInvitation({
        invitationId: id,
      });
      if (accepted.error)
        throw new Error(
          accepted.error.message ?? "This invitation could not be accepted.",
        );
      const selected = await authClient.organization.setActive({
        organizationId,
      });
      if (selected.error)
        throw new Error(
          selected.error.message ??
            "Please choose your dealership after signing in.",
        );
      window.location.assign("/inventory");
    } catch (caught) {
      setError(
        caught instanceof Error
          ? caught.message
          : "This invitation could not be accepted.",
      );
      setPending(false);
    }
  }
  return (
    <div className="space-y-3">
      <Button
        disabled={pending}
        onClick={() => {
          void accept();
        }}
      >
        {pending ? "Joining dealership…" : "Accept invitation"}
      </Button>
      {error && (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}
    </div>
  );
}
