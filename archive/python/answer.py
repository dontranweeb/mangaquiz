
import requests
import random
base_url = "https://api.mangadex.org"

r = requests.get(
    f"{base_url}/manga/random?contentRating%5B%5D=safe&contentRating%5B%5D=suggestive&contentRating%5B%5D=erotica&includedTagsMode=AND&excludedTagsMode=OR"
)

#print(r.json())

title = r.json()["data"]['attributes']["title"]["en"]
id = r.json()["data"]["id"]
print(title)

r2 = requests.get(
    f"{base_url}/manga/{id}/feed"
)
#try 'translatedLanguage =='en'
#print(r2.json())
chapters = r2.json()["data"]
#for i in chapters:
    #print(i["id"])

if len(chapters) > 1:
    c = random.choice(chapters)
    #print(f"Random Chapter: {c["id"]}")
    r3 = requests.get(
    f"{base_url}/at-home/server/{c["id"]}"
    )   
elif len(chapters) == 1:

    print("one shot")
    r3 = requests.get(
    f"{base_url}/at-home/server/{r2.json()["data"][0]["id"]}"
    )   
else:
    print("no pages")
    exit()





images = r3.json()
ds_images = images["chapter"]["dataSaver"]
#for i in ds_images:
 #   print(f"{i}\n")

user_input = input("Type this manga?")

if user_input == title:
    print("Correct")
else:
    print("Incorrect")



