
document.getElementById('table-students').
    addEventListener(
        "click",
        (event) => {
            let btn = event.target
            console.log(btn.getAttribute("id"), btn.getAttribute("id").includes("edit"))
            if(btn.getAttribute("id").includes("edit")){
                openModal("form-modal")
                closeModal("wrapper-table")
            }

            if(btn.getAttribute("id").includes('more')){
                openModal("more-info-modal")
                closeModal("wrapper-table")
            }
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