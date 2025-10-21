(function(){
  // Bind per-block instance
  document.querySelectorAll('[data-bould-widget]').forEach(function(container){
    const openBtn = container.querySelector('.bould-widget__open');
    const modal = container.querySelector('.bould-widget');
    const closeBtn = container.querySelector('.bould-widget__close');

    function showScreen(name){
      modal.querySelectorAll('.bould-widget__screen').forEach(function(s){
        s.hidden = s.dataset.screen !== name;
      });
    }

    function open(){
      // Move modal to document.body to ensure full-viewport overlay
      if(!modal.parentElement || modal.parentElement !== document.body){
        document.body.appendChild(modal);
      }
      modal.hidden = false;
      modal.setAttribute('data-state','opening');
      showScreen('intro');
      setTimeout(function(){ modal.removeAttribute('data-state'); }, 250);
    }
    function close(){ modal.hidden = true; }

    openBtn && openBtn.addEventListener('click', open);
    closeBtn && closeBtn.addEventListener('click', close);
    modal && modal.addEventListener('click', function(e){ if(e.target === modal) close(); });

    modal && modal.addEventListener('click', function(e){
      const t = e.target;
      if(!(t instanceof HTMLElement)) return;
      if(t.matches('[data-action="continue"]')){
        showScreen('form');
      } else if(t.matches('[data-action="close"]')){
        close();
      } else if(t.matches('[data-action="back-to-form"]')){
        showScreen('form');
      }
    });

    const form = container.querySelector('.bould-widget__form');
    if(form){
      form.addEventListener('submit', async function(e){
        e.preventDefault();
        const fd = new FormData(form);
        const file = fd.get('user_image');
        const height = fd.get('height');
        if(!(file instanceof File) || !height){
          return showError('Missing image or height.');
        }
        showScreen('loading');
        try{
          // Determine endpoint: app proxy or absolute API base from settings
          const base = container.getAttribute('data-api-base');
          const endpoint = base && base !== 'use_app_route' ? base : '/apps/bould-widget';
          const res = await fetch(endpoint, { method: 'POST', body: fd, headers: { 'Accept': 'application/json' } });
          if(!res.ok){
            // Provide a more helpful error if product isn’t processed
            const hint = res.status === 404 || res.status === 409 ? '\nPossible reason: The garment you are viewing has not been processed yet in Bould.' : '';
            throw new Error('Server error: '+res.status + hint);
          }
          const data = await res.json();
          if(!data || !data.tryOnImageUrl){
            throw new Error('Invalid response. The garment may not be processed yet. Please run conversion in the Bould app.');
          }
          const img = modal.querySelector('.bould-widget__result-image');
          const sizeEl = modal.querySelector('.bould-widget__size');
          img.src = data.tryOnImageUrl;
          sizeEl.textContent = 'Recommended size: ' + (data.recommendedSize || '-');
          showScreen('result');
        }catch(err){
          const message = (err && err.message ? err.message : 'Unknown error') + '\nIf this persists, ensure the product is converted and try again.';
          showError(message);
        }
      });
    }

    function showError(message){
      const pre = modal.querySelector('.bould-widget__error');
      pre.textContent = message;
      showScreen('error');
    }
  });
})();


