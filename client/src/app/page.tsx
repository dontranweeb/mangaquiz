'use client'
import { useState, useEffect } from 'react';
import { loadRandomManga as loadRandomMangaPage } from '../services/mangaApi';

export default function Page() {
  const [title, setTitle] = useState<string | null>(null);       
  const [id, setId] = useState<string | null>(null);                 
  const [chapterUrl, setChapterUrl] = useState<string | null>(null);   // these 3 hold fetched manga info

  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [disabled, setDisabled] = useState(false);    // these 4 control the quiz form and feedback

  const [timeLeft, setTimeLeft] = useState<number>(15);
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
  const [previousRoundInfo, setPreviousRoundInfo] = useState<{
    title: string | null,
    scanName: string | null;
    website: string | null;
    twitter: string | null;
  } | null>(null);
  const [showScoreAnimation, setShowScoreAnimation] = useState<boolean>(false);


  const loadRandomManga = async () => {
    if (currentRound >= 20) {
      setIsGameEnded(true);
      setTimerActive(false);
      return;
    }

    setDisabled(false); //Re-enable form + button
    setTimerActive(false);  //Reset before loading
    setTimeLeft(15);
    setMessage('');
    setPreviousRoundInfo(null);
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
      const result = await loadRandomMangaPage();

        if (!result) {
          retryCount++;
          // Longer delay between retries to avoid rate limiting
          if (retryCount < maxRetries) {
            await new Promise(resolve => setTimeout(resolve, 1000));
          }
          continue;
        }

      // Set state from service response
      setTitle(result.manga.title);
      setId(result.manga.id);
      setChapterUrl(result.imageUrl);

      // Set scanlation info
      if (result.scanlationGroup) {
        setScan(result.scanlationGroup.id);
        setScanName(result.scanlationGroup.name);
        setWebsite(result.scanlationGroup.website);
        setTwitter(result.scanlationGroup.twitter);
      } else {
        setScan(null);
        setScanName(null);
        setWebsite(null);
        setTwitter(null);
      }

      // Combine correct + wrong answers, then shuffle
      const allOptions = [result.manga.title, ...result.wrongAnswers].filter(Boolean).slice(0,4); // max of 4

      // shuffle array (fisher yates alg)
      for (let i = allOptions.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [allOptions[i], allOptions[j]] = [allOptions[j], allOptions[i]];
      }

      setOptions(allOptions);
      setSelectedAnswer(null);
      setTimerActive(true);
      setCurrentRound((prev) => prev + 1);
      imageFound = true;
      } catch (err) {
        console.error('Error loading manga:', err);
        retryCount++;
        // Longer delay between retries to avoid rate limiting
        if (retryCount < maxRetries) {
          await new Promise(resolve => setTimeout(resolve, 1000));
        }
      }
    }
    if (!imageFound) {
      setMessage('Failed to load manga after multiple attempts. The API may be temporarily unavailable. Please try again later or check your connection.');
      setLoading(false);
      setTimerActive(false);
      setTimeLeft(15);
      setDisabled(true);
      // Don't auto-retry - let user manually retry or exit
    } else {
      setLoading(false);
    }
  };

  const handleAnswer = (selectedOption: string) => {
    if (!title) return;

    const isCorrect = selectedOption.trim().toLowerCase() === title.trim().toLowerCase();

    if(isCorrect) {
      setScore((prev) => prev + 1);
      setShowScoreAnimation(true);
      // Animation lasts 1.5 seconds, then hide it
      setTimeout(() => setShowScoreAnimation(false), 1500);
    }

    setMessage(
      isCorrect
        ? `Correct! The answer is "${title}"`
        : `Incorrect. The answer was "${title}"`
    );

    setDisabled(true);
    setTimerActive(false); // Stop countdown after clicking

    setPreviousRoundInfo({
      title: title,
      scanName: scanName,
      website: website,
      twitter: twitter,
    })
    

    setTimeout(() => {
      if (!isGameEnded) {
        loadRandomManga();
        setDisabled(false); 
      }
    }, 5000);

  };
  
  // Timer of 15 seconds
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
  }, [timeLeft, isGameEnded, selectedAnswer, title]);

  return (
    <>
      {!isGameStarted ? (
        // Lobby screen
        <div className="landing-page">
          <div className="landing-container">
            <h1 className='landing-title'> Manga Quiz</h1>
            <p className="landing-subtitles">Guess manga/manwha titles from random page previews!</p>
            <p className="landing-subtitles">Test your knowledge across 20 rounds.</p>
            <button onClick={() => {
              setCurrentRound(0); // Reset round
              setIsGameStarted(true);
              loadRandomManga();
            }}
            className="btn-play-primary"
            >
              Play
            </button>
          </div>
        </div>
      ) : isGameEnded ? (
        // Results screen
        <div className="end-game-page">
          <div className="end-game-container">
            <h1 className='end-game-title'>Game Over!</h1>

            {/* Results display */}
            <div className="end-game-stats">
              <div className="stat-card">
                <div className="stat-value">{score}</div>
                <div className="stat-label">Correct</div>
              </div>
              <div className="stat-card">
                <div className="stat-value incorrect">{20 - score}</div>
                <div className="stat-label">Incorrect</div>
              </div>
              <div className="stat-card">
                <div className="stat-value">{score} / 20</div>
                <div className="stat-label">Final Score</div>
              </div>
            </div>

            {/* Performance message */}
            <div className="end-game-message">
              {score >= 18 && <p className="performance-text excellent">Excellent job!</p>}
              {score >= 14 && score < 18 && <p className="performance-text good">Great job!</p>}
              {score >= 10 && score < 14 && <p className="performance-text average">Not bad!</p>}
              {score < 10 && <p className="performance-text needs-improvement">Keep practicing!</p>}
            </div>
            
            <div className='end-game-actions'>
              <button className="btn-play-again" onClick={() => {
                setIsGameEnded(false);
                setIsGameStarted(true);
                setCurrentRound(0);
                setScore(0);
                loadRandomManga();
              }}>
                Play Again
              </button>
              <button className='btn-exit-lobby' onClick={() => {
                setIsGameStarted(false);
                setIsGameEnded(false);
                setCurrentRound(0);
                setScore(0);
                setMessage('');
                setChapterUrl(null);
                setTimerActive(false);
              }}>
                Back to Home
              </button>
            </div>
          </div>
        </div>
      ) : (
        <div className="game-layout">
          {/* Left Panel - Manga Info Panel */}
          <aside className="manga-info-panel">
            <h3 className="panel-title">Manga Info</h3>
            {title ? (
              <div className="manga-info-content">
                <p className="manga-title">{previousRoundInfo?.title}</p>
                {previousRoundInfo?.scanName && (
                  <div className="scanlation-info">
                    <p className="scanlation-name">Scanlations by: {previousRoundInfo.scanName}</p>
                    {previousRoundInfo.website && (
                      <a href={previousRoundInfo.website} target="_blank" rel="noopener noreferrer" className="scanlation-link">Website</a>
                    )}
                    {previousRoundInfo.twitter && (
                      <a href={previousRoundInfo.twitter} target="_blank" rel="noopener noreferrer" className="scanlation-link">Twitter</a>
                    )}
                  </div>
                )}
              </div>
            ) : (
              <p className="panel-placeholder">Info will appear after each round</p>
            )}
          </aside>

          {/* Center Panel - Game Content */}
          <main className="game-content-panel">
            <h1 className="game-title">Guess the Manga!</h1>

            <p className="round-display">
              Round {currentRound}/20
            </p>

            <p className="score-display">
              Score: {score}
              {showScoreAnimation && (
                <span className="score-animation">+1</span>
              )}
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
                  crossOrigin="anonymous"
                  referrerPolicy="no-referrer"
                  onError={(e) => {
                    console.error('Image failed to load:', chapterUrl);
                    console.error('Error event:', e);
                  }}
                  onLoad={() => {
                    console.log('Image loaded successfully:', chapterUrl);
                  }}
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
            
            <div className="btn-container">
              <button className="btn-danger" onClick={() => {
                setIsGameEnded(true);
                setTimerActive(false);
              }}>
                End Game
              </button>
              <button
                onClick={() => {
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
          </main>

          {/* Right Panel - Chat */}
          <aside className="chat-panel">
            <h3 className="panel-title">Chat</h3>
            <div className="chat-messages">
              <p className="panel-placeholder">Chat coming soon!</p>
            </div>
            <div className="chat-input-container">
              <input 
                type="text" 
                placeholder="Type a message..." 
                className="chat-input"
                disabled
              />
            </div>
          </aside>
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