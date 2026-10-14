"""Thanksgiving edition of the Burlington/Hamilton relief map.

Warm harvest grade on land, autumn-canopy tint on the escarpment,
and a few gold-leaf maple leaves drifting over Lake Ontario.
"""
import sys, math, random
import numpy as np
from PIL import Image, ImageDraw, ImageFilter

src, out = sys.argv[1], sys.argv[2]
im = Image.open(src).convert("RGB")
W, H = im.size
a = np.asarray(im).astype(np.float32) / 255.0
r, g, b = a[..., 0], a[..., 1], a[..., 2]

# ---- masks --------------------------------------------------------------
water = np.clip((b - r) * 6.0, 0, 1)                     # lake is blue > red
water = np.asarray(Image.fromarray((water * 255).astype(np.uint8)).filter(ImageFilter.GaussianBlur(2))) / 255.0
land = 1.0 - water
lum = 0.299 * r + 0.587 * g + 0.114 * b

# ---- 1. harvest grade on land (cream -> warm honey parchment) -------------
shadow = np.array([0.36, 0.20, 0.10])    # deep walnut
mid    = np.array([0.80, 0.58, 0.34])    # honey / amber
high   = np.array([0.98, 0.90, 0.76])    # warm parchment
t = np.clip((lum - 0.55) / 0.45, 0, 1)[..., None]
t2 = np.clip(lum / 0.75, 0, 1)[..., None]
graded = np.where(t > 0, mid * (1 - t) + high * t, shadow * (1 - t2) + mid * t2)
land_mix = 0.62
a_land = a * (1 - land_mix) + graded * land_mix

# roads (gold lines) -> richer copper
goldness = np.clip((r - b) * 3.5 - 0.35, 0, 1) * land
copper = np.array([0.72, 0.38, 0.14])
a_land = a_land * (1 - 0.55 * goldness[..., None]) + copper * 0.55 * goldness[..., None]

# ---- 2. autumn relief: smooth gradient-map across the escarpment ---------
# A very soft colour field drifts between gold, amber, rust and deep crimson;
# relief shadows take the field colour, highlights stay warm ivory.
rng = random.Random(1012)
field = Image.new("RGB", (32, 18))
fd = field.load()
pal = [(196, 128, 44), (176, 84, 30), (140, 44, 30), (206, 150, 58), (158, 66, 28)]
for y in range(18):
    for x in range(32):
        fd[x, y] = rng.choice(pal)
field = field.resize((W, H), Image.BICUBIC).filter(ImageFilter.GaussianBlur(60))
c = np.asarray(field).astype(np.float32) / 255.0
yy, xx = np.mgrid[0:H, 0:W]
zone = np.clip(1.25 - (xx / W) * 0.95 - (yy / H) * 0.45, 0, 1) ** 1.2
shade = np.clip((0.985 - lum) / 0.20, 0, 1)[..., None] ** 0.8    # 0 = highlight, 1 = deep relief shadow
ivory = np.array([0.97, 0.88, 0.70])
gm = ivory * (1 - shade) + c * shade
gm = gm * (0.80 + 0.20 * (1 - shade))
strength = (0.78 * zone * land)[..., None]
a_land = a_land * (1 - strength) + gm * strength

# ---- 3. water: deeper evening navy with a faint warm reflection ----------
navy = a * np.array([0.78, 0.84, 0.92])
glow = np.exp(-(((xx - W * 0.86) / (W * 0.30)) ** 2 + ((yy - H * 0.18) / (H * 0.45)) ** 2))
navy = navy + glow[..., None] * np.array([0.10, 0.06, 0.02])
outa = a_land * land[..., None] + navy * water[..., None]

base = Image.fromarray((np.clip(outa, 0, 1) * 255).astype(np.uint8))

# ---- 4. gold-leaf maple leaves over the lake -----------------------------
def maple(cx, cy, size, ang):
    # stylised Canadian maple leaf, unit coords, tip at (0,-1)
    half = [(0, -1.0), (0.10, -0.80), (0.21, -0.85), (0.18, -0.56), (0.24, -0.42),
            (0.42, -0.58), (0.48, -0.48), (0.80, -0.62), (0.68, -0.40), (0.88, -0.32),
            (0.62, -0.16), (0.58, -0.06), (0.66, 0.08), (0.30, 0.06), (0.07, 0.12), (0.045, 0.52)]
    pts = half + [(-x, y) for x, y in reversed(half)]
    ca, sa = math.cos(ang), math.sin(ang)
    return [(cx + size * (x * ca - y * sa), cy + size * (x * sa + y * ca)) for x, y in pts]

SS = 3  # supersample for crisp edges
layer = Image.new("RGBA", (W * SS, H * SS), (0, 0, 0, 0))
shadow_l = Image.new("RGBA", (W * SS, H * SS), (0, 0, 0, 0))
leaves = [  # (x, y, size, rotation deg, alpha) — on the escarpment, which the page mirrors to the right
    (0.12, 0.30, 60, -20, 240),
    (0.27, 0.22, 34, 32, 225),
    (0.34, 0.50, 46, -42, 235),
    (0.17, 0.66, 30, 58, 215),
    (0.05, 0.48, 24, 12, 200),
    (0.25, 0.80, 40, -66, 225),
]
grad = Image.linear_gradient("L").resize((W * SS, H * SS))
for fx, fy, sz, rot, al in leaves:
    pts = maple(fx * W * SS, fy * H * SS, sz * SS, math.radians(rot))
    sd = ImageDraw.Draw(shadow_l)
    sd.polygon([(x + 5 * SS, y + 7 * SS) for x, y in pts], fill=(40, 16, 6, int(al * 0.60)))
    m = Image.new("L", (W * SS, H * SS), 0)
    ImageDraw.Draw(m).polygon(pts, fill=al)
    # gold foil: light gold -> deep copper across each leaf
    x0 = min(p[0] for p in pts); x1 = max(p[0] for p in pts)
    y0 = min(p[1] for p in pts); y1 = max(p[1] for p in pts)
    gw, gh = int(x1 - x0) + 2, int(y1 - y0) + 2
    gy = np.linspace(0, 1, gh)[:, None]; gx = np.linspace(0, 1, gw)[None, :]
    tt = np.clip(0.65 * gy + 0.35 * gx, 0, 1)[..., None]
    c1 = np.array([240, 188, 92]); c2 = np.array([138, 40, 24])
    tile = (c1 * (1 - tt) + c2 * tt).astype(np.uint8)
    foil = Image.new("RGB", (W * SS, H * SS)); foil.paste(Image.fromarray(tile), (int(x0), int(y0)))
    leaf = Image.merge("RGBA", (*foil.split(), m))
    layer = Image.alpha_composite(layer, leaf)
    # vein
    vd = ImageDraw.Draw(layer)
    ca, sa = math.cos(math.radians(rot)), math.sin(math.radians(rot))
    cx, cy = fx * W * SS, fy * H * SS
    vd.line([(cx + sz * SS * (0 * ca - (-0.85) * sa), cy + sz * SS * (0 * sa + (-0.85) * ca)),
             (cx + sz * SS * (0 * ca - 0.38 * sa), cy + sz * SS * (0 * sa + 0.38 * ca))],
            fill=(250, 214, 140, int(al * 0.55)), width=max(1, int(sz * SS * 0.04)))
    for sx in (1, -1):
        ex, ey = 0.72 * sx, -0.55
        vd.line([(cx + sz * SS * (0 * ca - 0.1 * sa), cy + sz * SS * (0 * sa + 0.1 * ca)),
                 (cx + sz * SS * (ex * ca - ey * sa), cy + sz * SS * (ex * sa + ey * ca))],
                fill=(250, 214, 140, int(al * 0.40)), width=max(1, int(sz * SS * 0.03)))
shadow_l = shadow_l.filter(ImageFilter.GaussianBlur(6 * SS))
over = Image.alpha_composite(shadow_l, layer).resize((W, H), Image.LANCZOS)
final = Image.alpha_composite(base.convert("RGBA"), over).convert("RGB")
final.save(out, quality=94)
print("saved", out)
