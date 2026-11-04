"""Generate vector Grand Orrery logos (crest + wordmark) with all text as outlines."""
import math, os, random, sys
from fontTools.ttLib import TTFont
from fontTools.pens.svgPathPen import SVGPathPen
from fontTools.pens.transformPen import TransformPen

F = os.environ.get('FONT_DIR', 'fonts')
CINZEL = TTFont(f'{F}/fontsource-cinzel-5.3.0/package/files/cinzel-latin-700-normal.woff2')
SCRIPT = TTFont(f'{F}/fontsource-pinyon-script-5.3.0/package/files/pinyon-script-latin-400-normal.woff2')


def text_d(font, s, size, cx, baseline, track=0.0, max_w=None):
    gs = font.getGlyphSet(); cmap = font.getBestCmap(); upm = font['head'].unitsPerEm
    names = [cmap[ord(c)] for c in s]
    adv = [font['hmtx'][n][0] for n in names]
    total = (sum(adv) + track * upm * (len(s) - 1)) * size / upm
    if max_w and total > max_w:
        size *= max_w / total; total = max_w
    sc = size / upm
    x = cx - total / 2
    pen = SVGPathPen(gs)
    for n, a in zip(names, adv):
        gs[n].draw(TransformPen(pen, (sc, 0, 0, -sc, x, baseline)))
        x += a * sc + track * size
    return pen.getCommands(), total, size


def f(v):
    return f'{v:.2f}'.rstrip('0').rstrip('.')


def cartouche(cx, cy, W, H, a, b, c, p):
    """Plaque: arched top, notched corners, pointed sides, pointed bottom."""
    L, R, T, B = cx - W / 2, cx + W / 2, cy - H / 2, cy + H / 2
    h1 = H * 0.16
    return (f'M{f(L+c)} {f(T)} Q{f(cx)} {f(T-2*a)} {f(R-c)} {f(T)} '
            f'A{f(c)} {f(c)} 0 0 0 {f(R)} {f(T+c)} L{f(R)} {f(cy-h1)} L{f(R+p)} {f(cy)} L{f(R)} {f(cy+h1)} '
            f'L{f(R)} {f(B-c)} A{f(c)} {f(c)} 0 0 0 {f(R-c)} {f(B)} '
            f'C{f(cx+W*0.18)} {f(B)} {f(cx+W*0.06)} {f(B+b*0.55)} {f(cx)} {f(B+b)} '
            f'C{f(cx-W*0.06)} {f(B+b*0.55)} {f(cx-W*0.18)} {f(B)} {f(L+c)} {f(B)} '
            f'A{f(c)} {f(c)} 0 0 0 {f(L)} {f(B-c)} L{f(L)} {f(cy+h1)} L{f(L-p)} {f(cy)} L{f(L)} {f(cy-h1)} '
            f'L{f(L)} {f(T+c)} A{f(c)} {f(c)} 0 0 0 {f(L+c)} {f(T)} Z')


def sparkle(x, y, r, thin=0.18):
    t = r * thin
    return (f'M{f(x)} {f(y-r)} Q{f(x+t)} {f(y-t)} {f(x+r)} {f(y)} Q{f(x+t)} {f(y+t)} {f(x)} {f(y+r)} '
            f'Q{f(x-t)} {f(y+t)} {f(x-r)} {f(y)} Q{f(x-t)} {f(y-t)} {f(x)} {f(y-r)} Z')


def burst(x, y, r, n=24, seed=3):
    rnd = random.Random(seed); out = []
    for i in range(n):
        ang = 2 * math.pi * i / n
        L = r * (1.0 if i % 6 == 0 else 0.62 if i % 2 == 0 else 0.38) * rnd.uniform(0.9, 1.05)
        w = 0.05 if i % 6 == 0 else 0.07
        a1, a2 = ang - w, ang + w
        x1, y1 = x + math.cos(a1) * r * 0.08, y + math.sin(a1) * r * 0.08
        x2, y2 = x + math.cos(a2) * r * 0.08, y + math.sin(a2) * r * 0.08
        tx, ty = x + math.cos(ang) * L, y + math.sin(ang) * L
        out.append(f'M{f(x1)} {f(y1)} L{f(tx)} {f(ty)} L{f(x2)} {f(y2)} Z')
    return ' '.join(out)


def spiral(ax, ay, r_out, turns, rot, mirror=1, k=0.22):
    """Log spiral whose outer end sits at anchor (ax, ay), curling inward; open path."""
    cx, cy = ax - r_out * math.cos(rot), ay - r_out * math.sin(rot)
    pts = []
    steps = int(60 * turns)
    for i in range(steps + 1):
        th = 2 * math.pi * turns * i / steps
        r = r_out * math.exp(-k * th)
        a = rot + mirror * th
        pts.append((cx + r * math.cos(a), cy + r * math.sin(a)))
    return 'M' + ' L'.join(f'{f(x)} {f(y)}' for x, y in pts)


DEFS = '''<defs>
<linearGradient id="gold" x1="0" y1="0" x2="0" y2="1">
 <stop offset="0" stop-color="#FFF0B3"/><stop offset=".38" stop-color="#EFC452"/>
 <stop offset=".7" stop-color="#C08A2C"/><stop offset="1" stop-color="#8A5C19"/></linearGradient>
<linearGradient id="goldH" x1="0" y1="0" x2="1" y2="0">
 <stop offset="0" stop-color="#B07D26"/><stop offset=".5" stop-color="#F7DC85"/><stop offset="1" stop-color="#B07D26"/></linearGradient>
<radialGradient id="plaque" cx=".5" cy=".4" r=".7">
 <stop offset="0" stop-color="#1C150A"/><stop offset="1" stop-color="#070503"/></radialGradient>
<radialGradient id="sky" cx=".5" cy=".55" r=".6">
 <stop offset="0" stop-color="#241A0A"/><stop offset=".6" stop-color="#0E0A05"/><stop offset="1" stop-color="#050302"/></radialGradient>
<radialGradient id="sunglow"><stop offset="0" stop-color="#FFF6D0" stop-opacity=".95"/>
 <stop offset=".25" stop-color="#FFD25A" stop-opacity=".55"/><stop offset="1" stop-color="#FFB800" stop-opacity="0"/></radialGradient>
<radialGradient id="sun" cx=".42" cy=".38"><stop offset="0" stop-color="#FFFDF0"/><stop offset=".5" stop-color="#FFE27A"/><stop offset="1" stop-color="#E9A520"/></radialGradient>
<radialGradient id="pGold" cx=".35" cy=".32"><stop offset="0" stop-color="#FFF3C4"/><stop offset=".55" stop-color="#D9A441"/><stop offset="1" stop-color="#5E3E0E"/></radialGradient>
<radialGradient id="pPale" cx=".35" cy=".32"><stop offset="0" stop-color="#FFFFFF"/><stop offset=".55" stop-color="#CFC6AE"/><stop offset="1" stop-color="#4A4232"/></radialGradient>
<radialGradient id="pRust" cx=".35" cy=".32"><stop offset="0" stop-color="#FFE0B8"/><stop offset=".55" stop-color="#C9783A"/><stop offset="1" stop-color="#4E2410"/></radialGradient>
</defs>'''


def wordmark_group(cx, cy, W, H):
    """Plaque + lettering, centred on (cx, cy). Returns svg fragment."""
    a, b, c, p = H * 0.075, H * 0.17, H * 0.15, H * 0.11
    out = [f'<path d="{cartouche(cx, cy, W, H, a, b, c, p)}" fill="url(#plaque)" stroke="url(#gold)" stroke-width="{f(H*0.026)}" stroke-linejoin="round"/>']
    s = 0.93
    out.append(f'<path d="{cartouche(cx, cy, W*s, H*0.87, a*0.8, b*0.75, c*0.8, p*0.6)}" fill="none" stroke="url(#gold)" stroke-width="{f(H*0.008)}" opacity=".85"/>')
    burst_parts = []
    by = cy + H * 0.5 + b * 0.35
    burst_parts.append(f'<circle cx="{f(cx)}" cy="{f(by)}" r="{f(H*0.16)}" fill="url(#sunglow)" opacity=".9"/>')
    burst_parts.append(f'<path d="{burst(cx, by, H*0.26)}" fill="#FFE9A0"/>')
    burst_parts.append(f'<circle cx="{f(cx)}" cy="{f(by)}" r="{f(H*0.02)}" fill="#FFFBEA"/>')
    out.extend(burst_parts)
    # lettering
    the_d, the_w, _ = text_d(SCRIPT, 'The', H * 0.27, cx, cy - H * 0.19)
    grand_d, gw, _ = text_d(CINZEL, 'GRAND', H * 0.31, cx, cy + H * 0.085, track=0.06, max_w=W * 0.6)
    orr_d, ow, osz = text_d(CINZEL, 'ORRERY', H * 0.35, cx, cy + H * 0.39, track=0.04, max_w=W * 0.72)
    out.append(f'<g fill="url(#gold)"><path d="{the_d}"/><path d="{grand_d}"/><path d="{orr_d}"/></g>')
    # rules flanking "The"
    ry = cy - H * 0.235
    for sgn in (-1, 1):
        x0 = cx + sgn * (the_w / 2 + H * 0.05); x1 = x0 + sgn * W * 0.17
        out.append(f'<path d="M{f(x0)} {f(ry)} L{f(x1)} {f(ry)}" stroke="#D9AE4E" stroke-width="{f(H*0.009)}"/>')
        d = H * 0.022
        out.append(f'<path d="M{f(x1)} {f(ry-d)} L{f(x1+sgn*d)} {f(ry)} L{f(x1)} {f(ry+d)} L{f(x1-sgn*d)} {f(ry)} Z" fill="#EFC452"/>')
    # sparkles beside ORRERY
    sy = cy + H * 0.255
    for sgn in (-1, 1):
        out.append(f'<path d="{sparkle(cx + sgn*(ow/2 + H*0.1), sy, H*0.045)}" fill="#F6DA7E"/>')
    # starburst in bottom point
    # corner scrolls: C-scrolls springing from each notched corner
    for sx in (-1, 1):
        for sy2 in (-1, 1):
            ax = cx + sx * (W / 2 - c * 0.3); ay = cy + sy2 * (H / 2 - c * 0.3)
            rot = math.atan2(-sy2, -sx)  # spiral centre lies outside the corner
            out.append(f'<path d="{spiral(ax, ay, H*0.11, 1.45, rot, mirror=sx*sy2, k=0.26)}" fill="none" stroke="url(#gold)" stroke-width="{f(H*0.016)}" stroke-linecap="round"/>')
    return '\n'.join(out)


def svg(w, h, body):
    return f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 {w} {h}" width="{w}" height="{h}">\n{DEFS}\n{body}\n</svg>\n'


def build_wordmark():
    W, H = 760, 350
    return svg(W, H, wordmark_group(380, 158, 620, 250))


def build_crest():
    W, H = 800, 1000
    cx, cy = 400, 400
    o = []
    # side scrolls springing from the ring towards the plaque
    for sx in (-1, 1):
        for ang, rr, t in ((55, 46, 1.5), (30, 34, 1.5)):
            a = math.radians(90 - sx * (90 - ang)) if False else math.radians(ang if sx > 0 else 180 - ang)
            ax, ay = cx + math.cos(a) * 344, cy + math.sin(a) * 344
            o.append(f'<path d="{spiral(ax, ay, rr, t, a + math.pi, mirror=-sx, k=0.26)}" fill="none" stroke="url(#gold)" stroke-width="6" stroke-linecap="round"/>')
    # degree ring
    o.append(f'<circle cx="{cx}" cy="{cy}" r="330" fill="#120D06" stroke="url(#gold)" stroke-width="7"/>')
    o.append(f'<circle cx="{cx}" cy="{cy}" r="318" fill="none" stroke="url(#gold)" stroke-width="2"/>')
    # beads on outer edge
    for i in range(72):
        a = 2 * math.pi * i / 72
        o.append(f'<circle cx="{f(cx+math.cos(a)*341)}" cy="{f(cy+math.sin(a)*341)}" r="3.4" fill="url(#gold)"/>')
    ticks = []
    for d in range(0, 360, 2):
        a = math.radians(d)
        L = 22 if d % 30 == 0 else 13 if d % 10 == 0 else 7
        r0 = 272
        ticks.append(f'M{f(cx+math.cos(a)*r0)} {f(cy+math.sin(a)*r0)} L{f(cx+math.cos(a)*(r0+L))} {f(cy+math.sin(a)*(r0+L))}')
    o.append(f'<path d="{" ".join(ticks)}" stroke="#E2B654" stroke-width="1.6"/>')
    numerals = ['XII', 'I', 'II', 'III', 'IV', 'V', 'VI', 'VII', 'VIII', 'IX', 'X', 'XI']
    for i, n in enumerate(numerals):
        if i in (0,):
            continue
        d, _, _ = text_d(CINZEL, n, 19, cx, cy - 297)
        o.append(f'<path d="{d}" fill="#F0CD6E" transform="rotate({i*30} {cx} {cy})"/>')
    # sky
    o.append(f'<circle cx="{cx}" cy="{cy}" r="266" fill="url(#sky)" stroke="url(#gold)" stroke-width="4"/>')
    o.append('<clipPath id="skyclip"><circle cx="400" cy="400" r="262"/></clipPath><g clip-path="url(#skyclip)">')
    rnd = random.Random(7)
    for _ in range(170):
        ang = rnd.uniform(0, 2 * math.pi); r = 262 * math.sqrt(rnd.random())
        o.append(f'<circle cx="{f(cx+math.cos(ang)*r)}" cy="{f(cy+math.sin(ang)*r)}" r="{f(rnd.choice([0.7,0.9,1.1,1.5]))}" fill="#F7E3A6" opacity="{f(rnd.uniform(.35,.95))}"/>')
    for x, y, r in [(250, 255, 7), (560, 235, 6), (320, 560, 5), (585, 545, 7), (470, 190, 4), (215, 430, 5)]:
        o.append(f'<path d="{sparkle(x, y, r)}" fill="#FFF1C2"/>')
    ocx, ocy = cx, 412
    radii = [48, 74, 100, 127, 156, 186, 214, 242]
    for r in radii:
        o.append(f'<ellipse cx="{ocx}" cy="{ocy}" rx="{r}" ry="{f(r*0.4)}" fill="none" stroke="#D6A945" stroke-opacity=".55" stroke-width="1.3"/>')
    o.append(f'<circle cx="{ocx}" cy="{ocy}" r="95" fill="url(#sunglow)"/>')
    # central shaft
    o.append(f'<rect x="{ocx-2.5}" y="{ocy}" width="5" height="{670-ocy}" fill="url(#goldH)"/>')
    for yy, ww in [(ocy + 70, 16), (ocy + 150, 22), (ocy + 230, 28)]:
        o.append(f'<ellipse cx="{ocx}" cy="{yy}" rx="{ww/2}" ry="3.2" fill="url(#gold)"/>')
    planets = [  # (orbit idx, angle deg, radius, fill)
        (0, 200, 6, 'pPale'), (1, 330, 9, 'pGold'), (2, 140, 9.5, 'pPale'), (3, 25, 7.5, 'pRust'),
        (4, 205, 21, 'pGold'), (5, 335, 17, 'pGold'), (6, 150, 13, 'pPale'), (7, 20, 13, 'pPale')]
    for oi, ang, pr, fill in planets:
        r = radii[oi]; a = math.radians(ang)
        x, y = ocx + r * math.cos(a), ocy + r * 0.4 * math.sin(a)
        if oi == 5:  # Saturn rings
            o.append(f'<ellipse cx="{f(x)}" cy="{f(y)}" rx="{f(pr*2.1)}" ry="{f(pr*0.55)}" fill="none" stroke="#F3D58A" stroke-width="2.4" transform="rotate(-14 {f(x)} {f(y)})"/>')
        o.append(f'<circle cx="{f(x)}" cy="{f(y)}" r="{pr}" fill="url(#{fill})"/>')
        if oi == 5:
            o.append(f'<path d="M{f(x-pr*2.1)} {f(y)} A{f(pr*2.1)} {f(pr*0.55)} 0 0 0 {f(x+pr*2.1)} {f(y)}" fill="none" stroke="#F3D58A" stroke-width="2.4" transform="rotate(-14 {f(x)} {f(y)})"/>')
    o.append(f'<circle cx="{ocx}" cy="{ocy}" r="25" fill="url(#sun)"/>')
    o.append('</g>')
    # top medallion with compass star
    my = cy - 336
    o.append(f'<circle cx="{cx}" cy="{my}" r="40" fill="#120D06" stroke="url(#gold)" stroke-width="5"/>')
    o.append(f'<circle cx="{cx}" cy="{my}" r="31" fill="none" stroke="url(#gold)" stroke-width="1.5"/>')
    o.append(f'<path d="{sparkle(cx, my, 27, 0.16)}" fill="url(#gold)"/>')
    o.append(f'<path d="{sparkle(cx, my, 17, 0.2)}" fill="#F3D27A" transform="rotate(45 {cx} {my})"/>')
    o.append(f'<path d="M{cx} {my-48} L{cx+6} {my-40} L{cx-6} {my-40} Z" fill="url(#gold)"/>')
    # plaque with lettering
    o.append(wordmark_group(cx, 805, 600, 250))
    return svg(W, H, '\n'.join(o))


if __name__ == '__main__':
    outdir = sys.argv[1]
    open(f'{outdir}/logo-crest.svg', 'w').write(build_crest())
    open(f'{outdir}/logo-wordmark.svg', 'w').write(build_wordmark())
