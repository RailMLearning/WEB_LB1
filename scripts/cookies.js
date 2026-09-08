document.querySelector("#form-modal").
    addEventListener(
        "submit",
        async () => {

            event.preventDefault();

            let form = document.querySelector("#form-modal")

            const data = new FormData(form);

            await cookieStore.set({
                "isu": data.get("isu"),
                "fio": data.get("isu"),
                
            })

        }
    )