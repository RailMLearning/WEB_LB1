let modalTrigger = null;
let modalBusy = false;

function openModal(id) {
    const modal = document.getElementById(id);
    if (modal.classList.contains("active")) return;
    modalTrigger = document.activeElement;
    for (const other of document.querySelectorAll(".modal")) {
        other.classList.remove("active");
        other.inert = true;
        other.setAttribute("aria-hidden", "true");
    }
    document.getElementById("student-list").inert = true;
    modal.inert = false;
    modal.setAttribute("aria-hidden", "false");
    modal.classList.add("active");
    modal.querySelector("input, button")?.focus();
}

function closeModal(id) {
    if (modalBusy) return;
    const modal = document.getElementById(id);
    modal.classList.remove("active");
    modal.inert = true;
    modal.setAttribute("aria-hidden", "true");
    document.getElementById("student-list").inert = false;
    if (modalTrigger?.isConnected) modalTrigger.focus();
    else document.getElementById("btn-add").focus();
}

document.addEventListener("keydown", event => {
    const modal = document.querySelector(".modal.active");
    if (!modal) return;
    if (event.key === "Escape") closeModal(modal.id);
    if (event.key !== "Tab") return;
    const controls = [...modal.querySelectorAll("input, textarea, button")].filter(control => !control.disabled);
    if (!controls.length) return;
    const first = controls[0];
    const last = controls[controls.length - 1];
    if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
    } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
    }
});
