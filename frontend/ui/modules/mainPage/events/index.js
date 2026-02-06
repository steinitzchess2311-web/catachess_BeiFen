const loginUrl = '/frontend/ui/modules/login/layout/LoginPage.html?redirect=/workspace-select.html';

const bindLogin = (id) => {
  const button = document.getElementById(id);
  if (!button) return;
  button.addEventListener('click', () => {
    window.location.assign(loginUrl);
  });
};

bindLogin('main-login-cta');
bindLogin('main-login-primary');
