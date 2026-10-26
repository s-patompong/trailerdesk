import { Link } from "react-router";

import { Button } from "../ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "../ui/card";

export function PageError({
  title,
  detail,
}: {
  title: string;
  detail: string;
}) {
  return (
    <main className="mx-auto flex min-h-svh max-w-lg items-center px-5 py-12">
      <Card className="w-full">
        <CardHeader>
          <CardTitle>{title}</CardTitle>
          <CardDescription>{detail}</CardDescription>
        </CardHeader>
        <CardContent>
          <Button asChild variant="outline">
            <Link to="/">Open TrailerDesk</Link>
          </Button>
        </CardContent>
      </Card>
    </main>
  );
}
