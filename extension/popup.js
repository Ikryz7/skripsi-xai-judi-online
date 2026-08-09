const statusDiv = document.getElementById("status");

document
.getElementById("check")
.addEventListener("click", async () => {

    try{

        const response = await fetch(
            "http://127.0.0.1:8000/"
        );

        const data = await response.json();

        statusDiv.innerText =
            "🟢 " + data.message;

    }

    catch(error){

        statusDiv.innerText =
            "🔴 API Offline";

    }

});