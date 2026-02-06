const routes = {
  login: '/login?redirect=/workspace-select',
  signup: '/signup?redirect=/workspace-select',
};

const bind = (id, target) => {
  const button = document.getElementById(id);
  if (!button) return;
  button.addEventListener('click', () => {
    window.location.assign(target);
  });
};

bind('top-login', routes.login);
bind('top-signup', routes.signup);
bind('main-login', routes.login);
bind('main-signup', routes.signup);
