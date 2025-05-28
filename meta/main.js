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
      const first = lines[0];
      const dt    = first.datetime;
      const summary = {
        id,
        author:     first.author,
        date:       first.date,
        datetime:   dt,
        hourFrac:   dt.getHours() + dt.getMinutes()/60,
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
    .append('dl')
    .attr('class', 'stats');

  dl.append('dt')
    .html('Total <abbr title="Lines of code">LOC</abbr>');
  dl.append('dd')
    .text(data.length);

  dl.append('dt').text('Total commits');
  dl.append('dd').text(commits.length);

  const numFiles = d3.group(data, d => d.file).size;
  dl.append('dt').text('Files in repo');
  dl.append('dd').text(numFiles);

  const avgLineLen = d3.mean(data, d => d.length).toFixed(1);
  dl.append('dt').text('Avg. line length');
  dl.append('dd').text(`${avgLineLen} chars`);

  const fileLengths = d3.rollups(
    data,
    v => d3.max(v, d => d.line),
    d => d.file
  );
  const avgFileLen = d3.mean(fileLengths, d => d[1]).toFixed(1);
  dl.append('dt').text('Avg. file length');
  dl.append('dd').text(`${avgFileLen} lines`);
}

function renderTooltipContent(commit) {
  if (!commit || !commit.id) return;
  document.getElementById('commit-link').href       = commit.url;
  document.getElementById('commit-link').textContent = commit.id;
  document.getElementById('commit-date').textContent = commit.datetime.toLocaleDateString('en', { dateStyle: 'full' });
  document.getElementById('commit-time').textContent = commit.datetime.toLocaleTimeString('en', { hour: '2-digit', minute: '2-digit' });
  document.getElementById('commit-author').textContent = commit.author;
  document.getElementById('commit-lines').textContent  = commit.totalLines;
}

function updateTooltipVisibility(visible) {
  document.getElementById('commit-tooltip').hidden = !visible;
}

function updateTooltipPosition(event) {
  const tt = document.getElementById('commit-tooltip');
  const offset = 8;
  tt.style.left = `${event.clientX + offset}px`;
  tt.style.top  = `${event.clientY + offset}px`;
}

function renderScatterPlot(data, commits) {
  const width  = 1000;
  const height = 600;
  const margin = { top: 10, right: 10, bottom: 30, left: 40 };
  const usable = {
    left: margin.left,
    right: width - margin.right,
    top: margin.top,
    bottom: height - margin.bottom,
    width: width  - margin.left - margin.right,
    height: height - margin.top  - margin.bottom
  };

  const svg = d3.select('#chart')
    .append('svg')
      .attr('viewBox', `0 0 ${width} ${height}`)
      .style('overflow', 'visible');

  const xScale = d3.scaleTime()
    .domain(d3.extent(commits, d => d.datetime))
    .range([usable.left, usable.right])
    .nice();
  const yScale = d3.scaleLinear()
    .domain([0, 24])
    .range([usable.bottom, usable.top]);

  svg.append('g')
    .attr('class', 'gridlines')
    .attr('transform', `translate(${usable.left}, 0)`)
    .call(d3.axisLeft(yScale)
      .tickFormat('')
      .tickSize(-usable.width)
    );

  svg.append('g')
    .attr('transform', `translate(0, ${usable.bottom})`)
    .call(d3.axisBottom(xScale));
  svg.append('g')
    .attr('transform', `translate(${usable.left}, 0)`)
    .call(d3.axisLeft(yScale)
      .tickFormat(d => String(d % 24).padStart(2, '0') + ':00')
    );

  svg.append('g')
      .attr('class', 'dots')
    .selectAll('circle')
    .data(commits)
    .join('circle')
      .attr('cx', d => xScale(d.datetime))
      .attr('cy', d => yScale(d.hourFrac))
      .attr('r', 5)
      .attr('fill', 'steelblue')
      .on('mouseenter', (event, commit) => {
        renderTooltipContent(commit);
        updateTooltipPosition(event);
        updateTooltipVisibility(true);
      })
      .on('mousemove', event => {
        updateTooltipPosition(event);
      })
      .on('mouseleave', () => {
        updateTooltipVisibility(false);
      });
}

(async function main() {
  const data    = await loadData();
  const commits = processCommits(data);

  renderCommitInfo(data, commits);
  renderScatterPlot(data, commits);
})();
