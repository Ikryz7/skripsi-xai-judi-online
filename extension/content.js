console.log("YouTube Detector Active");


// =====================================================
// STATE
// =====================================================

const processedComments = new WeakSet();
const explanationCache = new Map();


// =====================================================
// API
// =====================================================

function sendToAPI(action, text) {

    return new Promise((resolve) => {

        chrome.runtime.sendMessage(
            {
                action,
                text
            },
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


async function classify(text) {

    console.log("Mengirim:", text);

    const result = await sendToAPI(
        "predict",
        text
    );

    console.log(
        "Response:",
        result
    );

    return result;

}


async function explain(text) {

    // Gunakan cache supaya SHAP tidak dihitung
    // berulang kali untuk komentar yang sama.

    if (explanationCache.has(text)) {

        return explanationCache.get(text);

    }

    console.log(
        "Meminta SHAP:",
        text
    );

    const result = await sendToAPI(
        "explain",
        text
    );

    if (result) {

        explanationCache.set(
            text,
            result
        );

    }

    return result;

}


// =====================================================
// DETECT COMMENTS
// =====================================================

async function detectComments() {

    const comments =
        document.querySelectorAll("#content-text");


    for (const comment of comments) {

        // Jangan proses elemen yang sama
        // lebih dari satu kali.

        if (processedComments.has(comment)) {
            continue;
        }


        const text =
            comment.innerText.trim();


        // Kalau komentar belum memiliki teks,
        // jangan tandai sebagai sudah diproses.

        if (!text) {
            continue;
        }


        processedComments.add(comment);


        const result =
            await classify(text);


        if (
            result &&
            result.label === 1
        ) {

            blurComment(comment);

            createExplanationUI(
                comment,
                text,
                result
            );

        }

    }

}


// =====================================================
// BLUR
// =====================================================

function blurComment(comment) {

    comment.style.filter =
        "blur(8px)";

    comment.style.transition =
        "filter 0.3s ease";

}


// =====================================================
// UI
// =====================================================

function createExplanationUI(
    comment,
    text,
    prediction
) {

    // Jangan membuat UI dua kali.

    const parent =
        comment.parentElement;

    if (
        parent.querySelector(
            ".judol-info"
        )
    ) {

        return;

    }


    // =================================================
    // CONTAINER
    // =================================================

    const wrapper =
        document.createElement("div");

    wrapper.className =
        "judol-info";


    // =================================================
    // HEADER
    // =================================================

    const header =
        document.createElement("div");

    header.className =
        "judol-header";


    const title =
        document.createElement("div");

    title.className =
        "judol-title";

    title.innerHTML =
        "⚠️ Komentar disembunyikan";


    const confidence =
        document.createElement("div");

    confidence.className =
        "judol-confidence";

    confidence.textContent =
        "Keyakinan " +
        (
            prediction.probability * 100
        ).toFixed(0) +
        "%";


    header.appendChild(title);

    header.appendChild(
        confidence
    );


    // =================================================
    // DESCRIPTION
    // =================================================

    const description =
        document.createElement("div");

    description.className =
        "judol-description";

    description.textContent =
        "Komentar ini terindikasi " +
        "sebagai promosi judi online.";


    // =================================================
    // ACTIONS
    // =================================================

    const actions =
        document.createElement("div");

    actions.className =
        "judol-actions";


    // -----------------------------
    // SHOW BUTTON
    // -----------------------------

    const showButton =
        document.createElement("button");

    showButton.className =
        "judol-button secondary";

    showButton.textContent =
        "Tampilkan";


    showButton.addEventListener(
        "click",
        () => {

            const blurred =
                comment.style.filter ===
                "blur(8px)";


            if (blurred) {

                comment.style.filter =
                    "none";

                showButton.textContent =
                    "Sembunyikan";

            }
            else {

                blurComment(comment);

                showButton.textContent =
                    "Tampilkan";

            }

        }
    );


    // -----------------------------
    // WHY BUTTON
    // -----------------------------

    const whyButton =
        document.createElement("button");

    whyButton.className =
        "judol-button primary";

    whyButton.textContent =
        "Mengapa?";


    actions.appendChild(
        showButton
    );

    actions.appendChild(
        whyButton
    );


    // =================================================
    // EXPLANATION PANEL
    // =================================================

    const explanationPanel =
        document.createElement("div");

    explanationPanel.className =
        "judol-explanation";

    explanationPanel.hidden =
        true;


    whyButton.addEventListener(
        "click",
        async () => {

            if (
                !explanationPanel.hidden
            ) {

                explanationPanel.hidden =
                    true;

                whyButton.textContent =
                    "Mengapa?";

                return;

            }


            explanationPanel.hidden =
                false;

            whyButton.textContent =
                "Tutup";


            explanationPanel.innerHTML = `
                <div class="judol-loading">
                    Menganalisis alasan...
                </div>
            `;


            const result =
                await explain(text);


            if (!result) {

                explanationPanel.innerHTML = `
                    <div class="judol-error">
                        Penjelasan tidak dapat dimuat.
                        Pastikan server berjalan.
                    </div>
                `;

                return;

            }


            renderExplanation(
                explanationPanel,
                result
            );

        }
    );


    // =================================================
    // ASSEMBLE
    // =================================================

    wrapper.appendChild(
        header
    );

    wrapper.appendChild(
        description
    );

    wrapper.appendChild(
        actions
    );

    wrapper.appendChild(
        explanationPanel
    );


    parent.appendChild(
        wrapper
    );

}


// =====================================================
// RENDER SHAP EXPLANATION
// =====================================================

function renderExplanation(
    container,
    result
) {

    const explanation =
        Array.isArray(
            result.explanation
        )
            ? result.explanation
            : [];


    // Ambil token dengan pengaruh
    // paling besar terhadap prediksi.

    const importantTokens =
        explanation
            .filter(
                item =>
                    item.token &&
                    item.token.trim() !== ""
            )
            .sort(
                (a, b) =>
                    Math.abs(b.importance) -
                    Math.abs(a.importance)
            )
            .slice(0, 5);


    if (
        importantTokens.length === 0
    ) {

        container.innerHTML = `
            <div class="judol-error">
                Tidak ditemukan indikator
                yang dapat ditampilkan.
            </div>
        `;

        return;

    }


    // =================================================
    // SIMPLE EXPLANATION
    // =================================================

    const heading =
        document.createElement("div");

    heading.className =
        "judol-explanation-title";

    heading.textContent =
        "Mengapa komentar ini disembunyikan?";


    const intro =
        document.createElement("div");

    intro.className =
        "judol-explanation-text";

    intro.textContent =
        "Model menemukan beberapa kata " +
        "yang paling berpengaruh terhadap " +
        "keputusan ini:";


    const tokenList =
        document.createElement("div");

    tokenList.className =
        "judol-token-list";


    importantTokens.forEach(
        item => {

            const token =
                document.createElement("span");

            token.className =
                item.importance >= 0
                    ? "judol-token positive"
                    : "judol-token negative";

            token.textContent =
                `"${item.token}"`;


            tokenList.appendChild(
                token
            );

        }
    );


    const explanationText =
        document.createElement("div");

    explanationText.className =
        "judol-explanation-text";


    const hasPositive =
        importantTokens.some(
            item =>
                item.importance > 0
        );


    if (hasPositive) {

        explanationText.textContent =
            "Kata-kata tersebut memberikan " +
            "pengaruh terhadap keputusan model " +
            "untuk mengategorikan komentar sebagai " +
            "judi online.";

    }
    else {

        explanationText.textContent =
            "Model menggunakan kombinasi " +
            "kata dalam komentar untuk menentukan " +
            "kategori.";

    }


    // =================================================
    // TECHNICAL SECTION
    // =================================================

    const technicalButton =
        document.createElement("button");

    technicalButton.className =
        "judol-technical-button";

    technicalButton.textContent =
        "Detail teknis (SHAP)";


    const technicalPanel =
        document.createElement("div");

    technicalPanel.className =
        "judol-technical";

    technicalPanel.hidden =
        true;


    technicalButton.addEventListener(
        "click",
        () => {

            technicalPanel.hidden =
                !technicalPanel.hidden;


            technicalButton.textContent =
                technicalPanel.hidden
                    ? "Detail teknis (SHAP)"
                    : "Sembunyikan detail teknis";

        }
    );


    importantTokens.forEach(
        item => {

            const row =
                document.createElement("div");

            row.className =
                "judol-shap-row";


            const token =
                document.createElement("span");

            token.className =
                "judol-shap-token";

            token.textContent =
                item.token;


            const value =
                document.createElement("span");

            value.className =
                item.importance >= 0
                    ? "judol-shap-value positive"
                    : "judol-shap-value negative";

            value.textContent =
                (
                    item.importance >= 0
                        ? "+"
                        : ""
                ) +
                item.importance.toFixed(3);


            row.appendChild(
                token
            );

            row.appendChild(
                value
            );


            technicalPanel.appendChild(
                row
            );

        }
    );


    // =================================================
    // LEGEND
    // =================================================

    const legend =
        document.createElement("div");

    legend.className =
        "judol-legend";

    legend.innerHTML = `
        <span>
            <b class="positive-text">+</b>
            mendukung prediksi Judi Online
        </span>

        <span>
            <b class="negative-text">−</b>
            mengurangi dukungan terhadap prediksi
        </span>
    `;


    // =================================================
    // ASSEMBLE
    // =================================================

    container.innerHTML = "";

    container.appendChild(
        heading
    );

    container.appendChild(
        intro
    );

    container.appendChild(
        tokenList
    );

    container.appendChild(
        explanationText
    );

    container.appendChild(
        technicalButton
    );

    container.appendChild(
        technicalPanel
    );

    container.appendChild(
        legend
    );

}


// =====================================================
// YOUTUBE DYNAMIC COMMENTS
// =====================================================

let detectTimer = null;


function scheduleDetection() {

    clearTimeout(
        detectTimer
    );


    detectTimer =
        setTimeout(
            () => {

                detectComments();

            },
            700
        );

}


// MutationObserver digunakan karena YouTube
// memuat komentar secara dinamis.

const observer =
    new MutationObserver(
        () => {

            scheduleDetection();

        }
    );


observer.observe(
    document.body,
    {
        childList: true,
        subtree: true
    }
);


// Jalankan setelah halaman siap.

setTimeout(
    detectComments,
    3000
);