import * as d3 from 'https://cdn.jsdelivr.net/npm/d3@7.9.0/+esm';
import { fetchJSON, renderProjects as renderGrid } from '../global.js';

(async () => {
  const allProjects = await fetchJSON('../lib/projects.json');
  const projectsContainer = document.querySelector('.projects');
  const titleEl = document.querySelector('.projects-title');
  const searchInput = document.querySelector('.searchBar');

  let searchQuery = '';
  let selectedYear = null;

  function updateDisplay() {
    const searchFiltered = allProjects.filter(proj => {
      const text = Object.values(proj).join(' ').toLowerCase();
      return text.includes(searchQuery.toLowerCase());
    });

    const rolled = d3.rollups(
      searchFiltered,
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

    const arcs = pieGen(data);
    svg.selectAll('path')
      .data(arcs)
      .join('path')
        .attr('d', arcGen)
        .attr('fill', (_, i) => colorScale(i))
        .classed('selected', (_, i) => data[i].label === selectedYear)
        .on('click', (event, d) => {
          const i = arcs.indexOf(d);
          selectedYear = (data[i].label === selectedYear) ? null : data[i].label;
          updateDisplay();
        });

    legend.selectAll('li')
      .data(data)
      .join('li')
        .attr('class', d => d.label === selectedYear ? 'legend-item selected' : 'legend-item')
        .style('--color', (_, i) => colorScale(i))
        .html(d => `
          <span class="swatch"></span>
          ${d.label} <em>(${d.value})</em>
        `)
        .on('click', (event, d) => {
          selectedYear = (d.label === selectedYear) ? null : d.label;
          updateDisplay();
        });

    const visible = selectedYear
      ? searchFiltered.filter(p => String(p.year) === selectedYear)
      : searchFiltered;

    renderGrid(visible, projectsContainer, 'h2');
    if (titleEl) {
      titleEl.textContent = `Projects (${visible.length})`;
    }
  }

  if (searchInput) {
    searchInput.addEventListener('input', e => {
      searchQuery = e.target.value.trim();
      updateDisplay();
    });
  }

  updateDisplay();
})();
