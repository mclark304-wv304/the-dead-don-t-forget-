#!/usr/bin/env python3
"""Build the Complete Scripts PDF from Maya's final episode scripts.

Reads the three Markdown scripts VERBATIM (no story edits) and lays them out
as a dark, elegant collectible PDF: cover page + one section per episode.
Re-run to rebuild: python3 scripts/build-complete-scripts-pdf.py
"""
import os
from xml.sax.saxutils import escape

from reportlab.lib.pagesizes import LETTER
from reportlab.lib.styles import ParagraphStyle
from reportlab.lib.colors import HexColor
from reportlab.lib.units import inch
from reportlab.lib.enums import TA_CENTER, TA_LEFT
from reportlab.platypus import (BaseDocTemplate, PageTemplate, Frame,
                                Paragraph, Spacer, PageBreak)

# ── Palette: dark, elegant ────────────────────────────────────
BG     = HexColor("#141009")
TEXT   = HexColor("#ece2cf")
ACCENT = HexColor("#c9a227")
MUTED  = HexColor("#9a8f7a")
RULE   = HexColor("#5a4a2f")

W, H = LETTER

SCRIPTS = [
    "/home/hatch/workspace/dead_dont_forget/script-ep1-man-at-the-gate.md",
    "/home/hatch/workspace/dead_dont_forget/script-ep2-names-on-the-wall.md",
    "/home/hatch/workspace/dead_dont_forget/script-ep3-the-ledger.md",
]
OUT = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))),
                   "data", "complete-scripts.pdf")

# ── Styles ────────────────────────────────────────────────────
cover_title = ParagraphStyle("cover_title", fontName="Times-Bold", fontSize=34,
                             leading=40, textColor=TEXT, alignment=TA_CENTER)
cover_sub = ParagraphStyle("cover_sub", fontName="Helvetica-Bold", fontSize=15,
                           leading=20, textColor=ACCENT, alignment=TA_CENTER,
                           spaceBefore=18)
cover_by = ParagraphStyle("cover_by", fontName="Times-Italic", fontSize=13,
                          leading=18, textColor=MUTED, alignment=TA_CENTER,
                          spaceBefore=30)
ep_title = ParagraphStyle("ep_title", fontName="Helvetica-Bold", fontSize=20,
                          leading=26, textColor=ACCENT, alignment=TA_CENTER,
                          spaceAfter=6)
ep_rule_text = ParagraphStyle("ep_rule_text", fontName="Helvetica", fontSize=9,
                              leading=12, textColor=MUTED, alignment=TA_CENTER,
                              spaceAfter=22)
subhead = ParagraphStyle("subhead", fontName="Helvetica-Bold", fontSize=12,
                         leading=16, textColor=ACCENT, spaceBefore=10,
                         spaceAfter=8)
body = ParagraphStyle("body", fontName="Times-Roman", fontSize=11.5,
                      leading=17, textColor=TEXT, alignment=TA_LEFT,
                      spaceAfter=9)
footer_style = ParagraphStyle("footer", fontName="Helvetica", fontSize=8,
                              leading=10, textColor=MUTED, alignment=TA_CENTER)


def dark_bg(canvas, doc):
    canvas.saveState()
    canvas.setFillColor(BG)
    canvas.rect(0, 0, W, H, stroke=0, fill=1)
    canvas.restoreState()


def footer(canvas, doc):
    dark_bg(canvas, doc)
    canvas.saveState()
    canvas.setFillColor(MUTED)
    canvas.setFont("Helvetica", 8)
    canvas.drawCentredString(W / 2, 0.6 * inch, str(doc.page))
    canvas.restoreState()


def parse_script(path):
    """Return (title, [flowables]). Title = first '# ' line; body verbatim."""
    with open(path, encoding="utf-8") as f:
        lines = f.read().splitlines()
    title = None
    flows = []
    for line in lines:
        s = line.strip()
        if not s:
            flows.append(Spacer(1, 0.08 * inch))
            continue
        if s.startswith("# ") and title is None:
            title = s[2:].strip()
            continue
        if s.startswith("## "):
            flows.append(Paragraph(escape(s[3:].strip()), subhead))
            continue
        if s.startswith("#"):  # any other stray header -> subhead
            flows.append(Paragraph(escape(s.lstrip("#").strip()), subhead))
            continue
        flows.append(Paragraph(escape(line.strip()), body))
    return title or os.path.basename(path), flows


def main():
    os.makedirs(os.path.dirname(OUT), exist_ok=True)
    doc = BaseDocTemplate(OUT, pagesize=LETTER,
                          leftMargin=0.9 * inch, rightMargin=0.9 * inch,
                          topMargin=0.85 * inch, bottomMargin=0.9 * inch,
                          title="THE DEAD DON'T FORGET — The Complete Scripts",
                          author="Maya Clark")
    frame = Frame(doc.leftMargin, doc.bottomMargin,
                  doc.width, doc.height, id="main")
    doc.addPageTemplates([
        PageTemplate(id="cover", frames=[frame], onPage=dark_bg),
        PageTemplate(id="body", frames=[frame], onPage=footer),
    ])

    story = []
    # ── Cover ──
    story.append(Spacer(1, 2.2 * inch))
    story.append(Paragraph("THE DEAD DON'T FORGET", cover_title))
    story.append(Spacer(1, 0.18 * inch))
    story.append(Paragraph("—" * 34, ep_rule_text))
    story.append(Paragraph("The Complete Scripts", cover_sub))
    story.append(Paragraph("Episodes 1&ndash;3", cover_sub))
    story.append(Paragraph("by Maya Clark", cover_by))
    story.append(Spacer(1, 1.6 * inch))
    story.append(Paragraph("Every word. Exactly as written.", cover_by))

    # ── Episodes ──
    from reportlab.platypus import NextPageTemplate
    story.append(NextPageTemplate("body"))
    for i, path in enumerate(SCRIPTS):
        title, flows = parse_script(path)
        story.append(PageBreak())
        story.append(Paragraph(escape(title), ep_title))
        story.append(Paragraph("—" * 34, ep_rule_text))
        story.extend(flows)

    doc.build(story)
    print("wrote", OUT, os.path.getsize(OUT), "bytes")


if __name__ == "__main__":
    main()
