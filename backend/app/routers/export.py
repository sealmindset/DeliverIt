import csv
import io
from datetime import datetime, timedelta, timezone

from fastapi import APIRouter, Depends, Query
from fastapi.responses import StreamingResponse
from reportlab.lib import colors
from reportlab.lib.pagesizes import letter, landscape
from reportlab.lib.styles import getSampleStyleSheet
from reportlab.lib.units import inch
from reportlab.platypus import (
    Paragraph,
    SimpleDocTemplate,
    Spacer,
    Table,
    TableStyle,
)
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.middleware.permissions import require_permission
from app.models.project import Project
from app.models.task import Task, TaskStatus
from app.schemas.auth import UserInfo

router = APIRouter(prefix="/export", tags=["export"])


# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------

def _csv_response(rows: list[list[str]], filename: str) -> StreamingResponse:
    buf = io.StringIO()
    writer = csv.writer(buf)
    for row in rows:
        writer.writerow(row)
    buf.seek(0)
    return StreamingResponse(
        iter([buf.getvalue()]),
        media_type="text/csv",
        headers={"Content-Disposition": f'attachment; filename="{filename}"'},
    )


def _pdf_response(
    title: str,
    headers: list[str],
    rows: list[list[str]],
    filename: str,
    orientation: str = "landscape",
) -> StreamingResponse:
    buf = io.BytesIO()
    page = landscape(letter) if orientation == "landscape" else letter
    doc = SimpleDocTemplate(buf, pagesize=page, topMargin=0.5 * inch, bottomMargin=0.5 * inch)

    styles = getSampleStyleSheet()
    elements: list = []

    # Title
    elements.append(Paragraph(title, styles["Title"]))
    elements.append(Spacer(1, 12))
    elements.append(
        Paragraph(
            f"Generated: {datetime.now(timezone.utc).strftime('%Y-%m-%d %H:%M UTC')}",
            styles["Normal"],
        )
    )
    elements.append(Spacer(1, 18))

    # Table
    table_data = [headers] + rows
    n_cols = len(headers)
    col_width = (page[0] - 1.0 * inch) / n_cols if n_cols else 1 * inch

    # Wrap long cell text
    wrapped_data = []
    cell_style = styles["Normal"]
    cell_style.fontSize = 8
    cell_style.leading = 10
    for row_idx, row in enumerate(table_data):
        wrapped_row = []
        for cell in row:
            if row_idx == 0:
                wrapped_row.append(Paragraph(f"<b>{cell}</b>", cell_style))
            else:
                wrapped_row.append(Paragraph(str(cell), cell_style))
        wrapped_data.append(wrapped_row)

    t = Table(wrapped_data, colWidths=[col_width] * n_cols, repeatRows=1)
    t.setStyle(
        TableStyle(
            [
                ("BACKGROUND", (0, 0), (-1, 0), colors.HexColor("#334155")),
                ("TEXTCOLOR", (0, 0), (-1, 0), colors.white),
                ("FONTSIZE", (0, 0), (-1, -1), 8),
                ("ROWBACKGROUNDS", (0, 1), (-1, -1), [colors.white, colors.HexColor("#f8fafc")]),
                ("GRID", (0, 0), (-1, -1), 0.5, colors.HexColor("#e2e8f0")),
                ("VALIGN", (0, 0), (-1, -1), "TOP"),
                ("TOPPADDING", (0, 0), (-1, -1), 4),
                ("BOTTOMPADDING", (0, 0), (-1, -1), 4),
                ("LEFTPADDING", (0, 0), (-1, -1), 4),
                ("RIGHTPADDING", (0, 0), (-1, -1), 4),
            ]
        )
    )
    elements.append(t)
    doc.build(elements)
    buf.seek(0)
    return StreamingResponse(
        iter([buf.getvalue()]),
        media_type="application/pdf",
        headers={"Content-Disposition": f'attachment; filename="{filename}"'},
    )


def _fmt_date(dt: datetime | None) -> str:
    if dt is None:
        return ""
    return dt.strftime("%Y-%m-%d")


def _fmt_status(val: str) -> str:
    return val.replace("_", " ").title()


# ---------------------------------------------------------------------------
# Tasks export
# ---------------------------------------------------------------------------

@router.get("/tasks/{fmt}")
async def export_tasks(
    fmt: str,
    user: UserInfo = require_permission("tasks", "view"),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(select(Task).order_by(Task.created_at.desc()))
    tasks = result.scalars().all()

    headers = [
        "Title", "Project", "Status", "Priority", "Assignee",
        "Deadline", "Checklist", "Jira Key", "Created",
    ]
    rows = []
    for t in tasks:
        total = len(t.checklist_items) if t.checklist_items else 0
        done = sum(1 for i in t.checklist_items if i.is_completed) if t.checklist_items else 0
        checklist = f"{done}/{total}" if total > 0 else ""
        rows.append([
            t.title,
            t.project.name if t.project else "",
            _fmt_status(t.status.value),
            _fmt_status(t.priority.value),
            t.assignee.display_name if t.assignee else "Unassigned",
            _fmt_date(t.deadline),
            checklist,
            t.jira_key or "",
            _fmt_date(t.created_at),
        ])

    ts = datetime.now(timezone.utc).strftime("%Y%m%d")
    if fmt == "csv":
        return _csv_response([headers] + rows, f"deliverit-tasks-{ts}.csv")
    return _pdf_response("DeliverIt -- Tasks Report", headers, rows, f"deliverit-tasks-{ts}.pdf")


# ---------------------------------------------------------------------------
# Projects export
# ---------------------------------------------------------------------------

@router.get("/projects/{fmt}")
async def export_projects(
    fmt: str,
    user: UserInfo = require_permission("projects", "view"),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(
        select(Project, func.count(Task.id).label("task_count"))
        .outerjoin(Task, Task.project_id == Project.id)
        .group_by(Project.id)
        .order_by(Project.created_at.desc())
    )
    projects = result.all()

    # Also get done-task counts per project
    done_result = await db.execute(
        select(Task.project_id, func.count(Task.id))
        .where(Task.status == TaskStatus.done)
        .group_by(Task.project_id)
    )
    done_map = {str(row[0]): row[1] for row in done_result.all()}

    headers = ["Name", "Description", "Status", "Tasks", "Completed", "Completion %", "Created"]
    rows = []
    for project, task_count in projects:
        done_count = done_map.get(str(project.id), 0)
        pct = round((done_count / task_count) * 100, 1) if task_count > 0 else 0.0
        rows.append([
            project.name,
            project.description or "",
            _fmt_status(project.status.value),
            str(task_count),
            str(done_count),
            f"{pct}%",
            _fmt_date(project.created_at),
        ])

    ts = datetime.now(timezone.utc).strftime("%Y%m%d")
    if fmt == "csv":
        return _csv_response([headers] + rows, f"deliverit-projects-{ts}.csv")
    return _pdf_response("DeliverIt -- Projects Report", headers, rows, f"deliverit-projects-{ts}.pdf")


# ---------------------------------------------------------------------------
# Dashboard export
# ---------------------------------------------------------------------------

@router.get("/dashboard/{fmt}")
async def export_dashboard(
    fmt: str,
    user: UserInfo = require_permission("dashboard", "view"),
    db: AsyncSession = Depends(get_db),
):
    now = datetime.now(timezone.utc)
    three_days = now + timedelta(days=3)

    # Stats
    proj_count = (await db.execute(select(func.count(Project.id)))).scalar() or 0
    status_result = await db.execute(
        select(Task.status, func.count(Task.id)).group_by(Task.status)
    )
    status_counts = {row[0].value: row[1] for row in status_result.all()}
    total_tasks = sum(status_counts.values())
    done_count = status_counts.get("done", 0)
    active_tasks = total_tasks - done_count
    completion_rate = round((done_count / total_tasks) * 100, 1) if total_tasks > 0 else 0.0

    overdue = (
        await db.execute(
            select(func.count(Task.id)).where(
                Task.deadline < now,
                Task.status != TaskStatus.done,
                Task.deadline.isnot(None),
            )
        )
    ).scalar() or 0

    # At risk tasks
    at_risk_result = await db.execute(
        select(Task)
        .where(
            Task.deadline <= three_days,
            Task.status != TaskStatus.done,
            Task.deadline.isnot(None),
        )
        .order_by(Task.deadline.asc())
        .limit(20)
    )
    at_risk_tasks = at_risk_result.scalars().all()

    # Build rows: summary section + status breakdown + at-risk list
    summary_headers = ["Metric", "Value"]
    summary_rows = [
        ["Total Projects", str(proj_count)],
        ["Active Tasks", str(active_tasks)],
        ["Overdue Tasks", str(overdue)],
        ["Completion Rate", f"{completion_rate}%"],
    ]

    all_statuses = ["todo", "in_progress", "in_review", "blocked", "done"]
    for s in all_statuses:
        summary_rows.append([f"Tasks {_fmt_status(s)}", str(status_counts.get(s, 0))])

    # At-risk tasks section
    at_risk_headers = ["Title", "Project", "Priority", "Assignee", "Deadline"]
    at_risk_rows = [
        [
            t.title,
            t.project.name if t.project else "",
            _fmt_status(t.priority.value),
            t.assignee.display_name if t.assignee else "Unassigned",
            _fmt_date(t.deadline),
        ]
        for t in at_risk_tasks
    ]

    ts = datetime.now(timezone.utc).strftime("%Y%m%d")

    if fmt == "csv":
        # Combine both sections in one CSV
        all_rows = [summary_headers] + summary_rows
        all_rows.append([])  # blank line separator
        all_rows.append(["Tasks at Risk"])
        all_rows.append(at_risk_headers)
        all_rows += at_risk_rows
        return _csv_response(all_rows, f"deliverit-dashboard-{ts}.csv")

    # PDF -- two tables
    buf = io.BytesIO()
    page = landscape(letter)
    doc = SimpleDocTemplate(buf, pagesize=page, topMargin=0.5 * inch, bottomMargin=0.5 * inch)
    styles = getSampleStyleSheet()
    elements: list = []

    elements.append(Paragraph("DeliverIt -- Dashboard Report", styles["Title"]))
    elements.append(Spacer(1, 6))
    elements.append(
        Paragraph(
            f"Generated: {now.strftime('%Y-%m-%d %H:%M UTC')}",
            styles["Normal"],
        )
    )
    elements.append(Spacer(1, 18))

    # Summary table
    elements.append(Paragraph("Overview", styles["Heading2"]))
    elements.append(Spacer(1, 6))
    summary_data = [[Paragraph(f"<b>{h}</b>", styles["Normal"]) for h in summary_headers]]
    for row in summary_rows:
        summary_data.append([Paragraph(c, styles["Normal"]) for c in row])
    st = Table(summary_data, colWidths=[3 * inch, 2 * inch], repeatRows=1)
    st.setStyle(
        TableStyle([
            ("BACKGROUND", (0, 0), (-1, 0), colors.HexColor("#334155")),
            ("TEXTCOLOR", (0, 0), (-1, 0), colors.white),
            ("ROWBACKGROUNDS", (0, 1), (-1, -1), [colors.white, colors.HexColor("#f8fafc")]),
            ("GRID", (0, 0), (-1, -1), 0.5, colors.HexColor("#e2e8f0")),
            ("TOPPADDING", (0, 0), (-1, -1), 4),
            ("BOTTOMPADDING", (0, 0), (-1, -1), 4),
        ])
    )
    elements.append(st)
    elements.append(Spacer(1, 24))

    # At-risk table
    if at_risk_rows:
        elements.append(Paragraph("Tasks at Risk", styles["Heading2"]))
        elements.append(Spacer(1, 6))
        ar_data = [[Paragraph(f"<b>{h}</b>", styles["Normal"]) for h in at_risk_headers]]
        for row in at_risk_rows:
            ar_data.append([Paragraph(c, styles["Normal"]) for c in row])
        n = len(at_risk_headers)
        cw = (page[0] - 1.0 * inch) / n
        at = Table(ar_data, colWidths=[cw] * n, repeatRows=1)
        at.setStyle(
            TableStyle([
                ("BACKGROUND", (0, 0), (-1, 0), colors.HexColor("#334155")),
                ("TEXTCOLOR", (0, 0), (-1, 0), colors.white),
                ("ROWBACKGROUNDS", (0, 1), (-1, -1), [colors.white, colors.HexColor("#f8fafc")]),
                ("GRID", (0, 0), (-1, -1), 0.5, colors.HexColor("#e2e8f0")),
                ("TOPPADDING", (0, 0), (-1, -1), 4),
                ("BOTTOMPADDING", (0, 0), (-1, -1), 4),
            ])
        )
        elements.append(at)

    doc.build(elements)
    buf.seek(0)
    return StreamingResponse(
        iter([buf.getvalue()]),
        media_type="application/pdf",
        headers={"Content-Disposition": f'attachment; filename="deliverit-dashboard-{ts}.pdf"'},
    )
