#!/usr/bin/env python3
"""
Génère les icônes de l'application (PNG) sans aucune dépendance externe.

L'environnement de build ne dispose ni de Pillow, ni de cairosvg, ni
d'ImageMagick : le script contient donc son propre rasteriseur (échantillonnage
3x3 par pixel) et son propre encodeur PNG (zlib + CRC32).

Motif : une couronne de lames dressées (le trône) enfermée dans un anneau de
progression (le suivi des épisodes), sur fond de nuit.

    python3 tools/make_icons.py

Écrit assets/icon-512.png, icon-192.png, icon-180.png, icon-maskable-512.png.
"""

import math
import struct
import zlib
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
OUT = ROOT / "assets"

SS = 3                      # échantillons par axe et par pixel
SIZE = 512                  # rendu de référence

GOLD_DARK = (0x8a, 0x6f, 0x3d)
GOLD = (0xc8, 0xa1, 0x5a)
GOLD_LIGHT = (0xf0, 0xd9, 0xa5)
TRACK = (0x2b, 0x36, 0x44)
BLOOD = (0xa1, 0x37, 0x2c)
BG_TOP = (0x10, 0x16, 0x1f)
BG_BOTTOM = (0x1b, 0x26, 0x35)


def mix(a, b, t):
    t = 0.0 if t < 0 else (1.0 if t > 1 else t)
    return (a[0] + (b[0] - a[0]) * t,
            a[1] + (b[1] - a[1]) * t,
            a[2] + (b[2] - a[2]) * t)


# --------------------------------------------------------------------------- #
# Géométrie du motif                                                          #
# --------------------------------------------------------------------------- #

class Design:
    """Le motif, exprimé dans un carré [0, SIZE]. `inset` réduit le motif pour
    la variante maskable (zone de sécurité des icônes Android/adaptatives)."""

    def __init__(self, size=SIZE, inset=1.0, rounded=True):
        self.size = size
        self.rounded = rounded
        self.radius = size * 0.22
        self.cx = size / 2.0
        self.cy = size / 2.0
        self.k = inset                      # facteur d'échelle du motif

        self.ring_r = size * 0.383 * inset
        self.ring_w = size * 0.027 * inset
        self.sweep = 252.0                  # degrés d'anneau « accompli »

        # couronne de lames : (décalage x, demi-largeur, hauteur)
        self.blades = [(-0.127, 0.0175, 0.150),
                       (-0.064, 0.0190, 0.207),
                       (0.0,    0.0215, 0.268),
                       (0.064,  0.0190, 0.207),
                       (0.127,  0.0175, 0.150)]
        self.taper = 0.38                   # part haute de la lame qui s'affine
        self.bar_y0 = 0.586                 # bandeau de la couronne (fractions)
        self.bar_y1 = 0.629
        self.bar_x = 0.160
        self.under_y0 = 0.641
        self.under_y1 = 0.652
        self.under_x = 0.128

    def _f(self, frac):
        """Fraction de la taille, ramenée au centre et mise à l'échelle."""
        return self.cy + (frac - 0.5) * self.size * self.k

    def _w(self, frac):
        return frac * self.size * self.k

    def in_frame(self, x, y):
        if not self.rounded:
            return True
        s, r = self.size, self.radius
        dx = max(r - x, x - (s - r), 0.0)
        dy = max(r - y, y - (s - r), 0.0)
        return dx * dx + dy * dy <= r * r

    def shade(self, x, y):
        """Renvoie (r, g, b, a) pour un point donné."""
        if not self.in_frame(x, y):
            return None

        # fond : dégradé vertical + halo doux au centre
        col = mix(BG_TOP, BG_BOTTOM, y / self.size)
        d_center = math.hypot(x - self.cx, y - self.cy) / self.size
        col = mix(col, (0x22, 0x30, 0x40), max(0.0, 0.42 - d_center) * 0.55)

        dx, dy = x - self.cx, y - self.cy
        dist = math.hypot(dx, dy)

        # anneau
        half = self.ring_w / 2.0
        if abs(dist - self.ring_r) <= half:
            ang = math.degrees(math.atan2(dx, -dy)) % 360.0
            if ang <= self.sweep:
                col = mix(GOLD_DARK, GOLD_LIGHT, ang / self.sweep)
            else:
                col = TRACK

        # extrémités arrondies de l'arc + pointe rouge
        for ang, color, rad in ((0.0, GOLD_DARK, half),
                                (self.sweep, BLOOD, half * 1.25)):
            a = math.radians(ang)
            px = self.cx + math.sin(a) * self.ring_r
            py = self.cy - math.cos(a) * self.ring_r
            if math.hypot(x - px, y - py) <= rad:
                col = color

        # couronne de lames
        bar_y0, bar_y1 = self._f(self.bar_y0), self._f(self.bar_y1)
        bar_hw = self._w(self.bar_x)
        if bar_y0 <= y <= bar_y1 and abs(dx) <= bar_hw:
            col = mix(GOLD_LIGHT, GOLD_DARK, (y - bar_y0) / max(1e-6, bar_y1 - bar_y0))

        for off, hw, hgt in self.blades:
            bx = self.cx + self._w(off)
            top = bar_y0 - self._w(hgt)
            if top <= y <= bar_y0:
                t = (y - top) / max(1e-6, bar_y0 - top)      # 0 pointe, 1 base
                # lame : pointe effilée sur le haut, largeur constante ensuite
                w = self._w(hw) * min(1.0, t / self.taper)
                if abs(x - bx) <= w:
                    edge = abs(x - bx) / max(1e-6, w)
                    col = mix(mix(GOLD_LIGHT, GOLD, t), GOLD_DARK, edge * 0.75)

        # trait sous la couronne
        u0, u1 = self._f(self.under_y0), self._f(self.under_y1)
        if u0 <= y <= u1 and abs(dx) <= self._w(self.under_x):
            col = GOLD_DARK

        return (col[0], col[1], col[2], 255.0)


# --------------------------------------------------------------------------- #
# Rendu et encodage                                                           #
# --------------------------------------------------------------------------- #

def render(design):
    size = design.size
    buf = bytearray(size * size * 4)
    step = 1.0 / SS
    offsets = [(i + 0.5) * step for i in range(SS)]
    n = SS * SS
    i = 0
    for py in range(size):
        ys = [py + o for o in offsets]
        for px in range(size):
            xs = [px + o for o in offsets]
            r = g = b = a = 0.0
            for y in ys:
                for x in xs:
                    s = design.shade(x, y)
                    if s is not None:
                        r += s[0]; g += s[1]; b += s[2]; a += s[3]
            if a == 0.0:
                i += 4
                continue
            # couleurs moyennées sur les seuls échantillons couvrants,
            # alpha moyenné sur la totalité (c'est lui qui porte l'antialiasing)
            cov = a / 255.0
            buf[i] = int(r / cov)
            buf[i + 1] = int(g / cov)
            buf[i + 2] = int(b / cov)
            buf[i + 3] = int(a / n)
            i += 4
    return buf


def downscale(buf, src, dst):
    """Réduction par moyenne de blocs (le rapport n'a pas besoin d'être entier)."""
    out = bytearray(dst * dst * 4)
    ratio = src / dst
    for y in range(dst):
        y0, y1 = int(y * ratio), max(int(y * ratio) + 1, int((y + 1) * ratio))
        for x in range(dst):
            x0, x1 = int(x * ratio), max(int(x * ratio) + 1, int((x + 1) * ratio))
            r = g = b = a = 0
            count = 0
            for yy in range(y0, min(y1, src)):
                base = yy * src * 4
                for xx in range(x0, min(x1, src)):
                    p = base + xx * 4
                    alpha = buf[p + 3]
                    r += buf[p] * alpha; g += buf[p + 1] * alpha; b += buf[p + 2] * alpha
                    a += alpha
                    count += 1
            o = (y * dst + x) * 4
            if a:
                out[o] = r // a
                out[o + 1] = g // a
                out[o + 2] = b // a
            out[o + 3] = a // max(1, count)
    return out


def write_png(path, size, buf):
    raw = bytearray()
    stride = size * 4
    for y in range(size):
        raw.append(0)
        raw += buf[y * stride:(y + 1) * stride]

    def chunk(tag, data):
        return (struct.pack('>I', len(data)) + tag + data
                + struct.pack('>I', zlib.crc32(tag + data) & 0xffffffff))

    png = (b'\x89PNG\r\n\x1a\n'
           + chunk(b'IHDR', struct.pack('>IIBBBBB', size, size, 8, 6, 0, 0, 0))
           + chunk(b'IDAT', zlib.compress(bytes(raw), 9))
           + chunk(b'IEND', b''))
    path.write_bytes(png)
    print(f'  {path.relative_to(ROOT)}  ({len(png) / 1024:.1f} ko)')


def main():
    OUT.mkdir(parents=True, exist_ok=True)

    print('rendu 512 (icône principale)…')
    base = render(Design(SIZE, inset=1.0, rounded=True))
    write_png(OUT / 'icon-512.png', SIZE, base)

    print('réductions…')
    write_png(OUT / 'icon-192.png', 192, downscale(base, SIZE, 192))
    write_png(OUT / 'icon-180.png', 180, downscale(base, SIZE, 180))

    print('rendu 512 (maskable, plein cadre)…')
    mask = render(Design(SIZE, inset=0.74, rounded=False))
    write_png(OUT / 'icon-maskable-512.png', SIZE, mask)


if __name__ == '__main__':
    main()
