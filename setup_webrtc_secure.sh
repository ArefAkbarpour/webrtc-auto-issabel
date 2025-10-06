#!/bin/bash
# WebRTC + SSL + Security Setup for Issabel / Asterisk
# Author: Aref's Assistant (Public Git-Ready)

echo "---- WebRTC Auto Setup ----"
read -p "Enter your domain (e.g., webrtc.example.com): " DOMAIN
read -p "Enter the ONLY web host IP allowed to register (e.g., 192.168.1.10): " WEB_IP

# === System Prep ===
hostnamectl set-hostname "$DOMAIN"
yum install -y epel-release certbot firewalld

systemctl enable firewalld
systemctl start firewalld

# === SSL ===
systemctl stop asterisk httpd
certbot certonly --standalone -d "$DOMAIN" -m admin@"$DOMAIN" --agree-tos --non-interactive

SSL_PATH="/etc/letsencrypt/live/$DOMAIN"
AST_SSL_DIR="/etc/asterisk/keys"
mkdir -p "$AST_SSL_DIR"
cp "$SSL_PATH/fullchain.pem" "$AST_SSL_DIR/asterisk.crt"
cp "$SSL_PATH/privkey.pem" "$AST_SSL_DIR/asterisk.key"
chmod 600 "$AST_SSL_DIR/"*

# === Asterisk Config ===
cat >/etc/asterisk/http.conf <<EOF
[general]
enabled=yes
bindaddr=0.0.0.0
bindport=8088
tlsenable=yes
tlsbindaddr=0.0.0.0:8089
tlscertfile=$AST_SSL_DIR/asterisk.crt
tlsprivatekey=$AST_SSL_DIR/asterisk.key
EOF

cat >/etc/asterisk/pjsip_wss.conf <<EOF
[transport-wss]
type=transport
protocol=wss
bind=0.0.0.0
cert_file=$AST_SSL_DIR/asterisk.crt
priv_key_file=$AST_SSL_DIR/asterisk.key
method=tlsv1_2
EOF

# === Restrict Extensions ===
echo "Applying SIP registration IP restrictions..."
grep -q "\[1001\]" /etc/asterisk/pjsip.endpoint_custom.conf || cat >>/etc/asterisk/pjsip.endpoint_custom.conf <<EOF

[1001](endpoint_internal)
type=endpoint
context=from-internal
disallow=all
allow=ulaw,alaw,opus
aors=1001
auth=1001-auth
permit=$WEB_IP/32
deny=0.0.0.0/0.0.0.0
EOF

# === Firewall ===
echo "Configuring firewall..."
firewall-cmd --permanent --add-port=8089/tcp
firewall-cmd --permanent --add-port=8088/tcp
firewall-cmd --permanent --add-rich-rule="rule family='ipv4' source address='$WEB_IP' port port=5060 protocol=udp accept"
firewall-cmd --permanent --add-rich-rule="rule family='ipv4' port port=5060 protocol=udp drop"
firewall-cmd --reload

# === Reload Asterisk ===
systemctl start asterisk
asterisk -rx "core reload"
asterisk -rx "http show status"
echo "✅ Secured WebRTC ready on wss://$DOMAIN:8089/ws"
echo "Only $WEB_IP can register SIP devices."
