import importlib.util
import sys
import tempfile
from pathlib import Path


ROOT = Path(__file__).resolve().parents[1]
BUILDER_PATH = ROOT / "scripts" / "build-family-share.py"
EXPECTED_FILES = {
    "_headers",
    "index.html",
    "pack-preview.png",
    "css/theme.css",
    "css/themes.css",
    "css/travel.css",
    "js/travel-theme.js",
}
REQUIRED_HTML = (
    '<meta name="robots" content="noindex, nofollow, noarchive">',
    "<title>家庭行程 2026</title>",
    '<link rel="icon" href="./pack-preview.png" type="image/png">',
    '<link rel="stylesheet" href="./css/themes.css">',
    '<link rel="stylesheet" href="./css/theme.css">',
    '<link rel="stylesheet" href="./css/travel.css">',
    '<script src="./js/travel-theme.js"></script>',
    "https://www.google.com/maps/search/?api=1&query=",
    "https://tickets.vangoghmuseum.com/",
    "https://ticket.louvre.fr/en",
    "https://resa.notredamedeparis.fr/en/reservationindividuelle/tickets",
    "https://www.aeroportparisbeauvais.com/en/access-parking/paris-airport-shuttle",
)
FORBIDDEN_HTML = (
    'href="/',
    'src="/',
    "/france.html",
    "/france-planning-2026.html",
    "/france-visa-2026.html",
    "mobile-bottom-nav",
    "page-nav",
    "family-hidden",
    "Tea X",
    "github.com",
    "theme-icons.js",
    "De Wallen",
    "红灯区",
    "疯马秀",
    "Crazy Horse",
    "Bar Nouveau",
    "Little Red Door",
    "Danico",
    "The Cambridge Public House",
    "barnouveau.fr",
    "reservation.lecrazy.com",
    "daroco.com/en/danico",
)


def load_builder():
    if not BUILDER_PATH.exists():
        return None
    spec = importlib.util.spec_from_file_location("family_share_builder", BUILDER_PATH)
    module = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(module)
    return module


def main():
    errors = []
    builder = load_builder()
    if builder is None:
        errors.append("missing scripts/build-family-share.py")
    elif not hasattr(builder, "build_family_site"):
        errors.append("builder must export build_family_site(output_dir)")

    if errors:
        print("\n".join(errors))
        return 1

    with tempfile.TemporaryDirectory() as temporary_directory:
        output = Path(temporary_directory) / "family-trip"
        result = builder.build_family_site(output)
        if Path(result) != output:
            errors.append(f"builder returned {result}, expected {output}")

        found_files = {
            str(path.relative_to(output))
            for path in output.rglob("*")
            if path.is_file()
        }
        if found_files != EXPECTED_FILES:
            errors.append(
                "family build files mismatch; "
                f"missing {sorted(EXPECTED_FILES - found_files)}, "
                f"unexpected {sorted(found_files - EXPECTED_FILES)}"
            )

        index_path = output / "index.html"
        if index_path.exists():
            html = index_path.read_text(encoding="utf-8")
            if html.count('class="schedule-row"') != 10:
                errors.append("family index must preserve all ten itinerary rows")
            if html.count("map-link") < 60:
                errors.append("family index must preserve itinerary map links")
            for required in REQUIRED_HTML:
                if required not in html:
                    errors.append(f"family index missing {required}")
            for forbidden in FORBIDDEN_HTML:
                if forbidden in html:
                    errors.append(f"family index exposes forbidden content {forbidden}")

        headers_path = output / "_headers"
        if headers_path.exists():
            headers = headers_path.read_text(encoding="utf-8")
            for directive in (
                "X-Robots-Tag: noindex, nofollow, noarchive",
                "X-Content-Type-Options: nosniff",
                "Referrer-Policy: no-referrer",
            ):
                if directive not in headers:
                    errors.append(f"Cloudflare headers missing {directive}")

        copied_assets = {
            "pack-preview.png": "pack-preview.png",
            "css/theme.css": "css/theme.css",
            "css/themes.css": "css/themes.css",
            "css/travel.css": "css/travel.css",
            "js/travel-theme.js": "js/travel-theme.js",
        }
        for generated, source in copied_assets.items():
            generated_path = output / generated
            source_path = ROOT / source
            if generated_path.exists() and generated_path.read_bytes() != source_path.read_bytes():
                errors.append(f"generated asset differs from source: {generated}")

    if errors:
        print("\n".join(errors))
        return 1
    print("family share build: OK (10 days, isolated navigation, Cloudflare headers)")
    return 0


if __name__ == "__main__":
    sys.exit(main())
