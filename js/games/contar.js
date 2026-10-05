/* Contar animales: conteo 1-10, reconocer la cifra y, en el último nivel, sumar dos grupos. */
Games.push({
  id: 'contar',
  name: 'Cuenta',
  emoji: '🐷',
  color: '#ff6fa5',
  learns: 'Contar del 1 al 10, asociar cantidad con cifra y primeras sumas.',
  maxLevel: 4,
  start(root, exit) {
    const ANIMALS = [['🐷', 'cerditos', 'm'], ['🐮', 'vacas', 'f'], ['🐔', 'gallinas', 'f'], ['🐑', 'ovejas', 'f'], ['🐴', 'caballos', 'm'], ['🐶', 'perritos', 'm'], ['🐱', 'gatitos', 'm'], ['🐰', 'conejos', 'm']];
    const NUM = ['cero', 'uno', 'dos', 'tres', 'cuatro', 'cinco', 'seis', 'siete', 'ocho', 'nueve', 'diez'];
    const ranges = { 1: [1, 3, 3], 2: [1, 5, 3], 3: [3, 10, 4] }; // [min, max, nº opciones]

    const makeOptions = (answer, max, n) => {
      const set = new Set([answer]);
      while (set.size < n) set.add(Core.rand(Math.max(1, answer - 3), Math.min(max, answer + 3)));
      return Core.shuffle([...set]).map(v => ({ html: v, value: v, sayLabel: NUM[v] }));
    };

    Core.runQuiz(root, {
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
            stage: emoji.repeat(count).replace(/(\p{Extended_Pictographic})/gu, '<span>$1</span>'),
            options: makeOptions(count, Math.max(max, 5), n),
            answer: count,
            explain: `Hay ${NUM[count]}.`
          };
        }
        const a = Core.rand(1, 5), b = Core.rand(1, 5);
        return {
          text: `¿${cuantos} ${plural} hay en total?`,
          say: `Aquí hay ${NUM[a]}, y llegan ${NUM[b]} más. ¿${cuantos} hay en total?`,
          stage: `<span>${emoji.repeat(a)}</span><span style="margin:0 12px">➕</span><span>${emoji.repeat(b)}</span>`,
          options: makeOptions(a + b, 10, 4),
          answer: a + b,
          explain: `${NUM[a]} más ${NUM[b]} son ${NUM[a + b]}.`
        };
      }
    }, exit);
  }
});
