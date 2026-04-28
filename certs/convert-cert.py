#!/usr/bin/env python3
"""
Script para converter certificado PFX para formato PEM
Requer: pip install pyopenssl
"""

from OpenSSL import crypto
import os

def convert_pfx_to_pem(pfx_path, crt_path, key_path, password="temp123"):
    try:
        # Carregar certificado PFX
        with open(pfx_path, 'rb') as f:
            pfx_data = f.read()
        
        # Converter para objeto PKCS12
        pfx = crypto.load_pkcs12(pfx_data, password.encode())
        
        # Extrair certificado
        cert = pfx.get_certificate()
        with open(crt_path, 'wb') as f:
            f.write(crypto.dump_certificate(crypto.FILETYPE_PEM, cert))
        
        # Extrair chave privada
        private_key = pfx.get_privatekey()
        with open(key_path, 'wb') as f:
            f.write(crypto.dump_privatekey(crypto.FILETYPE_PEM, private_key))
        
        print(f"Certificado convertido com sucesso!")
        print(f"CRT: {crt_path}")
        print(f"KEY: {key_path}")
        
    except Exception as e:
        print(f"Erro ao converter certificado: {e}")
        print("Instale pyopenssl: pip install pyopenssl")

if __name__ == "__main__":
    pfx_path = r"C:\CoopSystem\certs\server.pfx"
    crt_path = r"C:\CoopSystem\certs\server.crt"
    key_path = r"C:\CoopSystem\certs\server.key"
    
    convert_pfx_to_pem(pfx_path, crt_path, key_path)
