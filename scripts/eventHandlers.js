
document.getElementById('form-modal').
    addEventListener(
        "click",
        (event) => {
            let btn = event.target
            
            if(btn.getAttribute("id").includes("edit")){
                openModal("form-modal")
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