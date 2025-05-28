import * as d3 from 'https://cdn.jsdelivr.net/npm/d3@7.9.0/+esm';

async function loadData() {
  return await d3.csv('loc.csv', row => ({
    ...row,
    line: +row.line,
    depth: +row.depth,
    length: +row.length,
    date: new Date(row.date  + 'T00:00' + row.timezone),
    datetime: new Date(row.datetime)
  }));
}

function processCommits(data) {
  return d3.groups(data, d => d.commit)
    .map(([id, lines]) => {
      const first = lines[0];
      const dt = first.datetime;
      const author = first.author;

      const summary = {
        id,
        author,
        date: first.date,
        datetime: dt,
        hourFrac: dt.getHours() + dt.getMinutes()/60,
        totalLines: lines.length,
        url: `https://github.com/parthshindee/Lab4/commit/${id}`
      };

      Object.defineProperty(summary, 'lines', {
        value: lines,
        writable: false,
        configurable: false,
        enumerable: false
      });

      return summary;
    });
}

function renderCommitInfo(data, commits) {
  const dl = d3.select('#stats')
    .append('dl')
    .attr('class', 'stats');

  dl.append('dt')
    .html('Total <abbr title="lines of code">LOC</abbr>');
  dl.append('dd')
    .text(data.length);

  dl.append('dt')
    .text('Total commits');
  dl.append('dd')
    .text(commits.length);

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

function renderScatterPlot(data, commits) {
    const width = 1000;
    const height = 600;
    const margin = { top: 10, right: 10, bottom: 30, left: 40 };
  
    const usableArea = {
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
        .range([usableArea.left, usableArea.right])
        .nice();
  
    const yScale = d3.scaleLinear()
        .domain([0, 24])
        .range([usableArea.bottom, usableArea.top]);
  
    svg.append('g')
        .attr('class', 'gridlines')
        .attr('transform', `translate(${usableArea.left}, 0)`)
        .call(d3.axisLeft(yScale)
            .tickFormat('')
            .tickSize(-usableArea.width)
        );
  
    const xAxis = d3.axisBottom(xScale);
    const yAxis = d3.axisLeft(yScale)
        .tickFormat(d => String(d % 24).padStart(2, '0') + ':00');
  
    svg.append('g')
        .attr('transform', `translate(0, ${usableArea.bottom})`)
        .call(xAxis);
  
    svg.append('g')
        .attr('transform', `translate(${usableArea.left}, 0)`)
        .call(yAxis);
  
    svg.append('g')
        .attr('class', 'dots')
        .selectAll('circle')
        .data(commits)
        .join('circle')
            .attr('cx', d => xScale(d.datetime))
            .attr('cy', d => yScale(d.hourFrac))
            .attr('r', 5)
            .attr('fill', 'steelblue');
}

(async function main() {
    const data = await loadData();
    const commits = processCommits(data);
    renderCommitInfo(data, commits);
    renderScatterPlot(data, commits);
    console.log({ data, commits });
})();
