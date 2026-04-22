// matrix-setup.js
window.MatrixSetupTemplates = {
    completeSetup: {
        filename: 'matrix-complete-setup.sh',
        getContent: function(params) {
            const domain = params.DOMAIN;
            const ip = params.IP;
            const adminUsername = params.ADMIN_USERNAME;
            const adminPassword = params.ADMIN_PASSWORD;
            
            // Component selections
            const includeSynapse = params.INCLUDE_SYNAPSE === 'true';
            const includeSlidingSync = params.INCLUDE_SLIDING_SYNC === 'true';
            const includePostgres = params.INCLUDE_POSTGRES === 'true';
            const includeCaddy = params.INCLUDE_CADDY === 'true';
            const includeLiveKit = params.INCLUDE_LIVEKIT === 'true';
            const includeCoturn = params.INCLUDE_COTURN === 'true';
            const includeAdminPanel = params.INCLUDE_ADMIN_PANEL === 'true';
            const includeCreateAdmin = params.INCLUDE_CREATE_ADMIN === 'true';
            
            let dockerComposeServices = '';
            let additionalFunctions = '';
            let executionCommands = '';
            let envVars = '';
            let caddyConfig = '';
            let homeserverConfig = '';
            
            // Build docker-compose services based on selections
            if (includePostgres) {
                dockerComposeServices += '  postgres:\n';
                dockerComposeServices += '    image: postgres:16\n';
                dockerComposeServices += '    container_name: synapse-postgres\n';
                dockerComposeServices += '    restart: unless-stopped\n';
                dockerComposeServices += '    environment:\n';
                dockerComposeServices += '      POSTGRES_DB: synapse\n';
                dockerComposeServices += '      POSTGRES_USER: synapse\n';
                dockerComposeServices += '      POSTGRES_PASSWORD: strong-password\n';
                dockerComposeServices += '      LANG: C.UTF-8\n';
                dockerComposeServices += '      LC_ALL: C.UTF-8\n';
                dockerComposeServices += '    volumes:\n';
                dockerComposeServices += '      - ./postgres:/var/lib/postgresql/data\n';
                dockerComposeServices += '    networks:\n';
                dockerComposeServices += '      - matrix\n\n';
            }
            
            if (includeSynapse) {
                dockerComposeServices += '  synapse:\n';
                dockerComposeServices += '    image: matrixdotorg/synapse:v1.147.1\n';
                dockerComposeServices += '    container_name: synapse\n';
                dockerComposeServices += '    restart: unless-stopped\n';
                if (includePostgres) {
                    dockerComposeServices += '    depends_on:\n';
                    dockerComposeServices += '      - postgres\n';
                }
                dockerComposeServices += '    volumes:\n';
                dockerComposeServices += '      - ./data:/data\n';
                dockerComposeServices += '    environment:\n';
                dockerComposeServices += '      SYNAPSE_CONFIG_PATH: /data/homeserver.yaml\n';
                dockerComposeServices += '    networks:\n';
                dockerComposeServices += '      - matrix\n\n';
            }
            
            if (includeSlidingSync) {
                dockerComposeServices += '  sliding-sync:\n';
                dockerComposeServices += '    image: ghcr.io/matrix-org/sliding-sync:v0.99.19\n';
                dockerComposeServices += '    container_name: sliding-sync\n';
                dockerComposeServices += '    restart: unless-stopped\n';
                dockerComposeServices += '    depends_on:\n';
                if (includePostgres) dockerComposeServices += '      - postgres\n';
                if (includeSynapse) dockerComposeServices += '      - synapse\n';
                dockerComposeServices += '    environment:\n';
                dockerComposeServices += '      SYNCV3_SERVER: "http://synapse:8008"\n';
                dockerComposeServices += '      SYNCV3_DB: "postgres://synapse:strong-password@postgres/synapse?sslmode=disable"\n';
                dockerComposeServices += '      SYNCV3_SECRET: "b9e1af972ab2aa3463fa08e8859a7e093ee4db4a0e6093b9863c34608f3c85c2"\n';
                dockerComposeServices += '      SYNCV3_BINDADDR: "0.0.0.0:8009"\n';
                dockerComposeServices += '      SYNCV3_LOG_LEVEL: "info"\n';
                dockerComposeServices += '    networks:\n';
                dockerComposeServices += '      - matrix\n\n';
            }
            
            if (includeCaddy) {
                dockerComposeServices += '  caddy:\n';
                dockerComposeServices += '    image: caddy:latest\n';
                dockerComposeServices += '    container_name: caddy\n';
                dockerComposeServices += '    restart: unless-stopped\n';
                dockerComposeServices += '    networks:\n';
                dockerComposeServices += '      - matrix\n';
                dockerComposeServices += '    ports:\n';
                dockerComposeServices += '      - "80:80"\n';
                dockerComposeServices += '      - "443:443"\n';
                dockerComposeServices += '      - "8448:8448"\n';
                dockerComposeServices += '    environment:\n';
                dockerComposeServices += '      ACME_AGREE: "true"\n';
                dockerComposeServices += '    volumes:\n';
                dockerComposeServices += '      - ./Caddyfile:/etc/caddy/Caddyfile\n';
                dockerComposeServices += '      - caddy_data:/data\n';
                dockerComposeServices += '      - caddy_config:/config\n\n';
            }
            
            // Add Caddyfile configuration if Caddy is selected
            if (includeCaddy) {
                caddyConfig = '\n# Create Caddyfile configuration\ncaddyfile_configuration() {\n    echo "[i] Creating Caddyfile..."\n    cat > Caddyfile << "EOF"\n{\n    email admin@' + domain + '\n}\n\n' + domain + ' {\n    handle /.well-known/matrix/client {\n        header Content-Type "application/json"\n        header Access-Control-Allow-Origin "*"\n        respond `{\n            "m.homeserver": {"base_url": "https://' + domain + '"},\n            "org.matrix.msc4143.rtc_foci": [\n                {\n                    "type": "livekit",\n                    "livekit_service_url": "https://rtc.' + domain + '/livekit/jwt"\n                }\n            ]\n        }` 200\n    }\n\n    reverse_proxy /_matrix/* synapse:8008\n    reverse_proxy /_synapse/* synapse:8008\n    reverse_proxy /_sliding_sync/* sliding-sync:8009\n    reverse_proxy synapse:8008\n}\n\n' + domain + ':8448 {\n    reverse_proxy /_matrix/* synapse:8008\n    reverse_proxy synapse:8008\n}\n\nrtc.' + domain + ' {\n    handle /livekit/jwt* {\n        uri strip_prefix /livekit/jwt\n        reverse_proxy element-call-jwt:8080\n    }\n    handle /livekit/sfu* {\n        uri strip_prefix /livekit/sfu\n        reverse_proxy livekit-server:7880\n    }\n}\nEOF\n    echo "[✓] Caddyfile created"\n}\n';
                executionCommands += '    caddyfile_configuration\n';
            }
            
            // Add LiveKit configuration if selected
            if (includeLiveKit) {
                additionalFunctions += '\n# LiveKit configuration\nlivekit_configuration() {\n    echo "[i] Setting up LiveKit..."\n    mkdir -p livekit\n    \n    cat > ./livekit/docker-compose.yaml << "LIVEKIT_COMPOSE"\nservices:\n  auth-service:\n    image: ghcr.io/element-hq/lk-jwt-service:latest\n    container_name: element-call-jwt\n    hostname: auth-server\n    environment:\n      - LIVEKIT_JWT_PORT=8080\n      - LIVEKIT_URL=https://rtc.' + domain + '/livekit/sfu\n      - LIVEKIT_KEY=LIVEKIT_API_KEY\n      - LIVEKIT_SECRET=v3ry_str0ng_and_super_l0ng_super_secret_string_here_123456789\n      - LIVEKIT_FULL_ACCESS_HOMESERVERS=' + domain + '\n      - HOMESERVER_URL=http://synapse:8008\n    restart: unless-stopped\n    ports:\n      - "8070:8080"\n    networks:\n      - matrix\n\n  livekit:\n    image: livekit/livekit-server:latest\n    container_name: livekit-server\n    command: --config /etc/livekit.yaml\n    ports:\n      - "7880:7880/tcp"\n      - "7881:7881/tcp"\n      - "50100-50200:50100-50200/udp"\n    restart: unless-stopped\n    volumes:\n      - ./config.yaml:/etc/livekit.yaml:ro\n    networks:\n      - matrix\n\nnetworks:\n  matrix:\n    external: true\n    name: matrix-shared\nLIVEKIT_COMPOSE\n\n    cat > ./livekit/config.yaml << "LIVEKIT_CONFIG"\nport: 7880\nbind_addresses:\n  - "0.0.0.0"\nrtc:\n  tcp_port: 7881\n  port_range_start: 50100\n  port_range_end: 50200\n  use_external_ip: true        \n  node_ip: "' + ip + '"\nroom:\n  auto_create: true\nlogging:\n  level: debug\nkeys:\n  LIVEKIT_API_KEY: "v3ry_str0ng_and_super_l0ng_super_secret_string_here_123456789"\nLIVEKIT_CONFIG\n\n    docker compose -f ./livekit/docker-compose.yaml up -d\n    echo "[✓] LiveKit started"\n}\n';
                executionCommands += '    livekit_configuration\n';
            }
            
            // Add Coturn configuration if selected
            if (includeCoturn) {
                additionalFunctions += '\n# Coturn TURN server configuration\nturnserver_configuration() {\n    echo "[i] Setting up Coturn TURN server..."\n    \n    cat > turnserver.conf << "TURN_CONFIG"\nlistening-port=3478\nlistening-ip=0.0.0.0\nexternal-ip=' + ip + '\nrealm=' + domain + '\nserver-name=' + domain + '\nfingerprint\nuse-auth-secret\nstatic-auth-secret=SUPER_SECRET_KEY\ntotal-quota=100\nbps-capacity=0\nstale-nonce=600\nno-loopback-peers\nno-multicast-peers\nTURN_CONFIG\n\n    echo "[✓] turnserver.conf created"\n    echo "[i] Run Coturn container manually with: docker run -d --name coturn -p 3478:3478 -p 3478:3478/udp -v $(pwd)/turnserver.conf:/etc/coturn/turnserver.conf coturn/coturn"\n}\n';
                executionCommands += '    turnserver_configuration\n';
            }
            
            // Add Admin Panel configuration if selected
            if (includeAdminPanel) {
                additionalFunctions += '\n# Admin Panel Setup\nsetup_admin_panel() {\n    echo "[i] Setting up Admin Panel..."\n    mkdir -p admin-panel\n    \n    cat > ./admin-panel/docker-compose.yaml << "ADMIN_COMPOSE"\nversion: "3"\n\nservices:\n  synapse-admin:\n    image: awesometechnologies/synapse-admin:latest\n    container_name: synapse-admin\n    restart: unless-stopped\n    environment:\n      MATRIX_USERNAME: "@' + adminUsername + ':' + domain + '"\n      MATRIX_PASSWORD: "' + adminPassword + '"\n      MATRIX_URL: "https://' + domain + '"\n      MATRIX_SERVER_NAME: "' + domain + '"\n    ports:\n      - "8080:80"\nADMIN_COMPOSE\n\n    docker compose -f ./admin-panel/docker-compose.yaml up -d\n    echo "[✓] Admin Panel started on port 8080"\n}\n';
                executionCommands += '    setup_admin_panel\n';
            }
            
            // Add Create Admin User configuration if selected
            if (includeCreateAdmin) {
                additionalFunctions += '\n# Create Admin User in Synapse\ncreate_admin_user() {\n    echo "[i] Creating admin user in Synapse..."\n    sleep 5\n    docker compose exec synapse register_new_matrix_user \\\n        -c /data/homeserver.yaml \\\n        -u "' + adminUsername + '" \\\n        -p "' + adminPassword + '" \\\n        -a \\\n        http://synapse:8008 || true\n    echo "[✓] Admin user created: @' + adminUsername + ':' + domain + '"\n}\n';
                executionCommands += '    create_admin_user\n';
            }
            
            // Add env file creation if needed
            if (includeSynapse || includePostgres) {
                envVars = '\n# Create environment configuration\nenvironment_configuration() {\n    echo "[i] Creating .env file..."\n    cat > .env << "EOF"\nPOSTGRES_PASSWORD=strong-password\nSERVER_NAME=' + domain + '\nSERVER_URL=https://' + domain + '/\nACME_EMAIL=admin@' + domain + '\nTURN_SHARED_SECRET=SUPER_SECRET_KEY\nEOF\n    echo "[✓] .env file created"\n}\n';
                executionCommands = '    environment_configuration\n' + executionCommands;
            }
            
            // Add homeserver config if Synapse is selected
            if (includeSynapse) {
                homeserverConfig = '\n# Homeserver configuration\nhomeserver_configuration() {\n    echo "[i] Configuring homeserver..."\n    if [ ! -d "data" ]; then\n        docker run -it --rm \\\n        -v $(pwd)/data:/data \\\n        -e SYNAPSE_SERVER_NAME=' + domain + ' \\\n        -e SYNAPSE_REPORT_STATS=no \\\n        matrixdotorg/synapse:v1.147.1 generate\n    fi\n    \n    cat > ./data/homeserver.yaml << "EOF"\nserver_name: "' + domain + '"\npublic_baseurl: "https://' + domain + '/"\n\npid_file: /data/homeserver.pid\n\nlisteners:\n  - port: 8008\n    tls: false\n    type: http\n    x_forwarded: true\n    bind_addresses: ["0.0.0.0"]\n    resources:\n      - names: [client, federation]\n        compress: false\n\nsliding_sync_proxy_url: "http://sliding-sync:8009"\n\ndatabase:\n  name: psycopg2\n  args:\n    user: synapse\n    password: strong-password\n    database: synapse\n    host: synapse-postgres\n    port: 5432\n    cp_min: 5\n    cp_max: 10\n  allow_unsafe_locale: true\n\nlog_config: "/data/' + domain + '.log.config"\nmedia_store_path: /data/media_store\n\nregistration_shared_secret: "IBw6~14Q*A_PKMZ2NqU4mZolR5Np54ouvcZlhDepm4VNB#M.c:"\n\nreport_stats: false\n\nmacaroon_secret_key: "T1u#d,3=2qwUGoCN~o42PHNld3Dd0y-F5zNR~MA--Pdsgrvcf-"\nform_secret: "=HNqZ*nRM25z#^V2GK8T*B3Y8dvBJQ&OqmnW*F+xaW.4RE,Phc"\n\nsigning_key_path: "/data/' + domain + '.signing.key"\n\ntrusted_key_servers:\n  - server_name: "matrix.org"\n\nuser_directory:\n  enabled: true\n  search_all_users: true\n  prefer_local_users: true\n\npublic_room_list:\n  enabled: true\n\nenable_room_list_search: true\nallow_public_rooms_over_federation: true\n\nturn_uris:\n  - "turn:' + domain + ':3478?transport=udp"\n  - "turn:' + domain + ':3478?transport=tcp"\n  - "turns:' + domain + ':5349?transport=tcp"\n\nturn_shared_secret: "SUPER_SECRET_KEY"\nturn_user_lifetime: 86400000\nturn_allow_guests: true\n\nexperimental_features:\n  msc3575_enabled: true\n  msc3401_enabled: true\n  msc3266_enabled: true\n  msc4222_enabled: true\n  msc4140_enabled: true\n\nmax_event_delay_duration: 24h\n\nrc_message:\n  per_second: 0.5\n  burst_count: 30\n\nrc_delayed_event_mgmt:\n  per_second: 1\n  burst_count: 20\nEOF\n    echo "[✓] homeserver.yaml configured"\n}\n';
                executionCommands = '    homeserver_configuration\n' + executionCommands;
            }
            
            // Start building the complete script
            let script = '#!/bin/bash\n\n';
            script += '# Matrix Setup Script\n';
            script += '# Generated by Matrix Colony Setup\n';
            script += '# Domain: ' + domain + '\n';
            script += '# IP: ' + ip + '\n\n';
            script += 'set -e\n\n';
            script += 'echo "========================================="\n';
            script += 'echo "Matrix Colony Setup"\n';
            script += 'echo "========================================="\n\n';
            
            // Only include Docker installation if we have services to run
            if (dockerComposeServices.length > 0) {
                script += '# Docker installation\ndocker_installation() {\n';
                script += '    if ! docker --version >/dev/null 2>&1; then\n';
                script += '        echo "[i] Installing Docker..."\n';
                script += '        sudo apt update\n';
                script += '        sudo apt install -y ca-certificates curl gnupg\n';
                script += '        sudo install -m 0755 -d /etc/apt/keyrings\n';
                script += '        curl -fsSL https://download.docker.com/linux/ubuntu/gpg | sudo gpg --dearmor -o /etc/apt/keyrings/docker.gpg\n';
                script += '        sudo chmod a+r /etc/apt/keyrings/docker.gpg\n';
                script += '        echo "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.gpg] https://download.docker.com/linux/ubuntu $(. /etc/os-release && echo "$VERSION_CODENAME") stable" | sudo tee /etc/apt/sources.list.d/docker.list >/dev/null\n';
                script += '        sudo apt update\n';
                script += '        sudo apt install -y docker-ce docker-ce-cli containerd.io docker-compose-plugin\n';
                script += '        sudo systemctl enable docker\n';
                script += '        sudo systemctl start docker\n';
                script += '    fi\n';
                script += '    echo "[✓] Docker version: $(docker --version)"\n';
                script += '    echo "[✓] Docker Compose version: $(docker compose version)"\n';
                script += '}\n\n';
                
                script += '# Create docker-compose.yaml\ncreate_docker_compose() {\n';
                script += '    echo "[i] Creating docker-compose.yaml..."\n';
                script += '    cat > docker-compose.yaml << "EOF"\n';
                script += 'version: "3.9"\n\n';
                script += 'services:\n';
                script += dockerComposeServices;
                script += '\nnetworks:\n';
                script += '  matrix:\n';
                script += '    external: true\n';
                script += '    name: matrix-shared\n\n';
                script += 'volumes:\n';
                script += '  caddy_data:\n';
                script += '  caddy_config:\n';
                script += 'EOF\n';
                script += '    echo "[✓] docker-compose.yaml created"\n';
                script += '}\n\n';
                
                script += '# Start services\nstart_services() {\n';
                script += '    echo "[i] Starting Docker services..."\n';
                script += '    docker network create matrix-shared 2>/dev/null || true\n';
                script += '    docker compose up -d\n';
                script += '    echo "[✓] Services started"\n';
                script += '}\n\n';
            }
            
            // Add all the configuration functions
            script += envVars;
            script += caddyConfig;
            script += homeserverConfig;
            script += additionalFunctions;
            
            // Add firewall config only if we have services
            if (dockerComposeServices.length > 0) {
                script += '\n# Firewall configuration\nfirewall_configuration() {\n';
                script += '    echo "[i] Configuring firewall..."\n';
                script += '    if command -v ufw &>/dev/null; then\n';
                script += '        if ufw status verbose | grep -q "Status: active"; then\n';
                script += '            sudo ufw allow 60000:61000/udp\n';
                script += '            sudo ufw allow 8080/tcp\n';
                script += '            echo "[✓] UFW rules added"\n';
                script += '        fi\n';
                script += '    fi\n';
                script += '}\n';
            }
            
            // Main execution
            script += '\n# Main execution\nmain() {\n';
            script += '    echo "[i] Starting setup for domain: ' + domain + '\\n"\n';
            
            if (dockerComposeServices.length > 0) {
                script += '    docker_installation\n';
                script += '    create_docker_compose\n';
                script += executionCommands;
                script += '    start_services\n';
                script += '    firewall_configuration\n';
            } else {
                script += executionCommands;
            }
            
            script += '\n    echo "\\n========================================="\n';
            script += '    echo "[✓] Setup complete!"\n';
            script += '    echo "========================================="';
            
            if (includeSynapse) {
                script += '\n    echo "[i] Matrix URL: https://' + domain + '"';
            }
            if (includeAdminPanel) {
                script += '\n    echo "[i] Admin Panel: http://localhost:8080"';
                script += '\n    echo "[i] Admin Username: @' + adminUsername + ':' + domain + '"';
                script += '\n    echo "[i] Admin Password: ' + adminPassword + '"';
            }
            if (includeLiveKit) {
                script += '\n    echo "[i] LiveKit URL: https://rtc.' + domain + '"';
            }
            if (includeCoturn) {
                script += '\n    echo "[i] TURN server configured for: ' + domain + '"';
            }
            
            script += '\n    echo "========================================="\n';
            script += '}\n\n';
            script += 'main "$@"';
            
            return script;
        }
    }
};

// Generator function
window.generateMatrixSetupScript = function(params) {
    console.log('generateMatrixSetupScript called with:', params);
    
    var template = window.MatrixSetupTemplates.completeSetup;
    var content = template.getContent(params);
    
    return {
        filename: template.filename,
        content: content
    };
};

console.log('✅ matrix-setup.js loaded successfully');