updateTables();
if ("cookieStore" in window) {
    window.cookieStore.addEventListener("change", () => {
        if (!saving) updateTables();
    });
}
window.addEventListener("focus", () => {
    if (!saving) updateTables();
});
