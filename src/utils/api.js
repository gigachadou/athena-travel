/**
 * Wikipedia REST API helper
 * https://en.wikipedia.org/api/rest_v1/page/summary/{title}
 */

const stripHtml = (html) => {
  if (!html) return '';
  return html.replace(/<[^>]*>?/gm, '');
};

const OTM_API_KEY = '5ae2e3f221c38a28845f05b630e666a7cb84995a5fbb5c64c511394a'; // Public Demo Key

/**
 * Wikipedia summary with language fallback
 */
export const fetchWikipediaSummary = async (title, lang = 'uz') => {
  try {
    const formattedTitle = title.replace(/ /g, '_');
    // Primary language fetch
    let response = await fetch(`https://${lang}.wikipedia.org/api/rest_v1/page/summary/${formattedTitle}`, {
      headers: { 'User-Agent': 'YolchiAI/1.0' }
    });

    // Fallback to English if primary language fails or is too short
    if (!response.ok && lang !== 'en') {
      response = await fetch(`https://en.wikipedia.org/api/rest_v1/page/summary/${formattedTitle}`, {
        headers: { 'User-Agent': 'YolchiAI/1.0' }
      });
    }

    if (!response.ok) throw new Error(`Wikipedia API error: ${response.status}`);

    const data = await response.json();
    return {
      title: stripHtml(data.displaytitle || data.title),
      extract: stripHtml(data.extract),
      thumbnail: data.thumbnail?.source || null,
      originalImage: data.originalimage?.source || null,
      description: stripHtml(data.description) || '',
      link: data.content_urls?.desktop?.page || null,
      lang: data.lang || lang
    };
  } catch (error) {
    // 404 means no article found, graceful fallback to handle internally without scaring the user
    return null;
  }
};

/**
 * OpenTripMap API Integration
 */
export const fetchPlacesFromOTM = async (lat, lon, categories = 'historical_places,museums,hotels,restaurants,parks') => {
  try {
    const radius = 5000; // 5km
    const limit = 10;
    const url = `https://api.opentripmap.com/0.1/en/places/radius?radius=${radius}&lon=${lon}&lat=${lat}&kinds=${categories}&format=json&limit=${limit}&apikey=${OTM_API_KEY}`;
    
    const response = await fetch(url);
    if (response.status === 401) {
      return []; // graceful fallback when API key is expired/invalid
    }
    if (!response.ok) throw new Error(`OTM API error: ${response.status}`);
    
    return await response.json();
  } catch (error) {
    console.error('Error fetching OTM data:', error);
    return [];
  }
};

export const getPlaceDetailsOTM = async (xid) => {
  try {
    const url = `https://api.opentripmap.com/0.1/en/places/xid/${xid}?apikey=${OTM_API_KEY}`;
    const response = await fetch(url);
    return await response.json();
  } catch (error) {
    console.error('Error fetching OTM details:', error);
    return null;
  }
};

export const searchWikipedia = async (query, lang = 'uz') => {
  try {
    const response = await fetch(`https://${lang}.wikipedia.org/w/api.php?action=opensearch&format=json&origin=*&search=${encodeURIComponent(query)}&limit=5`);
    const data = await response.json();
    if (data[1] && data[1].length > 0) return data[1][0];
    return null;
  } catch (error) {
    return null;
  }
};
