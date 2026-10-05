/* Series: completar patrones (AB, AAB, ABC, ABB...). Base del razonamiento lógico y pre-programación. */
Games.push({
  id: 'series',
  name: 'Series',
  emoji: '🧩',
  color: '#00b4c6',
  learns: 'Reconocer y continuar patrones: razonamiento lógico y pensamiento computacional.',
  maxLevel: 3,
  start(root, exit) {
    const SETS = [['🔴', '🔵', '🟡', '🟢'], ['🍎', '🍌', '🍇', '🍐'], ['🐷', '🐮', '🐔', '🐑'], ['⭐', '🌙', '☀️', '☁️'], ['🚗', '🚂', '✈️', '🚲']];
    const PATTERNS = { 1: ['AB'], 2: ['AAB', 'ABB', 'ABC'], 3: ['AABB', 'ABCB', 'ABAC', 'ABCD'] };

    Core.runQuiz(root, {
      id: this.id, maxLevel: this.maxLevel,
      makeQuestion(level) {
        const set = Core.shuffle(Core.pick(SETS));
        const pat = Core.pick(PATTERNS[level]);
        const map = ch => set['ABCD'.indexOf(ch)];
        const shownLen = pat.length * 2 + Core.rand(0, pat.length - 1);
        const seq = Array.from({ length: shownLen + 1 }, (_, i) => map(pat[i % pat.length]));
        const answer = seq.pop();
        const used = [...new Set(pat.split('').map(map))];
        // Distractores: primero los que aparecen en la serie (más difícil), luego del mismo grupo.
        const distractors = [...used, ...set.filter(x => !used.includes(x))].filter(x => x !== answer).slice(0, 2);
        const opts = Core.shuffle([answer, ...distractors]);
        return {
          text: '¿Qué viene después?',
          say: '¿Qué viene después? Mira el dibujo que se repite.',
          stage: seq.map(s => `<span>${s}</span>`).join('') + '<span style="opacity:.6">❓</span>',
          options: opts.map(o => ({ html: o, value: o })),
          answer
        };
      }
    }, exit);
  }
});
