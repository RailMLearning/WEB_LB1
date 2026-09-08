

function showError(e=""){
    err = document.getElementById("error")
    err.innerHTML = e
    err.classList.add("err-active")
    err.classList.remove("err-inactive")
}
function hideError(){
    err = document.getElementById("error")
    err.innerHTML = ""
    err.classList.add("err-inactive")
    err.classList.remove("err-active")
}

function validateId(isu=''){
    try{
        parseInt(isu)
    }catch(e){
        return false;
    }
    return (isu.length == 6)
}