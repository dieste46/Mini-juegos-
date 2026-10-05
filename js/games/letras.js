/* Letras: conciencia fonológica (sonido inicial) y reconocimiento de letras, sin necesidad de saber leer. */
Games.push({
  id: 'letras',
  name: 'Letras',
  emoji: '🔤',
  color: '#2ebd6b',
  learns: 'Sonido inicial de las palabras, vocales y primeras consonantes (base de la lectura).',
  maxLevel: 3,
  start(root, exit) {
    const WORDS = {
      A: [['🐝', 'abeja'], ['🌳', 'árbol'], ['✈️', 'avión'], ['🕷️', 'araña']],
      E: [['🐘', 'elefante'], ['⭐', 'estrella'], ['🧹', 'escoba']],
      I: [['🏝️', 'isla'], ['🧲', 'imán'], ['🦎', 'iguana']],
      O: [['🐻', 'oso'], ['🐑', 'oveja'], ['👁️', 'ojo'], ['🌊', 'ola']],
      U: [['🍇', 'uva'], ['🦄', 'unicornio']],
      M: [['🐵', 'mono'], ['🍎', 'manzana'], ['🏍️', 'moto'], ['🦋', 'mariposa']],
      P: [['🦆', 'pato'], ['🍐', 'pera'], ['🐶', 'perro'], ['🐟', 'pez'], ['⚽', 'pelota']],
      S: [['☀️', 'sol'], ['🍄', 'seta'], ['🐍', 'serpiente'], ['🪑', 'silla']],
      L: [['🌙', 'luna'], ['🦁', 'león'], ['🍋', 'limón'], ['✏️', 'lápiz']],
      T: [['🍅', 'tomate'], ['🐢', 'tortuga'], ['🚂', 'tren'], ['☕', 'taza']]
    };
    const NAME = { A: 'a', E: 'e', I: 'i', O: 'o', U: 'u', M: 'eme', P: 'pe', S: 'ese', L: 'ele', T: 'te' };
    const VOWELS = ['A', 'E', 'I', 'O', 'U'], CONS = ['M', 'P', 'S', 'L', 'T'];
    // Alarga la primera letra para que se oiga el sonido: "mmmono", "ooooso".
    const stretch = w => w[0].repeat(3) + w.slice(1);

    Core.runQuiz(root, {
      id: this.id, maxLevel: this.maxLevel,
      makeQuestion(level) {
        if (level <= 2) {
          const pool = level === 1 ? VOWELS : [...VOWELS, ...CONS];
          const letter = level === 1 ? Core.pick(VOWELS) : Core.pick(CONS);
          const [emoji, word] = Core.pick(WORDS[letter]);
          const opts = Core.shuffle([letter, ...Core.sample(pool.filter(l => l !== letter), 2)]);
          return {
            text: `¿Con qué letra empieza ${word}?`,
            say: `${stretch(word)}. ¿Con qué letra empieza ${word}?`,
            stage: `<span style="font-size:5rem">${emoji}</span>`,
            options: opts.map(l => ({ html: l, value: l, sayLabel: `la ${NAME[l]}` })),
            answer: letter,
            explain: `${word} empieza por la ${NAME[letter]}.`
          };
        }
        // Nivel 3: al revés, letra -> dibujo.
        const [letter, ...others] = Core.sample([...VOWELS, ...CONS], 3);
        const target = Core.pick(WORDS[letter]);
        const opts = Core.shuffle([target, ...others.map(l => Core.pick(WORDS[l]))]);
        return {
          text: `¿Qué empieza por la ${letter}?`,
          say: `Busca algo que empiece por la ${NAME[letter]}.`,
          stage: `<span style="font-size:5rem;font-weight:800">${letter} ${letter.toLowerCase()}</span>`,
          options: opts.map(([e, w]) => ({ html: e, value: w, sayLabel: w })),
          answer: target[1],
          explain: `${target[1]} empieza por la ${NAME[letter]}.`
        };
      }
    }, exit);
  }
});
