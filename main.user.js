// ==UserScript==
// @name         QR Code Decoder
// @namespace    http://tampermonkey.net/
// @version      0.1
// @description  Decode QR codes found on web pages and display their content.
// @author       捈荼
// @match        *://*/*
// @grant        none
// @require      https://unpkg.com/jsqr
// ==/UserScript==

(function() {
    'use strict';

    window.addEventListener('load', function() {
        // Find all images on the page
        const images = document.querySelectorAll('img');
        images.forEach((img) => {
            // Create a canvas to draw the image and decode the QR code
            const canvas = document.createElement('canvas');
            const context = canvas.getContext('2d');
            img.crossOrigin = "Anonymous"; // Handle CORS policy
            img.onload = () => {
                canvas.width = img.width;
                canvas.height = img.height;
                context.drawImage(img, 0, 0, img.width, img.height);
                const imageData = context.getImageData(0, 0, canvas.width, canvas.height);
                const code = jsQR(imageData.data, imageData.width, imageData.height, {
                    inversionAttempts: "dontInvert",
                });
                if (code) {
                    displayCode(img, code.data);
                }
            };
            img.src = img.src; // Trigger img.onload
        });
    });

    // Function to display the decoded text below the QR code image
    function displayCode(img, text) {
        const div = document.createElement('div');
        const uniqueId = `qr-${Date.now()}`; // Generate a unique ID for matching

        img.setAttribute('data-qr-id', uniqueId); // Set unique ID on the image
        div.setAttribute('data-qr-id', uniqueId); // Set the same unique ID on the div

        //div.textContent = `QR Code Content: ${text}`;
            // Check if the decoded text is a URL
        if (/^(http|https):\/\/[^ "]+$/.test(text)) {
            const link = document.createElement('a');
            link.href = text;
            link.textContent = `QR Code URL: ${text}`;
            link.target = '_blank'; // Open in a new tab
            div.appendChild(link);
        } else {
            div.textContent = `QR Code Content: ${text}`;
        }
        div.style.padding = '5px';
        div.style.border = '1px solid #ddd';
        div.style.marginTop = '5px';
        div.style.backgroundColor = '#f9f9f9';
        div.style.userSelect = 'text'; // Important for text selection
        div.style.cursor = 'text'; // Change cursor to indicate text can be selected
        div.style.whiteSpace = 'pre-wrap'; // Ensure long URLs do not overflow
        img.parentNode.insertBefore(div, img.nextSibling);
    }
    // After setting up the event listener for window load
    observeDOMChanges();
})();

function observeDOMChanges() {
    const observer = new MutationObserver((mutationsList) => {
        for (let mutation of mutationsList) {
            if (mutation.type === 'childList') {
                mutation.removedNodes.forEach(node => {
                    // Check if the removed node is an image with a data-qr-id attribute
                    if (node.nodeName === 'IMG' && node.hasAttribute('data-qr-id')) {
                        const qrId = node.getAttribute('data-qr-id');
                        // Find and remove the associated div with the decoded content
                        const associatedDiv = document.querySelector(`div[data-qr-id="${qrId}"]`);
                        if (associatedDiv) {
                            associatedDiv.remove();
                        }
                    }
                });
            }
        }
    });

    // Start observing the document body for DOM changes
    //observer.observe(document.body, { childList: true, subtree: true });
    observer.observe(document.body, { childList: true, subtree: true, attributes: true, attributeFilter: ['src'] });
}
