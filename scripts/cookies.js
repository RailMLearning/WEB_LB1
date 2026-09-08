document.querySelector("#form-modal").
    addEventListener(
        "submit",
        async (event) => {
            hideError()
            event.preventDefault();

            let form = document.querySelector("#studform")

            const data = new FormData(form);
            
            if(!validateId(data.get("isu"))){
                showError("Неверный ИСУ ID")
                return false;
            }
            await cookieStore.set({
                "isu": data.get("isu"),
                "fio": data.get("fio"),

            })

            closeModal("#form-modal")
        }
    )