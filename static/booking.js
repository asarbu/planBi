const consentCheckbox = document.getElementById('consentCheckbox');
const submitBtn = document.getElementById('consultation-submit-button');
const gdprTimestamp = document.getElementById('gdprTimestamp');
if (consentCheckbox && submitBtn) {
	submitBtn.disabled = !consentCheckbox.checked;
	consentCheckbox.addEventListener('change', function () {
		submitBtn.disabled = !this.checked;
		if (this.checked && gdprTimestamp) {
			gdprTimestamp.value = new Date().toISOString();
		} else if (gdprTimestamp) {
			gdprTimestamp.value = '';
		}
	});
}