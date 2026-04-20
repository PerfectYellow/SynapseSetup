const COMPONENTS = {
    postgres: {
        id: 'postgres',
        label: 'PostgreSQL – Database backend',
        dependencies: [],
        bashPre: () => '',
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
      - matrix`,
        extraFiles: () => []
    },

    synapse: {
        id: 'synapse',
        label: 'Matrix Colony (Synapse Backend) – Core Matrix homeserver',
        dependencies: ['postgres', 'caddy', 'sliding-sync'],
        bashPre: () => `# Create data directories
mkdir -p data media_store`,
        yamlService: () => `  synapse:
    image: matrixdotorg/synapse:latest
    container_name: synapse
    restart: unless-stopped
    depends_on:
      - postgres
    volumes:
      - ./data:/data
      - ./media_store:/data/media_store
    environment:
      SYNAPSE_CONFIG_PATH: /data/homeserver.yaml
    networks:
      - matrix`,
        extraFiles: () => [
            {
                path: 'data/homeserver.yaml',
                content: `# Synapse configuration
server_name: "${process.env.SERVER_NAME || 'elementsynapse.duckdns.org'}"
public_baseurl: "${process.env.SERVER_URL || 'https://elementsynapse.duckdns.org/'}"

pid_file: /data/homeserver.pid

listeners:
  - port: 8008
    tls: false
    type: http
    x_forwarded: true
    bind_addresses: ['0.0.0.0']
    resources:
      - names: [client, federation]
        compress: false

sliding_sync_proxy_url: "http://sliding-sync:8009"

database:
  name: psycopg2
  args:
    user: synapse
    password: strong-password  # \${POSTGRES_PASSWORD}
    database: synapse
    host: postgres
    port: 5432
    cp_min: 5
    cp_max: 10
  allow_unsafe_locale: true

log_config: "/data/elementsynapse.duckdns.org.log.config"
media_store_path: /data/media_store

registration_shared_secret: "IBw6~14Q*A_PKMZ2NqU4mZolR5Np54ouvcZlhDepm4VNB#M.c:"

report_stats: false

macaroon_secret_key: "T1u#d,3=2qwUGoCN~o42PHNld3Dd0y-F5zNR~MA--Pdsgrvcf-"
form_secret: "=HNqZ*nRM25z#^V2GK8T*B3Y8dvBJQ&OqmnW*F+xaW.4RE,Phc"

signing_key_path: "/data/elementsynapse.duckdns.org.signing.key"

trusted_key_servers:
  - server_name: "matrix.org"

user_directory:
  enabled: true
  search_all_users: true
  prefer_local_users: true

public_room_list:
  enabled: true

enable_room_list_search: true
allow_public_rooms_over_federation: true

turn_uris:
  - "turn:elementsynapse.duckdns.org:3478?transport=udp"
  - "turn:elementsynapse.duckdns.org:3478?transport=tcp"
  - "turns:elementsynapse.duckdns.org:5349?transport=tcp"

turn_shared_secret: "SUPER_SECRET_KEY"  # \${TURN_SHARED_SECRET}
turn_user_lifetime: 86400000
turn_allow_guests: true

experimental_features:
  msc3575_enabled: true
  msc3401_enabled: true
  msc3266_enabled: true
  msc4222_enabled: true
  msc4140_enabled: true

max_event_delay_duration: 24h

rc_message:
  per_second: 0.5
  burst_count: 30

rc_delayed_event_mgmt:
  per_second: 1
  burst_count: 20`
            }
        ]
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
      - matrix`,
        extraFiles: () => []
    },

    caddy: {
        id: 'caddy',
        label: 'Caddy – Reverse proxy with automatic SSL',
        dependencies: [],
        bashPre: () => '',
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
      - .env`,
        extraFiles: () => [
            {
                path: 'Caddyfile',
                content: `# Caddyfile for Matrix
{
    email neo.mohammad.afshar@gmail.com
}

elementsynapse.duckdns.org {
    handle /.well-known/matrix/client {
        header Content-Type "application/json"
        header Access-Control-Allow-Origin "*"
        respond \`{
            "m.homeserver": {"base_url": "https://elementsynapse.duckdns.org"},
            "org.matrix.msc4143.rtc_foci": [
                {
                    "type": "livekit",
                    "livekit_service_url": "https://rtc.elementsynapse.duckdns.org/livekit/jwt"
                }
            ]
        }\` 200
    }

    reverse_proxy /_matrix/* synapse:8008
    reverse_proxy /_synapse/* synapse:8008
    reverse_proxy /_sliding_sync/* sliding-sync:8009
    reverse_proxy synapse:8008
}

elementsynapse.duckdns.org:8448 {
    reverse_proxy /_matrix/* synapse:8008
    reverse_proxy synapse:8008
}

rtc.elementsynapse.duckdns.org {
    handle /livekit/jwt* {
        uri strip_prefix /livekit/jwt
        reverse_proxy element-call-jwt:8080
    }
    handle /livekit/sfu* {
        uri strip_prefix /livekit/sfu
        reverse_proxy livekit-server:7880
    }
}`
            },
            {
                path: '.env',
                content: `POSTGRES_PASSWORD=strong-password
SERVER_NAME=elementsynapse.duckdns.org
SERVER_URL=https://elementsynapse.duckdns.org/
ACME_EMAIL=neo.mohammad.afshar@gmail.com
TURN_SHARED_SECRET="SUPER_SECRET_KEY"`
            }
        ]
    },

    admin: {
        id: 'admin',
        label: 'Admin Panel – For managing users and rooms',
        dependencies: [],
        bashPre: () => '',
        yamlService: () => `  synapse-admin:
    image: awesometechnologies/synapse-admin:latest
    container_name: synapse-admin
    restart: unless-stopped
    environment:
      MATRIX_USERNAME: "@admin:elementsynapse.duckdns.org"
      MATRIX_PASSWORD: "admin12345"
      MATRIX_URL: "https://elementsynapse.duckdns.org"
      MATRIX_SERVER_NAME: "elementsynapse.duckdns.org"
    ports:
      - "8080:80"
    networks:
      - matrix`,
        extraFiles: () => []
    },

    livekit: {
        id: 'livekit',
        label: 'LiveKit + LK JWT Server – Voice/video calls',
        dependencies: [],
        bashPre: () => `# Create livekit config
mkdir -p livekit`,
        yamlService: () => `  auth-service:
    image: ghcr.io/element-hq/lk-jwt-service:latest
    container_name: element-call-jwt
    hostname: auth-server
    environment:
      - LIVEKIT_JWT_PORT=8080
      - LIVEKIT_URL=https://rtc.elementsynapse.duckdns.org/livekit/sfu
      - LIVEKIT_KEY=LIVEKIT_API_KEY
      - LIVEKIT_SECRET=v3ry_str0ng_and_super_l0ng_super_secret_string_here_123456789
      - LIVEKIT_FULL_ACCESS_HOMESERVERS=elementsynapse.duckdns.org
      - HOMESERVER_URL=http://synapse:8008
    restart: unless-stopped
    ports:
      - "8070:8080"
    networks:
      - matrix

  livekit-server:
    image: livekit/livekit-server:latest
    container_name: livekit-server
    command: --config /etc/livekit.yaml
    ports:
      - "7880:7880/tcp"
      - "7881:7881/tcp"
      - "50100-50200:50100-50200/udp"
    restart: unless-stopped
    volumes:
      - ./livekit/config.yaml:/etc/livekit.yaml:ro
    networks:
      - matrix`,
        extraFiles: () => [
            {
                path: 'livekit/config.yaml',
                content: `port: 7880
bind_addresses:
  - "0.0.0.0"
rtc:
  tcp_port: 7881
  port_range_start: 50100
  port_range_end: 50200
  use_external_ip: true
  node_ip: "69.164.244.72"     # ← replace with your public IP
room:
  auto_create: true
logging:
  level: debug
keys:
  LIVEKIT_API_KEY: "v3ry_str0ng_and_super_l0ng_super_secret_string_here_123456789"`
            }
        ]
    },

    coturn: {
        id: 'coturn',
        label: 'Coturn TURN Server – For calls behind NAT/firewalls',
        dependencies: [],
        bashPre: () => '',
        yamlService: () => `  # Placeholder for Coturn service – add your definition here`,
        extraFiles: () => []
    }
};

// Common docker-compose header and footer
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