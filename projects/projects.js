import * as d3 from 'https://cdn.jsdelivr.net/npm/d3@7.9.0/+esm';
import { fetchJSON, renderProjects } from '../global.js';

;(async () => {

  const allProjects = await fetchJSON('../lib/projects.json');
  const projectsContainer = document.querySelector('.projects');
  const titleEl = document.querySelector('.projects-title');

  function updateDisplay(filtered) {
    renderProjects(filtered, projectsContainer, 'h2');
    if (titleEl) {
      titleEl.textContent = `Projects (${filtered.length})`;
    }
    renderPieChart(filtered);
  }

  function renderPieChart(projectsGiven) {
    const rolled = d3.rollups(
      projectsGiven,
      v => v.length,
      d => d.year
    );
    rolled.sort(([a], [b]) => d3.ascending(a, b));

    const data = rolled.map(([year, count]) => ({
      label: String(year),
      value: count
    }));

    const pieGen = d3.pie().value(d => d.value);
    const arcGen = d3.arc().innerRadius(0).outerRadius(50);
    const colorScale = d3.scaleOrdinal(d3.schemeTableau10);

    const svg = d3.select('#projects-pie-plot');
    const legend = d3.select('ul.legend');
    svg.selectAll('path').remove();
    legend.selectAll('li').remove();

    svg.selectAll('path')
      .data(pieGen(data))
      .join('path')
        .attr('d', arcGen)
        .attr('fill', (_, i) => colorScale(i));

    legend.selectAll('li')
      .data(data)
      .join('li')
        .attr('class', 'legend-item')
        .style('--color', (_, i) => colorScale(i))
        .html(d => `
          <span class="swatch"></span>
          ${d.label} <em>(${d.value})</em>
        `);
  }

  updateDisplay(allProjects);

  let query = '';
  const searchInput = document.querySelector('.searchBar');
  if (searchInput) {
    searchInput.addEventListener('input', (e) => {
      query = e.target.value.trim().toLowerCase();
      const filtered = allProjects.filter(proj => {
        const text = Object.values(proj)
                           .join(' ')
                           .toLowerCase();
        return text.includes(query);
      });
      updateDisplay(filtered);
    });
  }
})();
