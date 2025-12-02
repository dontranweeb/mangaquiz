title = "Kanojyo to Himitsu to Koimoyou"

import requests

base_url = "https://api.mangadex.org"

r = requests.get(
    f"{base_url}/manga",
    params={"title": title}
)

print([manga["id"] for manga in r.json()["data"]])