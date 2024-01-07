function showPassword() {
   const passwordInput = document.getElementById('register-pass');
   const eyeIcon = document.getElementById('register-eye');

   if (passwordInput.type === 'password') {
       passwordInput.type = 'text';
       eyeIcon.classList.remove('ri-eye-off-line');
       eyeIcon.classList.add('ri-eye-line');
   } else {
       passwordInput.type = 'password';
       eyeIcon.classList.remove('ri-eye-line');
       eyeIcon.classList.add('ri-eye-off-line');
   }
}