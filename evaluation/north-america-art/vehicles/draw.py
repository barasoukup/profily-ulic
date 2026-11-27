# The vehicles of North America (Bara 25. 11. 2026): own drawings, 1 unit = 1 cm, the views, scale and anchor of the
# other sets (wien, bratislava, brno). python3 draw.py writes app/public/<town>/*.svg. The buses that share a body
# (New Flyer Xcelsior) share its drawing; the photos and dimensions are in SOURCES.md.
import os
PUB = os.path.join(os.path.dirname(os.path.abspath(__file__)), "../../../app/public")
GLASS, SHINE, INK, TYRE = "#2c3944", "#46596a", "#17191c", "#111"

def mir(s):  # the mirror image of a bus part about its axis (x = 180)
    return f'{s}<g transform="translate(360 0) scale(-1 1)">{s}</g>'
def mirt(s):  # of a tram part (x = 160)
    return f'{s}<g transform="translate(320 0) scale(-1 1)">{s}</g>'

DIG = {"1": "bc", "2": "abged", "3": "abgcd", "4": "fgbc", "5": "afgcd", "6": "afgedc", "7": "abc", "8": "abcdefg", "9": "abcdfg", "0": "abcdef",
       "D": "bcdeg", "F": "aefg", "N": "ceg", "E": "adefg", "Q": "abcfg", "M": "abcef"}
def digits(t, x, y, h, col):  # plain block figures (no font), w = 0.55 h
    w, s = h * .55, h * .15
    seg = {"a": (0, 0, w, s), "g": (0, (h - s) / 2, w, s), "d": (0, h - s, w, s), "f": (0, 0, s, h / 2), "b": (w - s, 0, s, h / 2), "e": (0, h / 2, s, h / 2), "c": (w - s, h / 2, s, h / 2)}
    out = ""
    for ch in t:
        if ch == "1": x -= w - s  # a narrow figure
        for k in DIG[ch]:
            a, b, c, d = seg[k]
            out += f"M{x + a:.1f} {y + b:.1f}h{c:.1f}v{d:.1f}h{-c:.1f}Z"
        x += w + h * .2
    return f'<path d="{out}" fill="{col}"/>'
def words(x, y, w, h, col):  # an illegible destination: bars
    return "".join(f'<rect x="{x + a * w:.1f}" y="{y}" width="{b * w:.1f}" height="{h}" fill="{col}"/>' for a, b in ((0, .36), (.42, .16), (.64, .36)))

def svg(town, name, vb, comment, body, roof=None):
    r = f' data-roof="{roof}"' if roof else ""
    with open(f"{PUB}/{town}/{name}.svg", "w") as f:
        f.write(f'<svg viewBox="{vb}"{r} xmlns="http://www.w3.org/2000/svg">\n<!-- {comment} 1 unit = 1 cm. -->\n{body}\n</svg>\n')

# ---------- New Flyer Xcelsior (2.59 m wide, 3.20 m diesel without roof units, 3.38 m over the roof units) ----------
def rack(col, dark):
    p = '<g stroke="{0}" stroke-width="{1}" fill="none" stroke-linecap="round" stroke-linejoin="round"><path d="M108 258 H252 M112 270 H248 M108 258 Q104 264 112 270 M252 258 Q256 264 248 270"/><path d="M138 258 L146 206 H214 L222 258 M128 214 L146 206 M232 214 L214 206"/><path d="M150 224 H210"/></g>'
    return p.format(dark, 5) + p.format(col, 2.6) + f'<rect x="164" y="264" width="32" height="12" rx="2" fill="{INK}"/>'

# The inside of an inbound bus lane's bus: the face. c: colours and switches of a livery.
def xcel_front(c):
    body, roof, pod = c["body"], c["roof"], c["pod"]
    s = ""
    if c.get("poles"): s += poles()
    # roof units
    s += f'<path d="M62 16 Q80 10 88 -4 Q94 -14 110 -14 H250 Q266 -14 272 -4 Q280 10 298 16 Z" fill="{pod}"/><path d="M62 16 Q80 10 88 -4 Q94 -14 110 -14 H250 Q266 -14 272 -4 Q280 10 298 16 Z" fill="#000" opacity=".06"/>'
    # shell
    s += f'<path d="M50.5 276 V48 Q50.5 8 92 6 Q180 -1 268 6 Q309.5 8 309.5 48 V276 Z" fill="{body}"/>'
    s += f'<path d="M50.5 60 V48 Q50.5 8 92 6 Q180 -1 268 6 Q309.5 8 309.5 48 V60 Z" fill="{roof}"/>'
    s += c.get("bands", "")
    # marker lights of North America: three in the middle, one at each end
    s += '<g fill="#f2a33a"><rect x="152" y="8" width="13" height="5" rx="1.5"/><rect x="173.5" y="8" width="13" height="5" rx="1.5"/><rect x="195" y="8" width="13" height="5" rx="1.5"/><rect x="76" y="12" width="13" height="5" rx="1.5"/><rect x="271" y="12" width="13" height="5" rx="1.5"/></g>'
    # windscreen mask, destination display, two panes
    s += '<path d="M58 38 Q58 22 74 21 Q180 14 286 21 Q302 22 302 38 V158 Q302 172 286 174 Q180 184 74 174 Q58 172 58 158 Z" fill="#101113"/>'
    s += f'<rect x="72" y="27" width="216" height="32" rx="4" fill="#0c0d0e"/>' + digits(c["no"], 84, 33, 20, c["led"]) + words(142, 37, 130, 11, c["led"])
    s += f'<path d="M65 64 H177 V173 Q126 172 79 167 Q65 166 65 153 Z" fill="{GLASS}"/><path d="M183 64 H295 V153 Q295 166 281 167 Q234 172 183 173 Z" fill="{GLASS}"/>'
    s += f'<path d="M84 64 L128 64 L102 169 L80 167 Z" fill="{SHINE}" opacity=".5"/><path d="M250 64 L272 64 L262 112 L240 112 Z" fill="{SHINE}" opacity=".4"/>'
    s += '<g stroke="#0b0c0d" stroke-width="2.5" stroke-linecap="round"><path d="M122 178 L168 106"/><path d="M238 178 L192 106"/></g>'
    # the crease running down from the headlights to a shallow V
    s += f'<path d="M52 228 L92 226 L132 238 Q180 246 228 238 L268 226 L308 228" stroke="#000" stroke-opacity=".28" stroke-width="2" fill="none"/>'
    # headlights: wedges at the corners
    s += mir('<path d="M52 194 Q80 199 94 210 L107 223 Q109 227 104 227 L64 226 Q52 225 52 212 Z" fill="#4a5056"/><path d="M54.500 197 Q79 202 92 212 L102 223 L65 223 Q54.500 222 54.500 212 Z" fill="#d9dfe3"/><path d="M57 206 L70 208 V219 L60 218 Z M73 209 L84 213 V220 H73 Z M87 215 L96 221 H87 Z" fill="#fdfefb"/><rect x="54" y="232" width="20" height="6" rx="2" fill="#f2a33a"/>')
    # bumper, plate
    s += f'<path d="M50 244 Q180 256 310 244 V286 Q310 295 301 295 H59 Q50 295 50 286 Z" fill="#26292c"/><path d="M50 262 Q180 272 310 262" stroke="#3c4044" stroke-width="2" fill="none"/>'
    s += f'<rect x="165" y="226" width="30" height="16" rx="1.5" fill="{c.get("plate", "#f4f4f2")}" stroke="#9a9ea2" stroke-width="1"/>' 
    if c.get("rack"): s += rack(*c["rack"])
    # mirrors: the kerb side (left here) hung from the roof, the driver's below it
    s += f'<path d="M62 22 H44 Q36 22 36 34 V42" stroke="{INK}" stroke-width="5" fill="none"/><rect x="24" y="42" width="20" height="46" rx="6" fill="{INK}"/>'
    s += f'<path d="M309 100 H322" stroke="{INK}" stroke-width="4"/><rect x="316" y="84" width="18" height="46" rx="6" fill="{INK}"/>'
    s += f'<rect x="70" y="294" width="34" height="26" rx="4" fill="{TYRE}"/><rect x="256" y="294" width="34" height="26" rx="4" fill="{TYRE}"/>'
    return s

def poles(back=False):
    return ('<g stroke="#d9a521" stroke-linecap="round" fill="none"><path d="M162 0 L150 -222" stroke-width="5"/><path d="M198 0 L210 -222" stroke-width="5"/></g>'
            '<rect x="140" y="-231" width="16" height="10" rx="2" fill="#4a4d50"/><rect x="204" y="-231" width="16" height="10" rx="2" fill="#4a4d50"/><rect x="143" y="-234" width="10" height="4" rx="1.5" fill="#e6d48e"/><rect x="207" y="-234" width="10" height="4" rx="1.5" fill="#e6d48e"/>'
            + ('' if back else ""))

def xcel_back(c):
    body, pod = c.get("back", c["body"]), c["pod"]
    s = ""
    if c.get("poles"): s += poles(True)
    s += f'<path d="M74 12 Q92 8 98 -4 Q100 -8 108 -8 H252 Q260 -8 262 -4 Q268 8 286 12 Z" fill="{pod}"/><path d="M74 12 Q92 8 98 -4 Q100 -8 108 -8 H252 Q260 -8 262 -4 Q268 8 286 12 Z" fill="#000" opacity=".06"/>'
    if c.get("poles"): s += '<g stroke="#8f9398" stroke-width="3" stroke-linecap="round" fill="none"><path d="M78 -6 H282 M86 -6 V10 M274 -6 V10 M78 -12 H282"/></g><rect x="148" y="-36" width="18" height="26" rx="2" fill="#b5602f"/><rect x="194" y="-36" width="18" height="26" rx="2" fill="#b5602f"/>'
    s += f'<path d="M50.5 276 V40 Q50.5 8 84 7 H276 Q309.5 8 309.5 40 V276 Z" fill="{body}"/>'
    if c.get("side"): s += f'<path d="M50.5 276 V40 Q50.5 8 84 7 L66 14 Q58 20 58 42 V276 Z M309.5 288 V40 Q309.5 8 276 7 L294 14 Q302 20 302 42 V276 Z" fill="{c["side"]}"/>'
    s += c.get("backbands", "")
    s += f'<g fill="{c.get("marks", "#d4141c")}" stroke="#000" stroke-opacity=".35"><rect x="96" y="12" width="13" height="5" rx="1.5"/><rect x="115" y="12" width="13" height="5" rx="1.5"/><rect x="134" y="12" width="13" height="5" rx="1.5"/><rect x="66" y="18" width="13" height="5" rx="1.5"/><rect x="281" y="18" width="13" height="5" rx="1.5"/></g>'
    # route number top right
    s += '<rect x="196" y="20" width="76" height="32" rx="4" fill="#0c0d0e"/>' + digits(c["no"], 234 - (len(c["no"]) * 15 - 4) / 2, 26, 20, c["led"])
    if c.get("grille"):  # the trolleybus: no window, two louvred openings
        s += '<g fill="#1c1f22"><rect x="112" y="64" width="62" height="34" rx="2"/><rect x="180" y="64" width="62" height="34" rx="2"/></g><path d="M112 73 H242 M112 81 H242 M112 89 H242" stroke="#4d5257" stroke-width="2"/>'
    else:
        s += '<g stroke="#000" stroke-opacity=".4" stroke-width="2.5" stroke-linecap="round"><path d="M88 28 H180 M88 34.5 H180 M88 41 H180 M88 47.5 H180"/></g>'
        w = c.get("window", 150); x = c.get("windowX", 173) - w / 2
        if w: s += f'<rect x="{x}" y="62" width="{w}" height="72" rx="14" fill="#101113"/><rect x="{x + 7}" y="69" width="{w - 14}" height="58" rx="9" fill="{GLASS}"/><path d="M{x + 22} 69 h38 l-18 58 h-26 Z" fill="{SHINE}" opacity=".45"/>'
        else: s += '<rect x="88" y="62" width="184" height="66" rx="4" fill="none" stroke="#000" stroke-opacity=".14" stroke-width="2"/>'
    # engine door, its seam, the high brake lights
    s += f'<path d="M58 146 H302" stroke="#000" stroke-opacity=".3" stroke-width="2"/><rect x="104" y="138" width="40" height="4" rx="2" fill="#a8141a"/><rect x="216" y="138" width="40" height="4" rx="2" fill="#a8141a"/><path d="M94 152 V238 H266 V152" stroke="#000" stroke-opacity=".18" stroke-width="2" fill="none"/>'
    s += mir('<rect x="56" y="150" width="30" height="94" rx="9" fill="none" stroke="#000" stroke-opacity=".22" stroke-width="1.5"/><circle cx="71" cy="164" r="11" fill="#e08c1e"/><circle cx="71" cy="187" r="11" fill="#cf1a1f"/><circle cx="71" cy="210" r="11" fill="#cf1a1f"/><circle cx="71" cy="232" r="8" fill="#eceff0" stroke="#8f9398" stroke-width="2"/><circle cx="71" cy="164" r="11" fill="none" stroke="#2a2c2e" stroke-width="2"/><circle cx="71" cy="187" r="11" fill="none" stroke="#2a2c2e" stroke-width="2"/><circle cx="71" cy="210" r="11" fill="none" stroke="#2a2c2e" stroke-width="2"/>')
    if c.get("poles"): s += '<path d="M157 -12 V150 M203 -12 L188 24 V150" stroke="#6d7073" stroke-width="1.5" fill="none"/><rect x="153" y="148" width="8" height="12" rx="2" fill="#3a3d40"/><rect x="184" y="148" width="8" height="12" rx="2" fill="#3a3d40"/>'
    s += f'<rect x="160" y="216" width="32" height="17" rx="1.5" fill="{c.get("plate", "#f4f4f2")}" stroke="#9a9ea2" stroke-width="1"/>'
    s += '<rect x="48" y="246" width="264" height="36" rx="5" fill="#26292c"/><path d="M50 258 H310" stroke="#3c4044" stroke-width="2"/>'
    if c.get("chevrons"):
        s += '<path d="M50 248 H310 V268 H50 Z" fill="#e7b416"/><path d="' + "".join(f"M{x} 268 l14 -20 h12 l-14 20Z" for x in range(50, 290, 26)) + '" fill="#17191c"/>'
    if c.get("centre") and not c.get("poles"): s += '<g fill="#23262a"><circle cx="164" cy="160" r="6"/><circle cx="188" cy="160" r="6"/></g><circle cx="164" cy="160" r="3.5" fill="#8f9398"/><circle cx="188" cy="160" r="3.5" fill="#8f9398"/>'
    if c.get("tape"): s += '<g fill="#f4f4f2">' + "".join(f'<rect x="{x}" y="240" width="18" height="5"/>' for x in range(92, 256, 26)) + '</g>'
    s += f'<path d="M298 22 H316 Q324 22 324 34 V42" stroke="{INK}" stroke-width="5" fill="none"/><rect x="316" y="42" width="20" height="46" rx="6" fill="{INK}"/><path d="M51 100 H38" stroke="{INK}" stroke-width="4"/><rect x="26" y="84" width="18" height="46" rx="6" fill="{INK}"/>'
    s += f'<rect x="64" y="294" width="46" height="26" rx="4" fill="{TYRE}"/><rect x="250" y="294" width="46" height="26" rx="4" fill="{TYRE}"/><rect x="108" y="290" width="144" height="14" fill="#2a2c2e"/><rect x="50.5" y="282" width="259" height="12" fill="#1d1f21"/>'
    return s

AMBER, WHITE = "#ffb21e", "#eef2f4"
hood = lambda col: f'<path d="M50.5 173 Q180 190 309.5 173 V196 Q180 210 50.5 196 Z" fill="{col}"/>'
DC = dict(body="#a9adb2", roof="#a9adb2", pod="#b9bdc1", back="#d0202e", no="42", tape=True, marks="#ff5147", window=164, led="#e9e4ff", rack=("#d3d7da", "#5c6166"),
          bands=f'<path d="M60 168 H300 L282 192 Q180 204 78 192 Z" fill="#d9202a"/>')
NY = dict(body="#17307f", roof="#17307f", pod="#1c3a94", back="#f0b323", no="59", led=AMBER, window=124, windowX=180, plate="#e8ecf4",
          bands=mir('<path d="M50.5 84 V48 Q50.5 30 62 20 L66 18 Q54.500 30 54.500 50 V84 Z" fill="#f0b323"/>'))
BO = dict(body="#e6e8e8", roof="#e6e8e8", pod="#d2d5d6", no="66", led=AMBER, window=0, rack=("#9aa0a5", "#43484c"),
          bands='<path d="M50.5 226 L92 224 L132 232 Q180 238 228 232 L268 224 L309.5 226 V230 L268 227.500 L228 235.500 Q180 241.500 132 235.500 L92 227.500 L50.5 230 Z" fill="#17191c"/><path d="M50.5 182 Q180 199 309.5 182 V186.500 Q180 203.500 50.5 186.500 Z" fill="#4a90c8"/><path d="M50.5 190 Q180 207 309.5 190 V226 L268 224 L228 232 Q180 238 132 232 L92 224 L50.5 226 Z" fill="#f3ad1d"/>',
          backbands='<rect x="50.5" y="194" width="259" height="5" fill="#4a90c8"/><rect x="50.5" y="199" width="259" height="42" fill="#f3ad1d"/><rect x="50.5" y="239" width="259" height="7" fill="#17191c"/>')
SF = dict(body="#a9acae", roof="#a9acae", pod="#9da1a4", centre=True, no="29", led=AMBER, rack=("#5a5f64", "#15171a"), chevrons=True,
          bands=mir('<path d="M50.5 96 V48 Q50.5 34 55 25 V96 Z M50.5 232 H54.500 V276 H50.5 Z" fill="#d42232"/>'),
          backbands=mir('<path d="M50.5 96 V40 Q50.5 30 55 22 V96 Z M50.5 214 H54.500 V276 H50.5 Z" fill="#d42232"/>'))
XT = dict(SF, no="22", poles=True, grille=True, rack=("#d3d7da", "#5c6166"))

def bus(town, name, c, what):
    tr = 'translate(0 240)' if c.get("poles") else 'translate(0 40)'
    vb = "0 0 360 560" if c.get("poles") else "0 0 360 360"
    svg(town, f"{name}-inbound", vb, f"{what}, front view.", f'<g transform="{tr}">\n{xcel_front(c)}\n</g>')
    svg(town, f"{name}-outbound", vb, f"{what}, rear view.", f'<g transform="{tr}">\n{xcel_back(c)}\n</g>')
bus("washington", "bus", DC, "Washington DC: New Flyer Xcelsior (XD40, 2023) in the grey, red and blue of Metrobus (the band below the windscreen red, the rear red)")
bus("newyork", "bus", NY, "New York: New Flyer Xcelsior (XD40, 2018) in the current dark blue with a golden rear")
bus("boston", "bus", BO, "Boston: New Flyer Xcelsior (XDE40) in white with a yellow band under a thin blue line")
bus("sanfrancisco", "bus", SF, "San Francisco: New Flyer Xcelsior (XDE40) in silver grey with red bands of the sides")
bus("sanfrancisco", "trolejbus", XT, "San Francisco: trolleybus New Flyer Xcelsior XT40 in silver grey with red bands of the sides, its poles raised")

# ---------- Toronto: Nova Bus LFS HEV (2.59 m, 3.25 m) ----------
RED = "#d3202b"
def nova(front):
    s = f'<path d="M82 14 L96 -3 Q99 -5 104 -5 H256 Q261 -5 264 -3 L278 14 Z" fill="#b81a25"/>'
    s += f'<path d="M50.5 276 V56 Q50.5 10 104 6 Q180 1 256 6 Q309.5 10 309.5 56 V276 Z" fill="#e4e6e6"/>'
    s += f'<path d="M50.5 46 Q55 10 104 6 Q180 1 256 6 Q305 10 309.5 46 Q296 28 262 26 H98 Q64 28 50.5 46 Z" fill="{RED}"/>'
    if front:
        s += '<g fill="#f2a33a"><rect x="152" y="11" width="13" height="5" rx="1.5"/><rect x="173.5" y="11" width="13" height="5" rx="1.5"/><rect x="195" y="11" width="13" height="5" rx="1.5"/><rect x="82" y="15" width="13" height="5" rx="1.5"/><rect x="265" y="15" width="13" height="5" rx="1.5"/></g>'
        # one huge windscreen, its lower edge bowed down to the corners
        s += '<path d="M62 56 Q63 27 90 25 Q180 19 270 25 Q297 27 298 56 L307 176 Q307 190 294 194 Q250 208 206 209 H154 Q110 208 66 194 Q53 190 53 176 Z" fill="#101113"/>'
        s += '<rect x="76" y="29" width="208" height="37" rx="4" fill="#0c0d0e"/>' + digits("29", 88, 36, 20, AMBER) + words(146, 40, 124, 11, AMBER)
        s += f'<path d="M68 71 H292 L300 174 Q300 185 291 188 Q248 201 205 202 H155 Q112 201 69 188 Q60 185 60 174 Z" fill="{GLASS}"/><path d="M86 71 L130 71 L100 196 L74 189 Z" fill="{SHINE}" opacity=".5"/><path d="M252 71 L274 71 L264 120 L242 120 Z" fill="{SHINE}" opacity=".4"/>'
        s += '<g stroke="#0b0c0d" stroke-width="2.5" stroke-linecap="round"><path d="M122 203 L210 174"/><path d="M236 203 L288 150"/></g>'
        # the small vents under the glass, round lights
        s += '<path d="M150 212 H210 M154 217 H206" stroke="#c3c6c6" stroke-width="2"/>'
        s += mir('<circle cx="72" cy="233" r="12.500" fill="#8f959a"/><circle cx="72" cy="233" r="9.500" fill="#f7f4ea"/><circle cx="66" cy="208" r="8" fill="#8f959a"/><circle cx="66" cy="208" r="6" fill="#f2a33a"/>')
        s += f'<path d="M50.5 248 Q180 254 309.5 248 V270 H50.5 Z" fill="{RED}"/>'
        s += '<path d="M49 266 Q180 273 311 266 V286 Q311 295 302 295 H58 Q49 295 49 286 Z" fill="#26292c"/><path d="M49 279 Q180 286 311 279" stroke="#3c4044" stroke-width="2" fill="none"/>'
        s += '<rect x="163" y="229" width="34" height="17" rx="1.5" fill="#f4f4f2" stroke="#9a9ea2" stroke-width="1"/>' + rack("#d3d7da", "#5c6166")
        s += f'<path d="M66 40 H46 Q38 40 38 50 V58" stroke="{INK}" stroke-width="5" fill="none"/><rect x="26" y="58" width="20" height="40" rx="6" fill="{INK}"/><path d="M309 128 H322" stroke="{INK}" stroke-width="4"/><rect x="316" y="112" width="18" height="46" rx="6" fill="{INK}"/><rect x="70" y="294" width="34" height="26" rx="4" fill="{TYRE}"/><rect x="256" y="294" width="34" height="26" rx="4" fill="{TYRE}"/>'
    else:
        s += f'<path d="M50.5 276 V56 Q50.5 10 104 6 Q180 1 256 6 Q309.5 10 309.5 56 V276 H305 V92 Q305 82 295 82 H65 Q55 82 55 92 V276 Z" fill="{RED}"/>'
        s += '<g fill="#ff5a4f"><rect x="152" y="11" width="13" height="5" rx="1.5"/><rect x="173.5" y="11" width="13" height="5" rx="1.5"/><rect x="195" y="11" width="13" height="5" rx="1.5"/><rect x="82" y="16" width="13" height="5" rx="1.5"/><rect x="265" y="16" width="13" height="5" rx="1.5"/></g>'
        s += '<rect x="78" y="24" width="204" height="48" rx="4" fill="#1c1f22"/><g fill="#d3202b"><rect x="84" y="32" width="192" height="5"/><rect x="84" y="42" width="192" height="5"/><rect x="84" y="52" width="192" height="5"/><rect x="84" y="62" width="192" height="5"/></g><g fill="#8f9398"><rect x="64" y="90" width="16" height="3"/><rect x="64" y="96" width="16" height="3"/><rect x="280" y="90" width="16" height="3"/><rect x="280" y="96" width="16" height="3"/></g>'
        s += '<rect x="142" y="96" width="76" height="32" rx="5" fill="#0c0d0e"/>' + digits("29", 167, 102, 20, AMBER)
        s += '<path d="M58 150 H302" stroke="#b9bcbc" stroke-width="2"/><rect x="152" y="138" width="56" height="6" rx="3" fill="#a8141a"/><path d="M92 150 V236 H268 V150" stroke="#cfd2d1" stroke-width="2" fill="none"/>'
        s += mir('<circle cx="73" cy="116" r="11" fill="#e08c1e" stroke="#2a2c2e" stroke-width="2"/><circle cx="73" cy="144" r="11" fill="#cf1a1f" stroke="#2a2c2e" stroke-width="2"/><circle cx="73" cy="190" r="8" fill="#eceff0" stroke="#2a2c2e" stroke-width="2.5"/>')
        s += f'<path d="M50.5 212 H309.5 V246 H50.5 Z" fill="{RED}"/><rect x="160" y="220" width="34" height="17" rx="1.5" fill="#f4f4f2" stroke="#9a9ea2" stroke-width="1"/>'
        s += '<rect x="48" y="246" width="264" height="36" rx="5" fill="#26292c"/><path d="M50 258 H310" stroke="#3c4044" stroke-width="2"/>'
        s += f'<path d="M294 40 H314 Q322 40 322 50 V58" stroke="{INK}" stroke-width="5" fill="none"/><rect x="314" y="58" width="20" height="40" rx="6" fill="{INK}"/><path d="M51 128 H38" stroke="{INK}" stroke-width="4"/><rect x="26" y="112" width="18" height="46" rx="6" fill="{INK}"/>'
        s += f'<rect x="64" y="294" width="46" height="26" rx="4" fill="{TYRE}"/><rect x="250" y="294" width="46" height="26" rx="4" fill="{TYRE}"/><rect x="108" y="290" width="144" height="14" fill="#2a2c2e"/><rect x="50.5" y="282" width="259" height="12" fill="#1d1f21"/>'
    return f'<g transform="translate(0 40)">\n{s}\n</g>'
for d, f in (("inbound", True), ("outbound", False)):
    svg("toronto", f"bus-{d}", "0 0 360 360", f"Toronto: Nova Bus LFS HEV in red and white, {'front' if f else 'rear'} view.", nova(f))

# ---------- trams: 320 × 600, the rail's top at y = 600 ----------
RAILS = '<rect x="78" y="588" width="14" height="10" fill="#8f9193"/><rect x="228" y="588" width="14" height="10" fill="#8f9193"/><rect x="74" y="598" width="22" height="2" fill="#a7a9ab"/><rect x="224" y="598" width="22" height="2" fill="#a7a9ab"/>'
def panto(roof):  # a single arm seen from the front, up to the contact wire (the app draws its own over it)
    return (f'<rect x="120" y="{roof - 8}" width="80" height="7" rx="2" fill="#4a4e52"/><path d="M151 {roof - 8} L154 {(roof + 60) / 2} H166 L169 {roof - 8} Z" fill="#6b6e72"/>'
            f'<path d="M150 {(roof + 60) / 2} L118 64 M170 {(roof + 60) / 2} L202 64" stroke="#6b6e72" stroke-width="4.5" stroke-linecap="round"/><path d="M63 82 Q66 62 82 60 H238 Q254 62 257 82" stroke="#4a4e52" stroke-width="4.5" fill="none" stroke-linecap="round"/><rect x="98" y="50" width="124" height="4" fill="#4a4e52"/>')
def coupler(y, col="#8f9398"):
    return f'<g transform="translate(160 {y}) scale(1.25) translate(-160 {-y})"><rect x="132" y="{y}" width="56" height="22" rx="3" fill="#1c1e20"/><rect x="140" y="{y + 3}" width="40" height="16" rx="2" fill="{col}"/><circle cx="152" cy="{y + 11}" r="5" fill="#2a2c2e"/><rect x="163" y="{y + 6}" width="12" height="10" rx="1" fill="#3f4347"/></g>'

# Toronto: Flexity Outlook, 2.54 m wide, 3.84 m high over the roof equipment
TR = "#d81f2a"
def flexity(front):
    s = panto(216) + '<path d="M78 234 L86 222 Q88 218 94 218 H226 Q232 218 234 222 L242 234 Z" fill="#a9161f"/>'
    s += f'<path d="M33 578 V290 Q33 234 84 230 Q160 224 236 230 Q287 234 287 290 V578 Z" fill="#e8eae9"/>'
    s += f'<path d="M33 312 V290 Q33 234 84 230 Q160 224 236 230 Q287 234 287 290 V312 Q282 291 259 287 Q160 278 61 287 Q38 291 33 312 Z" fill="{TR}"/>' if front else f'<path d="M33 292 V290 Q33 234 84 230 Q160 224 236 230 Q287 234 287 290 V292 Q284 276 262 270 Q160 262 58 270 Q36 276 33 292 Z" fill="{TR}"/>'
    # the black glass face from edge to edge, its bottom straight
    s += '<path d="M36 312 Q38 288 62 285 Q160 276 258 285 Q282 288 284 312 V468 Q284 475 276 475 H44 Q36 475 36 468 Z" fill="#101113"/>'
    s += f'<path d="M41 318 H279 V463 Q160 469 41 463 Z" fill="{GLASS}"/><path d="M70 318 L118 318 L88 465 L60 463 Z" fill="{SHINE}" opacity=".5"/><path d="M234 318 L256 318 L248 376 L224 376 Z" fill="{SHINE}" opacity=".4"/>'
    s += digits("510", 100, 291, 18, "#f2a33a") + words(150, 295, 80, 9, "#f2a33a")
    if front:
        s += '<circle cx="66" cy="262" r="5" fill="#2f6fd0" stroke="#8fc0ff" stroke-width="1.5"/><circle cx="254" cy="262" r="5" fill="#2f6fd0" stroke="#8fc0ff" stroke-width="1.5"/>'
        s += '<path d="M178 466 L236 402" stroke="#0b0c0d" stroke-width="3" stroke-linecap="round"/>'
        s += f'<path d="M33 474 H287 V520 Q160 530 33 520 Z" fill="{TR}"/><path d="M33 518 Q160 528 287 518 V523 Q160 533 33 523 Z" fill="#8f1119"/>'
        s += mirt('<rect x="56" y="486" width="62" height="19" rx="9.500" fill="#4c1014"/><circle cx="68" cy="495.500" r="7.500" fill="#c6cacd"/><circle cx="68" cy="495.500" r="5.500" fill="#f7f4ea"/><circle cx="88" cy="495.500" r="7.500" fill="#c6cacd"/><circle cx="88" cy="495.500" r="5.500" fill="#f7f4ea"/><circle cx="106" cy="495.500" r="5" fill="#f2a33a"/><rect x="128" y="494" width="24" height="3" rx="1.500" fill="#f3d9d9"/>')
        s += f'<path d="M33 523 H287 V578 Q286 588 274 589 Q160 594 46 589 Q34 588 33 578 Z" fill="{TR}"/><path d="M44 523.500 Q160 533 276 523.500 Q290 524 286 540 Q284 554 266 559 Q160 578 54 559 Q36 554 34 540 Q30 524 44 523.500 Z" fill="#f4f4f1"/>'
    else:
        s += f'<rect x="33" y="474" width="254" height="40" fill="#f4f4f1"/><path d="M33 512 Q160 520 287 512 V578 Q286 588 274 589 Q160 593 46 589 Q34 588 33 578 Z" fill="{TR}"/><path d="M33 554 Q160 562 287 554" stroke="#8f1119" stroke-width="2.5" fill="none"/>'
        s += mirt('<circle cx="64" cy="494" r="9" fill="#23262a"/><circle cx="64" cy="494" r="7" fill="#ff3b2f"/><circle cx="90" cy="494" r="9" fill="#23262a"/><circle cx="90" cy="494" r="7" fill="#f2a33a"/><rect x="106" y="492" width="30" height="4" rx="2" fill="#d81f2a"/>') + '<rect x="128" y="454" width="64" height="4" rx="2" fill="#d4141c"/>'
    s += RAILS
    return s
for d, f in (("inbound", True), ("outbound", False)):
    svg("toronto", f"tram-{d}", "0 0 320 600", f"Toronto: Flexity Outlook in red, white and black, {'front' if f else 'rear'} view (single-ended).", flexity(f), 216)

# San Francisco: LRV4 (Siemens S200 SF), 2.65 m, about 3.5 m to the roof
def lrv(front):
    R = "#e03a2c"
    s = panto(250) + '<path d="M84 262 L94 252 Q96 250 100 250 H220 Q224 250 226 252 L236 262 Z" fill="#8f959a"/>'
    s += '<path d="M27.5 560 V380 L38 290 Q42 260 70 257 Q160 250 250 257 Q278 260 282 290 L292.5 380 V560 Z" fill="#d3d6d8"/>'
    s += mirt('<path d="M33 344 L48 336 L46 446 L30 436 V380 Z" fill="#3d4a55"/><path d="M27.5 486 L47 440 L76 514 H27.5 Z" fill="#e03a2c"/>')
    s += f'<path d="M50 302 Q52 268 88 265 Q160 260 232 265 Q268 268 270 302 L274 430 L262 506 Q260 516 250 516 H70 Q60 516 58 506 L46 430 Z" fill="{R}"/>'
    s += '<path d="M63 306 Q65 280 92 278 Q160 273 228 278 Q255 280 257 306 L260 430 L247 516 H73 L60 430 Z" fill="#111315"/>'
    s += words(102, 301, 116, 10, "#f2a33a") + '<rect x="80" y="297" width="4" height="18" fill="#f2a33a"/><rect x="236" y="297" width="4" height="18" fill="#f2a33a"/><path d="M68 322 H252" stroke="#5a6067" stroke-width="3"/>'
    s += f'<path d="M70 326 H250 L253 430 L246 464 Q160 471 74 464 L67 430 Z" fill="{GLASS}"/><path d="M96 326 L136 326 L108 468 L88 467 Z" fill="{SHINE}" opacity=".5"/><path d="M214 326 L232 326 L226 380 L208 380 Z" fill="{SHINE}" opacity=".4"/><path d="M196 468 L228 398" stroke="#0b0c0d" stroke-width="3" stroke-linecap="round"/>'
    light = '<rect x="80" y="480" width="50" height="19" rx="3" fill="#2a2d30"/>' + ("".join(f'<circle cx="{85 + 8 * i}" cy="{y}" r="2.9" fill="#f7f8f5"/>' for i in range(6) for y in (485.5, 493.5)) if front else "".join(f'<circle cx="{85 + 8 * i}" cy="{y}" r="2.9" fill="#ff3b2f"/>' for i in range(6) for y in (485.5, 493.5)))
    s += mirt(light)
    s += '<path d="M27.5 508 H72 L92 520 H228 L248 508 H292.5 V566 L276 580 H44 L27.5 566 Z" fill="#9a9fa3"/><path d="M76 516 H244 L266 534 V572 L258 580 H62 L54 572 V534 Z" fill="#26292c"/><path d="M62 536 L98 528 V574 H62 Z M258 536 L222 528 V574 H258 Z" fill="#3a3e42"/>' + coupler(538)
    s += '<path d="M44 576 H276 L270 588 H50 Z" fill="#26282a"/>'
    s += RAILS
    return s
for d, f in (("inbound", True), ("outbound", False)):
    svg("sanfrancisco", f"tram-{d}", "0 0 320 600", f"San Francisco: Muni Metro LRV4 (Siemens S200 SF) in silver and red, {'front' if f else 'rear'} view (double-ended).", lrv(f), 250)

# Boston: Type 9 (CAF), 104 in = 2.64 m
def type9(front):
    G, GD = "#15803c", "#0f6a30"
    s = panto(232) + '<path d="M70 250 L82 234 Q84 232 90 232 H230 Q236 232 238 234 L250 250 Z" fill="#8b9196"/>'
    s += '<path d="M28 548 V312 Q28 262 60 254 Q160 236 260 254 Q292 262 292 312 V548 Z" fill="#d6d9da"/>'
    s += mirt('<path d="M28 314 H40 V470 H28 Z" fill="#15803c"/><circle cx="68" cy="255" r="7.500" fill="#9aa0a5"/><circle cx="68" cy="255" r="5" fill="LAMP"/><circle cx="86" cy="249" r="7.500" fill="#9aa0a5"/><circle cx="86" cy="249" r="5" fill="LAMP"/>'.replace("LAMP", "#f4f3e9" if front else "#7a8085"))
    s += '<path d="M62 268 Q160 252 258 268 L262 296 Q160 286 58 296 Z" fill="#15171a"/>' + digits("E", 88, 272, 16, AMBER) + words(112, 275, 110, 9, AMBER)
    s += '<path d="M40 310 Q41 301 54 300 Q160 290 266 300 Q279 301 280 310 V530 Q160 548 40 530 Z" fill="#15171a"/>'
    s += f'<path d="M49 318 Q50 311 60 310 Q160 301 260 310 Q270 311 271 318 L268 462 Q160 470 52 462 Z" fill="{GLASS}"/><path d="M74 310 L122 306 L94 466 L66 464 Z" fill="{SHINE}" opacity=".5"/><path d="M232 308 L254 310 L246 360 L224 358 Z" fill="{SHINE}" opacity=".4"/><path d="M150 468 L196 330" stroke="#0b0c0d" stroke-width="3" stroke-linecap="round"/>'
    s += f'<path d="M94 472 Q160 477 226 472 Q212 500 200 531 Q160 536 120 531 Q108 500 94 472 Z" fill="{G}"/>'
    L = "#f7f4ea" if front else "#ff3b2f"
    l2 = "#f7f4ea" if front else "#7a1216"
    s += mirt(f'<circle cx="60" cy="486" r="9" fill="#c6cacd"/><circle cx="60" cy="486" r="6.5" fill="{l2}"/><circle cx="84" cy="486" r="9" fill="#c6cacd"/><circle cx="84" cy="486" r="6.5" fill="#f2a33a"/><circle cx="72" cy="511" r="15" fill="#c6cacd"/><circle cx="72" cy="511" r="11.5" fill="{L}"/>')
    s += mirt('<path d="M28 486 L40 508 V530 Q52 534 66 536 L60 546 L28 552 Z" fill="#eef0ef"/>')
    s += '<path d="M28 546 H292 V548 Q160 576 28 548 Z" fill="#b9bdc0"/><path d="M42 534 Q160 552 278 534 L272 562 Q160 576 48 562 Z" fill="#26292c"/><path d="M46 543 Q160 560 274 543 M47 552 Q160 568 273 552" stroke="#4a4e52" stroke-width="2" fill="none"/>' + '<path d="M46 560 H274 L266 588 H54 Z" fill="#26282a"/>' + coupler(566)
    s += RAILS
    s += mirt(f'<path d="M30 330 H18" stroke="{INK}" stroke-width="3"/><rect x="10" y="320" width="13" height="34" rx="4" fill="{INK}"/>')
    return s
for d, f in (("inbound", True), ("outbound", False)):
    svg("boston", f"tram-{d}", "0 0 320 600", f"Boston: Green Line Type 9 (CAF) in silver, black and green, {'front' if f else 'rear'} view (double-ended).", type9(f), 232)

# San Francisco: double-ended PCC of 1948 (car 1010, the yellow and blue of 1939), 9 ft = 2.74 m, 10 ft 1 in = 3.07 m
def pcc(front):
    Y, B = "#f5d313", "#1f4ba0"
    s = '<path d="M160 296 L154 62" stroke="#6b6e72" stroke-width="4.5" stroke-linecap="round"/><rect x="147" y="50" width="14" height="14" rx="4" fill="#3a3d40"/><path d="M132 295 L142 289 H178 L188 295 Z" fill="#3a3d40"/>' 
    s += f'<path d="M112 304 L120 293 H200 L208 304 Z" fill="#d9b90e"/>'
    s += f'<path d="M25 446 L34 352 Q42 304 100 300 Q160 296 220 300 Q278 304 286 352 L295 446 Z" fill="{Y}"/><path d="M270 320 Q281 334 286 352 L295 440 H284 L278 360 Q276 336 270 320 Z" fill="#d9b90e"/>'
    s += f'<path d="M25 440 Q160 462 295 440 L297 470 V556 Q296 572 280 573 H40 Q24 572 23 556 V470 Z" fill="{B}"/><path d="M284 438 H295 L297 470 V556 Q296 572 284 573 Z" fill="#183c84"/>'
    s += '<path d="M25 436 Q160 458 295.500 436 V440 Q160 462 24.500 440 Z" fill="#17191c"/>'
    s += '<rect x="82" y="314" width="156" height="28" rx="8" fill="#17191c"/>' + digits("F", 96, 319, 18, "#f4f4f0") + words(122, 324, 98, 9, "#f4f4f0")
    s += mirt(f'<path d="M156 350 V430 Q110 432 60 424 Q46 420 47 406 L53 376 Q57 356 84 352 Q120 348 156 350 Z" fill="#17191c"/><path d="M151.500 355 V425 Q110 427 63 419 Q52 416 53 405 L58 378 Q61 361 86 357 Q120 353 151.500 355 Z" fill="{GLASS}"/><path d="M38 384 L45 362 L43 420 H33 Z" fill="{GLASS}"/>')
    s += f'<path d="M84 358 L114 355 L94 422 L72 420 Z" fill="{SHINE}" opacity=".5"/><path d="M226 356 L246 359 L238 392 L216 392 Z" fill="{SHINE}" opacity=".4"/><path d="M118 424 L92 376 M202 424 L228 376" stroke="#0b0c0d" stroke-width="2.5" stroke-linecap="round"/>'
    s += mirt('<circle cx="66" cy="326" r="6" fill="#17191c"/><circle cx="66" cy="326" r="4" fill="#f2a33a"/>')
    s += '<circle cx="160" cy="451" r="9" fill="#17191c"/><circle cx="160" cy="451" r="5" fill="#33373b"/>'
    s += f'<circle cx="160" cy="486" r="17" fill="#c6cacd"/><circle cx="160" cy="486" r="13" fill="{"#f7f4ea" if front else "#aeb4b8"}"/>'
    s += mirt(f'<circle cx="66" cy="482" r="11" fill="#c6cacd"/><circle cx="66" cy="482" r="8" fill="{"#8f1a1c" if front else "#ff3b2f"}"/>')
    s += '<rect x="21" y="524" width="278" height="27" rx="10" fill="#c9cdd0"/><path d="M23 533 H297 M23 542 H297" stroke="#85898d" stroke-width="2"/>'
    s += '<path d="M152 535 H168 V543 L163 549 V556 H156 V549 L152 544 Z" fill="#b8962a"/><path d="M42 570 H278 L270 586 H50 Z" fill="#26282a"/><rect x="56" y="576" width="208" height="5" rx="2" fill="#5a5e62"/><rect x="56" y="584" width="208" height="7" rx="3" fill="#3a3d40"/>' + RAILS
    return s
for d, f in (("inbound", True), ("outbound", False)):
    svg("sanfrancisco", f"pcc-{d}", "0 0 320 600", f"San Francisco: double-ended PCC streetcar of 1948 of the F line in yellow and blue, {'front' if f else 'rear'} view; a trolley pole.", pcc(f), 293)
