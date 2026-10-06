/* BajaTuLuz · Historias NEGOCIOS — utilidades de animación compartidas.
 * Todo es determinista: nada de relojes ni azar; el estado depende solo del tiempo del timeline. */
(function () {
  const HN = {};

  /** Envuelve cada palabra en una máscara para revelarla desde abajo. */
  HN.splitWords = function (el) {
    const words = el.textContent.trim().split(/\s+/);
    el.textContent = "";
    words.forEach((w, i) => {
      if (i) el.append(" ");
      const m = document.createElement("span");
      m.className = "hn-m";
      const s = document.createElement("span");
      s.className = "hn-w";
      s.textContent = w;
      m.append(s);
      el.append(m);
    });
    return el.querySelectorAll(".hn-w");
  };

  /** Pulso de flecha: quieta casi siempre, un empujón corto cada ~1,8 s. */
  HN.nudge = (t) => 7 * Math.pow(Math.max(0, Math.sin(t * 3.4)), 3);

  /** Grano estático con PRNG con semilla (siempre el mismo patrón). */
  HN.grain = function (root) {
    const c = document.createElement("canvas");
    c.width = c.height = 220;
    const x = c.getContext("2d");
    const d = x.createImageData(220, 220);
    let s = 1337;
    const rnd = () => (s = (s * 16807) % 2147483647) / 2147483647;
    for (let i = 0; i < d.data.length; i += 4) {
      const v = 80 + rnd() * 96;
      d.data[i] = d.data[i + 1] = d.data[i + 2] = v;
      d.data[i + 3] = 255;
    }
    x.putImageData(d, 0, 0);
    const url = c.toDataURL();
    root.querySelectorAll(".hn-grain").forEach((g) => (g.style.backgroundImage = `url(${url})`));
  };

  /**
   * Entrada común de cada historia: logo, etiqueta, titular, texto, pie y barra de progreso.
   * `dur` es la duración de la historia (la barra actual se llena durante toda ella).
   */
  HN.intro = function (tl, root, t0, dur) {
    const q = (s) => root.querySelector(s);
    const qa = (s) => root.querySelectorAll(s);
    HN.splitWords(q(".hn-h .l1"));
    HN.splitWords(q(".hn-h .l2 .t"));
    tl.fromTo(q(".hn-logo"), { y: -26, opacity: 0 }, { y: 0, opacity: 1, duration: 0.9, ease: "expo.out" }, t0);
    tl.fromTo(q(".hn-pill"), { x: 26, opacity: 0 }, { x: 0, opacity: 1, duration: 0.9, ease: "expo.out" }, t0 + 0.08);
    tl.fromTo(q(".hn-eyebrow .ln"), { scaleX: 0 }, { scaleX: 1, duration: 0.7, ease: "expo.inOut" }, t0 + 0.14);
    tl.fromTo(q(".hn-eyebrow .tx"), { x: -16, opacity: 0 }, { x: 0, opacity: 1, duration: 0.8, ease: "expo.out" }, t0 + 0.3);
    tl.fromTo(qa(".l1 .hn-w"), { yPercent: 118, rotation: 4 }, { yPercent: 0, rotation: 0, duration: 1.05, ease: "expo.out", stagger: 0.07 }, t0 + 0.22);
    tl.fromTo(qa(".l2 .hn-w"), { yPercent: 118, rotation: 7 }, { yPercent: 0, rotation: 0, duration: 1.15, ease: "expo.out", stagger: 0.09 }, t0 + 0.42);
    const hl = q(".hn-hlbar");
    if (hl) tl.fromTo(hl, { scaleX: 0 }, { scaleX: 1, duration: 0.85, ease: "expo.inOut" }, t0 + 0.95);
    const bi = qa(".hn-bi");
    if (bi.length) tl.fromTo(bi, { yPercent: 108 }, { yPercent: 0, duration: 0.95, ease: "expo.out", stagger: 0.085 }, t0 + 1.45);
    tl.fromTo(q(".hn-rule"), { scaleX: 0 }, { scaleX: 1, duration: 1.2, ease: "expo.inOut" }, t0 + 1.55);
    tl.fromTo(qa(".hn-ftr .fi"), { y: 18, opacity: 0 }, { y: 0, opacity: 1, duration: 0.8, ease: "expo.out", stagger: 0.09 }, t0 + 1.9);
    tl.fromTo(q(".hn-prog"), { opacity: 0 }, { opacity: 1, duration: 0.6, ease: "power1.out" }, t0 + 1.9);
    tl.fromTo(q(".hn-seg.cur i"), { scaleX: 0 }, { scaleX: 1, duration: dur, ease: "none" }, 0);
  };

  /** Movimiento de cámara lento sobre la foto de fondo (Ken Burns), de principio a fin. */
  HN.kenBurns = function (tl, el, dur, from, to) {
    tl.fromTo(el, { scale: from.s, x: from.x, y: from.y }, { scale: to.s, x: to.x, y: to.y, duration: dur, ease: "none" }, 0);
  };

  /**
   * Movimiento ambiental: un tween lineal de 0 a `dur` cuyo onUpdate recalcula todo
   * a partir del tiempo local. Al buscar cualquier instante, el estado sale igual.
   */
  HN.ambient = function (tl, dur, fn) {
    const p = { t: 0 };
    tl.fromTo(p, { t: 0 }, { t: dur, duration: dur, ease: "none", onUpdate: () => fn(p.t) }, 0);
    fn(0);
  };

  /** Flecha del pie: empujón periódico. */
  HN.footerNudge = function (root) {
    const a = root.querySelector(".hn-next .arr");
    return (t) => {
      const n = HN.nudge(t - 2.4);
      a.style.transform = a.classList.contains("down") ? `translateY(${n}px)` : `translateX(${n}px)`;
    };
  };

  window.HN = HN;
})();
