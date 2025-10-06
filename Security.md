Security Guidelines

This project automates domain and SSL setup for WebRTC servers and includes a client demo. Security is critical because the exposed extension/web interface could be targeted if publicly accessible. This document outlines best practices to protect your server and limit access to trusted clients.

🛡 Server Security

1. Limit IP Access
	•	Restrict access to the exposed extension/web interface to only trusted IP addresses.
	•	On Linux, use iptables or ufw to allow only specific IPs:

 
 # Example with UFW
   #sudo ufw default deny incoming
   #sudo ufw allow from 192.168.1.100 to any port 443
   #sudo ufw enable

For iptables:

   sudo iptables -A INPUT -p tcp -s 192.168.1.100 --dport 443 -j ACCEPT
   sudo iptables -A INPUT -p tcp --dport 443 -j DROP


SSL/TLS Enforcement
	•	Always serve WebRTC via HTTPS/WSS.
	•	Use strong ciphers and protocols in your server configuration:
            # Example Nginx snippet
            ssl_protocols TLSv1.2 TLSv1.3;
            ssl_ciphers 'EECDH+AESGCM:EDH+AESGCM';
            ssl_prefer_server_ciphers on;


To keep your WebRTC server and extension secure:
	•	Limit IP access to trusted clients.
	•	Serve content over HTTPS/WSS only.
	•	Protect exposed interfaces with authentication.
	•	Monitor, update, and audit continuously.
