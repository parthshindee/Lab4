import * as d3 from 'https://cdn.jsdelivr.net/npm/d3@7.9.0/+esm';
import scrollama from 'https://cdn.jsdelivr.net/npm/scrollama@3.2.0/+esm';

let rawData, commits, xScale, yScale, rScale, timeScale, commitMaxTime;

const slider = document.getElementById('commit-progress');
const timeLabel = document.getElementById('commit-time');

async function loadAndProcess() {
  rawData = await d3.csv('loc.csv', row => ({
    ...row,
    line: +row.line,
    depth: +row.depth,
    length: +row.length,
    date: new Date(row.date + 'T00:00' + row.timezone),
    datetime: new Date(row.datetime)
  }));

  commits = d3.groups(rawData, d => d.commit)
    .map(([id, lines]) => {
      const first = lines[0];
      const dt = first.datetime;
      const c = {
        id,
        author: first.author,
        datetime: dt,
        hourFrac: dt.getHours() + dt.getMinutes()/60,
        totalLines: lines.length,
        url: `https://github.com/parthshindee/Lab4/commit/${id}`
      };
      Object.defineProperty(c, 'lines', {
        value: lines,
        writable: false,
        configurable: false,
        enumerable: false
      });
      return c;
    });

  commits.sort((a,b)=>d3.ascending(a.datetime, b.datetime));
}


function renderTopStats() {
  const dl = d3.select('#stats')
    .append('dl')
    .attr('class','stats');

  dl.append('dt').html('Total <abbr title="Lines of code">LOC</abbr>');
  dl.append('dd').text(rawData.length);

  dl.append('dt').text('Total commits');
  dl.append('dd').text(commits.length);

  dl.append('dt').text('Files in repo');
  dl.append('dd').text(d3.group(rawData, d=>d.file).size);

  const avgLen = d3.mean(rawData, d=>d.length).toFixed(1);
  dl.append('dt').text('Avg. line length');
  dl.append('dd').text(`${avgLen} chars`);

  const fileLens = d3.rollups(rawData, v=>d3.max(v, d=>d.line), d=>d.file);
  const avgFile = d3.mean(fileLens, d=>d[1]).toFixed(1);
  dl.append('dt').text('Avg. file length');
  dl.append('dd').text(`${avgFile} lines`);
}


function renderTooltip(c) {
  if (!c) return;
  document.getElementById('commit-link').href = c.url;
  document.getElementById('commit-link').textContent = c.id;
  document.getElementById('commit-date').textContent = c.datetime.toLocaleDateString('en',{dateStyle:'full'});
  document.getElementById('commit-time-detail').textContent = c.datetime.toLocaleTimeString('en',{hour:'2-digit',minute:'2-digit'});
  document.getElementById('commit-author').textContent = c.author;
  document.getElementById('commit-lines').textContent = c.totalLines;
}
function showTooltip(on) {
  document.getElementById('commit-tooltip').hidden = !on;
}
function moveTooltip(e) {
  const tt = document.getElementById('commit-tooltip'),
        pad = 8;
  tt.style.left = `${e.clientX + pad}px`;
  tt.style.top = `${e.clientY + pad}px`;
}


function setupSlider() {
  timeScale = d3.scaleTime()
    .domain(d3.extent(commits, d=>d.datetime))
    .range([0,100]);

  slider.addEventListener('input', onSliderChange);
  onSliderChange();
}

function onSliderChange() {
  const pct = +slider.value;
  commitMaxTime = timeScale.invert(pct);
  timeLabel.textContent = commitMaxTime.toLocaleString('en',{dateStyle:'long',timeStyle:'short'});

  const view = commits.filter(d=>d.datetime <= commitMaxTime);
  updateScatter(view);
  updateFileDisplay(view);
}


function drawScatter(initial) {
  const W=1000, H=600,
        m={top:10,right:10,bottom:30,left:40},
        u={
          left: m.left,
          right: W-m.right,
          top: m.top,
          bottom: H-m.bottom,
          width: W-m.left-m.right,
          height: H-m.top-m.bottom
        };

  const svg = d3.select('#chart')
    .append('svg')
    .attr('viewBox', `0 0 ${W} ${H}`)
    .style('overflow','visible');

  xScale = d3.scaleTime()
    .domain(d3.extent(commits,d=>d.datetime))
    .range([u.left,u.right]).nice();

  yScale = d3.scaleLinear()
    .domain([0,24])
    .range([u.bottom,u.top]);

  const [mn,mx] = d3.extent(commits,d=>d.totalLines);
  rScale = d3.scaleSqrt().domain([mn,mx]).range([2,30]);

  svg.append('g')
    .attr('class','gridlines')
    .attr('transform',`translate(${u.left},0)`)
    .call(d3.axisLeft(yScale).tickFormat('').tickSize(-u.width));

  svg.append('g')
    .attr('class','x-axis')
    .attr('transform',`translate(0,${u.bottom})`)
    .call(d3.axisBottom(xScale));

  svg.append('g')
    .attr('class','y-axis')
    .attr('transform',`translate(${u.left},0)`)
    .call(d3.axisLeft(yScale).tickFormat(d=>String(d%24).padStart(2,'0')+':00'));

  svg.append('g').attr('class','dots');

  updateScatter(initial);

  const brush = d3.brush()
    .extent([[u.left,u.top],[u.right,u.bottom]])
    .on('brush end', ({selection}) => {
      d3.selectAll('circle').classed('selected', d=>inside(d,selection));
      document.getElementById('selection-count').textContent =
        selection
          ? `${commits.filter(d=>inside(d,selection)).length} commits selected`
          : 'No commits selected';

      const dl = document.getElementById('language-breakdown');
      dl.innerHTML = '';
      if (!selection) return;
      const chosen = commits.filter(d=>inside(d,selection));
      const lines = chosen.flatMap(c=>c.lines);
      const byType = d3.rollup(lines,v=>v.length,d=>d.type);
      for (const [lang,cnt] of byType) {
        const pct = d3.format('.1~%')(cnt/lines.length);
        dl.innerHTML += `<dt>${lang}</dt><dd>${cnt} lines (${pct})</dd>`;
      }
    });

  svg.call(brush);

  svg.selectAll('.dots, .overlay ~ *').raise();
}


function updateScatter(view) {
  xScale.domain(d3.extent(view,d=>d.datetime)).nice();
  d3.select('g.x-axis').call(d3.axisBottom(xScale));

  const [mn,mx] = d3.extent(view,d=>d.totalLines);
  rScale.domain([mn,mx]);

  const sel = d3.select('g.dots')
    .selectAll('circle')
    .data(view.sort((a,b)=>b.totalLines - a.totalLines), d=>d.id);

  sel.join(
    enter => enter.append('circle')
      .attr('cx', d=>xScale(d.datetime))
      .attr('cy', d=>yScale(d.hourFrac))
      .attr('r', 0)
      .style('fill','steelblue')
      .style('fill-opacity',0.7)
      .on('mouseenter', (e,d) => {
        d3.select(e.currentTarget).style('fill-opacity',1);
        renderTooltip(d); moveTooltip(e); showTooltip(true);
      })
      .on('mousemove', e => moveTooltip(e))
      .on('mouseleave', e => {
        d3.select(e.currentTarget).style('fill-opacity',0.7);
        showTooltip(false);
      })
      .call(s => s.transition().attr('r', d=>rScale(d.totalLines))),

    update => update
      .attr('cx', d=>xScale(d.datetime))
      .attr('cy', d=>yScale(d.hourFrac))
      .transition()
      .attr('r', d=>rScale(d.totalLines))
      .on('end', function(d) {
        // ensure handlers are still there
        d3.select(this)
          .on('mouseenter', (e,d)=>{ moveTooltip(e); renderTooltip(d); showTooltip(true); })
          .on('mousemove', e=>moveTooltip(e))
          .on('mouseleave', e=>showTooltip(false));
      }),

    exit => exit.transition().attr('r',0).remove()
  );
}

const colorScale = d3.scaleOrdinal(d3.schemeTableau10);

function updateFileDisplay(view) {
  const lines = view.flatMap(d=>d.lines);
  const files = d3.groups(lines, d=>d.file)
    .map(([name, lines]) => ({ name, lines }))
    .sort((a,b)=>b.lines.length - a.lines.length);

  const container = d3.select('#files')
    .selectAll('div.file')
    .data(files, d=>d.name)
    .join(
      enter => {
        const div = enter.append('div').attr('class','file');
        div.append('dt').append('code');
        div.append('dd');
        return div;
      },
      update => update,
      exit   => exit.remove()
    );

  container.select('dt code').text(d=>d.name);
  container.select('dd')
    .selectAll('div.loc')
    .data(d=>d.lines)
    .join('div')
      .attr('class','loc')
      .style('background', d=>colorScale(d.type));
}

function buildStory() {
  d3.select('#scatter-story')
    .selectAll('div.step')
    .data(commits)
    .join('div')
      .attr('class','step')
      .html(d => `
        <p>
          On ${d.datetime.toLocaleString('en',{dateStyle:'full',timeStyle:'short'})},
          I made <a href="${d.url}" target="_blank">${
            d === commits[0] ? 'my first glorious commit' : 'another glorious patch'
          }</a>,
          editing ${d.totalLines} lines across ${
            d3.rollups(d.lines, v=>v.length, x=>x.file).length
          } files.
        </p>
      `);
}

function initScrolly() {
  const scroller = scrollama();
  scroller
    .setup({
      container: '#scrolly-1',
      step: '#scrolly-1 .step',
      offset: 0.5
    })
    .onStepEnter(({ element }) => {
      const commit = element.__data__;
      const view = commits.filter(d => d.datetime <= commit.datetime);
      updateScatter(view);
      updateFileDisplay(view);
    });
}

(async ()=>{
  await loadAndProcess();
  renderTopStats();
  drawScatter(commits);
  setupSlider();
  updateFileDisplay(commits);
  buildStory();
  initScrolly();
})();
