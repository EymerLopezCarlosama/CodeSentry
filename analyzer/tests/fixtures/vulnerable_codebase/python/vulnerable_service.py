"""
Python Module with Intentional Bugs, Flaws, and Security Vulnerabilities
"""

import os
import pickle
import subprocess
import sqlite3

# Vulnerability 1: Command Injection
def ping_host(host_ip: str):
    """
    SECURITY VULNERABILITY: Command Injection via unsanitized input passed to shell
    """
    # Flaw: shell=True with string concatenation
    command = f"ping -c 1 {host_ip}"
    return subprocess.check_output(command, shell=True)


# Vulnerability 2: Insecure Deserialization (pickle)
def load_user_session(session_data: bytes):
    """
    SECURITY VULNERABILITY: Unsafe deserialization using pickle.loads
    """
    return pickle.loads(session_data)


# Vulnerability 3: SQL Injection
def get_user_by_email(email: str):
    """
    SECURITY VULNERABILITY: SQL Injection via formatted string query
    """
    conn = sqlite3.connect("database.db")
    cursor = conn.cursor()
    # Flaw: Raw SQL string interpolation
    query = f"SELECT * FROM users WHERE email = '{email}'"
    cursor.execute(query)
    return cursor.fetchall()


# Bug 4: Mutable Default Argument
def add_event_log(event_name: str, logs: list = []):
    """
    BUG: Mutable default argument retains state across calls
    """
    logs.append(event_name)
    return logs


# Bug 5: Resource Leak & Unhandled Exception / Variable Scope Error
def process_data_file(filename: str):
    """
    BUG: Unclosed file handle and potential UnboundLocalError
    """
    f = open(filename, "r")
    content = f.read()
    # Flaw: File is never closed (Resource Leak)
    
    if "ERROR" in content:
        status_msg = "Error detected"
    
    # BUG: status_msg might not be defined if "ERROR" not in content -> UnboundLocalError
    print(f"Log status: {status_msg}")
    return content
