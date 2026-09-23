/* The whole of this page's behaviour, and the only JavaScript on it. The menu itself is CSS:
   this exists because a menu that opens without saying so, cannot be closed with Escape and
   drops the focus where it stood is a menu for mice only.

   It also splits the words into letters here rather than in the HTML, so the markup stays
   readable and a screen reader hears "How it works" instead of eleven separate letters. */
(() => {
  const panel = document.getElementById('menu');
  const burger = document.querySelector('.burger');
  if (!panel || !burger) return;

  const close = panel.querySelector('.menu-close');

  panel.querySelectorAll('[data-letters]').forEach((link, row) => {
    // Its place in the list, so the rows arrive one after another rather than together.
    link.style.setProperty('--row', row);
    const words = link.textContent.trim();
    // The anchor keeps its own words as its accessible name; the letters are decoration.
    link.setAttribute('aria-label', words);

    const letters = document.createElement('span');
    letters.setAttribute('aria-hidden', 'true');
    [...words].forEach((character, index) => {
      const letter = document.createElement('span');
      letter.className = 'letter';
      // The delay lives in CSS, so the rhythm of the ripple stays a design decision.
      letter.style.setProperty('--i', index);
      // A space with nothing in it has no box, and no box cannot move.
      letter.textContent = character === ' ' ? ' ' : character;
      letters.append(letter);
    });
    link.replaceChildren(letters);
  });

  const isOpen = () => burger.getAttribute('aria-expanded') === 'true';

  function setOpen(open) {
    burger.setAttribute('aria-expanded', String(open));
    panel.classList.toggle('is-open', open);

    // Everything behind a full-screen menu is out of reach, and Tab should agree.
    for (const element of document.body.children) {
      if (element !== panel) element.inert = open;
    }

    // Focus the dialog, not the first control in it: a ring drawn around the close button is
    // the wrong thing to greet somebody with, and a screen reader should hear the menu first.
    if (open) panel.focus();
    else burger.focus();
  }

  burger.addEventListener('click', () => setOpen(!isOpen()));
  close.addEventListener('click', () => setOpen(false));

  // Every link in here points further down this same page, so the menu has done its job.
  panel.addEventListener('click', (event) => {
    if (event.target.closest('a')) setOpen(false);
  });

  document.addEventListener('keydown', (event) => {
    if (event.key === 'Escape' && isOpen()) setOpen(false);
  });
})();
