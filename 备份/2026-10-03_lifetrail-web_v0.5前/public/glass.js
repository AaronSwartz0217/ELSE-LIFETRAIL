/* LifeTrail 液态玻璃渲染器
 * 原理：按元素圆角矩形生成 SDF 法线位移贴图（Canvas），
 * 注入 SVG feDisplacementMap，挂到 backdrop-filter 上，
 * 使卡片边缘真实"折射"背后内容（Liquid Glass 的 DOM 实现）。
 * 需 Chromium 内核；Firefox 自动降级为普通磨砂。 */
(function () {
  const SVGNS = 'http://www.w3.org/2000/svg';
  let uid = 0;

  const canLg = CSS.supports('backdrop-filter', 'url(#f)');
  if (!canLg) {
    document.body.classList.add('no-lg');
    return;
  }

  // 生成圆角矩形 SDF 位移贴图：边缘环带内的法线方向编入 R/G 通道
  function sdfMap(w, h, r, band, power) {
    const c = document.createElement('canvas');
    c.width = w; c.height = h;
    const ctx = c.getContext('2d');
    const img = ctx.createImageData(w, h);
    const hw = w / 2, hh = h / 2;
    for (let y = 0; y < h; y++) {
      for (let x = 0; x < w; x++) {
        const px = x - hw + .5, py = y - hh + .5;
        const qx = Math.abs(px) - (hw - r), qy = Math.abs(py) - (hh - r);
        const d = Math.hypot(Math.max(qx, 0), Math.max(qy, 0))
                + Math.min(Math.max(qx, qy), 0) - r;
        let nx = 0, ny = 0, t = 0;
        const inside = -d;
        if (inside > 0 && inside < band) {
          t = Math.pow(1 - inside / band, power);
          if (qx > 0 && qy > 0) {
            const l = Math.hypot(qx, qy) || 1;
            nx = qx / l; ny = qy / l;
          } else if (qx > qy) {
            nx = Math.sign(px);
          } else {
            ny = Math.sign(py);
          }
        }
        const i = (y * w + x) * 4;
        img.data[i]     = 128 + nx * t * 127;
        img.data[i + 1] = 128 + ny * t * 127;
        img.data[i + 2] = 128;
        img.data[i + 3] = 255;
      }
    }
    ctx.putImageData(img, 0, 0);
    return c.toDataURL();
  }

  function apply(el) {
    const ds = el.dataset;
    const radius = +(ds.radius || 16);
    const band = +(ds.band || 26);
    const scale = +(ds.scale || 16);
    const blur = +(ds.blur || 1.2);
    const power = +(ds.power || 2.2);
    const w = Math.max(2, Math.round(el.offsetWidth));
    const h = Math.max(2, Math.round(el.offsetHeight));
    if (el._lw === w && el._lh === h) return;   // 尺寸未变则跳过
    el._lw = w; el._lh = h;
    const id = 'lg-' + (++uid);
    document.getElementById(id)?.remove();

    const f = document.createElementNS(SVGNS, 'filter');
    f.setAttribute('id', id);
    f.setAttribute('x', '0'); f.setAttribute('y', '0');
    f.setAttribute('width', '100%'); f.setAttribute('height', '100%');
    f.setAttribute('color-interpolation-filters', 'sRGB');

    const map = document.createElementNS(SVGNS, 'feImage');
    map.setAttribute('href', sdfMap(w, h, Math.min(radius, w / 2, h / 2), band, power));
    map.setAttribute('preserveAspectRatio', 'none');
    map.setAttribute('result', 'map');

    const dm = document.createElementNS(SVGNS, 'feDisplacementMap');
    dm.setAttribute('in', 'SourceGraphic');
    dm.setAttribute('in2', 'map');
    dm.setAttribute('scale', scale);
    dm.setAttribute('xChannelSelector', 'R');
    dm.setAttribute('yChannelSelector', 'G');
    dm.setAttribute('result', 'disp');

    const gb = document.createElementNS(SVGNS, 'feGaussianBlur');
    gb.setAttribute('in', 'disp');
    gb.setAttribute('stdDeviation', blur);

    const sat = document.createElementNS(SVGNS, 'feColorMatrix');
    sat.setAttribute('type', 'saturate');
    sat.setAttribute('values', '1.5');

    f.append(map, dm, gb, sat);
    document.getElementById('lg-defs').appendChild(f);
    el.style.backdropFilter = `url(#${id})`;
  }

  function init() {
    document.querySelectorAll('[data-glass]').forEach(el => {
      apply(el);
      new ResizeObserver(() => apply(el)).observe(el);
    });
  }

  document.readyState === 'loading'
    ? document.addEventListener('DOMContentLoaded', init)
    : init();
})();
