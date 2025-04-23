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

// ───────────────────────────────────
// DARK MODE TOGGLE BUTTON
// ───────────────────────────────────

export async function fetchJSON(url) {
  try {
    const response = await fetch(url);
    console.log('fetch response:', response);
    if (!response.ok) {
      throw new Error(`Failed to fetch projects: ${response.statusText}`);
    }
    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error fetching or parsing JSON data:', error);
    return [];
  }
}

export function renderProjects(projects, containerElement, headingLevel = 'h2') {
  if (!(containerElement instanceof HTMLElement)) {
    console.error('renderProjects: invalid containerElement', containerElement);
    return;
  }

  containerElement.innerHTML = '';

  if (!Array.isArray(projects) || projects.length === 0) {
    containerElement.innerHTML = `<p>No projects to display.</p>`;
    return;
  }

  projects.forEach(project => {
    const article = document.createElement('article');

    let heading;
    try {
      heading = document.createElement(headingLevel);
    } catch {
      heading = document.createElement('h2');
    }
    heading.textContent = project.title || 'Untitled project';
    article.appendChild(heading);

    if (project.image) {
      const img = document.createElement('img');
      img.src = project.image;
      img.alt = project.title || '';
      article.appendChild(img);
    }

    const desc = document.createElement('p');
    desc.textContent = project.description || '';
    article.appendChild(desc);

    containerElement.appendChild(article);
  });
}

export async function fetchJSON(url) {
  try {
    const response = await fetch(url);
    console.log('fetch response:', response);
    if (!response.ok) {
      throw new Error(`Failed to fetch: ${response.statusText}`);
    }
    return await response.json();
  } catch (error) {
    console.error('Error fetching or parsing JSON data:', error);
    return [];
  }
}

export async function fetchGitHubData(username) {
  return await fetchJSON(`https://api.github.com/users/${username}`);
}