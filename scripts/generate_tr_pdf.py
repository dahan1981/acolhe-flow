from pathlib import Path

from reportlab.lib import colors
from reportlab.lib.enums import TA_CENTER, TA_JUSTIFY
from reportlab.lib.pagesizes import A4
from reportlab.lib.styles import ParagraphStyle, getSampleStyleSheet
from reportlab.lib.units import mm
from reportlab.platypus import (
    ListFlowable,
    ListItem,
    PageBreak,
    Paragraph,
    SimpleDocTemplate,
    Spacer,
    Table,
    TableStyle,
)


ROOT = Path(__file__).resolve().parents[1]
OUTPUT_DIR = ROOT / "output" / "pdf"
OUTPUT_FILE = OUTPUT_DIR / "termo_referencia_athena_municipal.pdf"


def build_styles():
    styles = getSampleStyleSheet()
    styles.add(
        ParagraphStyle(
            name="CoverTitle",
            parent=styles["Title"],
            fontName="Helvetica-Bold",
            fontSize=20,
            leading=26,
            alignment=TA_CENTER,
            textColor=colors.HexColor("#23395B"),
            spaceAfter=10,
        )
    )
    styles.add(
        ParagraphStyle(
            name="CoverSubtitle",
            parent=styles["Normal"],
            fontName="Helvetica",
            fontSize=10.5,
            leading=15,
            alignment=TA_CENTER,
            textColor=colors.HexColor("#4B5563"),
        )
    )
    styles.add(
        ParagraphStyle(
            name="SectionTitle",
            parent=styles["Heading1"],
            fontName="Helvetica-Bold",
            fontSize=13.5,
            leading=17,
            textColor=colors.HexColor("#1F3A5F"),
            spaceBefore=10,
            spaceAfter=8,
        )
    )
    styles.add(
        ParagraphStyle(
            name="BodyJustify",
            parent=styles["BodyText"],
            fontName="Helvetica",
            fontSize=10,
            leading=15,
            alignment=TA_JUSTIFY,
            textColor=colors.HexColor("#1F2937"),
            spaceAfter=6,
        )
    )
    styles.add(
        ParagraphStyle(
            name="SmallNote",
            parent=styles["BodyText"],
            fontName="Helvetica-Oblique",
            fontSize=8.5,
            leading=12,
            textColor=colors.HexColor("#6B7280"),
            alignment=TA_JUSTIFY,
        )
    )
    return styles


def bullet_list(items, style):
    flow = []
    for item in items:
        flow.append(ListItem(Paragraph(item, style), leftIndent=8))
    return ListFlowable(flow, bulletType="bullet", start="circle", bulletFontName="Helvetica")


def add_page_number(canvas, doc):
    canvas.saveState()
    canvas.setFont("Helvetica", 8)
    canvas.setFillColor(colors.HexColor("#6B7280"))
    canvas.drawRightString(195 * mm, 12 * mm, f"Página {doc.page}")
    canvas.restoreState()


def build_pdf():
    OUTPUT_DIR.mkdir(parents=True, exist_ok=True)
    styles = build_styles()
    story = []

    story.append(Spacer(1, 28 * mm))
    story.append(Paragraph("Minuta de Termo de Referência", styles["CoverTitle"]))
    story.append(Paragraph("Contratação de solução tecnológica municipal para acolhimento unificado à mulher", styles["CoverTitle"]))
    story.append(Spacer(1, 8 * mm))
    story.append(
        Paragraph(
            "Documento preliminar estruturado com base na Lei Federal nº 14.133/2021, "
            "adaptado ao contexto do sistema Athena, plataforma web para acolhimento, "
            "triagem, acompanhamento de casos, encaminhamentos, atendimento protegido por chat "
            "e monitoramento gerencial em rede municipal.",
            styles["CoverSubtitle"],
        )
    )
    story.append(Spacer(1, 10 * mm))
    story.append(
        Table(
            [
                ["Solução", "Athena - Plataforma de acolhimento unificado à mulher"],
                ["Modelo sugerido", "Licenciamento/cessão de uso em nuvem, com implantação, suporte e manutenção"],
                ["Natureza", "Serviço continuado com suporte técnico, evolução legal e operação assistida"],
            ],
            colWidths=[40 * mm, 130 * mm],
            style=TableStyle(
                [
                    ("BACKGROUND", (0, 0), (-1, -1), colors.HexColor("#F7FAFC")),
                    ("TEXTCOLOR", (0, 0), (-1, -1), colors.HexColor("#1F2937")),
                    ("FONTNAME", (0, 0), (0, -1), "Helvetica-Bold"),
                    ("FONTNAME", (1, 0), (1, -1), "Helvetica"),
                    ("FONTSIZE", (0, 0), (-1, -1), 9.5),
                    ("LEADING", (0, 0), (-1, -1), 13),
                    ("BOX", (0, 0), (-1, -1), 0.7, colors.HexColor("#CBD5E1")),
                    ("INNERGRID", (0, 0), (-1, -1), 0.5, colors.HexColor("#CBD5E1")),
                    ("VALIGN", (0, 0), (-1, -1), "TOP"),
                    ("LEFTPADDING", (0, 0), (-1, -1), 8),
                    ("RIGHTPADDING", (0, 0), (-1, -1), 8),
                    ("TOPPADDING", (0, 0), (-1, -1), 7),
                    ("BOTTOMPADDING", (0, 0), (-1, -1), 7),
                ]
            ),
        )
    )
    story.append(Spacer(1, 8 * mm))
    story.append(
        Paragraph(
            "Observação: os prazos, quantitativos, volumes de usuários e valores estimados "
            "devem ser ajustados pela Administração conforme estudo técnico preliminar, "
            "levantamento de mercado e dimensionamento do ambiente municipal.",
            styles["SmallNote"],
        )
    )
    story.append(PageBreak())

    sections = [
        (
            "1. Definição do Objeto",
            [
                "Contratação de empresa especializada para licenciamento, implantação, parametrização, treinamento, suporte técnico, manutenção corretiva, adaptativa e evolutiva de sistema informatizado, em plataforma web/cloud, destinado ao acolhimento unificado à mulher no âmbito municipal.",
                "A solução deverá contemplar, no mínimo, os módulos de cadastro protegido da mulher usuária, abertura e gestão de casos, linha do tempo única do caso, registros de atendimento, encaminhamentos intersetoriais, atendimento protegido por chat, notificações operacionais, gestão de perfis internos e painel gerencial.",
                "Também integram o objeto a migração de dados eventualmente existentes, disponibilização de ambiente em nuvem, atualização legal e funcional, monitoramento de disponibilidade e fornecimento de documentação operacional.",
                "Natureza do objeto: serviço continuado, de caráter estratégico e essencial à operação assistencial, administrativa e gerencial da rede municipal.",
            ],
        ),
        (
            "2. Justificativa da Contratação",
            [
                "A contratação se justifica pela necessidade de modernizar o fluxo municipal de acolhimento e acompanhamento de mulheres em situação de vulnerabilidade e violência, reduzindo registros dispersos, retrabalho operacional e perda de rastreabilidade entre órgãos da rede.",
                "A plataforma proposta permite centralizar abertura de solicitações, triagem, atendimentos, encaminhamentos e acompanhamento do caso em ambiente único, com leitura segmentada por perfil de acesso e preservação de dados sensíveis.",
                "Há ganho institucional em segurança da informação, padronização de registros, continuidade do atendimento, redução de tempo de resposta, produção de indicadores gerenciais e maior governança sobre acessos internos.",
                "A solução é aderente ao interesse público por apoiar a eficiência administrativa, a proteção de dados pessoais, a transparência interna do fluxo e a tomada de decisão baseada em evidências operacionais.",
            ],
        ),
        (
            "3. Especificações Técnicas",
            [
                "<b>Funcionalidades mínimas:</b> cadastro público da mulher usuária com autenticação segura; gestão de casos e protocolos; histórico cronológico único; registros de atendimentos; encaminhamentos; painel da mulher; filas operacionais da equipe; chat protegido; notificações; administração de contas internas; dashboards e relatórios gerenciais.",
                "<b>Segurança da informação:</b> aderência à LGPD; controle de acesso por perfil; autenticação segura; criptografia em trânsito; trilha de auditoria; registro de eventos relevantes; backups automáticos; mecanismos de recuperação; segregação entre perfis mulher, profissional e gestora; proteção de dados sensíveis exibidos em tela.",
                "<b>Plataforma:</b> solução 100% web, acessível por navegador moderno, sem dependência de instalação local no posto de trabalho, compatível com Windows, Linux, Android e outros sistemas operacionais que utilizem navegador atualizado.",
                "<b>Interoperabilidade:</b> disponibilização de APIs ou meios técnicos compatíveis para integração com sistemas legados, bases institucionais, ferramentas de autenticação, serviços de mensageria e demais soluções utilizadas pela Administração.",
                "<b>Operação em nuvem:</b> hospedagem em ambiente cloud com escalabilidade, monitoramento, logs, contingência e atualização controlada.",
            ],
        ),
        (
            "4. Modelo de Execução",
            [
                "A execução contratual deverá observar, no mínimo, as seguintes fases: levantamento de requisitos, parametrização/customização, configuração de perfis e regras, migração ou carga inicial de dados, treinamento, homologação assistida e entrada em produção.",
                "Como referência inicial, recomenda-se o seguinte cronograma: até 20 dias para levantamento e validação de requisitos; até 30 dias para implantação e parametrização; até 15 dias para migração/carga assistida; até 10 dias para treinamento e homologação; total estimado de até 75 dias corridos para entrada em produção, sem prejuízo de ajuste conforme porte do município.",
                "A contratada deverá apresentar plano de implantação, matriz de responsabilidades, cronograma físico, plano de testes e plano de transição para operação assistida.",
            ],
        ),
        (
            "5. Obrigações da Contratada",
            [
                "Disponibilizar ambiente de produção e, preferencialmente, ambiente de homologação, com suporte técnico por canais formais como portal, e-mail e telefone.",
                "Fornecer treinamento inicial para equipes gestoras e operacionais, bem como material de apoio e documentação funcional.",
                "Executar manutenção corretiva, legal e adaptativa, incluindo ajustes necessários ao regular funcionamento do sistema e ao atendimento de mudanças normativas relacionadas ao serviço.",
                "Garantir integridade, confidencialidade, rastreabilidade e disponibilidade dos dados tratados, incluindo backups, rotinas de restauração e mecanismos de contingência.",
                "Manter equipe técnica habilitada para sustentação da solução durante toda a vigência contratual.",
            ],
        ),
        (
            "6. Níveis de Serviço (SLA)",
            [
                "A solução deverá assegurar disponibilidade mínima mensal de 99,5%, admitidas janelas programadas de manutenção previamente comunicadas à Administração.",
                "Incidentes críticos que impeçam autenticação, abertura de casos, acesso ao painel, registro de atendimento ou funcionamento do chat protegido deverão ter resposta inicial em até 2 horas e solução ou plano de contorno prioritário.",
                "Incidentes médios deverão ter resposta em até 8 horas úteis.",
                "Incidentes leves, dúvidas operacionais ou ajustes não críticos deverão ter resposta em até 24 horas úteis.",
                "O descumprimento reiterado do SLA deverá ensejar registro formal, possibilidade de glosa contratual conforme edital e aplicação das sanções previstas contratualmente.",
            ],
        ),
        (
            "7. Recebimento e Aceitação",
            [
                "O recebimento provisório ocorrerá após a disponibilização do sistema, instalação lógica/configuração do ambiente e conclusão dos testes iniciais pela contratada.",
                "O recebimento definitivo ocorrerá após homologação pela equipe designada pela Administração, verificação de conformidade técnica, funcional e de segurança, correção de pendências críticas e assinatura do termo de aceite.",
                "Sugere-se prazo de até 15 dias úteis para a etapa de homologação e aceite definitivo, contado do recebimento provisório, podendo haver suspensão do prazo em caso de inconsistências relevantes a serem saneadas pela contratada.",
            ],
        ),
        (
            "8. Valor e Pagamento",
            [
                "A formação de preços deverá discriminar, separadamente, os valores de implantação, migração/carga inicial, treinamento, licenciamento/cessão de uso mensal, suporte técnico e manutenção.",
                "O pagamento da implantação poderá ocorrer por etapas efetivamente concluídas e atestadas, conforme cronograma físico-financeiro definido no edital.",
                "O pagamento mensal da sustentação deverá estar condicionado à prestação do serviço, à comprovação do atendimento dos níveis mínimos de serviço e ao atesto do gestor/fiscal do contrato.",
                "A Administração deverá estimar o valor da contratação com base em pesquisa de mercado, benchmarking com soluções similares de gestão pública e dimensionamento de usuários, órgãos, volume de casos e necessidade de suporte.",
            ],
        ),
    ]

    for title, paragraphs in sections:
        story.append(Paragraph(title, styles["SectionTitle"]))
        for text in paragraphs:
            story.append(Paragraph(text, styles["BodyJustify"]))
        story.append(Spacer(1, 3 * mm))

    story.append(Paragraph("Quadro sintético de implantação e SLA", styles["SectionTitle"]))
    story.append(
        Table(
            [
                ["Item", "Parâmetro sugerido"],
                ["Implantação", "Até 75 dias corridos, com fases formais de levantamento, implantação, migração, treinamento e homologação"],
                ["Disponibilidade mensal", "Mínimo de 99,5%"],
                ["Incidente crítico", "Resposta em até 2 horas"],
                ["Incidente médio", "Resposta em até 8 horas úteis"],
                ["Incidente leve", "Resposta em até 24 horas úteis"],
                ["Recebimento definitivo", "Até 15 dias úteis após recebimento provisório e homologação"],
            ],
            colWidths=[52 * mm, 118 * mm],
            style=TableStyle(
                [
                    ("BACKGROUND", (0, 0), (-1, 0), colors.HexColor("#EAF2F8")),
                    ("TEXTCOLOR", (0, 0), (-1, -1), colors.HexColor("#1F2937")),
                    ("FONTNAME", (0, 0), (-1, 0), "Helvetica-Bold"),
                    ("FONTNAME", (0, 1), (-1, -1), "Helvetica"),
                    ("FONTSIZE", (0, 0), (-1, -1), 9.2),
                    ("LEADING", (0, 0), (-1, -1), 13),
                    ("BOX", (0, 0), (-1, -1), 0.7, colors.HexColor("#CBD5E1")),
                    ("INNERGRID", (0, 0), (-1, -1), 0.5, colors.HexColor("#CBD5E1")),
                    ("VALIGN", (0, 0), (-1, -1), "TOP"),
                    ("LEFTPADDING", (0, 0), (-1, -1), 8),
                    ("RIGHTPADDING", (0, 0), (-1, -1), 8),
                    ("TOPPADDING", (0, 0), (-1, -1), 7),
                    ("BOTTOMPADDING", (0, 0), (-1, -1), 7),
                ]
            ),
        )
    )
    story.append(Spacer(1, 5 * mm))
    story.append(
        Paragraph(
            "Recomendações complementares para o edital e o TR final:",
            styles["BodyJustify"],
        )
    )
    story.append(
        bullet_list(
            [
                "prever prova de conceito quando tecnicamente justificável;",
                "exigir comprovação de suporte à LGPD e rotinas de backup/restauração;",
                "detalhar critérios de medição e glosa vinculados ao SLA;",
                "disciplinar propriedade, portabilidade e devolução dos dados ao término contratual;",
                "indicar responsabilidades do fiscal do contrato e da equipe de homologação municipal.",
            ],
            styles["BodyJustify"],
        )
    )

    doc = SimpleDocTemplate(
        str(OUTPUT_FILE),
        pagesize=A4,
        leftMargin=20 * mm,
        rightMargin=20 * mm,
        topMargin=18 * mm,
        bottomMargin=18 * mm,
        title="Minuta de Termo de Referência - Athena",
        author="OpenAI Codex",
    )
    doc.build(story, onFirstPage=add_page_number, onLaterPages=add_page_number)


if __name__ == "__main__":
    build_pdf()
    print(OUTPUT_FILE)
