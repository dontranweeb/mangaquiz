'use client'
import { useState, useEffect } from 'react';

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
  const [isGameEnded, setIsGameEnded] = useState<boolean>(false);
  const [currentRound, setCurrentRound] = useState<number>(0);
  const [isImageModalOpen, setIsimageModalOpen] = useState<boolean>(false);

  const [options, setOptions] = useState<string[]>([]); // Array of 4 title choices (1 correct + 3 wrong)
  const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null); // Track the user's selected answer

  const loadRandomManga = async () => {

    if (currentRound >= 20) {
      setIsGameEnded(true);
      setTimerActive(false);
      return;
    }

    setDisabled(false); //Re-enable form + button
    setTimerActive(false);  //Reset before loading
    setTimeLeft(30);
    setInput('');
    setMessage('');
    setChapterUrl(null);
    setTitle(null);
    setScan(null);
    setId(null);
    setLoading(true);
    setOptions([]);

    let imageFound = false;
    let retryCount = 0;
    const maxRetries = 10;
    
    while (!imageFound && retryCount < maxRetries) {
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

      // Fetch 3 random wrong answers
      const wrongAnswer: string[] = [];
      let attempts = 0;
      const maxAttempts = 10; // prevent infinite looping

      while (wrongAnswer.length < 3 && attempts < maxAttempts) {
        try {
          const wrongResp = await fetch(`${baseUrl}/manga/random?
            contentRating[]=safe&
            contentRating[]=suggestive&
            contentRating[]=erotica&
            includedTagsMode=AND&
            excludedTagsMode=OR`);
          const wrongJson = await wrongResp.json();
          const wrongTitle = wrongJson?.data?.attributes?.title?.en ?? null;

          // make sure wrong option is not the same as correct answer and not already in array
          if (wrongTitle && 
            wrongTitle.trim().toLowerCase() !== fetchedTitle?.trim().toLowerCase() &&
          !wrongAnswer.includes(wrongTitle)) {
            wrongAnswer.push(wrongTitle);
          }
        } catch (err) {
          console.error('Error fetching wrong answer:', err);
        }
        attempts++;
      }

      // Combine correct + wrong answers, then shuffle
      const allOptions = [fetchedTitle, ...wrongAnswer].filter(Boolean).slice(0,4); // max of 4

      // shuffle array (fisher yates alg)
      for (let i = allOptions.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [allOptions[i], allOptions[j]] = [allOptions[j], allOptions[i]];
      }

      if (!fetchedId) continue;

      const feedResp = await fetch(`${baseUrl}/manga/${fetchedId}/feed`);
      const feedJson = await feedResp.json();
      const chapters = feedJson?.data ?? [];

      if (chapters.length === 0) {
        console.log('No chapters found');
        continue;
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
        setCurrentRound((prev) => prev + 1);
        imageFound = true; // Exit the loop, we found an image
        setOptions(allOptions);
        setSelectedAnswer(null);
      } else {
        // No image found, will retry
        retryCount++;
      }
      } catch (err) {
        console.error('Error fetching manga:', err);
        retryCount++;
        continue; // Skip to next iteration of while loop
      }
      
      // If image wasn't found, increment retry count
      if (!imageFound) {
        retryCount++;
      }
    }
    
    // After while loop ends
    setLoading(false);
  };

  // Initial load       --> removed auto loading, we will load when user clicks PLay
  //useEffect(() => {
  //  loadRandomManga();
  //}, []);

  const handleAnswer = (selectedOption: string) => {
    if (!title) return;

    const isCorrect = selectedOption.trim().toLowerCase() === title.trim().toLowerCase();

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
      if (!isGameEnded) {
        loadRandomManga();
        setDisabled(false); 
      }
    }, 5000);

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
    if (timeLeft === 0 && !isGameEnded) {
      setDisabled(true);

      if (selectedAnswer) {
        handleAnswer(selectedAnswer);
      } else {
        setMessage(`Time is up! The answer was "${title}"`);

        const nextTimeout = setTimeout(() => {
          if (!isGameEnded) {
            loadRandomManga();
            setDisabled(false); // re-enable input
          }
        }, 5000); // 5 seconds

        return () => clearTimeout(nextTimeout) // in case user refreshes 
      }                                      // or program runs loadRandomManga
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
      ) : isGameEnded ? (
        // Results screen
        <div className="lobby">
          <h1 className='lobby-title'>Game Over!</h1>
          <p className="results-score">Final Score: {score} / 20</p>
          <p className="results-percentage">
            {Math.round((score / 20) * 100)}% Correct
          </p>
          <button className="btn-primary" onClick={() => {
            setIsGameEnded(false);
            setIsGameStarted(true);
            setCurrentRound(0);
            setScore(0);
            loadRandomManga();
          }}>
            Play Again
          </button>
          <button className='btn-danger' onClick={() => {
            setIsGameStarted(false);
            setIsGameEnded(false);
            setCurrentRound(0);
            setScore(0);
            setMessage('');
            setChapterUrl(null);
            setTimerActive(false);
          }}>
            Exit to Lobby
          </button>
        </div>
      ) : (
        <div className="game-container">
          <h1 className="game-title">Guess the Manga!</h1>

          <p className="round-display">
            Round {currentRound}/20
          </p>

          <p className="score-display">
            Score: {score}
          </p>


          <p className="timer-text">
              Time Left: {timeLeft} seconds
            </p>

          {message && <p className="message-text">{message}</p>}
          {/* {id && <p>Manga ID: {id}</p>}
          {title && <p>Correct Title: {title}</p>}
          {scan && <p>ScanID: {scan}</p>}
          {scanName && <p> Scanlations Name: {scanName}</p>}
          {website && <a href={website}> Website: {website} </a>}
          {twitter &&  <a href={twitter}> Twitter </a>} */}
          {loading ? (
            <p>Loading manga...</p>
          ) : chapterUrl ? (
            <div className="image-container">
              <h2>Random Page Preview:</h2>
              <img
                src={chapterUrl}
                alt="Manga Page"
                onClick={() => setIsimageModalOpen(true)}
                className="manga-image"
              />
            </div>
          ) : (
            <p>No image to show. Try again!</p>
          )}

          <div className="options-container">
            {options.length > 0 ? (
              options.map((option, index) => (
                <button 
                  key={index}
                  onClick={() => {
                    if (disabled) return;
                    setSelectedAnswer(option);
                  }}
                  className={`option-button ${selectedAnswer === option ? 'selected' : ''}`}
                  disabled={disabled}
                >
                  {option}
                </button>
              ))
            ) : (
              <p>Loading options...</p>
            )}
          </div>
          <div
            className="btn-container"
          >
            <button className="btn-danger" onClick={() => {
              setIsGameEnded(true);
              setTimerActive(false);
              }}>
              End Game
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
              className="btn-danger"
            >
              Exit to Lobby
            </button>
          </div>
          
        </div>
      )}
      {isImageModalOpen && (
        <div
          onClick={() => setIsimageModalOpen(false)}
          className="modal-overlay"
        >
          <img
            src={chapterUrl ?? undefined}
            alt="Manga Page - Full Size"
            onClick = {(e) => e.stopPropagation()}
            className="modal-image"
          />
        </div>
      )}
    </>
  );
}