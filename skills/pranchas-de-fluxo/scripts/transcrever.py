"""Transcribe a local briefing file into timestamped UTF-8 text."""
import argparse
from pathlib import Path
import sys


def timestamp(seconds, precise=False):
    millis = int(round(seconds * 1000))
    hours, remainder = divmod(millis, 3600000)
    minutes, remainder = divmod(remainder, 60000)
    whole, fraction = divmod(remainder, 1000)
    suffix = f".{fraction:03}" if precise else ""
    return f"{hours:02}:{minutes:02}:{whole:02}{suffix}"


def get_model(name, offline):
    from faster_whisper import WhisperModel
    return WhisperModel(name, device="cpu", compute_type="int8", local_files_only=offline)


def recognize(model, audio, language):
    segments, info = model.transcribe(str(audio), language=None if language == "auto" else language, vad_filter=True)
    lines = []
    for segment in segments:
        text = segment.text.strip()
        if text:
            uncertain = " [conferir fala]" if segment.avg_logprob < -0.75 else ""
            lines.append(f"[{timestamp(segment.start)}–{timestamp(segment.end)}] {text}{uncertain}")
    return lines, info


def transcribe(audio, output, model_name, offline):
    if not audio.is_file():
        raise ValueError(f"Áudio não encontrado: {audio}")
    if output.exists():
        raise ValueError(f"A saída já existe: {output}")
    lines, info = recognize(get_model(model_name, offline), audio, "pt")
    if not lines:
        raise ValueError("Nenhuma fala foi reconhecida no áudio.")
    with output.open("x", encoding="utf-8") as file:
        file.write("\n".join(lines) + "\n")
    return info.duration, len(lines)


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("audio", type=Path)
    parser.add_argument("output", type=Path)
    parser.add_argument("--model", default="small")
    parser.add_argument("--offline", action="store_true")
    args = parser.parse_args()
    try:
        duration, count = transcribe(args.audio, args.output, args.model, args.offline)
    except (ImportError, OSError, RuntimeError, ValueError) as error:
        parser.exit(1, f"Falha na transcrição: {error}\n")
    sys.stdout.write(f"{count} trechos, {timestamp(duration)} de áudio.\n")


if __name__ == "__main__":
    main()
