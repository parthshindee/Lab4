const form = document.querySelector("form[action^='mailto:']");
if (!form) return;

form.addEventListener("submit", (e) => {
  e.preventDefault();

  const base = form.action;
  const data = new FormData(form);
  const pairs = [];

  for (const [name, value] of data.entries()) {
    pairs.push(`${name}=${encodeURIComponent(value)}`);
  }

  const mailto = `${base}?${pairs.join("&")}`;
  location.href = mailto;
});
  