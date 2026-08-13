const API_URL = "http://127.0.0.1:8000";

async function apiRequest(endpoint, text) {

    const response = await fetch(
        `${API_URL}${endpoint}`,
        {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({ text })
        }
    );

    if (!response.ok) {
        throw new Error(`API ${response.status}`);
    }

    return response.json();

}

chrome.runtime.onMessage.addListener(
    (message, sender, sendResponse) => {

        if (message.action === "predict") {

            apiRequest("/predict", message.text)
                .then(sendResponse)
                .catch(() => sendResponse(null));

            return true;

        }

        if (message.action === "explain") {

            apiRequest("/explain", message.text)
                .then(sendResponse)
                .catch(() => sendResponse(null));

            return true;

        }

    }
);