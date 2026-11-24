"""Extração local de evidências com origem e localização preservadas."""
import json
import sys
from html.parser import HTMLParser
from pathlib import Path
from xml.etree import ElementTree as ET
from zipfile import ZipFile

from transcrever import get_model, recognize, timestamp


def linked(directory, name, label):
    return f"[{label}]({directory.name}/{name})"


def paragraphs(root, odt):
    tags = {"p", "h"} if odt else {"p"}
    for node in root.iter():
        if node.tag.rsplit("}", 1)[-1] not in tags:
            continue
        if odt:
            text = "".join(node.itertext())
        else:
            parts = []
            for child in node.iter():
                tag = child.tag.rsplit("}", 1)[-1]
                if tag == "t":
                    parts.append(child.text or "")
                elif tag in {"tab", "br", "cr"}:
                    parts.append(" ")
            text = "".join(parts)
        if text.strip():
            yield text.strip()


def office(entry, directory):
    odt = entry["ext"] == "odt"
    lines = []
    with ZipFile(entry["file"]) as archive:
        if odt:
            parts = ["content.xml"]
        else:
            parts = ["word/document.xml"] + sorted(
                name for name in archive.namelist() if name.startswith(("word/header", "word/footer", "word/footnotes", "word/endnotes")) and name.endswith(".xml")
            )
        for part in parts:
            xml = ET.fromstring(archive.read(part))
            lines.extend(f"{part} §{i} | {text}" for i, text in enumerate(paragraphs(xml, odt), 1))
        prefix = "Pictures/" if odt else "word/media/"
        media = [name for name in archive.namelist() if name.startswith(prefix) and not name.endswith("/")]
        for i, name in enumerate(media, 1):
            ext = Path(name).suffix.lower()
            if ext not in {".png", ".jpg", ".jpeg", ".gif", ".webp"}:
                lines.append(f"Objeto incorporado {name} no original. Formato sem prévia.")
                continue
            dest = f"{entry['id']}-fig{i:03}{ext}"
            (directory / dest).write_bytes(archive.read(name))
            lines.append(linked(directory, dest, f"Figura {i} · {Path(name).name}"))
    return lines


class VisibleText(HTMLParser):
    def __init__(self):
        super().__init__(convert_charrefs=True)
        self.words = []
        self.skip = 0

    def handle_starttag(self, tag, attrs):
        if tag in {"style", "script", "template"}:
            self.skip += 1
        if tag in {"br", "p", "div", "li", "tr", "th", "td", "section", "h1", "h2", "h3", "h4"}:
            self.words.append("\n")

    def handle_endtag(self, tag):
        if tag in {"style", "script", "template"}:
            self.skip = max(0, self.skip - 1)

    def handle_data(self, data):
        if not self.skip:
            self.words.append(data)


def rich_text(entry, directory):
    if entry["ext"] in {"docx", "odt"}:
        return office(entry, directory)
    data = Path(entry["file"]).read_bytes()
    if data.startswith((b"\xff\xfe", b"\xfe\xff")):
        text = data.decode("utf-16")
    else:
        try:
            text = data.decode("utf-8-sig")
        except UnicodeDecodeError:
            text = data.decode("cp1252")
    if entry["ext"] == "rtf":
        from striprtf.striprtf import rtf_to_text
        text = rtf_to_text(text)
    else:
        parser = VisibleText()
        parser.feed(text)
        text = "".join(parser.words)
    return [f"{i} | {line.strip()}" for i, line in enumerate(text.splitlines(), 1) if line.strip()]


def pdf_pages(entry, directory):
    import pypdfium2 as pdfium
    doc = pdfium.PdfDocument(entry["file"])
    lines = []
    try:
        for index in range(len(doc)):
            page = doc[index]
            text_page = page.get_textpage()
            text = text_page.get_text_bounded().strip()
            text_page.close()
            scale = min(1.9, 2200 / max(page.get_size()))
            bitmap = page.render(scale=scale)
            name = f"{entry['id']}-p{index + 1:04}.png"
            bitmap.to_pil().save(directory / name)
            lines.append(linked(directory, name, f"Página {index + 1}"))
            lines.append(text or "Página sem texto selecionável. Inspecionar a imagem.")
            bitmap.close()
            page.close()
    finally:
        doc.close()
    return lines


def frame_seconds(frame, index, stream):
    if frame.time is not None:
        return max(0, float(frame.time))
    return index / float(stream.average_rate or 25)


def save_frame(image, entry, directory, position, index):
    image.thumbnail((1600, 1600))
    name = f"{entry['id']}-v{index:05}.jpg"
    image.save(directory / name, quality=90)
    return linked(directory, name, f"Quadro em {timestamp(position, precise=True)}")


def video_frames(container, stream, entry, directory, interval):
    from PIL import ImageChops, ImageStat
    interval = float(interval)
    sample = min(1.0, interval)
    previous = None
    lines = []
    last_time = last_probe = float("-inf")
    last_frame = None
    for i, frame in enumerate(container.decode(stream)):
        t = frame_seconds(frame, i, stream)
        last_frame = (frame, t)
        if t < last_probe + sample - 0.00001:
            continue
        last_probe = t
        preview = frame.to_image(width=48, height=32).convert("L")
        changed = previous is None or ImageStat.Stat(ImageChops.difference(previous, preview)).mean[0] >= 16
        if changed or t >= last_time + interval - 0.00001:
            lines.append(save_frame(frame.to_image(), entry, directory, t, len(lines) + 1))
            previous, last_time = preview, t
    if last_frame and last_frame[1] > last_time + 0.05:
        frame, t = last_frame
        lines.append(save_frame(frame.to_image(), entry, directory, t, len(lines) + 1))
    return lines


def media(entry, directory, options, models):
    import av
    lines = []
    with av.open(entry["file"]) as container:
        cover = av.stream.Disposition.attached_pic
        visual = next((s for s in container.streams.video if not (s.disposition & cover)), None)
        has_audio = bool(container.streams.audio)
        if visual is not None:
            frames = video_frames(container, visual, entry, directory, options["frames_every"])
            if not frames:
                raise ValueError("Trilha de vídeo sem quadros decodificáveis.")
            lines.extend(["### Quadros para leitura visual", *frames])
    if has_audio:
        if not models:
            models.append(get_model(options["model"], options["offline"]))
        speech, info = recognize(models[0], entry["file"], options["language"])
        if not speech and not lines:
            raise ValueError("Nenhuma fala reconhecida no áudio.")
        lines.extend([f"### Fala · idioma {info.language}", *(speech or ["Sem fala reconhecida."])])
    elif lines:
        lines.append("Vídeo sem trilha de áudio.")
    return lines


def main():
    job = Path(sys.argv[1])
    options = json.loads(job.read_text(encoding="utf-8"))
    directory = job.parent
    models = []
    for entry in options["entries"]:
        try:
            if entry["kind"] == "rich":
                lines = rich_text(entry, directory)
            elif entry["kind"] == "pdf":
                lines = pdf_pages(entry, directory)
            else:
                lines = media(entry, directory, options, models)
            if not lines:
                raise ValueError("Nenhum conteúdo legível encontrado.")
            (directory / (entry["id"] + ".md")).write_text("\n\n".join(lines), encoding="utf-8")
        except Exception as error:
            sys.exit(f"{entry['name']}: {error}")


if __name__ == "__main__":
    main()
