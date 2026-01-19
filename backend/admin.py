from sqladmin import Admin, ModelView
from fastapi import FastAPI
from .database import engine
from .models.database import User, Session, ConversionHistory

class UserAdmin(ModelView, model=User):
    column_list = [
        User.id,
        User.email,
        User.name,
        User.is_active,
        User.is_verified,
        User.oauth_provider,
        User.created_at
    ]
    column_searchable_list = [User.email, User.name]
    column_sortable_list = [User.created_at, User.email]
    icon = "fa-solid fa-user"
    name = "User"
    name_plural = "Users"

class SessionAdmin(ModelView, model=Session):
    column_list = [
        Session.id,
        Session.user_id,
        Session.expires_at,
        Session.created_at
    ]
    column_sortable_list = [Session.created_at, Session.expires_at]
    icon = "fa-solid fa-key"
    name = "Session"
    name_plural = "Sessions"

class ConversionHistoryAdmin(ModelView, model=ConversionHistory):
    column_list = [
        ConversionHistory.tool_used,
        ConversionHistory.file_size,
        ConversionHistory.file_count,
        ConversionHistory.success,
        ConversionHistory.created_at,
        ConversionHistory.user_id
    ]
    column_searchable_list = [ConversionHistory.tool_used]
    column_sortable_list = [ConversionHistory.created_at, ConversionHistory.file_size]
    icon = "fa-solid fa-file-arrow-right"
    name = "Conversion"
    name_plural = "Conversion History"

def setup_admin(app: FastAPI):
    """
    Setup the Admin panel for the FastAPI application.
    Access at /admin
    """
    admin = Admin(app, engine, title="FileVora Admin")
    admin.add_view(UserAdmin)
    admin.add_view(SessionAdmin)
    admin.add_view(ConversionHistoryAdmin)
