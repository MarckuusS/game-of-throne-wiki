/**
 * Déplacement et zoom d'un SVG, par manipulation de son viewBox.
 *
 * Partagé par la carte et l'arbre de descendance : dans les deux cas le contenu
 * est plus grand que l'écran d'un téléphone, et la seule interaction naturelle
 * est de faire glisser et de pincer.
 *
 * Principe : le viewBox garde TOUJOURS le rapport largeur/hauteur du conteneur.
 * Il n'y a donc jamais de bande vide inattendue, et un pixel de conteneur
 * correspond exactement à `box.w / largeurConteneur` unités de contenu.
 */

export function attachPanZoom(wrap, content, opts = {}) {
  const svg = wrap.querySelector('svg');
  if (!svg) return null;

  const minZoomWidth = content.w / (opts.maxZoom || 6);
  const maxZoomWidth = content.w * (opts.minZoom || 1);

  const aspect = () => {
    const r = wrap.getBoundingClientRect();
    return r.width > 0 ? r.height / r.width : content.h / content.w;
  };

  const box = { x: 0, y: 0, w: content.w, h: content.w * aspect() };
  const apply = () => svg.setAttribute('viewBox', `${box.x} ${box.y} ${box.w} ${box.h}`);

  function clamp() {
    box.w = Math.min(maxZoomWidth, Math.max(minZoomWidth, box.w));
    box.h = box.w * aspect();
    // si la fenêtre est plus grande que le contenu, on centre plutôt que de coller au bord
    box.x = box.w >= content.w
      ? (content.w - box.w) / 2
      : Math.min(content.w - box.w, Math.max(0, box.x));
    box.y = box.h >= content.h
      ? (content.h - box.h) / 2
      : Math.min(content.h - box.h, Math.max(0, box.y));
  }

  function zoomAt(factor, cx = 0.5, cy = 0.5) {
    const px = box.x + box.w * cx;
    const py = box.y + box.h * cy;
    box.w *= factor;
    box.h = box.w * aspect();
    box.x = px - box.w * cx;
    box.y = py - box.h * cy;
    clamp();
    apply();
  }

  /** Cadre initial : largeur demandée, centrée sur un point d'intérêt. */
  function frame(width, center) {
    box.w = Math.min(maxZoomWidth, Math.max(minZoomWidth, width || content.w));
    box.h = box.w * aspect();
    if (center) {
      box.x = center.x - box.w / 2;
      box.y = center.y - box.h / 2;
    }
    clamp();
    apply();
  }

  const pointers = new Map();
  let pinch = null;

  wrap.addEventListener('pointerdown', (e) => {
    pointers.set(e.pointerId, { x: e.clientX, y: e.clientY });
    if (pointers.size === 2) {
      const [a, b] = [...pointers.values()];
      pinch = { dist: Math.hypot(a.x - b.x, a.y - b.y), w: box.w };
    }
    wrap.setPointerCapture(e.pointerId);
  });

  wrap.addEventListener('pointermove', (e) => {
    const prev = pointers.get(e.pointerId);
    if (!prev) return;
    const r = wrap.getBoundingClientRect();

    if (pointers.size === 2 && pinch) {
      pointers.set(e.pointerId, { x: e.clientX, y: e.clientY });
      const [a, b] = [...pointers.values()];
      const dist = Math.hypot(a.x - b.x, a.y - b.y);
      if (dist > 4) zoomAt((pinch.w * (pinch.dist / dist)) / box.w);
      return;
    }

    box.x -= ((e.clientX - prev.x) / r.width) * box.w;
    box.y -= ((e.clientY - prev.y) / r.height) * box.h;
    clamp();
    apply();
    pointers.set(e.pointerId, { x: e.clientX, y: e.clientY });
  });

  const release = (e) => {
    pointers.delete(e.pointerId);
    if (pointers.size < 2) pinch = null;
  };
  wrap.addEventListener('pointerup', release);
  wrap.addEventListener('pointercancel', release);

  wrap.addEventListener('wheel', (e) => {
    e.preventDefault();
    const r = wrap.getBoundingClientRect();
    zoomAt(e.deltaY > 0 ? 1.15 : 0.87, (e.clientX - r.left) / r.width, (e.clientY - r.top) / r.height);
  }, { passive: false });

  clamp();
  apply();

  return {
    zoomIn: () => zoomAt(0.75),
    zoomOut: () => zoomAt(1.33),
    frame,
    reset: () => frame(content.w),
    /** Centre la vue sur un point du contenu, sans changer le zoom. */
    focusPoint: (pt) => frame(box.w, pt),
  };
}
