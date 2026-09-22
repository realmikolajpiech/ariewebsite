// Replace these two values with the verified store listings at launch.
const STORE_URLS = { android: null, ios: null };
const dialog = document.querySelector('#download-dialog');
document.querySelector('#footer-downloads').innerHTML = document.querySelector('#hero-downloads').innerHTML;
document.querySelectorAll('[data-platform]').forEach(button => button.addEventListener('click', () => {
  const platform = button.dataset.platform;
  if (STORE_URLS[platform]) { window.location.assign(STORE_URLS[platform]); return; }
  document.querySelector('#dialog-title').textContent = `Arie for ${platform === 'ios' ? 'iOS' : 'Android'}`;
  dialog.showModal();
}));
document.querySelectorAll('.dialog-close,.dialog-done').forEach(button => button.addEventListener('click', () => dialog.close()));
dialog.addEventListener('click', event => {
  if (event.target !== dialog) return;
  const bounds = dialog.getBoundingClientRect();
  if (event.clientX < bounds.left || event.clientX > bounds.right || event.clientY < bounds.top || event.clientY > bounds.bottom) dialog.close();
});

// These are illustrations of supported tasks, not live executions or recordings.
const scenarios = {
  calendar: {
    label: 'A plan to remember',
    request: 'Add dinner at Koko this Friday at 7pm. Remind me an hour before.',
    heading: 'Added to your calendar',
    title: 'Dinner at Koko',
    detail: 'Friday · 7:00 pm',
    meta: ['Reminder', '1 hour before'],
    caption: 'Calendar access required. Actions vary by platform.'
  },
  message: {
    label: 'When you’re on your way',
    request: 'Tell Alex I’m on my way. I’ll be there in 10 minutes.',
    heading: 'Message sent',
    title: 'Alex',
    detail: '“I’m on my way. I’ll be there in 10 minutes.”',
    meta: ['Sending status', 'Confirmed'],
    caption: 'Requires a connected messaging account.'
  },
  notifications: {
    label: 'After a while away from your phone',
    request: 'Catch me up on my recent notifications.',
    heading: 'Recent notifications',
    notifications: [
      ['Mail', 'Your package is ready to collect.'],
      ['Calendar', 'Dinner at Koko tonight at 7.'],
      ['Alex', '“Let’s meet outside.”']
    ],
    caption: 'With notification access enabled.'
  }
};
const tabs = [...document.querySelectorAll('[role="tab"]')];
const result = document.querySelector('#demo-result');
const replay = document.querySelector('#replay');
const demoStatus = document.querySelector('#demo-status');
const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
let demoTimer;

function finishPreview() {
  clearTimeout(demoTimer);
  result.classList.remove('pending');
  result.removeAttribute('aria-hidden');
  replay.disabled = false;
  demoStatus.textContent = 'Illustrative preview';
  window.dispatchEvent(new CustomEvent('arie-working', { detail: false }));
}

function element(tag, className, text) {
  const node = document.createElement(tag);
  node.className = className;
  node.textContent = text;
  return node;
}

function selectTab(tab) {
  finishPreview();
  tabs.forEach(item => {
    item.setAttribute('aria-selected', String(item === tab));
    item.tabIndex = item === tab ? 0 : -1;
  });
  const data = scenarios[tab.dataset.scenario];
  document.querySelector('#scenario-panel').setAttribute('aria-labelledby', tab.id);
  document.querySelector('#request-label').textContent = data.label;
  document.querySelector('#demo-prompt').textContent = data.request;
  document.querySelector('#result-heading').textContent = data.heading;
  document.querySelector('#preview-caption').textContent = data.caption;
  const content = document.querySelector('#result-content');
  content.replaceChildren();
  if (data.notifications) {
    data.notifications.forEach(([source, notification]) => {
      const item = element('div', 'notification-item', '');
      item.append(element('span', '', source), document.createTextNode(notification));
      content.append(item);
    });
  } else {
    const meta = element('div', 'result-meta', '');
    data.meta.forEach(text => meta.append(element('span', '', text)));
    content.append(element('p', 'result-title', data.title), element('p', 'result-detail', data.detail), meta);
  }
}

tabs.forEach((tab, index) => {
  tab.addEventListener('click', () => selectTab(tab));
  tab.addEventListener('keydown', event => {
    let next;
    if (event.key === 'ArrowDown' || event.key === 'ArrowRight') next = (index + 1) % tabs.length;
    if (event.key === 'ArrowUp' || event.key === 'ArrowLeft') next = (index + tabs.length - 1) % tabs.length;
    if (event.key === 'Home') next = 0;
    if (event.key === 'End') next = tabs.length - 1;
    if (next === undefined) return;
    event.preventDefault();
    selectTab(tabs[next]);
    tabs[next].focus();
  });
});

replay.addEventListener('click', () => {
  finishPreview();
  if (reducedMotion.matches) return;
  result.classList.add('pending');
  result.setAttribute('aria-hidden', 'true');
  replay.disabled = true;
  demoStatus.textContent = 'Playing example…';
  window.dispatchEvent(new CustomEvent('arie-working', { detail: true }));
  demoTimer = setTimeout(finishPreview, 1200);
});
reducedMotion.addEventListener('change', finishPreview);
document.querySelector('#year').textContent = new Date().getFullYear();
