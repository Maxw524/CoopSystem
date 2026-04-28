#!/usr/bin/env python3
"""
Script simplificado para converter PFX usando subprocess e openssl
"""

import subprocess
import os

def convert_pfx_with_openssl():
    pfx_path = r"C:\CoopSystem\certs\server.pfx"
    crt_path = r"C:\CoopSystem\certs\server.crt"
    key_path = r"C:\CoopSystem\certs\server.key"
    password = "temp123"
    
    try:
        # Extrair certificado
        cmd_cert = f'openssl pkcs12 -in "{pfx_path}" -out "{crt_path}" -nokeys -password pass:{password}'
        subprocess.run(cmd_cert, shell=True, check=True, capture_output=True, text=True)
        
        # Extrair chave privada
        cmd_key = f'openssl pkcs12 -in "{pfx_path}" -out "{key_path}" -nodes -password pass:{password}'
        subprocess.run(cmd_key, shell=True, check=True, capture_output=True, text=True)
        
        print(f"Certificado convertido com sucesso!")
        print(f"CRT: {crt_path}")
        print(f"KEY: {key_path}")
        
    except subprocess.CalledProcessError as e:
        print(f"Erro ao converter certificado: {e}")
        print("Saída de erro:", e.stderr)
        print("Verifique se o OpenSSL está instalado e no PATH")
    except Exception as e:
        print(f"Erro geral: {e}")

if __name__ == "__main__":
    convert_pfx_with_openssl()
