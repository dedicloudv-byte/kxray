document.addEventListener('DOMContentLoaded', () => {
    const copyButton = document.getElementById('copy-button');
    const vlessLink = document.getElementById('vless-link');

    if (copyButton && vlessLink) {
        copyButton.addEventListener('click', () => {
            const textToCopy = vlessLink.innerText;
            navigator.clipboard.writeText(textToCopy).then(() => {
                // Visual feedback
                const originalText = copyButton.innerHTML;
                copyButton.innerHTML = '✅';
                setTimeout(() => {
                    copyButton.innerHTML = originalText;
                }, 1500);
            }).catch(err => {
                console.error('Failed to copy text: ', err);
            });
        });
    }
});