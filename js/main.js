// DocFy: página de vendas. JavaScript puro, sem dependências.

const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
const finePointer = window.matchMedia('(hover: hover) and (pointer: fine)').matches;
const desktop = window.matchMedia('(min-width: 900px)');
const clamp = (v, a, b) => Math.min(b, Math.max(a, v));

// ---------- entradas ao rolar (uma vez só, nunca deixam conteúdo escondido) ----------
(() => {
  const targets = document.querySelectorAll('[data-reveal], .footer');
  if (!('IntersectionObserver' in window)) { targets.forEach((el) => el.classList.add('is-in')); return; }
  const io = new IntersectionObserver((entries) => {
    for (const entry of entries) {
      if (!entry.isIntersecting) continue;
      entry.target.classList.add('is-in');
      io.unobserve(entry.target);
    }
  }, { rootMargin: '0px 0px -8% 0px', threshold: 0.08 });
  targets.forEach((el) => io.observe(el));
  // rede de segurança: se o observer não disparar, mostra o que está na tela
  window.addEventListener('load', () => setTimeout(() => {
    targets.forEach((el) => { const r = el.getBoundingClientRect(); if (r.top < innerHeight && r.bottom > 0) el.classList.add('is-in'); });
  }, 2500));
})();

// ---------- loops decorativos: rodam 5s quando entram na tela, depois param ----------
(() => {
  const zones = document.querySelectorAll('.hero, .how, .plan--featured');
  if (!('IntersectionObserver' in window)) { zones.forEach((z) => z.classList.add('is-still')); return; }
  const timers = new Map();
  const io = new IntersectionObserver((entries) => {
    for (const { target, isIntersecting } of entries) {
      clearTimeout(timers.get(target));
      if (isIntersecting) {
        target.classList.remove('is-still');
        timers.set(target, setTimeout(() => target.classList.add('is-still'), 5000));
      } else {
        target.classList.add('is-still');
      }
    }
  }, { threshold: 0.15 });
  zones.forEach((z) => io.observe(z));
})();

// ---------- cabeçalho fica mais opaco depois do topo ----------
(() => {
  const nav = document.getElementById('nav');
  if (!nav) return;
  const update = () => nav.classList.toggle('is-scrolled', window.scrollY > 24);
  window.addEventListener('scroll', update, { passive: true });
  update();
})();

// ---------- contadores que sobem ao entrar na tela ----------
(() => {
  const counters = document.querySelectorAll('[data-count]');
  if (reduceMotion || !('IntersectionObserver' in window)) return; // o HTML já traz o valor final
  const io = new IntersectionObserver((entries) => {
    for (const entry of entries) {
      if (!entry.isIntersecting) continue;
      io.unobserve(entry.target);
      const el = entry.target;
      const target = Number(el.dataset.count);
      const suffix = el.dataset.suffix || '';
      const duration = 1400;
      const start = performance.now();
      const tick = (now) => {
        const t = clamp((now - start) / duration, 0, 1);
        const eased = 1 - Math.pow(1 - t, 4);
        el.textContent = Math.round(eased * target) + suffix;
        if (t < 1) requestAnimationFrame(tick);
      };
      el.textContent = '0' + suffix;
      requestAnimationFrame(tick);
    }
  }, { threshold: 0.6 });
  counters.forEach((c) => io.observe(c));
})();

// ---------- topo: grade que brilha sob o mouse + pilha 3D com inclinação e parallax ----------
(() => {
  const hero = document.getElementById('topo');
  const stack = document.getElementById('stack3d');
  const inner = document.getElementById('stack3d-inner');
  if (!hero || !stack || !inner || reduceMotion) return;

  let tx = 0, ty = 0, rx = 0, ry = 0, scrollY = 0, raf = 0;
  const render = () => {
    rx += (tx - rx) * 0.08;
    ry += (ty - ry) * 0.08;
    const lift = desktop.matches ? clamp(scrollY * -0.12, -120, 0) : 0;
    inner.style.transform = `translate3d(0, ${lift.toFixed(1)}px, 0) rotateX(${rx.toFixed(2)}deg) rotateY(${ry.toFixed(2)}deg)`;
    raf = (Math.abs(tx - rx) > 0.01 || Math.abs(ty - ry) > 0.01) ? requestAnimationFrame(render) : 0;
  };
  const kick = () => { if (!raf) raf = requestAnimationFrame(render); };

  if (finePointer) {
    hero.addEventListener('pointermove', (e) => {
      const r = hero.getBoundingClientRect();
      const x = (e.clientX - r.left) / r.width;
      const y = (e.clientY - r.top) / r.height;
      hero.style.setProperty('--mx', `${(x * 100).toFixed(1)}%`);
      hero.style.setProperty('--my', `${(y * 100).toFixed(1)}%`);
      hero.classList.add('is-pointer');
      ty = (x - 0.5) * 16;
      tx = (0.5 - y) * 10;
      kick();
    });
    hero.addEventListener('pointerleave', () => { hero.classList.remove('is-pointer'); tx = 0; ty = 0; kick(); });
  }
  window.addEventListener('scroll', () => {
    if (window.scrollY > innerHeight * 1.2) return;
    scrollY = window.scrollY;
    kick();
  }, { passive: true });
})();

// ---------- cards: a borda de brilho segue o mouse ----------
(() => {
  if (!finePointer) return;
  document.addEventListener('pointermove', (e) => {
    const card = e.target.closest && e.target.closest('.glow-card');
    if (!card) return;
    const r = card.getBoundingClientRect();
    card.style.setProperty('--gx', `${e.clientX - r.left}px`);
    card.style.setProperty('--gy', `${e.clientY - r.top}px`);
  }, { passive: true });
})();

// ---------- mini-editor: o PDF se monta com o que a pessoa digita ----------
(() => {
  const nome = document.getElementById('demo-nome');
  const cliente = document.getElementById('demo-cliente');
  const a4 = document.getElementById('demo-a4');
  if (!nome || !cliente || !a4) return;

  const kind = document.getElementById('demo-kind');
  const title = document.getElementById('demo-title');
  const body = document.getElementById('demo-body');
  const file = document.getElementById('demo-file');
  const date = document.getElementById('demo-date');
  const pills = [...document.querySelectorAll('.pill')];

  date.textContent = new Intl.DateTimeFormat('pt-BR', { day: 'numeric', month: 'long', year: 'numeric' }).format(new Date());

  // conteúdo fixo (não vem do visitante), por isso pode ir como HTML
  const row = (a, b, total) => `<p class="a4__row${total ? ' a4__row--total' : ''}"><span>${a}</span><span>${b}</span></p>`;
  const h = (t) => `<p class="a4__h">${t}</p>`;
  const p = (t) => `<p class="a4__p">${t}</p>`;
  const docs = {
    entregavel: { file: 'Novo relatório de entrega', kind: 'Relatório de entrega', title: 'Projeto entregue para',
      body: h('O que foi entregue') + row('Logo e variações', 'Concluído') + row('Manual da marca', 'Concluído') + h('Próximo passo') + p('Aplicação nas embalagens, a partir da semana que vem.') },
    orcamento: { file: 'Novo orçamento', kind: 'Orçamento nº 028', title: 'Orçamento para',
      body: h('Itens') + row('Logo e variações', 'R$ 900,00') + row('Manual da marca', 'R$ 600,00') + row('Total', 'R$ 1.500,00', true) },
    proposta: { file: 'Nova proposta', kind: 'Proposta comercial', title: 'Identidade visual para',
      body: h('Apresentação') + p('Uma marca que traduz a casa: acolhedora, direta e fácil de reconhecer na rua.') + h('Investimento') + row('Logo, paleta e manual', 'R$ 1.800,00') },
    contrato: { file: 'Novo contrato', kind: 'Contrato de prestação de serviços', title: 'Contrato com',
      body: h('Cláusula 1. Do objeto') + p('Criação de identidade visual, com até 2 rodadas de ajuste.') + h('Cláusula 2. Do valor') + p('R$ 1.800,00, em 2 parcelas via Pix.') },
    curriculo: { file: 'Novo currículo', kind: 'Currículo', title: 'Candidatura para',
      body: h('Experiência') + row('Designer gráfica, freelancer', '2022–2026') + h('Habilidades') + p('Identidade visual, social media, Figma, atendimento ao cliente.') },
  };

  // o texto digitado entra só por textContent
  const bind = () => {
    document.querySelectorAll('[data-bind="nome"]').forEach((el) => { el.textContent = nome.value.trim() || 'Seu nome'; });
    document.querySelectorAll('[data-bind="cliente"]').forEach((el) => { el.textContent = cliente.value.trim() || 'seu cliente'; });
  };

  let current = 'proposta';
  const show = (key) => {
    if (key === current) return;
    current = key;
    const d = docs[key];
    pills.forEach((b) => b.setAttribute('aria-pressed', String(b.dataset.doc === key)));
    a4.classList.add('is-swapping');
    setTimeout(() => {
      file.textContent = d.file;
      kind.textContent = d.kind;
      title.textContent = d.title;
      body.innerHTML = d.body;
      a4.classList.remove('is-swapping');
    }, reduceMotion ? 0 : 200);
  };

  // uma volta automática pelos cinco tipos enquanto ninguém mexe, depois para
  const order = Object.keys(docs);
  let timer = null;
  let touched = false;
  const stop = () => { touched = true; clearInterval(timer); timer = null; };
  const start = () => {
    if (touched || reduceMotion || timer) return;
    timer = setInterval(() => {
      const next = order[(order.indexOf(current) + 1) % order.length];
      show(next);
      if (next === 'proposta') stop();
    }, 3000);
  };

  pills.forEach((b) => b.addEventListener('click', () => { stop(); show(b.dataset.doc); }));
  [nome, cliente].forEach((input) => { input.addEventListener('input', bind); input.addEventListener('focus', stop); });
  bind();

  if ('IntersectionObserver' in window) {
    new IntersectionObserver(([e]) => { if (e.isIntersecting) start(); else { clearInterval(timer); timer = null; } }, { threshold: 0.5 })
      .observe(a4.closest('.window'));
  }
  document.addEventListener('visibilitychange', () => { if (document.hidden) { clearInterval(timer); timer = null; } });
})();

// ---------- os 5 documentos: troca pela rolagem (desktop) ou por abas e deslize (celular) ----------
(() => {
  const track = document.getElementById('docs-track');
  const stage = document.getElementById('docs-stage');
  const caption = document.getElementById('docs-caption');
  if (!track || !stage) return;
  const items = [...track.querySelectorAll('.docs__item')];
  const pages = [...stage.querySelectorAll('.docs__page')];
  const n = items.length;
  let active = 0;

  const setActive = (i) => {
    if (i === active) return;
    active = i;
    items.forEach((it, k) => { it.classList.toggle('is-active', k === i); it.setAttribute('aria-pressed', String(k === i)); });
    pages.forEach((pg, k) => { pg.classList.toggle('is-active', k === i); pg.classList.toggle('is-before', k < i); pg.style.removeProperty('--par'); });
    if (caption) caption.textContent = items[i].querySelector('.docs__desc').textContent;
    if (!desktop.matches) items[i].scrollIntoView({ behavior: reduceMotion ? 'auto' : 'smooth', block: 'nearest', inline: 'center' });
  };

  // desktop: a seção fica presa enquanto a rolagem passa pelos cinco tipos
  let ticking = false;
  const onScroll = () => {
    ticking = false;
    if (!desktop.matches) return;
    const r = track.getBoundingClientRect();
    const total = r.height - innerHeight;
    if (total <= 0) return;
    const p = clamp(-r.top / total, 0, 0.9999);
    const i = Math.floor(p * n);
    const local = p * n - i;
    setActive(i);
    items[i].style.setProperty('--p', local.toFixed(3));
    if (!reduceMotion) pages[i].style.setProperty('--par', `${((0.5 - local) * 36).toFixed(1)}px`);
  };
  window.addEventListener('scroll', () => { if (!ticking) { ticking = true; requestAnimationFrame(onScroll); } }, { passive: true });
  desktop.addEventListener('change', onScroll);
  onScroll();

  items.forEach((it, i) => it.addEventListener('click', () => {
    if (desktop.matches) {
      const r = track.getBoundingClientRect();
      const total = r.height - innerHeight;
      window.scrollTo({ top: window.scrollY + r.top + ((i + 0.15) / n) * total, behavior: reduceMotion ? 'auto' : 'smooth' });
    } else {
      setActive(i);
    }
  }));

  // celular: deslizar a folha para o lado também troca (as abas continuam como alternativa)
  let x0 = null;
  stage.addEventListener('pointerdown', (e) => { if (!desktop.matches) x0 = e.clientX; });
  stage.addEventListener('pointerup', (e) => {
    if (x0 === null) return;
    const dx = e.clientX - x0;
    x0 = null;
    if (Math.abs(dx) < 40) return;
    setActive(clamp(active + (dx < 0 ? 1 : -1), 0, n - 1));
  });
  stage.addEventListener('pointercancel', () => { x0 = null; });
})();

// ---------- para quem é: apontar uma linha mostra o documento dela ----------
(() => {
  const rows = [...document.querySelectorAll('.index__row')];
  const pages = [...document.querySelectorAll('.index__frame .a4')];
  if (!rows.length || !pages.length) return;
  rows.forEach((r, i) => r.addEventListener('mouseenter', () => {
    rows.forEach((x, k) => x.classList.toggle('is-on', k === i));
    pages.forEach((pg, k) => pg.classList.toggle('is-on', k === i));
  }));
})();

// ---------- chamada final: o plano escolhido define o link de compra ----------
(() => {
  const buy = document.getElementById('cta-buy');
  const sum = document.getElementById('cta-sum');
  if (!buy) return;
  document.querySelectorAll('input[name="plano"]').forEach((r) => r.addEventListener('change', () => {
    if (!r.checked) return;
    buy.href = r.dataset.href;
    buy.textContent = r.dataset.label;
    sum.textContent = r.dataset.sum;
  }));
})();
