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

        <div class="divider admin-divider">Admin Options</div>

        <label>
          <input type="checkbox" id="opt-admin-panel" value="admin-panel">
          <span><strong>Admin Panel</strong> – Admin Panel for managing synapse server</span>
        </label>
        
        <!-- Dynamic Admin Credentials Section (hidden by default) -->
        <div id="admin-credentials-section" style="display: none; margin-left: 1.5rem; margin-top: 0.75rem; margin-bottom: 0.75rem; padding: 1rem; background: #f8fafc; border-radius: 8px; border-left: 3px solid #3b82f6;">
          <div style="margin-bottom: 0.75rem;" id="admin-username-container">
            <label for="admin-username" style="display: block; margin-bottom: 0.25rem; font-weight: 500; color: #1e293b; font-size: 0.9rem;">
              👤 Admin Username <span style="color: #ef4444;">*</span>
            </label>
            <input type="text" id="admin-username" placeholder="e.g., admin" style="width: 100%; max-width: 300px; padding: 0.5rem 0.75rem; border: 2px solid #cbd5e1; border-radius: 6px; font-size: 14px; transition: all 0.2s;">
            <div id="admin-username-error" class="admin-error-message" style="display: none; margin-top: 0.25rem; font-size: 0.75rem; color: #ef4444;"></div>
          </div>
          <div id="admin-password-container">
            <label for="admin-password" style="display: block; margin-bottom: 0.25rem; font-weight: 500; color: #1e293b; font-size: 0.9rem;">
              🔒 Admin Password <span style="color: #ef4444;">*</span>
            </label>
            <input type="password" id="admin-password" placeholder="Enter strong password" style="width: 100%; max-width: 300px; padding: 0.5rem 0.75rem; border: 2px solid #cbd5e1; border-radius: 6px; font-size: 14px; transition: all 0.2s;">
            <div id="admin-password-error" class="admin-error-message" style="display: none; margin-top: 0.25rem; font-size: 0.75rem; color: #ef4444;"></div>
          </div>
        </div>
        
        <label>
          <input type="checkbox" id="opt-create-admin" value="create-admin">
          <span><strong>Create New Admin</strong> – Admin for managing users and rooms and more</span>
        </label>
      </div>

      <div class="divider admin-divider">Domain and IP</div>

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

      // Function to clear admin validation errors
      function clearAdminValidation() {
        const usernameInput = document.getElementById('admin-username');
        const passwordInput = document.getElementById('admin-password');
        const usernameError = document.getElementById('admin-username-error');
        const passwordError = document.getElementById('admin-password-error');

        if (usernameInput) {
          usernameInput.style.borderColor = '#cbd5e1';
          usernameInput.classList.remove('input-error');
        }
        if (passwordInput) {
          passwordInput.style.borderColor = '#cbd5e1';
          passwordInput.classList.remove('input-error');
        }
        if (usernameError) usernameError.style.display = 'none';
        if (passwordError) passwordError.style.display = 'none';
      }

      // Function to validate admin fields
      function validateAdminFields() {
        const adminPanelCheckbox = document.getElementById('opt-admin-panel');
        const usernameInput = document.getElementById('admin-username');
        const passwordInput = document.getElementById('admin-password');
        const usernameError = document.getElementById('admin-username-error');
        const passwordError = document.getElementById('admin-password-error');

        let isValid = true;

        // Clear previous validation
        clearAdminValidation();

        // Only validate if admin panel is checked
        if (adminPanelCheckbox && adminPanelCheckbox.checked) {
          // Validate username
          if (!usernameInput || !usernameInput.value.trim()) {
            if (usernameInput) {
              usernameInput.style.borderColor = '#ef4444';
              usernameInput.classList.add('input-error');
            }
            if (usernameError) {
              usernameError.textContent = '⚠️ Admin username is required';
              usernameError.style.display = 'block';
            }
            isValid = false;
          }

          // Validate password
          if (!passwordInput || !passwordInput.value.trim()) {
            if (passwordInput) {
              passwordInput.style.borderColor = '#ef4444';
              passwordInput.classList.add('input-error');
            }
            if (passwordError) {
              passwordError.textContent = '⚠️ Admin password is required';
              passwordError.style.display = 'block';
            }
            isValid = false;
          }
        }

        return isValid;
      }

      // Add real-time validation clearing when user types
      function setupAdminValidation() {
        const usernameInput = document.getElementById('admin-username');
        const passwordInput = document.getElementById('admin-password');

        if (usernameInput) {
          usernameInput.addEventListener('input', function () {
            if (this.value.trim()) {
              this.style.borderColor = '#cbd5e1';
              this.classList.remove('input-error');
              const error = document.getElementById('admin-username-error');
              if (error) error.style.display = 'none';
            }
          });
        }

        if (passwordInput) {
          passwordInput.addEventListener('input', function () {
            if (this.value.trim()) {
              this.style.borderColor = '#cbd5e1';
              this.classList.remove('input-error');
              const error = document.getElementById('admin-password-error');
              if (error) error.style.display = 'none';
            }
          });
        }
      }

      // Add event listener for the admin panel checkbox
      const adminPanelCheckbox = document.getElementById('opt-admin-panel');
      const adminCredentialsSection = document.getElementById('admin-credentials-section');

      console.log('Admin panel checkbox found:', !!adminPanelCheckbox);
      console.log('Admin credentials section found:', !!adminCredentialsSection);

      if (adminPanelCheckbox && adminCredentialsSection) {
        // Set initial state
        if (adminPanelCheckbox.checked) {
          adminCredentialsSection.style.display = 'block';
        } else {
          adminCredentialsSection.style.display = 'none';
        }

        adminPanelCheckbox.addEventListener('change', function () {
          console.log('Admin checkbox changed, checked:', this.checked);
          if (this.checked) {
            adminCredentialsSection.style.display = 'block';
            adminCredentialsSection.style.animation = 'fadeIn 0.3s ease';
          } else {
            adminCredentialsSection.style.display = 'none';
            // Clear validation and fields when hidden
            clearAdminValidation();
            const usernameInput = document.getElementById('admin-username');
            const passwordInput = document.getElementById('admin-password');
            if (usernameInput) usernameInput.value = '';
            if (passwordInput) passwordInput.value = '';
          }
        });
      } else {
        console.error('Admin panel elements not found!');
      }

      // Setup admin validation listeners
      setupAdminValidation();

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

          // Validate domain and IP inputs
          const isValidDomainIp = validateCustomInputs(domainField, ipField);

          // Validate admin fields (only if admin panel is checked)
          const isAdminValid = validateAdminFields();

          const adminPanelSelected = document.getElementById('opt-admin-panel')?.checked || false;
          const createAdminSelected = document.getElementById('opt-create-admin')?.checked || false;

          if (!isValidDomainIp) {
            // Scroll to show the errors
            const firstError = document.querySelector('#domain-error, #ip-error');
            if (firstError) {
              firstError.scrollIntoView({ behavior: 'smooth', block: 'center' });
            }
            return; // Stop execution if validation fails
          }

          if (adminPanelSelected && !isAdminValid) {
            // Scroll to admin credentials section
            const adminSection = document.getElementById('admin-credentials-section');
            if (adminSection) {
              adminSection.scrollIntoView({ behavior: 'smooth', block: 'center' });
              // Highlight the section with a temporary background
              adminSection.style.transition = 'background 0.3s ease';
              adminSection.style.background = '#fee2e2';
              setTimeout(() => {
                adminSection.style.background = '#f8fafc';
              }, 1000);
            }
            return; // Stop execution if admin validation fails
          }

          const domain = domainField ? domainField.value.trim() : '';
          const ip = ipField ? ipField.value.trim() : '';

          // Get admin credentials if admin panel is selected
          const adminUsername = document.getElementById('admin-username')?.value || '';
          const adminPassword = document.getElementById('admin-password')?.value || '';

          // Determine which script to generate
          let scriptToGenerate = null;
          let scriptName = '';

          if (adminPanelSelected && createAdminSelected) {
            scriptToGenerate = 'fullAdminSetup';
            scriptName = 'matrix-admin-setup.sh';
          } else if (adminPanelSelected) {
            scriptToGenerate = 'adminPanelSetup';
            scriptName = 'matrix-admin-panel.sh';
          } else if (createAdminSelected) {
            scriptToGenerate = 'createAdminUser';
            scriptName = 'matrix-create-admin.sh';
          }

          let downloadedScript = null;

          // Generate and download the admin script if needed
          if (scriptToGenerate && typeof window.generateAdminBashScript === 'function') {
            try {
              downloadedScript = window.generateAdminBashScript(scriptToGenerate, {
                DOMAIN: domain,
                ADMIN_USERNAME: adminUsername,
                ADMIN_PASSWORD: adminPassword
              });
              // Auto-download the script
              downloadBashFile(scriptName, downloadedScript.content);
              console.log('✅ Admin script downloaded:', scriptName);
            } catch (error) {
              console.error('Error generating admin script:', error);
            }
          }

          // Generate the main setup command
          let mainSetupCommand = `mkdir synapse && cd synapse`;

          // Add admin script execution to the command if needed
          if (downloadedScript) {
            mainSetupCommand += `\n\n# After Matrix stack is running, run the admin setup:\nbash ${scriptName}`;
          }

          const container = document.getElementById('generated-command-container');
          container.innerHTML = `<h3 style="margin-bottom: 0.75rem;">🚀 Your Custom Docker Stack Command</h3>`;

          // Create command block for main setup
          const mainCommandBlock = createCommandBlock(mainSetupCommand);
          container.appendChild(mainCommandBlock);

          // Add info about downloaded file
          if (downloadedScript) {
            const infoNote = document.createElement('div');
            infoNote.style.marginTop = '1rem';
            infoNote.style.padding = '0.75rem';
            infoNote.style.background = '#e6f7e6';
            infoNote.style.borderRadius = '8px';
            infoNote.style.borderLeft = '4px solid #4caf50';
            infoNote.innerHTML = `
        <strong>✅ ${scriptName}</strong> has been automatically downloaded.<br>
        Place it in the <code>synapse</code> folder before running the commands above.
      `;
            container.appendChild(infoNote);
          }

          const note = document.createElement('p');
          note.style.marginTop = '1rem';
          note.style.fontSize = '0.95rem';
          note.style.color = '#64748b';
          note.innerHTML = `⚡ This downloads and runs the setup script with your selected components.<br>
    ${domain ? `🌐 Domain set to: <code>${domain}</code><br>` : ''}
    ${ip ? `🖥️ IP set to: <code>${ip}</code><br>` : ''}
    ${adminPanelSelected ? `👤 Admin Panel configured with user: <code>${adminUsername}</code><br>` : ''}
    ${createAdminSelected ? `👥 Admin user creation included<br>` : ''}
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