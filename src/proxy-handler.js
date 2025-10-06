import { Buffer } from 'buffer';

// An array of reliable public sources for VLESS subscription data
const VLESS_SOURCES = [
    "https://raw.githubusercontent.com/barry-far/V2ray-Configs/main/All_Configs_base64.txt",
    "https://raw.githubusercontent.com/sevcator/5ubscrpt10n/main/protocols/vl.txt"
];

/**
 * Fetches VLESS links from a given URL.
 * It handles both plain text lists and base64 encoded lists.
 * @param {string} url - The URL of the subscription source.
 * @returns {Promise<string[]>} - A promise that resolves to an array of VLESS links.
 */
async function fetchFromSource(url) {
    try {
        const response = await fetch(url);
        if (!response.ok) {
            console.error(`Failed to fetch from ${url}: ${response.statusText}`);
            return [];
        }
        const textData = await response.text();

        // Check if the data is likely base64 encoded. If so, decode it.
        // A simple check is to see if it's a single long string without newlines.
        if (!textData.includes('\n') && textData.length > 100) {
            const decodedData = Buffer.from(textData, 'base64').toString('utf-8');
            return decodedData.split('\n').filter(link => link.startsWith('vless://'));
        }

        // Otherwise, assume it's a plain text list.
        return textData.split('\n').filter(link => link.startsWith('vless://'));
    } catch (error) {
        console.error(`Error processing source ${url}:`, error);
        return [];
    }
}

/**
 * Fetches VLESS servers from all defined sources, merges them, and removes duplicates.
 */
async function getVlessServers() {
    // Fetch from all sources concurrently
    const promises = VLESS_SOURCES.map(url => fetchFromSource(url));
    const results = await Promise.all(promises);

    // Flatten the array of arrays into a single array
    const allLinks = results.flat();

    // Use a Set to automatically handle duplicates, then convert back to an array
    const uniqueLinks = [...new Set(allLinks)];

    console.log(`Fetched a total of ${uniqueLinks.length} unique VLESS servers.`);
    return uniqueLinks;
}

/**
 * Generates a filtered subscription list.
 * @param {string[]} countryCodes - An array of country codes to filter by (e.g., ['ID', 'SG']).
 * @returns {string} - A base64 encoded string of the filtered VLESS links.
 */
export async function generateSubscription(countryCodes) {
    const allServers = await getVlessServers();

    let filteredServers = allServers;

    if (countryCodes.length > 0 && countryCodes[0] !== '') {
        filteredServers = allServers.filter(link => {
            // Extract the server name (alias) from the link
            const alias = decodeURIComponent(link.split('#')[1] || '').toUpperCase();
            // Check if the alias contains any of the provided country codes
            return countryCodes.some(cc => alias.includes(cc));
        });
    }

    // Join the filtered links and encode the result in base64
    const result = filteredServers.join('\n');
    return Buffer.from(result).toString('base64');
}