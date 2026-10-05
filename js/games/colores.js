/* Colores y formas: comprensión de instrucciones orales, discriminación visual, y combinar dos atributos. */
Games.push({
  id: 'colores',
  name: 'Colores',
  emoji: '🎨',
  color: '#ffb000',
  learns: 'Colores, formas geométricas y seguir instrucciones con dos condiciones.',
  maxLevel: 3,
  start(root, exit) {
    const COLORS = [['rojo', 'roja', '#e8323c'], ['azul', 'azul', '#2f80ff'], ['verde', 'verde', '#2ebd6b'],
                    ['amarillo', 'amarilla', '#ffd23f'], ['naranja', 'naranja', '#ff8a1c'], ['morado', 'morada', '#8e4ad8'], ['rosa', 'rosa', '#ff6fa5']];
    const SHAPES = [['círculo', 'el', 'm'], ['cuadrado', 'el', 'm'], ['triángulo', 'el', 'm'], ['estrella', 'la', 'f'], ['corazón', 'el', 'm']];

    const svg = (shape, fill) => {
      const p = {
        'círculo':   `<circle cx="50" cy="50" r="42"/>`,
        'cuadrado':  `<rect x="10" y="10" width="80" height="80" rx="6"/>`,
        'triángulo': `<polygon points="50,8 94,90 6,90"/>`,
        'estrella':  `<polygon points="50,5 61,38 96,38 68,59 79,93 50,72 21,93 32,59 4,38 39,38"/>`,
        'corazón':   `<path d="M50 88 C10 60 5 35 25 20 C38 11 50 20 50 30 C50 20 62 11 75 20 C95 35 90 60 50 88Z"/>`
      }[shape];
      return `<svg class="shape" viewBox="0 0 100 100" fill="${fill}">${p}</svg>`;
    };
    const colorWord = (c, shape) => shape && shape[2] === 'f' ? c[1] : c[0];

    Core.runQuiz(root, {
      id: this.id, maxLevel: this.maxLevel,
      makeQuestion(level) {
        if (level === 1) {
          const opts = Core.sample(COLORS, 3), target = Core.pick(opts);
          return {
            text: `Toca el color ${target[0]}`, say: `Toca el color ${target[0]}.`,
            options: opts.map(c => ({ html: svg('círculo', c[2]), value: c[0], sayLabel: c[0] })),
            answer: target[0]
          };
        }
        if (level === 2) {
          const opts = Core.sample(SHAPES, 3), target = Core.pick(opts), c = Core.pick(COLORS);
          return {
            text: `Toca ${target[1]} ${target[0]}`, say: `Toca ${target[1]} ${target[0]}.`,
            options: opts.map(s => ({ html: svg(s[0], c[2]), value: s[0], sayLabel: `${s[1] === 'la' ? 'una' : 'un'} ${s[0]}` })),
            answer: target[0]
          };
        }
        // Nivel 3: forma + color, con distractores que comparten uno de los dos atributos.
        const [s1, s2] = Core.sample(SHAPES, 2), [c1, c2] = Core.sample(COLORS, 2);
        const items = Core.shuffle([[s1, c1], [s1, c2], [s2, c1], [s2, c2]]);
        const label = ([s, c]) => `${s[1]} ${s[0]} ${colorWord(c, s)}`;
        const target = label([s1, c1]);
        return {
          text: `Toca ${target}`, say: `Fíjate bien. Toca ${target}.`,
          options: items.map(it => ({ html: svg(it[0][0], it[1][2]), value: label(it), sayLabel: label(it) })),
          answer: target
        };
      }
    }, exit);
  }
});
