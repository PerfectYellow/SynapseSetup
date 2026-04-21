(function () {
  'use strict';

  const header = document.getElementById('main-header');
  const buttonsDiv = document.getElementById('action-buttons');
  const outputDiv = document.getElementById('output');
  const btnFull = document.getElementById('btn-full');
  const btnCustom = document.getElementById('btn-custom');
  const btnConfig = document.getElementById('btn-config');
  const infoCardsContainer = document.getElementById('info-cards');

  const GITHUB_REPO_URL = 'https://github.com/PerfectYellow/SynapseSetup.git';
  const RAW_SCRIPT_URL = 'https://raw.githubusercontent.com/yourusername/matrix-synapse-setup/main/setup.sh';

  let isShrunk = false;
  let shrinkTimer = null;
  let scrollHandlerActive = true;

  function shrinkHeader() {
    if (isShrunk) return;
    isShrunk = true;

    if (shrinkTimer) {
      clearTimeout(shrinkTimer);
      shrinkTimer = null;
    }

    header.classList.add('shrink');
    document.body.classList.add('has-fixed-header');

    // Show buttons with smooth fade-in
    buttonsDiv.classList.remove('hidden');
    // Force reflow to ensure transition works
    void buttonsDiv.offsetWidth;
    buttonsDiv.classList.add('visible');

    // Remove scroll listener after shrinking
    if (scrollHandlerActive) {
      window.removeEventListener('scroll', handleScroll);
      scrollHandlerActive = false;
    }
  }

  function handleScroll() {
    if (!isShrunk && scrollHandlerActive) {
      shrinkHeader();
    }
  }

  // Auto-shrink after 500ms if no scroll
  shrinkTimer = setTimeout(shrinkHeader, 500);

  // Also shrink on scroll
  window.addEventListener('scroll', handleScroll, { passive: true });

  window.addEventListener('beforeunload', function () {
    if (shrinkTimer) clearTimeout(shrinkTimer);
    if (scrollHandlerActive) {
      window.removeEventListener('scroll', handleScroll);
    }
  });

  // Function to hide info cards with animation
  function hideInfoCards() {
    if (infoCardsContainer.classList.contains('hidden')) return;

    const infoCards = document.querySelectorAll('.info-card');
    infoCards.forEach(card => {
      card.classList.add('fade-out');
    });

    setTimeout(() => {
      infoCardsContainer.classList.add('hidden');
    }, 300);
  }

  // ----- Helper: Create a command block with copy button -----
  function createCommandBlock(commandText, description = '') {
    const container = document.createElement('div');
    container.className = 'command-container';

    const pre = document.createElement('pre');
    const code = document.createElement('code');
    code.textContent = commandText;
    pre.appendChild(code);

    const copyBtn = document.createElement('button');
    copyBtn.className = 'copy-btn';
    copyBtn.innerHTML = '📋 Copy';
    copyBtn.setAttribute('aria-label', 'Copy command to clipboard');

    copyBtn.addEventListener('click', async () => {
      try {
        await navigator.clipboard.writeText(commandText);
        copyBtn.innerHTML = '✅ Copied!';
        copyBtn.classList.add('copied');
        setTimeout(() => {
          copyBtn.innerHTML = '📋 Copy';
          copyBtn.classList.remove('copied');
        }, 2000);
      } catch (err) {
        const textarea = document.createElement('textarea');
        textarea.value = commandText;
        document.body.appendChild(textarea);
        textarea.select();
        document.execCommand('copy');
        document.body.removeChild(textarea);
        copyBtn.innerHTML = '✅ Copied!';
        copyBtn.classList.add('copied');
        setTimeout(() => {
          copyBtn.innerHTML = '📋 Copy';
          copyBtn.classList.remove('copied');
        }, 2000);
      }
    });

    container.appendChild(pre);
    container.appendChild(copyBtn);

    const wrapper = document.createElement('div');
    if (description) {
      const descPara = document.createElement('p');
      descPara.innerHTML = description;
      wrapper.appendChild(descPara);
    }
    wrapper.appendChild(container);

    return wrapper;
  }

  // ----- BUTTON 1: Full Download -----
  btnFull.addEventListener('click', function () {
    hideInfoCards();

    const cloneCommand = `git clone ${GITHUB_REPO_URL} synapse\ncd synapse\nbash MatrixSynapseSetup.sh`;

    outputDiv.style.display = 'block';
    outputDiv.innerHTML = `
      <h2 style="margin-bottom: 0.5rem; font-weight: 600;">📦 Full Docker Stack Setup</h2>
      <p>Clone the repository and start all services with Docker Compose:</p>
    `;

    const commandBlock = createCommandBlock(cloneCommand);
    outputDiv.appendChild(commandBlock);

    const note = document.createElement('p');
    note.style.marginTop = '1rem';
    note.style.fontSize = '0.95rem';
    note.style.color = '#64748b';
    note.innerHTML = `
      ⚡ Make sure you have <code>git</code> and <code>docker compose</code> installed.<br>
      🐧 This stack is designed for <strong>Linux servers</strong> with Docker.<br>
      📦 Includes: Matrix Colony (Synapse), Sliding Sync, LiveKit, Coturn, PostgreSQL, Caddy, LK JWT Server.
    `;
    outputDiv.appendChild(note);
  });

  // ----- BUTTON 2: Custom Generator (Docker Stack Components) -----
  btnCustom.addEventListener('click', function () {
    hideInfoCards();

    outputDiv.style.display = 'block';
    outputDiv.innerHTML = `
      <h2 style="margin-bottom: 1.5rem; font-weight: 600;">⚙️ Customize Your Docker Stack</h2>
      <p>Select the components you want to include in your Matrix deployment:</p>

      <div class="checkbox-group">
        <label>
          <input type="checkbox" id="opt-synapse" value="synapse" checked>
          <span><strong>Matrix Colony (Synapse Backend)</strong> – Core Matrix homeserver</span>
        </label>
        <label>
          <input type="checkbox" id="opt-sliding-sync" value="sliding-sync" checked>
          <span><strong>Sliding Sync</strong> – Required for Element X clients</span>
        </label>
        <label>
          <input type="checkbox" id="opt-postgres" value="postgres" checked>
          <span><strong>PostgreSQL</strong> – Database backend</span>
        </label>
        <label>
          <input type="checkbox" id="opt-caddy" value="caddy" checked>
          <span><strong>Caddy</strong> – Reverse proxy with automatic SSL</span>
        </label>
        <label>
          <input type="checkbox" id="opt-livekit" value="livekit">
          <span><strong>LiveKit + LK JWT Server</strong> – Voice/video calls</span>
        </label>
        <label>
          <input type="checkbox" id="opt-coturn" value="coturn">
          <span><strong>Coturn TURN Server</strong> – For calls behind NAT/firewalls</span>
        </label>
        <label>
          <input type="checkbox" id="opt-admin" value="admin">
          <span><strong>Admin Panel</strong> – For managing users and rooms and more</span>
        </label>
      </div>

      <div style="margin: 2rem 0;">
        <div style="margin-bottom: 1.25rem;">
          <label for="domain-input" style="display: block; margin-bottom: 0.5rem; font-weight: 500; color: #1e293b;">
            🌐 Your Domain Address
          </label>
          <input 
            type="text" 
            id="domain-input" 
            placeholder="e.g., matrix.example.com" 
            style="width: 100%; max-width: 400px; padding: 0.75rem 1rem; border: 2px solid #e2e8f0; border-radius: 12px; font-size: 16px; transition: border-color 0.2s, box-shadow 0.2s; outline: none; background: white;"
            onfocus="this.style.borderColor='#6366f1'; this.style.boxShadow='0 0 0 3px rgba(99,102,241,0.1)'"
            onblur="this.style.borderColor='#e2e8f0'; this.style.boxShadow='none'"
          />
          <p style="margin-top: 0.25rem; font-size: 0.85rem; color: #64748b;">The public domain name that will point to your server.</p>
        </div>
        <div style="margin-bottom: 1.25rem;">
          <label for="ip-input" style="display: block; margin-bottom: 0.5rem; font-weight: 500; color: #1e293b;">
            🖥️ Your Server IP Address
          </label>
          <input 
            type="text" 
            id="ip-input" 
            placeholder="e.g., 192.0.2.1" 
            style="width: 100%; max-width: 400px; padding: 0.75rem 1rem; border: 2px solid #e2e8f0; border-radius: 12px; font-size: 16px; transition: border-color 0.2s, box-shadow 0.2s; outline: none; background: white;"
            onfocus="this.style.borderColor='#6366f1'; this.style.boxShadow='0 0 0 3px rgba(99,102,241,0.1)'"
            onblur="this.style.borderColor='#e2e8f0'; this.style.boxShadow='none'"
          />
          <p style="margin-top: 0.25rem; font-size: 0.85rem; color: #64748b;">The public IPv4 address of your Linux server.</p>
        </div>
      </div>

      <button id="generate-command-btn" class="generate-btn">✨ Generate Docker Compose Command</button>

      <div id="generated-command-container" style="margin-top: 2rem;"></div>
    `;

    const threeCore = ['opt-synapse', 'opt-sliding-sync', 'opt-postgres'];
    const caddyId = 'opt-caddy';
    let updating = false;

    function syncThreeAndOptionalCaddy(changedId, isNowChecked) {
      if (updating) return;
      updating = true;

      if (isNowChecked) {
        [...threeCore, caddyId].forEach(id => {
          const cb = document.getElementById(id);
          if (cb && !cb.checked) cb.checked = true;
        });
      } else {
        threeCore.forEach(id => {
          const cb = document.getElementById(id);
          if (cb && cb.checked) cb.checked = false;
        });
      }

      updating = false;
    }

    threeCore.forEach(id => {
      const cb = document.getElementById(id);
      if (cb) {
        cb.addEventListener('change', function (e) {
          syncThreeAndOptionalCaddy(this.id, this.checked);
        });
      }
    });

    document.getElementById('generate-command-btn').addEventListener('click', function () {
      const selected = [];
      if (document.getElementById('opt-synapse').checked) selected.push('synapse');
      if (document.getElementById('opt-sliding-sync').checked) selected.push('sliding-sync');
      if (document.getElementById('opt-postgres').checked) selected.push('postgres');
      if (document.getElementById('opt-caddy').checked) selected.push('caddy');
      if (document.getElementById('opt-livekit').checked) selected.push('livekit');
      if (document.getElementById('opt-coturn').checked) selected.push('coturn');
      if (document.getElementById('opt-admin').checked) selected.push('admin');

      const profiles = selected.join(',');

      const domainInput = document.getElementById('domain-input');
      const ipInput = document.getElementById('ip-input');
      const domain = domainInput ? domainInput.value.trim() : '';
      const ip = ipInput ? ipInput.value.trim() : '';

      let extraFlags = '';
      if (domain) extraFlags += ` --domain "${domain}"`;
      if (ip) extraFlags += ` --ip "${ip}"`;

      const customCommand = `bash <(curl -s ${RAW_SCRIPT_URL}) --profiles ${profiles}${extraFlags}`;

      const container = document.getElementById('generated-command-container');
      container.innerHTML = `
        <h3 style="margin-bottom: 0.75rem;">🚀 Your Custom Docker Stack Command</h3>
      `;

      const commandBlock = createCommandBlock(customCommand);
      container.appendChild(commandBlock);

      const note = document.createElement('p');
      note.style.marginTop = '1rem';
      note.style.fontSize = '0.95rem';
      note.style.color = '#64748b';
      note.innerHTML = `
        ⚡ This downloads and runs the setup script with your selected components.<br>
        ${domain ? `🌐 Domain set to: <code>${domain}</code><br>` : ''}
        ${ip ? `🖥️ IP set to: <code>${ip}</code><br>` : ''}
        🔒 Always review scripts before piping to bash.<br>
        🐧 Designed for <strong>Linux servers</strong> with Docker and Docker Compose.
      `;
      container.appendChild(note);
    });
  });

  // ----- BUTTON 3: Configure Server -----
  btnConfig.addEventListener('click', function () {
    hideInfoCards();

    outputDiv.style.display = 'block';
    outputDiv.innerHTML = `
      <h2 style="margin-bottom: 0.5rem; font-weight: 600;">🔧 Server Configuration</h2>
      <p style="margin-bottom: 1.5rem;">Adjust your Matrix Colony server settings:</p>

      <div class="config-group">
        <div class="config-item">
          <h3 style="margin-bottom: 0.75rem;">👥 User Directory Search</h3>
          <div class="radio-group">
            <label style="display: block; margin-bottom: 0.5rem;">
              <input type="radio" name="userSearch" value="enable" checked>
              <span><strong>Enable</strong> – Users can search for others in the directory</span>
            </label>
            <label style="display: block; margin-bottom: 0.5rem;">
              <input type="radio" name="userSearch" value="disable">
              <span><strong>Disable</strong> – User search is turned off (more privacy)</span>
            </label>
          </div>
        </div>
      </div>

      <button id="generate-config-btn" class="generate-btn" style="margin-top: 1.5rem;">📋 Generate Configuration Command</button>

      <div id="generated-config-container" style="margin-top: 2rem;"></div>
    `;

    document.getElementById('generate-config-btn').addEventListener('click', function () {
      const userSearchEnabled = document.querySelector('input[name="userSearch"]:checked').value === 'enable';
      const configFlag = userSearchEnabled ? '--enable-user-search' : '--disable-user-search';

      const configCommand = `bash <(curl -s ${RAW_SCRIPT_URL}) --configure-only ${configFlag}`;

      const container = document.getElementById('generated-config-container');
      container.innerHTML = `
        <h3 style="margin-bottom: 0.75rem;">🔧 Your Configuration Command</h3>
        <p style="margin-bottom: 1rem; font-size: 0.95rem;">
          ${userSearchEnabled ?
          '✅ User search <strong>enabled</strong> – Users can find each other in the directory.' :
          '🔒 User search <strong>disabled</strong> – Enhanced privacy, users cannot search for others.'}
        </p>
      `;

      const commandBlock = createCommandBlock(configCommand);
      container.appendChild(commandBlock);

      const note = document.createElement('p');
      note.style.marginTop = '1rem';
      note.style.fontSize = '0.95rem';
      note.style.color = '#64748b';
      note.innerHTML = `
        ⚡ This command will update your existing Matrix Colony configuration.<br>
        🔄 Restart Synapse after applying: <code>docker compose restart synapse</code><br>
        🐧 Designed for <strong>Linux servers</strong> with Docker.
      `;
      container.appendChild(note);
    });
  });
})();