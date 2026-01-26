"""
Main facade for the tagger system.
Switch implementation by changing the import below.
"""

# Default (split implementation)
from .facade_split import tag_position

# Blackbox implementation (uncomment to switch)
# from core.blackbox_tagger import tag_position

__all__ = ["tag_position"]
