import os
import hashlib
from pathlib import Path
from datetime import datetime
from typing import List, Optional
from sqlalchemy.orm import Session

# Safe hashlib monkeypatch for ReportLab OpenSSL compatibility on Windows Python 3.8+
_orig_md5 = hashlib.md5
def _safe_md5(*args, **kwargs):
    kwargs.pop('usedforsecurity', None)
    return _orig_md5(*args, **kwargs)
hashlib.md5 = _safe_md5

from reportlab.lib.pagesizes import letter
from reportlab.lib import colors
from reportlab.platypus import (
    SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle, Image, HRFlowable, KeepTogether
)
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.units import inch

from backend.app.database.models import DetectionRecord, DamageItem
from backend.app.detection.recommendations import get_repair_recommendation
from backend.app.utils.file_utils import normalize_path
from backend.app.utils.logging_config import logger

SEVERITY_BADGE_COLORS = {
    "Critical": {"bg": "#FEE2E2", "text": "#991B1B", "border": "#FCA5A5"},
    "High":     {"bg": "#FFEDD5", "text": "#C2410C", "border": "#FDBA74"},
    "Medium":   {"bg": "#FEF3C7", "text": "#92400E", "border": "#FCD34D"},
    "Low":      {"bg": "#DCFCE7", "text": "#166534", "border": "#86EFAC"},
}

def generate_pdf_report(record_id: str, db: Session, output_dir: Path) -> Path:
    """
    Generates a commercial, industry-grade PDF Road Damage Inspection Report.
    Includes Executive Summary, Geolocation Metadata, Annotated Image,
    Itemized Defect Inventory Table, Large PNG Evidence Crop Cards, and Repair Recommendations.
    """
    record = db.query(DetectionRecord).filter(DetectionRecord.detection_id == record_id).first()
    if not record:
        raise ValueError(f"Detection record {record_id} not found")

    output_dir.mkdir(parents=True, exist_ok=True)
    pdf_filename = f"RoadVision_Report_{record_id[:8]}.pdf"
    pdf_path = output_dir / pdf_filename

    doc = SimpleDocTemplate(
        str(pdf_path),
        pagesize=letter,
        rightMargin=36,
        leftMargin=36,
        topMargin=40,
        bottomMargin=45
    )

    styles = getSampleStyleSheet()

    # Custom Typography Styles
    title_style = ParagraphStyle(
        'DocTitle',
        parent=styles['Heading1'],
        fontSize=20,
        leading=24,
        textColor=colors.HexColor('#0F172A'),
        fontName='Helvetica-Bold'
    )

    subtitle_style = ParagraphStyle(
        'DocSubTitle',
        parent=styles['Normal'],
        fontSize=9,
        leading=12,
        textColor=colors.HexColor('#64748B')
    )

    heading_style = ParagraphStyle(
        'SectionHeading',
        parent=styles['Heading2'],
        fontSize=13,
        leading=16,
        textColor=colors.HexColor('#0F172A'),
        fontName='Helvetica-Bold',
        spaceBefore=10,
        spaceAfter=6
    )

    card_label_style = ParagraphStyle(
        'CardLabel',
        parent=styles['Normal'],
        fontSize=9,
        leading=11,
        textColor=colors.HexColor('#475569'),
        fontName='Helvetica-Bold'
    )

    card_val_style = ParagraphStyle(
        'CardValue',
        parent=styles['Normal'],
        fontSize=9,
        leading=12,
        textColor=colors.HexColor('#0F172A')
    )

    table_header_style = ParagraphStyle(
        'TableHeader',
        parent=styles['Normal'],
        fontSize=8.5,
        leading=10,
        textColor=colors.white,
        fontName='Helvetica-Bold'
    )

    table_cell_style = ParagraphStyle(
        'TableCell',
        parent=styles['Normal'],
        fontSize=8,
        leading=10,
        textColor=colors.HexColor('#1E293B')
    )

    story = []
    APP_DIR = Path(__file__).resolve().parent.parent

    # 1. Header Banner
    header_data = [
        [
            Paragraph("<b>ROADVISION AI</b><br/><font size=10 color='#2563EB'>COMMERCIAL INFRASTRUCTURE INSPECTION REPORT</font>", title_style),
            Paragraph(f"<b>Report Ref:</b> #{record.detection_id[:8]}<br/>"
                      f"<b>Date:</b> {record.timestamp.strftime('%Y-%m-%d %H:%M:%S UTC')}<br/>"
                      f"<b>Engine:</b> {record.model_version or 'Roboflow Hosted Model'}", subtitle_style)
        ]
    ]
    t_header = Table(header_data, colWidths=[330, 210])
    t_header.setStyle(TableStyle([
        ('VALIGN', (0, 0), (-1, -1), 'MIDDLE'),
        ('ALIGN', (1, 0), (1, 0), 'RIGHT'),
    ]))
    story.append(t_header)
    story.append(Spacer(1, 6))
    story.append(HRFlowable(width="100%", thickness=2, color=colors.HexColor("#2563EB"), spaceBefore=2, spaceAfter=10))

    # Helper function for color-coded severity badge html
    def get_badge_html(sev_text: str) -> str:
        s_info = SEVERITY_BADGE_COLORS.get(sev_text, SEVERITY_BADGE_COLORS["Low"])
        return f"<font color='{s_info['text']}'><b>{sev_text.upper()}</b></font>"

    # 2. Executive Inspection Summary Card Grid
    road_display = record.road_name or "Unspecified Road Sector"
    filename_display = record.image_filename or Path(record.source_path).name
    avg_conf_display = f"{record.avg_confidence * 100:.1f}%" if record.avg_confidence else "N/A"
    inf_time_display = f"{record.inference_time_ms:.1f} ms" if record.inference_time_ms else "N/A"

    summary_data = [
        [
            Paragraph("<b>Inspection ID:</b>", card_label_style), Paragraph(record.detection_id, card_val_style),
            Paragraph("<b>Road Sector:</b>", card_label_style), Paragraph(road_display, card_val_style)
        ],
        [
            Paragraph("<b>Timestamp:</b>", card_label_style), Paragraph(record.timestamp.strftime("%Y-%m-%d %H:%M:%S"), card_val_style),
            Paragraph("<b>Media File:</b>", card_label_style), Paragraph(filename_display, card_val_style)
        ],
        [
            Paragraph("<b>Total Defect Count:</b>", card_label_style), Paragraph(f"<b>{record.total_defects} defect(s)</b>", card_val_style),
            Paragraph("<b>Highest Severity:</b>", card_label_style), Paragraph(get_badge_html(record.overall_severity or "Low"), card_val_style)
        ],
        [
            Paragraph("<b>Avg. Confidence:</b>", card_label_style), Paragraph(avg_conf_display, card_val_style),
            Paragraph("<b>Inference Latency:</b>", card_label_style), Paragraph(inf_time_display, card_val_style)
        ]
    ]

    t_summary = Table(summary_data, colWidths=[110, 160, 110, 160])
    t_summary.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, -1), colors.HexColor('#F8FAFC')),
        ('BOX', (0, 0), (-1, -1), 1, colors.HexColor('#CBD5E1')),
        ('INNERGRID', (0, 0), (-1, -1), 0.5, colors.HexColor('#E2E8F0')),
        ('VALIGN', (0, 0), (-1, -1), 'MIDDLE'),
        ('PADDING', (0, 0), (-1, -1), 5),
    ]))
    story.append(t_summary)
    story.append(Spacer(1, 10))

    # 3. Automatic GPS & Geolocation Card (if available)
    if record.latitude is not None and record.longitude is not None:
        loc_str = record.location or f"Lat: {record.latitude:.6f}, Lon: {record.longitude:.6f}"
        city_state = f"{record.city or ''}, {record.state or ''}, {record.country or ''}".strip(", ")
        
        geo_data = [
            [
                Paragraph("<b>GPS Coordinates:</b>", card_label_style), Paragraph(f"Lat: <b>{record.latitude:.6f}</b> | Lon: <b>{record.longitude:.6f}</b>", card_val_style),
                Paragraph("<b>Reverse Geocoded Location:</b>", card_label_style), Paragraph(f"<b>{loc_str}</b> ({city_state})", card_val_style)
            ]
        ]
        t_geo = Table(geo_data, colWidths=[110, 160, 130, 140])
        t_geo.setStyle(TableStyle([
            ('BACKGROUND', (0, 0), (-1, -1), colors.HexColor('#EFF6FF')),
            ('BOX', (0, 0), (-1, -1), 1, colors.HexColor('#BFDBFE')),
            ('INNERGRID', (0, 0), (-1, -1), 0.5, colors.HexColor('#DBEAFE')),
            ('VALIGN', (0, 0), (-1, -1), 'MIDDLE'),
            ('PADDING', (0, 0), (-1, -1), 5),
        ]))
        story.append(t_geo)
        story.append(Spacer(1, 10))

    # 4. Annotated Full Image Scan
    if record.annotated_output_path:
        ann_path = Path(record.annotated_output_path)
        if not ann_path.is_absolute():
            ann_path = APP_DIR / ann_path
        
        if ann_path.exists():
            story.append(Paragraph("Annotated Road Inspection Scan", heading_style))
            try:
                # Maintain original image aspect ratio up to max width 540 pt, max height 260 pt
                img = Image(str(ann_path))
                aspect = img.imageHeight / float(img.imageWidth) if img.imageWidth > 0 else 0.75
                target_w = 540.0
                target_h = min(260.0, target_w * aspect)
                img.drawWidth = target_w
                img.drawHeight = target_h
                
                t_img = Table([[img]], colWidths=[540])
                t_img.setStyle(TableStyle([
                    ('BOX', (0, 0), (-1, -1), 1, colors.HexColor('#CBD5E1')),
                    ('ALIGN', (0, 0), (-1, -1), 'CENTER'),
                    ('VALIGN', (0, 0), (-1, -1), 'MIDDLE'),
                    ('PADDING', (0, 0), (-1, -1), 2),
                ]))
                story.append(t_img)
                story.append(Spacer(1, 12))
            except Exception as e:
                logger.warning(f"Could not insert annotated image in PDF: {e}")

    # 5. Itemized Damage Inventory Table
    story.append(Paragraph("Itemized Defect Inventory & Action Plan", heading_style))
    damage_items = record.damage_items

    if damage_items:
        table_rows = [
            [
                Paragraph("#", table_header_style),
                Paragraph("Damage Class", table_header_style),
                Paragraph("Conf.", table_header_style),
                Paragraph("Severity", table_header_style),
                Paragraph("Bounding Box", table_header_style),
                Paragraph("Automated Repair Recommendation", table_header_style)
            ]
        ]

        for idx, item in enumerate(damage_items, 1):
            rec_info = get_repair_recommendation(item.damage_class)
            rec_display = f"<b>{rec_info['action']}</b><br/><font color='#64748B'>{rec_info['priority']}</font>"
            
            table_rows.append([
                Paragraph(str(idx), table_cell_style),
                Paragraph(f"<b>{item.damage_class}</b>", table_cell_style),
                Paragraph(f"{item.confidence_score * 100:.1f}%", table_cell_style),
                Paragraph(get_badge_html(item.severity), table_cell_style),
                Paragraph(str(item.bbox_coordinates), table_cell_style),
                Paragraph(rec_display, table_cell_style)
            ])

        t_items = Table(table_rows, colWidths=[24, 110, 45, 65, 110, 186])
        t_items.setStyle(TableStyle([
            ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor('#0F172A')),
            ('ALIGN', (0, 0), (-1, -1), 'LEFT'),
            ('VALIGN', (0, 0), (-1, -1), 'TOP'),
            ('GRID', (0, 0), (-1, -1), 0.5, colors.HexColor('#CBD5E1')),
            ('ROWBACKGROUNDS', (0, 1), (-1, -1), [colors.white, colors.HexColor('#F8FAFC')]),
            ('PADDING', (0, 0), (-1, -1), 5),
        ]))
        story.append(t_items)
    else:
        story.append(Paragraph("<i>No road defects were detected during this scan. Road surface in optimal condition.</i>", table_cell_style))

    story.append(Spacer(1, 14))

    # 6. Large High-Resolution Evidence Crop Cards (PNG format)
    if damage_items:
        story.append(Paragraph("High-Resolution Evidence Snapshots & Tactical Actions", heading_style))

        for idx, item in enumerate(damage_items[:6], 1): # Top 6 evidence snapshots
            ev_p = Path(item.evidence_image_path)
            if not ev_p.is_absolute():
                ev_p = APP_DIR / ev_p

            rec_info = get_repair_recommendation(item.damage_class)

            card_content = []

            # Details block
            details_html = (
                f"<font size=11 color='#0F172A'><b>Defect #{idx}: {item.damage_class}</b></font><br/><br/>"
                f"<b>Severity Level:</b> {get_badge_html(item.severity)} &nbsp;&nbsp;|&nbsp;&nbsp; "
                f"<b>Confidence:</b> {item.confidence_score * 100:.1f}%<br/>"
                f"<b>Bounding Box:</b> {item.bbox_coordinates}<br/><br/>"
                f"<b>Recommended Action:</b> {rec_info['action']}<br/>"
                f"<b>Risk Assessment:</b> {rec_info['risk']}<br/>"
                f"<b>Urgency Priority:</b> <font color='#2563EB'><b>{rec_info['priority']}</b></font>"
            )
            p_details = Paragraph(details_html, card_val_style)

            # Crop image block
            if ev_p.exists():
                try:
                    crop_img = Image(str(ev_p), width=160, height=120)
                    card_table = Table([[crop_img, p_details]], colWidths=[170, 370])
                except Exception:
                    card_table = Table([[Paragraph("<i>Image crop unavailable</i>", table_cell_style), p_details]], colWidths=[170, 370])
            else:
                card_table = Table([[Paragraph("<i>Crop missing</i>", table_cell_style), p_details]], colWidths=[170, 370])

            card_table.setStyle(TableStyle([
                ('BACKGROUND', (0, 0), (-1, -1), colors.HexColor('#FFFFFF')),
                ('BOX', (0, 0), (-1, -1), 1, colors.HexColor('#CBD5E1')),
                ('VALIGN', (0, 0), (-1, -1), 'TOP'),
                ('PADDING', (0, 0), (-1, -1), 6),
            ]))

            story.append(KeepTogether([card_table, Spacer(1, 8)]))

    # Page callback for footer
    def add_footer(canvas, doc):
        canvas.saveState()
        canvas.setStrokeColor(colors.HexColor('#CBD5E1'))
        canvas.setLineWidth(0.5)
        canvas.line(36, 32, 576, 32)
        
        canvas.setFont('Helvetica', 8)
        canvas.setFillColor(colors.HexColor('#64748B'))
        canvas.drawString(36, 20, "Generated by RoadVision AI  |  FastAPI Backend  |  Roboflow Hosted Model")
        canvas.drawRightString(576, 20, f"Page {doc.page}")
        canvas.restoreState()

    doc.build(story, onFirstPage=add_footer, onLaterPages=add_footer)
    logger.info(f"Generated PDF inspection report: {pdf_path}")
    return pdf_path
