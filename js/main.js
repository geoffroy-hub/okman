// main.js - MiraLocks — Formulaires, animations scroll, langue
// Note : le menu hamburger est géré par hamburger-menu.js séparément

document.addEventListener('DOMContentLoaded', function () {

  // ─── FORMULAIRE RENDEZ-VOUS ───────────────────────────────────────────────
  const rvForm = document.getElementById('rendezvous-form');
  if (rvForm) {
    // Date minimum = aujourd'hui
    const dateInput = document.getElementById('preferred-date');
    if (dateInput) {
      dateInput.min = new Date().toISOString().split('T')[0];
    }

    rvForm.addEventListener('submit', function (e) {
      e.preventDefault();
      const data = {
        name:    document.getElementById('name')?.value.trim(),
        phone:   document.getElementById('phone')?.value.trim(),
        email:   document.getElementById('email')?.value.trim(),
        service: document.getElementById('service')?.value,
        date:    document.getElementById('preferred-date')?.value,
        time:    document.getElementById('preferred-time')?.value,
        notes:   document.getElementById('notes')?.value.trim()
      };

      if (!data.name || !data.phone || !data.service) {
        alert('⚠️ Veuillez remplir les champs obligatoires : Nom, Téléphone, Service.');
        return;
      }

      let msg = `👋 *Bonjour MiraLocks !*\n\n📅 *Demande de Rendez-vous*\n\n`;
      msg += `👤 *Nom :* ${data.name}\n`;
      msg += `📱 *Téléphone :* ${data.phone}\n`;
      if (data.email) msg += `📧 *Email :* ${data.email}\n`;
      msg += `💇 *Service :* ${data.service}\n`;
      if (data.date) {
        const d = new Date(data.date).toLocaleDateString('fr-FR', { weekday:'long', year:'numeric', month:'long', day:'numeric' });
        msg += `📆 *Date souhaitée :* ${d}\n`;
      }
      if (data.time) msg += `⏰ *Heure :* ${data.time}\n`;
      if (data.notes) msg += `\n📝 *Remarques :*\n${data.notes}\n`;
      msg += `\n✨ Merci de confirmer la disponibilité !`;

      const preview = document.getElementById('preview-text');
      const previewBox = document.getElementById('message-preview');
      if (preview && previewBox) {
        preview.textContent = msg;
        previewBox.style.display = 'block';
        previewBox.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
      } else {
        window.open(`https://wa.me/22897989001?text=${encodeURIComponent(msg)}`, '_blank');
      }

      window._whatsappMsg = msg;
    });
  }

  // Exposer sendToWhatsApp pour le bouton dans la page rendez-vous
  window.sendToWhatsApp = function () {
    const msg = window._whatsappMsg;
    if (!msg) {
      alert('⚠️ Veuillez d\'abord remplir et valider le formulaire.');
      return;
    }
    // BUG 10 FIX : nettoyer _whatsappMsg après usage pour éviter réutilisation accidentelle
    window._whatsappMsg = null;
    window.open(`https://wa.me/22897989001?text=${encodeURIComponent(msg)}`, '_blank');
    setTimeout(() => {
      alert('✅ Redirection WhatsApp effectuée ! Cliquez "Envoyer" dans WhatsApp.');
      document.getElementById('rendezvous-form')?.reset();
      window.hidePreview?.();
    }, 800);
  };
  window.hidePreview = function () {
    const box = document.getElementById('message-preview');
    if (box) box.style.display = 'none';
  };

  // ─── FORMULAIRE CONTACT ───────────────────────────────────────────────────
  const contactForm = document.getElementById('contact-form');
  if (contactForm) {
    contactForm.addEventListener('submit', function (e) {
      e.preventDefault();
      const name    = contactForm.querySelector('[name=name]')?.value.trim();
      const message = contactForm.querySelector('[name=message]')?.value.trim();
      if (!name || !message) { alert('⚠️ Merci de remplir tous les champs.'); return; }
      const wa = `💬 *Message de :* ${name}\n\n${message}`;
      window.open(`https://wa.me/22897989001?text=${encodeURIComponent(wa)}`, '_blank');
      alert('✅ Message envoyé via WhatsApp !');
      contactForm.reset();
    });
  }

  // ─── ANIMATIONS AU SCROLL (uniquement sur desktop pour les performances) ───
  if (window.innerWidth > 767 && 'IntersectionObserver' in window) {
    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.style.opacity = '1';
          entry.target.style.transform = 'translateY(0)';
          observer.unobserve(entry.target);
        }
      });
    }, { threshold: 0.1, rootMargin: '0px 0px -60px 0px' });

    document.querySelectorAll('.card').forEach(el => {
      el.style.opacity = '0';
      el.style.transform = 'translateY(24px)';
      el.style.transition = 'opacity 0.5s ease, transform 0.5s ease';
      observer.observe(el);
    });
  }
});
