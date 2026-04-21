(function () {
  'use strict';

  console.log('🔵 Step 3: Getting DOM elements...');
  const header = document.getElementById('main-header');
  const buttonsDiv = document.getElementById('action-buttons');
  const outputDiv = document.getElementById('output');
  const btnFull = document.getElementById('btn-full');
  const btnCustom = document.getElementById('btn-custom');
  const btnConfig = document.getElementById('btn-config');
  const infoCardsContainer = document.getElementById('info-cards');

  console.log('🔵 Step 4: DOM elements obtained', {
    header: !!header,
    buttonsDiv: !!buttonsDiv,
    outputDiv: !!outputDiv,
    btnFull: !!btnFull,
    btnCustom: !!btnCustom,
    btnConfig: !!btnConfig,
    infoCardsContainer: !!infoCardsContainer
  });

  const GITHUB_REPO_URL = 'https://github.com/PerfectYellow/SynapseSetup.git';

  let isShrunk = false;
  let shrinkTimer = null;
  let scrollHandlerActive = true;
  let activeButton = null;

  console.log('🔵 Step 5: Variables initialized');

  function validateCustomInputs(domainInput, ipInput) {
    let isValid = true;

    // Reset previous error styles
    if (domainInput) {
      domainInput.classList.remove('input-error');
      const existingDomainError = document.getElementById('domain-error');
      if (existingDomainError) existingDomainError.remove();
    }

    if (ipInput) {
      ipInput.classList.remove('input-error');
      const existingIpError = document.getElementById('ip-error');
      if (existingIpError) existingIpError.remove();
    }

    // Validate Domain
    if (domainInput && (!domainInput.value || domainInput.value.trim() === '')) {
      domainInput.classList.add('input-error');

      // Add error message
      const errorMsg = document.createElement('div');
      errorMsg.id = 'domain-error';
      errorMsg.className = 'error-message';
      errorMsg.innerHTML = '⚠️ Domain address is required. Please enter a valid domain (e.g., matrix.example.com)';
      domainInput.parentNode.appendChild(errorMsg);

      isValid = false;
    }

    // Validate IP Address
    if (ipInput && (!ipInput.value || ipInput.value.trim() === '')) {
      ipInput.classList.add('input-error');

      // Add error message
      const errorMsg = document.createElement('div');
      errorMsg.id = 'ip-error';
      errorMsg.className = 'error-message';
      errorMsg.innerHTML = '⚠️ Server IP address is required. Please enter a valid IP address (e.g., 192.0.2.1)';
      ipInput.parentNode.appendChild(errorMsg);

      isValid = false;
    }

    return isValid;
  }

  // Function to clear validation errors when user starts typing
  function setupInputValidation(inputElement, errorId) {
    if (!inputElement) return;

    inputElement.addEventListener('input', function () {
      this.classList.remove('input-error');
      const errorMsg = document.getElementById(errorId);
      if (errorMsg) errorMsg.remove();
    });

    inputElement.addEventListener('focus', function () {
      this.classList.remove('input-error');
      const errorMsg = document.getElementById(errorId);
      if (errorMsg) errorMsg.remove();
    });
  }

  function downloadBashFile(filename, content) {
    console.log('🔵 downloadBashFile called:', filename);
    const blob = new Blob([content], { type: 'application/x-shellscript' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    console.log('✅ Download triggered for:', filename);
  }

  console.log('🔵 Step 6: downloadBashFile defined');

  function resetActiveButton() {
    const allButtons = document.querySelectorAll('#action-buttons button');
    allButtons.forEach(btn => {
      btn.classList.remove('active');
    });
    activeButton = null;
  }

  function setActiveButton(button) {
    console.log('Setting active button:', button.id);
    const allButtons = document.querySelectorAll('#action-buttons button');
    allButtons.forEach(btn => {
      btn.classList.remove('active');
    });
    if (button) {
      button.classList.add('active');
      activeButton = button;
    }
  }

  console.log('🔵 Step 7: Button functions defined');

  function shrinkHeader() {
    if (isShrunk) return;
    isShrunk = true;
    if (shrinkTimer) {
      clearTimeout(shrinkTimer);
      shrinkTimer = null;
    }
    header.classList.add('shrink');
    document.body.classList.add('has-fixed-header');
    buttonsDiv.classList.remove('hidden');
    void buttonsDiv.offsetWidth;
    buttonsDiv.classList.add('visible');
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

  console.log('🔵 Step 8: Header functions defined');

  // Auto-shrink after 500ms if no scroll
  shrinkTimer = setTimeout(shrinkHeader, 1000);
  window.addEventListener('scroll', handleScroll, { passive: true });

  window.addEventListener('beforeunload', function () {
    if (shrinkTimer) clearTimeout(shrinkTimer);
    if (scrollHandlerActive) {
      window.removeEventListener('scroll', handleScroll);
    }
  });

  console.log('🔵 Step 9: Event listeners set up');

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

  console.log('🔵 Step 10: hideInfoCards defined');

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

  console.log('🔵 Step 11: createCommandBlock defined');

  // ----- BUTTON 1: Full Download -----
  console.log('🔵 Step 12: Setting up btnFull listener');
  if (btnFull) {
    btnFull.addEventListener('click', function () {
      console.log('🟢 btnFull clicked');
      setActiveButton(btnFull);
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
  } else {
    console.error('❌ btnFull not found!');
  }

  // ----- BUTTON 2: Custom Generator -----
  console.log('🔵 Step 13: Setting up btnCustom listener');
  if (btnCustom) {
    btnCustom.addEventListener('click', function () {
      console.log('🟢 btnCustom clicked');
      setActiveButton(btnCustom);
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
              🌐 Your Domain Address <span style="color: #ef4444;">*</span>
            </label>
            <input type="text" id="domain-input" placeholder="e.g., matrix.example.com" style="width: 100%; max-width: 400px; padding: 0.75rem 1rem; border: 2px solid #e2e8f0; border-radius: 12px; font-size: 16px; transition: all 0.2s;">
            <div class="info" style="margin-top: 0.25rem; font-size: 0.85rem; color: #64748b;">The public domain name that will point to your server. (Required)</div>
          </div>
          <div style="margin-bottom: 1.25rem;">
            <label for="ip-input" style="display: block; margin-bottom: 0.5rem; font-weight: 500; color: #1e293b;">
              🖥️ Your Server IP Address <span style="color: #ef4444;">*</span>
            </label>
            <input type="text" id="ip-input" placeholder="e.g., 192.0.2.1" style="width: 100%; max-width: 400px; padding: 0.75rem 1rem; border: 2px solid #e2e8f0; border-radius: 12px; font-size: 16px; transition: all 0.2s;">
            <div class="info" style="margin-top: 0.25rem; font-size: 0.85rem; color: #64748b;">The public IPv4 address of your Linux server. (Required)</div>
          </div>
        </div>
        <button id="generate-command-btn" class="generate-btn">✨ Generate Setup Bash File</button>
        <div id="generated-command-container" style="margin-top: 2rem;"></div>
      `;

      // Get input elements AFTER they've been created
      const domainInput = document.getElementById('domain-input');
      const ipInput = document.getElementById('ip-input');

      // Setup real-time validation clearing
      if (domainInput) setupInputValidation(domainInput, 'domain-error');
      if (ipInput) setupInputValidation(ipInput, 'ip-error');

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

      const generateBtn = document.getElementById('generate-command-btn');
      if (generateBtn) {
        generateBtn.addEventListener('click', function () {
          console.log('🟢 Generate button clicked');

          // Get fresh references to inputs
          const domainField = document.getElementById('domain-input');
          const ipField = document.getElementById('ip-input');

          // Validate inputs before proceeding
          const isValid = validateCustomInputs(domainField, ipField);

          if (!isValid) {
            // Scroll to show the errors
            const firstError = document.querySelector('#domain-error, #ip-error');
            if (firstError) {
              firstError.scrollIntoView({ behavior: 'smooth', block: 'center' });
            }
            return; // Stop execution if validation fails
          }

          const domain = domainField ? domainField.value.trim() : '';
          const ip = ipField ? ipField.value.trim() : '';

          const customCommand = `mkdir synapse && cd synapse \nbash synapse-setup.sh`;
          const container = document.getElementById('generated-command-container');
          container.innerHTML = `<h3 style="margin-bottom: 0.75rem;">🚀 Your Custom Docker Stack Command</h3>`;
          const commandBlock = createCommandBlock(customCommand);
          container.appendChild(commandBlock);
          const note = document.createElement('p');
          note.style.marginTop = '1rem';
          note.style.fontSize = '0.95rem';
          note.style.color = '#64748b';
          note.innerHTML = `⚡ This downloads and runs the setup script with your selected components.<br>
            ${domain ? `🌐 Domain set to: <code>${domain}</code><br>` : ''}
            ${ip ? `🖥️ IP set to: <code>${ip}</code><br>` : ''}
            🔒 Always review scripts before piping to bash.<br>
            🐧 Designed for <strong>Linux servers</strong> with Docker and Docker Compose.`;
          container.appendChild(note);
        });
      }
    });
  } else {
    console.error('❌ btnCustom not found!');
  }

  // ----- BUTTON 3: Configure Server -----
  console.log('🔵 Step 14: Setting up btnConfig listener');
  if (btnConfig) {
    btnConfig.addEventListener('click', function () {
      console.log('🟢 btnConfig clicked');
      setActiveButton(btnConfig);
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
        <button id="generate-config-btn" class="generate-btn" style="margin-top: 1.5rem;">📋 Generate Config Bash File</button>
        <div id="generated-config-container" style="margin-top: 2rem;"></div>
      `;

      const generateConfigBtn = document.getElementById('generate-config-btn');
      if (generateConfigBtn) {
        generateConfigBtn.addEventListener('click', function () {
          console.log('🟢 Generate Config button clicked');
          const userSearchRadio = document.querySelector('input[name="userSearch"]:checked');
          const userSearchEnabled = userSearchRadio ? userSearchRadio.value === 'enable' : false;
          console.log('User search enabled:', userSearchEnabled);

          if (typeof window.generateBashScript !== 'function') {
            console.error('❌ generateBashScript not available!');
            alert('Configuration template not loaded. Please refresh the page.');
            return;
          }

          try {
            const bashScript = window.generateBashScript('synapseConfig', {
              USER_SEARCH_FLAG: userSearchEnabled.toString()
            });
            console.log('Script generated:', bashScript);
            downloadBashFile(bashScript.filename, bashScript.content);

            const configCommand = `cd synapse \nbash ${bashScript.filename}`;
            const container = document.getElementById('generated-config-container');
            container.innerHTML = `
              <h3 style="margin-bottom: 0.75rem;">🔧 Your Configuration Command</h3>
              <p style="margin-bottom: 1rem; font-size: 0.95rem;">
                ${userSearchEnabled ? '✅ User search <strong>enabled</strong>' : '🔒 User search <strong>disabled</strong>'}
              </p>
            `;
            const commandBlock = createCommandBlock(configCommand);
            container.appendChild(commandBlock);
            const note = document.createElement('p');
            note.style.marginTop = '1rem';
            note.style.fontSize = '0.95rem';
            note.style.color = '#64748b';
            note.innerHTML = `⚡ This command will update your existing Matrix Colony configuration.<br>🔄 Restart Synapse after applying: <code>docker compose restart synapse</code><br>🐧 Designed for <strong>Linux servers</strong> with Docker.`;
            container.appendChild(note);
          } catch (error) {
            console.error('Error generating script:', error);
            alert('Error: ' + error.message);
          }
        });
      } else {
        console.error('❌ generate-config-btn not found in DOM');
      }
    });
  } else {
    console.error('❌ btnConfig not found!');
  }

  console.log('🎉 Step 15: Script initialization complete!');
})();