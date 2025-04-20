console.log("IT'S ALIVE!");

function $$(selector, ctx = document) {
  return Array.from(ctx.querySelectorAll(selector));
}

// ───────────────────────────────────
// NAV BAR
// ───────────────────────────────────

const pages = [
  { url: "",            title: "Home"     },
  { url: "contact/",    title: "Contact"  },
  { url: "projects/",   title: "Projects" },
  { url: "resume/",     title: "Resume"   },
  { url: "https://github.com/parthshindee", title: "GitHub" }
];

const BASE_PATH = 
  (location.hostname === "localhost" || location.hostname === "127.0.0.1")
    ? "/"
    : "/Lab-1---Portfolio/";

const nav = document.createElement("nav");

for (let {url, title} of pages) {
  const href = url.startsWith("http")
    ? url
    : BASE_PATH + url;

  const a = document.createElement("a");
  a.href = href;
  a.textContent = title;

  if (a.host === location.host && a.pathname === location.pathname) {
    a.classList.add("current");
  }

  if (a.host !== location.host) {
    a.target = "_blank";
    a.rel = "noopener noreferrer";
  }

  nav.append(a);
}

document.body.append(nav);

// ───────────────────────────────────
// DARK MODE TOGGLE BUTTON
// ───────────────────────────────────

const btn = document.createElement("button");
btn.className = "theme-toggle";
btn.type = "button";
btn.textContent = "Toggle Dark Mode";
document.body.prepend(btn);


function setOverride(scheme) {
  document.documentElement.style.setProperty("color-scheme", scheme);
  localStorage.setItem("themeOverride", scheme);
}
function clearOverride() {
  document.documentElement.style.removeProperty("color-scheme");
  localStorage.removeItem("themeOverride");
}


const saved = localStorage.getItem("themeOverride");
if (saved === "dark" || saved === "light") {
  setOverride(saved);
}


btn.addEventListener("click", () => {
  const override = document.documentElement.style.getPropertyValue("color-scheme");
  if (override) {
    clearOverride();
  } else {
    const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
    setOverride(prefersDark ? "light" : "dark");
  }
});