export function submitEsewaForm(esewaUrl, payload) {
  const form = document.createElement("form");
  form.method = "POST";
  form.action = esewaUrl;
  form.acceptCharset = "utf-8";

  Object.entries(payload).forEach(([key, val]) => {
    const input = document.createElement("input");
    input.type = "hidden";
    input.name = key;
    input.value = String(val ?? "");
    form.appendChild(input);
  });

  document.body.appendChild(form);
  form.submit();

  // cleanup (won’t run if browser navigates immediately, but safe)
  setTimeout(() => {
    try {
      document.body.removeChild(form);
    // eslint-disable-next-line no-unused-vars
    } catch (_) { /* empty */ }
  }, 1000);
}
