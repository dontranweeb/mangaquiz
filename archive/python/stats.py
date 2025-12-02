manga_id = "0301208d-258a-444a-8ef7-66e433d801b1"

import requests

base_url = "https://api.mangadex.org"

r = requests.get(f"{base_url}/statistics/manga/{manga_id}")

rating, follows, *others = r.json()["statistics"][manga_id].values()

print(
    f"Mean Rating: {rating}\n"
    + f"Follows: {follows}"
)