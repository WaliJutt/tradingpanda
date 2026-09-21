// Modal Handlers
function openModal(id) {
  document.getElementById(id).classList.add('active');
}

function closeModal(id) {
  document.getElementById(id).classList.remove('active');
}

// Payment Submission
document.getElementById('payment-submit-form')?.addEventListener('submit', (e) => {
  e.preventDefault();
  alert('Aap ka Transaction ID receive ho gaya hai! Verification ke baad VIP status active ho jayega.');
  closeModal('payment-modal');
});