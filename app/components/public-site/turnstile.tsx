import { useEffect, useRef, useState } from "react";

import { Alert, AlertDescription } from "../ui/alert";

interface TurnstileApi {
  render(
    container: HTMLElement,
    options: {
      sitekey: string;
      action: string;
      callback: (token: string) => void;
      "expired-callback": () => void;
      "error-callback": () => void;
    },
  ): string;
  remove(id: string): void;
}
declare global {
  interface Window {
    turnstile?: TurnstileApi;
  }
}
let script: Promise<TurnstileApi> | undefined;
function loadTurnstile(): Promise<TurnstileApi> {
  if (window.turnstile) return Promise.resolve(window.turnstile);
  script ??= new Promise((resolve, reject) => {
    const element = document.createElement("script");
    element.src =
      "https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit";
    element.async = true;
    element.onload = () => {
      if (window.turnstile) resolve(window.turnstile);
      else reject(new Error("Verification did not load."));
    };
    element.onerror = () => {
      reject(new Error("Verification did not load."));
    };
    document.head.appendChild(element);
  });
  return script;
}
export function Turnstile({
  siteKey,
  onToken,
}: {
  siteKey: string;
  onToken: (token: string) => void;
}) {
  const container = useRef<HTMLDivElement>(null);
  const [failed, setFailed] = useState(false);
  useEffect(() => {
    let disposed = false;
    let widget: string | undefined;
    let api: TurnstileApi | undefined;
    void loadTurnstile()
      .then((value) => {
        api = value;
        if (disposed || !container.current) return;
        widget = value.render(container.current, {
          sitekey: siteKey,
          action: "inquiry",
          callback: onToken,
          "expired-callback": () => {
            onToken("");
          },
          "error-callback": () => {
            onToken("");
            setFailed(true);
          },
        });
      })
      .catch(() => {
        setFailed(true);
      });
    return () => {
      disposed = true;
      if (widget !== undefined && api) api.remove(widget);
    };
  }, [onToken, siteKey]);
  return (
    <div className="space-y-2">
      <div ref={container} />
      {failed && (
        <Alert variant="destructive">
          <AlertDescription>
            Verification could not load. Refresh the page and try again.
          </AlertDescription>
        </Alert>
      )}
    </div>
  );
}
