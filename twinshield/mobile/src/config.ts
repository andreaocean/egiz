/**
 * Your PC's LAN IPv4 (ipconfig). Same network as the phone.
 * Do not use 127.0.0.1 or virtual adapter IPs (e.g. 192.168.165.x).
 * Backend: uvicorn main:app --host 0.0.0.0 --reload --port 8000
 */
export const API_URL = 'http://172.20.10.3:8000';
