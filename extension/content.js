console.log("YouTube Detector Active");


function injectStyles() {

    const style = document.createElement("style");

    style.textContent = `
        .judol-info {
            margin-top: 10px;
            padding: 10px 12px;
            border-radius: 10px;
            background: rgba(244, 67, 54, 0.09);
            border: 1px solid rgba(244, 67, 54, 0.35);
            font-family: "Roboto", Arial, sans-serif;
            font-size: 12px;
            display: flex;
            align-items: center;
            gap: 10px;
            flex-wrap: wrap;
            animation: judol-fade .3s ease;
        }

        @keyframes judol-fade {
            from { opacity: 0; transform: translateY(-4px); }
            to   { opacity: 1; transform: translateY(0); }
        }

        .judol-badge {
            font-weight: 600;
            color: #ff5252;
            display: inline-flex;
            align-items: center;
            gap: 5px;
        }

        .judol-conf {
            color: var(--yt-spec-text-secondary, rgba(255, 255, 255, 0.6));
            font-size: 11px;
        }

        .judol-btn {
            margin-left: auto;
            border: none;
            border-radius: 999px;
            padding: 6px 14px;
            font-size: 12px;
            font-weight: 600;
            cursor: pointer;
            background: #ff5252;
            color: #fff;
            transition: background .2s, transform .1s;
        }

        .judol-btn:hover  { background: #ff1744; }
        .judol-btn:active { transform: scale(.95); }

        .judol-btn.shown {
            background: rgba(128, 128, 128, 0.25);
            color: var(--yt-spec-text-primary, #fff);
        }

        .judol-btn.shown:hover {
            background: rgba(128, 128, 128, 0.4);
        }
    `;

    document.head.appendChild(style);

}

injectStyles();


function sendToAPI(action, text) {

    return new Promise((resolve) => {

        chrome.runtime.sendMessage(
            { action, text },
            (result) => {

                if (chrome.runtime.lastError) {

                    console.error(
                        "ERROR:",
                        chrome.runtime.lastError.message
                    );

                    resolve(null);

                    return;

                }

                resolve(result);

            }
        );

    });

}

async function classify(text){

    console.log("Mengirim:", text);

    const result = await sendToAPI("predict", text);

    if (result) {
        console.log("Response:", result);
    }
    else {
        console.log("Response: null");
    }

    return result;

}

async function detectComments(){

    const comments = document.querySelectorAll("#content-text");

    for(const comment of comments){

        // Sudah pernah diproses?
        if(comment.dataset.checked === "true"){
            continue;
        }

        comment.dataset.checked = "true";

        const text = comment.innerText.trim();

        if(text.length === 0){
            continue;
        }

        const result = await classify(text);

       if(result && result.label === 1){

            comment.style.filter = "blur(8px)";
            comment.style.transition = "0.3s";

            createExplanationUI(
                comment,
                result
            );

        }

    }

}

setTimeout(detectComments,5000);

const observer = new MutationObserver(() => {
    detectComments();
});

observer.observe(document.body, {
    childList: true,
    subtree: true
});

// Jalankan sekali saat halaman pertama kali dimuat
detectComments();

function createExplanationUI(comment, prediction){

    if (comment.parentElement.querySelector(".judol-info")) {
        return;
    }

    const wrapper = document.createElement("div");
    wrapper.className = "judol-info";

    const badge = document.createElement("span");
    badge.className = "judol-badge";
    badge.innerHTML = "&#9888;&#65039; Terindikasi promosi judi online";

    const conf = document.createElement("span");
    conf.className = "judol-conf";
    conf.textContent = "Keyakinan " + (prediction.probability * 100).toFixed(0) + "%";

    const btn = document.createElement("button");
    btn.className = "judol-btn";
    btn.textContent = "Tampilkan";

    btn.addEventListener("click", () => {

        const showing = comment.style.filter !== "blur(8px)";

        comment.style.filter = showing ? "blur(8px)" : "";

        btn.textContent = showing ? "Tampilkan" : "Sembunyikan";

        btn.classList.toggle("shown", showing);

    });

    wrapper.appendChild(badge);
    wrapper.appendChild(conf);
    wrapper.appendChild(btn);

    comment.parentElement.appendChild(wrapper);

}