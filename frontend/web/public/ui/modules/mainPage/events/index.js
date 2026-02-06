const loginUrl = '/login?redirect=/workspace-select';

const bindLogin = (id) => {
  const button = document.getElementById(id);
  if (!button) return;
  button.addEventListener('click', () => {
    window.location.assign(loginUrl);
  });
};

bindLogin('main-login-cta');
bindLogin('main-login-primary');
