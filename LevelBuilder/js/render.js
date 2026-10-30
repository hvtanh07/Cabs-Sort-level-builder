/* Cap Sort Level Builder: canvas drawing of the conveyor, Enter Path gates and caps */
'use strict';
(function (CS) {

  /* A cap (bottle cap item). */
  CS.drawCap = function (ctx, x, y, r, color, o) {
    o = o || {};
    const hex = o.hidden ? '#8A93A8' : (CS.COLORS[color] ? CS.COLORS[color].hex : '#555');
    ctx.save();
    ctx.globalAlpha = o.alpha != null ? o.alpha : 1;
    ctx.beginPath(); ctx.arc(x, y, r, 0, Math.PI * 2);
    ctx.fillStyle = hex; ctx.fill();
    ctx.lineWidth = Math.max(1, r * 0.22); ctx.strokeStyle = 'rgba(0,0,0,.28)'; ctx.stroke();
    ctx.beginPath(); ctx.arc(x - r * 0.28, y - r * 0.3, r * 0.32, 0, Math.PI * 2);
    ctx.fillStyle = 'rgba(255,255,255,.35)'; ctx.fill();
    if (o.hidden) {
      ctx.fillStyle = '#fff'; ctx.font = `700 ${Math.round(r * 1.3)}px system-ui,sans-serif`;
      ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText('?', x, y + r * 0.05);
    }
    if (o.lock > 0) {
      ctx.beginPath(); ctx.arc(x, y, r * 1.05, 0, Math.PI * 2);
      ctx.fillStyle = 'rgba(190,230,255,.55)'; ctx.fill();
      ctx.lineWidth = 1.2; ctx.strokeStyle = '#E8F7FF'; ctx.stroke();
      ctx.fillStyle = '#0B2A44'; ctx.font = `800 ${Math.round(r * 1.15)}px system-ui,sans-serif`;
      ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText(String(o.lock), x, y + r * 0.05);
    }
    ctx.restore();
  };

  CS.fitCanvas = function (canvas) {
    const dpr = window.devicePixelRatio || 1;
    const w = canvas.clientWidth, h = canvas.clientHeight;
    if (canvas.width !== Math.round(w * dpr) || canvas.height !== Math.round(h * dpr)) {
      canvas.width = Math.round(w * dpr); canvas.height = Math.round(h * dpr);
    }
    const ctx = canvas.getContext('2d');
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    return { ctx, w, h };
  };

  /* View of one conveyor geometry inside a canvas. */
  CS.ConvView = function (canvas, geom) {
    this.canvas = canvas; this.g = geom;
    this.cw = CS.signedArea(geom.poly) > 0;     // clockwise on screen (y down)
    const s = geom.total / geom.rows;            // spacing along the belt
    this.a = Math.min(s, Math.min(geom.bbox.w, geom.bbox.h) / 9);  // spacing across the belt
    this.beltW = this.a * CS.ROW_W + this.a * 0.5;
  };
  CS.ConvView.prototype.layout = function () {
    const { ctx, w, h } = CS.fitCanvas(this.canvas);
    const g = this.g, bb = g.vbox || g.bbox;
    const tracks = g.feederPaths && Object.keys(g.feederPaths).length;
    const stub = this.compact ? 16 : tracks ? 26 : 84, pad = this.compact ? 4 : 10;
    const ww = bb.w + this.beltW, wh = bb.h + this.beltW;
    const sc = Math.max(0.05, Math.min((w - pad * 2) / ww, (h - pad * 2 - stub) / wh));
    this.sc = sc;
    this.ox = (w - bb.w * sc) / 2 - bb.minX * sc;
    this.oy = stub + pad + (h - stub - pad * 2 - wh * sc) / 2 + this.beltW * sc / 2 - bb.minY * sc;
    this.ctx = ctx; this.w = w; this.h = h;
    return ctx;
  };
  CS.ConvView.prototype.X = function (x) { return this.ox + x * this.sc; };
  CS.ConvView.prototype.Y = function (y) { return this.oy + y * this.sc; };
  CS.ConvView.prototype.normal = function (p) { return this.cw ? { x: p.dy, y: -p.dx } : { x: -p.dy, y: p.dx }; };
  /* screen position of a spot on the belt: t along the loop, lane 0..3 across */
  CS.ConvView.prototype.spot = function (t, lane) {
    const p = this.g.pointAt(t), n = this.normal(p);
    const off = (lane - (CS.ROW_W - 1) / 2) * this.a;
    return { x: this.X(p.x + n.x * off), y: this.Y(p.y + n.y * off) };
  };
  CS.ConvView.prototype.gate = function (entry) {
    const t = this.g.entryT[entry];
    if (t == null) return null;
    const p = this.g.pointAt(t), n = this.normal(p);
    return { t, x: this.X(p.x), y: this.Y(p.y), nx: n.x, ny: n.y, px: p.dx, py: p.dy };
  };

  /*
   state: { rows:[[item|null x4]], shift, phase } or null for an empty belt
   gates: [{ entry, label, shut, countdown, preview:[[c,c,c,c]], hiddenRows:[bool], lockRows:[n] , active }]
  */
  CS.ConvView.prototype.draw = function (state, gates, opt) {
    opt = opt || {};
    this.compact = !!opt.compact;
    const ctx = this.layout();
    const g = this.g, sc = this.sc;
    ctx.clearRect(0, 0, this.w, this.h);
    const css = getComputedStyle(document.documentElement);
    const beltCol = css.getPropertyValue('--belt').trim() || '#2A3149';
    const edgeCol = css.getPropertyValue('--belt-edge').trim() || '#4A5578';
    const inkCol = css.getPropertyValue('--ink').trim() || '#18203A';

    const trace = () => {
      ctx.beginPath();
      g.poly.forEach((p, i) => { const x = this.X(p.x), y = this.Y(p.y); if (i) ctx.lineTo(x, y); else ctx.moveTo(x, y); });
      ctx.closePath();
    };
    const gateInfo = [];
    (gates || []).forEach(gt => { const G = this.gate(gt.entry); if (G) gateInfo.push([gt, G]); });
    // belt
    trace();
    ctx.lineJoin = 'round';
    ctx.strokeStyle = edgeCol; ctx.lineWidth = this.beltW * sc + 6; ctx.stroke();
    trace();
    ctx.strokeStyle = beltCol; ctx.lineWidth = this.beltW * sc; ctx.stroke();
    // direction chevrons
    const R = g.rows;
    const shiftF = state ? (state.shift + state.phase) : 0;
    ctx.strokeStyle = 'rgba(255,255,255,.10)'; ctx.lineWidth = Math.max(1, this.a * sc * 0.18);
    for (let i = 0; i < R; i += 3) {
      const t = ((i + shiftF) % R) / R;
      const p = g.pointAt(t), n = this.normal(p);
      const half = this.beltW * 0.42;
      const cx = p.x, cy = p.y, back = this.a * 0.6;
      ctx.beginPath();
      ctx.moveTo(this.X(cx + n.x * half - p.dx * back), this.Y(cy + n.y * half - p.dy * back));
      ctx.lineTo(this.X(cx), this.Y(cy));
      ctx.lineTo(this.X(cx - n.x * half - p.dx * back), this.Y(cy - n.y * half - p.dy * back));
      ctx.stroke();
    }
    // entry gates on top of the belt edge
    const r = Math.max(2.5, this.a * sc * 0.42);
    if (this.compact) {
      gateInfo.forEach(([gt, G]) => {
        const lx = G.x + G.nx * (this.beltW * sc / 2 + 8), ly = G.y + G.ny * (this.beltW * sc / 2 + 8);
        ctx.fillStyle = '#1F55D6'; ctx.beginPath(); ctx.arc(lx, ly, 7, 0, Math.PI * 2); ctx.fill();
        ctx.fillStyle = '#fff'; ctx.font = '700 9px system-ui,sans-serif'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
        ctx.fillText(gt.short || gt.label, lx, ly + 0.5);
      });
      gateInfo.length = 0;
    }
    const tracked = [];
    gateInfo.forEach(([gt, G]) => {
      const P = g.feederPaths && g.feederPaths[gt.entry];
      if (!P || P.length < 2) return;
      tracked.push(gt.entry);
      const inactive = gt.active === false;
      // track
      ctx.beginPath(); P.forEach((p, i) => { const x = this.X(p.x), y = this.Y(p.y); if (i) ctx.lineTo(x, y); else ctx.moveTo(x, y); });
      ctx.lineJoin = 'round'; ctx.lineCap = 'butt';
      ctx.strokeStyle = inactive ? 'rgba(130,140,160,.45)' : edgeCol; ctx.lineWidth = this.beltW * sc * 0.9 + 4; ctx.stroke();
      ctx.strokeStyle = inactive ? 'rgba(160,170,190,.35)' : beltCol; ctx.lineWidth = this.beltW * sc * 0.9; ctx.stroke();
      // walk along the track from the merge point
      const cum = [0];
      for (let i = 1; i < P.length; i++) cum.push(cum[i - 1] + Math.hypot(P[i].x - P[i - 1].x, P[i].y - P[i - 1].y));
      const at = d => {
        let i = 1; while (i < P.length - 1 && cum[i] < d) i++;
        const a = P[i - 1], b = P[i], L = (cum[i] - cum[i - 1]) || 1, f = Math.min(1, Math.max(0, (d - cum[i - 1]) / L));
        return { x: a.x + (b.x - a.x) * f, y: a.y + (b.y - a.y) * f, dx: (b.x - a.x) / L, dy: (b.y - a.y) / L };
      };
      const step = this.a, start = this.beltW * 0.55;
      (gt.preview || []).forEach((row, ri) => {
        const d = start + ri * step;
        if (d > cum[cum.length - 1]) return;
        const p = at(d);
        row.forEach((c, k) => {
          if (!c) return;
          const off = (k - (CS.ROW_W - 1) / 2) * this.a;
          const item = typeof c === 'object' ? c : { color: c };
          CS.drawCap(ctx, this.X(p.x - p.dy * off), this.Y(p.y + p.dx * off), r, item.color, { hidden: item.hidden, lock: item.lock });
        });
      });
      if (gt.shut) {        // door across the track near the merge point
        const p = at(start * 0.6), half = this.beltW * 0.5;
        ctx.strokeStyle = '#D9363E'; ctx.lineWidth = 6; ctx.lineCap = 'round';
        ctx.beginPath(); ctx.moveTo(this.X(p.x - p.dy * half), this.Y(p.y + p.dx * half)); ctx.lineTo(this.X(p.x + p.dy * half), this.Y(p.y - p.dx * half)); ctx.stroke();
        ctx.lineCap = 'butt';
      }
      const e = P[P.length - 1];
      const txt = (gt.short || gt.label) + (gt.shut ? ' 🔒' + (gt.countdown != null ? gt.countdown : '') : '');
      ctx.font = '700 12px system-ui,sans-serif';
      const tw = ctx.measureText(txt).width + 14, lx = this.X(e.x), ly = Math.max(12, this.Y(e.y) - 14);
      ctx.fillStyle = gt.shut ? '#D9363E' : (inactive ? 'rgba(130,140,160,.8)' : '#1F55D6');
      ctx.beginPath(); if (ctx.roundRect) ctx.roundRect(lx - tw / 2, ly - 10, tw, 20, 10); else ctx.rect(lx - tw / 2, ly - 10, tw, 20); ctx.fill();
      ctx.fillStyle = '#fff'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText(txt, lx, ly + 0.5);
    });
    gateInfo.forEach(([gt, G]) => {
      if (tracked.includes(gt.entry)) return;
      const bw = Math.min(this.beltW * sc * 0.94, CS.ROW_W * (r * 2 + 2) + 8), len = Math.max(44, 3 * (r * 2 + 3) + 12);
      ctx.save();
      ctx.translate(G.x, G.y);
      ctx.rotate(Math.atan2(G.ny, G.nx) - Math.PI / 2);   // local +y = outward
      const off = this.beltW * sc / 2;
      ctx.fillStyle = gt.active === false ? 'rgba(130,140,160,.22)' : beltCol;
      ctx.strokeStyle = gt.active === false ? 'rgba(130,140,160,.6)' : edgeCol;
      ctx.lineWidth = 2;
      if (gt.active === false) ctx.setLineDash([4, 3]);
      ctx.beginPath(); ctx.rect(-bw / 2, off, bw, len); ctx.fill(); ctx.stroke();
      ctx.setLineDash([]);
      if (gt.shut) {            // door
        ctx.fillStyle = '#D9363E';
        ctx.fillRect(-bw / 2 - 3, off - 2, bw + 6, 7);
      }
      ctx.restore();
      // preview of the front rows of this Enter Path (front row nearest the belt)
      const vx = -G.ny, vy = G.nx;
      (gt.preview || []).slice(0, 3).forEach((row, ri) => {
        const d = off + 9 + r + ri * (r * 2 + 3);
        row.forEach((c, k) => {
          if (!c) return;
          const l = (k - 1.5) * (r * 2 + 2);
          const item = typeof c === 'object' ? c : { color: c, hidden: gt.hiddenRows && gt.hiddenRows[ri], lock: gt.lockRows ? gt.lockRows[ri] : 0 };
          CS.drawCap(ctx, G.x + G.nx * d + vx * l, G.y + G.ny * d + vy * l, r, item.color, { hidden: item.hidden, lock: item.lock });
        });
      });
      // label bubble beyond the stub
      const lx = G.x + G.nx * (this.beltW * sc / 2 + len + 11), ly = G.y + G.ny * (this.beltW * sc / 2 + len + 11);
      const txt = (gt.short || gt.label) + (gt.shut ? ' 🔒' + (gt.countdown != null ? gt.countdown : '') : '');
      ctx.font = '700 12px system-ui,sans-serif';
      const tw = ctx.measureText(txt).width + 14;
      ctx.fillStyle = gt.shut ? '#D9363E' : (gt.active === false ? 'rgba(130,140,160,.8)' : '#1F55D6');
      ctx.beginPath();
      if (ctx.roundRect) ctx.roundRect(lx - tw / 2, ly - 10, tw, 20, 10); else ctx.rect(lx - tw / 2, ly - 10, tw, 20);
      ctx.fill();
      ctx.fillStyle = '#fff'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
      ctx.fillText(txt, lx, ly + 0.5);
    });
    if (opt.caption) {
      ctx.fillStyle = inkCol; ctx.globalAlpha = 0.55; ctx.font = '600 12px system-ui,sans-serif';
      ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
      const cx = this.X(g.bbox.minX + g.bbox.w / 2), cy = this.Y(g.bbox.minY + g.bbox.h / 2);
      opt.caption.split('\n').forEach((ln, i, a) => ctx.fillText(ln, cx, cy + (i - (a.length - 1) / 2) * 16));
      ctx.globalAlpha = 1;
    }
    // items
    if (state && state.rows) {
      for (let j = 0; j < R; j++) {
        const row = state.rows[j];
        if (!row) continue;
        const t = (((j + state.shift) % R) + state.phase) / R;
        for (let k = 0; k < CS.ROW_W; k++) {
          const it = row[k];
          if (!it) continue;
          const s = this.spot(t, k);
          CS.drawCap(ctx, s.x, s.y, r, it.color, { hidden: it.hidden, lock: it.lock });
        }
      }
    }
    this.itemR = r;
  };

})(window.CS);
