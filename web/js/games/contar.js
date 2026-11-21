/* Contar (los objetos los pone el tema): conteo 1-10, reconocer la cifra y, en el último nivel, sumar dos grupos. */
Games.push({
  id: 'contar',
  name: 'Cuenta', art: t => (t.id === 'granja' ? 'vaca' : null),
  emoji: t => t.sets.contables[0][0],
  color: '#ff6fa5',
  learns: 'Contar del 1 al 10, asociar cantidad con cifra y primeras sumas.',
  how: ['Cuenta los dibujos que aparecen. Puedes ayudarte con el dedo.', 'Toca el número que has contado.', 'En el nivel más alto llegan más: di cuántos hay en total.', 'Si fallas, no pasa nada. Prueba otra vez.'],
  maxLevel: 4,
  start(root, exit) {
    const ANIMALS = Themes.set('contables');
    const NUM = ['cero', 'uno', 'dos', 'tres', 'cuatro', 'cinco', 'seis', 'siete', 'ocho', 'nueve', 'diez'];
    const ranges = { 1: [1, 3, 3], 2: [1, 5, 3], 3: [3, 10, 4] }; // [min, max, nº opciones]

    const makeOptions = (answer, max, n) => {
      const set = new Set([answer]);
      while (set.size < n) set.add(Core.rand(Math.max(1, answer - 3), Math.min(max, answer + 3)));
      return Core.shuffle([...set]).map(v => ({ html: v, value: v, sayLabel: NUM[v] }));
    };

    return Core.runQuiz(root, {
      id: this.id, maxLevel: this.maxLevel,
      makeQuestion(level) {
        const [emoji, plural, gen] = Core.pick(ANIMALS);
        const cuantos = gen === 'f' ? 'Cuántas' : 'Cuántos';
        if (level < 4) {
          const [min, max, n] = ranges[level];
          const count = Core.rand(min, max);
          return {
            text: `¿${cuantos} ${plural} hay?`,
            say: `¿${cuantos} ${plural} hay? Cuenta con el dedo.`,
            stage: Array(count).fill(`<span>${Core.pic(emoji)}</span>`).join(''),
            options: makeOptions(count, Math.max(max, 5), n),
            answer: count,
            explain: `Hay ${NUM[count]}.`
          };
        }
        const a = Core.rand(1, 5), b = Core.rand(1, 5);
        return {
          text: `¿${cuantos} ${plural} hay en total?`,
          say: `Aquí hay ${NUM[a]}, y llegan ${NUM[b]} más. ¿${cuantos} hay en total?`,
          stage: `<span>${Core.pic(emoji).repeat(a)}</span><span style="margin:0 12px">➕</span><span>${Core.pic(emoji).repeat(b)}</span>`,
          options: makeOptions(a + b, 10, 4),
          answer: a + b,
          explain: `${NUM[a]} más ${NUM[b]} son ${NUM[a + b]}.`
        };
      }
    }, exit);
  }
});
