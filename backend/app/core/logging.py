import logging
import sys
from datetime import datetime

# Formatting for non-repudiation/audit trails
# We want to capture: Time, Level, Logger, Message (which should include Actor, Action)
LOG_FORMAT = "%(asctime)s - %(name)s - %(levelname)s - %(message)s"

def setup_logging():
    # Create a root logger
    logger = logging.getLogger()
    logger.setLevel(logging.INFO)

    # Console handler
    console_handler = logging.StreamHandler(sys.stdout)
    console_handler.setFormatter(logging.Formatter(LOG_FORMAT))
    logger.addHandler(console_handler)

    # File handler for audit trail
    file_handler = logging.FileHandler("blindcheck_audit.log")
    file_handler.setFormatter(logging.Formatter(LOG_FORMAT))
    logger.addHandler(file_handler)

    return logger

logger = setup_logging()

def audit_log(actor: str, action: str, resource: str, details: str = ""):
    """
    Helper to log security-relevant actions.
    Actor: Who performed the action (User ID or 'System')
    Action: What they did (e.g., 'LOGIN', 'CREATE_REQUEST')
    Resource: What did they affect (e.g., 'Request:123')
    """
    logger.info(f"AUDIT_EVENT | Actor: {actor} | Action: {action} | Resource: {resource} | Details: {details}")
