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
    : "/Lab4/";

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

// ───────────────────────────────────
// PROJECTS RENDERING
// ───────────────────────────────────

export async function fetchJSON(url) {
  try {
    const response = await fetch(url);
    console.log("fetch response:", response);
    if (!response.ok) {
      throw new Error(`Failed to fetch: ${response.statusText}`);
    }
    return await response.json();
  } catch (err) {
    console.error("Error fetching/parsing JSON:", err);
    return [];
  }
}

export function renderProjects(projects, container, headingLevel = "h2") {
  if (!(container instanceof HTMLElement)) {
    console.error("renderProjects: invalid container", container);
    return;
  }
  container.innerHTML = "";
  if (!Array.isArray(projects) || projects.length === 0) {
    container.innerHTML = "<p>No projects to display.</p>";
    return;
  }
  for (let proj of projects) {
    const article = document.createElement("article");
    let h;
    try {
      h = document.createElement(headingLevel);
    } catch {
      h = document.createElement("h2");
    }
    h.textContent = proj.title || "Untitled";
    article.appendChild(h);

    if (proj.image) {
      const img = document.createElement("img");
      img.src = proj.image;
      img.alt = proj.title || "";
      article.appendChild(img);
    }

    const p = document.createElement("p");
    p.textContent = proj.description || "";
    article.appendChild(p);

    container.appendChild(article);
  }
}

// ───────────────────────────────────
// GITHUB FETCHING
// ───────────────────────────────────

export async function fetchGitHubData(username) {
  return await fetchJSON(`https://api.github.com/users/${username}`);
}