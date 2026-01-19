import ipaddress
import socket
from urllib.parse import urlparse
from typing import Tuple

class SSRFGuard:
    """
    Security utility to prevent Server-Side Request Forgery (SSRF).
    Ensures that the backend only connects to public, safe IP addresses
    and specifically allowed cloud provider domains.
    """

    ALLOWED_DOMAINS = {
        'content.dropboxapi.com',
        'dl.dropboxusercontent.com',
        'api.onedrive.com',
        'graph.microsoft.com',
        'www.googleapis.com',
        'drive.google.com'
    }

    @staticmethod
    def validate_url(url: str) -> str:
        """
        Validates a URL for SSRF protection.
        Raises ValueError if URL is unsafe.
        Returns the URL if safe.
        """
        parsed = urlparse(url)
        
        if parsed.scheme not in ('https',):
            raise ValueError("Only HTTPS allowed")

        hostname = parsed.hostname
        if not hostname:
            raise ValueError("Invalid hostname")

        # 1. Allow Whitelisted Domains (Best Practice)
        # Check if hostname ends with any of the allowed domains
        if any(hostname == d or hostname.endswith("." + d) for d in SSRFGuard.ALLOWED_DOMAINS):
            return url
            
        # 2. DNS Resolution & IP Check (Fallback for CDN urls)
        try:
            # Resolve to IP
            ip_str = socket.gethostbyname(hostname)
            ip = ipaddress.ip_address(ip_str)
            
            # Block Private/Loopback/Reserved IPs
            if (ip.is_private or 
                ip.is_loopback or 
                ip.is_reserved or 
                ip.is_link_local or 
                ip.is_multicast):
                raise ValueError(f"Blocked internal IP: {ip_str}")
                
        except socket.gaierror:
            raise ValueError("Invalid hostname or DNS failure")
            
        return url
