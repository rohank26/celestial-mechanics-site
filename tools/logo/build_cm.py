"""Celestial Mechanics crest + plaque wordmark.

Same family as the Grand Orrery logos (build2.py): shared gradients, plaque,
scrollwork and medallion. Three medallion motifs to choose from:
  gear      - a brass gear rim whose teeth ring a sun and its orbits
  armillary - interlocking armillary rings around the sun
  monogram  - interlaced CM initials inside an orbit ring

Run:  FONT_DIR=fonts python3 build_cm.py <outdir>
"""
import math, random, sys
from build import sparkle, burst, f, svg
from build2 import CINZEL, DECO, SCRIPT, runs_d, scroll, leaf, drop, rosette, dot, cartouche, plaque_flourishes


# ---------- plaque wordmark ----------
def cm_wordmark_group(cx, cy, W, H):
    b, c, p = H * 0.16, H * 0.14, H * 0.10
    out = [f'<path d="{d}" fill="url(#gold)"/>' for d in plaque_flourishes(cx, cy, W, H, b, c, p)]
    out.append(f'<path d="{cartouche(cx, cy, W, H, b, c, p)}" fill="url(#plaque)" stroke="url(#gold)" stroke-width="{f(H*0.026)}" stroke-linejoin="round"/>')
    out.append(f'<path d="{cartouche(cx, cy, W*0.935, H*0.86, b*0.78, c*0.8, p*0.55)}" fill="none" stroke="url(#gold)" stroke-width="{f(H*0.008)}" opacity=".85"/>')
    by = cy + H * 0.5 + b * 0.38
    out.append(f'<circle cx="{f(cx)}" cy="{f(by)}" r="{f(H*0.15)}" fill="url(#sunglow)" opacity=".9"/>')
    out.append(f'<path d="{burst(cx, by, H*0.24)}" fill="#FFE9A0"/>')
    out.append(f'<circle cx="{f(cx)}" cy="{f(by)}" r="{f(H*0.02)}" fill="#FFFBEA"/>')
    ty = cy - H * 0.5 - b * 0.42
    out.append(f'<path d="{sparkle(cx, ty, H*0.05, 0.2)}" fill="#F6DA7E"/>')
    # lettering: small engraved line, then the two names with decorative initials
    est_d, est_w, _ = runs_d([(CINZEL, 'DESIGN STUDIO', H * 0.085)], cx, cy - H * 0.235, track=0.28)
    c_d, cw, _ = runs_d([(DECO, 'C', H * 0.40), (CINZEL, 'elestial', H * 0.33)], cx, cy + H * 0.03, track=0.01, max_w=W * 0.74)
    m_d, mw, _ = runs_d([(DECO, 'M', H * 0.40), (CINZEL, 'echanics', H * 0.33)], cx, cy + H * 0.36, track=0.01, max_w=W * 0.74)
    out.append(f'<g fill="url(#gold)"><path d="{est_d}"/><path d="{c_d}"/><path d="{m_d}"/></g>')
    ry = cy - H * 0.265
    for s in (-1, 1):
        x0 = cx + s * (est_w / 2 + H * 0.05); x1 = cx + s * (max(cw, mw) / 2 - H * 0.02)
        if s * (x1 - x0) < H * 0.08:
            x1 = x0 + s * H * 0.08
        out.append(f'<path d="M{f(x0)} {f(ry)} L{f(x1)} {f(ry)}" stroke="#D9AE4E" stroke-width="{f(H*0.009)}"/>')
        d = H * 0.02
        out.append(f'<path d="M{f(x1)} {f(ry-d)} L{f(x1+s*d)} {f(ry)} L{f(x1)} {f(ry+d)} L{f(x1-s*d)} {f(ry)} Z" fill="#EFC452"/>')
    # small sparkles in the gap between the two lines, at the plaque points
    for s in (-1, 1):
        out.append(f'<path d="{sparkle(cx + s*(W*0.44), cy + H*0.02, H*0.04)}" fill="#F6DA7E"/>')
    return '\n'.join(out)


# ---------- crest frame (shared with the Grand Orrery crest) ----------
def frame(cx, cy):
    o = []
    for sx in (1, -1):
        for sy in (1, -1):
            mp = lambda q, sx=sx, sy=sy: (cx + sx * (q[0] - cx), cy + sy * (q[1] - cy))
            A = (cx + 344, cy - 6)
            o.append(f'<path d="{scroll(A, (cx+372, cy-20), (cx+392, cy-58), (cx+372, cy-96), 30, 1.45, 10, 4.5, m=-1, mp=mp)}" fill="url(#gold)"/>')
            o.append(f'<path d="{leaf((cx+346, cy-2), -0.25, 46, 10, mp=mp)}" fill="url(#gold)"/>')
    R0 = 345
    rp = lambda u, v: (cx + (R0 + v) * math.cos(-math.pi/2 + u / R0), cy + (R0 + v) * math.sin(-math.pi/2 + u / R0))
    rang = lambda u: -math.pi/2 + u / R0
    for sx, sy in ((1, 1), (-1, 1), (1, -1), (-1, -1)):
        mp = lambda q, sx=sx, sy=sy: (cx + sx * (q[0] - cx), cy + sy * (q[1] - cy))
        fl = [scroll(rp(40, -10), rp(70, 40), rp(118, 58), rp(156, 34), 18, 1.5, 8, 4, m=1, mp=mp),
              leaf(rp(104, 54), rang(104) - 2.3, 26, 6, mp=mp, curve=0.4),
              leaf(rp(52, 10), rang(52) - 0.9, 34, 8, mp=mp)]
        fl += [dot(*rp(du, dv), rr, mp=mp) for du, dv, rr in ((128, 66, 4.2), (138, 74, 3.4), (120, 76, 3))]
        u = 262
        fl.append(scroll(rp(u - 3, -8), rp(u - 6, 30), rp(u - 30, 56), rp(u - 50, 42), 14, 1.5, 7, 3, m=-1, mp=mp))
        fl.append(scroll(rp(u + 3, -8), rp(u + 6, 30), rp(u + 30, 56), rp(u + 50, 42), 14, 1.5, 7, 3, m=1, mp=mp))
        fl.append(drop(*rp(u, 8), 40, 10, ang=rang(u), mp=mp))
        fl.append(dot(*rp(u, 58), 3.6, mp=mp))
        fl.append(rosette(*rp(u, 4), 9, n=6, mp=mp))
        fl.append(scroll(rp(372, -8), rp(384, 22), rp(410, 34), rp(428, 18), 12, 1.6, 5, 2.4, m=1, mp=mp))
        fl.append(drop(*rp(376, 14), 22, 6, ang=rang(376) - 0.5, mp=mp))
        fl += [dot(*rp(du, dv), rr, mp=mp) for du, dv, rr in ((352, 14, 3.2), (346, 24, 2.6), (358, 26, 2.2))]
        fl.append(rosette(cx + 358, cy, 17, n=8, mp=mp))
        fl.append(leaf((cx + 296, cy + 236), -0.9, 30, 7, mp=mp, curve=-0.3))
        o.extend(f'<path d="{d}" fill="url(#gold)"/>' for d in fl)
    mtop = cy - 336 - 48
    fin = [leaf((cx, mtop + 4), -math.pi/2, 34, 7), leaf((cx - 3, mtop + 8), -math.pi/2 - 0.75, 28, 6),
           leaf((cx + 3, mtop + 8), -math.pi/2 + 0.75, 28, 6, curve=-0.25)]
    o.append(f'<path d="{" ".join(fin)}" fill="url(#gold)"/>')
    return o


def degree_ring(cx, cy):
    o = [f'<circle cx="{cx}" cy="{cy}" r="330" fill="#120D06" stroke="url(#gold)" stroke-width="7"/>',
         f'<circle cx="{cx}" cy="{cy}" r="318" fill="none" stroke="url(#gold)" stroke-width="2"/>']
    for i in range(72):
        a = 2 * math.pi * i / 72
        o.append(f'<circle cx="{f(cx+math.cos(a)*341)}" cy="{f(cy+math.sin(a)*341)}" r="3.4" fill="url(#gold)"/>')
    ticks = []
    for d in range(0, 360, 2):
        a = math.radians(d); L = 22 if d % 30 == 0 else 13 if d % 10 == 0 else 7
        ticks.append(f'M{f(cx+math.cos(a)*272)} {f(cy+math.sin(a)*272)} L{f(cx+math.cos(a)*(272+L))} {f(cy+math.sin(a)*(272+L))}')
    o.append(f'<path d="{" ".join(ticks)}" stroke="#E2B654" stroke-width="1.6"/>')
    return o


def gear_d(cx, cy, r_root, r_tip, n, tooth=0.42):
    """Gear outline: n trapezoid teeth between root and tip radius."""
    pts = []
    for i in range(n):
        a0 = 2 * math.pi * i / n; s = 2 * math.pi / n
        for frac, r in ((0, r_root), (tooth * 0.18, r_root), (tooth * 0.38, r_tip), (tooth * 0.82, r_tip), (tooth, r_root)):
            a = a0 + s * frac
            pts.append((cx + r * math.cos(a), cy + r * math.sin(a)))
    return 'M' + ' L'.join(f'{f(x)} {f(y)}' for x, y in pts) + ' Z'


def gear_rim(cx, cy):
    o = [f'<path d="{gear_d(cx, cy, 322, 348, 48)}" fill="url(#gold)"/>',
         f'<circle cx="{cx}" cy="{cy}" r="318" fill="#120D06" stroke="#8A5C19" stroke-width="2"/>',
         f'<circle cx="{cx}" cy="{cy}" r="306" fill="none" stroke="url(#gold)" stroke-width="2.4"/>']
    # rivets around the rim
    for i in range(24):
        a = 2 * math.pi * (i + 0.5) / 24
        o.append(f'<circle cx="{f(cx+math.cos(a)*290)}" cy="{f(cy+math.sin(a)*290)}" r="4" fill="url(#pGold)"/>')
    return o


def sky(cx, cy, r=266, seed=7, n=170):
    o = [f'<circle cx="{cx}" cy="{cy}" r="{r}" fill="url(#sky)" stroke="url(#gold)" stroke-width="4"/>',
         f'<clipPath id="skyclip"><circle cx="{cx}" cy="{cy}" r="{r-4}"/></clipPath><g clip-path="url(#skyclip)">']
    rnd = random.Random(seed)
    for _ in range(n):
        ang = rnd.uniform(0, 2 * math.pi); rr = (r - 4) * math.sqrt(rnd.random())
        o.append(f'<circle cx="{f(cx+math.cos(ang)*rr)}" cy="{f(cy+math.sin(ang)*rr)}" r="{f(rnd.choice([0.7,0.9,1.1,1.5]))}" fill="#F7E3A6" opacity="{f(rnd.uniform(.35,.95))}"/>')
    return o


def planet(x, y, r, fill):
    return f'<circle cx="{f(x)}" cy="{f(y)}" r="{f(r)}" fill="url(#{fill})"/>'


def sun(cx, cy, r=32, glow=110):
    return [f'<circle cx="{cx}" cy="{cy}" r="{glow}" fill="url(#sunglow)"/>', f'<circle cx="{cx}" cy="{cy}" r="{r}" fill="url(#sun)"/>']


def shaft(cx, cy, top):
    return f'<rect x="{cx-2.5}" y="{top}" width="5" height="{cy+290-top}" fill="url(#goldH)"/>'


# ---------- motifs ----------
def motif_gear(cx, cy):
    o = gear_rim(cx, cy) + sky(cx, cy, 262)
    # three orbits with planets, plus a small meshing gear riding the outer orbit
    orbits = (78, 112, 150, 192, 232)
    for i, r in enumerate(orbits):
        o.append(f'<circle cx="{cx}" cy="{cy}" r="{r}" fill="none" stroke="#D6A945" stroke-opacity="{.62 if i % 2 == 0 else .42}" stroke-width="1.4"/>')
    o.append(shaft(cx, cy, cy + 30))
    o += sun(cx, cy, 34, 115)
    # a small inner gear behind the sun, its teeth standing in for rays
    o.insert(-2, f'<path d="{gear_d(cx, cy, 44, 54, 16, 0.5)}" fill="url(#gold)" opacity=".9"/>')
    for r, ang, pr, fill in ((78, 300, 8, 'pPale'), (112, 160, 12, 'pPale'), (150, 20, 11, 'pRust'), (192, 215, 22, 'pGold'), (232, 120, 15, 'pPale')):
        a = math.radians(ang); o.append(planet(cx + r * math.cos(a), cy + r * math.sin(a), pr, fill))
    # the Moon beside Earth
    a = math.radians(160); o.append(planet(cx + 112 * math.cos(a) - 18, cy + 112 * math.sin(a) - 12, 3, 'pPale'))
    # small gear on the outer orbit
    a = math.radians(330); gx, gy = cx + 232 * math.cos(a), cy + 232 * math.sin(a)
    o.append(f'<path d="{gear_d(gx, gy, 18, 25, 10, 0.5)}" fill="url(#gold)"/>')
    o.append(f'<circle cx="{f(gx)}" cy="{f(gy)}" r="7" fill="#120D06" stroke="url(#gold)" stroke-width="2"/>')
    for x, y, r in [(cx-120, cy-200, 7), (cx+70, cy-120, 5), (cx-200, cy+90, 5), (cx+120, cy+170, 6)]:
        o.append(f'<path d="{sparkle(x, y, r)}" fill="#FFF1C2"/>')
    o.append('</g>')
    return o


def ellipse_ring(cx, cy, rx, ry, rot, w=5, front=None):
    """Armillary band. front=None draws the whole ring; True/False draws the near/far half."""
    t = f'rotate({rot} {cx} {cy})'
    if front is None:
        return f'<ellipse cx="{cx}" cy="{cy}" rx="{rx}" ry="{ry}" fill="none" stroke="url(#gold)" stroke-width="{w}" transform="{t}"/>'
    sweep = 0 if front else 1
    return (f'<path d="M{f(cx-rx)} {f(cy)} A{f(rx)} {f(ry)} 0 0 {sweep} {f(cx+rx)} {f(cy)}" fill="none" '
            f'stroke="url(#gold)" stroke-width="{w}" stroke-linecap="round" transform="{t}" opacity="{1 if front else .55}"/>')


def motif_armillary(cx, cy):
    o = degree_ring(cx, cy) + sky(cx, cy)
    R = 205
    o.append(shaft(cx, cy, cy + R))
    # back halves
    for rx, ry, rot in ((R, R * 0.30, 0), (R, R * 0.30, -23.4), (R * 0.30, R, 0)):
        o.append(ellipse_ring(cx, cy, rx, ry, rot, 6, front=False))
    o.append(f'<circle cx="{cx}" cy="{cy}" r="{R}" fill="none" stroke="url(#gold)" stroke-width="7"/>')
    o.append(f'<circle cx="{cx}" cy="{cy}" r="{R-10}" fill="none" stroke="#D6A945" stroke-opacity=".5" stroke-width="1.2"/>')
    # meridian tick marks on the main ring
    ticks = []
    for d in range(0, 360, 10):
        a = math.radians(d)
        ticks.append(f'M{f(cx+math.cos(a)*(R-10))} {f(cy+math.sin(a)*(R-10))} L{f(cx+math.cos(a)*(R-3))} {f(cy+math.sin(a)*(R-3))}')
    o.append(f'<path d="{" ".join(ticks)}" stroke="#E2B654" stroke-width="1.4"/>')
    # polar axis
    a = math.radians(-23.4 - 90)
    o.append(f'<path d="M{f(cx+math.cos(a)*(R+34))} {f(cy+math.sin(a)*(R+34))} L{f(cx-math.cos(a)*(R+34))} {f(cy-math.sin(a)*(R+34))}" stroke="url(#goldH)" stroke-width="4"/>')
    o += sun(cx, cy, 34, 105)
    # front halves
    for rx, ry, rot in ((R, R * 0.30, 0), (R, R * 0.30, -23.4), (R * 0.30, R, 0)):
        o.append(ellipse_ring(cx, cy, rx, ry, rot, 6, front=True))
    # a planet riding the ecliptic band, a moon on the equator
    a = math.radians(-23.4)
    px, py = cx + R * 0.86 * math.cos(a) , cy + R * 0.30 * 0.5 * 1 + R * 0.86 * math.sin(a)
    o.append(planet(cx + 150, cy - 37, 15, 'pRust'))
    o.append(planet(cx - 168, cy + 34, 11, 'pPale'))
    for x, y, r in [(cx-120, cy-215, 7), (cx+90, cy-232, 6), (cx+228, cy-60, 5), (cx-200, cy+150, 5), (cx+160, cy+200, 6)]:
        o.append(f'<path d="{sparkle(x, y, r)}" fill="#FFF1C2"/>')
    o.append('</g>')
    return o


def motif_monogram(cx, cy):
    o = degree_ring(cx, cy) + sky(cx, cy)
    # an orbit ring encircling the initials, with a planet on it
    o.append(f'<circle cx="{cx}" cy="{cy}" r="228" fill="none" stroke="#D6A945" stroke-opacity=".6" stroke-width="1.6"/>')
    o.append(f'<ellipse cx="{cx}" cy="{cy}" rx="236" ry="78" fill="none" stroke="url(#gold)" stroke-width="3" transform="rotate(-18 {cx} {cy})" opacity=".85"/>')
    o.append(f'<circle cx="{cx}" cy="{cy-30}" r="150" fill="url(#sunglow)" opacity=".55"/>')
    # interlaced initials: C behind, M in front
    c_d, _, _ = runs_d([(DECO, 'C', 330)], cx - 52, cy + 112)
    m_d, _, _ = runs_d([(DECO, 'M', 250)], cx + 34, cy + 92)
    o.append(f'<path d="{c_d}" fill="url(#gold)" stroke="#120D06" stroke-width="6" paint-order="stroke"/>')
    o.append(f'<path d="{m_d}" fill="url(#gold)" stroke="#120D06" stroke-width="7" paint-order="stroke"/>')
    a = math.radians(-18)
    for t, pr, fill in ((200, 16, 'pGold'), (20, 10, 'pPale')):
        th = math.radians(t)
        ex, ey = 236 * math.cos(th), 78 * math.sin(th)
        o.append(planet(cx + ex * math.cos(a) - ey * math.sin(a), cy + ex * math.sin(a) + ey * math.cos(a), pr, fill))
    o.append(shaft(cx, cy, cy + 150))
    for x, y, r in [(cx-150, cy-170, 7), (cx+150, cy-180, 6), (cx+200, cy+110, 5), (cx-190, cy+120, 5)]:
        o.append(f'<path d="{sparkle(x, y, r)}" fill="#FFF1C2"/>')
    o.append('</g>')
    return o


def medallion(cx, cy):
    my = cy - 336
    return [f'<circle cx="{cx}" cy="{my}" r="40" fill="#120D06" stroke="url(#gold)" stroke-width="5"/>',
            f'<circle cx="{cx}" cy="{my}" r="31" fill="none" stroke="url(#gold)" stroke-width="1.5"/>',
            f'<path d="{sparkle(cx, my, 27, 0.16)}" fill="url(#gold)"/>',
            f'<path d="{sparkle(cx, my, 17, 0.2)}" fill="#F3D27A" transform="rotate(45 {cx} {my})"/>',
            f'<path d="M{cx} {my-48} L{cx+6} {my-40} L{cx-6} {my-40} Z" fill="url(#gold)"/>']


MOTIFS = {'gear': motif_gear, 'armillary': motif_armillary, 'monogram': motif_monogram}


def build_crest(motif):
    W, H, cx, cy = 860, 1100, 430, 440
    o = frame(cx, cy) + MOTIFS[motif](cx, cy) + medallion(cx, cy)
    o.append(cm_wordmark_group(cx, 872, 600, 270))
    return svg(W, H, '\n'.join(o))


def build_wordmark():
    return svg(820, 440, cm_wordmark_group(410, 222, 600, 270))


if __name__ == '__main__':
    outdir = sys.argv[1]
    for m in MOTIFS:
        open(f'{outdir}/cm-crest-{m}.svg', 'w').write(build_crest(m))
    open(f'{outdir}/cm-wordmark.svg', 'w').write(build_wordmark())
