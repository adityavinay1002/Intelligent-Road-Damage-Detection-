import os
import hashlib
from pathlib import Path
from datetime import datetime
from typing import List, Optional
from sqlalchemy.orm import Session

# Safe hashlib monkeypatch for ReportLab OpenSSL compatibility on Windows Python 3.8
_orig_md5 = hashlib.md5
def _safe_md5(*args, **kwargs):
    kwargs.pop('usedforsecurity', None)
    return _orig_md5(*args, **kwargs)
hashlib.md5 = _safe_md5

from reportlab.lib.pagesizes import letter
from reportlab.lib import colors
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle, Image, HRFlowable
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle

from backend.app.database.models import DetectionRecord, DamageItem

def generate_pdf_report(record_id: str, db: Session, output_dir: Path) -> Path:
    """
    Generate a formal PDF Road Damage Inspection Report.
    """
    record = db.query(DetectionRecord).filter(DetectionRecord.detection_id == record_id).first()
    if not record:
        raise ValueError(f"Detection record {record_id} not found")

    output_dir.mkdir(parents=True, exist_ok=True)
    pdf_filename = f"Road_Damage_Report_{record_id[:8]}.pdf"
    pdf_path = output_dir / pdf_filename

    doc = SimpleDocTemplate(
        str(pdf_path),
        pagesize=letter,
        rightMargin=36,
        leftMargin=36,
        topMargin=36,
        bottomMargin=36
    )

    styles = getSampleStyleSheet()
    
    title_style = ParagraphStyle(
        'DocTitle',
        parent=styles['Heading1'],
        fontSize=22,
        leading=26,
        textColor=colors.HexColor('#0F172A'),
        fontName='Helvetica-Bold'
    )
    
    subtitle_style = ParagraphStyle(
        'DocSubTitle',
        parent=styles['Normal'],
        fontSize=11,
        leading=14,
        textColor=colors.HexColor('#475569')
    )

    heading_style = ParagraphStyle(
        'SectionHeading',
        parent=styles['Heading2'],
        fontSize=14,
        leading=18,
        textColor=colors.HexColor('#1E293B'),
        fontName='Helvetica-Bold',
        spaceBefore=12,
        spaceAfter=6
    )

    normal_style = styles['Normal']

    story = []

    # Title & Header
    story.append(Paragraph("INTELLIGENT ROAD DAMAGE INSPECTION REPORT", title_style))
    story.append(Paragraph(f"Generated on {datetime.now().strftime('%Y-%m-%d %H:%M:%S')} | System: Intelligent Road Damage Detection System (Roboflow Engine)", subtitle_style))
    story.append(Spacer(1, 10))
    story.append(HRFlowable(width="100%", thickness=2, color=colors.HexColor("#2563EB"), spaceBefore=5, spaceAfter=15))

    # Inspection Overview Table
    overview_data = [
        [Paragraph("<b>Inspection ID:</b>", normal_style), Paragraph(record.detection_id, normal_style),
         Paragraph("<b>Date & Time:</b>", normal_style), Paragraph(record.timestamp.strftime("%Y-%m-%d %H:%M:%S"), normal_style)],
        [Paragraph("<b>Road Sector:</b>", normal_style), Paragraph(record.road_name, normal_style),
         Paragraph("<b>Media Type:</b>", normal_style), Paragraph(record.media_type.upper(), normal_style)],
        [Paragraph("<b>Total Defects Detected:</b>", normal_style), Paragraph(str(record.total_defects), normal_style),
         Paragraph("<b>Overall Road Severity:</b>", normal_style), Paragraph(f"<b>{record.overall_severity}</b>", normal_style)],
    ]

    t_overview = Table(overview_data, colWidths=[130, 150, 130, 130])
    t_overview.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, -1), colors.HexColor('#F8FAFC')),
        ('BOX', (0, 0), (-1, -1), 1, colors.HexColor('#CBD5E1')),
        ('INNERGRID', (0, 0), (-1, -1), 0.5, colors.HexColor('#E2E8F0')),
        ('VALIGN', (0, 0), (-1, -1), 'MIDDLE'),
        ('PADDING', (0, 0), (-1, -1), 6),
    ]))
    story.append(t_overview)
    story.append(Spacer(1, 15))

    # Damage Item Breakdown
    story.append(Paragraph("Itemized Defect Inventory", heading_style))

    damage_items = record.damage_items
    if damage_items:
        table_data = [["#", "Damage Class", "Confidence", "Severity", "Coordinates [x1, y1, x2, y2]"]]
        for idx, item in enumerate(damage_items, 1):
            table_data.append([
                str(idx),
                item.damage_class,
                f"{item.confidence_score:.2f}",
                item.severity,
                item.bbox_coordinates
            ])

        t_items = Table(table_data, colWidths=[30, 140, 80, 80, 210])
        t_items.setStyle(TableStyle([
            ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor('#1E293B')),
            ('TEXTCOLOR', (0, 0), (-1, 0), colors.white),
            ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
            ('ALIGN', (0, 0), (-1, -1), 'LEFT'),
            ('GRID', (0, 0), (-1, -1), 0.5, colors.HexColor('#CBD5E1')),
            ('ROWBACKGROUNDS', (0, 1), (-1, -1), [colors.white, colors.HexColor('#F1F5F9')]),
            ('PADDING', (0, 0), (-1, -1), 5),
        ]))
        story.append(t_items)
    else:
        story.append(Paragraph("No road defects were detected during this scan.", normal_style))

    story.append(Spacer(1, 15))

    # Evidence Crops Section
    story.append(Paragraph("Inspection Evidence Snapshots", heading_style))
    evidence_images = []
    APP_DIR = Path(__file__).resolve().parent.parent
    for item in damage_items[:6]: # Show top 6 evidence snapshots
        ev_p = Path(item.evidence_image_path)
        if not ev_p.is_absolute():
            ev_p = APP_DIR / ev_p
        if ev_p.exists():
            try:
                img = Image(str(ev_p), width=150, height=110)
                caption = Paragraph(f"<b>{item.damage_class}</b><br/>Sev: {item.severity} | Conf: {item.confidence_score:.2f}", normal_style)
                evidence_images.append([img, caption])
            except Exception:
                pass

    if evidence_images:
        # Arrange in grid of 3 per row
        grid_data = []
        row = []
        for img, cap in evidence_images:
            row.extend([img, cap])
            if len(row) == 4:
                grid_data.append(row)
                row = []
        if row:
            while len(row) < 4:
                row.append("")
            grid_data.append(row)

        t_ev = Table(grid_data, colWidths=[150, 120, 150, 120])
        t_ev.setStyle(TableStyle([
            ('ALIGN', (0, 0), (-1, -1), 'CENTER'),
            ('VALIGN', (0, 0), (-1, -1), 'MIDDLE'),
            ('PADDING', (0, 0), (-1, -1), 4),
        ]))
        story.append(t_ev)
    else:
        story.append(Paragraph("No evidence crops registered for this record.", normal_style))

    story.append(Spacer(1, 20))
    story.append(Paragraph("Report End — Intelligent Road Damage Detection System", subtitle_style))

    doc.build(story)
    return pdf_path
