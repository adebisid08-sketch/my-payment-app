const screenPhones = document.querySelectorAll('.phone');
const toast = document.querySelector('.toast');
let toastTimer = null;

function showToast(message) {
  if (!toast) return;
  toast.textContent = message;
  toast.classList.add('visible');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => {
    toast.classList.remove('visible');
  }, 2200);
}

function showScreen(screenName) {
  screenPhones.forEach((phone) => {
    const isVisible = phone.dataset.screen === screenName;
    phone.classList.toggle('is-visible', isVisible);
  });
}

function attachNav() {
  document.querySelectorAll('[data-go]').forEach((button) => {
    const target = button.dataset.go;
    if (button.closest('.login-screen')) {
      button.addEventListener('click', () => {
        const loginInput = document.getElementById('loginPin');
        if (!loginInput || loginInput.value.length !== 6) {
          showToast('Please enter your 6-digit password.');
          loginInput?.focus();
          return;
        }
        showScreen(target);
      });
      return;
    }

    button.addEventListener('click', () => {
      showScreen(target);
    });
  });
}

function attachMessages() {
  document.querySelectorAll('[data-message]').forEach((button) => {
    button.addEventListener('click', () => {
      const message = button.dataset.message || 'Action selected.';
      showToast(message);
    });
  });
}

function attachModalClosers() {
  document.querySelectorAll('[data-close-modal]').forEach((button) => {
    button.addEventListener('click', () => {
      showScreen('transfer');
    });
  });
}

function attachPasswordToggles() {
  document.querySelectorAll('[data-toggle]').forEach((toggle) => {
    toggle.addEventListener('click', () => {
      const input = document.getElementById(toggle.dataset.toggle);
      if (!input) return;
      input.type = input.type === 'password' ? 'text' : 'password';
      toggle.textContent = input.type === 'password' ? '◉' : '◌';
    });
  });
}

function attachKeypads() {
  document.querySelectorAll('.keypad').forEach((keypad) => {
    keypad.addEventListener('click', (event) => {
      const button = event.target.closest('button');
      if (!button) return;

      const inputId = keypad.dataset.keypad;
      const input = document.getElementById(inputId);
      if (!input) return;

      if (button.dataset.delete === 'true') {
        input.value = input.value.slice(0, -1);
      } else if (button.textContent.trim() !== '') {
        if (input.value.length < Number(input.maxLength || 99)) {
          input.value += button.textContent.trim();
        }
      }

      if (inputId === 'paymentPin') {
        updatePaymentPinDots();
        if (input.value.length === 4) {
          setTimeout(() => showScreen('success'), 260);
        }
      }
    });
  });
}

function updatePaymentPinDots() {
  const pinInput = document.getElementById('paymentPin');
  const dots = document.querySelectorAll('.pin-dots i');
  if (!pinInput || !dots.length) return;

  dots.forEach((dot, index) => {
    dot.classList.toggle('filled', index < pinInput.value.length);
  });
}

function attachTransferValidation() {
  const validateButton = document.querySelector('[data-action="validate-transfer"]');
  if (!validateButton) return;

  validateButton.addEventListener('click', () => {
    const accountNumber = document.getElementById('accountNumber');
    const bankSelect = document.getElementById('bankSelect');

    if (!accountNumber || !/^[0-9]{10}$/.test(accountNumber.value.trim())) {
      showToast('Enter a valid 10-digit account number.');
      accountNumber?.focus();
      return;
    }

    if (!bankSelect || !bankSelect.value) {
      showToast('Please select a bank.');
      bankSelect?.focus();
      return;
    }

    showScreen('confirm');
  });
}

function init() {
  showScreen('login');
  attachNav();
  attachMessages();
  attachModalClosers();
  attachPasswordToggles();
  attachKeypads();
  attachTransferValidation();
  updatePaymentPinDots();
}

init();
