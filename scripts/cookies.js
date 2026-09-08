document.querySelector("#form-modal").
    addEventListener(
        "submit",
        async (event) => {
            hideError()
            event.preventDefault();

            let form = document.querySelector("#studform")

            const data = new FormData(form);


            //валидация данных формы перед отправкой в куки

            if (!validateId(data.get("isu"))) {
                showError("Неверный ИСУ ID, введите от 5 до 7 цифр")
                return false;
            }
            console.log(data.keys())
            for (let key of data.keys()) {

                await cookieStore.set({
                    "name": `${key}_isu${data.get("isu")}`,
                    "value": data.get(key),
                    expires: Date.now() + 24 * 60 * 60 * 1000, // 1 день
                    path: '/'
                })
            }
            closeModal("#form-modal")
        }
    )

cookieStore.addEventListener(
    "change",
    (event) => {

        updateTable()

    }
)