const BASE_URL = 'https://api.mangadex.org';

// Rate limiter: Mangadex allows 5 requests per second (200ms minimum between requests)
let lastRequestTime = 0;
const MIN_REQUEST_INTERVAL = 200; // milliseconds

async function rateLimitedFetch(url: string, options?: RequestInit): Promise<Response> {
    const now = Date.now();
    const timeSinceLastRequest = now - lastRequestTime;

    if (timeSinceLastRequest < MIN_REQUEST_INTERVAL) {
        const waitTime = MIN_REQUEST_INTERVAL - timeSinceLastRequest;
        await new Promise(resolve => setTimeout(resolve, waitTime));
    }

    lastRequestTime = Date.now();

    // HTTP/2 workaround options
    const fetchOptions: RequestInit = {
        ...options,
        keepalive: false,
        cache: 'no-cache'
        // Force HTTP/1.1 if possible (browser will handle this)
    };

    return fetch(url, fetchOptions);
}

export interface MangaData {
    id: string;
    title: string;
}

export interface ChapterData {
    id: string;
}

export interface ScanlationGroupData {
    id: string;
    name: string | null;
    website: string | null;
    twitter: string | null;
}

export interface MangaPageData {
    manga: MangaData;
    chapterId: string;
    imageUrl: string;
    scanlationGroup: ScanlationGroupData | null;
    wrongAnswers: string[];
}

export async function getRandomManga(): Promise<MangaData | null> {
    let retries = 0;
    const maxRetries = 3;

    while (retries <= maxRetries) {
        try {
            const params = new URLSearchParams();
            params.append('contentRating[]', 'safe');
            params.append('contentRating[]', 'suggestive');
            params.append('contentRating[]', 'erotica');
            params.append('includedTagsMode', 'AND');
            params.append('excludedTagsMode', 'OR');
            
            const resp = await rateLimitedFetch(`${BASE_URL}/manga/random?${params.toString()}`, {
                method: 'GET',
                headers: {
                    'Accept': 'application/json',
                }
            });
            
            if (!resp.ok) {
                console.error('API response not OK:', resp.status, resp.statusText);
                // If rate limited, wait a bit longer
                if (resp.status === 429) {
                    await new Promise(resolve => setTimeout(resolve, 2000));
                }
                return null;
            }
    
            const json = await resp.json();
            const title = json?.data?.attributes?.title?.en ?? null;
            const id = json?.data?.id ?? null;

            if (!id || !title) return null;

            return { id, title };
        } catch (error: any) {
            // Check for HTTP2 protocol errors
            if (error.message?.includes('HTTP2') || error.message?.includes('ERR_HTTP2')) {
                retries++;
                if (retries <= maxRetries) {
                    // Exponential backoff
                    const backoffTime = Math.pow(2, retries) * 1000; // 2, 4, 8, 16 seconds
                    console.warn(`HTTP2 Protocol Error - Retrying in ${backoffTime}ms (attempt ${retries + 1} of ${maxRetries})`);
                    await new Promise(resolve => setTimeout(resolve, backoffTime));
                    continue;
                }
            }

            // Other error logging
            if (error.message?.includes('Failed to fetch')) {
                console.error('Network error - Check your connection or API status');
            } else {
                console.error('Error fetching random manga:', error);
            }
            return null;
        }
    }
    return null;
}

export async function getWrongAnswers(count: number, excludeTitle: string): Promise<string[]> {
    const wrongAnswer: string[] = [];
      let attempts = 0;
      const maxAttempts = 10; // prevent infinite looping

      while (wrongAnswer.length < count && attempts < maxAttempts) {
        try {
            const manga = await getRandomManga();
            if (manga &&
                manga.title.trim().toLowerCase() !== excludeTitle.trim().toLowerCase() &&
                !wrongAnswer.includes(manga.title)) {
                    wrongAnswer.push(manga.title);
                }
        } catch (error) {
            console.error('Error fetching wrong answer:', error);
        }
        attempts++;
      }

      return wrongAnswer;
}

export async function getMangaChapters(mangaId: string): Promise<{ id: string }[]> {
    try {
        const resp = await rateLimitedFetch(`${BASE_URL}/manga/${mangaId}/feed`);
        const json = await resp.json();
        return json?.data ?? [];
    } catch (error) {
        console.error('Error fetching manga chapters:', error);
        return [];
    }
}

export async function getChapterServer(chapterId: string) {
    try {
        const resp = await rateLimitedFetch(`${BASE_URL}/at-home/server/${chapterId}`);
        const json = await resp.json();
        return {
            baseUrl: json?.baseUrl,
            hash: json?.chapter?.hash,
            dataSaver: json?.chapter?.dataSaver ?? []
        };
    } catch (error) {
        console.error('Error fetching chapter server:', error);
        return null;
    }
}

export async function getChapterScanlation(chapterId: string) {
    try {
        const resp = await rateLimitedFetch(`${BASE_URL}/chapter/${chapterId}?includes%5B%5D=scanlation_group`);
        const json = await resp.json();
        const relationships = json?.data?.relationships ?? [];
        const relationship = relationships.length > 0 ? relationships[0] : null;
        return {
            id: relationship?.id ?? null,
            name: relationship?.attributes?.name ?? null
        };
    } catch (error) {
        console.error('Error fetching chapter scanlation:', error);
        return {id: null, name: null};
    }
}

export async function getScanlationGroup(groupId: string): Promise<ScanlationGroupData | null> {
    if (!groupId) return null;

    try {
        const resp = await rateLimitedFetch(`${BASE_URL}/group/${groupId}?includes%5B%5D=leader`);
        const json = await resp.json(); 
        return {
            id: groupId,
            name: json?.data?.attributes?.name ?? null,
            website: json?.data?.attributes?.website ?? null,
            twitter: json?.data?.attributes?.twitter ?? null
        };
    } catch (error) {
        console.error('Error fetching scanlation group:', error);
        return null;
    }
}

export async function loadRandomManga(): Promise<MangaPageData | null> {
    // 1. Get random manga
    const manga = await getRandomManga();
    if (!manga) return null;

    // 2. Get wrong answers
    const wrongAnswers = await getWrongAnswers(3, manga.title);

    // 3. Get chapters
    const chapters = await getMangaChapters(manga.id);
    if (chapters.length === 0 ) return null;

    // 4. Pick random chapter
    const randomIndex = Math.floor(Math.random() * chapters.length);
    const chapterId = chapters[randomIndex].id;

    // 5. Get image server info
    const serverInfo = await getChapterServer(chapterId);
    if (!serverInfo || !serverInfo.baseUrl || !serverInfo.hash || serverInfo.dataSaver.length === 0) {
        return null;
    }

    // 6. Get random page
    const pageIndex = Math.floor(Math.random() * serverInfo.dataSaver.length);
    const pagePath = serverInfo.dataSaver[pageIndex];
    const imageUrl = `${serverInfo.baseUrl}/data-saver/${serverInfo.hash}/${pagePath}`;

    // 7. Get scanlation info
    const scanlation = await getChapterScanlation(chapterId);
    const scanlationGroup = scanlation.id 
    ? await getScanlationGroup(scanlation.id) 
    : null;

    // If we have scanlation name but not full group, create partial object
    const finalScanlationGroup = scanlationGroup || (scanlation.name ? {
        id: scanlation.id || '',
        name: scanlation.name || '',
        website: null,
        twitter: null
    } : null);

    return {
        manga,
        chapterId,
        imageUrl,
        scanlationGroup: finalScanlationGroup,
        wrongAnswers
    };
}