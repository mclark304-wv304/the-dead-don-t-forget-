#!/usr/bin/env python3
"""Build the free Episode 1 sample PDF from Maya's final script.

Reads script-ep1-man-at-the-gate.md VERBATIM (no story edits) and lays it out
in the same dark, elegant style as The Complete Scripts, with a cover noting
it's a free sample. Re-run to rebuild: python3 scripts/build-ep1-free-pdf.py
"""
import os
import importlib.util
from xml.sax.saxutils import escape

from reportlab.platypus import (BaseDocTemplate, PageTemplate, Frame,
                                Paragraph, Spacer, PageBreak, NextPageTemplate)

HERE = os.path.dirname(os.path.abspath(__file__))
OUT = os.path.join(os.path.dirname(HERE), "data", "ep1-script-free.pdf")
EP1 = "/home/hatch/workspace/dead_dont_forget/script-ep1-man-at-the-gate.md"

# Reuse the styles/layout helpers from the full collection builder.
spec = importlib.util.spec_from_file_location(
    "full_pdf", os.path.join(HERE, "build-complete-scripts-pdf.py"))
full = importlib.util.module_from_spec(spec)
spec.loader.exec_module(full)

free_badge = full.ParagraphStyle("free_badge", fontName="Helvetica-Bold",
                                fontSize=16, leading=20,
                                textColor=full.HexColor("#141009"),
                                backColor=full.ACCENT, alignment=full.TA_CENTER,
                                borderPadding=(8, 18, 8))


def main():
    os.makedirs(os.path.dirname(OUT), exist_ok=True)
    doc = BaseDocTemplate(OUT, pagesize=full.LETTER,
                          leftMargin=0.9 * full.inch, rightMargin=0.9 * full.inch,
                          topMargin=0.85 * full.inch, bottomMargin=0.9 * full.inch,
                          title="THE DEAD DON'T FORGET — Episode 1 Script (Free Sample)",
                          author="Maya Clark")
    frame = Frame(doc.leftMargin, doc.bottomMargin,
                  doc.width, doc.height, id="main")
    doc.addPageTemplates([
        PageTemplate(id="cover", frames=[frame], onPage=full.dark_bg),
        PageTemplate(id="body", frames=[frame], onPage=full.footer),
    ])

    story = []
    # ── Cover ──
    story.append(Spacer(1, 1.8 * full.inch))
    story.append(Paragraph("THE DEAD DON'T FORGET", full.cover_title))
    story.append(Spacer(1, 0.18 * full.inch))
    story.append(Paragraph("—" * 34, full.ep_rule_text))
    story.append(Paragraph("FREE SAMPLE", free_badge))
    story.append(Spacer(1, 0.3 * full.inch))
    story.append(Paragraph("Episode 1 — The Man at the Gate", full.cover_sub))
    story.append(Paragraph("by Maya Clark", full.cover_by))
    story.append(Spacer(1, 1.2 * full.inch))
    story.append(Paragraph(
        "A free taste of <i>The Complete Scripts</i> — every word of "
        "Episodes 1&ndash;3, exactly as written. Find it in the Bonus Store.",
        full.cover_by))

    # ── The script, verbatim ──
    story.append(NextPageTemplate("body"))
    title, flows = full.parse_script(EP1)
    story.append(PageBreak())
    story.append(Paragraph(escape(title), full.ep_title))
    story.append(Paragraph("—" * 34, full.ep_rule_text))
    story.extend(flows)

    doc.build(story)
    print("wrote", OUT, os.path.getsize(OUT), "bytes")


if __name__ == "__main__":
    main()
