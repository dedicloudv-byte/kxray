document.addEventListener('DOMContentLoaded', () => {
    const generateBtn = document.getElementById('generate-btn');
    const copyBtn = document.getElementById('copy-btn');
    const countryFilterInput = document.getElementById('country-filter');
    const resultArea = document.getElementById('result-area');
    const subLinkElement = document.getElementById('sub-link');

    generateBtn.addEventListener('click', () => {
        // Get the country codes, trim whitespace, and convert to uppercase.
        const countryFilter = countryFilterInput.value.trim().toUpperCase();

        // Construct the full, usable subscription URL.
        // This is the URL that users will paste into their client's subscription settings.
        const subUrl = new URL('/api/v1/sub', window.location.origin);
        if (countryFilter) {
            subUrl.searchParams.set('cc', countryFilter);
        }

        // Display the final subscription URL to the user.
        subLinkElement.textContent = subUrl.toString();
        resultArea.classList.remove('hidden');
    });

    copyBtn.addEventListener('click', () => {
        const linkToCopy = subLinkElement.textContent;
        if (linkToCopy) {
            navigator.clipboard.writeText(linkToCopy).then(() => {
                const originalIcon = copyBtn.innerHTML;
                copyBtn.innerHTML = '✅';
                setTimeout(() => {
                    copyBtn.innerHTML = originalIcon;
                }, 1500);
            }).catch(err => {
                console.error('Failed to copy link: ', err);
                alert('Failed to copy link.');
            });
        }
    });
});