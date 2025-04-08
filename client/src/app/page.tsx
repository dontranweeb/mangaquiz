//server side
export default async function Page() {
  const baseUrl = "https://api.mangadex.org/manga/random?contentRating%5B%5D=safe&contentRating%5B%5D=suggestive&contentRating%5B%5D=erotica&includedTagsMode=AND&excludedTagsMode=OR"; // Replace with your actual API URL

  // Fetch the data on the server side
  const res = await fetch(baseUrl);
  
  if (!res.ok) {
    throw new Error("Failed to fetch data");
  }
  //fetch data
  const resp = await res.json();
  const title = resp?.data?.attributes?.title?.en ?? null;
  const id = resp?.data?.id ?? null;

  // Render the page with the fetched data
  return (
    <div>
      <h1>{title}</h1>
      <p>{`Item ID: ${id}`}</p>

      {/* "Next" button */}
      <form method="GET">
        <button type="submit">Next</button>
      </form>
    </div>
  );
}
