/* The whole of this page's behaviour, and the only JavaScript on it. The menu itself is CSS:
   this exists because a menu that opens without saying so, cannot be closed with Escape and
   drops the focus where it stood is a menu for mice only.

   It also splits the words into letters here rather than in the HTML, so the markup stays
   readable and a screen reader hears "How it works" instead of eleven separate letters. */
(() => {
  const panel = document.getElementById('menu');
  const burger = document.querySelector('.burger');
  const close = panel && panel.querySelector('.menu-close');
  // All three or none. Bailing here leaves the header links in place, because the stylesheet
  // only hides them once this file reaches its last line.
  if (!panel || !burger || !close) return;

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

  function setOpen(open, { restoreFocus = true } = {}) {
    burger.setAttribute('aria-expanded', String(open));
    panel.classList.toggle('is-open', open);

    // Everything behind a full-screen menu is out of reach, and Tab should agree.
    for (const element of document.body.children) {
      if (element !== panel) element.inert = open;
    }

    // Focus the dialog, not the first control in it: a ring drawn around the close button is
    // the wrong thing to greet somebody with, and a screen reader should hear the menu first.
    if (open) panel.focus();
    else if (restoreFocus) burger.focus();
  }

  burger.addEventListener('click', () => setOpen(!isOpen()));
  close.addEventListener('click', () => setOpen(false));

  // Every link in here points further down this same page, so the menu has done its job.
  // Focus is left where the link sends it rather than dragged back to the button: somebody who
  // just asked for Safety should carry on from Safety, not from the header they dismissed.
  panel.addEventListener('click', (event) => {
    if (event.target.closest('a')) setOpen(false, { restoreFocus: false });
  });

  document.addEventListener('keydown', (event) => {
    if (event.key === 'Escape' && isOpen()) setOpen(false);
  });

  // Last, on purpose. The stylesheet hides the header links and shows the button only under
  // this class, so the swap happens once the menu is proven to work rather than once the page
  // is parsed. Scripting off, this file blocked, an exception above: in every one of those the
  // class is absent and the four links are simply still there.
  document.documentElement.classList.add('js');
})();
