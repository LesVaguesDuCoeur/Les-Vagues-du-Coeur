import { Document, Packer, Paragraph, TextRun, Table, TableRow, TableCell, WidthType, BorderStyle, AlignmentType, HeadingLevel, ImageRun } from "docx";
import { saveAs } from "file-saver";

export const generateWord = (data) => {
  const doc = new Document({
    styles: {
        paragraphStyles: [
            {
                id: "Heading1",
                name: "Heading 1",
                run: {
                    color: "1A365D",
                    size: 28, // 14pt
                    bold: true,
                    font: "Arial"
                },
                paragraph: {
                    spacing: { after: 120 },
                }
            },
            {
                id: "Normal",
                name: "Normal",
                run: {
                    color: "1A202C",
                    size: 22, // 11pt
                    font: "Arial"
                }
            }
        ]
    },
    sections: [{
      properties: {},
      children: [
        // Header Table (Photo + Info)
        new Table({
            width: { size: 100, type: WidthType.PERCENTAGE },
            borders: { top: { style: BorderStyle.NONE }, bottom: { style: BorderStyle.NONE }, left: { style: BorderStyle.NONE }, right: { style: BorderStyle.NONE }, insideVertical: { style: BorderStyle.NONE }, insideHorizontal: { style: BorderStyle.NONE } },
            rows: [
                new TableRow({
                    children: [
                        // Photo Column (only if photo exists, or empty)
                        new TableCell({
                            width: { size: data.personalInfo.photo ? 20 : 0, type: WidthType.PERCENTAGE },
                            children: data.personalInfo.photo ? [
                                new Paragraph({
                                    children: [
                                        new ImageRun({
                                            data: data.personalInfo.photo.split(',')[1], // Remove 'data:image/png;base64,' prefix
                                            transformation: { width: 100, height: 100 },
                                            type: "png" // We assume png/jpg works. docx handles base64.
                                        })
                                    ]
                                })
                            ] : []
                        }),
                        // Info Column
                        new TableCell({
                            width: { size: data.personalInfo.photo ? 80 : 100, type: WidthType.PERCENTAGE },
                            children: [
                                new Paragraph({
                                    text: `${data.personalInfo.firstName} ${data.personalInfo.lastName}`,
                                    heading: HeadingLevel.TITLE,
                                    alignment: AlignmentType.LEFT,
                                    run: {
                                        size: 48, // 24pt
                                        color: "1A365D",
                                        bold: true,
                                        font: "Arial"
                                    }
                                }),
                                new Paragraph({
                                    children: [
                                        new TextRun({ text: `${data.personalInfo.phone || ''}  |  ${data.personalInfo.email || ''}`, color: "2C5282", size: 20 }),
                                        new TextRun({ text: `\n${data.personalInfo.city || ''}  |  ${data.personalInfo.linkedin || ''}`, color: "2C5282", size: 20, break: 1 })
                                    ]
                                }),
                                ...(data.personalInfo.tagline ? [
                                    new Paragraph({
                                        text: data.personalInfo.tagline,
                                        style: "Normal",
                                        shading: { fill: "F7FAFC", color: "auto" },
                                        border: { left: { color: "1A365D", space: 10, style: BorderStyle.SINGLE, size: 24 } },
                                        indent: { left: 200, right: 200 },
                                        spacing: { before: 200, after: 200 }
                                    })
                                ] : [])
                            ]
                        })
                    ]
                })
            ]
        }),

        // Separator
        new Paragraph({
            border: { bottom: { color: "1A365D", space: 1, style: BorderStyle.SINGLE, size: 12 } },
            spacing: { after: 200 }
        }),

        // Experiences
        new Paragraph({
            text: "EXPÉRIENCES PROFESSIONNELLES",
            heading: HeadingLevel.HEADING_1,
            border: { bottom: { color: "E2E8F0", style: BorderStyle.SINGLE, size: 6 } }
        }),
        ...data.experiences.map(exp => [
            new Paragraph({
                children: [
                    new TextRun({ text: exp.title, bold: true, size: 24 }),
                    new TextRun({ text: `\t${exp.startDate} - ${exp.endDate}`, bold: true, color: "2C5282", size: 20 })
                ],
                tabStops: [{ type: "right", position: 9000 }] // Right align date
            }),
            new Paragraph({
                text: `${exp.company} — ${exp.city}`,
                run: { color: "4A5568", italics: true, size: 20 },
                spacing: { after: 100 }
            }),
            new Paragraph({
                text: exp.description,
                spacing: { after: 200 }
            })
        ]).flat(),

        // Skills
        new Paragraph({
            text: "COMPÉTENCES",
            heading: HeadingLevel.HEADING_1,
            border: { bottom: { color: "E2E8F0", style: BorderStyle.SINGLE, size: 6 } },
            spacing: { before: 200 }
        }),
        // Word tables are best for columns
        new Table({
            width: { size: 100, type: WidthType.PERCENTAGE },
            borders: { top: { style: BorderStyle.NONE }, bottom: { style: BorderStyle.NONE }, left: { style: BorderStyle.NONE }, right: { style: BorderStyle.NONE }, insideVertical: { style: BorderStyle.NONE }, insideHorizontal: { style: BorderStyle.NONE } },
            rows: [
                new TableRow({
                    children: data.skills.map(cat => new TableCell({
                        children: [
                            new Paragraph({ text: cat.category, run: { color: "2C5282", bold: true } }),
                            ...cat.items.map(item => new Paragraph({ text: `• ${item.name}`, bullet: { level: 0 } }))
                        ]
                    }))
                })
            ]
        }),

        // Education
        new Paragraph({
            text: "FORMATIONS",
            heading: HeadingLevel.HEADING_1,
            border: { bottom: { color: "E2E8F0", style: BorderStyle.SINGLE, size: 6 } },
            spacing: { before: 200 }
        }),
        ...data.education.map(edu => [
             new Paragraph({
                children: [
                    new TextRun({ text: edu.degree, bold: true, size: 22 }),
                    new TextRun({ text: `\t${edu.dates}`, bold: true, color: "2C5282", size: 20 })
                ],
                tabStops: [{ type: "right", position: 9000 }]
            }),
            new Paragraph({
                text: `${edu.school}, ${edu.city}`,
                run: { color: "4A5568", size: 20 },
                spacing: { after: 100 }
            })
        ]).flat(),

        // Languages & Interests
        new Table({
            width: { size: 100, type: WidthType.PERCENTAGE },
            margins: { top: 200 },
             borders: { top: { style: BorderStyle.NONE }, bottom: { style: BorderStyle.NONE }, left: { style: BorderStyle.NONE }, right: { style: BorderStyle.NONE }, insideVertical: { style: BorderStyle.NONE }, insideHorizontal: { style: BorderStyle.NONE } },
            rows: [
                new TableRow({
                    children: [
                        new TableCell({
                            children: [
                                new Paragraph({ text: "LANGUES", heading: HeadingLevel.HEADING_1 }),
                                ...data.languages.map(lang => new Paragraph({ text: `${lang.name} - ${lang.level}` }))
                            ]
                        }),
                        new TableCell({
                            children: [
                                new Paragraph({ text: "CENTRES D'INTÉRÊT", heading: HeadingLevel.HEADING_1 }),
                                new Paragraph({ text: data.interests.map(i => i.name).join(" • ") })
                            ]
                        })
                    ]
                })
            ]
        })

      ]
    }]
  });

  Packer.toBlob(doc).then((blob) => {
    saveAs(blob, `CV_${data.personalInfo.lastName}_${data.personalInfo.firstName}.docx`);
  });
};
