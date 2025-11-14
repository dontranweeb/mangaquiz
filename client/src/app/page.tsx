'use client'
import { FormEvent, useState, useEffect } from 'react';

export default function Page() {
  const baseUrl = 'https://api.mangadex.org';

  const [title, setTitle] = useState<string | null>(null);       
  const [id, setId] = useState<string | null>(null);                 
  const [chapterUrl, setChapterUrl] = useState<string | null>(null);   // these 3 hold fetched manga info

  const [input, setInput] = useState('');
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [disabled, setDisabled] = useState(false);    // these 4 control the quiz form and feedback

  const [timeLeft, setTimeLeft] = useState<number>(30);
  const [timerActive, setTimerActive] = useState<boolean>(false);   // these 2 control the timer
  
  const [scan, setScan] = useState<string | null>(null);
  const [scanName, setScanName] = useState<string | null>(null);
  const [twitter, setTwitter] = useState<string | null>(null);
  const [website, setWebsite] = useState<string | null>(null);
  const [score, setScore] = useState(0);           // these 5 hold the score

  const [isGameStarted, setIsGameStarted] = useState<boolean>(false);
  const [currentRound, setCurrentRound] = useState<number>(0);
  const [isImageModalOpen, setIsimageModalOpen] = useState<boolean>(false);

  const loadRandomManga = async () => {
    setDisabled(false); //Re-enable form + button
    setMessage('');
    setTimerActive(false);  //Reset before loading
    setTimeLeft(30);
    setInput('');
    setChapterUrl(null);
    setTitle(null);
    setScan(null);
    setId(null);
    setLoading(true);

    try {
      // Step 1: Get random manga
      const resp = await fetch(`${baseUrl}/manga/random?
        contentRating[]=safe&
        contentRating[]=suggestive&
        contentRating[]=erotica&
        includedTagsMode=AND&
        excludedTagsMode=OR`);

      // Step 2: Parse response
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

      // Step 5: Grabbing scanlator from chapter
      const scanResp = await fetch(`${baseUrl}/chapter/${chapterId}?includes%5B%5D=scanlation_group`);
      const scanJson = await scanResp.json();
      const scanID =  scanJson?.data?.relationships[0].id ?? null;
      setScan(scanID);
      const scanName =  scanJson?.data?.relationships[0].attributes?.name ?? null;
      setScanName(scanName);

      const site = await fetch(`${baseUrl}/group/${scanID}?includes%5B%5D=leader`);
      const siteJson = await site.json();
      const site_website =  siteJson?.data?.attributes?.website ?? null;
      const site_twitter = siteJson?.data?.attributes?.twitter ?? null;
      setTwitter(site_twitter);
      setWebsite(site_website);
      
      // Build the Image URL
      const serverUrl = serverJson?.baseUrl;
      const hash = serverJson?.chapter?.hash;
      const pageLength = Math.floor(Math.random() * serverJson?.chapter?.dataSaver?.length);
      const pagePath = serverJson?.chapter?.dataSaver?.[pageLength];


      if (serverUrl && hash && pagePath) {
        const fullImageUrl = `${serverUrl}/data-saver/${hash}/${pagePath}`;
        setChapterUrl(fullImageUrl);
        setTimerActive(true); // Makes sure timer starts when there IS an image
        setCurrentRound((prev) => prev + 1); // Increment round
      }
    } catch (err) {
      console.error('Error fetching manga:', err);
    } finally {
      setLoading(false);
    }
  };

  // Initial load       --> removed auto loading, we will load when user clicks PLay
  //useEffect(() => {
  //  loadRandomManga();
  //}, []);

  const handleSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    if (!title) return;
    const guess = input.trim().toLowerCase();
    const answer = title.trim().toLowerCase();
    const isCorrect = guess === answer;

    if(isCorrect) {
      setScore((prev) => prev + 1);
    }

    setMessage(
      isCorrect
        ? `Correct! The answer is "${title}"`
        : `Incorrect. The answer was "${title}"`
    );

    setDisabled(true);
    setTimerActive(false); // Stop countdown after clicking

    setTimeout(() => {
      loadRandomManga();
      setDisabled(false); 
    }, 2000);


  };
  
  // Timer of 30 seconds
  useEffect(() => {
    if (!timerActive || timeLeft === 0) return;

    // Decrement by 1
    const timer = setInterval(() => {
      setTimeLeft((prev) => prev - 1);
    }, 1000);

    return () => clearInterval(timer);
  }, [timeLeft, timerActive]);

  // When timer runs out
  useEffect(() => {
    if (timeLeft === 0) {
      setDisabled(true);
      setMessage(`Time is up! The answer was "${title}"`);

      const nextTimeout = setTimeout(() => {
        loadRandomManga();
        setDisabled(false); // re-enable input
      }, 2000); // 2 seconds

      return () => clearTimeout(nextTimeout) // in case user refreshes 
                                            // or program runs loadRandomManga
    }
  }, [timeLeft]);

  return (
    <>
      {!isGameStarted ? (
        // Lobby screen
        <div className="lobby">
          <h1 className='lobby-title'> Manga Quiz</h1>
          <button onClick={() => {
            setCurrentRound(0); // Reset round
            setIsGameStarted(true);
            loadRandomManga();
          }}
          className="btn-primary"
          >
            Play
          </button>
        </div>
      ) : (
        <div className="game-container">
          <h1>Guess the Manga Title</h1>

          <p className="round-display">
            Round {currentRound}/20
          </p>

          <p className="score-display">
            Score: {score}
          </p>


          <p className="timer-text">
              Time Left: {timeLeft} seconds
            </p>

            <div className="timer-bar-container">
              <div className="timer-bar-fill" 
                style={{
                width: `${(timeLeft / 30) * 100}%`, // Smooth decrease because dependent on timeLeft
                backgroundColor: timeLeft > 10 ? '#4CAF50' : '#FF4C4C', // if timeLeft > 10, bar is green. If not then red
                }} 
              />
            </div>

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

          {message && <p style={{ marginBottom: '1rem' }}>{message}</p>}
          {/* {id && <p>Manga ID: {id}</p>}
          {title && <p>Correct Title: {title}</p>}
          {scan && <p>ScanID: {scan}</p>}
          {scanName && <p> Scanlations Name: {scanName}</p>}
          {website && <a href={website}> Website: {website} </a>}
          {twitter &&  <a href={twitter}> Twitter </a>} */}
          {loading ? (
            <p>Loading manga...</p>
          ) : chapterUrl ? (
            <div style={{ marginTop: '2rem' }}>
              <h2>Random Page Preview:</h2>
              <img
                src={chapterUrl}
                alt="Manga Page"
                onClick={() => setIsimageModalOpen(true)}
                style={{ 
                  maxWidth: '90vw',
                  maxHeight: '60vh',
                  width: 'auto',
                  height: 'auto',
                  objectFit: 'contain',
                  border: '1px solid #ccc',
                  cursor: 'pointer'
                }}
              />
            </div>
          ) : (
            <p>No image to show. Try again!</p>
          )}
          <div
            style = {{
              display: 'flex',
              gap: '0.75rem',
              marginTop: '1rem'
            }}
          >
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
              disabled={loading}
            >
              Next Manga
            </button>
            <button
              onClick = {() => {
                setIsGameStarted(false);
                setCurrentRound(0);
                setScore(0);
                setMessage('');
                setChapterUrl('');
                setTimerActive(false);
              }}
              style = {{
                marginTop: '1rem',
                marginLeft: '1rem;',
                padding: '0.5rem 1rem',
                backgroundColor: '#f44336',
                color: 'white',
                border: 'none',
                cursor: 'pointer'
              }}
            >
              Exit to Lobby
            </button>
          </div>
          
        </div>
      )}
      {isImageModalOpen && (
        <div
          onClick={() => setIsimageModalOpen(false)}
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(0,0,0,0.8)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000,
            cursor: 'pointer',
            backdropFilter: 'blur(6px)',
            WebkitBackdropFilter: 'blue(6px)'
          }}
        >
          <img
            src={chapterUrl ?? undefined}
            alt="Manga Page - Full Size"
            onClick = {(e) => e.stopPropagation()}
            style = {{
                maxWidth: '90vw',
                maxHeight: '90vh',
                width: 'auto',
                height: 'auto',
                objectFit: 'contain',
                cursor: 'pointer'
              }}
            
          />
        </div>
      )}
    </>
  );
}