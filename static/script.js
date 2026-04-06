const slides = document.querySelectorAll(".slide");
const next = document.querySelector(".next");
const prev = document.querySelector(".prev");
let current = 0;

function showSlide(i) {
  slides.forEach(s => s.classList.remove("active"));
  slides[i].classList.add("active");
}

if (next && prev) {
  next.onclick = () => {
    current = (current + 1) % slides.length;
    showSlide(current);
  };

  prev.onclick = () => {
    current = (current - 1 + slides.length) % slides.length;
    showSlide(current);
  };
}

// Before/After slider
document.querySelectorAll(".compare").forEach(box => {
  const slider = box.querySelector("input");
  const after = box.querySelector(".after-img");

  slider.addEventListener("input", e => {
    after.style.clipPath = `inset(0 ${100 - e.target.value}% 0 0)`;
  });
});


console.log("✅ Appointment script loaded");

document.addEventListener("DOMContentLoaded", function() {
  // Support both class and ID selectors
  const form = document.querySelector(".contactForm") || document.getElementById("appointmentForm");
  const formMessage = document.querySelector('.form-message');

  if (!form) {
    console.warn('⚠️ Appointment form not found on this page');
    return;
  }

  console.log("✅ Form found:", form);

  form.addEventListener("submit", async function (e) {
    e.preventDefault();
    console.log("📤 Form submitted");

    const button = form.querySelector('button[type="submit"]');
    const originalText = button ? button.textContent : "Book Appointment";

    // Get form data
    const formData = new FormData(form);
    const name = formData.get('name')?.trim();
    const email = formData.get('email')?.trim();
    const phone = formData.get('phone')?.trim();
    const date = formData.get('date');
    const message = formData.get('message')?.trim() || '';

    console.log("📋 Form data:", { name, email, phone, date, message });

    // Client-side validation
    if (!name || !email || !phone || !date) {
      showMessage('Please fill in all required fields.', 'error');
      return;
    }

    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      showMessage('Please enter a valid email address.', 'error');
      return;
    }

    // Phone validation
    if (phone.length < 10) {
      showMessage('Please enter a valid phone number.', 'error');
      return;
    }

    // Disable button and show loading
    if (button) {
      button.disabled = true;
      button.innerHTML = '<span class="loading"></span> Booking...';
    }

    try {
      console.log("🚀 Sending to backend...");

      const response = await fetch("/contact", {
        method: "POST",
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: name,
          email: email,
          phone: phone,
          date: date,
          message: message
        })
      });

      console.log("📨 Response status:", response.status);

      const data = await response.json();
      console.log("📥 Response data:", data);

      // Re-enable button
      if (button) {
        button.disabled = false;
        button.textContent = originalText;
      }

      if (data.status === "success") {
        console.log("✅ Appointment booked successfully!");
        showMessage(data.message || "Appointment request sent successfully! We will contact you shortly.", 'success');
        form.reset();
        
        // Hide success message after 5 seconds
        setTimeout(() => {
          if (formMessage) {
            formMessage.style.display = 'none';
          }
        }, 5000);
      } else {
        console.error("❌ Server returned error:", data.message);
        showMessage(data.message || "Something went wrong. Please try again.", 'error');
      }

    } catch (err) {
      console.error("❌ Network error:", err);
      
      // Re-enable button
      if (button) {
        button.disabled = false;
        button.textContent = originalText;
      }
      
      showMessage('Network error. Please check your connection and try again.', 'error');
    }
  });

  // Helper function to show messages
  function showMessage(message, type) {
    if (!formMessage) {
      alert(message);
      return;
    }
    
    formMessage.textContent = message;
    formMessage.className = `form-message ${type}`;
    formMessage.style.display = 'block';
    
    console.log(`${type === 'success' ? '✅' : '❌'} ${message}`);
  }

  // Add real-time validation feedback
  form.querySelectorAll('input, textarea').forEach(input => {
    input.addEventListener('blur', () => {
      if (input.hasAttribute('required') && !input.value.trim()) {
        input.style.borderColor = '#dc3545';
      } else {
        input.style.borderColor = '#0077ff';
      }
    });

    input.addEventListener('focus', () => {
      input.style.borderColor = '#0077ff';
    });
  });

  console.log("✅ Form event listeners attached");
});
