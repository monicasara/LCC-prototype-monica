document.addEventListener('click', function (e) {
  const btn = e.target.closest('.folder-toggle');
  if (!btn) return;

  // stop any form submit / navigation nonsense
  e.preventDefault();

  const node = btn.closest('.folder-node');
  if (!node) return;

  const children = node.querySelector(':scope > .folder-children');
  if (!children) return; // no children to toggle

  const isOpen = !children.hasAttribute('hidden');

  if (isOpen) {
    children.setAttribute('hidden', '');
    btn.textContent = '+';
  } else {
    children.removeAttribute('hidden');
    btn.textContent = '−';
  }
});

document.querySelectorAll('.folder-node').forEach(node => {
  const btn = node.querySelector(':scope > .folder-row > .folder-toggle');
  const children = node.querySelector(':scope > .folder-children');
  if (!btn || !children) return;

  btn.textContent = children.hasAttribute('hidden') ? '+' : '−';
});