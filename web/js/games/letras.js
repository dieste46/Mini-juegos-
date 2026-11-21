/* Letras: conciencia fonológica (sonido inicial) y reconocimiento de letras, sin necesidad de saber leer. */
Games.push({
  id: 'letras',
  name: 'Letras',
  emoji: '🔤', art: () => 'letras',
  color: '#2ebd6b',
  learns: 'Sonido inicial de las palabras, vocales y primeras consonantes (base de la lectura).',
  how: ['Escucha la palabra y fíjate en cómo empieza.', 'Toca la letra por la que empieza.', 'En el nivel más alto es al revés: sale una letra y hay que tocar el dibujo que empieza por ella.'],
  maxLevel: 3,
  letters: ['A', 'E', 'I', 'O', 'U', 'M', 'P', 'L', 'S', 'D', 'T'],   // las que tienen palabras: entre ellas se elige la letra de la semana
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
      D: [['🎲', 'dado'], ['☝️', 'dedo'], ['🦷', 'diente'], ['🚿', 'ducha'], ['🐬', 'delfín'], ['🦖', 'dinosaurio']],
      T: [['🍅', 'tomate'], ['🐢', 'tortuga'], ['🚂', 'tren'], ['☕', 'taza']]
    };
    // Palabras del tema actual (p. ej. espacio): se añaden y salen con más frecuencia.
    Object.entries(Themes.set('letras')).forEach(([l, ws]) => { if (WORDS[l]) WORDS[l] = [...ws, ...ws, ...WORDS[l]]; });
    const NAME = { A: 'a', E: 'e', I: 'i', O: 'o', U: 'u', M: 'eme', P: 'pe', S: 'ese', L: 'ele', D: 'de', T: 'te' };
    // Solo las letras que ya han trabajado en clase, en su orden (lo dice la familia). La T tiene sus palabras listas para cuando toque.
    const VOWELS = ['A', 'E', 'I', 'O', 'U'], CONS = ['M', 'P', 'L', 'S', 'D'];
    // La letra de la semana (zona de padres) sale más veces, en cualquier nivel.
    const WEEK = WORDS[Core.state.letter] ? Core.state.letter : null, weekTurn = () => WEEK && Math.random() < 0.4;
    // Alarga la primera letra para que se oiga el sonido: "mmmono", "ooooso".
    const stretch = w => w[0].repeat(3) + w.slice(1);

    return Core.runQuiz(root, {
      id: this.id, maxLevel: this.maxLevel,
      makeQuestion(level) {
        if (level <= 2) {
          const pool = level === 1 ? VOWELS : [...VOWELS, ...CONS];
          const letter = weekTurn() ? WEEK : level === 1 ? Core.pick(VOWELS) : Core.pick(CONS);
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
        const all = [...VOWELS, ...CONS];
        const [letter, ...others] = weekTurn() ? [WEEK, ...Core.sample(all.filter(l => l !== WEEK), 2)] : Core.sample(all, 3);
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
