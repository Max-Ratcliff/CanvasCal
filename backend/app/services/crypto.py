from cryptography.fernet import Fernet
import os
import base64
from app.core.config import settings

class CryptoService:
    def __init__(self):
        key = settings.SECRET_KEY
        if not key:
            raise Exception("SECRET_KEY is missing from configuration!")
        try:
            self.cipher_suite = Fernet(key.encode())
        except Exception as e:
            raise Exception(f"Invalid SECRET_KEY: {e}")

    def encrypt(self, plain_text: str) -> str:
        if not plain_text:
            return None
        encrypted_bytes = self.cipher_suite.encrypt(plain_text.encode())
        return encrypted_bytes.decode()

    def decrypt(self, encrypted_text: str) -> str:
        if not encrypted_text:
            return None
        decrypted_bytes = self.cipher_suite.decrypt(encrypted_text.encode())
        return decrypted_bytes.decode()

crypto = CryptoService()
