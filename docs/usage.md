🟢 Prerequisites

Before using the scripts, ensure your system meets the following:
	•	Server OS: Linux (Ubuntu, Debian, CentOS)
	•	Root or sudo access
	•	Installed packages: curl, wget, git, openssl, bash
	•	Domain pointing to your server’s public IP

  ⚙️ Installation

  #git clone https://github.com/yourusername/webrtc-ssl-automation.git
  #cd webrtc-ssl-automation
  #chmod +x *.sh

💻 Server Setup

The server-side script will:
	1.	Verify domain DNS settings
	2.	Generate and install SSL certificates (via Let’s Encrypt)
	3.	Configure WebRTC server to use HTTPS/WSS
	4.	Restart relevant services

Run the server setup script:
   #sudo ./setup-server.sh --domain yourdomain.com

   --domain        Your fully qualified domain name (FQDN)
   --email         Email for Let's Encrypt registration
   --force         Force renewal or reinstallation
   --help          Show usage information

   After successful execution:
	•	SSL certificate will be installed at /etc/letsencrypt/live/yourdomain.com/
	•	Server will be ready for secure WebRTC connections


🖥️ Client Configuration (Demo)

A simple HTML + JS client is included in the project for testing your WebRTC server setup. You can use it to verify that your domain and SSL configuration are working correctly.
	1.	Open the client file in a browser.
