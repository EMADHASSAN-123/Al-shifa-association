// Contact Form Handler
document.addEventListener('DOMContentLoaded', function() {
    const contactForm = document.getElementById('contactForm');
    const formMessage = document.getElementById('formMessage');

    if (contactForm) {
        contactForm.addEventListener('submit', function(e) {
            e.preventDefault();
            
            // Get form data
            const formData = new FormData(contactForm);
            const data = Object.fromEntries(formData);

            // Simulate form submission (in real app, this would send to server)
            formMessage.classList.remove('hidden');
            formMessage.classList.remove('bg-red-100', 'text-red-700', 'bg-green-100', 'text-green-700');
            formMessage.classList.add('bg-green-100', 'text-green-700', 'p-4', 'rounded-lg');
            formMessage.innerHTML = '<i class="fas fa-check-circle ml-2"></i> تم إرسال رسالتك بنجاح! سنتواصل معك قريباً.';

            // Reset form
            contactForm.reset();

            // Hide message after 5 seconds
            setTimeout(() => {
                formMessage.classList.add('hidden');
            }, 5000);
        });
    }
});

