"""add checklist_items and comments

Revision ID: a1b2c3d4e5f6
Revises: 19a101a6aad2
Create Date: 2026-05-30 12:00:00.000000
"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


revision: str = 'a1b2c3d4e5f6'
down_revision: Union[str, None] = '19a101a6aad2'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.create_table(
        'checklist_items',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('task_id', sa.Integer(), nullable=False),
        sa.Column('content', sa.String(length=500), nullable=False),
        sa.Column('is_done', sa.Boolean(), nullable=False),
        sa.Column('position', sa.Integer(), nullable=False),
        sa.Column('created_at', sa.DateTime(timezone=True), nullable=False),
        sa.Column('updated_at', sa.DateTime(timezone=True), nullable=False),
        sa.ForeignKeyConstraint(['task_id'], ['tasks.id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('id'),
    )
    with op.batch_alter_table('checklist_items', schema=None) as batch_op:
        batch_op.create_index(
            batch_op.f('ix_checklist_items_task_id'), ['task_id'], unique=False
        )

    op.create_table(
        'comments',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('task_id', sa.Integer(), nullable=False),
        sa.Column('user_id', sa.Integer(), nullable=False),
        sa.Column('content', sa.Text(), nullable=False),
        sa.Column('created_at', sa.DateTime(timezone=True), nullable=False),
        sa.Column('updated_at', sa.DateTime(timezone=True), nullable=False),
        sa.ForeignKeyConstraint(['task_id'], ['tasks.id'], ondelete='CASCADE'),
        sa.ForeignKeyConstraint(['user_id'], ['users.id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('id'),
    )
    with op.batch_alter_table('comments', schema=None) as batch_op:
        batch_op.create_index(
            batch_op.f('ix_comments_task_id'), ['task_id'], unique=False
        )
        batch_op.create_index(
            batch_op.f('ix_comments_user_id'), ['user_id'], unique=False
        )


def downgrade() -> None:
    with op.batch_alter_table('comments', schema=None) as batch_op:
        batch_op.drop_index(batch_op.f('ix_comments_user_id'))
        batch_op.drop_index(batch_op.f('ix_comments_task_id'))
    op.drop_table('comments')

    with op.batch_alter_table('checklist_items', schema=None) as batch_op:
        batch_op.drop_index(batch_op.f('ix_checklist_items_task_id'))
    op.drop_table('checklist_items')
