import { useEffect, useRef } from "react";

export function meta() {
  return [{ title: "TrailerDesk embedded form example" }];
}

export default function EmbedDemo() {
  return (
    <main className="mx-auto max-w-3xl px-5 py-12 text-emerald-950">
      <p className="text-sm font-medium">Dealer website example</p>
      <h1 className="mt-2 text-3xl font-semibold">
        Talk with Ridgeline Trailer Co.
      </h1>
      <p className="mt-3 leading-7">
        This page represents a dealership-owned website. The form below is
        loaded, secured, validated, and processed by TrailerDesk.
      </p>
      <div className="mt-7 rounded-2xl bg-white p-3 shadow-xl shadow-emerald-950/10">
        <EmbeddedContactForm />
      </div>
    </main>
  );
}

function EmbeddedContactForm() {
  const container = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const host = container.current;
    if (!host) return;
    const script = document.createElement("script");
    script.src = "/embed/v1.js";
    script.dataset.formKey = "ridgeline-contact-form";
    script.dataset.title = "Contact Ridgeline Trailer Co.";
    script.async = true;
    host.appendChild(script);
    return () => {
      host.replaceChildren();
    };
  }, []);

  return <div ref={container} />;
}
