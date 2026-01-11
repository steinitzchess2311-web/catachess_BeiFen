from fastapi import APIRouter

from workspace.api.endpoints import (
    discussions_replies_add,
    discussions_replies_edit,
    discussions_replies_delete,
)

router = APIRouter(tags=["discussions"])
router.include_router(discussions_replies_add.router)
router.include_router(discussions_replies_edit.router)
router.include_router(discussions_replies_delete.router)
