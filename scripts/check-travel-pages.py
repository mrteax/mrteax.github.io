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
    "Gare de Versailles Chantiers",
    "Place de l'Horloge, Avignon",
    "Promenade des Anglais, Nice",
    "Monaco-Ville",
}
EXPECTED_BOOKING_IDS = {
    "book-air",
    "book-stay",
    "book-airport-transfer",
    "book-rail",
    "book-driver",
    "book-eiffel",
    "book-versailles",
    "book-louvre",
    "book-orsay",
    "book-cmn",
    "book-notredame",
    "book-cruise",
    "book-avignon",
    "book-carrieres",
    "book-winery",
    "book-picasso",
    "book-oceanographic",
    "book-dinner",
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
    days = itinerary.with_class("day", "section")
    dated_days = itinerary.with_class("day-date")
    day_count = len(days)
    if day_count != 12 or len(dated_days) != 12:
        errors.append(
            "france-itinerary-2026.html: expected exactly 12 day sections "
            f"and 12 dates, found {day_count} sections and {len(dated_days)} dates"
        )
    for index, day in enumerate(days, start=1):
        dates = [
            child for child in day.descendants() if child.has_class("day-date")
        ]
        if len(dates) != 1 or not re.fullmatch(
            r"\d{1,2}\.\d{1,2}\s+周.", dates[0].text() if dates else ""
        ):
            errors.append(
                f"france-itinerary-2026.html: day {index} lacks one dated day-date"
            )
        summaries = [
            child for child in day.descendants() if child.has_class("day-summary")
        ]
        if len(summaries) != 1 or len(summaries[0].text()) < 18:
            errors.append(
                f"france-itinerary-2026.html: day {index} needs a concise day-summary"
            )

    map_links = itinerary.with_class("map-link")
    map_count = len(map_links)
    if map_count < 50:
        errors.append(
            f"france-itinerary-2026.html: expected at least 50 map links, found {map_count}"
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
    and "teax-france-2026-planning" not in texts["france-planning-2026.html"]
):
    errors.append("france-planning-2026.html: missing checklist localStorage key")

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
