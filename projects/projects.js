import * as d3 from 'https://cdn.jsdelivr.net/npm/d3@7.9.0/+esm';

import { fetchJSON } from '../global.js';

;(async () => {
  const projects = await fetchJSON('../lib/projects.json');

  const titleEl = document.querySelector('.projects-title');
  if (titleEl) {
    const n = Array.isArray(projects) ? projects.length : 0;
    titleEl.textContent = `Projects (${n})`;
  }

  const container = document.querySelector('.projects');
  container.innerHTML = ''; 

  for (let proj of projects) {
    const article = document.createElement('article');
    article.innerHTML = `
      <h2>${proj.title}</h2>
      ${proj.image ? `<img src="${proj.image}" alt="${proj.title}">` : ''}
      <div class="project-text">
        <p>${proj.description}</p>
        <p class="project-year">${proj.year}</p>
      </div>
    `;
    container.append(article);
  }
  const svg = d3.select('#projects-pie-plot');
  const arcGen = d3.arc().innerRadius(0).outerRadius(50);
  const data = [1, 2, 5, 6];

  const pieGen = d3.pie();
  let arcData = pieGen(data);

  const colorScale = d3.scaleOrdinal(d3.schemeTableau10);

  arcData.forEach((d, i) => {
    svg
      .append('path')
      .attr('d', arcGen(d))
      .attr('fill', colorScale(i));
  });
})();
