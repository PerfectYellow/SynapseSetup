#!/bin/bash

# Script: MatrixSynapseSetup.sh
# Purpose: Creates and Setup Matrix Synapse Backend
# Author: Mohammad Afshar
# Date: 2026
# Usage: bash ./MatrixSynapseSetup.sh


# Get terminal width
cols=$(tput cols)
lines=$(tput lines)

# ANSI color codes
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[0;33m'
NC='\033[0m' # No color

SERVER_IP=""
SERVER_DOMAIN_NAME=""

synapse_directory_and_docker_check() {
  # This script creates and navigate to the 'synapse' directory if it doesn't exist
  if [ ! -d "synapse" ]; then
    mkdir "synapse"
    cd "synapse"
    echo "Directory 'synapse' created."
  else
    echo "Directory 'synapse' already exists."
    unique_id=$(date +%s%N)
    mkdir "synapse_${unique_id}"
    cd "synapse_${unique_id}"
    echo "Directory created: synapse_${unique_id}"
  fi

  IMAGE="matrixdotorg/synapse:v1.147.1"

  if docker image inspect "$IMAGE" >/dev/null 2>&1; then
    echo "Image $IMAGE exists."
  else
    echo "Image $IMAGE not found."
  fi
}

synapse_admin_directory_and_docker_check() {
  if [ ! -d "synapse-admin" ]; then
    mkdir "synapse-admin"
    cd "synapse-admin"
    echo "Directory 'synapse-admin' created."
  else
    echo "Directory 'synapse-admin' already exists."
    unique_id=$(date +%s%N)
    mkdir "synapse-admin_${unique_id}"
    cd "synapse-admin_${unique_id}"
    echo "Directory created: synapse-admin_${unique_id}"
  fi

  IMAGE="awesometechnologies/synapse-admin:latest"

  if docker image inspect "$IMAGE" >/dev/null 2>&1; then
    echo "Image $IMAGE exists."
  else
    echo "Image $IMAGE not found."
  fi
}

read_initial_necessary_server_info() {
  read -p "Please enter the Server IP address (example: 72.62.114.117) : " SERVER_IP
  read -p "Please enter the Server Domain Name (example: elementsynapse.duckdns.org) : " SERVER_DOMAIN_NAME
  if [ -z "$SERVER_IP" ]; then
    echo "Error: Server IP cannot be empty."
    exit 1
  fi

  if [ -z "$SERVER_DOMAIN_NAME" ]; then
    echo "Error: Server Domain Name cannot be empty."
    exit 1
  fi
}

# Function to Present big logo on start
logo_presenter() {
  logo_lines=(
  "███╗   ███╗ █████╗ ████████╗██████╗ ██╗██╗  ██╗"
  "████╗ ████║██╔══██╗╚══██╔══╝██╔══██╗██║╚██╗██╔╝"
  "██╔████╔██║███████║   ██║   ██████╔╝██║ ╚███╔╝ "
  "██║╚██╔╝██║██╔══██║   ██║   ██╔══██╗██║ ██╔██╗ "
  "██║ ╚═╝ ██║██║  ██║   ██║   ██║  ██║██║██╔╝ ██╗"
  "╚═╝     ╚═╝╚═╝  ╚═╝   ╚═╝   ╚═╝  ╚═╝╚═╝╚═╝  ╚═╝"
  "" # Empty line for spacing
  "███████╗███╗  ╔███╔███╗  ██╗ █████╗ ██████╗ ███████╗███████╗          ███████╗███████╗████████╗██╗   ██╗██████╗ "
  "██╔════╝╚███╗╔███╝║████╗ ██║██╔══██╗██╔══██╗██╔════╝██╔════╝          ██╔════╝██╔════╝╚══██╔══╝██║   ██║██╔══██╗"
  "███████╗ ╚██████╝ ║██╔█████║███████║██████╔╝███████╗█████╗            ███████╗█████╗     ██║   ██║   ██║██████╔╝"
  "╚════██║   ║██║   ║██║╚████║██╔══██║██╔═══╝ ╚════██║██╔══╝            ╚════██║██╔══╝     ██║   ██║   ██║██╔═══╝ "
  "███████║   ║██║   ║██║ ╚═██║██║  ██║██║     ███████║███████╗          ███████║███████╗   ██║   ╚██████╔╝██║     "
  "╚══════╝   ╚══╝   ╚══╝   ╚═╝╚═╝  ╚═╝╚═╝     ╚══════╝╚══════╝          ╚══════╝╚══════╝   ╚═╝    ╚═════╝ ╚═╝     "
  )

  # --- Process and Display LOGO ---
  clear
  echo # Top margin

  if [ "$lines" -gt 40 ] && [ "$cols" -gt 140 ]; then
    # Calculate padding for centering
    for line in "${logo_lines[@]}"; do
      # Remove ANSI color codes for accurate length calculation
      clean_line=$(echo -e "$line" | sed 's/\x1b\[[0-9;]*m//g')
      padding=$(((cols - ${#clean_line}) / 2))

      # Check if "Synapse" is in the line and color it
      if [[ "$line" == *Synapse* ]]; then
        # Use parameter expansion to replace "Synapse" with colored version
        colored_line="${line//Synapse/$BLUE""Synapse""$RESET}"
        printf "%${padding}s%s\n" "" "$colored_line"
      else
        printf "%${padding}s%s\n" "" "$line"
      fi
    done

    echo # Bottom margin

    # --- Optional: Add a simple frame ---
    printf '%*s\n' "$cols" '' | tr ' ' "$GREEN"'-'"$RESET"
    echo                                   # Space after frame
    printf '%*s\n' "$cols" '' | tr ' ' '.' # Another decorative line
    echo                                   # Space after frame
  fi

  echo Welcome to Matrix Synapse Backend Setup, please run this bash code from your root directory in your server.
}

# Function to display the main menu
show_main_menu() {
    clear
    echo "=============================="
    echo "          Main Menu           "
    echo "=============================="
    echo "1. Create and Start Matrix Synapse Server"
    echo "2. Create and Start Admin Panel"
    echo "3. Configure Synapse Server"
    echo "0. Exit"
    echo "------------------------------"
    read -p "Enter your choice [1-4]: " main_choice
}

# Function to display the configuration sub-menu
show_config_menu() {
    clear
    echo "=============================="
    echo "       Configure Server       "
    echo "=============================="
    echo "1. Activate User Search"
    echo "2. Deactivate User Search"
    echo "0. Back to Main Menu"
    echo "------------------------------"
    read -p "Enter your choice [1-4]: " config_choice
}

# Function to check and install docker
docker_installation() {
  # Check if Docker is installed
  if ! docker --version >/dev/null 2>&1; then
    echo "Installing Docker..."
    sudo apt update

    sudo apt install -y ca-certificates curl gnupg

    # Add Docker’s official GPG key
    sudo install -m 0755 -d /etc/apt/keyrings
    curl -fsSL https://download.docker.com/linux/ubuntu/gpg | sudo gpg --dearmor -o /etc/apt/keyrings/docker.gpg
    sudo chmod a+r /etc/apt/keyrings/docker.gpg

    # Add Docker repo
    echo \
      "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.gpg] \
    https://download.docker.com/linux/ubuntu \
    $(. /etc/os-release && echo "$VERSION_CODENAME") stable" |
      sudo tee /etc/apt/sources.list.d/docker.list >/dev/null

    # Install Docker
    sudo apt update
    sudo apt install -y docker-ce docker-ce-cli containerd.io docker-compose-plugin

    # enable Docker on boot
    sudo systemctl enable docker
    sudo systemctl start docker
  fi

  # Verify Docker and Docker Compose installation
  echo "Docker version:"
  docker --version
  echo "Docker Compose version:"
  docker compose version
}

# Function to create Synapse using docker compose
synapse_initialization() {
  # Define the YAML content for the docker-compose file
  cat <<EOF > docker-compose.yaml
  version: "3.9"

  services:
    postgres:
      image: postgres:16
      container_name: synapse-postgres
      restart: unless-stopped
    environment:
      POSTGRES_DB: synapse
      POSTGRES_USER: synapse
      POSTGRES_PASSWORD: strong-password # ${POSTGRES_PASSWORD}
      LANG: C.UTF-8     # LANG: C     
      LC_ALL: C.UTF-8   # LC_ALL: C   
    volumes:
      - ./postgres:/var/lib/postgresql/data
    networks:
      - matrix

    synapse:
      image: matrixdotorg/synapse:v1.147.1
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

    sliding-sync:
      image: ghcr.io/matrix-org/sliding-sync:v0.99.19
      container_name: sliding-sync
      restart: unless-stopped
      depends_on:
        - postgres
        - synapse
      environment:
        SYNCV3_SERVER: "http://synapse:8008"
        SYNCV3_DB: "postgres://synapse:${POSTGRES_PASSWORD}@postgres/synapse?sslmode=disable"
        SYNCV3_SECRET: "b9e1af972ab2aa3463fa08e8859a7e093ee4db4a0e6093b9863c34608f3c85c2"
        SYNCV3_BINDADDR: "0.0.0.0:8009"
        SYNCV3_LOG_LEVEL: "info"
      networks:
        - matrix

  caddy:
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

  networks:
    matrix:
      external: true
      name: matrix-shared

  volumes:
    caddy_data:
    caddy_config:

EOF
  
  echo "Synapse docker-compose.yaml created successfully!"
  docker compose up -d
  echo "Synapse services started"
}

environment_configuration() {
  cat <<EOF > .env.txt
  POSTGRES_PASSWORD=strong-password
  SERVER_NAME=elementsynapse.duckdns.org
  SERVER_URL=https://elementsynapse.duckdns.org/
  ACME_EMAIL=neo.mohammad.afshar@gmail.com

  TURN_SHARED_SECRET="SUPER_SECRET_KEY"
EOF
}

caddyfile_configuration() {
  cat <<EOF > Caddyfile
  {
      email neo.mohammad.afshar@gmail.com
  }

  elementsynapse.duckdns.org {
      handle /.well-known/matrix/client {
          header Content-Type "application/json"
          header Access-Control-Allow-Origin "*"
          respond `{
              "m.homeserver": {"base_url": "https://elementsynapse.duckdns.org"},
              "org.matrix.msc4143.rtc_foci": [
                  {
                      "type": "livekit",
                      "livekit_service_url": "https://rtc.elementsynapse.duckdns.org/livekit/jwt"
                  }
              ]
          }` 200
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
  }
EOF
}

homeserver_initial_configuration() {
  if [ -d "data" ]; then
    echo "data directory exists"
  else
    docker run -it --rm \
    -v $(pwd)/data:/data \
    -e SYNAPSE_SERVER_NAME=$SERVER_DOMAIN_NAME \
    -e SYNAPSE_REPORT_STATS=no \
    matrixdotorg/synapse:v1.147.1 generate
  fi

  HOMESERVER_CONFIG=$(cat <<EOF
  server_name: "$SERVER_DOMAIN_NAME"
  public_baseurl: "https://$SERVER_DOMAIN_NAME/"

  pid_file: /data/homeserver.pid

  listeners:
    - port: 8008
      tls: false
      type: http
      x_forwarded: true   # true ONLY if using Caddy/Nginx
      bind_addresses: ['0.0.0.0']
      resources:
        - names: [client, federation]
          compress: false

  sliding_sync_proxy_url: "http://sliding-sync:8009"

  # PostgreSQL 
  database:
    name: psycopg2
    args:
      user: synapse
      password: strong-password # ${POSTGRES_PASSWORD}
      database: synapse
      host: synapse-postgres
      port: 5432
      cp_min: 5
      cp_max: 10
    allow_unsafe_locale: true 

  log_config: "/data/$SERVER_DOMAIN_NAME.log.config"
  media_store_path: /data/media_store

  registration_shared_secret: "IBw6~14Q*A_PKMZ2NqU4mZolR5Np54ouvcZlhDepm4VNB#M.c:"

  report_stats: false

  macaroon_secret_key: "T1u#d,3=2qwUGoCN~o42PHNld3Dd0y-F5zNR~MA--Pdsgrvcf-"
  form_secret: "=HNqZ*nRM25z#^V2GK8T*B3Y8dvBJQ&OqmnW*F+xaW.4RE,Phc"

  signing_key_path: "/data/$SERVER_DOMAIN_NAME.signing.key"

  trusted_key_servers:
    - server_name: "matrix.org"

  # User directory
  user_directory:
    enabled: true
    search_all_users: true
    prefer_local_users: true

  # Public rooms
  public_room_list:
    enabled: true

  enable_room_list_search: true
  allow_public_rooms_over_federation: true

  # TURN server
  turn_uris:
    - "turn:$SERVER_DOMAIN_NAME:3478?transport=udp"
    - "turn:$SERVER_DOMAIN_NAME:3478?transport=tcp"
    - "turns:$SERVER_DOMAIN_NAME:5349?transport=tcp"

  turn_shared_secret: "SUPER_SECRET_KEY" # ${TURN_SHARED_SECRET}
  turn_user_lifetime: 86400000
  turn_allow_guests: true


  experimental_features:
    msc3575_enabled: true  # Sliding Sync
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
    burst_count: 20
EOF
)

  if [ -f "./data/homeserver.yaml" ]; then
    echo "$HOMESERVER_CONFIG" > "./data/homeserver.yaml"
    echo "homeserver.yaml Updated."
  elif [ -f "./data/homeserver.yml" ]; then
    echo "$HOMESERVER_CONFIG" > "./data/homeserver.yml"
    echo "homeserver.yml Updated."
  else
    echo "Creating homeserver.yaml"
    echo "$HOMESERVER_CONFIG" > "./data/homeserver.yaml" 
  fi

  docker compose restart
}

turnserver_configuration() {
  cat <<EOF > turnserver.conf
  listening-port=3478
  listening-ip=0.0.0.0

  external-ip=69.164.244.72

  realm=elementsynapse.duckdns.org
  server-name=elementsynapse.duckdns.org

  fingerprint
  use-auth-secret
  static-auth-secret=SUPER_SECRET_KEY

  total-quota=100
  bps-capacity=0
  stale-nonce=600

  no-loopback-peers
  no-multicast-peers
EOF

  echo "turnserver.conf created successfully!"
}

livekit_configuration() {
  mkdir livekit

  LIVEKIT_COMPOSE=$(cat <<EOF
  services:
    auth-service:
      image: ghcr.io/element-hq/lk-jwt-service:latest
      container_name: element-call-jwt
      hostname: auth-server
      environment:
        - LIVEKIT_JWT_PORT=8080
        - LIVEKIT_URL=https://rtc.$SERVER_DOMAIN_NAME/livekit/sfu
        - LIVEKIT_KEY=LIVEKIT_API_KEY
        - LIVEKIT_SECRET=v3ry_str0ng_and_super_l0ng_super_secret_string_here_123456789
        - LIVEKIT_FULL_ACCESS_HOMESERVERS=$SERVER_DOMAIN_NAME
        - HOMESERVER_URL=http://synapse:8008
        # - LIVEKIT_HOMESERVER_URL=http://synapse:8008
        # - MATRIX_HOMESERVER_URL=http://synapse:8008     # fallback alias
      restart: unless-stopped
      ports:
        - "8070:8080"
      networks:
        - matrix

    livekit:
      image: livekit/livekit-server:latest
      container_name: livekit-server
      command: --config /etc/livekit.yaml
      ports:
        - "7880:7880/tcp"
        - "7881:7881/tcp"
        - "50100-50200:50100-50200/udp"
      restart: unless-stopped
      volumes:
        - ./config.yaml:/etc/livekit.yaml:ro
      networks:
        - matrix

  networks:
    matrix:
      external: true
      name: matrix-shared
EOF

  LIVEKIT_CONFIG=$(cat <<EOF
  port: 7880
  bind_addresses:
    - "0.0.0.0"
  rtc:
    tcp_port: 7881
    port_range_start: 50100
    port_range_end: 50200
    use_external_ip: true        
    node_ip: "69.164.244.72"     # ← add your public IP
  room:
    auto_create: true
  logging:
    level: debug
  keys:
    LIVEKIT_API_KEY: "v3ry_str0ng_and_super_l0ng_super_secret_string_here_123456789"
EOF

  echo "$LIVEKIT_COMPOSE" > "./livekit/docker-compose.yaml"
  echo "$LIVEKIT_CONFIG" > "./livekit/config.yaml"

  docker compose -f ./livekit/docker-compose.yaml up -d
}

admin_panel_setup() {
  mkdir admin-panel

  ADMIN_PANEL_COMPOSE=$(cat <<EOF
  version: "3"

  services:
    synapse-admin:
      image: awesometechnologies/synapse-admin:latest
      container_name: synapse-admin
      restart: unless-stopped
      environment:
        MATRIX_USERNAME: "@admin:$SERVER_DOMAIN_NAME"
        MATRIX_PASSWORD: "admin12345"
        MATRIX_URL: "https://$SERVER_DOMAIN_NAME"
        MATRIX_SERVER_NAME: "$SERVER_DOMAIN_NAME"
      ports:
        - "8080:80"
EOF

  echo "$ADMIN_PANEL_COMPOSE" > "./admin-panel/docker-compose.yaml"

  docker compose -f ./admin-panel/docker-compose.yaml up -d
}

generate_new_admin_user() {
  docker compose exec synapse register_new_matrix_user -c /data/homeserver.yaml http://synapse:8008
}

modify_yaml_property() {
    local FILE="$1" PARENT="$2" PROP="$3" VAL="$4"
    
    [ ! -f "$FILE" ] && { echo "Error: File not found: $FILE" >&2; return 1; }
    
    # Backup
    cp "$FILE" "${FILE}.bak"
    
    # Escape and modify
    local ESC_PARENT=$(printf '%s' "$PARENT" | sed 's/[\/&]/\\&/g')
    local ESC_PROP=$(printf '%s' "$PROP" | sed 's/[\/&]/\\&/g')
    
    if command -v perl >/dev/null 2>&1; then
        perl -i -pe "BEGIN{\$in=0} if(!\$in&&/^${ESC_PARENT}:/){\$in=1} elsif(\$in&&/^[a-zA-Z]/){\$in=0} elsif(\$in&&/^(\s*)${ESC_PROP}:/){\$_=\$1.\"${ESC_PROP}: ${VAL}\n\"}" "$FILE"
    else
        awk -v p="$PARENT" -v k="$PROP" -v v="$VAL" 'BEGIN{i=0} $0~"^"p":"{i=1} i&&/^[a-zA-Z]/&&$0!~"^"p":"{i=0} i&&$0~"^[[:space:]]*"k":"{sub(k":.*",k": "v)} 1' "${FILE}.bak" > "$FILE"
    fi
    
    grep -q "^[[:space:]]*${PROP}:[[:space:]]*${VAL}" "$FILE" && { rm "${FILE}.bak"; return 0; } || { mv "${FILE}.bak" "$FILE"; return 1; }
}


# Update firewall rules
# Define the port range and protocol
DOCKER_PORT_RANGE="60000:61000"
DOCKER_PROTOCOL="udp"

ADMIN_PANEL_PORT=8080
ADMIN_PANEL_PROTOCOL="tcp"

# Function to check and apply rule for UFW
apply_ufw_rule() {
  if command -v ufw &>/dev/null; then
    echo "Checking UFW status..."
    if ufw status verbose | grep -q "Status: active"; then
      # Docker ports and protocol
      echo "Adding rule to allow $DOCKER_PORT_RANGE/$DOCKER_PROTOCOL for Docker via UFW..."
      sudo ufw allow $DOCKER_PORT_RANGE/$DOCKER_PROTOCOL

      # Admin Panel port and protocol
      echo "Adding rule to allow $ADMIN_PANEL_PORT/$ADMIN_PANEL_PROTOCOL for Admin Panel via UFW..."
      sudo ufw allow $ADMIN_PANEL_PORT/$ADMIN_PANEL_PROTOCOL

      echo "Rule added successfully."
    else
      echo "UFW is not active. Rule not applied."
    fi
  else
    echo "UFW is not installed or not available."
  fi
}

# Function to check and apply rule for iptables
apply_iptables_rule() {
  if command -v iptables &>/dev/null; then
    echo "Checking iptables rules..."

    # Docker ports and protocol
    echo "Adding rule to allow $DOCKER_PORT_RANGE/$DOCKER_PROTOCOL  for Docker via iptables..."
    sudo iptables -A INPUT -p $DOCKER_PROTOCOL --dport $DOCKER_PORT_RANGE -j ACCEPT

    # Admin Panel port and protocol
    echo "Adding rule to allow $ADMIN_PANEL_PORT/$ADMIN_PANEL_PROTOCOL  for Admin Panel via iptables..."
    sudo iptables -A INPUT -p $ADMIN_PANEL_PROTOCOL --dport $ADMIN_PANEL_PORT -j ACCEPT

    echo "Rule added successfully. Saving iptables rules for persistence..."
    sudo iptables-save >/etc/iptables/rules.v4
  else
    echo "iptables is not installed or not available."
  fi
}

# Function to check and apply rule for firewalld
apply_firewalld_rule() {
  if command -v firewall-cmd &>/dev/null; then
    echo "Checking firewalld status..."
    if firewall-cmd --state &>/dev/null; then
      # Docker ports and protocol
      echo "Adding rule to allow $DOCKER_PORT_RANGE/$DOCKER_PROTOCOL for Docker via firewalld..."
      sudo firewall-cmd --add-port=$DOCKER_PORT_RANGE/$DOCKER_PROTOCOL --permanent

      # Admin Panel port and protocol
      echo "Adding rule to allow $ADMIN_PANEL_PORT/$ADMIN_PANEL_PROTOCOL for Admin Panel via firewalld..."
      sudo firewall-cmd --add-port=$ADMIN_PANEL_PORT/$ADMIN_PANEL_PROTOCOL --permanent

      sudo firewall-cmd --reload
      echo "Rule added successfully."
    else
      echo "firewalld is not running. Rule not applied."
    fi
  else
    echo "firewalld is not installed or not available."
  fi
}

# Final Firewall verification
echo "Verifying firewall rules..."
if command -v ufw &>/dev/null; then
  ufw status verbose
fi
if command -v iptables &>/dev/null; then
  iptables -L -n
fi
if command -v firewall-cmd &>/dev/null; then
  firewall-cmd --list-all
fi

#==============================
#        Synapse Setup
#==============================

create_synapse_server_and_start() {
  synapse_admin_directory_and_docker_check

  read_initial_necessary_server_info

  docker_installation

  environment_configuration
  caddyfile_configuration
  turnserver_configuration
  synapse_initialization
  homeserver_initial_configuration
  livekit_configuration

  apply_ufw_rule
  apply_iptables_rule
  apply_firewalld_rule
}

synapse_admin_panel_create_and_start() {
  synapse_admin_directory_and_docker_check

  admin_panel_setup
  generate_new_admin_user

  apply_ufw_rule
  apply_iptables_rule
  apply_firewalld_rule
}

#==============================
#       Server Configs
#==============================

homeserver_user_search() {
  local visibilty_flag="$1"
  homeserve_file="./data/homeserver.yaml"

   if [[ "$visibilty_flag" == "true" || "$visibilty_flag" == "false" ]]; then

    modify_yaml_property $homeserve_file user_directory search_all_users $svisibilty_flag

  else
    echo "Error: active_user_search() argument must be true or false"
    return 1
  fi
}

#==============================
#         Main Manu
#==============================

logo_presenter
while true; do
    show_main_menu

    case $main_choice in
        1)
            echo "Creating and Start Matrix Synapse Server..."
            sleep 3
            create_synapse_server_and_start
            ;;
        2)
            echo "Creating and Start Admin Panel..."
            sleep 3
            synapse_admin_panel_create_and_start
            ;;
        3)
            while true; do
                show_config_menu

                case $config_choice in
                    1)
                        echo "Activate User Search..."
                        sleep 3
                        homeserver_user_search true
                        ;;
                    2)
                        echo "Deactivating User Search..."
                        homeserver_user_search false
                        sleep 2
                        ;;
                    0)
                        echo "Returning to main menu..."
                        sleep 1
                        break # Exit the config menu loop
                        ;;
                    *)
                        echo "Invalid choice. Please try again."
                        sleep 1
                        ;;
                esac
            done
            ;;
        0)
            echo "Exiting application. Goodbye!"
            exit 0
            ;;
        *)
            echo "Invalid choice. Please try again."
            sleep 1
            ;;
    esac
done
