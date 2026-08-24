from html.parser import HTMLParser
from pathlib import Path
import re
import sys


ROOT = Path(__file__).resolve().parents[1]
REQUIRED = {
    "travel.html": ["continent-filters", 'data-continent="europe"', "/france.html"],
    "france.html": [
        "/france-visa-2026.html",
        "/france-planning-2026.html",
        "/france-itinerary-2026.html",
    ],
    "france-itinerary-2026.html": ['class="map-link"', "data-q="],
}
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
]


class Balance(HTMLParser):
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

    def handle_starttag(self, tag, attrs):
        if tag not in self.VOID:
            self.stack.append(tag)

    def handle_endtag(self, tag):
        if not self.stack or self.stack[-1] != tag:
            self.errors.append(f"unexpected </{tag}> after {self.stack[-3:]}")
        else:
            self.stack.pop()


errors = []
for filename, needles in REQUIRED.items():
    path = ROOT / filename
    if not path.exists():
        errors.append(f"missing {filename}")
        continue
    text = path.read_text(encoding="utf-8")
    for needle in needles:
        if needle not in text:
            errors.append(f"{filename}: missing {needle}")

for filename in HTML_FILES:
    path = ROOT / filename
    if not path.exists():
        errors.append(f"missing HTML file {filename}")
        continue
    text = path.read_text(encoding="utf-8")
    parser = Balance()
    parser.feed(text)
    if parser.stack or parser.errors:
        errors.append(f"{filename}: HTML balance {parser.stack} {parser.errors}")

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
print("travel page structure: OK")
