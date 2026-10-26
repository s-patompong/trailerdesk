import { useState } from "react";
import { useRevalidator } from "react-router";

import { roleSchema } from "../../../server/platform/permissions";
import { authClient } from "../../lib/auth-client";
import { Alert, AlertDescription } from "../ui/alert";
import { Button } from "../ui/button";
import { Label } from "../ui/label";
import { NativeSelect, NativeSelectOption } from "../ui/native-select";

function useStaffMember({
  person,
  owner,
}: {
  person: {
    id: string;
    role: string;
    userId: string;
    user: { name: string; email: string };
  };
  owner: boolean;
  currentUserId: string;
}) {
  const [role, setRole] = useState(person.role);
  const [error, setError] = useState("");
  const [pending, setPending] = useState(false);
  const refresh = useRevalidator();
  const protectedOwner = person.role === "owner" && !owner;
  async function save(remove: boolean) {
    setPending(true);
    setError("");
    try {
      const result = remove
        ? await authClient.organization.removeMember({
            memberIdOrEmail: person.id,
          })
        : await authClient.organization.updateMemberRole({
            memberId: person.id,
            role: roleSchema.parse(role),
          });
      if (result.error)
        throw new Error(
          result.error.message ?? "This staff member could not be updated.",
        );
      await refresh.revalidate();
    } catch (caught) {
      setError(
        caught instanceof Error
          ? caught.message
          : "This staff member could not be updated.",
      );
    } finally {
      setPending(false);
    }
  }
  return { role, setRole, error, pending, protectedOwner, save };
}

export function StaffMember({
  person,
  owner,
  currentUserId,
}: Parameters<typeof useStaffMember>[0]) {
  const { role, setRole, error, pending, protectedOwner, save } =
    useStaffMember({ person, owner, currentUserId });
  return (
    <div className="space-y-3 border-t py-4">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="font-medium">
            {person.user.name}
            {person.userId === currentUserId ? " (you)" : ""}
          </p>
          <p className="text-sm text-muted-foreground">{person.user.email}</p>
        </div>
        <div className="flex flex-wrap items-end gap-2">
          <div>
            <Label htmlFor={`${person.id}-role`} className="mb-2">
              Role
            </Label>
            <NativeSelect
              id={`${person.id}-role`}
              value={role}
              onChange={(e) => {
                setRole(e.target.value);
              }}
              disabled={pending || protectedOwner}
            >
              <NativeSelectOption value="sales">Sales</NativeSelectOption>
              <NativeSelectOption value="manager">Manager</NativeSelectOption>
              {(owner || person.role === "owner") && (
                <NativeSelectOption value="owner">Owner</NativeSelectOption>
              )}
            </NativeSelect>
          </div>
          <Button
            variant="outline"
            disabled={pending || protectedOwner || role === person.role}
            onClick={() => {
              void save(false);
            }}
          >
            Save role
          </Button>
          <Button
            variant="destructive"
            disabled={
              pending || protectedOwner || person.userId === currentUserId
            }
            onClick={() => {
              void save(true);
            }}
          >
            Remove access
          </Button>
        </div>
      </div>
      {error && (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}
    </div>
  );
}
