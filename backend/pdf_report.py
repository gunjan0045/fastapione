from __future__ import annotations

import json
import re
from io import BytesIO
from typing import Any, Dict, List

from reportlab.lib import colors
from reportlab.lib.enums import TA_LEFT, TA_CENTER
from reportlab.lib.pagesizes import A4
from reportlab.lib.styles import ParagraphStyle, getSampleStyleSheet
from reportlab.lib.units import inch
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle, PageBreak
from reportlab.graphics.shapes import Drawing, String
from reportlab.graphics.charts.barcharts import VerticalBarChart
from reportlab.graphics.charts.piecharts import Pie
from reportlab.pdfgen import canvas

PAGE_WIDTH, PAGE_HEIGHT = A4
THEME = {
    "ink": colors.HexColor("#0f172a"),
    "subtle": colors.HexColor("#475569"),
    "line": colors.HexColor("#dbe3ee"),
    "panel": colors.HexColor("#f8fafc"),
    "accent": colors.HexColor("#f97316"),
    "accent_soft": colors.HexColor("#fff7ed"),
    "brand_blue": colors.HexColor("#2563eb"),
    "brand_purple": colors.HexColor("#7c3aed"),
    "brand_green": colors.HexColor("#059669"),
    "brand_amber": colors.HexColor("#d97706"),
}


def _safe_json_list(raw_value: Any) -> List[Any]:
    if isinstance(raw_value, list):
        return raw_value
    if not raw_value:
        return []
    if isinstance(raw_value, str):
        try:
            parsed = json.loads(raw_value)
            if isinstance(parsed, list):
                return parsed
        except Exception:
            return []
    return []


def _safe_text(value: Any, fallback: str = "-") -> str:
    if isinstance(value, dict):
        preferred = value.get("feedback")
        if preferred is not None:
            value = preferred
        else:
            return fallback
    if value is None:
        return fallback
    text = str(value).strip()
    return text if text else fallback


def _split_summary_sections(summary_text: str) -> Dict[str, str]:
    sections: Dict[str, List[str]] = {
        "score": [],
        "strengths": [],
        "improve": [],
        "verdict": [],
        "other": [],
    }
    current = "other"

    for raw_line in (summary_text or "").splitlines():
        line = raw_line.strip()
        if not line:
            continue

        normalized = line.lower()
        if "score" in normalized and (normalized.startswith("your score") or normalized.startswith("score") or "out of 100" in normalized):
            current = "score"
        elif "strength" in normalized:
            current = "strengths"
        elif "improve" in normalized or "improvement" in normalized:
            current = "improve"
        elif "verdict" in normalized or "final" in normalized:
            current = "verdict"
        elif line.startswith("-") or line.startswith("*"):
            sections[current].append(line.lstrip("-* ").strip())
        else:
            sections[current].append(line)

    return {key: "\n".join(lines).strip() for key, lines in sections.items()}


def _extract_score_from_feedback(feedback_text: str):
    text = feedback_text or ""
    match_10 = re.search(r"(\d{1,2})\s*/\s*10", text)
    if match_10:
        return min(100, int(match_10.group(1)) * 10)

    match_100 = re.search(r"(\d{1,3})\s*/\s*100", text)
    if match_100:
        return min(100, int(match_100.group(1)))

    match_percent = re.search(r"(?:score\s*[:\-]?\s*)(\d{1,3})\s*%", text, flags=re.IGNORECASE)
    if match_percent:
        return min(100, int(match_percent.group(1)))

    return None


def _infer_improvement(score, feedback_text: str) -> str:
    feedback = (feedback_text or "").lower()
    suggestions: List[str] = []

    if score is not None:
        if score < 50:
            suggestions.append("Strengthen the answer structure and explain the core idea more clearly.")
        elif score < 70:
            suggestions.append("Add more depth and a concrete example to make the answer stronger.")
        else:
            suggestions.append("Keep the same structure and make the response a little sharper and more concise.")

    if any(keyword in feedback for keyword in ["technical", "code", "implementation", "algorithm"]):
        suggestions.append("Mention trade-offs, edge cases, or implementation details where relevant.")
    if any(keyword in feedback for keyword in ["communication", "clarity", "structure"]):
        suggestions.append("Speak in short, structured points so the answer sounds more confident.")
    if any(keyword in feedback for keyword in ["body language", "eye contact", "posture"]):
        suggestions.append("Keep steady eye contact, sit upright, and avoid looking away too often.")
    if any(keyword in feedback for keyword in ["example", "specific"]):
        suggestions.append("Add one real project example or situation-based answer.")

    if not suggestions:
        suggestions.append("No explicit issue markers were found. Review this answer against the provided AI feedback and refine clarity.")

    # Deduplicate while keeping order.
    seen = set()
    unique = []
    for item in suggestions:
        if item not in seen:
            seen.add(item)
            unique.append(item)

    return " ".join(unique[:3])


def _wrap_items(items: List[str], fallback: str) -> List[str]:
    cleaned = [item.strip() for item in items if str(item).strip()]
    return cleaned if cleaned else [fallback]


def _build_chart_data(history: Dict[str, Any]) -> List[tuple]:
    return [
        ("Technical", int(history.get("technical_score") or 0)),
        ("Communication", int(history.get("communication_score") or 0)),
        ("Problem Solving", int(history.get("problem_solving_score") or 0)),
        ("Body Language", int(history.get("body_language_score") or 0)),
    ]


def _build_score_chart_flowables(technical: int, communication: int, problem_solving: int, body_language: int) -> List[Any]:
    labels = ["Technical", "Communication", "Problem Solving", "Body Language"]
    values = [technical, communication, problem_solving, body_language]

    bar_drawing = Drawing(340, 220)
    bar = VerticalBarChart()
    bar.x = 42
    bar.y = 38
    bar.height = 150
    bar.width = 270
    bar.data = [values]
    bar.categoryAxis.categoryNames = ["Tech", "Comm", "Logic", "Body"]
    bar.categoryAxis.labels.boxAnchor = "ne"
    bar.categoryAxis.labels.angle = 0
    bar.categoryAxis.labels.dy = -4
    bar.valueAxis.valueMin = 0
    bar.valueAxis.valueMax = 100
    bar.valueAxis.valueStep = 20
    bar.valueAxis.strokeColor = colors.HexColor("#94a3b8")
    bar.categoryAxis.strokeColor = colors.HexColor("#94a3b8")
    bar.bars[0].fillColor = THEME["brand_blue"]
    bar.bars[1].fillColor = THEME["brand_purple"]
    bar.bars[2].fillColor = THEME["brand_amber"]
    bar.bars[3].fillColor = THEME["brand_green"]
    bar.barWidth = 40
    bar.groupSpacing = 22
    bar_drawing.add(bar)
    bar_drawing.add(String(12, 200, "Category Score Chart", fontName="Helvetica-Bold", fontSize=11, fillColor=THEME["ink"]))

    pie_drawing = Drawing(200, 220)
    pie = Pie()
    pie.x = 22
    pie.y = 52
    pie.width = 140
    pie.height = 140
    pie.data = [max(1, value) for value in values]
    pie.labels = ["Tech", "Comm", "Logic", "Body"]
    pie.slices.strokeColor = colors.white
    pie.slices[0].fillColor = THEME["brand_blue"]
    pie.slices[1].fillColor = THEME["brand_purple"]
    pie.slices[2].fillColor = THEME["brand_amber"]
    pie.slices[3].fillColor = THEME["brand_green"]
    pie_drawing.add(pie)
    pie_drawing.add(String(12, 200, "Distribution Chart", fontName="Helvetica-Bold", fontSize=11, fillColor=THEME["ink"]))

    legend_y = 28
    legend_items = [
        ("Tech", values[0], THEME["brand_blue"]),
        ("Comm", values[1], THEME["brand_purple"]),
        ("Logic", values[2], THEME["brand_amber"]),
        ("Body", values[3], THEME["brand_green"]),
    ]
    x_cursor = 12
    for name, val, col in legend_items:
        pie_drawing.add(String(x_cursor, legend_y, f"{name}: {val}%", fontName="Helvetica", fontSize=8.5, fillColor=col))
        x_cursor += 46

    chart_table = Table([[bar_drawing, pie_drawing]], colWidths=[(PAGE_WIDTH - 80) * 0.62, (PAGE_WIDTH - 80) * 0.38])
    chart_table.setStyle(TableStyle([
        ("BACKGROUND", (0, 0), (-1, -1), colors.white),
        ("BOX", (0, 0), (-1, -1), 0.75, colors.HexColor("#dbe3ee")),
        ("INNERGRID", (0, 0), (-1, -1), 0.5, colors.HexColor("#eef2f7")),
        ("VALIGN", (0, 0), (-1, -1), "TOP"),
        ("LEFTPADDING", (0, 0), (-1, -1), 6),
        ("RIGHTPADDING", (0, 0), (-1, -1), 6),
        ("TOPPADDING", (0, 0), (-1, -1), 8),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 8),
    ]))

    return [chart_table]


def _metric_diagnosis(metric: str, score: int) -> str:
    if score >= 85:
        return f"{metric}: Strong performance. Maintain consistency and push advanced scenarios for mastery."
    if score >= 70:
        return f"{metric}: Good baseline. Improve precision and add sharper examples to reach top-tier responses."
    if score >= 55:
        return f"{metric}: Moderate performance. Focus on structured practice and timed drills to remove hesitation."
    return f"{metric}: Priority improvement area. Build fundamentals first, then move to real mock simulations."


def _action_point_from_feedback(feedback: str) -> str:
    text = (feedback or "").strip()
    if not text:
        return "No detailed feedback available for this question."

    lines = [line.strip(" -*\t") for line in text.splitlines() if line.strip()]
    for line in lines:
        lowered = line.lower()
        if any(token in lowered for token in ["improve", "should", "try", "consider", "next time", "work on"]):
            return line

    return lines[0] if lines else "No detailed feedback available for this question."


def _draw_header(canv: canvas.Canvas, title: str, subtitle: str) -> None:
    canv.setFillColor(colors.HexColor("#0f172a"))
    canv.rect(0, PAGE_HEIGHT - 92, PAGE_WIDTH, 92, fill=1, stroke=0)
    canv.setFillColor(colors.white)
    canv.setFont("Helvetica-Bold", 20)
    canv.drawString(40, PAGE_HEIGHT - 46, title)
    canv.setFont("Helvetica", 10)
    canv.setFillColor(colors.HexColor("#cbd5e1"))
    canv.drawString(40, PAGE_HEIGHT - 64, subtitle)


def _draw_footer(canv: canvas.Canvas) -> None:
    canv.setStrokeColor(colors.HexColor("#e2e8f0"))
    canv.line(40, 40, PAGE_WIDTH - 40, 40)
    canv.setFont("Helvetica", 8)
    canv.setFillColor(colors.HexColor("#64748b"))
    canv.drawString(40, 26, "AI Interview Coach")
    canv.drawRightString(PAGE_WIDTH - 40, 26, f"Page {canv.getPageNumber()}")


def _draw_score_gauge(canv: canvas.Canvas, x: float, y: float, score: int) -> None:
    canv.setFillColor(colors.HexColor("#e2e8f0"))
    canv.circle(x, y, 48, stroke=0, fill=1)
    canv.setFillColor(colors.HexColor("#0f172a"))
    canv.circle(x, y, 42, stroke=0, fill=1)

    arc_color = colors.HexColor("#22c55e") if score >= 80 else colors.HexColor("#f59e0b") if score >= 60 else colors.HexColor("#ef4444")
    canv.setStrokeColor(arc_color)
    canv.setLineWidth(8)
    canv.arc(x - 40, y - 40, x + 40, y + 40, 90, 90 - max(0, min(score, 100)) * 3.6)

    canv.setFillColor(colors.white)
    canv.setFont("Helvetica-Bold", 22)
    canv.drawCentredString(x, y - 8, f"{score}%")
    canv.setFont("Helvetica", 8)
    canv.setFillColor(colors.HexColor("#94a3b8"))
    canv.drawCentredString(x, y - 24, "Overall Score")


def _draw_bar_chart(canv: canvas.Canvas, chart_data: List[tuple], x: float, y: float, width: float, height: float) -> None:
    canv.setFillColor(colors.white)
    canv.roundRect(x, y, width, height, 16, fill=1, stroke=0)
    canv.setStrokeColor(colors.HexColor("#e2e8f0"))
    canv.roundRect(x, y, width, height, 16, fill=0, stroke=1)

    canv.setFont("Helvetica-Bold", 12)
    canv.setFillColor(colors.HexColor("#0f172a"))
    canv.drawString(x + 16, y + height - 22, "Score Breakdown")

    max_value = 100
    bar_area_y = y + 30
    bar_height = 18
    gap = 16
    available_width = width - 160

    for index, (label, value) in enumerate(chart_data):
        row_y = bar_area_y + (len(chart_data) - index - 1) * (bar_height + gap)
        canv.setFont("Helvetica", 9)
        canv.setFillColor(colors.HexColor("#334155"))
        canv.drawString(x + 16, row_y + 4, label)

        bar_x = x + 120
        bar_width = available_width
        canv.setFillColor(colors.HexColor("#e2e8f0"))
        canv.roundRect(bar_x, row_y, bar_width, bar_height, 7, fill=1, stroke=0)

        fill_width = max(6, bar_width * (max(0, min(value, 100)) / max_value))
        fill_color = colors.HexColor("#3b82f6") if index == 0 else colors.HexColor("#8b5cf6") if index == 1 else colors.HexColor("#f59e0b") if index == 2 else colors.HexColor("#10b981")
        canv.setFillColor(fill_color)
        canv.roundRect(bar_x, row_y, fill_width, bar_height, 7, fill=1, stroke=0)
        canv.setFillColor(colors.HexColor("#0f172a"))
        canv.setFont("Helvetica-Bold", 9)
        canv.drawRightString(x + width - 16, row_y + 4, f"{value}%")


def _draw_radar_like_chart(canv: canvas.Canvas, chart_data: List[tuple], x: float, y: float, size: float) -> None:
    canv.setFillColor(colors.white)
    canv.roundRect(x, y, size, size, 16, fill=1, stroke=0)
    canv.setStrokeColor(colors.HexColor("#e2e8f0"))
    canv.roundRect(x, y, size, size, 16, fill=0, stroke=1)

    canv.setFont("Helvetica-Bold", 12)
    canv.setFillColor(colors.HexColor("#0f172a"))
    canv.drawString(x + 16, y + size - 22, "Performance Radar")

    center_x = x + size / 2
    center_y = y + size / 2 - 6
    radius = min(size * 0.28, 90)
    angles = [90, 0, 270, 180]
    labels = [item[0] for item in chart_data]

    canv.setStrokeColor(colors.HexColor("#cbd5e1"))
    canv.setLineWidth(1)
    for ring_factor in [0.33, 0.66, 1.0]:
        canv.circle(center_x, center_y, radius * ring_factor, stroke=1, fill=0)

    for angle_deg in angles:
        angle = angle_deg * 3.14159265 / 180
        canv.line(center_x, center_y, center_x + radius * 1.05 * __import__("math").cos(angle), center_y + radius * 1.05 * __import__("math").sin(angle))

    points = []
    import math
    for index, (_, value) in enumerate(chart_data):
        angle = (90 - index * 90) * math.pi / 180
        distance = radius * (max(0, min(value, 100)) / 100)
        px = center_x + distance * math.cos(angle)
        py = center_y + distance * math.sin(angle)
        points.append((px, py))

    if points:
        canv.setStrokeColor(colors.HexColor("#3b82f6"))
        canv.setFillColor(colors.Color(59 / 255, 130 / 255, 246 / 255, alpha=0.18))
        path = canv.beginPath()
        path.moveTo(points[0][0], points[0][1])
        for px, py in points[1:]:
            path.lineTo(px, py)
        path.close()
        canv.drawPath(path, fill=1, stroke=1)

    for index, (label, value) in enumerate(chart_data):
        angle = (90 - index * 90) * math.pi / 180
        text_distance = radius + 18
        lx = center_x + text_distance * math.cos(angle)
        ly = center_y + text_distance * math.sin(angle)
        canv.setFont("Helvetica", 8)
        canv.setFillColor(colors.HexColor("#475569"))
        canv.drawCentredString(lx, ly, f"{label} {value}%")


def _draw_text_block(canv: canvas.Canvas, x: float, y: float, width: float, title: str, body: str, body_font_size: int = 10) -> float:
    styles = getSampleStyleSheet()
    title_style = ParagraphStyle(
        name=f"{title}_title",
        parent=styles["Heading3"],
        fontName="Helvetica-Bold",
        fontSize=12,
        textColor=colors.HexColor("#0f172a"),
        spaceAfter=6,
        alignment=TA_LEFT,
    )
    body_style = ParagraphStyle(
        name=f"{title}_body",
        parent=styles["BodyText"],
        fontName="Helvetica",
        fontSize=body_font_size,
        leading=body_font_size + 4,
        textColor=colors.HexColor("#334155"),
        alignment=TA_LEFT,
    )

    title_para = Paragraph(title, title_style)
    body_para = Paragraph(body.replace("\n", "<br/>"), body_style)
    title_w, title_h = title_para.wrap(width, PAGE_HEIGHT)
    body_w, body_h = body_para.wrap(width, PAGE_HEIGHT)
    total_h = title_h + body_h + 8
    title_para.drawOn(canv, x, y - title_h)
    body_para.drawOn(canv, x, y - title_h - 4 - body_h)
    return total_h


def _build_focus_priorities(technical: int, communication: int, problem_solving: int, body_language: int) -> List[str]:
    priorities = [
        ("Technical", technical),
        ("Communication", communication),
        ("Problem Solving", problem_solving),
        ("Body Language", body_language),
    ]
    priorities.sort(key=lambda item: item[1])
    return [label for label, _ in priorities]


def _detect_domain(domain_hint: str) -> str:
    text = (domain_hint or "").lower()

    frontend_terms = ["react", "frontend", "ui", "javascript", "typescript", "css", "html", "tailwind", "vite", "next"]
    backend_terms = ["backend", "api", "fastapi", "django", "flask", "node", "express", "spring", "database", "sql"]
    dsa_terms = ["dsa", "algorithm", "leetcode", "data structure", "dynamic programming", "graph", "tree", "array", "binary search"]

    def score(terms: List[str]) -> int:
        return sum(1 for term in terms if term in text)

    scores = {
        "frontend": score(frontend_terms),
        "backend": score(backend_terms),
        "dsa": score(dsa_terms),
    }

    best = max(scores, key=scores.get)
    return best if scores[best] > 0 else "general"


def _domain_booster_task(domain: str) -> str:
    tasks = {
        "frontend": "Build a mini UI feature (component + state + validation) and explain trade-offs in 5 bullet points.",
        "backend": "Design one API endpoint end-to-end (schema, validation, error handling, DB query) and justify decisions.",
        "dsa": "Solve 2 DSA problems (one medium, one hard) and explain brute-force vs optimal approach with complexity.",
        "general": "Do one role-specific mock answer set using your resume projects and quantify impact in each response.",
    }
    return tasks.get(domain, tasks["general"])


def _task_for_focus(focus: str, level: str) -> str:
    tasks = {
        "Technical": {
            "core": "Revise one core topic (DSA/DBMS/OS/CN) and solve 3 medium interview questions.",
            "intense": "Do a timed technical mock of 35 mins and write trade-offs for each solution.",
        },
        "Communication": {
            "core": "Practice 5 answers using a 3-point structure: context, action, result.",
            "intense": "Record answers for HR-style prompts and refine filler-word usage.",
        },
        "Problem Solving": {
            "core": "Solve 2 scenario questions and explain assumptions before implementation.",
            "intense": "Do one whiteboard-style problem with edge-case walkthrough and complexity analysis.",
        },
        "Body Language": {
            "core": "Practice posture, eye contact, and speaking pace in a 10-minute camera session.",
            "intense": "Run a full video mock and improve gaze consistency + hand movement control.",
        },
    }
    mapping = tasks.get(focus, tasks["Technical"])
    return mapping["intense"] if level == "intense" else mapping["core"]


def _build_seven_day_plan(technical: int, communication: int, problem_solving: int, body_language: int, domain_hint: str) -> List[Dict[str, str]]:
    focus_order = _build_focus_priorities(technical, communication, problem_solving, body_language)
    domain = _detect_domain(domain_hint)
    primary = focus_order[0]
    secondary = focus_order[1]
    tertiary = focus_order[2]
    fourth = focus_order[3]

    return [
        {
            "day": "Day 1",
            "focus": f"Baseline + {primary}",
            "task": _task_for_focus(primary, "core"),
            "goal": "Set benchmark and fix biggest weakness first.",
        },
        {
            "day": "Day 2",
            "focus": secondary,
            "task": _task_for_focus(secondary, "core"),
            "goal": "Build consistency in the second-priority skill.",
        },
        {
            "day": "Day 3",
            "focus": primary,
            "task": _task_for_focus(primary, "intense"),
            "goal": "Push depth under time pressure.",
        },
        {
            "day": "Day 4",
            "focus": f"{tertiary} + Domain Booster",
            "task": f"{_task_for_focus(tertiary, 'core')} {_domain_booster_task(domain)}",
            "goal": "Improve supporting skill areas with role-specific practice.",
        },
        {
            "day": "Day 5",
            "focus": secondary,
            "task": _task_for_focus(secondary, "intense"),
            "goal": "Increase confidence and response quality.",
        },
        {
            "day": "Day 6",
            "focus": fourth,
            "task": _task_for_focus(fourth, "core"),
            "goal": "Ensure full-round readiness across all dimensions.",
        },
        {
            "day": "Day 7",
            "focus": "Full Mock Interview",
            "task": "Run one complete mock interview, review mistakes, and write 5 final correction points.",
            "goal": "Consolidate learning and finalize prep strategy.",
        },
    ]


def _build_cover_page(history: Dict[str, Any], styles) -> List[Any]:
    candidate_name = _safe_text(history.get("candidate_name"), "Candidate")
    candidate_email = _safe_text(history.get("candidate_email"), "Not provided")
    interview_title = _safe_text(history.get("interview_title"), "Interview Session")
    resume_name = _safe_text(history.get("resume_filename"), "Uploaded resume")
    session_duration = _safe_text(history.get("session_duration"), "Not available")
    detected_domain = _safe_text(history.get("detected_domain"), "general").upper()
    completed_at = _safe_text(history.get("completed_at"), "Recently completed")
    final_score = int(history.get("final_score") or 0)
    technical_score = int(history.get("technical_score") or 0)
    communication_score = int(history.get("communication_score") or 0)
    problem_solving_score = int(history.get("problem_solving_score") or 0)
    body_language_score = int(history.get("body_language_score") or 0)

    cover = [
        Spacer(1, 1.2 * inch),
        Paragraph(
            '<para align="center"><font color="#f97316" size="12"><b>AI INTERVIEW COACH</b></font></para>',
            styles["ReportSub"],
        ),
        Spacer(1, 0.18 * inch),
        Paragraph(
            '<para align="center"><font color="#0f172a" size="24"><b>Interview Feedback Report</b></font></para>',
            styles["ReportTitle"],
        ),
        Spacer(1, 0.08 * inch),
        Paragraph(
            f'<para align="center"><font color="#1e293b" size="12"><b>{interview_title}</b></font></para>',
            styles["ReportSub"],
        ),
        Spacer(1, 0.06 * inch),
        Paragraph(
            '<para align="center"><font color="#475569" size="11">Detailed analysis with graphs, question-by-question feedback, and improvement plan</font></para>',
            styles["ReportSub"],
        ),
        Spacer(1, 0.08 * inch),
        Paragraph(
            f'<para align="center"><font color="#1d4ed8" size="10"><b>TRACK: {detected_domain}</b></font></para>',
            styles["ReportSub"],
        ),
        Spacer(1, 0.35 * inch),
    ]

    meta_rows = [
        [Paragraph(f"<b>Candidate</b><br/>{candidate_name}", styles["SmallBody"]), Paragraph(f"<b>Email</b><br/>{candidate_email}", styles["SmallBody"])],
        [Paragraph(f"<b>Resume</b><br/>{resume_name}", styles["SmallBody"]), Paragraph(f"<b>Session Duration</b><br/>{session_duration}", styles["SmallBody"])],
        [Paragraph(f"<b>Completed At</b><br/>{completed_at}", styles["SmallBody"]), Paragraph(f"<b>Track</b><br/>{detected_domain}", styles["SmallBody"])],
        [Paragraph("<b>Report Type</b><br/>Detailed + Graphical", styles["SmallBody"]), Paragraph("<b>Plan Style</b><br/>Domain Personalized", styles["SmallBody"])],
    ]
    meta_table = Table(meta_rows, colWidths=[(PAGE_WIDTH - 140) / 2.0] * 2)
    meta_table.setStyle(TableStyle([
        ("BACKGROUND", (0, 0), (-1, -1), colors.HexColor("#ffffff")),
        ("BOX", (0, 0), (-1, -1), 1, colors.HexColor("#dbe3ee")),
        ("INNERGRID", (0, 0), (-1, -1), 0.5, colors.HexColor("#dbe3ee")),
        ("LEFTPADDING", (0, 0), (-1, -1), 12),
        ("RIGHTPADDING", (0, 0), (-1, -1), 12),
        ("TOPPADDING", (0, 0), (-1, -1), 12),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 12),
    ]))
    cover.append(meta_table)
    cover.append(Spacer(1, 0.32 * inch))

    score_rows = [
        [
            Paragraph(f"<font color='#0f172a'><b>{final_score}%</b><br/>Overall</font>", styles["SmallBody"]),
            Paragraph(f"<font color='#0f172a'><b>{technical_score}%</b><br/>Technical</font>", styles["SmallBody"]),
            Paragraph(f"<font color='#0f172a'><b>{communication_score}%</b><br/>Communication</font>", styles["SmallBody"]),
            Paragraph(f"<font color='#0f172a'><b>{problem_solving_score}%</b><br/>Problem Solving</font>", styles["SmallBody"]),
            Paragraph(f"<font color='#0f172a'><b>{body_language_score}%</b><br/>Body Language</font>", styles["SmallBody"]),
        ]
    ]
    score_table = Table(score_rows, colWidths=[(PAGE_WIDTH - 140) / 5.0] * 5)
    score_table.setStyle(TableStyle([
        ("BACKGROUND", (0, 0), (-1, -1), colors.HexColor("#fff7ed")),
        ("BOX", (0, 0), (-1, -1), 1, colors.HexColor("#fdba74")),
        ("INNERGRID", (0, 0), (-1, -1), 0.5, colors.HexColor("#fed7aa")),
        ("ALIGN", (0, 0), (-1, -1), "CENTER"),
        ("VALIGN", (0, 0), (-1, -1), "MIDDLE"),
        ("TOPPADDING", (0, 0), (-1, -1), 12),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 12),
    ]))
    cover.append(score_table)
    cover.append(Spacer(1, 0.35 * inch))
    cover.append(Paragraph(
        "<para align='center'><font color='#334155' size='10'>This report is generated automatically from the interview session data.</font></para>",
        styles["ReportSub"],
    ))
    cover.append(PageBreak())

    return cover


def build_feedback_pdf(history: Dict[str, Any]) -> bytes:
    buffer = BytesIO()
    doc = SimpleDocTemplate(
        buffer,
        pagesize=A4,
        leftMargin=40,
        rightMargin=40,
        topMargin=105,
        bottomMargin=55,
        title="AI Interview Coach Feedback Report",
        author="AI Interview Coach",
    )

    styles = getSampleStyleSheet()
    styles.add(ParagraphStyle(name="ReportTitle", parent=styles["Heading1"], fontName="Helvetica-Bold", fontSize=20, textColor=colors.HexColor("#0f172a"), leading=24, spaceAfter=8))
    styles.add(ParagraphStyle(name="ReportSub", parent=styles["BodyText"], fontName="Helvetica", fontSize=10, leading=14, textColor=colors.HexColor("#475569")))
    styles.add(ParagraphStyle(name="SectionTitle", parent=styles["Heading2"], fontName="Helvetica-Bold", fontSize=13, textColor=colors.HexColor("#0f172a"), spaceAfter=8, spaceBefore=8))
    styles.add(ParagraphStyle(name="SmallBody", parent=styles["BodyText"], fontName="Helvetica", fontSize=9, leading=12, textColor=colors.HexColor("#334155")))
    styles.add(ParagraphStyle(name="BulletBody", parent=styles["BodyText"], fontName="Helvetica", fontSize=9, leading=12, textColor=colors.HexColor("#334155")))

    detected_domain = _detect_domain(_safe_text(history.get("domain_hint"), ""))
    history["detected_domain"] = detected_domain

    story = []
    story.extend(_build_cover_page(history, styles))
    final_score = int(history.get("final_score") or 0)
    technical_score = int(history.get("technical_score") or 0)
    communication_score = int(history.get("communication_score") or 0)
    problem_solving_score = int(history.get("problem_solving_score") or 0)
    body_language_score = int(history.get("body_language_score") or 0)

    questions = _safe_json_list(history.get("questions"))
    answers = _safe_json_list(history.get("answers"))
    feedbacks = _safe_json_list(history.get("per_question_feedback"))
    summary_parts = _split_summary_sections(_safe_text(history.get("final_feedback"), ""))

    story.append(Paragraph("Detailed Interview Feedback Report", styles["ReportTitle"]))
    story.append(Paragraph(
        "This export includes score charts, analysis notes, and question-by-question improvement guidance.",
        styles["ReportSub"],
    ))
    story.append(Spacer(1, 10))

    score_table = Table(
        [[
            Paragraph(f"<b>Final Score</b><br/>{final_score}%", styles["SmallBody"]),
            Paragraph(f"<b>Technical</b><br/>{technical_score}%", styles["SmallBody"]),
            Paragraph(f"<b>Communication</b><br/>{communication_score}%", styles["SmallBody"]),
            Paragraph(f"<b>Problem Solving</b><br/>{problem_solving_score}%", styles["SmallBody"]),
            Paragraph(f"<b>Body Language</b><br/>{body_language_score}%", styles["SmallBody"]),
        ]],
        colWidths=[(PAGE_WIDTH - 80) / 5.0] * 5,
    )
    score_table.setStyle(TableStyle([
        ("BACKGROUND", (0, 0), (-1, -1), colors.HexColor("#eef5ff")),
        ("BOX", (0, 0), (-1, -1), 0.75, colors.HexColor("#cbd5e1")),
        ("INNERGRID", (0, 0), (-1, -1), 0.5, colors.HexColor("#e2e8f0")),
        ("VALIGN", (0, 0), (-1, -1), "MIDDLE"),
        ("ALIGN", (0, 0), (-1, -1), "CENTER"),
        ("LEFTPADDING", (0, 0), (-1, -1), 8),
        ("RIGHTPADDING", (0, 0), (-1, -1), 8),
        ("TOPPADDING", (0, 0), (-1, -1), 10),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 10),
    ]))
    story.append(score_table)
    story.append(Spacer(1, 14))

    story.append(Paragraph("Graphical Breakdown", styles["SectionTitle"]))
    story.extend(_build_score_chart_flowables(
        technical_score,
        communication_score,
        problem_solving_score,
        body_language_score,
    ))
    story.append(Spacer(1, 14))

    story.append(Paragraph("Deep Analysis", styles["SectionTitle"]))
    deep_rows = [
        [Paragraph("<b>Dimension</b>", styles["SmallBody"]), Paragraph("<b>Score</b>", styles["SmallBody"]), Paragraph("<b>Detailed Diagnosis</b>", styles["SmallBody"])],
        [Paragraph("Technical", styles["SmallBody"]), Paragraph(f"{technical_score}%", styles["SmallBody"]), Paragraph(_metric_diagnosis("Technical", technical_score), styles["SmallBody"])],
        [Paragraph("Communication", styles["SmallBody"]), Paragraph(f"{communication_score}%", styles["SmallBody"]), Paragraph(_metric_diagnosis("Communication", communication_score), styles["SmallBody"])],
        [Paragraph("Problem Solving", styles["SmallBody"]), Paragraph(f"{problem_solving_score}%", styles["SmallBody"]), Paragraph(_metric_diagnosis("Problem Solving", problem_solving_score), styles["SmallBody"])],
        [Paragraph("Body Language", styles["SmallBody"]), Paragraph(f"{body_language_score}%", styles["SmallBody"]), Paragraph(_metric_diagnosis("Body Language", body_language_score), styles["SmallBody"])],
    ]
    deep_table = Table(deep_rows, colWidths=[98, 58, (PAGE_WIDTH - 80) - 156], repeatRows=1)
    deep_table.setStyle(TableStyle([
        ("BACKGROUND", (0, 0), (-1, 0), colors.HexColor("#eaf2ff")),
        ("BACKGROUND", (0, 1), (-1, -1), colors.white),
        ("BOX", (0, 0), (-1, -1), 0.75, colors.HexColor("#cbd5e1")),
        ("INNERGRID", (0, 0), (-1, -1), 0.5, colors.HexColor("#e2e8f0")),
        ("VALIGN", (0, 0), (-1, -1), "TOP"),
        ("LEFTPADDING", (0, 0), (-1, -1), 8),
        ("RIGHTPADDING", (0, 0), (-1, -1), 8),
        ("TOPPADDING", (0, 0), (-1, -1), 7),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 7),
    ]))
    story.append(deep_table)
    story.append(Spacer(1, 16))

    story.append(Paragraph("Summary Analysis", styles["SectionTitle"]))
    if summary_parts["score"]:
        story.append(Paragraph(f"<b>Score notes:</b> {summary_parts['score'].replace(chr(10), '<br/>')}", styles["SmallBody"]))
    if summary_parts["strengths"]:
        story.append(Paragraph(f"<b>Strengths:</b><br/>{summary_parts['strengths'].replace(chr(10), '<br/>')}", styles["SmallBody"]))
    if summary_parts["improve"]:
        story.append(Paragraph(f"<b>Areas to Improve:</b><br/>{summary_parts['improve'].replace(chr(10), '<br/>')}", styles["SmallBody"]))
    if summary_parts["verdict"]:
        story.append(Paragraph(f"<b>Final Verdict:</b> {summary_parts['verdict'].replace(chr(10), ' ')}", styles["SmallBody"]))
    if not any(summary_parts.values()):
        story.append(Paragraph(_safe_text(history.get("final_feedback"), "No summary available."), styles["SmallBody"]))
    story.append(Spacer(1, 12))

    story.append(Paragraph("Question-by-Question Analysis", styles["SectionTitle"]))
    if questions:
        for index, question in enumerate(questions):
            answer = _safe_text(answers[index] if index < len(answers) else None, "No answer recorded.")
            feedback = _safe_text(feedbacks[index] if index < len(feedbacks) else None, "Acceptable answer.")
            per_question_score = _extract_score_from_feedback(feedback)
            improvement = _infer_improvement(per_question_score, feedback)
            score_line = f"{per_question_score}%" if per_question_score is not None else "Not explicitly provided"
            q_table = Table([
                [Paragraph(f"<b>Q{index + 1}.</b> {question}", styles["SmallBody"])],
                [Paragraph(f"<b>Your Answer:</b> {answer}", styles["SmallBody"])],
                [Paragraph(f"<b>AI Feedback:</b> {feedback.replace(chr(10), '<br/>')}", styles["SmallBody"])],
                [Paragraph(f"<b>Per-question Score:</b> {score_line}", styles["SmallBody"])],
                [Paragraph(f"<b>Action Point:</b> {_action_point_from_feedback(feedback)}", styles["SmallBody"])],
                [Paragraph(f"<b>Improvement:</b> {improvement}", styles["SmallBody"])],
            ], colWidths=[PAGE_WIDTH - 80])
            q_table.setStyle(TableStyle([
                ("BACKGROUND", (0, 0), (-1, 0), colors.HexColor("#eff6ff")),
                ("BACKGROUND", (0, 1), (-1, 2), colors.white),
                ("BACKGROUND", (0, 3), (-1, 4), colors.HexColor("#f5f3ff")),
                ("BACKGROUND", (0, 5), (-1, 5), colors.HexColor("#fff7ed")),
                ("BOX", (0, 0), (-1, -1), 0.75, colors.HexColor("#cbd5e1")),
                ("INNERGRID", (0, 0), (-1, -1), 0.35, colors.HexColor("#e2e8f0")),
                ("LEFTPADDING", (0, 0), (-1, -1), 10),
                ("RIGHTPADDING", (0, 0), (-1, -1), 10),
                ("TOPPADDING", (0, 0), (-1, -1), 8),
                ("BOTTOMPADDING", (0, 0), (-1, -1), 8),
            ]))
            story.append(q_table)
            story.append(Spacer(1, 8))
    else:
        story.append(Paragraph("No detailed question logs were available for this session.", styles["SmallBody"]))

    story.append(PageBreak())
    story.append(Paragraph("Actionable Improvement Plan", styles["SectionTitle"]))
    improvement_notes = []
    if technical_score < 70:
        improvement_notes.append("Revise core concepts, common patterns, and trade-offs for the technical round.")
    if communication_score < 70:
        improvement_notes.append("Practice concise, structured answers using 2-3 point responses.")
    if problem_solving_score < 70:
        improvement_notes.append("Slow down when solving and mention assumptions before the solution.")
    if body_language_score < 70:
        improvement_notes.append("Keep eye contact steady and maintain a straight posture during answers.")
    if not improvement_notes:
        improvement_notes.append("Your report looks strong. Focus on polish, speed, and crisp storytelling.")

    for item in improvement_notes:
        story.append(Paragraph(f"• {item}", styles["SmallBody"]))
        story.append(Spacer(1, 4))

    story.append(Spacer(1, 10))
    story.append(Paragraph("Reference Metrics", styles["SectionTitle"]))
    ref_table = Table(
        [[
            Paragraph(f"<b>Interview ID</b><br/>{_safe_text(history.get('id'))}", styles["SmallBody"]),
            Paragraph(f"<b>Resume ID</b><br/>{_safe_text(history.get('resume_id'))}", styles["SmallBody"]),
            Paragraph(f"<b>Completed At</b><br/>{_safe_text(history.get('completed_at'))}", styles["SmallBody"]),
        ],
        [
            Paragraph(f"<b>Candidate</b><br/>{_safe_text(history.get('candidate_name'))}", styles["SmallBody"]),
            Paragraph(f"<b>Resume Title</b><br/>{_safe_text(history.get('resume_filename'))}", styles["SmallBody"]),
            Paragraph(f"<b>Session Duration</b><br/>{_safe_text(history.get('session_duration'))}", styles["SmallBody"]),
        ]],
        colWidths=[(PAGE_WIDTH - 80) / 3.0] * 3,
    )
    ref_table.setStyle(TableStyle([
        ("BACKGROUND", (0, 0), (-1, -1), colors.HexColor("#f8fafc")),
        ("BOX", (0, 0), (-1, -1), 0.75, colors.HexColor("#cbd5e1")),
        ("INNERGRID", (0, 0), (-1, -1), 0.5, colors.HexColor("#e2e8f0")),
        ("ALIGN", (0, 0), (-1, -1), "CENTER"),
        ("VALIGN", (0, 0), (-1, -1), "MIDDLE"),
        ("TOPPADDING", (0, 0), (-1, -1), 10),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 10),
    ]))
    story.append(ref_table)

    story.append(PageBreak())
    story.append(Paragraph("Next 7-Day Preparation Plan", styles["SectionTitle"]))
    story.append(Paragraph(
        "This plan is auto-generated from your current scores so you can focus on the highest-impact improvements first.",
        styles["SmallBody"],
    ))
    story.append(Spacer(1, 10))

    seven_day_plan = _build_seven_day_plan(
        technical_score,
        communication_score,
        problem_solving_score,
        body_language_score,
        _safe_text(history.get("domain_hint"), ""),
    )

    plan_rows = [[
        Paragraph("<b>Day</b>", styles["SmallBody"]),
        Paragraph("<b>Focus</b>", styles["SmallBody"]),
        Paragraph("<b>Task</b>", styles["SmallBody"]),
        Paragraph("<b>Goal</b>", styles["SmallBody"]),
    ]]

    for item in seven_day_plan:
        plan_rows.append([
            Paragraph(item["day"], styles["SmallBody"]),
            Paragraph(item["focus"], styles["SmallBody"]),
            Paragraph(item["task"], styles["SmallBody"]),
            Paragraph(item["goal"], styles["SmallBody"]),
        ])

    plan_table = Table(
        plan_rows,
        colWidths=[62, 120, 220, (PAGE_WIDTH - 80) - (62 + 120 + 220)],
        repeatRows=1,
    )
    plan_table.setStyle(TableStyle([
        ("BACKGROUND", (0, 0), (-1, 0), colors.HexColor("#eaf2ff")),
        ("TEXTCOLOR", (0, 0), (-1, 0), colors.HexColor("#0f172a")),
        ("BACKGROUND", (0, 1), (-1, -1), colors.white),
        ("BOX", (0, 0), (-1, -1), 0.75, colors.HexColor("#cbd5e1")),
        ("INNERGRID", (0, 0), (-1, -1), 0.5, colors.HexColor("#e2e8f0")),
        ("VALIGN", (0, 0), (-1, -1), "TOP"),
        ("LEFTPADDING", (0, 0), (-1, -1), 8),
        ("RIGHTPADDING", (0, 0), (-1, -1), 8),
        ("TOPPADDING", (0, 0), (-1, -1), 8),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 8),
    ]))
    story.append(plan_table)

    def first_page(canvas_obj, doc_obj):
        canvas_obj.setFillColor(colors.HexColor("#f8fafc"))
        canvas_obj.rect(0, 0, PAGE_WIDTH, PAGE_HEIGHT, fill=1, stroke=0)
        canvas_obj.setFillColor(colors.HexColor("#fb923c"))
        canvas_obj.circle(70, PAGE_HEIGHT - 72, 22, fill=1, stroke=0)
        canvas_obj.setStrokeColor(colors.HexColor("#fdba74"))
        canvas_obj.setLineWidth(3)
        canvas_obj.circle(70, PAGE_HEIGHT - 72, 28, fill=0, stroke=1)
        canvas_obj.setFillColor(colors.HexColor("#2563eb"))
        canvas_obj.roundRect(95, PAGE_HEIGHT - 88, 22, 10, 3, fill=1, stroke=0)
        canvas_obj.roundRect(95, PAGE_HEIGHT - 70, 32, 10, 3, fill=1, stroke=0)
        canvas_obj.roundRect(95, PAGE_HEIGHT - 52, 16, 10, 3, fill=1, stroke=0)
        canvas_obj.setFillColor(colors.white)
        canvas_obj.setFont("Helvetica-Bold", 12)
        canvas_obj.drawCentredString(70, PAGE_HEIGHT - 77, "AI")

    doc.build(story, onFirstPage=first_page, onLaterPages=lambda canv, doc_obj: (_draw_header(canv, "AI Interview Coach", "Interview feedback export with charts and detailed improvement notes"), _draw_footer(canv)))
    pdf_bytes = buffer.getvalue()
    buffer.close()
    return pdf_bytes