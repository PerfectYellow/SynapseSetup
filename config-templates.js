// config-template.js
// Component templates for Matrix Synapse Docker stack

const COMPONENTS = {
  synapse: {
    id: 'synapse',
    label: 'Matrix Colony (Synapse Backend) – Core Matrix homeserver',
    dependencies: ['postgres', 'caddy', 'sliding-sync'],
    // Bash commands to run before docker-compose
    bashPre: () => `# Create synapse directories
mkdir -p synapse/data synapse/postgres
`,
    // YAML service definition
    yamlService: () => `  synapse:
    image: matrixdotorg/synapse:latest
    container_name: synapse
    restart: unless-stopped
    depends_on:
      - postgres
    volumes:
      - ./data:/data
    environment:
      SYNAPSE_CONFIG_PATH: /data/homeserver.yaml
    networks:
      - matrix
`,
    // Extra files to write (relative to working directory)
    extraFiles: () => []
  },

  postgres: {
    id: 'postgres',
    label: 'PostgreSQL – Database backend',
    dependencies: [],
    bashPre: () => `# PostgreSQL data directory created with synapse
`,
    yamlService: () => `  postgres:
    image: postgres:16
    container_name: synapse-postgres
    restart: unless-stopped
    environment:
      POSTGRES_DB: synapse
      POSTGRES_USER: synapse
      POSTGRES_PASSWORD: strong-password # \${POSTGRES_PASSWORD}
      LANG: C.UTF-8
      LC_ALL: C.UTF-8
    volumes:
      - ./postgres:/var/lib/postgresql/data
    networks:
      - matrix
`,
    extraFiles: () => []
  },

  'sliding-sync': {
    id: 'sliding-sync',
    label: 'Sliding Sync – Required for Element X clients',
    dependencies: ['synapse', 'postgres'],
    bashPre: () => '',
    yamlService: () => `  sliding-sync:
    image: ghcr.io/matrix-org/sliding-sync:v0.99.19
    container_name: sliding-sync
    restart: unless-stopped
    depends_on:
      - postgres
      - synapse
    environment:
      SYNCV3_SERVER: "http://synapse:8008"
      SYNCV3_DB: "postgres://synapse:\${POSTGRES_PASSWORD}@postgres/synapse?sslmode=disable"
      SYNCV3_SECRET: "b9e1af972ab2aa3463fa08e8859a7e093ee4db4a0e6093b9863c34608f3c85c2"
      SYNCV3_BINDADDR: "0.0.0.0:8009"
      SYNCV3_LOG_LEVEL: "info"
    networks:
      - matrix
`,
    extraFiles: () => []
  },

  caddy: {
    id: 'caddy',
    label: 'Caddy – Reverse proxy with automatic SSL',
    dependencies: [],
    bashPre: () => `# Create Caddyfile
cat > Caddyfile << 'EOF'
# Caddyfile configuration for Matrix
# You may need to adjust domain names

matrix.example.com {
    reverse_proxy synapse:8008
}

# Federation port
:8448 {
    reverse_proxy synapse:8008
}
EOF
`,
    yamlService: () => `  caddy:
    image: caddy:latest
    container_name: caddy
    restart: unless-stopped
    networks:
      - matrix
    ports:
      - "80:80"
      - "443:443"
      - "8448:8448"
    environment:
      ACME_AGREE: "true"
    volumes:
      - ./Caddyfile:/etc/caddy/Caddyfile
      - caddy_data:/data
      - caddy_config:/config
    env_file:
      - .env
`,
    extraFiles: () => [
      {
        path: '.env',
        content: `# Environment variables for Docker Compose
# You can override POSTGRES_PASSWORD here
POSTGRES_PASSWORD=strong-password
`
      }
    ]
  },

  livekit: {
    id: 'livekit',
    label: 'LiveKit + LK JWT Server – Voice/video calls',
    dependencies: [],
    bashPre: () => '',
    yamlService: () => `  # Placeholder for LiveKit service
  # Add actual service definition here
`,
    extraFiles: () => []
  },

  coturn: {
    id: 'coturn',
    label: 'Coturn TURN Server – For calls behind NAT/firewalls',
    dependencies: [],
    bashPre: () => '',
    yamlService: () => `  # Placeholder for Coturn service
`,
    extraFiles: () => []
  },

  admin: {
    id: 'admin',
    label: 'Admin Panel – For managing users and rooms',
    dependencies: [],
    bashPre: () => '',
    yamlService: () => `  # Placeholder for Admin Panel service
`,
    extraFiles: () => []
  }
};

// Common top-level docker-compose structure
const COMPOSE_HEAD = `version: "3.9"

services:
`;

const COMPOSE_FOOT = `
networks:
  matrix:
    external: true
    name: matrix-shared

volumes:
  caddy_data:
  caddy_config:
`;