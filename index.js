import { fetchJSON, renderProjects, fetchGitHubData } from './global.js';

(async () => {
  const allProjects = await fetchJSON('./lib/projects.json');
  const latestProjects = Array.isArray(allProjects)
    ? allProjects.slice(0, 3)
    : [];
  const projectsContainer = document.querySelector('.projects');
  if (projectsContainer) {
    renderProjects(latestProjects, projectsContainer, 'h2');
  } else {
    console.error('No .projects container found on the page');
  }

  const githubData = await fetchGitHubData('parthshindee'); 

  const profileStats = document.querySelector('#profile-stats');
  if (profileStats && githubData) {
    profileStats.innerHTML = `
      <h2>GitHub Profile</h2>
      <dl class="profile-grid">
        <dt>Public Repos:</dt><dd>${githubData.public_repos ?? '-'}</dd>
        <dt>Public Gists:</dt><dd>${githubData.public_gists ?? '-'}</dd>
        <dt>Followers:</dt><dd>${githubData.followers ?? '-'}</dd>
        <dt>Following:</dt><dd>${githubData.following ?? '-'}</dd>
      </dl>
    `;
  }
})();