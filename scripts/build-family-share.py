import argparse
import re
import shutil
from pathlib import Path


ROOT = Path(__file__).resolve().parents[1]
SOURCE_HTML = ROOT / "france-itinerary-2026.html"
ASSETS = (
    "pack-preview.png",
    "css/theme.css",
    "css/themes.css",
    "css/travel.css",
    "js/travel-theme.js",
)
HEADERS = """/*
  X-Robots-Tag: noindex, nofollow, noarchive
  X-Content-Type-Options: nosniff
  Referrer-Policy: no-referrer
"""


def replace_once(text, old, new, label):
    if text.count(old) != 1:
        raise ValueError(f"expected exactly one {label}, found {text.count(old)}")
    return text.replace(old, new, 1)


def remove_nav(text, class_name):
    pattern = re.compile(
        rf"\n\s*<nav class=\"{re.escape(class_name)}\".*?</nav>",
        flags=re.DOTALL,
    )
    updated, count = pattern.subn("", text, count=1)
    if count != 1:
        raise ValueError(f"expected exactly one {class_name} navigation")
    return updated


def remove_family_hidden(text):
    pattern = re.compile(
        r'<(?P<tag>p|span) class="family-hidden">.*?</(?P=tag)>',
        flags=re.DOTALL,
    )
    updated, count = pattern.subn("", text)
    if count == 0:
        raise ValueError("expected family-hidden itinerary content")
    return updated


def family_html():
    html = SOURCE_HTML.read_text(encoding="utf-8")
    html = replace_once(
        html,
        '  <meta name="description" content="2026 行程安排：按日期查看交通、景点、餐饮和预约">\n',
        '  <meta name="description" content="2026 家庭旅行逐日行程">\n'
        '  <meta name="robots" content="noindex, nofollow, noarchive">\n',
        "description metadata",
    )
    html = replace_once(
        html,
        "  <title>行程安排 2026 · Tea X</title>",
        "  <title>家庭行程 2026</title>",
        "document title",
    )

    topbar_pattern = re.compile(
        r'\n\s*<nav class="topbar">.*?</nav>',
        flags=re.DOTALL,
    )
    family_topbar = """
    <nav class="topbar" aria-label="家庭行程工具栏">
      <span>家庭共享版</span>
      <button class="theme-btn" id="themeToggle" type="button" aria-label="切换主题">🌙</button>
    </nav>"""
    html, topbar_count = topbar_pattern.subn(family_topbar, html, count=1)
    if topbar_count != 1:
        raise ValueError("expected exactly one topbar navigation")

    html = remove_nav(html, "page-nav")
    html = remove_nav(html, "mobile-bottom-nav")
    html = remove_family_hidden(html)
    html = replace_once(
        html,
        '  <script src="/js/theme-icons.js"></script>\n',
        "",
        "shared icon script",
    )

    replacements = {
        'href="/pack-preview.png"': 'href="./pack-preview.png"',
        'href="/css/themes.css"': 'href="./css/themes.css"',
        'href="/css/theme.css"': 'href="./css/theme.css"',
        'href="/css/travel.css"': 'href="./css/travel.css"',
        'src="/js/travel-theme.js"': 'src="./js/travel-theme.js"',
    }
    for old, new in replacements.items():
        html = replace_once(html, old, new, old)

    if 'href="/' in html or 'src="/' in html:
        raise ValueError("family page still contains root-relative resources")
    return html


def build_family_site(output_dir):
    output = Path(output_dir)
    if output.exists():
        shutil.rmtree(output)
    output.mkdir(parents=True)

    (output / "index.html").write_text(family_html(), encoding="utf-8")
    (output / "_headers").write_text(HEADERS, encoding="utf-8")
    for relative_path in ASSETS:
        source = ROOT / relative_path
        destination = output / relative_path
        destination.parent.mkdir(parents=True, exist_ok=True)
        shutil.copy2(source, destination)
    return output


def main():
    parser = argparse.ArgumentParser(
        description="Build the isolated family itinerary for Cloudflare Pages."
    )
    parser.add_argument(
        "--output",
        type=Path,
        default=ROOT / "dist" / "family-trip",
        help="Output directory (default: dist/family-trip)",
    )
    arguments = parser.parse_args()
    output = build_family_site(arguments.output)
    print(f"family itinerary built at {output}")


if __name__ == "__main__":
    main()
