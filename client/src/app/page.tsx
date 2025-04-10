'use client'
import { useState, useEffect } from 'react';

export default function Page() {
  const [title, setTitle] = useState(null);
  const [id, setId] = useState(null);
  const [input, setInput] = useState('');
  const [message, setMessage] = useState('');
  const [chapterUrl, setChapterUrl] = useState(null);
  const [loading, setLoading] = useState(false);
  const [disabled, setDisabled] = useState(false);
  const baseUrl = 'https://api.mangadex.org';

  const loadRandomManga = async () => {
    setMessage('');
    setInput('');
    setChapterUrl(null);
    setTitle(null);
    setId(null);
    setLoading(true);

    try {
      const resp = await fetch(`${baseUrl}/manga/random?contentRating[]=safe&contentRating[]=suggestive&contentRating[]=erotica&includedTagsMode=AND&excludedTagsMode=OR`);
      const json = await resp.json();
      const fetchedTitle = json?.data?.attributes?.title?.en ?? null;
      const fetchedId = json?.data?.id ?? null;
      setTitle(fetchedTitle);
      setId(fetchedId);

      if (!fetchedId) return;

      const feedResp = await fetch(`${baseUrl}/manga/${fetchedId}/feed`);
      const feedJson = await feedResp.json();
      const chapters = feedJson?.data ?? [];

      if (chapters.length === 0) {
        console.log('No chapters found');
        return;
      }

      // Step 3: Random chapter
      const randomIndex = Math.floor(Math.random() * chapters.length);
      const chapterId = chapters[randomIndex].id;

      // Step 4: Get image server URL
      const serverResp = await fetch(`${baseUrl}/at-home/server/${chapterId}`);
      const serverJson = await serverResp.json();

      const serverUrl = serverJson?.baseUrl;
      const hash = serverJson?.chapter?.hash;
      const pageLength = Math.floor(Math.random() * serverJson?.chapter?.dataSaver?.length);

      const pagePath = serverJson?.chapter?.dataSaver?.[0];
      if (serverUrl && hash && pagePath) {
        const fullImageUrl = `${serverUrl}/data-saver/${hash}/${pagePath}`;
        setChapterUrl(fullImageUrl);
      }
    } catch (err) {
      console.error('Error fetching manga:', err);
    } finally {
      setLoading(false);
    }
  };

  // Initial load
  useEffect(() => {
    loadRandomManga();
  }, []);

  const handleSubmit = (e) => {
    e.preventDefault();

    const isCorrect = input.trim().toLowerCase() === title?.trim().toLowerCase();

    setMessage(
      isCorrect
        ? `Correct! The answer is "${title}"`
        : `Incorrect. The answer was "${title}"`
    );

    setDisabled(true);

    setTimeout(() => {
      loadRandomManga();
      setDisabled(false); 
    }, 2000);
  };

  return (
    <div style={{ padding: '2rem', fontFamily: 'Arial' }}>
      <h1>Guess the Manga Title</h1>

      <form onSubmit={handleSubmit}>
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Enter the title"
          style={{ padding: '0.5rem', fontSize: '1rem' }}
          disabled={disabled}
        />
        <button
          type="submit"
          style={{ marginLeft: '1rem', padding: '0.5rem 1rem' }}
          disabled={disabled}
        >
          Check
        </button>
      </form>

      {message && <p style={{ marginTop: '1rem' }}>{message}</p>}
      {id && <p>Manga ID: {id}</p>}
      {title && <p>Correct Title: {title}</p>}

      {loading ? (
        <p>Loading manga...</p>
      ) : chapterUrl ? (
        <div style={{ marginTop: '2rem' }}>
          <h2>Random Page Preview:</h2>
          <img
            src={chapterUrl}
            alt="Manga Page"
            style={{ maxWidth: '100%', border: '1px solid #ccc' }}
          />
          <p>
            <a href={chapterUrl} target="_blank" rel="noopener noreferrer">
              Open Image in New Tab
            </a>
          </p>
        </div>
      ) : (
        <p>No image to show. Try again!</p>
      )}

      <button
        onClick={loadRandomManga}
        style={{
          marginTop: '1rem',
          padding: '0.5rem 1rem',
          backgroundColor: '#4CAF50',
          color: 'white',
          border: 'none',
          cursor: 'pointer',
        }}
        disabled={loading || disabled}
      >
        Next Manga
      </button>
    </div>
  );
}