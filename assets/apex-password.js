// APEX by THE ARC — Password / Exhibition Page Interactivity
document.addEventListener('DOMContentLoaded', () => {
  const modal = document.getElementById('passwordModal');
  const openBtn = document.getElementById('openPasswordModal');
  const footerOpenBtn = document.getElementById('footerPasswordTrigger');
  const closeBtn = document.getElementById('closePasswordModal');
  const passwordInput = document.getElementById('password');

  function openModal() {
    if (!modal) return;
    modal.classList.add('is-open');
    modal.setAttribute('aria-hidden', 'false');
    document.body.style.overflow = 'hidden';
    setTimeout(() => {
      if (passwordInput) passwordInput.focus();
    }, 100);
  }

  function closeModal() {
    if (!modal) return;
    modal.classList.remove('is-open');
    modal.setAttribute('aria-hidden', 'true');
    document.body.style.overflow = '';
  }

  if (openBtn) openBtn.addEventListener('click', openModal);
  if (footerOpenBtn) footerOpenBtn.addEventListener('click', openModal);
  if (closeBtn) closeBtn.addEventListener('click', closeModal);

  if (modal) {
    modal.addEventListener('click', (e) => {
      if (e.target === modal) closeModal();
    });
  }

  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && modal && modal.classList.contains('is-open')) {
      closeModal();
    }
  });

  // Auto-open modal if there was a password submission error
  if (modal && modal.querySelector('.apex-form-error')) {
    openModal();
  }
});
