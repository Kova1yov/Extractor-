// ═══════════════════════════════════════════════════════════════
// TITLE ANIMATIONS
// ═══════════════════════════════════════════════════════════════

function changeAnimation(type) {
  const title = document.getElementById('animated-title');

  title.className = '';

  switch(type) {
    case 'gradient-flow':
      title.className = 'title-gradient-flow';
      const letters = title.querySelectorAll('.letter');
      letters.forEach((letter, i) => {
        letter.style.setProperty('--i', i);
        letter.style.setProperty('--random', Math.random());
        letter.style.setProperty('--scale-1', 0.95 + Math.random() * 0.3);
        letter.style.setProperty('--scale-2', 0.85 + Math.random() * 0.2);
        letter.style.setProperty('--scale-3', 1.0 + Math.random() * 0.25);
      });
      break;
    case 'wave':
      title.className = 'title-wave';
      const waveLetters = title.querySelectorAll('.letter');
      waveLetters.forEach((letter, i) => {
        letter.style.setProperty('--i', i);
      });
      break;
    case 'pulse':
      title.className = 'title-pulse';
      break;
    case 'typing':
      title.className = 'title-typing';
      break;
    case 'glitch':
      title.className = 'title-glitch';
      title.setAttribute('data-text', title.textContent.trim());
      break;
    case 'none':
      title.className = 'title-none';
      break;
  }

  localStorage.setItem('titleAnimation', type);
}
