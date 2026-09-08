

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

function validateId(isu = '') {
    if (!/^\d{5,7}$/.test(isu)) return false;
    return true;
}

function validateFio(fio=''){
    try{
        parseInt(fio)
    }catch(e){
        return false;
    }
    return fio.trim().split(/\s+/).filter(Boolean).length >= 1;
}

function validateGrid(grid=''){
    try{
        parseInt(grid)
    }catch(e){
        return false;
    }
    return (grid.split(" ").length === 1 && /^[A-Z][0-9]{4}[a-z]?$/.test(grid));
}

function validateDnum(dnum = '') {
    if (!dnum || !/^\d+$/.test(dnum)) return false;
    const num = Number(dnum);
    return num >= 1 && num <= 100;
}

function validateRoom(room = '') {
    if (!room || room.includes(' ')) return false;
    const match = room.match(/^(\d{3,4})([а-яёa-z])?$/);
    if (!match) return false;
    const num = parseInt(match[1], 10);
    if (num < 101 || num > 9999) return false;
    return true;
}

function validateExpdate(expdate = '') {
    if (!expdate) return false;

    const datePattern = /^\d{4}-\d{2}-\d{2}$/;
    if (!datePattern.test(expdate)) return false;

    const parts = expdate.split('-').map(Number);
    const year = parts[0];
    const month = parts[1] - 1;
    const day = parts[2];
    const date = new Date(year, month, day);

    if (date.getFullYear() !== year ||
        date.getMonth() !== month ||
        date.getDate() !== day) {
        return false;
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    if (date < today) return false;

    return true;
}