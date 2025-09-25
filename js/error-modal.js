document.addEventListener('DOMContentLoaded', () => {
    const overlay = document.getElementById('overlay');
    if (overlay) {
        overlay.style.display = 'none';
    }

    const errorModal = document.getElementById('error-modal-overlay');
    const continueBtn = document.getElementById('error-modal-continue');

    if (errorModal) {
        errorModal.style.display = 'flex';
    }

    if (continueBtn) {
        continueBtn.addEventListener('click', () => {
            if (errorModal) {
                errorModal.style.display = 'none';
            }
            setTimeout(() => {
                window.location.href = 'index.html';
            }, 300);
        });
    }
});
