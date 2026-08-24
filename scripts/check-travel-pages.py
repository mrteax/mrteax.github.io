from html.parser import HTMLParser
from pathlib import Path
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
    parser = Balance()
    parser.feed(text)
    if parser.stack or parser.errors:
        errors.append(f"{filename}: HTML balance {parser.stack} {parser.errors}")

if errors:
    print("\n".join(errors))
    sys.exit(1)
print("travel page structure: OK")
