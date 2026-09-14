
document.getElementById('table-students').
    addEventListener(
        "click",
        (event) => {
            let btn = event.target
            console.log(btn.getAttribute("id"), btn.getAttribute("id").includes("edit"))
            if (btn.getAttribute("id").includes("edit")) {
                openModal("form-modal")
                closeModal("wrapper-table")
            }

            if (btn.getAttribute("id").includes('more')) {
                getStudentById(btn.getAttribute("id").split("-")[1]).then(
                    s => {
                        console.log(s)
                        replaceWideTable(s)
                        openModal("more-info-modal")
                        closeModal("wrapper-table")
                    })
            }

            if (btn.getAttribute("id").includes('delete')) {
                getStudentById(btn.getAttribute("id").split("-")[1]).then(
                    async (s) => {
                        document.getElementById('cancel').setAttribute("for-id", s['isu'])
                    })
            }
        }
    )


document.getElementById('cancel').
    addEventListener(
        "click",
        (event) => {
            delteteStudentById(event.target.getAttribute("for-id"))
        }
    )
document.getElementById('form-save').
    addEventListener(
        "click",
        () => {
            closeModal("form-modal")
            openModal("wrapper-table")
        }
    )

