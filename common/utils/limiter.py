from slowapi import Limiter
from slowapi.util import get_remote_address

# =============== LIMITADOR DE PETICIONES ===============
limiter = Limiter(key_func=get_remote_address)
