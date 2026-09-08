

function showError(e = "") {
    err = document.getElementById("error")
    err.innerHTML = e
    err.classList.add("err-active")
    err.classList.remove("err-inactive")
}
function hideError() {
    err = document.getElementById("error")
    err.innerHTML = ""
    err.classList.add("err-inactive")
    err.classList.remove("err-active")
}

function validateId(isu = '') {
    try {
        parseInt(isu)
    } catch (e) {
        return false;
    }
    return (5 <= isu.length <= 7)
}

function addShortTableRow(data = {
    "isu": "",
    "fio": "",
    "dnum": "",
    "rnum": ""
}) {
    document.getElementById("table-students").
        innerHTML += `
        <tr>
                            <td class="panel">
                                <button type="button" class="btn btn-edit" id="edit-${data.isu}"
                                    onclick="openModal('form-modal')">Изменить</button>
                                <button type="button" class="btn btn-delete" id="delete-${data.isu}"
                                    onclick="openModal('confirm-modal')">Удалить</button>
                                <button type="button" class="btn btn-more" id="more-${data.isu}"
                                    onclick="openModal('more-info-modal')">Подробнее...</button>
                            </td>
                            <td>${data.fio}</td>
                            <td>${data.isu}</td>
                            <td>${data.dnum}</td>
                            <td>${data.rnum}</td>
                        </tr>
        `
}

function replaceWideTable(data = {
    "isu": "",
    "fio": "",
    "gr_id": "",
    "dnum": "",
    "rnum": "",
    "foreigner": "",
    "notes": ""
}) {
    document.getElementById("")
}

async function getStudentById(isu){

    let res = {}

    let cookies = await cookieStore.getAll()
    cookies.forEach(c => {
        if(c.name.includes(isu)) res[c.name.split("_")[0]]=c.value
    })

    return res;
}

async function getAllIds(){
    let res = []
    
    let cookies = await cookieStore.getAll()
    cookies.forEach(c => {
        if(c.name.includes("isu_isu")) res.push(c.name.substring(7))
    })
    return res
}

function updateTables() {

    getAllIds().then(ids => {
        ids.forEach(id => {
            getStudentById(id).then(s => {
                 addShortTableRow(s)
            })
        })
    })
}