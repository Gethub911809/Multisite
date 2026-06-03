document.addEventListener('DOMContentLoaded', function () {
  const projects = Array.from(document.querySelectorAll('.project[data-hours]'));
  // Calculate total logged hours across all projects (use data-logged-hours)
  const totalLoggedHours = projects.reduce(function (sum, project) {
    return sum + Number(project.dataset.loggedHours || 0);
  }, 0);

  const totalHoursEl = document.getElementById('project-total-hours');
  if (totalHoursEl) {
    totalHoursEl.textContent = totalLoggedHours + ' hours';
  }

  projects.forEach(function (project) {
    const loggedHours = Number(project.dataset.loggedHours || 0);
    const hours = Number(project.dataset.hours || 0);
    const loggedFill = project.querySelector('.project-fill-logged');
    const totalPercentEl = project.querySelector('.project-percent-total');
    const detailEl = project.querySelector('.project-hours-detail');
    const hoursEl = project.querySelector('.project-hours');

    // Show the project's share of the total logged hours
    const loggedPercent = totalLoggedHours > 0 ? (loggedHours / totalLoggedHours) * 100 : 0;

    if (loggedFill) {
      loggedFill.style.width = loggedPercent.toFixed(1) + '%';
    }
    if (totalPercentEl) {
      totalPercentEl.textContent = loggedPercent.toFixed(1) + '% of total logged hours';
    }

    // show "logged/data logged" above the percentage
    if (detailEl) {
      detailEl.textContent = loggedHours + 'h / ' + hours + 'h logged';
    }
    if (hoursEl) {
      // display logged hours rather than total hours
      hoursEl.textContent = loggedHours + 'h';
    }
  });
});
