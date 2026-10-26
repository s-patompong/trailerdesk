(function loadTrailerDeskForm() {
  const script = document.currentScript;
  if (!(script instanceof HTMLScriptElement)) return;
  const formKey = script.dataset.formKey;
  if (!formKey) {
    throw new Error("TrailerDesk embed requires a data-form-key value.");
  }
  const source = new URL(script.src);
  const frame = document.createElement("iframe");
  frame.src = `${source.origin}/embed/forms/${encodeURIComponent(formKey)}`;
  frame.title = script.dataset.title || "Contact the dealership";
  frame.loading = "lazy";
  frame.referrerPolicy = "strict-origin-when-cross-origin";
  frame.style.width = "100%";
  frame.style.minHeight = script.dataset.minHeight || "680px";
  frame.style.border = "0";
  frame.style.display = "block";
  script.insertAdjacentElement("afterend", frame);

  window.addEventListener("message", function resizeTrailerDeskForm(event) {
    if (event.origin !== source.origin || event.source !== frame.contentWindow)
      return;
    if (event.data?.type !== "trailerdesk:embed-height") return;
    const height = Number(event.data.height);
    if (!Number.isFinite(height) || height < 200 || height > 3000) return;
    frame.style.height = `${Math.ceil(height)}px`;
  });
})();
