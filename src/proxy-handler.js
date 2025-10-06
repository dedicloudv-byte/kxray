import { Buffer } from 'buffer';

// A reliable public source for VLESS subscription data
const VLESS_SUB_URL = "https://raw.githubusercontent.com/barry-far/V2ray-Configs/main/All_Configs_base64.txt";

/**
 * Fetches and decodes the VLESS subscription list.
 * The source provides a base64 encoded list of VLESS links.
 */
async function getVlessServers() {
    try {
        const response = await fetch(VLESS_SUB_URL);
        if (!response.ok) {
            throw new Error(`Failed to fetch VLESS list: ${response.statusText}`);
        }
        const base64Data = await response.text();
        const decodedData = Buffer.from(base64Data, 'base64').toString('utf-8');

        // Return an array of individual VLESS links
        return decodedData.split('\n').filter(link => link.startsWith('vless://'));
    } catch (error) {
        console.error("Error fetching VLESS servers:", error);
        return [];
    }
}

/**
 * Generates a filtered subscription list.
 * @param {string[]} countryCodes - An array of country codes to filter by (e.g., ['ID', 'SG']).
 * @returns {string} - A base64 encoded string of the filtered VLESS links.
 */
export async function generateSubscription(countryCodes) {
    const allServers = await getVlessServers();

    let filteredServers = allServers;

    if (countryCodes.length > 0) {
        filteredServers = allServers.filter(link => {
            // Extract the server name (alias) from the link
            const alias = decodeURIComponent(link.split('#')[1] || '');
            // Check if the alias contains any of the provided country codes
            return countryCodes.some(cc => alias.toUpperCase().includes(cc));
        });
    }

    // Join the filtered links and encode the result in base64
    const result = filteredServers.join('\n');
    return Buffer.from(result).toString('base64');
}