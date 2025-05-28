// meta/main.js

import * as d3 from 'https://cdn.jsdelivr.net/npm/d3@7.9.0/+esm';

async function loadData() {
  return await d3.csv('loc.csv', row => ({
    ...row,
    line: +row.line,
    depth: +row.depth,
    length: +row.length,
    date: new Date(row.date + 'T00:00' + row.timezone),
    datetime: new Date(row.datetime)
  }));
}

function processCommits(data) {
  return d3.groups(data, d => d.commit)
    .map(([id, lines]) => {
      const { author, date, timezone, datetime } = lines[0];
      const summary = {
        id,
        author,
        date,
        datetime,
        hourFrac:   datetime.getHours() + datetime.getMinutes()/60,
        totalLines: lines.length,
        url:        `https://github.com/parthshindee/Lab4/commit/${id}`
      };
      Object.defineProperty(summary, 'lines', {
        value:       lines,
        writable:    false,
        configurable:false,
        enumerable:  false
      });
      return summary;
    });
}

function renderCommitInfo(data, commits) {
  const dl = d3.select('#stats')
    .append('dl').attr('class','stats');

  dl.append('dt').html('Total <abbr title="Lines of code">LOC</abbr>');
  dl.append('dd').text(data.length);

  dl.append('dt').text('Total commits');
  dl.append('dd').text(commits.length);

  dl.append('dt').text('Files in repo');
  dl.append('dd').text(d3.group(data, d=>d.file).size);

  const avgLineLen = d3.mean(data, d=>d.length).toFixed(1);
  dl.append('dt').text('Avg. line length');
  dl.append('dd').text(`${avgLineLen} chars`);

  const fileLengths = d3.rollups(
    data,
    v => d3.max(v, d=>d.line),
    d => d.file
  );
  const avgFileLen = d3.mean(fileLengths, d=>d[1]).toFixed(1);
  dl.append('dt').text('Avg. file length');
  dl.append('dd').text(`${avgFileLen} lines`);
}

function renderTooltipContent(commit) {
  if (!commit || !commit.id) return;
  document.getElementById('commit-link').href = commit.url;
  document.getElementById('commit-link').textContent = commit.id;
  document.getElementById('commit-date').textContent = commit.datetime.toLocaleDateString('en',{dateStyle:'full'});
  document.getElementById('commit-time').textContent = commit.datetime.toLocaleTimeString('en',{hour:'2-digit',minute:'2-digit'});
  document.getElementById('commit-author').textContent = commit.author;
  document.getElementById('commit-lines').textContent  = commit.totalLines;
}
function updateTooltipVisibility(show) {
  document.getElementById('commit-tooltip').hidden = !show;
}
function updateTooltipPosition(evt) {
  const tt = document.getElementById('commit-tooltip');
  const pad = 8;
  tt.style.left = evt.clientX + pad + 'px';
  tt.style.top  = evt.clientY + pad + 'px';
}

function renderSelectionCount(selection, commits) {
  const selected = selection
    ? commits.filter(c => isSelected(c, selection))
    : [];
  document.getElementById('selection-count').textContent =
    selected.length
      ? `${selected.length} commits selected`
      : 'No commits selected';
  return selected;
}

function renderLanguageBreakdown(selection, commits) {
  const container = document.getElementById('language-breakdown');
  container.innerHTML = '';
  const chosen = selection
    ? commits.filter(c => isSelected(c, selection))
    : [];
  if (!chosen.length) return;
  const lines = chosen.flatMap(c => c.lines);
  const byLang = d3.rollup(lines, v=>v.length, d=>d.type);
  for (const [lang, count] of byLang) {
    const pct = d3.format('.1~%')(count / lines.length);
    container.innerHTML += `
      <dt>${lang}</dt><dd>${count} lines (${pct})</dd>
    `;
  }
}

function isSelected(commit, selection) {
  if (!selection) return false;
  const [[x0,y0],[x1,y1]] = selection;
  const x = xScale(commit.datetime);
  const y = yScale(commit.hourFrac);
  return x0 <= x && x <= x1 && y0 <= y && y <= y1;
}

let xScale, yScale;

function renderScatterPlot(data, commits) {
  const W = 1000, H = 600;
  const margin = {top:10,right:10,bottom:30,left:40};
  const usable = {
    left: margin.left,
    right: W - margin.right,
    top: margin.top,
    bottom: H - margin.bottom,
    width: W - margin.left - margin.right,
    height: H - margin.top - margin.bottom
  };

  const svg = d3.select('#chart')
    .append('svg')
    .attr('viewBox', `0 0 ${W} ${H}`)
    .style('overflow','visible');

  xScale = d3.scaleTime()
    .domain(d3.extent(commits, d=>d.datetime))
    .range([usable.left, usable.right])
    .nice();

  yScale = d3.scaleLinear()
    .domain([0,24])
    .range([usable.bottom, usable.top]);

  const [mn,mx] = d3.extent(commits, d=>d.totalLines);
  const rScale = d3.scaleSqrt().domain([mn,mx]).range([2,30]);

  svg.append('g')
    .attr('class','gridlines')
    .attr('transform',`translate(${usable.left},0)`)
    .call(d3.axisLeft(yScale)
      .tickFormat('')
      .tickSize(-usable.width)
    );

  svg.append('g')
    .attr('transform',`translate(0,${usable.bottom})`)
    .call(d3.axisBottom(xScale));
  svg.append('g')
    .attr('transform',`translate(${usable.left},0)`)
    .call(d3.axisLeft(yScale)
      .tickFormat(d=>String(d%24).padStart(2,'0')+':00')
    );

  const sorted = d3.sort(commits, d=>-d.totalLines);
  const dots   = svg.append('g').attr('class','dots');
  dots.selectAll('circle')
    .data(sorted)
    .join('circle')
      .attr('cx', d=>xScale(d.datetime))
      .attr('cy', d=>yScale(d.hourFrac))
      .attr('r',  d=>rScale(d.totalLines))
      .style('fill','steelblue')
      .style('fill-opacity',0.7)
      .on('mouseenter',(e,c)=>{
        d3.select(e.currentTarget).style('fill-opacity',1);
        renderTooltipContent(c);
        updateTooltipPosition(e);
        updateTooltipVisibility(true);
      })
      .on('mousemove',e=>updateTooltipPosition(e))
      .on('mouseleave',(e)=>{
        d3.select(e.currentTarget).style('fill-opacity',0.7);
        updateTooltipVisibility(false);
      });

  const brush = d3.brush()
    .extent([[usable.left, usable.top],[usable.right, usable.bottom]])
    .on('start brush end', ({selection})=>{
      dots.selectAll('circle')
        .classed('selected', d=> isSelected(d, selection));
      renderSelectionCount(selection, commits);
      renderLanguageBreakdown(selection, commits);
    });

  svg.call(brush);
  svg.selectAll('.dots, .overlay ~ *').raise();
}

(async function(){
  const data    = await loadData();
  const commits = processCommits(data);
  renderCommitInfo(data, commits);
  renderScatterPlot(data, commits);
})();
