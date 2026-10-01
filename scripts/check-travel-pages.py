import re
import sys
from html.parser import HTMLParser
from pathlib import Path


ROOT = Path(__file__).resolve().parents[1]
HTML_FILES = [
    "portal.html",
    "travel.html",
    "france.html",
    "france-itinerary-2026.html",
]
RETIRED_PAGES = (
    "france-visa-2026.html",
    "france-planning-2026.html",
    "france-schengen-2026.html",
    "france-trip-2026.html",
)
TRAVEL_THEME_FILES = HTML_FILES[1:]
PRIVACY_FILES = HTML_FILES + [
    "docs/france-2026-transport-research.md",
    "docs/france-trip-2026-research.md",
    "docs/loire-provence-riviera-research-oct-2026.md",
    "docs/paris-2026-family-trip-research.md",
]
FORBIDDEN = [
    r"你\s*\+\s*太太",
    r"两位老人",
    r"一年级",
    r"(?<!\d)5\s*人",
    r"五人",
    r"(?<![\d–—-])70\s*岁",
    r"(?<![\d–—-])7\s*岁",
    r"父亲：",
    r"母亲",
    r"父母：",
    r"4\s*[×x]\s*[^=\n]+\+\s*",
    r"4\s*位成人",
    r"^(?:\*\*)?(?:出行人|Party)\s*:",
    r"\b(?:family|party|group) of five\b",
    r"\bfive (?:people|passengers|seats|suitcases|air tickets)\b",
    r"\b(?:two|2) (?:70-year-olds|septuagenarians)\b",
    r"\bfirst-grader\b",
    r"\b7-year-old\b",
    r"\b(?:cost|total|budget|arithmetic) for (?:this|the) (?:family|party|group)\b",
    r"(?:本家庭|这个家庭).*?(?:费用|合计|总价|成本)",
    r"\b13-day first trip\b",
    r"\b(?:a|the)\s+(?:previous|prior|earlier)\s+Italy trip\b",
]
FRANCE_CONTENT_TARGETS = ["/france-itinerary-2026.html"]
REQUIRED_MAP_QUERIES = {
    "Van Gogh Museum, Amsterdam",
    "Cours Saleya, Nice",
    "43.545771,7.137223",
    "Musée du Louvre, Paris",
    "Palais Garnier, Paris",
    "Eiffel Tower, Paris",
    "Arc de Triomphe, Paris",
    "Budapest Ferenc Liszt International Airport",
}
class Element:
    def __init__(self, tag, attrs, parent=None):
        self.tag = tag
        self.attrs = dict(attrs)
        self.parent = parent
        self.children = []
        self.data = []

    def has_class(self, name):
        return name in self.attrs.get("class", "").split()

    def descendants(self):
        for child in self.children:
            yield child
            yield from child.descendants()

    def text(self):
        return "".join(self.data).strip()


class Document(HTMLParser):
    VOID = {
        "meta",
        "link",
        "br",
        "img",
        "input",
        "hr",
        "source",
        "area",
        "base",
        "embed",
        "param",
        "track",
        "wbr",
    }

    def __init__(self):
        super().__init__()
        self.stack = []
        self.errors = []
        self.elements = []

    def handle_starttag(self, tag, attrs):
        parent = self.stack[-1] if self.stack else None
        element = Element(tag, attrs, parent)
        if parent:
            parent.children.append(element)
        self.elements.append(element)
        if tag not in self.VOID:
            self.stack.append(element)

    def handle_startendtag(self, tag, attrs):
        self.handle_starttag(tag, attrs)
        if tag not in self.VOID:
            self.stack.pop()

    def handle_data(self, data):
        for element in self.stack:
            element.data.append(data)

    def handle_endtag(self, tag):
        if not self.stack or self.stack[-1].tag != tag:
            context = [element.tag for element in self.stack[-3:]]
            self.errors.append(f"unexpected </{tag}> after {context}")
        else:
            self.stack.pop()

    def with_class(self, name, tag=None):
        return [
            element
            for element in self.elements
            if element.has_class(name) and (tag is None or element.tag == tag)
        ]

    def find(self, tag=None, **attrs):
        return [
            element
            for element in self.elements
            if (tag is None or element.tag == tag)
            and all(element.attrs.get(key) == value for key, value in attrs.items())
        ]




errors = []
documents = {}
texts = {}
for filename in HTML_FILES:
    path = ROOT / filename
    if not path.exists():
        errors.append(f"missing HTML file {filename}")
        continue
    text = path.read_text(encoding="utf-8")
    parser = Document()
    parser.feed(text)
    if parser.stack or parser.errors:
        open_tags = [element.tag for element in parser.stack]
        errors.append(f"{filename}: HTML balance {open_tags} {parser.errors}")
    documents[filename] = parser
    texts[filename] = text

france = documents.get("france.html")
if france:
    content_cards = france.with_class("content-card", "a")
    targets = [card.attrs.get("href") for card in content_cards]
    if targets != FRANCE_CONTENT_TARGETS:
        errors.append(
            "france.html: expected only the itinerary content card "
            f"{FRANCE_CONTENT_TARGETS}, found {targets}"
        )

itinerary = documents.get("france-itinerary-2026.html")
day_count = 0
map_count = 0
if itinerary:
    tables = itinerary.with_class("itinerary-table", "table")
    if len(tables) != 1:
        errors.append(
            "france-itinerary-2026.html: expected exactly one itinerary-table, "
            f"found {len(tables)}"
        )
    else:
        headers = [
            child.text() for child in tables[0].descendants()
            if child.tag == "th"
        ]
        expected_headers = ["日期 / 地点", "行程", "交通", "餐饮", "预约"]
        if headers != expected_headers:
            errors.append(
                "france-itinerary-2026.html: functional headers mismatch; "
                f"expected {expected_headers}, found {headers}"
            )
    rows = itinerary.with_class("schedule-row", "tr")
    if len(rows) != 10:
        errors.append(
            "france-itinerary-2026.html: expected 10 schedule-row elements, "
            f"found {len(rows)}"
        )
    expected_dates = {
        "9.29", "9.30", "10.1", "10.2", "10.3",
        "10.4", "10.5", "10.6", "10.7", "10.8",
    }
    dates = {row.attrs.get("data-date", "") for row in rows}
    day_count = len(dates)
    if dates != expected_dates:
        errors.append(
            "france-itinerary-2026.html: schedule dates mismatch; "
            f"missing {sorted(expected_dates - dates)}, "
            f"unexpected {sorted(dates - expected_dates)}"
        )
    for index, row in enumerate(rows, start=1):
        cells = [child for child in row.children if child.tag == "td"]
        if len(cells) != 5:
            errors.append(
                "france-itinerary-2026.html: "
                f"schedule row {index} needs five cells, found {len(cells)}"
            )
        if not all(cell.attrs.get("data-label", "").strip() for cell in cells):
            errors.append(
                "france-itinerary-2026.html: "
                f"schedule row {index} cells need mobile data-label attributes"
            )
    expected_location_labels = {
        "9.29": "上海 → 广州",
        "9.30": "广州 → 阿姆斯特丹",
        "10.1": "阿姆斯特丹 → 尼斯 → Juan-les-Pins",
        "10.3": "Juan-les-Pins → 尼斯 → 巴黎",
        "10.7": "巴黎 → 布达佩斯",
        "10.8": "布达佩斯 → 广州",
    }
    for row in rows:
        date = row.attrs.get("data-date")
        expected = expected_location_labels.get(date)
        cells = [child for child in row.children if child.tag == "td"]
        if expected and (not cells or expected not in cells[0].text()):
            errors.append(
                "france-itinerary-2026.html: "
                f"{date} location cell must show {expected}"
            )
    scenario_rows = itinerary.with_class("scenario-row", "tr")
    if scenario_rows:
        errors.append(
            "france-itinerary-2026.html: final route must not contain "
            f"scenario rows, found {len(scenario_rows)}"
        )
    restaurant_links = itinerary.with_class("restaurant-link", "a")
    if len(restaurant_links) < 6:
        errors.append(
            "france-itinerary-2026.html: expected at least six restaurant links, "
            f"found {len(restaurant_links)}"
        )
    base_links = itinerary.with_class("base-link", "a")
    expected_base_queries = {
        "9.30": "52.365771,4.897448",
        "10.1": "43.569824,7.111292",
        "10.2": "43.569824,7.111292",
        "10.3": "48.874142,2.315952",
        "10.4": "48.874142,2.315952",
        "10.5": "48.874142,2.315952",
        "10.6": "48.874142,2.315952",
        "10.7": "47.498418,19.056624",
    }
    found_base_queries = {}
    for row in rows:
        links = [
            child for child in row.descendants()
            if child.tag == "a" and child.has_class("base-link")
        ]
        if links:
            found_base_queries[row.attrs.get("data-date")] = links[0].attrs.get(
                "data-q"
            )
        for link in links:
            linked_times = [
                child for child in link.descendants() if child.tag == "time"
            ]
            if (
                link.parent is not row.children[0]
                or len(linked_times) != 1
                or not linked_times[0].text().startswith(
                    row.attrs.get("data-date", "")
                )
                or not link.has_class("map-link")
                or not re.fullmatch(
                    r"-?\d{1,3}\.\d+,-?\d{1,3}\.\d+",
                    link.attrs.get("data-q", ""),
                )
            ):
                errors.append(
                    "france-itinerary-2026.html: linked dates must stay in the "
                    "date cell and use a coordinate query"
                )
    if (
        len(base_links) != len(expected_base_queries)
        or found_base_queries != expected_base_queries
    ):
        errors.append(
            "france-itinerary-2026.html: expected date map links "
            f"{expected_base_queries}, found {found_base_queries}"
        )
    if "返回点" in texts["france-itinerary-2026.html"]:
        errors.append(
            "france-itinerary-2026.html: date links must not show a return-point label"
        )
    mobile_day_navs = itinerary.with_class("mobile-day-nav", "nav")
    mobile_day_links = (
        [
            child for child in mobile_day_navs[0].descendants()
            if child.tag == "a"
        ]
        if len(mobile_day_navs) == 1
        else []
    )
    expected_day_hrefs = {
        "#day-0929", "#day-0930", "#day-1001", "#day-1002", "#day-1003",
        "#day-1004", "#day-1005", "#day-1006", "#day-1007", "#day-1008",
    }
    if (
        len(mobile_day_navs) != 1
        or {link.attrs.get("href") for link in mobile_day_links}
        != expected_day_hrefs
    ):
        errors.append(
            "france-itinerary-2026.html: mobile day navigation must link "
            "all ten dated rows"
        )

    map_links = itinerary.with_class("map-link")
    map_count = len(map_links)
    if map_count < 30:
        errors.append(
            f"france-itinerary-2026.html: expected at least 30 map links, found {map_count}"
        )
    for index, link in enumerate(map_links, start=1):
        if link.tag != "a" or not link.attrs.get("data-q", "").strip():
            errors.append(
                "france-itinerary-2026.html: "
                f"map link {index} must be an anchor with nonempty data-q"
            )
    map_queries = {link.attrs.get("data-q", "").strip() for link in map_links}
    if not REQUIRED_MAP_QUERIES.issubset(map_queries):
        errors.append(
            "france-itinerary-2026.html: missing reviewed map destinations "
            f"{sorted(REQUIRED_MAP_QUERIES - map_queries)}"
        )
    itinerary_text = texts["france-itinerary-2026.html"]
    compact_heads = itinerary.with_class("compact-page-head", "header")
    if len(compact_heads) != 1:
        errors.append(
            "france-itinerary-2026.html: expected one compact-page-head"
        )
    for redundant_class in (
        "itinerary-hero",
        "route-line",
        "transport-board",
        "booking-spotlight",
        "decision-note",
    ):
        if itinerary.with_class(redundant_class):
            errors.append(
                "france-itinerary-2026.html: redundant module remains "
                f"{redundant_class}"
            )
    for route_text in ("阿姆斯特丹", "尼斯", "巴黎", "布达佩斯"):
        if route_text not in itinerary_text:
            errors.append(
                f"france-itinerary-2026.html: missing route city {route_text}"
            )
    for final_transport_text in ("10.7 16:40", "FR4230", "18:50"):
        if final_transport_text not in itinerary_text:
            errors.append(
                "france-itinerary-2026.html: missing confirmed transport "
                f"{final_transport_text}"
            )
    rows_by_date = {row.attrs.get("data-date"): row for row in rows}
    expected_flight_times = {
        "CZ3504": (
            "起飞 上海虹桥 T2｜本地 9.29 19:50｜北京 9.29 19:50",
            "落地 广州白云 T2｜本地 9.29 22:30｜北京 9.29 22:30",
        ),
        "CZ307": (
            "起飞 广州白云 T2｜本地 9.30 00:30｜北京 9.30 00:30",
            "落地 阿姆斯特丹｜本地 9.30 06:35｜北京 9.30 12:35",
        ),
        "CZ650": (
            "起飞 布达佩斯｜本地 10.8 12:45｜北京 10.8 18:45",
            "落地 广州｜本地 10.9 05:30｜北京 10.9 05:30",
        ),
        "CZ3550": (
            "起飞 广州白云 T2｜本地 10.9 10:30｜北京 10.9 10:30",
            "落地 上海浦东 T2｜本地 10.9 12:55｜北京 10.9 12:55",
        ),
    }
    flight_time_blocks = itinerary.with_class("flight-time-block")
    found_flights = {
        block.attrs.get("data-flight"): block for block in flight_time_blocks
    }
    if set(found_flights) != set(expected_flight_times):
        errors.append(
            "france-itinerary-2026.html: international flight time blocks "
            f"mismatch; found {sorted(found_flights)}"
        )
    for flight, expected_lines in expected_flight_times.items():
        block = found_flights.get(flight)
        if not block or not all(line in block.text() for line in expected_lines):
            errors.append(
                "france-itinerary-2026.html: "
                f"{flight} must show local and Beijing takeoff/landing times"
            )
    day_four = rows_by_date.get("10.4")
    day_five = rows_by_date.get("10.5")
    day_six = rows_by_date.get("10.6")
    day_seven = rows_by_date.get("10.7")
    day_one = rows_by_date.get("10.1")
    day_two = rows_by_date.get("10.2")
    day_three = rows_by_date.get("10.3")
    amsterdam_day = rows_by_date.get("9.30")
    if not amsterdam_day or not all(
        text in amsterdam_day.text()
        for text in ("梵高博物馆", "09:00", "De Wallen", "20:00", "禁止拍摄")
    ):
        errors.append(
            "france-itinerary-2026.html: 9.30 must contain the respectful "
            "09:00 Van Gogh visit and De Wallen evening walk"
        )
    if not day_one or not all(
        text in day_one.text()
        for text in ("Juan-les-Pins", "Tire-Poil", "Garoupe", "昂蒂布老城", "19:13")
    ):
        errors.append(
            "france-itinerary-2026.html: 10.1 must add the Cap d'Antibes "
            "Tire-Poil walk and Antibes old-town dinner before Juan-les-Pins"
        )
    def flow_text(row):
        cells = [child for child in row.children if child.tag == "td"] if row else []
        return cells[1].text() if len(cells) > 1 else ""

    def in_order(text, *parts):
        positions = [text.find(part) for part in parts]
        return all(pos >= 0 for pos in positions) and positions == sorted(positions)

    day_one_flow = flow_text(day_one)
    day_two_flow = flow_text(day_two)
    day_three_flow = flow_text(day_three)
    if not all(
        text in day_two.text() if day_two else False
        for text in (
            "自由城", "ZOU! 600", "Cocteau", "Le Plongeoir", "埃兹",
            "Bavastro", "异域花园", "83路", "Juan-les-Pins", "日落",
        )
    ) or any(
        text in day_two_flow
        for text in (
            "Café de Turin", "Caprioglio", "萨莱亚", "尼斯老城",
            "城堡山", "Château de Bellet",
        )
    ):
        errors.append(
            "france-itinerary-2026.html: 10.2 must be the Villefranche, "
            "Le Plongeoir and Èze coast day, leaving Old Nice for 10.3"
        )
    if not in_order(day_two_flow, "自由城", "Le Plongeoir", "埃兹"):
        errors.append(
            "france-itinerary-2026.html: 10.2 must run Villefranche, "
            "Le Plongeoir lunch, then Èze"
        )
    if not day_three or not all(
        text in day_three.text()
        for text in (
            "Bagmobile", "萨莱亚市场", "当场吃", "Café de Turin", "6只生蚝",
            "无需线上预约", "Caprioglio", "Bellet", "14:27", "14:57",
        )
    ) or any(text in day_three_flow for text in ("昂蒂布", "毕加索博物馆")):
        errors.append(
            "france-itinerary-2026.html: 10.3 must be an Old Nice morning "
            "with luggage at Nice-Ville, market brunch, oysters and wine"
        )
    if not in_order(day_three_flow, "萨莱亚市场", "城堡山", "Café de Turin", "Caprioglio"):
        errors.append(
            "france-itinerary-2026.html: 10.3 must run market brunch, "
            "Castle Hill, oysters, then wine last"
        )
    oyster_links = [
        child for child in (day_three.descendants() if day_three else [])
        if child.tag == "a" and child.attrs.get("href") == "https://www.cafedeturin.fr/"
    ]
    if len(oyster_links) != 1:
        errors.append(
            "france-itinerary-2026.html: 10.3 must link the official Café de Turin site"
        )
    if "昂蒂布" in day_two_flow or "昂蒂布" in day_three_flow or "昂蒂布老城" not in day_one_flow:
        errors.append(
            "france-itinerary-2026.html: Antibes should be visited only on 10.1"
        )
    if not day_four or not all(
        text in day_four.text()
        for text in ("卢浮宫", "杜乐丽", "香榭丽舍", "凯旋门")
    ):
        errors.append(
            "france-itinerary-2026.html: 10.4 must contain the Louvre "
            "to Arc de Triomphe axis"
        )
    if (
        not day_five
        or not all(
            text in day_five.text()
            for text in (
                "10:40",
                "11:00",
                "12:30",
                "巴黎歌剧院",
                "13:00",
                "Bouillon Pigalle",
                "14:15",
                "17:00",
                "蒙马特",
                "塞纳河游船",
                "18:30",
                "21:45",
                "疯马秀",
                "22:30",
            )
        )
        or day_five.text().index("巴黎歌剧院")
        > day_five.text().index("蒙马特")
    ):
        errors.append(
            "france-itinerary-2026.html: 10.5 must schedule the 11:00 Paris "
            "Opera before lunch and the afternoon Montmartre visit"
        )
    if (
        not day_six
        or not all(
            text in day_six.text()
            for text in (
                "巴黎圣母院",
                "圣礼拜堂",
                "Alliance",
                "12:00",
                "奥赛博物馆",
                "15:00",
                "17:15",
                "皇家宫殿",
                "布伦柱",
                "18:05",
                "薇薇安拱廊",
                "18:50",
                "全景廊街",
                "巴黎证券交易所",
                "19:30",
                "Daroco Bourse",
                "21:00",
                "Danico",
            )
        )
        or any(
            text in day_six.text()
            for text in ("塞纳河游船", "疯马秀", "橘园美术馆", "罗丹博物馆")
        )
    ):
        errors.append(
            "france-itinerary-2026.html: 10.6 must contain the Cité, "
            "Orsay, and relaxed Danico evening without the cruise or show"
        )
    if day_six:
        notre_dame_links = [
            child for child in day_six.descendants()
            if child.tag == "a"
            and child.attrs.get("href")
            == (
                "https://resa.notredamedeparis.fr/en/"
                "reservationindividuelle/tickets"
            )
        ]
        if (
            len(notre_dame_links) != 1
            or "免费预约" not in notre_dame_links[0].text()
            or "提前0–2天" not in day_six.text()
        ):
            errors.append(
                "france-itinerary-2026.html: 10.6 must link the official "
                "free Notre-Dame reservation with its late release window"
            )
    expected_bars = {
        "10.4": ("Bar Nouveau", "Little Red Door"),
        "10.5": ("疯马秀",),
        "10.6": ("Danico", "The Cambridge Public House"),
    }
    for date, bars in expected_bars.items():
        row = rows_by_date.get(date)
        if not row or not all(bar in row.text() for bar in bars):
            errors.append(
                "france-itinerary-2026.html: "
                f"{date} missing bar plan {bars}"
            )
    if (
        not day_seven
        or any(text in day_seven.text() for text in ("圣礼拜堂", "巴黎圣母院"))
        or not all(
            text in day_seven.text()
            for text in (
                "11:30",
                "退房",
                "取行李",
                "Porte Maillot",
                "12:30",
                "13:10",
                "A01",
                "1小时15分",
                "提前网购",
                "按票面时间为准",
            )
        )
    ):
        errors.append(
            "france-itinerary-2026.html: 10.7 must be a checkout "
            "and detailed Porte Maillot A01 transfer without timed attractions"
        )
    if day_seven:
        airport_bus_links = [
            child for child in day_seven.descendants()
            if child.tag == "a"
            and child.attrs.get("href")
            == (
                "https://www.aeroportparisbeauvais.com/en/access-parking/"
                "paris-airport-shuttle"
            )
        ]
        if len(airport_bus_links) != 1:
            errors.append(
                "france-itinerary-2026.html: 10.7 needs one official "
                "Beauvais A01 booking link"
            )
    if "Rijksmuseum" in itinerary_text or "国立博物馆" in itinerary_text:
        errors.append(
            "france-itinerary-2026.html: Rijksmuseum should be replaced "
            "by the Van Gogh Museum"
        )
    if (
        "https://www.google.com/maps/search/?api=1&query=" not in itinerary_text
        or "encodeURIComponent(link.dataset.q)" not in itinerary_text
    ):
        errors.append(
            "france-itinerary-2026.html: missing Google Maps URL generation code"
        )

for filename in (
    "france.html",
    "france-itinerary-2026.html",
):
    if filename not in texts:
        continue
    for stale in ("方案 A", "方案 B", "双方案", "改签后确认"):
        if stale in texts[filename]:
            errors.append(f"{filename}: stale route state {stale}")

for filename in (
    "travel.html",
    "france.html",
    "france-itinerary-2026.html",
):
    if filename in texts and "欧洲十日行" in texts[filename]:
        errors.append(f"{filename}: oversized/public trip-duration title remains")

for filename in RETIRED_PAGES:
    if (ROOT / filename).exists():
        errors.append(f"{filename}: retired page must be removed")
for path in sorted(ROOT.glob("*.html")) + sorted((ROOT / "js").glob("*.js")):
    text = path.read_text(encoding="utf-8")
    for filename in RETIRED_PAGES:
        if filename.removesuffix(".html") in text:
            errors.append(f"{path.relative_to(ROOT)}: still references {filename}")
for removed_nav in ("topbar-secondary", "page-nav", "mobile-bottom-nav"):
    if removed_nav in texts.get("france-itinerary-2026.html", ""):
        errors.append(
            "france-itinerary-2026.html: navigation to retired pages "
            f"remains ({removed_nav})"
        )

travel = documents.get("travel.html")
if travel:
    tags = travel.with_class("continent-tag", "button")
    pressed = [tag for tag in tags if tag.attrs.get("aria-pressed") == "true"]
    if (
        not tags
        or any(tag.attrs.get("aria-pressed") not in {"true", "false"} for tag in tags)
        or len(pressed) != 1
        or pressed[0].attrs.get("data-filter") != "all"
    ):
        errors.append(
            "travel.html: continent filters must initialize only All with aria-pressed=true"
        )
    travel_text = texts["travel.html"]
    if (
        "document.querySelectorAll('.continent-tag')" not in travel_text
        or "setAttribute('aria-pressed'" not in travel_text
    ):
        errors.append(
            "travel.html: missing continent filter script or aria-pressed updates"
        )

for filename in TRAVEL_THEME_FILES:
    document = documents.get(filename)
    if not document:
        continue
    theme_scripts = [
        script
        for script in document.find("script")
        if script.attrs.get("src") == "/js/travel-theme.js"
    ]
    toggles = document.find("button", id="themeToggle")
    if len(theme_scripts) != 1 or len(toggles) != 1:
        errors.append(
            f"{filename}: expected one travel theme script and one theme toggle"
        )

theme_script_path = ROOT / "js/travel-theme.js"
if not theme_script_path.exists():
    errors.append("missing js/travel-theme.js")
else:
    theme_script = theme_script_path.read_text(encoding="utf-8")
    if (
        "localStorage.getItem('theme')" not in theme_script
        or "prefers-color-scheme: dark" not in theme_script
        or "localStorage.setItem('theme'" not in theme_script
    ):
        errors.append(
            "js/travel-theme.js: must honor saved theme and system preference"
        )

for filename in PRIVACY_FILES:
    path = ROOT / filename
    if not path.exists():
        errors.append(f"missing privacy file {filename}")
        continue
    text = path.read_text(encoding="utf-8")
    for pattern in FORBIDDEN:
        if re.search(pattern, text, flags=re.IGNORECASE | re.MULTILINE):
            errors.append(f"{filename}: privacy pattern {pattern}")

if errors:
    print("\n".join(errors))
    sys.exit(1)
print(
    "travel page structure: OK "
    f"(1 France card, {day_count} days, {map_count} map links, "
    f"{len(HTML_FILES)} balanced HTML pages, "
    f"{len(RETIRED_PAGES)} retired pages removed)"
)
