"""
Discussion reaction validation tests.
"""

import pytest

from modules.workspace.domain.models.discussion_reaction import AddReactionCommand


@pytest.mark.parametrize("emoji", ["👍", "❤️", "🎯", "🚀", "👏", "🔥", "💯"])
def test_allowed_emojis_accepted(emoji):
    command = AddReactionCommand(
        target_id="reply-1",
        target_type="reply",
        user_id="user-1",
        emoji=emoji,
    )
    assert command.emoji == emoji


@pytest.mark.parametrize("emoji", ["not-allowed", "<script>"])
def test_reaction_rejects_invalid_emoji(emoji):
    with pytest.raises(ValueError):
        AddReactionCommand(
            target_id="reply-1",
            target_type="reply",
            user_id="user-1",
            emoji=emoji,
        )
