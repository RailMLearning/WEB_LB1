function openModal(id_) {
    const el = document.getElementById(id_);
    if (el) {
        el.classList.add('active');
    }
}

function closeModal(id_) {
    const el = document.getElementById(id_);
    if (el) {
        el.classList.remove('active');
    }
}