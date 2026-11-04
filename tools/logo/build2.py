"""Draft 2: symmetric pointed plaque, mixed-case lettering, tapered scrollwork."""
import io, math, os, random, sys
import uharfbuzz as hb
from fontTools.ttLib import TTFont
from fontTools.pens.svgPathPen import SVGPathPen
from fontTools.pens.transformPen import TransformPen
from build import DEFS, sparkle, burst, f, svg, text_d, CINZEL as CINZEL_TT

FD = os.environ.get('FONT_DIR', 'fonts')


class Font:
    def __init__(self, path):
        self.tt = TTFont(path)
        self.tt.flavor = None
        b = io.BytesIO(); self.tt.save(b)
        self.hb = hb.Font(hb.Face(hb.Blob(b.getvalue())))
        self.upm = self.tt['head'].unitsPerEm
        self.gs = self.tt.getGlyphSet()

    def shape(self, text):
        buf = hb.Buffer(); buf.add_str(text); buf.guess_segment_properties()
        hb.shape(self.hb, buf, {'kern': True, 'liga': True})
        return [(self.tt.getGlyphName(i.codepoint), p.x_advance, p.x_offset, p.y_offset)
                for i, p in zip(buf.glyph_infos, buf.glyph_positions)]


CINZEL = Font(f'{FD}/fontsource-cinzel-5.3.0/package/files/cinzel-latin-700-normal.woff2')
DECO = Font(f'{FD}/fontsource-cinzel-decorative-5.3.0/package/files/cinzel-decorative-latin-700-normal.woff2')
SCRIPT = Font(f'{FD}/fontsource-pinyon-script-5.3.0/package/files/pinyon-script-latin-400-normal.woff2')


def runs_d(runs, cx, baseline, track=0.0, max_w=None):
    """runs: [(Font, text, size)]. Centred on cx. Returns (d, width, scale)."""
    shaped = [(fo, fo.shape(t), sz) for fo, t, sz in runs]
    def width(k):
        w = 0; n = 0
        for fo, gl, sz in shaped:
            for _, adv, _, _ in gl:
                w += adv * sz * k / fo.upm; n += 1
        return w + track * runs[0][2] * k * (n - 1)
    k = 1.0
    if max_w and width(1) > max_w:
        k = max_w / width(1)
    total = width(k)
    x = cx - total / 2
    pen = SVGPathPen(None)
    for fo, gl, sz in shaped:
        sc = sz * k / fo.upm
        for name, adv, xo, yo in gl:
            fo.gs[name].draw(TransformPen(pen, (sc, 0, 0, -sc, x + xo * sc, baseline - yo * sc)))
            x += adv * sc + track * runs[0][2] * k
    return pen.getCommands(), total, k


# ---------- geometry helpers ----------
def bez(p0, p1, p2, p3, n=28):
    out = []
    for i in range(n + 1):
        t = i / n; u = 1 - t
        out.append((u**3*p0[0] + 3*u*u*t*p1[0] + 3*u*t*t*p2[0] + t**3*p3[0],
                    u**3*p0[1] + 3*u*u*t*p1[1] + 3*u*t*t*p2[1] + t**3*p3[1]))
    return out


def scroll(A, c1, c2, B, r, turns, w0, w1, m=1, k=0.24, mp=lambda p: p):
    """Tapered stem (cubic A→B) ending in a log-spiral curl. mp maps points (for mirroring)."""
    return scroll_path(A, [(c1, c2, B)], r, turns, w0, w1, m, k, mp)


def scroll_path(A, segs, r, turns, w0, w1, m=1, k=0.24, mp=lambda p: p):
    """Tapered stem through several cubic segments, ending in a log-spiral curl."""
    pts = []; P = A
    for c1, c2, B in segs:
        seg = bez(P, c1, c2, B); pts.extend(seg if not pts else seg[1:]); P = B
    c2, B = segs[-1][1], segs[-1][2]
    dx, dy = B[0] - c2[0], B[1] - c2[1]; L = math.hypot(dx, dy) or 1; dx, dy = dx / L, dy / L
    rot = math.atan2(-m * dx, m * dy)
    C = (B[0] - r * math.cos(rot), B[1] - r * math.sin(rot))
    nb = len(pts)
    steps = int(56 * turns)
    for i in range(1, steps + 1):
        th = 2 * math.pi * turns * i / steps
        rr = r * math.exp(-k * th); a = rot + m * th
        pts.append((C[0] + rr * math.cos(a), C[1] + rr * math.sin(a)))
    pts = [mp(p) for p in pts]
    n = len(pts)
    left, right = [], []
    for i, p in enumerate(pts):
        q0 = pts[max(i - 1, 0)]; q1 = pts[min(i + 1, n - 1)]
        tx, ty = q1[0] - q0[0], q1[1] - q0[1]; tl = math.hypot(tx, ty) or 1
        nx, ny = -ty / tl, tx / tl
        if i < nb:  # stem swells then settles
            t = i / nb
            w = w0 * (0.55 + 0.45 * math.sin(math.pi * min(1, t * 1.15))) if len(segs) == 1 else w0 * (0.6 + 0.4 * math.sin(math.pi * min(1, t * 2.2)))
            w = max(w, w0 * (0.55 if len(segs) == 1 else 0.75))
        else:
            t = (i - nb) / max(1, n - nb); w = w0 * 0.75 * (1 - t) + w1 * t
        left.append((p[0] + nx * w / 2, p[1] + ny * w / 2)); right.append((p[0] - nx * w / 2, p[1] - ny * w / 2))
    d = 'M' + ' L'.join(f'{f(x)} {f(y)}' for x, y in left + right[::-1]) + ' Z'
    ex, ey = pts[-1]
    d += f' M{f(ex + w1*0.95)} {f(ey)} A{f(w1*0.95)} {f(w1*0.95)} 0 1 0 {f(ex - w1*0.95)} {f(ey)} A{f(w1*0.95)} {f(w1*0.95)} 0 1 0 {f(ex + w1*0.95)} {f(ey)} Z'
    return d


def leaf(base, ang, L, W, mp=lambda p: p, curve=0.25):
    dx, dy = math.cos(ang), math.sin(ang); nx, ny = -dy, dx
    tip = (base[0] + dx * L + nx * L * curve * 0.4, base[1] + dy * L + ny * L * curve * 0.4)
    a = (base[0] + dx * L * .45 + nx * W, base[1] + dy * L * .45 + ny * W)
    b = (base[0] + dx * L * .55 - nx * W * .7, base[1] + dy * L * .55 - ny * W * .7)
    B, A, T, Bb = mp(base), mp(a), mp(tip), mp(b)
    return f'M{f(B[0])} {f(B[1])} Q{f(A[0])} {f(A[1])} {f(T[0])} {f(T[1])} Q{f(Bb[0])} {f(Bb[1])} {f(B[0])} {f(B[1])} Z'


def drop(x, y, L, W, ang=math.pi/2, mp=lambda p: p):
    """Teardrop (husk): pointed at (x, y), rounded end L away along ang."""
    dx, dy = math.cos(ang), math.sin(ang); nx, ny = -dy, dx
    P = lambda a, b: mp((x + dx*a + nx*b, y + dy*a + ny*b))
    pts = [P(0, 0), P(L*.35, W), P(L*1.02, W*.62), P(L, 0), P(L*1.02, -W*.62), P(L*.35, -W), P(0, 0)]
    (a0, b0), c1, c2, e1, c3, c4, e2 = pts
    return (f'M{f(a0)} {f(b0)} C{f(c1[0])} {f(c1[1])} {f(c2[0])} {f(c2[1])} {f(e1[0])} {f(e1[1])} '
            f'C{f(c3[0])} {f(c3[1])} {f(c4[0])} {f(c4[1])} {f(e2[0])} {f(e2[1])} Z')


def rosette(x, y, r, n=8, mp=lambda p: p):
    out = [leaf((x, y), 2*math.pi*k/n + math.pi/n, r, r*0.3, mp=mp, curve=0) for k in range(n)]
    X, Y = mp((x, y)); rr = r * 0.32
    out.append(f'M{f(X+rr)} {f(Y)} A{f(rr)} {f(rr)} 0 1 0 {f(X-rr)} {f(Y)} A{f(rr)} {f(rr)} 0 1 0 {f(X+rr)} {f(Y)} Z')
    return ' '.join(out)


def dot(x, y, r, mp=lambda p: p):
    X, Y = mp((x, y))
    return f'M{f(X+r)} {f(Y)} A{f(r)} {f(r)} 0 1 0 {f(X-r)} {f(Y)} A{f(r)} {f(r)} 0 1 0 {f(X+r)} {f(Y)} Z'


def cartouche(cx, cy, W, H, b, c, p):
    """Symmetric plaque: pointed convex centre top and bottom, notched corners, pointed sides."""
    L, R, T, B = cx - W / 2, cx + W / 2, cy - H / 2, cy + H / 2
    h1 = H * 0.16
    return (f'M{f(L+c)} {f(T)} C{f(cx-W*0.2)} {f(T)} {f(cx-W*0.06)} {f(T-b*0.5)} {f(cx)} {f(T-b)} '
            f'C{f(cx+W*0.06)} {f(T-b*0.5)} {f(cx+W*0.2)} {f(T)} {f(R-c)} {f(T)} '
            f'A{f(c)} {f(c)} 0 0 0 {f(R)} {f(T+c)} L{f(R)} {f(cy-h1)} L{f(R+p)} {f(cy)} L{f(R)} {f(cy+h1)} '
            f'L{f(R)} {f(B-c)} A{f(c)} {f(c)} 0 0 0 {f(R-c)} {f(B)} '
            f'C{f(cx+W*0.2)} {f(B)} {f(cx+W*0.06)} {f(B+b*0.5)} {f(cx)} {f(B+b)} '
            f'C{f(cx-W*0.06)} {f(B+b*0.5)} {f(cx-W*0.2)} {f(B)} {f(L+c)} {f(B)} '
            f'A{f(c)} {f(c)} 0 0 0 {f(L)} {f(B-c)} L{f(L)} {f(cy+h1)} L{f(L-p)} {f(cy)} L{f(L)} {f(cy-h1)} '
            f'L{f(L)} {f(T+c)} A{f(c)} {f(c)} 0 0 0 {f(L+c)} {f(T)} Z')


def plaque_flourishes(cx, cy, W, H, b, c, p):
    """Scrollwork around the plaque, built for the top-right quadrant then mirrored 4 ways."""
    R, T = cx + W / 2, cy - H / 2
    parts = []
    for sx in (1, -1):
        for sy in (1, -1):
            mp = lambda q, sx=sx, sy=sy: (cx + sx * (q[0] - cx), cy + sy * (q[1] - cy))
            mm = sx * sy
            # side scroll: springs from the side point, sweeps up/out and curls back in
            A = (R + p * 0.7, cy - H * 0.06)
            parts.append(scroll(A, (R + p + H*0.08, cy - H*0.10), (R + p + H*0.16, cy - H*0.22),
                                (R + p + H*0.09, cy - H*0.36), H*0.085, 1.35, H*0.034, H*0.016, m=-1, mp=mp))
            # corner scroll: runs along the top edge, rises over the notch and curls down into it
            A2 = (R - H*0.34, T - H*0.03)
            parts.append(scroll(A2, (R - H*0.18, T - H*0.07), (R + H*0.00, T - H*0.12),
                                (R + H*0.07, T - H*0.03), H*0.055, 1.45, H*0.028, H*0.013, m=1, mp=mp))
            # leaves
            parts.append(leaf((R + p * 0.8, cy - H*0.03), -0.35, H*0.17, H*0.035, mp=mp))
            parts.append(leaf((R - H*0.33, T - H*0.035), math.pi + 0.18, H*0.13, H*0.026, mp=mp))
            parts.append(leaf((R - H*0.30, T - H*0.05), -2.2, H*0.09, H*0.02, mp=mp))
    return parts


def wordmark_group(cx, cy, W, H):
    b, c, p = H * 0.16, H * 0.14, H * 0.10
    out = []
    flo = plaque_flourishes(cx, cy, W, H, b, c, p)
    out.extend(f'<path d="{d}" fill="url(#gold)"/>' for d in flo)
    out.append(f'<path d="{cartouche(cx, cy, W, H, b, c, p)}" fill="url(#plaque)" stroke="url(#gold)" stroke-width="{f(H*0.026)}" stroke-linejoin="round"/>')
    out.append(f'<path d="{cartouche(cx, cy, W*0.935, H*0.86, b*0.78, c*0.8, p*0.55)}" fill="none" stroke="url(#gold)" stroke-width="{f(H*0.008)}" opacity=".85"/>')
    # bottom starburst, behind lettering
    by = cy + H * 0.5 + b * 0.38
    out.append(f'<circle cx="{f(cx)}" cy="{f(by)}" r="{f(H*0.15)}" fill="url(#sunglow)" opacity=".9"/>')
    out.append(f'<path d="{burst(cx, by, H*0.24)}" fill="#FFE9A0"/>')
    out.append(f'<circle cx="{f(cx)}" cy="{f(by)}" r="{f(H*0.02)}" fill="#FFFBEA"/>')
    # top jewel in the upper point
    ty = cy - H * 0.5 - b * 0.42
    out.append(f'<path d="{sparkle(cx, ty, H*0.05, 0.2)}" fill="#F6DA7E"/>')
    # lettering: script "The", decorative initials, small-cap body
    the_d, the_w, _ = runs_d([(SCRIPT, 'The', H * 0.32)], cx, cy - H * 0.205)
    g_d, gw, _ = runs_d([(DECO, 'G', H * 0.40), (CINZEL, 'rand', H * 0.40)], cx, cy + H * 0.065, track=-0.005)
    o_d, ow, _ = runs_d([(DECO, 'O', H * 0.52), (CINZEL, 'rrery', H * 0.52)], cx, cy + H * 0.405, track=-0.01, max_w=W * 0.76)
    out.append(f'<g fill="url(#gold)"><path d="{the_d}"/><path d="{g_d}"/><path d="{o_d}"/></g>')
    # rules flanking "The"
    ry = cy - H * 0.245
    for s in (-1, 1):
        x0 = cx + s * (the_w / 2 + H * 0.04); x1 = cx + s * (gw / 2 + H * 0.02)
        if s * (x1 - x0) < H * 0.08:
            x1 = x0 + s * H * 0.08
        out.append(f'<path d="M{f(x0)} {f(ry)} L{f(x1)} {f(ry)}" stroke="#D9AE4E" stroke-width="{f(H*0.009)}"/>')
        d = H * 0.02
        out.append(f'<path d="M{f(x1)} {f(ry-d)} L{f(x1+s*d)} {f(ry)} L{f(x1)} {f(ry+d)} L{f(x1-s*d)} {f(ry)} Z" fill="#EFC452"/>')
    # sparkles beside the "Grand" line
    for s in (-1, 1):
        out.append(f'<path d="{sparkle(cx + s*(gw/2 + H*0.11), cy - H*0.02, H*0.05)}" fill="#F6DA7E"/>')
    return '\n'.join(out)


def build_wordmark():
    return svg(820, 440, wordmark_group(410, 222, 600, 270))


def build_crest():
    W, H = 860, 1100
    cx, cy = 430, 440
    o = []
    # ring-side scrollwork (pairs at mid-height curling up and down)
    for sx in (1, -1):
        for sy in (1, -1):
            mp = lambda q, sx=sx, sy=sy: (cx + sx * (q[0] - cx), cy + sy * (q[1] - cy))
            mm = sx * sy
            A = (cx + 344, cy - 6)
            o.append(f'<path d="{scroll(A, (cx+372, cy-20), (cx+392, cy-58), (cx+372, cy-96), 30, 1.45, 10, 4.5, m=-1, mp=mp)}" fill="url(#gold)"/>')
            o.append(f'<path d="{leaf((cx+346, cy-2), -0.25, 46, 10, mp=mp)}" fill="url(#gold)"/>')
    # scrollwork following the ring (right half, mirrored left)
    R0 = 345
    def rp(u, v, th0=-math.pi/2):
        a = th0 + u / R0
        return (cx + (R0 + v) * math.cos(a), cy + (R0 + v) * math.sin(a))
    def rang(u, th0=-math.pi/2):
        return th0 + u / R0
    for sx, sy in ((1, 1), (-1, 1), (1, -1), (-1, -1)):
        mp = lambda q, sx=sx, sy=sy: (cx + sx * (q[0] - cx), cy + sy * (q[1] - cy))
        fl = []
        A = lambda u: rang(u) + math.pi/2  # local "outward" angle helper
        out_a = lambda u: rang(u)            # radial outward direction
        # 1. medallion: S-scroll rising off the medallion, curling down, with a tendril and berries
        fl.append(scroll(rp(40, -10), rp(70, 40), rp(118, 58), rp(156, 34), 18, 1.5, 8, 4, m=1, mp=mp))
        fl.append(leaf(rp(104, 54), rang(104) - 2.3, 26, 6, mp=mp, curve=0.4))
        fl.append(leaf(rp(52, 10), rang(52) - 0.9, 34, 8, mp=mp))
        for du, dv, rr in ((128, 66, 4.2), (138, 74, 3.4), (120, 76, 3)):
            fl.append(dot(*rp(du, dv), rr, mp=mp))
        # 2. upper diagonal: acanthus fan of five leaves over two small down-curling tendrils
        base_u = 262
        # lyre: two back-to-back C-scrolls cradling a bud
        fl.append(scroll(rp(base_u - 3, -8), rp(base_u - 6, 30), rp(base_u - 30, 56), rp(base_u - 50, 42), 14, 1.5, 7, 3, m=-1, mp=mp))
        fl.append(scroll(rp(base_u + 3, -8), rp(base_u + 6, 30), rp(base_u + 30, 56), rp(base_u + 50, 42), 14, 1.5, 7, 3, m=1, mp=mp))
        fl.append(drop(*rp(base_u, 8), 40, 10, ang=out_a(base_u), mp=mp))
        fl.append(dot(*rp(base_u, 58), 3.6, mp=mp))
        fl.append(rosette(*rp(base_u, 4), 9, n=6, mp=mp))
        # 3. between fan and side: a single tendril spiral with a bud and berries
        fl.append(scroll(rp(372, -8), rp(384, 22), rp(410, 34), rp(428, 18), 12, 1.6, 5, 2.4, m=1, mp=mp))
        fl.append(drop(*rp(376, 14), 22, 6, ang=out_a(376) - 0.5, mp=mp))
        for du, dv, rr in ((352, 14, 3.2), (346, 24, 2.6), (358, 26, 2.2)):
            fl.append(dot(*rp(du, dv), rr, mp=mp))
        # 4. mid-side rosette where the big scroll springs from the ring
        fl.append(rosette(cx + 358, cy, 17, n=8, mp=mp))
        # 5. lower side: a long scroll rising from the ring's base, with a large upper curl and a smaller lower curl
        fl.append(leaf((cx + 296, cy + 236), -0.9, 30, 7, mp=mp, curve=-0.3))
        o.extend(f'<path d="{d}" fill="url(#gold)"/>' for d in fl)
    # small three-leaf finial above the medallion
    mtop = cy - 336 - 48
    fin = [leaf((cx, mtop + 4), -math.pi/2, 34, 7), leaf((cx - 3, mtop + 8), -math.pi/2 - 0.75, 28, 6), leaf((cx + 3, mtop + 8), -math.pi/2 + 0.75, 28, 6, curve=-0.25)]
    o.append(f'<path d="{" ".join(fin)}" fill="url(#gold)"/>')
    # degree ring
    o.append(f'<circle cx="{cx}" cy="{cy}" r="330" fill="#120D06" stroke="url(#gold)" stroke-width="7"/>')
    o.append(f'<circle cx="{cx}" cy="{cy}" r="318" fill="none" stroke="url(#gold)" stroke-width="2"/>')
    for i in range(72):
        a = 2 * math.pi * i / 72
        o.append(f'<circle cx="{f(cx+math.cos(a)*341)}" cy="{f(cy+math.sin(a)*341)}" r="3.4" fill="url(#gold)"/>')
    ticks = []
    for d in range(0, 360, 2):
        a = math.radians(d)
        L = 22 if d % 30 == 0 else 13 if d % 10 == 0 else 7
        ticks.append(f'M{f(cx+math.cos(a)*272)} {f(cy+math.sin(a)*272)} L{f(cx+math.cos(a)*(272+L))} {f(cy+math.sin(a)*(272+L))}')
    o.append(f'<path d="{" ".join(ticks)}" stroke="#E2B654" stroke-width="1.6"/>')
    numerals = ['XII', 'I', 'II', 'III', 'IV', 'V', 'VI', 'VII', 'VIII', 'IX', 'X', 'XI']
    for i, n in enumerate(numerals):
        if i == 0:
            continue
        d, _, _ = text_d(CINZEL_TT, n, 19, cx, cy - 297)
        o.append(f'<path d="{d}" fill="#F0CD6E" transform="rotate({i*30} {cx} {cy})"/>')
    o.append(f'<circle cx="{cx}" cy="{cy}" r="266" fill="url(#sky)" stroke="url(#gold)" stroke-width="4"/>')
    o.append(f'<clipPath id="skyclip"><circle cx="{cx}" cy="{cy}" r="262"/></clipPath><g clip-path="url(#skyclip)">')
    rnd = random.Random(7)
    for _ in range(170):
        ang = rnd.uniform(0, 2 * math.pi); r = 262 * math.sqrt(rnd.random())
        o.append(f'<circle cx="{f(cx+math.cos(ang)*r)}" cy="{f(cy+math.sin(ang)*r)}" r="{f(rnd.choice([0.7,0.9,1.1,1.5]))}" fill="#F7E3A6" opacity="{f(rnd.uniform(.35,.95))}"/>')
    ocx, ocy = cx, cy
    # flat, top-down solar system filling the sky disc
    radii = [50, 73, 96, 118, 164, 199, 227, 250]
    for idx, r in enumerate(radii):
        o.append(f'<circle cx="{ocx}" cy="{ocy}" r="{r}" fill="none" stroke="#D6A945" stroke-opacity="{".62" if idx % 2 == 0 else ".42"}" stroke-width="1.3"/>')
    # asteroid belt between Mars and Jupiter
    rb = random.Random(11)
    belt = []
    for _ in range(260):
        a = rb.uniform(0, 2 * math.pi); r = rb.uniform(129, 143)
        belt.append(f'<circle cx="{f(ocx+math.cos(a)*r)}" cy="{f(ocy+math.sin(a)*r)}" r="{f(rb.choice([0.8,1.0,1.3,1.7]))}"/>')
    o.append(f'<g fill="#E8C66C" opacity=".75">{"".join(belt)}</g>')
    o.append(f'<circle cx="{ocx}" cy="{ocy}" r="110" fill="url(#sunglow)"/>')
    # central shaft drops from the sun into the plaque
    o.append(f'<rect x="{ocx-2.5}" y="{ocy+30}" width="5" height="{cy+290-ocy-30}" fill="url(#goldH)"/>')
    planets = [  # orbit, angle (deg, 0 = right, clockwise), radius, fill
        (0, 290, 7.5, 'pPale'), (1, 150, 12, 'pGold'), (2, 28, 12, 'pPale'), (3, 215, 9, 'pRust'),
        (4, 318, 26, 'pGold'), (5, 198, 21, 'pGold'), (6, 62, 16, 'pPale'), (7, 122, 14, 'pPale')]
    for oi, ang, pr, fill in planets:
        r = radii[oi]; a = math.radians(ang)
        x, y = ocx + r * math.cos(a), ocy + r * math.sin(a)
        if oi == 5:  # Saturn rings, back half
            o.append(f'<path d="M{f(x-pr*2.1)} {f(y)} A{f(pr*2.1)} {f(pr*0.6)} 0 0 1 {f(x+pr*2.1)} {f(y)}" fill="none" stroke="#F3D58A" stroke-width="2.6" transform="rotate(-22 {f(x)} {f(y)})"/>')
        o.append(f'<circle cx="{f(x)}" cy="{f(y)}" r="{pr}" fill="url(#{fill})"/>')
        if oi == 5:  # front half
            o.append(f'<path d="M{f(x-pr*2.1)} {f(y)} A{f(pr*2.1)} {f(pr*0.6)} 0 0 0 {f(x+pr*2.1)} {f(y)}" fill="none" stroke="#F3D58A" stroke-width="2.6" transform="rotate(-22 {f(x)} {f(y)})"/>')
        if oi == 2:  # the Moon
            o.append(f'<circle cx="{f(x+pr+7)}" cy="{f(y-pr-2)}" r="3" fill="url(#pPale)"/>')
        if oi == 4:  # Galilean moons in a line
            for k, dx in enumerate((-44, -35, 36, 47)):
                o.append(f'<circle cx="{f(x+dx*math.cos(a+math.pi/2)*0.0+dx)}" cy="{f(y+dx*0.18)}" r="2.2" fill="#F5E6B8"/>')
    for x, y, r in [(cx-110, cy-215, 7), (cx+80, cy-232, 6), (cx+228, cy-40, 5), (cx+150, cy+215, 6), (cx+30, cy-140, 4), (cx-215, cy+60, 5)]:
        o.append(f'<path d="{sparkle(x, y, r)}" fill="#FFF1C2"/>')
    o.append(f'<circle cx="{ocx}" cy="{ocy}" r="32" fill="url(#sun)"/>')
    o.append('</g>')
    my = cy - 336
    o.append(f'<circle cx="{cx}" cy="{my}" r="40" fill="#120D06" stroke="url(#gold)" stroke-width="5"/>')
    o.append(f'<circle cx="{cx}" cy="{my}" r="31" fill="none" stroke="url(#gold)" stroke-width="1.5"/>')
    o.append(f'<path d="{sparkle(cx, my, 27, 0.16)}" fill="url(#gold)"/>')
    o.append(f'<path d="{sparkle(cx, my, 17, 0.2)}" fill="#F3D27A" transform="rotate(45 {cx} {my})"/>')
    o.append(f'<path d="M{cx} {my-48} L{cx+6} {my-40} L{cx-6} {my-40} Z" fill="url(#gold)"/>')
    o.append(wordmark_group(cx, 872, 600, 270))
    return svg(W, H, '\n'.join(o))


if __name__ == '__main__':
    outdir = sys.argv[1]
    open(f'{outdir}/logo-crest.svg', 'w').write(build_crest())
    open(f'{outdir}/logo-wordmark.svg', 'w').write(build_wordmark())
