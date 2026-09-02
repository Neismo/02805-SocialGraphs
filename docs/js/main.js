/**
 * 02805 Social Graphs - Core Shared JavaScript
 */

document.addEventListener('DOMContentLoaded', () => {
  initThemeToggle();
  initMobileMenu();
  initCodeCopyButtons();
});

/* --------------------------------------------------
   Theme Switcher (Dark / Light Mode)
   -------------------------------------------------- */
function initThemeToggle() {
  const themeToggleBtn = document.getElementById('theme-toggle');
  if (!themeToggleBtn) return;
  const themeIcon = themeToggleBtn.querySelector('.theme-icon') || themeToggleBtn;
  
  // Check persisted preference or OS scheme
  const savedTheme = localStorage.getItem('sg-theme');
  const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
  
  if (savedTheme === 'dark' || (!savedTheme && prefersDark)) {
    document.body.classList.remove('theme-light');
    document.body.classList.add('theme-dark');
    themeIcon.textContent = '☀️';
  } else {
    document.body.classList.remove('theme-dark');
    document.body.classList.add('theme-light');
    themeIcon.textContent = '🌙';
  }

  themeToggleBtn.addEventListener('click', () => {
    if (document.body.classList.contains('theme-dark')) {
      document.body.classList.remove('theme-dark');
      document.body.classList.add('theme-light');
      themeIcon.textContent = '🌙';
      localStorage.setItem('sg-theme', 'light');
    } else {
      document.body.classList.remove('theme-light');
      document.body.classList.add('theme-dark');
      themeIcon.textContent = '☀️';
      localStorage.setItem('sg-theme', 'dark');
    }
  });
}

/* --------------------------------------------------
   Mobile Navigation Toggle
   -------------------------------------------------- */
function initMobileMenu() {
  const menuBtn = document.getElementById('mobile-menu-btn');
  const navLinks = document.getElementById('nav-links');
  
  if (!menuBtn || !navLinks) return;

  menuBtn.addEventListener('click', () => {
    navLinks.classList.toggle('open');
  });

  navLinks.querySelectorAll('a').forEach(link => {
    link.addEventListener('click', () => {
      navLinks.classList.remove('open');
    });
  });
}

/* --------------------------------------------------
   Code Snippet Copy Button
   -------------------------------------------------- */
function initCodeCopyButtons() {
  document.querySelectorAll('.btn-copy').forEach(btn => {
    btn.addEventListener('click', () => {
      const targetId = btn.getAttribute('data-target');
      const codeElem = targetId ? document.getElementById(targetId) : btn.closest('.code-container').querySelector('code');
      if (codeElem) {
        navigator.clipboard.writeText(codeElem.innerText).then(() => {
          const origText = btn.textContent;
          btn.textContent = 'Copied!';
          btn.style.color = '#34d399';
          setTimeout(() => {
            btn.textContent = origText;
            btn.style.color = '';
          }, 2000);
        }).catch(err => {
          console.error('Failed to copy code: ', err);
        });
      }
    });
  });
}
