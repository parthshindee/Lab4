import { fetchJSON, renderProjects } from '../global';

(async () => {
    const projects = await fetchJSON('../lib/projects.json');
  
    const titleEl = document.querySelector('.projects-title');
    const container = document.querySelector('.projects');
  
    renderProjects(projects, container, 'h2');

    if (titleEl) {
      const count = Array.isArray(projects) ? projects.length : 0;
      titleEl.textContent = `Projects (${count})`;
    }
})();