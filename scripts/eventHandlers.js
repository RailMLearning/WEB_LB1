
document.getElementById('table-students').
    addEventListener(
        "click",
        (event) => {
            let btn = event.target
            if (!btn.id) return;
            console.log(btn.getAttribute("id"), btn.getAttribute("id").includes("edit"))
            if (btn.getAttribute("id").includes("edit")) {
                openModal("form-modal")
                closeModal("wrapper-table")
            }

            if (btn.getAttribute("id").includes('more')) {
                showStudentDetailsById(btn.id.slice(5));
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
document.getElementById('form-save')?.
    addEventListener(
        "click",
        () => {
            closeModal("form-modal")
            openModal("wrapper-table")
        }
    )

