console.log("YouTube Detector Active");


async function classify(text){

    try{

        console.log("Mengirim:", text);

        const response = await fetch(
            "http://127.0.0.1:8000/predict",
            {
                method: "POST",
                headers:{
                    "Content-Type":"application/json"
                },
                body: JSON.stringify({
                    text: text
                })
            }
        );

        console.log("Status:", response.status);

        const data = await response.json();

        console.log("Response:", data);

        return data;

    }
    catch(error){

        console.error("ERROR:", error);

        return null;

    }

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
                text,
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

async function explain(text){

    try{

        const response = await fetch(
            "http://127.0.0.1:8000/explain",
            {
                method:"POST",

                headers:{
                    "Content-Type":"application/json"
                },

                body:JSON.stringify({
                    text:text
                })
            }
        );

        return await response.json();

    }

    catch(error){

        console.error(error);

        return null;

    }

}

function createExplanationUI(comment, text, prediction){

    // Jangan membuat tombol dua kali
    if(comment.parentElement.querySelector(".judol-info")){
        return;
    }

    const container = document.createElement("div");

    container.className = "judol-info";

    container.style.marginTop = "8px";
    container.style.padding = "8px";
    container.style.border = "1px solid #d32f2f";
    container.style.borderRadius = "6px";
    container.style.background = "#fff5f5";
    container.style.fontSize = "13px";

    container.innerHTML = `
        <div style="color:#d32f2f;font-weight:bold;">
            ⚠ Komentar terindikasi promosi judi online
        </div>

        <div style="margin-top:4px;">
            Confidence :
            ${(prediction.probability*100).toFixed(2)}%
        </div>
    `;

    // Tombol tampilkan komentar
    const showBtn = document.createElement("button");

    showBtn.innerText = "Tampilkan Komentar";

    showBtn.style.marginTop = "8px";
    showBtn.style.marginRight = "8px";

    showBtn.onclick = () => {

        if(comment.style.filter === "none"){

            comment.style.filter = "blur(8px)";

            showBtn.innerText = "Tampilkan Komentar";

        }
        else{

            comment.style.filter = "none";

            showBtn.innerText = "Sembunyikan Komentar";

        }

    };

    // Tombol SHAP
    const explainBtn = document.createElement("button");

    explainBtn.innerText = "Lihat Alasan";

    explainBtn.style.marginTop = "8px";

    const explanation = document.createElement("div");

    explanation.style.marginTop = "10px";

    explainBtn.onclick = async ()=>{

        explainBtn.disabled = true;

        explainBtn.innerText = "Loading...";

        const result = await explain(text);

        explainBtn.innerText = "Lihat Alasan";

        explainBtn.disabled = false;

        explanation.innerHTML = "";

        result.explanation.forEach(item=>{

            const row = document.createElement("div");

            const color =
                item.importance >= 0
                ? "#d32f2f"
                : "#2e7d32";

            row.innerHTML = `
                <span style="display:inline-block;width:120px;color:${color};font-weight:bold;">
                    ${item.token}
                </span>

                <span style="color:${color}">
                    ${item.importance.toFixed(4)}
                </span>
            `;

            explanation.appendChild(row);

        });

    };

    container.appendChild(showBtn);

    container.appendChild(explainBtn);

    container.appendChild(explanation);

    comment.parentElement.appendChild(container);

}