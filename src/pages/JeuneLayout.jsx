const {
  Document, Packer, Paragraph, TextRun, Table, TableRow, TableCell,
  Header, Footer, AlignmentType, HeadingLevel, BorderStyle, WidthType,
  ShadingType, VerticalAlign, PageNumber, PageBreak, LevelFormat,
  TableOfContents, NumberFormat
} = require('docx');
const fs = require('fs');

const BLUE = "1F4E79";
const LIGHT_BLUE = "BDD7EE";
const DARK_BLUE = "2E75B6";
const GREY_BG = "F2F2F2";

const border = { style: BorderStyle.SINGLE, size: 1, color: "AAAAAA" };
const borders = { top: border, bottom: border, left: border, right: border };
const noBorder = { style: BorderStyle.NONE, size: 0, color: "FFFFFF" };
const noBorders = { top: noBorder, bottom: noBorder, left: noBorder, right: noBorder };

function heading1(text) {
  return new Paragraph({
    heading: HeadingLevel.HEADING_1,
    spacing: { before: 360, after: 180 },
    border: { bottom: { style: BorderStyle.SINGLE, size: 6, color: DARK_BLUE, space: 4 } },
    children: [new TextRun({ text, bold: true, size: 32, color: BLUE, font: "Arial" })]
  });
}

function heading2(text) {
  return new Paragraph({
    heading: HeadingLevel.HEADING_2,
    spacing: { before: 240, after: 120 },
    children: [new TextRun({ text, bold: true, size: 26, color: DARK_BLUE, font: "Arial" })]
  });
}

function heading3(text) {
  return new Paragraph({
    heading: HeadingLevel.HEADING_3,
    spacing: { before: 180, after: 80 },
    children: [new TextRun({ text, bold: true, size: 24, color: "1F4E79", font: "Arial" })]
  });
}

function para(text, opts = {}) {
  return new Paragraph({
    alignment: AlignmentType.JUSTIFIED,
    spacing: { before: 80, after: 80, line: 360 },
    children: [new TextRun({ text, size: 24, font: "Times New Roman", ...opts })]
  });
}

function bold(text) {
  return new TextRun({ text, bold: true, size: 24, font: "Times New Roman" });
}

function italic(text) {
  return new TextRun({ text, italics: true, size: 24, font: "Times New Roman" });
}

function bullet(text) {
  return new Paragraph({
    numbering: { reference: "bullets", level: 0 },
    spacing: { before: 60, after: 60 },
    children: [new TextRun({ text, size: 24, font: "Times New Roman" })]
  });
}

function numbered(text) {
  return new Paragraph({
    numbering: { reference: "numbers", level: 0 },
    spacing: { before: 60, after: 60 },
    children: [new TextRun({ text, size: 24, font: "Times New Roman" })]
  });
}

function space(n = 1) {
  return new Paragraph({ children: [new TextRun({ text: " ".repeat(n), size: 24 })], spacing: { before: 60, after: 60 } });
}

function pageBreak() {
  return new Paragraph({ children: [new PageBreak()], spacing: { before: 0, after: 0 } });
}

function tableTitle(text) {
  return new Paragraph({
    alignment: AlignmentType.CENTER,
    spacing: { before: 120, after: 120 },
    children: [new TextRun({ text, bold: true, italics: true, size: 22, font: "Times New Roman", color: BLUE })]
  });
}

function makeTable(headers, rows, colWidths) {
  const totalW = colWidths.reduce((a, b) => a + b, 0);
  const headerRow = new TableRow({
    tableHeader: true,
    children: headers.map((h, i) => new TableCell({
      borders,
      width: { size: colWidths[i], type: WidthType.DXA },
      shading: { fill: LIGHT_BLUE, type: ShadingType.CLEAR },
      margins: { top: 80, bottom: 80, left: 120, right: 120 },
      children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: h, bold: true, size: 22, font: "Arial" })] })]
    }))
  });
  const dataRows = rows.map(row => new TableRow({
    children: row.map((cell, i) => new TableCell({
      borders,
      width: { size: colWidths[i], type: WidthType.DXA },
      margins: { top: 80, bottom: 80, left: 120, right: 120 },
      children: [new Paragraph({ alignment: AlignmentType.JUSTIFIED, children: [new TextRun({ text: String(cell), size: 22, font: "Times New Roman" })] })]
    }))
  }));
  return new Table({ width: { size: totalW, type: WidthType.DXA }, columnWidths: colWidths, rows: [headerRow, ...dataRows] });
}

function ucTable(titre, objectif, acteur, preCondition, postCondition, scenarioNominal, exception, alternative = null) {
  const rows = [
    ["Titre", titre],
    ["Objectif", objectif],
    ["Acteur(s)", acteur],
    ["Pré-condition", preCondition],
    ["Post-condition", postCondition],
    ["Scénario nominal", scenarioNominal],
  ];
  if (alternative) rows.push(["Scénario alternatif", alternative]);
  rows.push(["Exceptions", exception]);

  return new Table({
    width: { size: 9360, type: WidthType.DXA },
    columnWidths: [2000, 7360],
    rows: rows.map(([label, value]) => new TableRow({
      children: [
        new TableCell({
          borders,
          width: { size: 2000, type: WidthType.DXA },
          shading: { fill: GREY_BG, type: ShadingType.CLEAR },
          margins: { top: 80, bottom: 80, left: 120, right: 120 },
          children: [new Paragraph({ children: [new TextRun({ text: label, bold: true, size: 22, font: "Arial" })] })]
        }),
        new TableCell({
          borders,
          width: { size: 7360, type: WidthType.DXA },
          margins: { top: 80, bottom: 80, left: 120, right: 120 },
          children: [new Paragraph({ alignment: AlignmentType.JUSTIFIED, children: [new TextRun({ text: value, size: 22, font: "Times New Roman" })] })]
        })
      ]
    }))
  });
}

// ============================================================
// BUILD DOCUMENT
// ============================================================
const doc = new Document({
  styles: {
    default: {
      document: { run: { font: "Times New Roman", size: 24 } }
    },
    paragraphStyles: [
      {
        id: "Heading1", name: "Heading 1", basedOn: "Normal", next: "Normal", quickFormat: true,
        run: { size: 32, bold: true, font: "Arial", color: BLUE },
        paragraph: { spacing: { before: 360, after: 180 }, outlineLevel: 0 }
      },
      {
        id: "Heading2", name: "Heading 2", basedOn: "Normal", next: "Normal", quickFormat: true,
        run: { size: 26, bold: true, font: "Arial", color: DARK_BLUE },
        paragraph: { spacing: { before: 240, after: 120 }, outlineLevel: 1 }
      },
      {
        id: "Heading3", name: "Heading 3", basedOn: "Normal", next: "Normal", quickFormat: true,
        run: { size: 24, bold: true, font: "Arial", color: "1F4E79" },
        paragraph: { spacing: { before: 180, after: 80 }, outlineLevel: 2 }
      },
    ]
  },
  numbering: {
    config: [
      {
        reference: "bullets",
        levels: [{ level: 0, format: LevelFormat.BULLET, text: "\u2022", alignment: AlignmentType.LEFT,
          style: { paragraph: { indent: { left: 720, hanging: 360 } } } }]
      },
      {
        reference: "numbers",
        levels: [{ level: 0, format: LevelFormat.DECIMAL, text: "%1.", alignment: AlignmentType.LEFT,
          style: { paragraph: { indent: { left: 720, hanging: 360 } } } }]
      }
    ]
  },
  sections: [
    // ====== PAGE DE GARDE ======
    {
      properties: {
        page: {
          size: { width: 11906, height: 16838 },
          margin: { top: 1440, right: 1440, bottom: 1440, left: 1800 }
        }
      },
      children: [
        new Table({
          width: { size: 9000, type: WidthType.DXA },
          columnWidths: [4000, 1000, 4000],
          rows: [new TableRow({ children: [
            new TableCell({
              borders: noBorders,
              width: { size: 4000, type: WidthType.DXA },
              margins: { top: 80, bottom: 80, left: 120, right: 120 },
              children: [
                new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: "République Tunisienne", bold: true, size: 22, font: "Arial" })] }),
                new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: "Ministère de l'Enseignement Supérieur", bold: true, size: 22, font: "Arial" })] }),
                new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: "et de la Recherche Scientifique", bold: true, size: 22, font: "Arial" })] }),
              ]
            }),
            new TableCell({ borders: noBorders, width: { size: 1000, type: WidthType.DXA }, children: [new Paragraph({ children: [new TextRun("  ")] })] }),
            new TableCell({
              borders: noBorders,
              width: { size: 4000, type: WidthType.DXA },
              margins: { top: 80, bottom: 80, left: 120, right: 120 },
              children: [
                new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: "Université de Sfax", bold: true, size: 22, font: "Arial" })] }),
                new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: "Institut Supérieur d'Administration", bold: true, size: 22, font: "Arial" })] }),
                new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: "des Affaires", bold: true, size: 22, font: "Arial" })] }),
              ]
            }),
          ]})]
        }),
        space(2),
        new Paragraph({ alignment: AlignmentType.CENTER, spacing: { before: 600 }, children: [new TextRun({ text: "Projet de fin d'études", bold: true, size: 36, font: "Arial", color: BLUE })] }),
        new Paragraph({ alignment: AlignmentType.CENTER, spacing: { before: 120 }, children: [new TextRun({ text: "En vue de l'obtention du diplôme de", size: 24, font: "Times New Roman" })] }),
        new Paragraph({ alignment: AlignmentType.CENTER, spacing: { before: 80 }, children: [new TextRun({ text: "Licence en Informatique de Gestion", bold: true, size: 28, font: "Arial" })] }),
        new Paragraph({ alignment: AlignmentType.CENTER, spacing: { before: 80 }, children: [new TextRun({ text: "Parcours : Business Intelligence", bold: true, size: 24, font: "Arial" })] }),
        space(2),
        new Table({
          width: { size: 8000, type: WidthType.DXA },
          columnWidths: [8000],
          rows: [new TableRow({ children: [new TableCell({
            width: { size: 8000, type: WidthType.DXA },
            shading: { fill: LIGHT_BLUE, type: ShadingType.CLEAR },
            borders: { top: { style: BorderStyle.SINGLE, size: 4, color: BLUE }, bottom: { style: BorderStyle.SINGLE, size: 4, color: BLUE }, left: { style: BorderStyle.SINGLE, size: 4, color: BLUE }, right: { style: BorderStyle.SINGLE, size: 4, color: BLUE } },
            margins: { top: 200, bottom: 200, left: 300, right: 300 },
            children: [
              new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: "Conception et Développement d'une Plateforme", bold: true, size: 36, font: "Arial", color: BLUE })] }),
              new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: "Web Interactive pour les Débats Jeunesse –", bold: true, size: 36, font: "Arial", color: BLUE })] }),
              new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: "Projet SWAFY", bold: true, size: 36, font: "Arial", color: DARK_BLUE })] }),
            ]
          })]})],
        }),
        space(2),
        new Table({
          width: { size: 8000, type: WidthType.DXA },
          columnWidths: [8000],
          rows: [new TableRow({ children: [new TableCell({
            borders: { top: { style: BorderStyle.SINGLE, size: 2, color: "CCCCCC" }, bottom: { style: BorderStyle.SINGLE, size: 2, color: "CCCCCC" }, left: { style: BorderStyle.SINGLE, size: 2, color: "CCCCCC" }, right: { style: BorderStyle.SINGLE, size: 2, color: "CCCCCC" } },
            margins: { top: 120, bottom: 120, left: 200, right: 200 },
            children: [
              new Paragraph({ children: [new TextRun({ text: "Encadrant académique : ", bold: true, size: 24, font: "Arial" }), new TextRun({ text: "Mr/Mme ………………………………", size: 24, font: "Times New Roman" })] }),
              new Paragraph({ children: [new TextRun({ text: "Encadrant professionnel : ", bold: true, size: 24, font: "Arial" }), new TextRun({ text: "Mr/Mme ………………………………", size: 24, font: "Times New Roman" })] }),
            ]
          })]})],
        }),
        space(2),
        new Paragraph({ spacing: { before: 200 }, children: [new TextRun({ text: "Présenté par :", bold: true, size: 26, font: "Arial" })] }),
        new Paragraph({ children: [new TextRun({ text: "    Rania Heni", size: 26, font: "Times New Roman" })] }),
        new Paragraph({ children: [new TextRun({ text: "    Hajer Labedi", size: 26, font: "Times New Roman" })] }),
        space(3),
        new Table({
          width: { size: 4000, type: WidthType.DXA },
          columnWidths: [4000],
          rows: [new TableRow({ children: [new TableCell({
            borders,
            shading: { fill: BLUE, type: ShadingType.CLEAR },
            margins: { top: 100, bottom: 100, left: 200, right: 200 },
            children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: "Année universitaire 2024 – 2025", bold: true, size: 24, font: "Arial", color: "FFFFFF" })] })]
          })]})],
        }),
      ]
    },

    // ====== DÉDICACES ======
    {
      properties: { page: { size: { width: 11906, height: 16838 }, margin: { top: 1440, right: 1440, bottom: 1440, left: 1800 } } },
      headers: { default: new Header({ children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: "Plateforme SWAFY – Rapport de PFE", italics: true, size: 20, color: "666666" })] })] }) },
      footers: { default: new Footer({ children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: "Page ", size: 20 }), new TextRun({ children: [PageNumber.CURRENT], size: 20 })] })] }) },
      children: [
        new Paragraph({ alignment: AlignmentType.CENTER, spacing: { before: 2000, after: 400 }, children: [new TextRun({ text: "Dédicaces", bold: true, size: 36, font: "Arial", color: BLUE })] }),
        new Paragraph({ border: { bottom: { style: BorderStyle.SINGLE, size: 6, color: LIGHT_BLUE } }, children: [new TextRun("")] }),
        space(),
        new Paragraph({ alignment: AlignmentType.JUSTIFIED, spacing: { before: 200, after: 200, line: 400 }, children: [italic("Je dédie ce travail à mes chers parents, pour leur amour inconditionnel, leur soutien indéfectible et leurs sacrifices tout au long de mon parcours. Votre confiance en moi a été ma plus grande force.")] }),
        new Paragraph({ alignment: AlignmentType.JUSTIFIED, spacing: { before: 200, after: 200, line: 400 }, children: [italic("À ma binôme Hajer, pour sa patience, son sérieux et la belle collaboration que nous avons partagée durant ce projet.")] }),
        new Paragraph({ alignment: AlignmentType.JUSTIFIED, spacing: { before: 200, after: 200, line: 400 }, children: [italic("À tous mes enseignants de l'ISAAS qui ont contribué à ma formation et à l'enrichissement de mes connaissances.")] }),
        new Paragraph({ alignment: AlignmentType.JUSTIFIED, spacing: { before: 200, after: 200, line: 400 }, children: [italic("À l'équipe du projet SWAFY / ANPR pour leur accueil, leur guidance et la confiance qu'ils nous ont accordée.")] }),
        new Paragraph({ alignment: AlignmentType.RIGHT, spacing: { before: 600 }, children: [new TextRun({ text: "Rania Heni", italics: true, size: 24, font: "Times New Roman" })] }),
        space(3),
        new Paragraph({ border: { bottom: { style: BorderStyle.SINGLE, size: 6, color: LIGHT_BLUE } }, children: [new TextRun("")] }),
        space(),
        new Paragraph({ alignment: AlignmentType.JUSTIFIED, spacing: { before: 200, after: 200, line: 400 }, children: [italic("Je dédie ce modeste travail à ma famille, source inépuisable d'amour et de motivation. À mes parents qui m'ont toujours encouragée à persévérer.")] }),
        new Paragraph({ alignment: AlignmentType.JUSTIFIED, spacing: { before: 200, after: 200, line: 400 }, children: [italic("À ma binôme Rania, avec qui j'ai eu le plaisir de travailler tout au long de ce projet enrichissant.")] }),
        new Paragraph({ alignment: AlignmentType.JUSTIFIED, spacing: { before: 200, after: 200, line: 400 }, children: [italic("À tous ceux qui m'ont soutenue, de près ou de loin, dans l'accomplissement de ce projet de fin d'études.")] }),
        new Paragraph({ alignment: AlignmentType.RIGHT, spacing: { before: 600 }, children: [new TextRun({ text: "Hajer Labedi", italics: true, size: 24, font: "Times New Roman" })] }),
      ]
    },

    // ====== REMERCIEMENTS ======
    {
      properties: { page: { size: { width: 11906, height: 16838 }, margin: { top: 1440, right: 1440, bottom: 1440, left: 1800 } } },
      headers: { default: new Header({ children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: "Plateforme SWAFY – Rapport de PFE", italics: true, size: 20, color: "666666" })] })] }) },
      footers: { default: new Footer({ children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: "Page ", size: 20 }), new TextRun({ children: [PageNumber.CURRENT], size: 20 })] })] }) },
      children: [
        new Paragraph({ alignment: AlignmentType.CENTER, spacing: { before: 400, after: 400 }, children: [new TextRun({ text: "Remerciements", bold: true, size: 36, font: "Arial", color: BLUE })] }),
        new Paragraph({ border: { bottom: { style: BorderStyle.SINGLE, size: 6, color: LIGHT_BLUE } }, children: [new TextRun("")] }),
        space(),
        para("Nous tenons à exprimer notre profonde gratitude à toutes les personnes qui ont contribué, de près ou de loin, à la réalisation de ce projet de fin d'études."),
        space(),
        para("Nous remercions, en premier lieu, nos encadrants académiques de l'Institut Supérieur d'Administration des Affaires de Sfax pour leurs précieux conseils, leur disponibilité et leur accompagnement tout au long de ce travail."),
        space(),
        para("Nos sincères remerciements vont également à l'équipe du projet SWAFY (Science With And For Youth), rattaché à l'Agence Nationale de la Promotion de la Recherche Scientifique (ANPR), pour leur accueil chaleureux, leur confiance et le cadre de stage enrichissant qu'ils nous ont offert. Ce projet, inscrit dans le programme européen EU4Youth Tunisie, représente une initiative remarquable au service de la jeunesse tunisienne."),
        space(),
        para("Nous exprimons aussi notre gratitude à nos enseignants de l'ISAAS pour la qualité de la formation reçue durant notre cursus universitaire, qui nous a permis de mener à bien ce projet."),
        space(),
        para("Enfin, nous remercions nos familles pour leur soutien moral constant, leur patience et leurs encouragements qui ont été une source de force et de motivation tout au long de notre parcours."),
        space(2),
        new Paragraph({ alignment: AlignmentType.RIGHT, spacing: { before: 600 }, children: [new TextRun({ text: "Rania Heni & Hajer Labedi", italics: true, bold: true, size: 24, font: "Times New Roman" })] }),
      ]
    },

    // ====== RÉSUMÉ & ABSTRACT ======
    {
      properties: { page: { size: { width: 11906, height: 16838 }, margin: { top: 1440, right: 1440, bottom: 1440, left: 1800 } } },
      headers: { default: new Header({ children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: "Plateforme SWAFY – Rapport de PFE", italics: true, size: 20, color: "666666" })] })] }) },
      footers: { default: new Footer({ children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: "Page ", size: 20 }), new TextRun({ children: [PageNumber.CURRENT], size: 20 })] })] }) },
      children: [
        new Paragraph({ alignment: AlignmentType.CENTER, spacing: { before: 300, after: 300 }, children: [new TextRun({ text: "Résumé", bold: true, size: 32, font: "Arial", color: BLUE })] }),
        new Table({
          width: { size: 9360, type: WidthType.DXA },
          columnWidths: [9360],
          rows: [new TableRow({ children: [new TableCell({
            borders,
            shading: { fill: GREY_BG, type: ShadingType.CLEAR },
            margins: { top: 200, bottom: 200, left: 240, right: 240 },
            children: [
              new Paragraph({ alignment: AlignmentType.JUSTIFIED, spacing: { before: 80, after: 80, line: 360 }, children: [new TextRun({ text: "Ce projet de fin d'études porte sur la conception et le développement d'une plateforme web interactive dédiée aux débats de la jeunesse tunisienne, dans le cadre du projet SWAFY (Science With And For Youth) soutenu par l'Agence Nationale de la Promotion de la Recherche Scientifique (ANPR) et le programme européen EU4Youth Tunisie.", size: 24, font: "Times New Roman" })] }),
              new Paragraph({ alignment: AlignmentType.JUSTIFIED, spacing: { before: 80, after: 80, line: 360 }, children: [new TextRun({ text: "La plateforme développée permet aux jeunes de s'inscrire, de participer aux sessions de diffusion en direct (Lives), de prendre part à des enquêtes interactives, de publier et commenter des débats, et de gérer leur profil. Du côté administrateur, le système offre un tableau de bord complet pour gérer les utilisateurs, les contenus, les statistiques de participation et la modération.", size: 24, font: "Times New Roman" })] }),
              new Paragraph({ alignment: AlignmentType.JUSTIFIED, spacing: { before: 80, after: 80, line: 360 }, children: [new TextRun({ text: "Développée avec Node.js et React.js, la solution repose sur une base de données MySQL et est déployée sur des plateformes cloud (Railway, Vercel, Render). Ce rapport présente l'ensemble du cycle de développement : analyse des besoins, modélisation UML, conception de la base de données et réalisation des interfaces.", size: 24, font: "Times New Roman" })] }),
              space(),
              new Paragraph({ children: [new TextRun({ text: "Mots-clés : ", bold: true, size: 24, font: "Arial" }), new TextRun({ text: "Plateforme web, Débat jeunesse, SWAFY, ANPR, Node.js, React.js, MySQL, UML, Lives, Enquêtes.", size: 24, font: "Times New Roman" })] }),
            ]
          })]})],
        }),
        space(2),
        new Paragraph({ alignment: AlignmentType.CENTER, spacing: { before: 300, after: 300 }, children: [new TextRun({ text: "Abstract", bold: true, size: 32, font: "Arial", color: BLUE })] }),
        new Table({
          width: { size: 9360, type: WidthType.DXA },
          columnWidths: [9360],
          rows: [new TableRow({ children: [new TableCell({
            borders,
            shading: { fill: GREY_BG, type: ShadingType.CLEAR },
            margins: { top: 200, bottom: 200, left: 240, right: 240 },
            children: [
              new Paragraph({ alignment: AlignmentType.JUSTIFIED, spacing: { before: 80, after: 80, line: 360 }, children: [new TextRun({ text: "This end-of-studies project focuses on the design and development of an interactive web platform dedicated to debates among Tunisian youth, as part of the SWAFY (Science With And For Youth) project supported by the National Agency for the Promotion of Scientific Research (ANPR) and the EU4Youth Tunisia European program.", size: 24, font: "Times New Roman" })] }),
              new Paragraph({ alignment: AlignmentType.JUSTIFIED, spacing: { before: 80, after: 80, line: 360 }, children: [new TextRun({ text: "The platform enables youth to register, participate in live streaming sessions, take part in interactive surveys, publish and comment on debates, and manage their profiles. On the administrator side, the system provides a comprehensive dashboard for managing users, content, participation statistics, and moderation.", size: 24, font: "Times New Roman" })] }),
              new Paragraph({ alignment: AlignmentType.JUSTIFIED, spacing: { before: 80, after: 80, line: 360 }, children: [new TextRun({ text: "Built with Node.js and React.js, the solution uses a MySQL database and is deployed on cloud platforms (Railway, Vercel, Render). This report presents the complete development lifecycle: requirements analysis, UML modeling, database design, and interface implementation.", size: 24, font: "Times New Roman" })] }),
              space(),
              new Paragraph({ children: [new TextRun({ text: "Keywords: ", bold: true, size: 24, font: "Arial" }), new TextRun({ text: "Web platform, Youth debate, SWAFY, ANPR, Node.js, React.js, MySQL, UML, Live streaming, Surveys.", size: 24, font: "Times New Roman" })] }),
            ]
          })]})],
        }),
      ]
    },

    // ====== TABLE DES MATIÈRES ======
    {
      properties: { page: { size: { width: 11906, height: 16838 }, margin: { top: 1440, right: 1440, bottom: 1440, left: 1800 } } },
      headers: { default: new Header({ children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: "Plateforme SWAFY – Rapport de PFE", italics: true, size: 20, color: "666666" })] })] }) },
      footers: { default: new Footer({ children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: "Page ", size: 20 }), new TextRun({ children: [PageNumber.CURRENT], size: 20 })] })] }) },
      children: [
        new Paragraph({ alignment: AlignmentType.CENTER, spacing: { before: 200, after: 400 }, children: [new TextRun({ text: "Table des Matières", bold: true, size: 32, font: "Arial", color: BLUE })] }),
        new TableOfContents("Table des Matières", { hyperlink: true, headingStyleRange: "1-3" }),
      ]
    },

    // ====== LISTE DES FIGURES ======
    {
      properties: { page: { size: { width: 11906, height: 16838 }, margin: { top: 1440, right: 1440, bottom: 1440, left: 1800 } } },
      headers: { default: new Header({ children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: "Plateforme SWAFY – Rapport de PFE", italics: true, size: 20, color: "666666" })] })] }) },
      footers: { default: new Footer({ children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: "Page ", size: 20 }), new TextRun({ children: [PageNumber.CURRENT], size: 20 })] })] }) },
      children: [
        new Paragraph({ alignment: AlignmentType.CENTER, spacing: { before: 200, after: 300 }, children: [new TextRun({ text: "Liste des Figures", bold: true, size: 28, font: "Arial", color: BLUE })] }),
        makeTable(["Référence", "Description"], [
          ["Figure 1", "Logo du projet SWAFY / ANPR"],
          ["Figure 2", "Diagramme de contexte – situation actuelle"],
          ["Figure 3", "Diagramme de cas d'utilisation métier"],
          ["Figure 4", "Diagramme de cas d'utilisation global du système"],
          ["Figure 5", "Diagramme de classes principal"],
          ["Figure 6", "Diagramme de séquence – Authentification"],
          ["Figure 7", "Diagramme de séquence – Inscription avec vérification email"],
          ["Figure 8", "Diagramme de séquence – Participer à un Live"],
          ["Figure 9", "Diagramme de séquence – Participer à une Enquête"],
          ["Figure 10", "Diagramme de séquence – Gérer les Débats"],
          ["Figure 11", "Diagramme de séquence – Gérer les Publications"],
          ["Figure 12", "Diagramme de séquence – Messagerie instantanée"],
          ["Figure 13", "Diagramme d'états – Utilisateur"],
          ["Figure 14", "Schéma logique des données"],
          ["Figure 15", "Schéma physique de la base de données"],
          ["Figure 16", "Interface – Page d'accueil (Swafy.jsx)"],
          ["Figure 17", "Interface – Inscription & Vérification email"],
          ["Figure 18", "Interface – Tableau de bord Jeune"],
          ["Figure 19", "Interface – Section Lives"],
          ["Figure 20", "Interface – Publication et Débat"],
          ["Figure 21", "Interface – Messagerie (Messenger)"],
          ["Figure 22", "Interface – Tableau de bord Administrateur"],
          ["Figure 23", "Interface – Gestion des Utilisateurs"],
          ["Figure 24", "Interface – Statistiques de participation"],
          ["Figure 25", "Interface – Paramètres"],
        ], [3000, 6360]),
        space(2),
        new Paragraph({ alignment: AlignmentType.CENTER, spacing: { before: 300, after: 300 }, children: [new TextRun({ text: "Liste des Tableaux", bold: true, size: 28, font: "Arial", color: BLUE })] }),
        makeTable(["Référence", "Description"], [
          ["Tableau 1", "Tableau comparatif : Plateforme SWAFY vs YLP Tunisie"],
          ["Tableau 2", "Description textuelle UC – Authentification"],
          ["Tableau 3", "Description textuelle UC – Inscription"],
          ["Tableau 4", "Description textuelle UC – Participer au Live"],
          ["Tableau 5", "Description textuelle UC – Créer un Live (Admin)"],
          ["Tableau 6", "Description textuelle UC – Participer à l'enquête"],
          ["Tableau 7", "Description textuelle UC – Gérer le profil"],
          ["Tableau 8", "Description textuelle UC – Participer au débat"],
          ["Tableau 9", "Description textuelle UC – Publier un contenu"],
          ["Tableau 10", "Description textuelle UC – Messagerie instantanée"],
          ["Tableau 11", "Description textuelle UC – Gérer les utilisateurs (Admin)"],
          ["Tableau 12", "Description textuelle UC – Gérer les statistiques (Admin)"],
          ["Tableau 13", "Dictionnaire de données – Tables principales"],
          ["Tableau 14", "Environnement de développement et outils utilisés"],
        ], [3000, 6360]),
      ]
    },

    // ====== INTRODUCTION GÉNÉRALE ======
    {
      properties: { page: { size: { width: 11906, height: 16838 }, margin: { top: 1440, right: 1440, bottom: 1440, left: 1800 } } },
      headers: { default: new Header({ children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: "Plateforme SWAFY – Rapport de PFE", italics: true, size: 20, color: "666666" })] })] }) },
      footers: { default: new Footer({ children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: "Page ", size: 20 }), new TextRun({ children: [PageNumber.CURRENT], size: 20 })] })] }) },
      children: [
        heading1("Introduction Générale"),
        space(),
        para("À l'ère du numérique, la participation citoyenne des jeunes passe de plus en plus par des espaces d'échanges en ligne. La jeunesse tunisienne, reconnue pour son dynamisme intellectuel et son désir d'engagement, manquait jusqu'ici d'une plateforme dédiée, sécurisée et structurée pour exprimer ses opinions scientifiques, participer à des débats constructifs et interagir avec des experts."),
        space(),
        para("C'est dans ce contexte que s'inscrit le projet SWAFY (Science With And For Youth), une initiative portée par l'Agence Nationale de la Promotion de la Recherche Scientifique (ANPR) dans le cadre du programme européen EU4Youth Tunisie. Ce projet vise à créer un lien durable entre la science et la jeunesse tunisienne, à travers des débats nationaux, des congrès, des clubs scientifiques et des activités d'innovation."),
        space(),
        para("Notre mission, dans le cadre de ce projet de fin d'études réalisé à l'ISAAS de Sfax, a consisté à concevoir et développer la plateforme web officielle du projet SWAFY. Cette plateforme numérique interactive centralise les activités du projet en offrant aux jeunes un espace d'inscription, de participation aux Lives, de vote dans les enquêtes, de publication et de débat, tout en fournissant à l'équipe SWAFY un tableau de bord analytique complet."),
        space(),
        new Paragraph({ alignment: AlignmentType.JUSTIFIED, spacing: { before: 80, after: 80, line: 360 }, children: [new TextRun({ text: "Ce rapport est organisé en quatre chapitres principaux :", size: 24, font: "Times New Roman" })] }),
        bullet("Chapitre 1 – Modélisation du métier : présentation du domaine, étude de l'existant, critique et objectifs à atteindre."),
        bullet("Chapitre 2 – Capture des besoins : identification des acteurs, élaboration des cas d'utilisation et descriptions textuelles."),
        bullet("Chapitre 3 – Analyse et conception : diagramme de classes, diagrammes de séquence, diagrammes d'états."),
        bullet("Chapitre 4 – Réalisation : environnement technique, conception de la base de données et présentation des interfaces."),
        space(),
        para("Ce travail a été réalisé sur une période allant de début février à fin avril 2025, au sein de l'organisme ANPR – projet SWAFY à Tunis."),
      ]
    },

    // ====== CHAPITRE 1 ======
    {
      properties: { page: { size: { width: 11906, height: 16838 }, margin: { top: 1440, right: 1440, bottom: 1440, left: 1800 } } },
      headers: { default: new Header({ children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: "Chapitre 1 : Modélisation du Métier", italics: true, size: 20, color: "666666" })] })] }) },
      footers: { default: new Footer({ children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: "Page ", size: 20 }), new TextRun({ children: [PageNumber.CURRENT], size: 20 })] })] }) },
      children: [
        new Paragraph({
          alignment: AlignmentType.CENTER,
          spacing: { before: 400, after: 200 },
          shading: { fill: BLUE, type: ShadingType.CLEAR },
          children: [new TextRun({ text: "Chapitre 1 : Modélisation du Métier", bold: true, size: 40, font: "Arial", color: "FFFFFF" })]
        }),
        space(2),

        heading1("Introduction"),
        para("Le projet SWAFY vise à structurer un débat national autour de la thématique « Jeunesse et Science » en identifiant les enjeux prioritaires et les obstacles structurels. Il s'adresse aux acteurs éducatifs et scientifiques, au secteur public et privé, à la société civile, aux citoyens, aux partenaires internationaux, aux médias et à la jeunesse tunisienne elle-même, actrice centrale et bénéficiaire ultime de toute transformation."),
        space(),

        heading1("1.1. Étude de l'existant"),

        heading2("1.1.1. Repérage du domaine"),

        heading3("A. Présentation du cadre du stage"),
        para("Le stage a été effectué au sein de l'Agence Nationale de la Promotion de la Recherche Scientifique (ANPR), dans le cadre du projet SWAFY, situé à Tunis. L'ANPR est un établissement public tunisien sous tutelle du Ministère de l'Enseignement Supérieur et de la Recherche Scientifique, chargé de la promotion et du financement de la recherche scientifique nationale."),
        space(),
        para("Le projet SWAFY (Science With And For Youth) s'inscrit dans le programme européen EU4Youth Tunisie. Il joue un rôle essentiel dans le développement des compétences des jeunes scientifiques, en créant et en soutenant les clubs scientifiques dans tous les gouvernorats tunisiens. Son objectif est d'accroître la valeur ajoutée de la recherche et de l'innovation en collaborant avec les jeunes, les clubs scientifiques, les associations, les encadrants et chercheurs."),
        space(),

        heading3("B. Diagramme de contexte"),
        para("Étant donné que le projet SWAFY ne dispose pas encore d'une plateforme numérique centralisée, la gestion des interactions se fait de manière manuelle ou via des outils tiers dispersés (réseaux sociaux, Google Forms, événements physiques). Le diagramme de contexte illustre cette organisation fragmentée."),
        space(),
        new Paragraph({ alignment: AlignmentType.CENTER, spacing: { before: 120, after: 120 }, children: [new TextRun({ text: "[Figure 2 : Diagramme de contexte – situation actuelle]", italics: true, size: 22, color: "888888", font: "Times New Roman" })] }),
        space(),
        para("Ce diagramme met en évidence la complexité et la dispersion des flux d'informations actuels. L'équipe SWAFY utilise des canaux non officiels ou externes (Facebook, formulaires en ligne, ou papier lors des événements) pour annoncer les débats et récolter les avis. Les jeunes participent de manière non structurée : ils commentent sur les réseaux sociaux au milieu d'autres publications, sans que leurs interventions ne soient archivées ni valorisées."),
        space(),

        heading2("1.1.2. Diagramme de cas d'utilisation métier"),
        para("Le diagramme de cas d'utilisation métier représente les différents processus actuels du projet SWAFY avant l'implémentation du système informatisé. Il identifie les principaux travailleurs du métier et leurs interactions avec les processus existants."),
        space(),
        new Paragraph({ alignment: AlignmentType.CENTER, spacing: { before: 120, after: 120 }, children: [new TextRun({ text: "[Figure 3 : Diagramme de cas d'utilisation métier]", italics: true, size: 22, color: "888888", font: "Times New Roman" })] }),
        space(),
        para("Les principaux processus métier identifiés sont : l'organisation des débats jeunesse, la diffusion d'événements scientifiques, la gestion des clubs scientifiques par gouvernorat, la collecte d'avis et de retours des jeunes, et la communication des résultats des débats."),
        space(),

        heading2("1.1.3. Comparaison avec des initiatives similaires – YLP Tunisie"),
        para("Youth Leadership Programme (YLP Tunisie) est une initiative dédiée au renforcement des capacités des jeunes en Tunisie. Ce programme vise à offrir aux jeunes des espaces de dialogue, de réflexion et d'échange autour des enjeux qui concernent leur avenir."),
        space(),
        tableTitle("Tableau 1 : Comparatif entre la plateforme SWAFY et YLP Tunisie"),
        makeTable(
          ["Critère", "YLP Tunisie", "Notre plateforme SWAFY"],
          [
            ["Accessibilité", "Accès sélectif", "Accès libre pour tous les jeunes"],
            ["Participation", "Nombre limité de participants", "Large participation nationale"],
            ["Liberté d'expression", "Expression encadrée", "Expression totalement libre"],
            ["Continuité", "Activités ponctuelles", "Plateforme disponible en permanence"],
            ["Innovation", "Méthodes classiques", "Outils numériques interactifs"],
            ["Statistiques", "Non disponibles", "Tableau de bord analytique complet"],
            ["Modération", "Manuelle", "Système de signalement automatisé"],
          ],
          [2500, 3000, 3860]
        ),
        space(2),

        heading1("1.2. Critique de l'existant"),
        para("L'analyse de la situation actuelle révèle plusieurs limites majeures qui justifient pleinement la création d'une solution numérique dédiée :"),
        space(),
        bullet("Absence d'un site web dédié : La communication est dispersée et non centralisée, ce qui rend l'accès à l'information difficile pour les jeunes comme pour l'administration."),
        bullet("Dépendance aux réseaux sociaux : Les échanges se font sur des plateformes où les discussions sont non organisées, difficiles à modérer et rapidement noyées par d'autres contenus."),
        bullet("Aucun système de gestion des profils : Il est impossible d'identifier clairement les participants, de vérifier leur identité ou de protéger leurs données personnelles."),
        bullet("Absence de centralisation des Lives : Aucune fonctionnalité ne permet de regrouper les diffusions vidéo en direct et d'y associer un espace de questions/réponses dédié."),
        bullet("Système de vote non sécurisé : Les outils actuels ne permettent pas de récolter les avis des jeunes avec garantie d'unicité du vote."),
        bullet("Manque de traçabilité des idées : Il est très difficile d'exploiter les propositions des jeunes et d'en extraire des statistiques claires pour les décideurs."),
        bullet("Absence de messagerie institutionnelle : Les échanges entre jeunes et avec l'administration se font via des canaux non sécurisés et non archivés."),
        space(),

        heading1("1.3. Objectifs à atteindre"),
        para("Pour pallier les limites de l'existant, notre plateforme numérique SWAFY vise à atteindre les objectifs suivants :"),
        space(),
        numbered("Créer un espace sécurisé : Mettre en place un système d'authentification avec vérification par email pour gérer les profils des jeunes et garantir la fiabilité des participants."),
        numbered("Centraliser les sessions de débats (Lives) : Offrir un accès direct aux diffusions vidéo où les jeunes peuvent poser des questions en temps réel aux experts invités."),
        numbered("Mettre en place un système de publications et débats : Permettre aux jeunes de publier des contenus (texte, image, vidéo, PDF), de commenter et de débattre en prenant des positions argumentées (Pour/Contre)."),
        numbered("Développer une messagerie instantanée : Intégrer un système de messagerie privée et de groupe pour faciliter la communication entre les jeunes."),
        numbered("Mettre en place un système d'enquêtes : Permettre aux jeunes de voter et de donner leurs avis sur des sujets clés, tout en garantissant l'unicité de chaque vote."),
        numbered("Fournir un tableau de bord analytique : Permettre à l'administrateur de consulter des statistiques précises (par âge, par région, par thématique) basées sur la participation des jeunes."),
        numbered("Assurer une modération efficace : Intégrer des fonctionnalités de signalement et de filtrage des commentaires pour garantir un environnement respectueux."),
        numbered("Archiver et valoriser les propositions : Transformer les avis des jeunes en une base de données utile pour les décideurs du projet SWAFY."),
        space(),

        heading1("Conclusion"),
        para("La définition de ce cadre général et l'identification des failles du processus actuel nous ont permis de tracer les grandes lignes de notre solution numérique. La modélisation du métier a mis en lumière l'absence criante d'une infrastructure digitale adaptée aux besoins du projet SWAFY. Il est désormais impératif de modéliser les fonctionnalités de la future plateforme. Cela fera l'objet du chapitre suivant, dédié à la capture des besoins et à la conception du système."),
      ]
    },

    // ====== CHAPITRE 2 ======
    {
      properties: { page: { size: { width: 11906, height: 16838 }, margin: { top: 1440, right: 1440, bottom: 1440, left: 1800 } } },
      headers: { default: new Header({ children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: "Chapitre 2 : Capture des Besoins", italics: true, size: 20, color: "666666" })] })] }) },
      footers: { default: new Footer({ children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: "Page ", size: 20 }), new TextRun({ children: [PageNumber.CURRENT], size: 20 })] })] }) },
      children: [
        new Paragraph({
          alignment: AlignmentType.CENTER,
          spacing: { before: 400, after: 200 },
          shading: { fill: BLUE, type: ShadingType.CLEAR },
          children: [new TextRun({ text: "Chapitre 2 : Capture des Besoins", bold: true, size: 40, font: "Arial", color: "FFFFFF" })]
        }),
        space(2),

        heading1("Introduction"),
        para("Ce chapitre est consacré à l'analyse fonctionnelle et à la modélisation des besoins de la plateforme web dédiée aux débats des jeunes dans le cadre du projet SWAFY. Nous identifions les acteurs du système, précisons les besoins fonctionnels et non fonctionnels, et élaborons le modèle de cas d'utilisation avec leurs descriptions textuelles détaillées."),
        space(),

        heading1("2.1. Acteurs du système informatisé"),
        para("Dans le cadre de la création de la plateforme SWAFY, différents acteurs interagissent avec le système. Chaque acteur assume une fonction précise qui détermine son accès et les actions qu'il peut réaliser."),
        space(),
        makeTable(
          ["Acteur", "Description", "Accès principal"],
          [
            ["Visiteur", "Utilisateur non authentifié. Il parcourt le site pour consulter les informations publiques, voir les Lives disponibles et s'inscrire.", "Page d'accueil, inscription"],
            ["Jeune intéressé", "Utilisateur authentifié. Il participe aux Lives, répond aux enquêtes, publie des contenus, commente, débat et utilise la messagerie.", "Tableau de bord complet, publications, Lives, messagerie"],
            ["Administrateur\n(équipe SWAFY)", "Gestionnaire global de la plateforme. Il gère les utilisateurs, crée les Lives et enquêtes, modère les contenus et consulte les statistiques.", "Tableau de bord admin, gestion complète"],
          ],
          [2500, 4360, 2500]
        ),
        space(2),

        heading1("2.2. Besoins fonctionnels et non fonctionnels"),

        heading2("2.2.1. Besoins fonctionnels"),
        new Paragraph({ alignment: AlignmentType.JUSTIFIED, spacing: { before: 80, after: 80 }, children: [new TextRun({ text: "Gestion des utilisateurs et sécurité :", bold: true, size: 24, font: "Arial" })] }),
        bullet("Le système permet l'inscription des jeunes avec vérification par email."),
        bullet("L'accès aux fonctionnalités est contrôlé selon le rôle (ADMIN / JEUNE)."),
        bullet("Un utilisateur bloqué ne peut plus accéder à son espace."),
        bullet("Le système empêche le vote multiple dans une même enquête."),
        space(),
        new Paragraph({ alignment: AlignmentType.JUSTIFIED, spacing: { before: 80, after: 80 }, children: [new TextRun({ text: "Gestion des débats, publications et interactivité :", bold: true, size: 24, font: "Arial" })] }),
        bullet("Publication de contenus multimédias (texte, image, vidéo, PDF)."),
        bullet("Système de réactions (like, love, haha, wow, sad, angry) sur les publications."),
        bullet("Commentaires imbriqués avec positions Pour/Contre dans les débats."),
        bullet("Signalement des contenus abusifs par les jeunes."),
        space(),
        new Paragraph({ alignment: AlignmentType.JUSTIFIED, spacing: { before: 80, after: 80 }, children: [new TextRun({ text: "Gestion des Lives :", bold: true, size: 24, font: "Arial" })] }),
        bullet("Création de sessions de diffusion en direct par l'administrateur."),
        bullet("Participation des jeunes via un code de salle ou un lien de stream."),
        bullet("Système de questions/réponses en temps réel pendant les Lives."),
        bullet("Création d'enquêtes liées aux Lives par l'administrateur."),
        space(),
        new Paragraph({ alignment: AlignmentType.JUSTIFIED, spacing: { before: 80, after: 80 }, children: [new TextRun({ text: "Messagerie instantanée :", bold: true, size: 24, font: "Arial" })] }),
        bullet("Conversations privées entre utilisateurs (1-à-1)."),
        bullet("Groupes de discussion avec partage de fichiers et votes de groupe."),
        bullet("Réactions emoji sur les messages."),
        space(),
        new Paragraph({ alignment: AlignmentType.JUSTIFIED, spacing: { before: 80, after: 80 }, children: [new TextRun({ text: "Gestion administrative et statistiques :", bold: true, size: 24, font: "Arial" })] }),
        bullet("Tableau de bord avec statistiques de participation par gouvernorat, âge, statut."),
        bullet("Gestion complète des utilisateurs (ajout, modification, blocage, suppression)."),
        bullet("Gestion des événements par gouvernorat."),
        bullet("Système de notifications en temps réel (Socket.IO)."),
        space(),

        heading2("2.2.2. Besoins non fonctionnels"),
        bullet("Ergonomie et Utilisabilité : Interface intuitive, responsive design, adaptée aux smartphones et tablettes."),
        bullet("Sécurité : Protection des données personnelles, hachage des mots de passe (bcryptjs), authentification JWT, vérification email."),
        bullet("Performance : Plateforme capable de supporter un grand nombre de connexions simultanées, notamment lors des Lives."),
        bullet("Disponibilité : Accessible 24h/24 et 7j/7 grâce au déploiement cloud (Railway, Vercel, Render)."),
        bullet("Internationalisation : Interface en français avec support de l'arabe (i18n avec LanguageContext)."),
        bullet("Scalabilité : Architecture modulaire permettant l'ajout de nouvelles fonctionnalités."),
        space(),

        heading1("2.3. Diagramme de cas d'utilisation global"),
        space(),
        new Paragraph({ alignment: AlignmentType.CENTER, spacing: { before: 120, after: 120 }, children: [new TextRun({ text: "[Figure 4 : Diagramme de cas d'utilisation global du système SWAFY]", italics: true, size: 22, color: "888888", font: "Times New Roman" })] }),
        space(),

        heading1("2.4. Descriptions textuelles des cas d'utilisation"),

        heading2("2.4.1. Cas d'utilisation : Authentification"),
        tableTitle("Tableau 2 : Description textuelle du cas d'utilisation « Authentification »"),
        ucTable(
          "Authentification",
          "Permettre à l'utilisateur (Jeune ou Administrateur) d'accéder à son espace selon ses droits.",
          "Jeune intéressé, Administrateur",
          "Le compte existe dans la base de données.",
          "Le système affiche l'interface correspondant au rôle de l'utilisateur (tableau de bord jeune ou admin).",
          "1. Le système affiche le formulaire de connexion (email et mot de passe).\n2. L'utilisateur saisit ses identifiants.\n3. L'utilisateur clique sur « Se connecter ».\n4. Le système vérifie les informations saisies et le rôle.\n5. Le système génère un token JWT et le stocke.\n6. Le système redirige l'utilisateur vers son interface correspondante.",
          "E1) Champs vides : « Veuillez remplir tous les champs obligatoires. »\nE2) Email ou mot de passe incorrect : « Veuillez vérifier vos coordonnées. »\nE3) Compte bloqué : « Votre compte a été suspendu. »\nE4) Erreur système : « Impossible de se connecter. Veuillez réessayer. »"
        ),
        space(2),

        heading2("2.4.2. Cas d'utilisation : Inscription avec vérification email"),
        tableTitle("Tableau 3 : Description textuelle du cas d'utilisation « Inscription »"),
        ucTable(
          "Inscription avec vérification email",
          "Permettre à un visiteur de créer un compte sur la plateforme SWAFY avec validation par code email.",
          "Visiteur",
          "Le visiteur accède à la page d'inscription.",
          "Un nouveau compte utilisateur est créé, vérifié et enregistré dans le système. L'utilisateur peut se connecter.",
          "1. Le visiteur clique sur « S'inscrire ».\n2. Le système affiche le formulaire d'inscription (nom, prénom, email, téléphone, date de naissance, sexe, mot de passe).\n3. Le visiteur saisit ses informations et clique sur « Valider ».\n4. Le système vérifie l'unicité de l'email.\n5. Le système envoie un code de vérification à 6 chiffres par email (via Brevo).\n6. Le visiteur saisit le code reçu sur la page de vérification.\n7. Le système valide le code et active le compte.\n8. Le système affiche : « Inscription réussie. Bienvenue sur SWAFY ! »",
          "E1) Champ vide ou invalide : « Veuillez vérifier les informations saisies. »\nE2) Email déjà utilisé : « Cette adresse email est déjà enregistrée. »\nE3) Code expiré : « Le code de vérification a expiré. »\nE4) Code incorrect : « Code invalide. »\nE5) Erreur système : « L'inscription n'a pas pu être effectuée. »"
        ),
        space(2),

        heading2("2.4.3. Cas d'utilisation : Participer à un Live"),
        tableTitle("Tableau 4 : Description textuelle du cas d'utilisation « Participer à un Live »"),
        ucTable(
          "Participer à un Live",
          "Permettre au jeune de rejoindre et de participer à une session de diffusion en direct.",
          "Jeune intéressé",
          "Le jeune est authentifié. Un Live est disponible (statut : planifié ou en_direct).",
          "Le jeune est enregistré comme participant au Live. Il peut poser des questions et participer à l'enquête associée.",
          "1. Le jeune accède à la section « Lives ».\n2. Le système affiche la liste des Lives (planifiés, en direct, terminés).\n3. Le jeune sélectionne un Live.\n4. Le système affiche les détails (titre, date, description, thématique).\n5. Si le Live est en direct, le jeune clique sur « Rejoindre ».\n6. Le système enregistre la participation (table live_participants).\n7. Le jeune accède au flux vidéo (via stream_link ou room_code).\n8. Le jeune peut poser des questions dans le chat du débat en temps réel.",
          "E1) Aucun Live disponible : « Aucun live n'est disponible pour le moment. »\nE2) Live terminé : « Cette session est terminée. »\nE3) Erreur de connexion : « Connexion au live échouée. Vérifiez votre connexion. »",
          "Participer à l'enquête du Live : Le jeune peut répondre aux questions de l'enquête associée au Live (via questions_enquete et reponses)."
        ),
        space(2),

        heading2("2.4.4. Cas d'utilisation : Créer un Live (Administrateur)"),
        tableTitle("Tableau 5 : Description textuelle du cas d'utilisation « Créer un Live »"),
        ucTable(
          "Créer un Live",
          "Permettre à l'administrateur de créer une nouvelle session de diffusion en direct avec toutes ses caractéristiques.",
          "Administrateur",
          "L'administrateur est authentifié et dispose des droits d'administration.",
          "Un nouveau Live est enregistré dans la base de données (table lives). Il apparaît dans la liste des Lives pour les jeunes.",
          "1. L'administrateur accède au tableau de bord admin.\n2. Il clique sur « Créer un nouveau Live ».\n3. Le système affiche le formulaire (titre, description, lien de stream, date, thématique, catégorie).\n4. L'administrateur remplit les informations et valide.\n5. Le système génère un code de salle unique (room_code).\n6. Le système enregistre le Live avec statut « planifié ».\n7. Un message de confirmation s'affiche.\n8. L'administrateur peut créer une enquête associée au Live.",
          "E1) Champ obligatoire vide : « Veuillez remplir tous les champs requis. »\nE2) Date invalide : « La date doit être supérieure à la date actuelle. »\nE3) Erreur d'enregistrement : « Impossible de créer le Live. »"
        ),
        space(2),

        heading2("2.4.5. Cas d'utilisation : Publier un contenu / Participer au débat"),
        tableTitle("Tableau 6 : Description textuelle du cas d'utilisation « Publier un contenu »"),
        ucTable(
          "Publier un contenu / Participer au débat",
          "Permettre au jeune de publier différents types de contenus (texte, image, vidéo, PDF, débat Pour/Contre) sur la plateforme.",
          "Jeune intéressé",
          "L'utilisateur est authentifié. Le module Publications est accessible.",
          "Le contenu est enregistré dans la base de données (table publications) et visible sur le fil d'actualité.",
          "1. Le jeune accède à la section « Publications ».\n2. Il choisit le type de publication : texte, image, vidéo, PDF, ou débat.\n3. Pour un débat : il saisit une question de débat (question_debat).\n4. Pour un fichier : il importe le fichier (stockage Cloudinary).\n5. Il saisit le contenu textuel associé.\n6. Il clique sur « Publier ».\n7. Le système valide et enregistre la publication.\n8. Le système affiche la publication dans le fil d'actualité.\n9. Les autres jeunes peuvent réagir (like/love/…), commenter et partager.",
          "E1) Champ vide : « Le contenu ne peut pas être vide. »\nE2) Format de fichier invalide : « Format non pris en charge. Formats acceptés : jpg, png, mp4, pdf. »\nE3) Fichier trop volumineux : « La taille du fichier dépasse la limite autorisée. »",
          "Commenter un débat : Le jeune peut commenter une publication et prendre une position (Pour/Contre) avec un argument (table debat_positions, publication_commentaires, debat_comments)."
        ),
        space(2),

        heading2("2.4.6. Cas d'utilisation : Messagerie instantanée"),
        tableTitle("Tableau 7 : Description textuelle du cas d'utilisation « Messagerie »"),
        ucTable(
          "Messagerie instantanée",
          "Permettre aux utilisateurs d'échanger des messages privés (1-à-1) et en groupe avec partage de fichiers et votes.",
          "Jeune intéressé, Administrateur",
          "L'utilisateur est authentifié.",
          "Les messages sont enregistrés et les conversations accessibles à tout moment.",
          "1. L'utilisateur accède à la section « Messagerie ».\n2. Il choisit entre une conversation privée ou un groupe.\n3. Pour une conversation privée : il recherche un utilisateur et initie la conversation (table messenger_conversations, messenger_messages).\n4. Pour un groupe : il accède à la salle de groupe (messenger_group_messages).\n5. Il saisit son message texte ou importe un fichier (image/vidéo).\n6. Il clique sur « Envoyer ».\n7. Le système envoie le message en temps réel via Socket.IO.\n8. Les autres participants reçoivent le message instantanément.",
          "E1) Message vide : « Impossible d'envoyer un message vide. »\nE2) Fichier invalide : « Format de fichier non supporté. »\nE3) Utilisateur non trouvé : « Cet utilisateur n'existe pas. »",
          "Créer un vote de groupe : Dans un groupe, un utilisateur peut créer un vote avec des options (tables messenger_group_votes, messenger_group_vote_options, messenger_group_vote_answers). Les membres peuvent voter et voir les résultats."
        ),
        space(2),

        heading2("2.4.7. Cas d'utilisation : Gérer les utilisateurs (Admin)"),
        tableTitle("Tableau 8 : Description textuelle du cas d'utilisation « Gérer les utilisateurs »"),
        ucTable(
          "Gérer les utilisateurs",
          "Permettre à l'administrateur de consulter, modifier le statut et gérer les profils des utilisateurs.",
          "Administrateur",
          "L'administrateur est authentifié. Le module « Gestion des utilisateurs » est disponible.",
          "Le profil d'un utilisateur est modifié ou son statut mis à jour dans le système.",
          "1. L'administrateur accède au tableau de bord.\n2. Il navigue vers « Gestion des utilisateurs ».\n3. Le système affiche la liste paginée des utilisateurs avec leurs informations (nom, email, statut, rôle, date d'inscription).\n4. L'administrateur peut filtrer par statut ou rechercher un utilisateur.\n5. Pour chaque utilisateur, il peut : voir le profil, bloquer/débloquer le compte, supprimer le compte.\n6. Le système met à jour la base de données et affiche une confirmation.",
          "E1) Informations manquantes : « Veuillez vérifier les champs saisis. »\nE2) Échec de mise à jour : « L'opération n'a pas pu être effectuée. »\nE3) Tentative de suppression de compte admin : « Action non autorisée. »"
        ),
        space(2),

        heading2("2.4.8. Cas d'utilisation : Gérer les statistiques (Admin)"),
        tableTitle("Tableau 9 : Description textuelle du cas d'utilisation « Gérer les statistiques »"),
        ucTable(
          "Gérer les statistiques",
          "Permettre à l'administrateur de consulter et filtrer les statistiques de participation sur la plateforme.",
          "Administrateur",
          "L'administrateur est authentifié. Des données de participation existent dans le système.",
          "Les statistiques sont affichées selon les critères choisis par l'administrateur.",
          "1. L'administrateur accède au tableau de bord des statistiques.\n2. Le système affiche les indicateurs clés : nombre d'utilisateurs inscrits, participation par gouvernorat, répartition par âge, statut (collège/lycée/étudiant/diplômé), nombre de publications, de Lives, d'enquêtes.\n3. L'administrateur peut filtrer par période, par gouvernorat ou par thématique.\n4. Le système met à jour les graphiques et tableaux en temps réel.\n5. L'administrateur peut exporter les données.",
          "E1) Aucune donnée : « Aucune statistique disponible pour le moment. »\nE2) Erreur de chargement : « Erreur lors du chargement des statistiques. »\nE3) Filtre invalide : « Critère de filtre incorrect. »",
          "Exporter les statistiques : L'administrateur clique sur « Exporter », le système génère un fichier téléchargeable avec les données de participation."
        ),
        space(2),

        heading1("Conclusion"),
        para("L'identification des acteurs et la modélisation des cas d'utilisation ont permis de préciser de manière exhaustive les attentes des utilisateurs ainsi que les fonctionnalités indispensables du système SWAFY. Les descriptions textuelles détaillées fournissent une base solide pour la phase de conception et de développement. Le chapitre suivant s'attachera à l'analyse statique et dynamique du système à travers les diagrammes UML."),
      ]
    },

    // ====== CHAPITRE 3 ======
    {
      properties: { page: { size: { width: 11906, height: 16838 }, margin: { top: 1440, right: 1440, bottom: 1440, left: 1800 } } },
      headers: { default: new Header({ children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: "Chapitre 3 : Analyse et Conception", italics: true, size: 20, color: "666666" })] })] }) },
      footers: { default: new Footer({ children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: "Page ", size: 20 }), new TextRun({ children: [PageNumber.CURRENT], size: 20 })] })] }) },
      children: [
        new Paragraph({
          alignment: AlignmentType.CENTER,
          spacing: { before: 400, after: 200 },
          shading: { fill: BLUE, type: ShadingType.CLEAR },
          children: [new TextRun({ text: "Chapitre 3 : Analyse et Conception", bold: true, size: 40, font: "Arial", color: "FFFFFF" })]
        }),
        space(2),

        heading1("Introduction"),
        para("Ce chapitre présente la modélisation détaillée du système SWAFY à travers les modèles statiques et dynamiques UML. Il comprend le dictionnaire de données, le diagramme de classes, les diagrammes de séquence pour les principaux cas d'utilisation, ainsi que les diagrammes d'états pour les entités à comportement complexe."),
        space(),

        heading1("3.1. Développement du modèle statique"),

        heading2("3.1.1. Dictionnaire de données"),
        para("Le dictionnaire de données ci-dessous présente les principales entités de la base de données MySQL du système SWAFY avec leurs attributs clés :"),
        space(),
        tableTitle("Tableau 10 : Dictionnaire de données – Tables principales"),
        makeTable(
          ["Table", "Attributs principaux", "Description"],
          [
            ["utilisateurs", "id_user, nom_user, prenom_user, email_user, mot_de_passe_user, role, status_user, email_verified, date_naissance, sexe, telephone_user", "Stocke tous les utilisateurs (jeunes et admins). Le rôle détermine les droits d'accès."],
            ["jeune_profiles", "id_profile, user_id, gouvernorat_jeune, delegation_jeune, ville_jeune, age, statut, etablissement", "Profil détaillé du jeune : informations géographiques et statut académique."],
            ["lives", "id_live, admin_id, title_live, description, stream_link, status_live, date_live, room_code, thematique, category", "Sessions de diffusion en direct créées par l'administrateur."],
            ["live_participants", "id_participation, live_id, user_id, date_participation, role_live", "Enregistre les jeunes ayant participé à chaque Live."],
            ["enquetes", "id_enquete, live_id, titre, description, date_creation", "Enquêtes liées aux sessions Lives."],
            ["questions_enquete", "id_question, user_id, contenu_enquete, status_question, date_creation", "Questions posées dans les enquêtes et les chats de débat."],
            ["reponses", "id_reponse, question_id, user_id, contenu_reponse, heure_reponse", "Réponses des jeunes aux questions des enquêtes."],
            ["publications", "id_publication, user_id, titre_publication, contenu_publication, type_publication, question_debat, status_publication, date_publication", "Publications des jeunes : texte, image, vidéo, PDF, débat."],
            ["publication_medias", "id_media, id_publication, type_media, url_media, nom_original, taille_fichier", "Fichiers multimédias associés aux publications (stockés sur Cloudinary)."],
            ["publication_reactions", "id_reaction, id_publication, id_user, type_reaction", "Réactions des jeunes sur les publications (like, love, haha, wow, sad, angry)."],
            ["publication_commentaires", "id_commentaire, id_publication, id_user, contenu, debat_side, parent_id", "Commentaires sur les publications avec support Pour/Contre pour les débats."],
            ["debat_positions", "id_position, id_publication, id_user, position, argument", "Position argumentée des jeunes dans les débats (Pour ou Contre)."],
            ["debat_comments", "id_comment, id_debat, id_user, side, contenu, parent_id", "Commentaires imbriqués dans les débats avec prise de position."],
            ["publications_signalements", "id_signalement, id_publication, id_user, raison, statut, traite_par", "Signalements de contenus abusifs pour modération."],
            ["messenger_conversations", "id, user_a_id, user_b_id, created_at, updated_at", "Conversations privées entre deux utilisateurs."],
            ["messenger_messages", "id, conversation_id, sender_id, type, text, attachment_url", "Messages des conversations privées (texte, image, vidéo)."],
            ["messenger_group_messages", "id, sender_id, text, file_url, msg_type", "Messages dans les groupes de discussion."],
            ["messenger_group_votes", "id, sender_id, question", "Votes créés dans les groupes de messagerie."],
            ["notifications", "id_notification, id_user_to, id_user_from, type_notification, entity_type, entity_id, message, is_read", "Notifications en temps réel envoyées aux utilisateurs."],
            ["gouvernorat", "id_gouvernorat, nom, nombre_evenement", "Référentiel des 24 gouvernorats de Tunisie."],
            ["delegation", "id_delegation, nom_delegation, id_gouvernorat", "Délégations rattachées à chaque gouvernorat."],
            ["evenement", "id_evenement, titre_evenement, date_evenement, id_gouvernorat", "Événements organisés par gouvernorat."],
            ["contacts", "id_contact, user_id, sujet, contenu_message, statut, reponse", "Messages de contact envoyés à l'administration."],
            ["email_verifications", "id, email, code, code_expires, verified, temp_password, nom, prenom, attempts", "Gestion de la vérification email lors de l'inscription."],
          ],
          [2800, 4200, 2360]
        ),
        space(2),

        heading2("3.1.2. Diagramme de classes"),
        para("Le diagramme de classes ci-dessous représente la structure statique du système SWAFY avec les principales entités, leurs attributs, les relations entre elles et leurs multiplicités."),
        space(),
        new Paragraph({ alignment: AlignmentType.CENTER, spacing: { before: 120, after: 120 }, children: [new TextRun({ text: "[Figure 5 : Diagramme de classes principal du système SWAFY]", italics: true, size: 22, color: "888888", font: "Times New Roman" })] }),
        space(),
        para("Les relations principales du diagramme de classes sont les suivantes :"),
        bullet("Utilisateur (1) ←→ (0..*) Publication : Un utilisateur peut créer plusieurs publications."),
        bullet("Publication (1) ←→ (0..*) PublicationMedia : Une publication peut avoir plusieurs fichiers médias."),
        bullet("Publication (1) ←→ (0..*) PublicationReaction : Une publication peut recevoir plusieurs réactions."),
        bullet("Publication (1) ←→ (0..*) PublicationCommentaire : Une publication peut avoir plusieurs commentaires."),
        bullet("Utilisateur (1) ←→ (1) JeuneProfile : Chaque jeune a un profil détaillé."),
        bullet("Live (1) ←→ (0..*) Enquete : Un Live peut avoir plusieurs enquêtes associées."),
        bullet("Live (1) ←→ (0..*) LiveParticipant : Un Live peut avoir plusieurs participants."),
        bullet("Utilisateur (1) ←→ (0..*) MessengerConversation : Un utilisateur peut avoir plusieurs conversations privées."),
        bullet("MessengerConversation (1) ←→ (0..*) MessengerMessage : Une conversation contient plusieurs messages."),
        bullet("Gouvernorat (1) ←→ (0..*) Delegation : Un gouvernorat contient plusieurs délégations."),
        space(2),

        heading1("3.2. Développement des modèles dynamiques"),

        heading2("3.2.1. Diagrammes de séquence"),

        heading3("Diagramme de séquence : Authentification"),
        para("Ce diagramme représente les échanges entre l'utilisateur, le navigateur, le serveur Node.js et la base de données MySQL lors du processus de connexion."),
        space(),
        new Paragraph({ alignment: AlignmentType.CENTER, spacing: { before: 120, after: 120 }, children: [new TextRun({ text: "[Figure 6 : Diagramme de séquence – Authentification]", italics: true, size: 22, color: "888888", font: "Times New Roman" })] }),
        space(),
        new Paragraph({ alignment: AlignmentType.JUSTIFIED, spacing: { before: 80, after: 80, line: 360 }, children: [new TextRun({ text: "Description des échanges :", bold: true, size: 24, font: "Arial" })] }),
        numbered("L'utilisateur saisit ses identifiants (email + mot de passe) dans le formulaire React."),
        numbered("Le composant React envoie une requête POST /auth/login au serveur Node.js."),
        numbered("Le serveur interroge la table utilisateurs via authController.js."),
        numbered("La base de données retourne les informations de l'utilisateur."),
        numbered("Le serveur vérifie le mot de passe avec bcryptjs.compare()."),
        numbered("En cas de succès, le serveur génère un token JWT (jsonwebtoken) et le retourne."),
        numbered("Le composant React stocke le token et redirige vers le tableau de bord approprié."),
        space(),

        heading3("Diagramme de séquence : Inscription avec vérification email"),
        space(),
        new Paragraph({ alignment: AlignmentType.CENTER, spacing: { before: 120, after: 120 }, children: [new TextRun({ text: "[Figure 7 : Diagramme de séquence – Inscription avec vérification email]", italics: true, size: 22, color: "888888", font: "Times New Roman" })] }),
        space(),
        numbered("Le visiteur remplit le formulaire d'inscription dans Register.jsx."),
        numbered("POST /auth/register → authController.js vérifie l'unicité de l'email."),
        numbered("Le serveur envoie un code à 6 chiffres via Brevo (service mailer.js)."),
        numbered("Les données temporaires sont stockées dans email_verifications."),
        numbered("Le visiteur saisit le code dans VerifyCode.jsx."),
        numbered("POST /auth/verify-code → Le serveur valide le code et crée le compte dans utilisateurs."),
        numbered("Le compte est activé (email_verified = 1) et l'utilisateur est redirigé."),
        space(),

        heading3("Diagramme de séquence : Participer à un Live"),
        space(),
        new Paragraph({ alignment: AlignmentType.CENTER, spacing: { before: 120, after: 120 }, children: [new TextRun({ text: "[Figure 8 : Diagramme de séquence – Participer à un Live]", italics: true, size: 22, color: "888888", font: "Times New Roman" })] }),
        space(),
        numbered("Le jeune accède à la page Lives.jsx et sélectionne un Live."),
        numbered("GET /lives/:id → Le serveur retourne les détails du Live depuis la table lives."),
        numbered("Le jeune clique sur « Rejoindre »."),
        numbered("POST /lives/:id/join → Le serveur enregistre la participation dans live_participants."),
        numbered("Le serveur retourne le room_code ou stream_link."),
        numbered("Le jeune accède au flux vidéo (MeetRoom.jsx ou LiveViewer.jsx)."),
        numbered("Le jeune peut envoyer des questions en temps réel via Socket.IO (authSocket.js)."),
        space(),

        heading3("Diagramme de séquence : Publication et débat"),
        space(),
        new Paragraph({ alignment: AlignmentType.CENTER, spacing: { before: 120, after: 120 }, children: [new TextRun({ text: "[Figure 10 : Diagramme de séquence – Gérer les publications]", italics: true, size: 22, color: "888888", font: "Times New Roman" })] }),
        space(),
        numbered("Le jeune accède à PublierPage.jsx et choisit le type de publication."),
        numbered("Pour un fichier, il est uploadé via uploadMiddleware.js vers Cloudinary."),
        numbered("POST /publications → publicationController.js enregistre dans publications et publication_medias."),
        numbered("Le serveur envoie des notifications aux abonnés via notificationController.js."),
        numbered("Les autres jeunes voient la publication dans PublicationFeed.jsx."),
        numbered("Ils peuvent réagir (POST /publications/:id/react → publication_reactions)."),
        numbered("Ils peuvent commenter (POST /publications/:id/comments → publication_commentaires)."),
        numbered("Pour un débat, ils peuvent prendre une position Pour/Contre (POST /publications/:id/position → debat_positions)."),
        space(),

        heading3("Diagramme de séquence : Messagerie instantanée"),
        space(),
        new Paragraph({ alignment: AlignmentType.CENTER, spacing: { before: 120, after: 120 }, children: [new TextRun({ text: "[Figure 12 : Diagramme de séquence – Messagerie instantanée]", italics: true, size: 22, color: "888888", font: "Times New Roman" })] }),
        space(),
        numbered("L'utilisateur ouvre Swafy_Meet.jsx (messagerie)."),
        numbered("GET /messenger/conversations → Le serveur retourne les conversations de l'utilisateur."),
        numbered("L'utilisateur sélectionne une conversation ou en crée une nouvelle."),
        numbered("POST /messenger/conversations → Création dans messenger_conversations."),
        numbered("L'utilisateur envoie un message (texte ou fichier)."),
        numbered("POST /messenger/messages → Stockage dans messenger_messages."),
        numbered("Socket.IO diffuse le message en temps réel au destinataire."),
        numbered("Le destinataire reçoit une notification via le système de notifications."),
        space(),

        heading2("3.2.2. Diagrammes d'états"),

        heading3("Diagramme d'états : Utilisateur"),
        para("Ce diagramme représente le cycle de vie d'un compte utilisateur sur la plateforme SWAFY."),
        space(),
        new Paragraph({ alignment: AlignmentType.CENTER, spacing: { before: 120, after: 120 }, children: [new TextRun({ text: "[Figure 13 : Diagramme d'états – Utilisateur]", italics: true, size: 22, color: "888888", font: "Times New Roman" })] }),
        space(),
        para("Les états possibles d'un utilisateur sont :"),
        bullet("pending_owner : État initial lors de la phase de vérification email (avant validation du code)."),
        bullet("actif : État normal après vérification de l'email. L'utilisateur peut accéder à toutes les fonctionnalités."),
        bullet("inactif : Le compte est désactivé temporairement par l'administrateur."),
        bullet("bloque : L'utilisateur a été bloqué suite à des comportements abusifs. Il ne peut plus se connecter."),
        bullet("banni : Bannissement permanent du compte par l'administrateur."),
        space(),

        heading3("Diagramme d'états : Live"),
        para("Les états d'un Live sur la plateforme sont :"),
        bullet("planifie : Le Live a été créé et planifié mais n'a pas encore démarré."),
        bullet("en_direct : Le Live est actuellement diffusé. Les jeunes peuvent le rejoindre."),
        bullet("termine : La session s'est terminée. Le replay peut être consulté."),
        bullet("annule : Le Live a été annulé par l'administrateur."),
        space(),

        heading2("3.2.3. Confrontation modèle statique / modèles dynamiques"),
        para("La confrontation entre le diagramme de classes et les diagrammes de séquence permet de valider la cohérence du modèle. Chaque message échangé dans les diagrammes de séquence correspond à une opération sur une classe du diagramme de classes, et chaque table accédée dans les séquences correspond à une entité du dictionnaire de données."),
        space(),
        para("Cette vérification croisée confirme que :"),
        bullet("Toutes les classes nécessaires sont bien définies dans le diagramme de classes."),
        bullet("Les associations entre classes correspondent aux jointures SQL dans les contrôleurs."),
        bullet("Les attributs utilisés dans les séquences existent bien dans les tables correspondantes."),
        bullet("Les contraintes d'unicité (ex : un seul vote par enquête, une seule réaction par publication par user) sont bien reflétées dans les contraintes UNIQUE KEY de la base de données."),
        space(),

        heading1("Conclusion"),
        para("La phase d'analyse et de conception a permis de formaliser l'architecture complète du système SWAFY. Les modèles statiques et dynamiques UML fournissent une vision claire et cohérente de la structure et du comportement du système. Ces modèles constituent le fondement technique sur lequel repose la phase de réalisation, présentée dans le chapitre suivant."),
      ]
    },

    // ====== CHAPITRE 4 ======
    {
      properties: { page: { size: { width: 11906, height: 16838 }, margin: { top: 1440, right: 1440, bottom: 1440, left: 1800 } } },
      headers: { default: new Header({ children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: "Chapitre 4 : Réalisation", italics: true, size: 20, color: "666666" })] })] }) },
      footers: { default: new Footer({ children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: "Page ", size: 20 }), new TextRun({ children: [PageNumber.CURRENT], size: 20 })] })] }) },
      children: [
        new Paragraph({
          alignment: AlignmentType.CENTER,
          spacing: { before: 400, after: 200 },
          shading: { fill: BLUE, type: ShadingType.CLEAR },
          children: [new TextRun({ text: "Chapitre 4 : Réalisation", bold: true, size: 40, font: "Arial", color: "FFFFFF" })]
        }),
        space(2),

        heading1("Introduction"),
        para("Ce chapitre est consacré à la phase de réalisation de la plateforme SWAFY. Nous y présentons l'environnement de développement utilisé, la conception des schémas logiques et physiques de la base de données, ainsi qu'une présentation des principales interfaces développées."),
        space(),

        heading1("4.1. Environnement de réalisation"),
        tableTitle("Tableau 11 : Environnement de développement et outils utilisés"),
        makeTable(
          ["Catégorie", "Outil / Technologie", "Version / Détail"],
          [
            ["Langage Backend", "Node.js", "JavaScript côté serveur"],
            ["Framework Backend", "Express.js", "Framework web minimaliste"],
            ["Langage Frontend", "React.js (JSX)", "Bibliothèque UI avec hooks"],
            ["Base de données", "MySQL", "Via Railway cloud (v9.4.0)"],
            ["ORM / Driver", "mysql2", "Driver MySQL natif pour Node.js"],
            ["Authentification", "jsonwebtoken (JWT) + bcryptjs", "Tokens sécurisés + hachage"],
            ["Temps réel", "Socket.IO", "WebSockets pour messagerie et notifications"],
            ["Upload fichiers", "Multer + Cloudinary", "Stockage cloud des médias"],
            ["Envoi d'emails", "Brevo (ex Sendinblue)", "Vérification email et notifications"],
            ["Déploiement Backend", "Railway / Render", "Hébergement cloud du serveur Node.js"],
            ["Déploiement Frontend", "Vercel", "Hébergement statique React"],
            ["Déploiement BDD", "Railway MySQL", "Base de données cloud"],
            ["Gestion de style", "CSS Modules + CSS classique", "Styles componentisés"],
            ["Outils de modélisation", "Draw.io / StarUML", "Diagrammes UML"],
            ["Environnement de dev", "Visual Studio Code", "Éditeur de code principal"],
            ["Versionning", "Git / GitHub", "Contrôle de version"],
          ],
          [2800, 3200, 3360]
        ),
        space(2),

        heading1("4.2. Architecture du projet"),

        heading2("4.2.1. Architecture générale"),
        para("La plateforme SWAFY suit une architecture client-serveur en trois couches :"),
        bullet("Couche présentation (Frontend) : Application React.js déployée sur Vercel. Elle communique avec le backend via des appels HTTP REST et des connexions WebSocket."),
        bullet("Couche logique métier (Backend) : Serveur Node.js/Express.js hébergé sur Railway/Render. Il gère l'authentification, les règles métier, la communication temps réel (Socket.IO) et les uploads vers Cloudinary."),
        bullet("Couche données (Base de données) : Base de données MySQL hébergée sur Railway. Elle stocke toutes les données persistantes de la plateforme."),
        space(),

        heading2("4.2.2. Structure du backend"),
        para("Le serveur backend est organisé selon une architecture MVC (Model-View-Controller) avec les répertoires suivants :"),
        bullet("controllers/ : Logique métier des contrôleurs (authController.js, publicationController.js, debatController.js, notificationController.js, etc.)"),
        bullet("routes/ : Définition des routes REST API (authRoutes.js, publicationRoutes.js, LiveRoutes.js, messengerRoutes.js, etc.)"),
        bullet("middlewares/ : Middlewares d'authentification JWT (authMiddleware.js), WebSocket auth (authSocket.js), upload de fichiers (uploadMiddleware.js, avatarUpload.js)"),
        bullet("utils/ : Utilitaires partagés (mailer.js pour Brevo, cache.js, passwordGenerator.js)"),
        bullet("config/ : Configuration de la base de données (db.js)"),
        space(),

        heading1("4.3. Conception des schémas de données"),

        heading2("4.3.1. Schéma logique des données"),
        para("Le schéma logique des données traduit le diagramme de classes en un ensemble de tables relationnelles normalisées. Les principales règles de normalisation respectées sont : l'élimination des dépendances fonctionnelles partielles (2NF) et transitives (3NF)."),
        space(),
        new Paragraph({ alignment: AlignmentType.CENTER, spacing: { before: 120, after: 120 }, children: [new TextRun({ text: "[Figure 14 : Schéma logique des données du système SWAFY]", italics: true, size: 22, color: "888888", font: "Times New Roman" })] }),
        space(),
        para("Les tables principales sont :"),
        bullet("utilisateurs (id_user, nom_user, prenom_user, email_user, mot_de_passe_user, role, status_user, email_verified, ...)"),
        bullet("jeune_profiles (id_profile, #user_id, gouvernorat_jeune, delegation_jeune, ville_jeune, age, statut, etablissement)"),
        bullet("publications (id_publication, #user_id, titre_publication, contenu_publication, type_publication, question_debat, status_publication, ...)"),
        bullet("lives (id_live, #admin_id, title_live, description, stream_link, status_live, date_live, room_code, thematique, ...)"),
        bullet("enquetes (id_enquete, #live_id, titre, description, date_creation)"),
        bullet("messenger_conversations (id, #user_a_id, #user_b_id, created_at, updated_at)"),
        bullet("notifications (id_notification, #id_user_to, #id_user_from, type_notification, entity_type, entity_id, message, is_read)"),
        space(),

        heading2("4.3.2. Schéma physique de la base de données"),
        para("Le schéma physique intègre les contraintes d'intégrité référentielle, les index de performance et les types de données optimisés pour MySQL :"),
        space(),
        new Paragraph({ alignment: AlignmentType.CENTER, spacing: { before: 120, after: 120 }, children: [new TextRun({ text: "[Figure 15 : Schéma physique de la base de données SWAFY]", italics: true, size: 22, color: "888888", font: "Times New Roman" })] }),
        space(),
        para("Principales optimisations physiques implémentées :"),
        bullet("Index sur les clés étrangères pour accélérer les jointures (ex : idx_reactions_comment, idx_reactions_user)."),
        bullet("Contraintes UNIQUE KEY pour garantir l'unicité des votes et des réactions (ex : UNIQUE(id_comment, id_user) dans comment_reactions)."),
        bullet("Cascade DELETE pour nettoyer automatiquement les données liées lors de la suppression d'un utilisateur ou d'une publication."),
        bullet("Types ENUM pour les champs à valeurs limitées (status_user, role, type_reaction, status_live, etc.) pour économiser de l'espace et garantir l'intégrité."),
        bullet("Champs TIMESTAMP avec DEFAULT CURRENT_TIMESTAMP et ON UPDATE CURRENT_TIMESTAMP pour le suivi automatique des modifications."),
        space(),

        heading1("4.4. Présentation des interfaces"),

        heading2("4.4.1. Page d'accueil – Swafy.jsx"),
        para("La page d'accueil présente le projet SWAFY avec une navigation claire vers les sections principales : inscription, connexion, présentation du programme EU4Youth et informations sur les activités SWAFY."),
        space(),
        new Paragraph({ alignment: AlignmentType.CENTER, spacing: { before: 120, after: 120 }, children: [new TextRun({ text: "[Figure 16 : Interface – Page d'accueil SWAFY]", italics: true, size: 22, color: "888888", font: "Times New Roman" })] }),
        space(),

        heading2("4.4.2. Inscription et vérification email"),
        para("Le processus d'inscription comprend deux étapes : le formulaire d'inscription (Register.jsx) avec validation des champs, puis la vérification par code email (VerifyCode.jsx). Cette approche garantit l'authenticité des utilisateurs."),
        space(),
        new Paragraph({ alignment: AlignmentType.CENTER, spacing: { before: 120, after: 120 }, children: [new TextRun({ text: "[Figure 17 : Interface – Inscription & Vérification email]", italics: true, size: 22, color: "888888", font: "Times New Roman" })] }),
        space(),

        heading2("4.4.3. Tableau de bord Jeune – JeuneDashboard.jsx"),
        para("Le tableau de bord du jeune offre une vue centralisée sur toutes ses activités : fil d'actualité des publications, accès rapide aux Lives, notifications en temps réel, accès à la messagerie et au profil. L'interface est responsive et adaptée aux appareils mobiles."),
        space(),
        new Paragraph({ alignment: AlignmentType.CENTER, spacing: { before: 120, after: 120 }, children: [new TextRun({ text: "[Figure 18 : Interface – Tableau de bord Jeune]", italics: true, size: 22, color: "888888", font: "Times New Roman" })] }),
        space(),

        heading2("4.4.4. Section Lives"),
        para("La section Lives (Livesection.jsx, LiveViewer.jsx, MeetRoom.jsx) permet aux jeunes de consulter les sessions disponibles, de rejoindre un Live en cours (via room_code ou stream_link), de poser des questions en temps réel et de participer aux enquêtes associées."),
        space(),
        new Paragraph({ alignment: AlignmentType.CENTER, spacing: { before: 120, after: 120 }, children: [new TextRun({ text: "[Figure 19 : Interface – Section Lives et salle de réunion]", italics: true, size: 22, color: "888888", font: "Times New Roman" })] }),
        space(),

        heading2("4.4.5. Publications et Débats"),
        para("Le fil de publications (PublicationFeed.jsx, PublicationCard.jsx) affiche les contenus publiés par les jeunes avec les réactions, commentaires et partages. Pour les débats, les jeunes peuvent visualiser la répartition Pour/Contre et publier des arguments. L'interface de publication (PublierPage.jsx) supporte les types : texte, image, vidéo, PDF et débat."),
        space(),
        new Paragraph({ alignment: AlignmentType.CENTER, spacing: { before: 120, after: 120 }, children: [new TextRun({ text: "[Figure 20 : Interface – Publications et DebateBlock]", italics: true, size: 22, color: "888888", font: "Times New Roman" })] }),
        space(),

        heading2("4.4.6. Messagerie instantanée – Swafy_Meet.jsx"),
        para("La messagerie (Swafy_Meet.jsx, MeetRoom.jsx) offre des conversations privées en temps réel entre utilisateurs ainsi qu'un groupe public. Les fonctionnalités incluent : envoi de messages texte et fichiers, réactions emoji, votes de groupe et partage de médias. La communication s'effectue via Socket.IO."),
        space(),
        new Paragraph({ alignment: AlignmentType.CENTER, spacing: { before: 120, after: 120 }, children: [new TextRun({ text: "[Figure 21 : Interface – Messagerie instantanée SWAFY]", italics: true, size: 22, color: "888888", font: "Times New Roman" })] }),
        space(),

        heading2("4.4.7. Tableau de bord Administrateur – AdminDashboard.jsx"),
        para("Le tableau de bord administrateur offre une vue complète sur l'activité de la plateforme : statistiques de participation, graphiques de répartition géographique, gestion des utilisateurs (ManageUsers.jsx), gestion des Lives (AdminLiveStream.jsx), modération des publications signalées et configuration des paramètres."),
        space(),
        new Paragraph({ alignment: AlignmentType.CENTER, spacing: { before: 120, after: 120 }, children: [new TextRun({ text: "[Figure 22 : Interface – Tableau de bord Administrateur]", italics: true, size: 22, color: "888888", font: "Times New Roman" })] }),
        space(),

        heading2("4.4.8. Gestion des utilisateurs – ManageUsers.jsx"),
        para("L'interface de gestion des utilisateurs permet à l'administrateur de visualiser la liste complète des utilisateurs avec filtres (statut, rôle), de consulter les profils détaillés incluant le gouvernorat, la délégation et le statut académique, de bloquer/débloquer des comptes et de gérer les rôles."),
        space(),
        new Paragraph({ alignment: AlignmentType.CENTER, spacing: { before: 120, after: 120 }, children: [new TextRun({ text: "[Figure 23 : Interface – Gestion des utilisateurs]", italics: true, size: 22, color: "888888", font: "Times New Roman" })] }),
        space(),

        heading2("4.4.9. Statistiques de participation"),
        para("Le module de statistiques offre à l'équipe SWAFY une vision analytique complète : répartition des jeunes par gouvernorat sur une carte de Tunisie, distribution par tranche d'âge et statut académique, évolution des inscriptions, participation aux Lives et aux enquêtes, et activité sur les publications."),
        space(),
        new Paragraph({ alignment: AlignmentType.CENTER, spacing: { before: 120, after: 120 }, children: [new TextRun({ text: "[Figure 24 : Interface – Statistiques de participation]", italics: true, size: 22, color: "888888", font: "Times New Roman" })] }),
        space(),

        heading2("4.4.10. Paramètres – ParametrePage.jsx"),
        para("La page de paramètres (ParametrePage.jsx, Settings.jsx) permet à l'utilisateur de modifier son profil, son mot de passe, ses préférences de notification, la langue de l'interface (FR/AR via LanguageContext.jsx) et de gérer son compte. L'administrateur dispose de paramètres supplémentaires pour la configuration globale de la plateforme."),
        space(),
        new Paragraph({ alignment: AlignmentType.CENTER, spacing: { before: 120, after: 120 }, children: [new TextRun({ text: "[Figure 25 : Interface – Paramètres et profil utilisateur]", italics: true, size: 22, color: "888888", font: "Times New Roman" })] }),
        space(),

        heading1("Conclusion"),
        para("La phase de réalisation a permis de concrétiser l'ensemble des fonctionnalités définies dans les chapitres précédents. La plateforme SWAFY est désormais pleinement opérationnelle et déployée sur des infrastructures cloud fiables. L'architecture technique choisie (Node.js, React.js, MySQL, Socket.IO) garantit performance, sécurité et scalabilité pour accompagner la croissance du projet SWAFY."),
      ]
    },

    // ====== CONCLUSION GÉNÉRALE ======
    {
      properties: { page: { size: { width: 11906, height: 16838 }, margin: { top: 1440, right: 1440, bottom: 1440, left: 1800 } } },
      headers: { default: new Header({ children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: "Plateforme SWAFY – Rapport de PFE", italics: true, size: 20, color: "666666" })] })] }) },
      footers: { default: new Footer({ children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: "Page ", size: 20 }), new TextRun({ children: [PageNumber.CURRENT], size: 20 })] })] }) },
      children: [
        heading1("Conclusion Générale"),
        space(),
        para("Ce projet de fin d'études nous a permis de concevoir et de développer une plateforme web complète et fonctionnelle pour le projet SWAFY, une initiative portée par l'Agence Nationale de la Promotion de la Recherche Scientifique (ANPR) dans le cadre du programme européen EU4Youth Tunisie."),
        space(),
        para("Notre travail a couvert l'intégralité du cycle de développement logiciel : de l'analyse de l'existant et l'identification des besoins, en passant par la modélisation UML rigoureuse, jusqu'à l'implémentation technique et le déploiement sur des infrastructures cloud."),
        space(),
        heading2("Apports et points forts du projet"),
        bullet("Une plateforme centrale et unifiée qui remplace les outils dispersés et non structurés utilisés avant ce projet."),
        bullet("Un système d'authentification sécurisé avec vérification par email et gestion des rôles."),
        bullet("Des fonctionnalités temps réel (messagerie, notifications, participation aux Lives) grâce à Socket.IO."),
        bullet("Un système de publications multimédias riche avec débats Pour/Contre et réactions."),
        bullet("Un tableau de bord analytique offrant une visibilité complète sur la participation des jeunes par gouvernorat, âge et statut."),
        bullet("Une architecture cloud scalable avec Railway (BDD), Vercel (frontend) et Render (backend)."),
        space(),
        heading2("Limites et améliorations possibles"),
        bullet("Intégration d'un système de Live streaming natif (actuellement basé sur des liens externes) avec WebRTC."),
        bullet("Développement d'une application mobile native (React Native) pour améliorer l'accessibilité."),
        bullet("Mise en place d'un moteur de recommandation de contenus basé sur les intérêts des jeunes (IA/Machine Learning)."),
        bullet("Intégration d'un chatbot SWAFY pour guider les nouveaux utilisateurs."),
        bullet("Développement d'un module de gamification pour encourager la participation active."),
        bullet("Amélioration du moteur de recherche avec ElasticSearch pour une recherche full-text."),
        space(),
        para("Ce projet a été une expérience extrêmement enrichissante, tant sur le plan technique que humain. Il nous a permis de mettre en pratique les connaissances acquises durant notre formation à l'ISAAS de Sfax, tout en contribuant concrètement à une initiative nationale au service de la jeunesse tunisienne. Nous sommes fières d'avoir développé un outil qui donnera aux jeunes un espace numérique digne pour exprimer leurs idées scientifiques et participer activement à la construction de l'avenir de la Tunisie."),
      ]
    },

    // ====== BIBLIOGRAPHIE ======
    {
      properties: { page: { size: { width: 11906, height: 16838 }, margin: { top: 1440, right: 1440, bottom: 1440, left: 1800 } } },
      headers: { default: new Header({ children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: "Plateforme SWAFY – Rapport de PFE", italics: true, size: 20, color: "666666" })] })] }) },
      footers: { default: new Footer({ children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: "Page ", size: 20 }), new TextRun({ children: [PageNumber.CURRENT], size: 20 })] })] }) },
      children: [
        heading1("Bibliographie et Webographie"),
        space(),
        heading2("Livres et ouvrages"),
        bullet("Muller P.A. & Gaertner N. (2005). Modélisation objet avec UML. Eyrolles."),
        bullet("Roques P. & Vallée F. (2002). UML 2 en action. Eyrolles."),
        bullet("Morley C., Hugues J., Leblanc B. (2003). UML pour l'analyse d'un système d'information. Dunod."),
        bullet("Flanagan D. (2020). JavaScript: The Definitive Guide, 7th Edition. O'Reilly Media."),
        bullet("Banks A. & Porcello E. (2020). Learning React, 2nd Edition. O'Reilly Media."),
        space(),
        heading2("Documentation technique"),
        bullet("Documentation officielle Node.js : https://nodejs.org/docs/"),
        bullet("Documentation Express.js : https://expressjs.com/"),
        bullet("Documentation React.js : https://react.dev/"),
        bullet("Documentation Socket.IO : https://socket.io/docs/"),
        bullet("Documentation MySQL : https://dev.mysql.com/doc/"),
        bullet("Documentation Cloudinary : https://cloudinary.com/documentation"),
        bullet("Documentation Brevo (Sendinblue) API : https://developers.brevo.com/"),
        bullet("Documentation JWT (jsonwebtoken) : https://jwt.io/"),
        space(),
        heading2("Sites web de référence"),
        bullet("Site officiel ANPR Tunisie : https://www.anpr.tn"),
        bullet("Programme EU4Youth SWAFY : https://eu4youth.tn/explorer/swafy/"),
        bullet("Railway (hébergement cloud) : https://railway.app"),
        bullet("Vercel (déploiement frontend) : https://vercel.com"),
        bullet("Render (hébergement backend) : https://render.com"),
        bullet("GitHub (versionning) : https://github.com"),
      ]
    },
  ]
});

Packer.toBuffer(doc).then(buffer => {
  fs.writeFileSync('/home/claude/rapport_swafy_pfe.docx', buffer);
  console.log('✅ Rapport généré avec succès !');
}).catch(err => {
  console.error('❌ Erreur:', err.message);
  process.exit(1);
});