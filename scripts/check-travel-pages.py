import re
import sys
from html.parser import HTMLParser
from pathlib import Path


ROOT = Path(__file__).resolve().parents[1]
HTML_FILES = [
    "portal.html",
    "travel.html",
    "france.html",
    "france-visa-2026.html",
    "france-planning-2026.html",
    "france-itinerary-2026.html",
    "france-schengen-2026.html",
    "france-trip-2026.html",
]
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
FRANCE_CONTENT_TARGETS = {
    "/france-visa-2026.html",
    "/france-planning-2026.html",
    "/france-itinerary-2026.html",
}
REQUIRED_MAP_QUERIES = {
    "Van Gogh Museum, Amsterdam",
    "Cours Saleya, Nice",
    "Marché Provençal, Antibes",
    "Musée du Louvre, Paris",
    "Palais Garnier, Paris",
    "Eiffel Tower, Paris",
    "Arc de Triomphe, Paris",
    "Budapest Ferenc Liszt International Airport",
}
EXPECTED_BOOKING_IDS = {
    "book-ams-stay",
    "book-nice-stay",
    "book-paris-stay",
    "book-budapest-stay",
    "book-ams-nce",
    "book-nice-paris",
    "book-vangogh",
    "book-bellet",
    "book-plongeoir",
    "book-orsay",
    "book-louvre",
    "book-garnier",
    "book-arc",
    "book-sainte-chapelle",
    "book-seine-cruise",
    "book-alliance",
    "book-crazy-horse",
}
PHRASING_TAGS = {
    "a",
    "abbr",
    "audio",
    "b",
    "bdi",
    "bdo",
    "br",
    "button",
    "canvas",
    "cite",
    "code",
    "data",
    "datalist",
    "del",
    "dfn",
    "em",
    "embed",
    "i",
    "iframe",
    "img",
    "input",
    "ins",
    "kbd",
    "label",
    "map",
    "mark",
    "math",
    "meter",
    "noscript",
    "object",
    "output",
    "picture",
    "progress",
    "q",
    "ruby",
    "s",
    "samp",
    "script",
    "select",
    "slot",
    "small",
    "span",
    "strong",
    "sub",
    "sup",
    "svg",
    "template",
    "textarea",
    "time",
    "u",
    "var",
    "video",
    "wbr",
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


def contains_class(element, name):
    return any(descendant.has_class(name) for descendant in element.descendants())


def has_ancestor(element, ancestor):
    current = element.parent
    while current:
        if current is ancestor:
            return True
        current = current.parent
    return False


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
    if len(content_cards) != 3 or set(targets) != FRANCE_CONTENT_TARGETS:
        errors.append(
            "france.html: expected exactly three content-card links to "
            f"{sorted(FRANCE_CONTENT_TARGETS)}, found {targets}"
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
        "10.3": "Juan-les-Pins → 昂蒂布 → 尼斯 → 巴黎",
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
    day_four = rows_by_date.get("10.4")
    day_five = rows_by_date.get("10.5")
    day_six = rows_by_date.get("10.6")
    day_seven = rows_by_date.get("10.7")
    day_one = rows_by_date.get("10.1")
    day_two = rows_by_date.get("10.2")
    day_three = rows_by_date.get("10.3")
    if not day_one or "Juan-les-Pins" not in day_one.text():
        errors.append(
            "france-itinerary-2026.html: 10.1 must end at Juan-les-Pins"
        )
    if not day_two or not all(
        text in day_two.text()
        for text in ("Juan-les-Pins", "尼斯", "Le Plongeoir", "15:30", "Bellet")
    ):
        errors.append(
            "france-itinerary-2026.html: 10.2 must be the Nice day trip "
            "from Juan-les-Pins"
        )
    if (
        not day_three
        or not all(
            text in day_three.text()
            for text in ("Juan-les-Pins", "昂蒂布普罗旺斯市场", "老城", "14:57")
        )
        or "毕加索博物馆" in day_three.text()
    ):
        errors.append(
            "france-itinerary-2026.html: 10.3 must use the short Antibes "
            "market/old-town stop without the Picasso museum"
        )
    if not day_four or not all(
        text in day_four.text()
        for text in ("卢浮宫", "杜乐丽", "香榭丽舍", "凯旋门")
    ):
        errors.append(
            "france-itinerary-2026.html: 10.4 must contain the Louvre "
            "to Arc de Triomphe axis"
        )
    if not day_five or not all(
        text in day_five.text()
        for text in ("蒙马特", "巴黎歌剧院", "疯马秀", "20:00")
    ):
        errors.append(
            "france-itinerary-2026.html: 10.5 must contain Montmartre "
            "and the Paris Opera"
        )
    if not day_six or not all(
        text in day_six.text()
        for text in (
            "巴黎圣母院",
            "圣礼拜堂",
            "Alliance",
            "12:00",
            "奥赛博物馆",
            "15:00",
            "塞纳河游船",
            "18:00",
        )
    ):
        errors.append(
            "france-itinerary-2026.html: 10.6 must contain the Cité, "
            "Orsay, and Seine cruise"
        )
    expected_bars = {
        "10.4": ("Bar Nouveau", "Little Red Door"),
        "10.5": ("疯马秀", "Danico"),
        "10.6": ("The Cambridge Public House",),
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
        or not all(text in day_seven.text() for text in ("11:30", "退房", "取行李"))
    ):
        errors.append(
            "france-itinerary-2026.html: 10.7 must be a checkout "
            "and Beauvais transfer morning without timed attractions"
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

schengen = documents.get("france-schengen-2026.html")
if schengen:
    target = "/france-visa-2026.html"
    links = {element.attrs.get("href") for element in schengen.find("a")}
    canonicals = {
        element.attrs.get("href")
        for element in schengen.find("link", rel="canonical")
    }
    refreshes = [
        element.attrs.get("content", "") for element in schengen.find("meta")
        if element.attrs.get("http-equiv", "").lower() == "refresh"
    ]
    if (
        target not in links
        or target not in canonicals
        or not any(target in refresh for refresh in refreshes)
    ):
        errors.append(
            "france-schengen-2026.html: compatibility gateway must link, "
            "canonicalize, and refresh to /france-visa-2026.html"
        )

trip_gateway = documents.get("france-trip-2026.html")
if trip_gateway:
    links = {element.attrs.get("href") for element in trip_gateway.find("a")}
    expected = {"/france-planning-2026.html", "/france-itinerary-2026.html"}
    if not expected.issubset(links):
        errors.append(
            f"france-trip-2026.html: missing compatibility targets {sorted(expected - links)}"
        )

planning = documents.get("france-planning-2026.html")
booking_count = 0
if planning:
    booking_items = planning.with_class("booking-item", "li")
    booking_count = len(booking_items)
    booking_ids = set()
    if not booking_items:
        errors.append("france-planning-2026.html: no booking items found")
    for index, item in enumerate(booking_items, start=1):
        descendants = list(item.descendants())
        checkboxes = [
            node
            for node in descendants
            if node.tag == "input"
            and node.attrs.get("type", "").lower() == "checkbox"
            and node.attrs.get("id")
        ]
        booking_ids.update(node.attrs["id"] for node in checkboxes)
        labels = [node for node in descendants if node.tag == "label"]
        contents = [
            node for node in descendants if node.has_class("booking-content")
        ]
        if len(checkboxes) != 1:
            errors.append(
                f"france-planning-2026.html: booking item {index} needs one checkbox with id"
            )
        if len(labels) != 1:
            errors.append(
                f"france-planning-2026.html: booking item {index} needs one label"
            )
        elif checkboxes and labels[0].attrs.get("for") != checkboxes[0].attrs["id"]:
            errors.append(
                f"france-planning-2026.html: booking item {index} label/checkbox mismatch"
            )
        if labels:
            invalid = [
                node.tag
                for node in labels[0].descendants()
                if node.tag not in PHRASING_TAGS
            ]
            if invalid:
                errors.append(
                    "france-planning-2026.html: "
                    f"booking item {index} label contains non-phrasing tags {invalid}"
                )
        if len(contents) != 1 or (labels and contents[0].parent is not labels[0].parent):
            errors.append(
                "france-planning-2026.html: "
                f"booking item {index} needs one booking-content sibling of its label"
            )
            continue
        content = contents[0]
        required_classes = {
            "priority",
            "booking-window",
            "booking-rule",
            "booking-price",
        }
        for class_name in required_classes:
            if not contains_class(content, class_name):
                errors.append(
                    "france-planning-2026.html: "
                    f"booking item {index} missing {class_name}"
                )
        official_links = [
            node
            for node in content.descendants()
            if node.tag == "a" and node.has_class("official-link")
        ]
        if not official_links:
            errors.append(
                f"france-planning-2026.html: booking item {index} missing official link"
            )
        for link in official_links:
            rel = link.attrs.get("rel", "").split()
            if (
                not link.attrs.get("href", "").startswith("https://")
                or link.attrs.get("target") != "_blank"
                or "noopener" not in rel
            ):
                errors.append(
                    "france-planning-2026.html: "
                    f"booking item {index} has invalid official direct link"
                )
        if labels and any(has_ancestor(link, labels[0]) for link in official_links):
            errors.append(
                "france-planning-2026.html: "
                f"booking item {index} official links must be outside label"
            )
        what = [
            node
            for node in content.children
            if node.has_class("place-what")
        ]
        if len(what) != 1 or len(what[0].text()) < 18:
            errors.append(
                "france-planning-2026.html: "
                f"booking item {index} needs a concise place-what description"
            )
    if booking_ids != EXPECTED_BOOKING_IDS:
        errors.append(
            "france-planning-2026.html: booking inventory mismatch; "
            f"missing {sorted(EXPECTED_BOOKING_IDS - booking_ids)}, "
            f"unexpected {sorted(booking_ids - EXPECTED_BOOKING_IDS)}"
        )
    coverage = planning.with_class("reservation-coverage")
    if len(coverage) != 1 or "无需提前预约" not in coverage[0].text():
        errors.append(
            "france-planning-2026.html: missing clear no-advance-reservation coverage note"
        )

for filename in (
    "france.html",
    "france-planning-2026.html",
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
    "france-planning-2026.html",
    "france-itinerary-2026.html",
):
    if filename in texts and "欧洲十日行" in texts[filename]:
        errors.append(f"{filename}: oversized/public trip-duration title remains")

for filename in ("france-planning-2026.html", "france-itinerary-2026.html"):
    document = documents.get(filename)
    if not document:
        continue
    bottom_navs = document.with_class("mobile-bottom-nav", "nav")
    if len(bottom_navs) != 1:
        errors.append(f"{filename}: expected one mobile-bottom-nav")
        continue
    hrefs = {
        child.attrs.get("href")
        for child in bottom_navs[0].descendants()
        if child.tag == "a"
    }
    if hrefs != {
        "/france-planning-2026.html",
        "/france-itinerary-2026.html",
    }:
        errors.append(f"{filename}: mobile bottom navigation targets mismatch")

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

if (
    "france-planning-2026.html" in texts
    and "teax-france-2026-v2-planning" not in texts["france-planning-2026.html"]
):
    errors.append("france-planning-2026.html: missing checklist localStorage key")
if "france-planning-2026.html" in texts:
    planning_text = texts["france-planning-2026.html"]
    if "book-picasso" in planning_text or "毕加索博物馆" in planning_text:
        errors.append(
            "france-planning-2026.html: Picasso museum booking should be removed"
        )
    for booking_text in (
        "10.2 12:00 · Le Plongeoir",
        "10.2 15:30 · Château de Bellet",
        "10.4 09:30 · 卢浮宫",
        "10.4 18:00 · 凯旋门登顶",
        "10.5 15:00 · 巴黎歌剧院",
        "10.6 09:30 · 圣礼拜堂",
        "10.6 12:00 · Alliance午餐",
        "10.6 15:00 · 奥赛博物馆",
        "10.6 18:00 · 塞纳河游船",
        "10.5 20:00 · 疯马秀",
    ):
        if booking_text not in planning_text:
            errors.append(
                "france-planning-2026.html: missing finalized booking "
                f"{booking_text}"
            )
    for replaced in ("Chez Acchiardo", "Au Petit Riche", "奥赛11:00"):
        if replaced in planning_text:
            errors.append(
                "france-planning-2026.html: replaced plan remains "
                f"{replaced}"
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
    f"(3 France cards, {day_count} days, {map_count} map links, "
    f"{booking_count} booking actions, {len(HTML_FILES)} balanced HTML pages)"
)
