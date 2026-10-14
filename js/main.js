// DocFy: página de vendas. Sem dependências.

const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

// ---------- entradas ao rolar (uma vez só, nunca deixam conteúdo escondido) ----------
(() => {
  const targets = document.querySelectorAll('[data-reveal], .sheet, .footer');
  if (!('IntersectionObserver' in window)) { targets.forEach((el) => el.classList.add('is-in')); return; }
  const io = new IntersectionObserver((entries) => {
    for (const entry of entries) {
      if (!entry.isIntersecting) continue;
      entry.target.classList.add('is-in');
      io.unobserve(entry.target);
    }
  }, { rootMargin: '0px 0px -10% 0px', threshold: 0.08 });
  targets.forEach((el) => io.observe(el));
  // rede de segurança: se o observer não disparar, mostra o que está na tela
  window.addEventListener('load', () => setTimeout(() => {
    targets.forEach((el) => { const r = el.getBoundingClientRect(); if (r.top < innerHeight && r.bottom > 0) el.classList.add('is-in'); });
  }, 2500));
})();

// ---------- demonstração: o PDF se monta com o que a pessoa digita ----------
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
  const tabs = [...document.querySelectorAll('.tabs__btn')];

  date.textContent = new Intl.DateTimeFormat('pt-BR', { day: 'numeric', month: 'long', year: 'numeric' }).format(new Date());

  const row = (a, b, total) => `<p class="a4__row${total ? ' a4__row--total' : ''}"><span>${a}</span><span>${b}</span></p>`;
  const h = (t) => `<p class="a4__h">${t}</p>`;
  const p = (t) => `<p class="a4__p">${t}</p>`;

  const docs = {
    entregavel: {
      file: 'Novo relatório de entrega', kind: 'Relatório de entrega', title: 'Projeto entregue para',
      body: () => h('O que foi entregue') + row('Logo e variações', 'Concluído') + row('Manual da marca', 'Concluído') + h('Próximo passo') + p('Aplicação nas embalagens, a partir da semana que vem.'),
    },
    orcamento: {
      file: 'Novo orçamento', kind: 'Orçamento nº 028', title: 'Orçamento para',
      body: () => h('Itens') + row('Logo e variações', 'R$ 900,00') + row('Manual da marca', 'R$ 600,00') + row('Total', 'R$ 1.500,00', true),
    },
    proposta: {
      file: 'Nova proposta', kind: 'Proposta comercial', title: 'Identidade visual para',
      body: () => h('Apresentação') + p('Uma marca que traduz a casa: acolhedora, direta e fácil de reconhecer na rua.') + h('Investimento') + row('Logo, paleta e manual', 'R$ 1.800,00'),
    },
    contrato: {
      file: 'Novo contrato', kind: 'Contrato de prestação de serviços', title: 'Contrato com',
      body: () => h('Cláusula 1. Do objeto') + p('Criação de identidade visual, com até 2 rodadas de ajuste.') + h('Cláusula 2. Do valor') + p('R$ 1.800,00, em 2 parcelas via Pix.'),
    },
    curriculo: {
      file: 'Novo currículo', kind: 'Currículo', title: 'Candidatura para',
      body: () => h('Experiência') + row('Designer gráfica, freelancer', '2022–2026') + h('Habilidades') + p('Identidade visual, social media, Figma, atendimento ao cliente.'),
    },
  };

  const bind = () => {
    document.querySelectorAll('[data-bind="nome"]').forEach((el) => { el.textContent = nome.value.trim() || 'Seu nome'; });
    document.querySelectorAll('[data-bind="cliente"]').forEach((el) => { el.textContent = cliente.value.trim() || 'seu cliente'; });
  };

  let current = 'proposta';
  const show = (key) => {
    if (key === current) return;
    current = key;
    const d = docs[key];
    tabs.forEach((t) => t.setAttribute('aria-pressed', String(t.dataset.doc === key)));
    a4.classList.add('is-swapping');
    setTimeout(() => {
      file.textContent = d.file;
      kind.textContent = d.kind;
      title.textContent = d.title;
      body.innerHTML = d.body();
      a4.classList.remove('is-swapping');
    }, reduceMotion ? 0 : 180);
  };

  // troca automática enquanto ninguém mexeu: a "imagem em movimento" do produto
  const order = Object.keys(docs);
  let timer = null;
  let touched = false;
  const stop = () => { touched = true; clearInterval(timer); timer = null; };
  const start = () => {
    if (touched || reduceMotion || timer) return;
    // uma volta pelos cinco tipos e para (sem movimento automático sem fim)
    timer = setInterval(() => {
      const next = order[(order.indexOf(current) + 1) % order.length];
      show(next);
      if (next === 'proposta') stop();
    }, 3200);
  };

  tabs.forEach((t) => t.addEventListener('click', () => { stop(); show(t.dataset.doc); }));
  [nome, cliente].forEach((input) => {
    input.addEventListener('input', bind);
    input.addEventListener('focus', stop);
  });
  bind();

  if ('IntersectionObserver' in window) {
    new IntersectionObserver(([e]) => { if (e.isIntersecting) start(); else { clearInterval(timer); timer = null; } }, { threshold: 0.4 })
      .observe(document.getElementById('demo'));
  }
  document.addEventListener('visibilitychange', () => { if (document.hidden) { clearInterval(timer); timer = null; } });
})();

// ---------- para quem: apontar uma linha mostra o documento dela ----------
(() => {
  const rows = [...document.querySelectorAll('.index__row')];
  const pages = [...document.querySelectorAll('.index__frame .a4')];
  if (!rows.length || !pages.length) return;
  const on = (i) => {
    rows.forEach((r, k) => r.classList.toggle('is-on', k === i));
    pages.forEach((pg, k) => pg.classList.toggle('is-on', k === i));
  };
  rows.forEach((r, i) => {
    r.addEventListener('mouseenter', () => on(i));
  });
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

// ---------- barra de compra no celular ----------
(() => {
  const bar = document.getElementById('buybar');
  if (!bar || !('IntersectionObserver' in window)) return;
  const hide = new Set(['topo', 'precos', 'comecar']);
  const visible = new Set(['topo']);
  const link = bar.querySelector('a');
  const update = () => {
    const on = visible.size === 0;
    bar.classList.toggle('is-on', on);
    bar.setAttribute('aria-hidden', String(!on));
    link.tabIndex = on ? 0 : -1;
  };
  const io = new IntersectionObserver((entries) => {
    for (const e of entries) e.isIntersecting ? visible.add(e.target.id) : visible.delete(e.target.id);
    update();
  });
  hide.forEach((id) => { const el = document.getElementById(id); if (el) io.observe(el); });
})();
